export const manifest = {
  id: 'speech-lab',
  name: 'Speech Lab',
  version: '1.0.0',
  category: 'media',
  description: 'Text-to-Speech (voices, rate/pitch/volume) + Speech Recognition (transcript, interim) — capability-aware.',
  dependencies: [],
  permissions: ['microphone'],
  lazy: true,
  icon: '🎤',
};

let els = {};
let ctxRef = null;
let voices = [];
let recognition = null;
let listening = false;

const STORAGE_KEY = 'web-universe:speech-lab';

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function saveState(extra={}) {
  try {
    const data = {
      voiceURI: els.voice?.value || '',
      rate: els.rate?.value || '1',
      pitch: els.pitch?.value || '1',
      volume: els.volume?.value || '1',
      lang: els.lang?.value || 'vi-VN',
      text: els.text?.value || '',
      ...extra,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function hasTTS() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
function getSTT() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function renderTTS() {
  if (!hasTTS()) {
    els.tts.innerHTML = '<span class="badge">✗ SpeechSynthesis not supported</span>';
    return;
  }
  voices = speechSynthesis.getVoices();
  const saved = loadState();
  const current = saved.voiceURI || '';
  els.voice.innerHTML = voices.length
    ? voices.map(v => `<option value="${escapeHtml(v.voiceURI)}" ${v.voiceURI === current ? 'selected' : ''}>${escapeHtml(`${v.name} (${v.lang})`)}</option>`).join('')
    : '<option value="">— không có voice nào —</option>';
  els.ttsCount.textContent = `${voices.length} voices`;
  els.ttsHint.textContent = voices.length
    ? (voices.some(v => v.lang.startsWith('vi')) ? '✓ Có voice tiếng Việt' : '○ Chưa thấy voice tiếng Việt — phụ thuộc OS/browser')
    : 'Một số trình duyệt nạp voices async — bấm Refresh';
}

function speak() {
  if (!hasTTS()) return;
  const text = els.text.value.trim();
  if (!text) { els.ttsStatus.textContent = '○ Nhập text trước đã'; return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = voices.find(v => v.voiceURI === els.voice.value);
  if (voice) u.voice = voice;
  u.rate = Number(els.rate.value);
  u.pitch = Number(els.pitch.value);
  u.volume = Number(els.volume.value);
  u.onstart = () => { els.ttsStatus.textContent = '● Đang nói…'; };
  u.onend = () => { els.ttsStatus.textContent = '○ Xong'; };
  u.onerror = (e) => { els.ttsStatus.textContent = `✗ Lỗi: ${escapeHtml(e.error || 'unknown')}`; };
  speechSynthesis.speak(u);
  ctxRef?.logger?.info('speech: speak', { len: text.length });
}

function renderSTT() {
  const SR = getSTT();
  if (!SR) {
    els.sttStatus.innerHTML = '<span class="badge">✗ SpeechRecognition not supported</span><div class="muted small" style="margin-top:4px">Chrome/Edge có webkitSpeechRecognition — Firefox/ Safari tùy phiên bản</div>';
    els.btnListen.disabled = true;
    return;
  }
  els.sttStatus.innerHTML = '<span class="badge badge-ok">✓ SpeechRecognition available</span>';
  els.btnListen.disabled = false;
}

function toggleListen() {
  const SR = getSTT();
  if (!SR) return;
  if (listening) { recognition.stop(); return; }
  recognition = new SR();
  recognition.lang = els.lang.value || 'vi-VN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => {
    listening = true;
    els.btnListen.textContent = '⏹ Stop Listening';
    els.sttStatus.innerHTML = '<span class="badge" style="color:var(--warning)">● Đang nghe…</span>';
  };
  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        const li = document.createElement('div');
        li.textContent = r[0].transcript;
        els.transcript.appendChild(li);
        els.transcript.scrollTop = els.transcript.scrollHeight;
      } else {
        interim += r[0].transcript;
      }
    }
    els.sttInterim.textContent = interim ? `… ${interim}` : '';
  };
  recognition.onerror = (e) => {
    els.sttStatus.innerHTML = `<span class="badge" style="color:var(--danger)">✗ ${escapeHtml(e.error)}</span>`;
    if (e.error === 'not-allowed') ctxRef?.logger?.warn('speech: mic permission denied');
  };
  recognition.onend = () => {
    listening = false;
    els.btnListen.textContent = '🎙 Start Listening';
    els.sttInterim.textContent = '';
    if (els.sttStatus.textContent.includes('Đang nghe')) els.sttStatus.innerHTML = '<span class="badge badge-ok">○ Đã dừng</span>';
  };
  recognition.start();
  ctxRef?.logger?.info('speech: recognition start', { lang: recognition.lang });
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  const saved = loadState();
  container.innerHTML = `
    <div class="module-toolbar">
      <h3 style="margin:0;font:700 16px var(--font-sans)">🎤 Speech Lab</h3>
      <span class="muted small">Text-to-Speech + Speech Recognition — API thật của trình duyệt</span>
    </div>
    <div class="speech-grid">
      <div class="module-card">
        <h4 style="margin:0 0 8px;font:700 13px var(--font-sans)">🔊 Text-to-Speech <span class="muted small" id="spTtsCount"></span></h4>
        <div id="spTtsStatus" class="small" style="margin-bottom:8px">Checking…</div>
        <div class="speech-row"><label for="spVoice">Voice</label><select id="spVoice" class="speech-select"></select><button class="btn btn-ghost btn-xs" id="spVoiceRefresh" aria-label="Nạp lại danh sách voices">↻</button></div>
        <div class="speech-row"><label for="spRate">Rate <b id="spRateVal">1</b></label><input type="range" id="spRate" min="0.5" max="2" step="0.1" value="${escapeHtml(saved.rate || '1')}" /></div>
        <div class="speech-row"><label for="spPitch">Pitch <b id="spPitchVal">1</b></label><input type="range" id="spPitch" min="0" max="2" step="0.1" value="${escapeHtml(saved.pitch || '1')}" /></div>
        <div class="speech-row"><label for="spVolume">Volume <b id="spVolumeVal">1</b></label><input type="range" id="spVolume" min="0" max="1" step="0.1" value="${escapeHtml(saved.volume || '1')}" /></div>
        <textarea id="spText" rows="3" class="speech-textarea" placeholder="Nhập text để đọc…">${escapeHtml(saved.text || 'Xin chào, mình là WEB UNIVERSE!')}</textarea>
        <div class="module-toolbar" style="margin-top:8px;margin-bottom:0">
          <button class="btn btn-primary btn-sm" id="spSpeak">▶ Speak</button>
          <button class="btn btn-ghost btn-sm" id="spPause">⏸ Pause</button>
          <button class="btn btn-ghost btn-sm" id="spResume">⏵ Resume</button>
          <button class="btn btn-ghost btn-sm" id="spCancel">⏹ Cancel</button>
          <span class="muted small" id="spTtsHint" style="margin-left:auto"></span>
        </div>
      </div>
      <div class="module-card">
        <h4 style="margin:0 0 8px;font:700 13px var(--font-sans)">🎙 Speech Recognition</h4>
        <div id="spSttStatus" class="small" style="margin-bottom:8px">Checking…</div>
        <div class="speech-row"><label for="spLang">Ngôn ngữ</label>
          <select id="spLang" class="speech-select">
            <option value="vi-VN" ${saved.lang === 'vi-VN' ? 'selected' : ''}>Tiếng Việt (vi-VN)</option>
            <option value="en-US" ${saved.lang === 'en-US' ? 'selected' : ''}>English (en-US)</option>
            <option value="en-GB" ${saved.lang === 'en-GB' ? 'selected' : ''}>English (en-GB)</option>
            <option value="ja-JP" ${saved.lang === 'ja-JP' ? 'selected' : ''}>日本語 (ja-JP)</option>
          </select>
          <button class="btn btn-primary btn-sm" id="spListen">🎙 Start Listening</button>
        </div>
        <div id="spSttInterim" class="muted small" style="min-height:16px;font-style:italic"></div>
        <div id="spTranscript" class="speech-transcript" aria-live="polite" aria-label="Transcript nhận diện giọng nói"></div>
        <div class="module-toolbar" style="margin-top:8px;margin-bottom:0">
          <button class="btn btn-ghost btn-xs" id="spTranscriptCopy">Copy</button>
          <button class="btn btn-ghost btn-xs" id="spTranscriptClear">Clear</button>
        </div>
      </div>
    </div>
  `;

  els = {
    tts: container.querySelector('#spTtsStatus'),
    ttsCount: container.querySelector('#spTtsCount'),
    ttsHint: container.querySelector('#spTtsHint'),
    voice: container.querySelector('#spVoice'),
    rate: container.querySelector('#spRate'),
    pitch: container.querySelector('#spPitch'),
    volume: container.querySelector('#spVolume'),
    text: container.querySelector('#spText'),
    sttStatus: container.querySelector('#spSttStatus'),
    sttInterim: container.querySelector('#spSttInterim'),
    transcript: container.querySelector('#spTranscript'),
    lang: container.querySelector('#spLang'),
    btnListen: container.querySelector('#spListen'),
  };

  // TTS
  renderTTS();
  speechSynthesis?.addEventListener?.('voiceschanged', renderTTS);
  container.querySelector('#spVoiceRefresh').addEventListener('click', renderTTS);
  container.querySelector('#spSpeak').addEventListener('click', speak);
  container.querySelector('#spPause').addEventListener('click', () => { speechSynthesis.pause(); els.ttsStatus.textContent = '⏸ Paused'; });
  container.querySelector('#spResume').addEventListener('click', () => { speechSynthesis.resume(); els.ttsStatus.textContent = '● Đang nói…'; });
  container.querySelector('#spCancel').addEventListener('click', () => { speechSynthesis.cancel(); els.ttsStatus.textContent = '○ Cancelled'; });
  for (const [input, out] of [[els.rate, '#spRateVal'], [els.pitch, '#spPitchVal'], [els.volume, '#spVolumeVal']]) {
    input.addEventListener('input', () => { container.querySelector(out).textContent = input.value; saveState(); });
  }
  els.voice.addEventListener('change', () => saveState());
  els.text.addEventListener('change', () => saveState());

  // STT
  renderSTT();
  els.btnListen.addEventListener('click', toggleListen);
  container.querySelector('#spTranscriptCopy').addEventListener('click', async () => {
    const text = els.transcript.textContent.trim();
    if (!text) return;
    try { await navigator.clipboard.writeText(text); ctxRef?.logger?.info('speech: transcript copied'); } catch {}
  });
  container.querySelector('#spTranscriptClear').addEventListener('click', () => { els.transcript.innerHTML = ''; els.sttInterim.textContent = ''; });
  els.lang.addEventListener('change', () => saveState());

  ctxRef?.logger?.info('speech-lab: mounted');
}

export async function pause() {
  // Auto-sleep: dừng mọi thứ đang chạy để không tốn CPU khi tab ẩn
  try { speechSynthesis?.cancel(); } catch {}
  if (listening && recognition) { try { recognition.stop(); } catch {} }
}
export async function resume() {}
export async function unmount() {
  try { speechSynthesis?.cancel(); } catch {}
  if (recognition) { try { recognition.stop(); } catch {} }
  recognition = null;
  listening = false;
  speechSynthesis?.removeEventListener?.('voiceschanged', renderTTS);
  els = {};
  ctxRef = null;
}
export async function destroy() { await unmount(); }
