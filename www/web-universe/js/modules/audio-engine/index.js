export const manifest = {
  id: 'audio-engine',
  name: 'Audio Engine',
  version: '1.0.0',
  category: 'media',
  description: 'Web Audio — oscillator, filter, analyser, synth, drum machine.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🎹',
};

let els = {};
let ctxRef = null;
let audioCtx = null;
let masterGain = null;
let filterNode = null;
let analyser = null;
let osc = null;
let rafId = null;
let activeOscs = new Map(); // note -> osc

function hasWebAudio() {
  return !!(window.AudioContext || window.webkitAudioContext);
}
function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 20000;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    masterGain.connect(filterNode);
    filterNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  if (audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function noteFreq(note) {
  // A4 = 440, note is semitones from A4
  return 440 * Math.pow(2, note / 12);
}

function playOsc(type, freq, duration=0.5) {
  ensureCtx();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0.3;
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  o.connect(g);
  g.connect(masterGain);
  o.start();
  o.stop(audioCtx.currentTime + duration);
  return o;
}

function playDrum(type) {
  ensureCtx();
  if (type==='kick') {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.setValueAtTime(150, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    g.gain.setValueAtTime(1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(audioCtx.currentTime + 0.5);
  } else if (type==='snare') {
    // Noise + osc
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1000;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    noise.connect(filter); filter.connect(g); g.connect(masterGain);
    noise.start();
    // Tone
    const o = audioCtx.createOscillator();
    o.frequency.value = 180;
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.5, audioCtx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    o.connect(g2); g2.connect(masterGain);
    o.start(); o.stop(audioCtx.currentTime + 0.1);
  } else if (type==='hihat') {
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 7000;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    noise.connect(filter); filter.connect(g); g.connect(masterGain);
    noise.start();
  }
}

function drawAnalyser() {
  if (!els.freqCanvas || !analyser) return;
  const canvas = els.freqCanvas;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const waveArray = new Uint8Array(bufferLength);
  function draw() {
    rafId = requestAnimationFrame(draw);
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,w,h);
    // Frequency
    analyser.getByteFrequencyData(dataArray);
    const barWidth = (w / bufferLength) * 2.5;
    let x = 0;
    for (let i=0;i<bufferLength;i++) {
      const barHeight = (dataArray[i]/255) * h * 0.7;
      ctx.fillStyle = `hsl(${240 + dataArray[i]/255*40}, 80%, 60%)`;
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);
      x += barWidth + 1;
      if (x > w) break;
    }
    // Waveform overlay (top 30%)
    analyser.getByteTimeDomainData(waveArray);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sliceWidth = w / bufferLength;
    let wx = 0;
    for (let i=0;i<bufferLength;i++) {
      const v = waveArray[i] / 128 - 1;
      const y = v * h * 0.15 + h * 0.15;
      if (i===0) ctx.moveTo(wx, y);
      else ctx.lineTo(wx, y);
      wx += sliceWidth;
    }
    ctx.stroke();
  }
  draw();
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  if (!hasWebAudio()) {
    container.innerHTML = `<div style="padding:24px;text-align:center"><div style="font:700 14px var(--font-sans);color:var(--danger)">⚠ Web Audio API not supported</div><div class="muted small" style="margin-top:8px">Try Chrome/Firefox with audio enabled</div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="audio-tabs" role="tablist" aria-label="Audio tabs">
      <button class="audio-tab active" data-tab="osc" role="tab" aria-selected="true">Oscillator</button>
      <button class="audio-tab" data-tab="synth" role="tab" aria-selected="false">Synth</button>
      <button class="audio-tab" data-tab="drum" role="tab" aria-selected="false">Drum</button>
    </div>

    <div class="audio-pane active" data-pane="osc">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label class="muted small" style="font:600 11px var(--font-sans)">Type</label>
          <select id="oscType" style="width:100%;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)">
            <option value="sine">Sine</option><option value="square">Square</option><option value="sawtooth">Sawtooth</option><option value="triangle">Triangle</option>
          </select>
        </div>
        <div>
          <label class="muted small" style="font:600 11px var(--font-sans)">Filter</label>
          <select id="filterType" style="width:100%;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)">
            <option value="lowpass">Lowpass</option><option value="highpass">Highpass</option><option value="bandpass">Bandpass</option><option value="notch">Notch</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
        <label class="small" style="display:flex;flex-direction:column;gap:4px">Freq <input type="range" id="oscFreq" min="50" max="2000" value="440" /><span class="muted small" id="oscFreqVal">440 Hz</span></label>
        <label class="small" style="display:flex;flex-direction:column;gap:4px">Gain <input type="range" id="oscGain" min="0" max="100" value="50" /><span class="muted small" id="oscGainVal">50%</span></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
        <label class="small" style="display:flex;flex-direction:column;gap:4px">Filter Freq <input type="range" id="filterFreq" min="20" max="20000" value="20000" /><span class="muted small" id="filterFreqVal">20000 Hz</span></label>
        <label class="small" style="display:flex;flex-direction:column;gap:4px">Filter Q <input type="range" id="filterQ" min="0" max="20" value="1" step="0.5" /><span class="muted small" id="filterQVal">1</span></label>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary btn-sm" data-action="osc-play">▶ Play</button>
        <button class="btn btn-ghost btn-sm" data-action="osc-stop">■ Stop</button>
        <button class="btn btn-ghost btn-sm" data-action="osc-beep">Beep</button>
      </div>
      <canvas id="freqCanvas" width="640" height="100" style="width:100%;height:100px;background:#0f172a;border-radius:8px;margin-top:12px;display:block"></canvas>
      <div class="muted small" style="margin-top:6px">Frequency (bars) + Waveform (line) — via AnalyserNode</div>
    </div>

    <div class="audio-pane" data-pane="synth">
      <div class="muted small" style="margin-bottom:8px">Click keys or press A,S,D,F,G,H,J (white) / W,E,T,Y,U (black)</div>
      <div class="synth-keys" id="synthKeys"></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <label class="small" style="display:flex;align-items:center;gap:6px">Octave <input type="range" id="synthOct" min="2" max="6" value="4" style="width:100px" /> <span id="synthOctVal">4</span></label>
        <select id="synthType" style="height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)">
          <option value="sine">Sine</option><option value="square">Square</option><option value="sawtooth" selected>Sawtooth</option><option value="triangle">Triangle</option>
        </select>
      </div>
    </div>

    <div class="audio-pane" data-pane="drum">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <button class="drum-pad" data-drum="kick" style="height:100px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:0;border-radius:12px;font:700 14px var(--font-sans);cursor:pointer;transition:transform .08s">KICK</button>
        <button class="drum-pad" data-drum="snare" style="height:100px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border:0;border-radius:12px;font:700 14px var(--font-sans);cursor:pointer;transition:transform .08s">SNARE</button>
        <button class="drum-pad" data-drum="hihat" style="height:100px;background:linear-gradient(135deg,#06b6d4,#10b981);color:#fff;border:0;border-radius:12px;font:700 14px var(--font-sans);cursor:pointer;transition:transform .08s">HIHAT</button>
      </div>
      <div class="muted small" style="margin-top:8px">Click pads or press Q,W,E</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-ghost btn-sm" data-action="drum-pattern">Play Pattern</button>
        <button class="btn btn-ghost btn-sm" data-action="drum-stop">Stop</button>
      </div>
    </div>
  `;

  els = {
    freqCanvas: container.querySelector('#freqCanvas'),
    oscType: container.querySelector('#oscType'),
    oscFreq: container.querySelector('#oscFreq'),
    oscFreqVal: container.querySelector('#oscFreqVal'),
    oscGain: container.querySelector('#oscGain'),
    oscGainVal: container.querySelector('#oscGainVal'),
    filterType: container.querySelector('#filterType'),
    filterFreq: container.querySelector('#filterFreq'),
    filterFreqVal: container.querySelector('#filterFreqVal'),
    filterQ: container.querySelector('#filterQ'),
    filterQVal: container.querySelector('#filterQVal'),
    synthKeys: container.querySelector('#synthKeys'),
    synthOct: container.querySelector('#synthOct'),
    synthOctVal: container.querySelector('#synthOctVal'),
    synthType: container.querySelector('#synthType'),
  };

  // Tabs
  container.querySelectorAll('.audio-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      container.querySelectorAll('.audio-tab').forEach(b => {
        const active = b.dataset.tab===tab;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      container.querySelectorAll('.audio-pane').forEach(p => p.classList.toggle('active', p.dataset.pane===tab));
    });
  });

  // Oscillator controls
  els.oscFreq?.addEventListener('input', () => {
    els.oscFreqVal.textContent = els.oscFreq.value + ' Hz';
    if (osc) osc.frequency.value = parseFloat(els.oscFreq.value);
  });
  els.oscGain?.addEventListener('input', () => {
    els.oscGainVal.textContent = els.oscGain.value + '%';
    if (masterGain) masterGain.gain.value = parseInt(els.oscGain.value,10)/100;
  });
  els.filterFreq?.addEventListener('input', () => {
    els.filterFreqVal.textContent = els.filterFreq.value + ' Hz';
    if (filterNode) filterNode.frequency.value = parseFloat(els.filterFreq.value);
  });
  els.filterQ?.addEventListener('input', () => {
    els.filterQVal.textContent = els.filterQ.value;
    if (filterNode) filterNode.Q.value = parseFloat(els.filterQ.value);
  });
  els.filterType?.addEventListener('change', () => {
    if (filterNode) filterNode.type = els.filterType.value;
  });

  container.querySelector('[data-action="osc-play"]')?.addEventListener('click', () => {
    ensureCtx();
    if (osc) try{ osc.stop(); }catch{}
    osc = audioCtx.createOscillator();
    osc.type = els.oscType.value;
    osc.frequency.value = parseFloat(els.oscFreq.value);
    osc.connect(masterGain);
    osc.start();
    drawAnalyser();
  });
  container.querySelector('[data-action="osc-stop"]')?.addEventListener('click', () => {
    if (osc) try{ osc.stop(); }catch{}
    osc = null;
  });
  container.querySelector('[data-action="osc-beep"]')?.addEventListener('click', () => {
    playOsc(els.oscType.value, parseFloat(els.oscFreq.value), 0.3);
    drawAnalyser();
  });

  // Synth keys
  const notes = [
    { name:'C', offset: -9, black:false }, { name:'C#', offset: -8, black:true },
    { name:'D', offset: -7, black:false }, { name:'D#', offset: -6, black:true },
    { name:'E', offset: -5, black:false },
    { name:'F', offset: -4, black:false }, { name:'F#', offset: -3, black:true },
    { name:'G', offset: -2, black:false }, { name:'G#', offset: -1, black:true },
    { name:'A', offset: 0, black:false }, { name:'A#', offset: 1, black:true },
    { name:'B', offset: 2, black:false },
    { name:'C2', offset: 3, black:false },
  ];
  const keyMap = { 'a':'C', 'w':'C#', 's':'D', 'e':'D#', 'd':'E', 'f':'F', 't':'F#', 'g':'G', 'y':'G#', 'h':'A', 'u':'A#', 'j':'B', 'k':'C2' };
  function renderKeys() {
    if (!els.synthKeys) return;
    els.synthKeys.innerHTML = notes.map(n => `
      <button class="synth-key ${n.black?'black':'white'}" data-note="${n.offset}" data-name="${n.name}" aria-label="${n.name}">
        <span>${n.name}</span><span class="muted small">${Object.entries(keyMap).find(([k,v])=>v===n.name)?.[0]||''}</span>
      </button>
    `).join('');
    els.synthKeys.querySelectorAll('.synth-key').forEach(btn => {
      const offset = parseInt(btn.dataset.note,10);
      const play = () => {
        const oct = parseInt(els.synthOct.value,10);
        const freq = noteFreq(offset + (oct-4)*12);
        const type = els.synthType.value;
        ensureCtx();
        // Stop previous for this note
        if (activeOscs.has(offset)) try{ activeOscs.get(offset).stop(); }catch{}
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.value = 0.3;
        o.connect(g); g.connect(masterGain);
        o.start();
        activeOscs.set(offset, o);
        btn.classList.add('active');
        drawAnalyser();
        const stop = () => {
          try{ g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.1); o.stop(audioCtx.currentTime+0.1); }catch{}
          activeOscs.delete(offset);
          btn.classList.remove('active');
        };
        btn._stop = stop;
      };
      const stop = () => { if(btn._stop) btn._stop(); };
      btn.addEventListener('pointerdown', (e)=> { e.preventDefault(); play(); });
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointerleave', stop);
      btn.addEventListener('pointercancel', stop);
    });
  }
  renderKeys();
  els.synthOct?.addEventListener('input', () => { els.synthOctVal.textContent = els.synthOct.value; });

  // Keyboard for synth
  const keyHandler = (e) => {
    if (e.repeat) return;
    const noteName = keyMap[e.key.toLowerCase()];
    if (!noteName) return;
    const note = notes.find(n=>n.name===noteName);
    if (!note) return;
    const btn = els.synthKeys?.querySelector(`[data-name="${noteName}"]`);
    if (btn) btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true }));
  };
  const keyUpHandler = (e) => {
    const noteName = keyMap[e.key.toLowerCase()];
    if (!noteName) return;
    const btn = els.synthKeys?.querySelector(`[data-name="${noteName}"]`);
    if (btn && btn._stop) btn._stop();
  };
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('keyup', keyUpHandler);
  // Store for cleanup
  els._keyHandler = keyHandler;
  els._keyUpHandler = keyUpHandler;

  // Drum
  container.querySelectorAll('[data-drum]').forEach(btn => {
    btn.addEventListener('click', () => {
      playDrum(btn.dataset.drum);
      btn.style.transform='scale(0.95)';
      setTimeout(()=> btn.style.transform='', 100);
      drawAnalyser();
    });
  });
  // Drum keyboard Q,W,E
  const drumKeys = { 'q':'kick', 'w':'snare', 'e':'hihat' };
  const drumKeyHandler = (e) => {
    const type = drumKeys[e.key.toLowerCase()];
    if (!type || e.repeat) return;
    playDrum(type);
    const btn = container.querySelector(`[data-drum="${type}"]`);
    if (btn) { btn.style.transform='scale(0.95)'; setTimeout(()=> btn.style.transform='', 100); }
    drawAnalyser();
  };
  window.addEventListener('keydown', drumKeyHandler);
  els._drumHandler = drumKeyHandler;

  let patternInterval = null;
  container.querySelector('[data-action="drum-pattern"]')?.addEventListener('click', () => {
    if (patternInterval) clearInterval(patternInterval);
    let step = 0;
    patternInterval = setInterval(() => {
      if (step % 4 === 0) playDrum('kick');
      if (step % 4 === 2) playDrum('snare');
      if (step % 2 === 1) playDrum('hihat');
      step = (step+1)%16;
    }, 200);
    els._patternInterval = patternInterval;
  });
  container.querySelector('[data-action="drum-stop"]')?.addEventListener('click', () => {
    if (els._patternInterval) clearInterval(els._patternInterval);
    els._patternInterval = null;
  });

  // Initial analyser draw (silent)
  ensureCtx();
  drawAnalyser();

  ctxRef?.logger?.info('audio-engine: mounted');
}

export async function unmount() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId=null;
  if (osc) try{ osc.stop(); }catch{}
  osc=null;
  for (const o of activeOscs.values()) try{ o.stop(); }catch{}
  activeOscs.clear();
  if (els._keyHandler) window.removeEventListener('keydown', els._keyHandler);
  if (els._keyUpHandler) window.removeEventListener('keyup', els._keyUpHandler);
  if (els._drumHandler) window.removeEventListener('keydown', els._drumHandler);
  if (els._patternInterval) clearInterval(els._patternInterval);
  if (audioCtx) try{ audioCtx.close(); }catch{}
  audioCtx=null; masterGain=null; filterNode=null; analyser=null;
  els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
