/* =============================================================
   Nihongo N5 — Trang Học (passive listening)
   Trình tự 1 từ: hiện → 1s → JP thường → JP chậm → nghĩa VI → 1s → từ kế
   (tuỳ chọn "Mẫu câu": đọc thêm mẫu câu JP → VI trước khi chuyển từ)
   ============================================================= */
(() => {
  'use strict';
  const { $, t, Store, TTS, toast, UI, esc, shuffle, bootWithStore } = window.JPCore;

  const RATES = { normal: 0.95, slow: 0.6, fast: 1.35 };
  const CFG = { leadMs: 1000, gapMs: 1000, warnMs: 1800 };
  if (window.__NIHONGO_TEST__) Object.assign(CFG, window.__NIHONGO_TEST__);

  const state = {
    selected: new Set(UI.get('selectedLessons', [])),
    sentences: !!UI.get('sentences', false),
    queue: [],
    index: 0,
    playState: 'idle', // idle | playing | paused
  };

  const els = {};
  let voiceWarned = false;
  let voiceWarnTimer = 0;

  /* ---------------- queue / render ---------------- */
  // Khóa nhận diện từ — chống lặp trong 1 phiên (từ trùng giữa nhiều bài chỉ phát 1 lần)
  function wordKey(w) {
    return String(w.kanji || w.kana || '').trim().normalize('NFKC').toLowerCase();
  }

  function buildQueue() {
    const merged = [];
    const seen = new Set();
    for (const lesson of Store.lessons()) {
      if (!state.selected.has(lesson.id)) continue;
      for (const word of Store.words(lesson.id)) {
        const key = wordKey(word);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push({ word, lessonId: lesson.id });
      }
    }
    state.queue = shuffle(merged); // mỗi phiên một thứ tự ngẫu nhiên (permutation — không lặp)
    state.index = 0;
  }

  function renderChips() {
    const box = els.chips;
    const lessons = Store.lessons();
    if (!lessons.length) {
      box.innerHTML = `<p class="empty small">${esc(t('learn.empty'))}</p>`;
      return;
    }
    box.innerHTML = lessons.map(l => {
      const n = Store.countWords(l.id);
      const checked = state.selected.has(l.id) ? 'checked' : '';
      return `<label class="chip-check">
        <input type="checkbox" value="${esc(l.id)}" ${checked} />
        <span>${esc(l.name)}</span>
        <span class="chip-count">${esc(t('learn.words', { n }))}</span>
      </label>`;
    }).join('');
  }

  function renderWord(withSwap = false) {
    const item = state.queue[state.index];
    if (withSwap) {
      els.card.classList.remove('swap');
      void els.card.offsetWidth; // reflow → chạy lại animation
      els.card.classList.add('swap');
    }
    if (!item) {
      els.kanji.textContent = '—';
      els.kana.textContent = '';
      els.vi.textContent = '';
      els.sentences.hidden = true;
      return;
    }
    const w = item.word;
    els.kanji.textContent = w.kanji || w.kana || '—';
    els.kana.textContent = (w.kanji && w.kana) ? w.kana : '';
    els.vi.textContent = w.vi || '';

    const exs = Array.isArray(w.examples) ? w.examples : [];
    if (state.sentences && exs.length) {
      els.sentences.innerHTML = exs.map(ex => `<div class="ex">
        <div class="ex-jp jp">${esc(ex.jp)}</div>
        ${ex.vi ? `<div class="ex-vi">${esc(ex.vi)}</div>` : ''}
      </div>`).join('');
      els.sentences.hidden = false;
    } else {
      els.sentences.hidden = true;
      els.sentences.innerHTML = '';
    }
  }

  function renderProgress() {
    const total = state.queue.length;
    const i = total ? state.index + 1 : 0;
    els.progressLabel.textContent = `${i}/${total}`;
    els.progressFill.style.width = total ? `${((state.index + 1) / total) * 100}%` : '0%';
    els.progressBar.setAttribute('aria-valuemax', String(total));
    els.progressBar.setAttribute('aria-valuenow', String(i));
    els.btnStop.disabled = !total;
  }

  function renderControls() {
    const playing = state.playState === 'playing';
    els.btnPlay.hidden = playing;
    els.btnPause.hidden = !playing;
  }

  function setStatus(text, active) {
    els.speakStatus.textContent = text;
    els.speakDot.classList.toggle('on', !!active);
  }

  function renderVoices(v) {
    const ok = '<span class="ok">✓</span>';
    const no = '<span class="no">✗</span>';
    els.voiceBadge.innerHTML = `<span>${esc(t('learn.voices'))}: JA ${v.ja ? ok : no} · VI ${v.vi ? ok : no}</span>`;
    // Edge/Chrome nạp danh sách giọng async — chờ 1 khoảng + quét lại trước khi cảnh báo (tránh warn oan)
    if (!TTS.supported) return;
    if (v.ja && v.vi) { clearTimeout(voiceWarnTimer); return; }
    if (voiceWarned) return;
    clearTimeout(voiceWarnTimer);
    voiceWarnTimer = setTimeout(() => {
      voiceWarned = true;
      if (!TTS.voices.ja) toast(t('learn.voiceHint', { lang: 'tiếng Nhật (ja-JP)' }), 'error', 6000);
      if (!TTS.voices.vi) toast(t('learn.voiceHint', { lang: 'tiếng Việt (vi-VN)' }), 'error', 6000);
    }, CFG.warnMs);
  }

  /* ---------------- player ---------------- */
  class Player {
    constructor(h) { this.h = h; this.runId = 0; this.state = 'idle'; this.index = 0; this._gate = null; }

    buildSteps(word) {
      const steps = [];
      const reading = (word.kana || word.kanji || '').trim();
      steps.push({ wait: CFG.leadMs });
      if (reading) {
        steps.push({ text: reading, lang: 'ja', rate: RATES.normal, kind: t('learn.kindNormal') });
        steps.push({ text: reading, lang: 'ja', rate: RATES.slow, kind: t('learn.kindSlow') });
      }
      if (word.vi) steps.push({ text: word.vi, lang: 'vi', rate: 1, kind: t('learn.kindMeaning') });
      if (state.sentences && Array.isArray(word.examples)) {
        for (const ex of word.examples) {
          if (ex.jp) steps.push({ text: ex.jp, lang: 'ja', rate: RATES.normal, kind: t('learn.kindExample') });
          if (ex.vi) steps.push({ text: ex.vi, lang: 'vi', rate: 1, kind: t('learn.kindExample') });
        }
      }
      steps.push({ wait: CFG.gapMs });
      return steps;
    }

    async play() {
      if (this.state === 'playing') return;
      if (this.state === 'paused') {
        this.state = 'playing';
        this.h.onState(this.state);
        this.openGate('proceed');
        return;
      }
      if (!state.queue.length) return;
      this.runId++;
      const id = this.runId;
      this.state = 'playing';
      this.h.onState(this.state);

      for (let w = this.index; w < state.queue.length; w++) {
        if (this.runId !== id) return;
        this.index = w;
        this.h.onWord(state.queue[w], w, state.queue.length);
        const steps = this.buildSteps(state.queue[w].word);
        for (const st of steps) {
          if (this.runId !== id) return;
          if (st.wait) {
            const r = await this.wait(st.wait, id);
            if (r === 'aborted') return;
            continue;
          }
          let result = 'end';
          do {
            if (this.runId !== id) return;
            this.h.onStep(st);
            result = await TTS.speak(st.text, { lang: st.lang, rate: st.rate });
            if (this.runId !== id) return;
            const g = await this.gate(id);
            if (g === 'aborted') return;
          } while (result === 'canceled'); // pause cắt utterance giữa chừng → đọc lại khi resume
        }
        this.h.onStepEnd();
      }
      this.state = 'idle';
      this.index = 0;
      this.h.onState(this.state);
      this.h.onDone();
    }

    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      TTS.cancelAll();
      this.h.onState(this.state);
    }

    stop() {
      this.runId++;
      this.state = 'idle';
      this.index = 0;
      this.openGate('aborted');
      TTS.cancelAll();
      this.h.onState(this.state);
      this.h.onReset();
    }

    gate(id) {
      if (this.runId !== id) return Promise.resolve('aborted');
      if (this.state !== 'paused') return Promise.resolve('proceed');
      return new Promise(res => { this._gate = res; });
    }

    openGate(v) {
      if (this._gate) { const r = this._gate; this._gate = null; r(v || 'proceed'); }
    }

    wait(ms, id) {
      return new Promise(resolve => {
        let left = ms;
        const tick = () => {
          if (this.runId !== id) return resolve('aborted');
          if (left <= 0) return resolve('ok');
          if (this.state === 'paused') { this.gate(id).then(g => g === 'aborted' ? resolve('aborted') : tick()); return; }
          const slice = Math.min(left, 50);
          left -= slice;
          setTimeout(tick, slice);
        };
        tick();
      });
    }
  }

  const player = new Player({
    onWord: (item, i, total) => {
      state.index = i;
      renderWord(true);
      renderProgress();
      const reading = item.word.kana || item.word.kanji;
      setStatus(t('learn.reading', { text: reading, kind: t('learn.kindNormal') }), true);
      void total;
    },
    onStep: st => setStatus(t('learn.reading', { text: st.text, kind: st.kind }), true),
    onStepEnd: () => setStatus(t('learn.ready'), false),
    onState: s => {
      state.playState = s;
      renderControls();
      if (els.stageHint) els.stageHint.hidden = s === 'playing'; // gọn mắt khi đang phát
    },
    onReset: () => {
      state.index = 0;
      renderWord(true);
      renderProgress();
      setStatus(t('learn.ready'), false);
    },
    onDone: () => {
      renderWord(true);
      renderProgress();
      setStatus(t('learn.done'), false);
    },
  });

  /* ---------------- voice dialog ---------------- */
  function wireDialog(dlg) {
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => dlg.close()));
  }

  function renderVoiceDialog() {
    TTS.pick();
    const list = TTS.list();
    els.voiceSummary.textContent = t('voice.detected', { n: list.length });
    els.voiceList.innerHTML = list.length
      ? list.map(x => `<div class="voice-item"><span>${esc(x.name)}</span><span class="lang">${esc(x.lang)}${x.local ? '' : ' · online'}</span></div>`).join('')
      : `<p class="muted small">${esc(t('voice.none'))}</p>`;
    els.voiceHowto.hidden = !!(TTS.voices.ja && TTS.voices.vi);
  }

  function openVoiceDialog() {
    renderVoiceDialog();
    window.JPCore.openDialog($('#voiceDlg'));
    $('#voiceRetry').focus();
  }

  /* ---------------- manual actions ---------------- */
  async function manualSpeak(rate) {
    const item = state.queue[state.index];
    if (!item) return;
    if (state.playState === 'playing') { toast(t('learn.playingHint')); return; }
    const reading = item.word.kana || item.word.kanji;
    const kind = rate === RATES.fast ? t('learn.kindFast') : t('learn.kindNormal');
    setStatus(t('learn.reading', { text: reading, kind }), true);
    await TTS.speak(reading, { lang: 'ja', rate });
    setStatus(t('learn.ready'), false);
  }

  function onSelectionChanged() {
    UI.set('selectedLessons', Array.from(state.selected));
    player.stop();
    buildQueue();
    renderWord(true);
    renderProgress();
  }

  /* ---------------- init ---------------- */
  function init() {
    els.chips = $('#lessonChips');
    els.card = $('#wordCard');
    els.kanji = $('#wordKanji');
    els.kana = $('#wordKana');
    els.vi = $('#wordVi');
    els.sentences = $('#wordSentences');
    els.progressBar = $('#progressBar');
    els.progressFill = $('#progressFill');
    els.progressLabel = $('#progressLabel');
    els.btnPlay = $('#btnPlay');
    els.btnPause = $('#btnPause');
    els.btnStop = $('#btnStop');
    els.speakStatus = $('#speakStatus');
    els.speakDot = $('#speakDot');
    els.voiceBadge = $('#voiceBadge');
    els.stageHint = $('#stageHint');
    els.voiceSummary = $('#voiceSummary');
    els.voiceList = $('#voiceList');
    els.voiceHowto = $('#voiceHowto');

    renderChips();
    buildQueue();
    renderWord();
    renderProgress();
    renderControls();

    const btnSentences = $('#btnSentences');
    btnSentences.setAttribute('aria-pressed', String(state.sentences));
    btnSentences.addEventListener('click', () => {
      state.sentences = !state.sentences;
      UI.set('sentences', state.sentences);
      btnSentences.setAttribute('aria-pressed', String(state.sentences));
      renderWord(true);
    });

    // lesson chips (event delegation)
    els.chips.addEventListener('change', e => {
      const input = e.target.closest('input[type="checkbox"]');
      if (!input) return;
      if (input.checked) state.selected.add(input.value); else state.selected.delete(input.value);
      onSelectionChanged();
    });
    $('#selectAll').addEventListener('click', () => {
      state.selected = new Set(Store.lessons().map(l => l.id));
      renderChips();
      onSelectionChanged();
    });
    $('#clearAll').addEventListener('click', () => {
      state.selected.clear();
      renderChips();
      onSelectionChanged();
    });

    // Ẩn/hiện danh sách bài học (nhớ trạng thái qua F5)
    const btnToggle = $('#btnToggleLessons');
    const applyLessonsHidden = hidden => {
      document.body.classList.toggle('lessons-hidden', hidden);
      $('#lessonPanel').hidden = hidden;
      btnToggle.setAttribute('aria-expanded', String(!hidden));
      $('#toggleLessonsLabel').textContent = t(hidden ? 'learn.showLessons' : 'learn.hideLessons');
      UI.set('lessonsHidden', hidden);
    };
    applyLessonsHidden(!!UI.get('lessonsHidden', false));
    btnToggle.addEventListener('click', () => applyLessonsHidden(!document.body.classList.contains('lessons-hidden')));

    // controls
    els.btnPlay.addEventListener('click', () => {
      if (!state.selected.size) { toast(t('learn.noLessons')); return; }
      if (TTS.supported && !TTS.voices.ja) TTS.pick(); // gói Speech cài sau khi mở trang → quét lại
      if (state.playState === 'idle') buildQueue(); // phiên mới → xáo trộn mới, không lặp từ
      if (!state.queue.length) { toast(t('learn.noWords')); return; }
      player.play();
    });
    els.btnPause.addEventListener('click', () => player.pause());
    els.btnStop.addEventListener('click', () => player.stop());
    $('#btnNormal').addEventListener('click', () => manualSpeak(RATES.normal));
    $('#btnFast').addEventListener('click', () => manualSpeak(RATES.fast));

    // keyboard: Space = play/pause
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'select' || e.target.isContentEditable) return;
      e.preventDefault();
      if (state.playState === 'playing') player.pause(); else els.btnPlay.click();
    });

    // TTS
    if (!TTS.supported) {
      toast(t('learn.ttsUnsupported'), 'error', 6000);
      renderVoices({ ja: null, vi: null });
    } else {
      TTS.init(renderVoices);
    }

    // dialog kiểm tra giọng đọc
    wireDialog($('#voiceDlg'));
    els.voiceBadge.addEventListener('click', openVoiceDialog);
    $('#voiceRetry').addEventListener('click', () => {
      renderVoiceDialog();
      renderVoices(TTS.voices);
      toast(t('voice.refreshed'), 'success');
    });

    // Test seam (e2e): queue phiên hiện tại + index + playState
    window.__JPLearn = {
      queue: () => state.queue.map(i => i.word),
      index: () => state.index,
      playState: () => state.playState,
    };
  }

  bootWithStore(init);
})();
