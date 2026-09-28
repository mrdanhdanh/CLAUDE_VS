/* =============================================================
   Nihongo N5 — Trang Kiểm tra (+ Ngân hàng câu hỏi + Skill tab)
   Quiz: options xáo trộn, chấm điểm ngay, tổng kết + xem lại câu sai.
   ============================================================= */
(() => {
  'use strict';
  const { $, $$, t, esc, shuffle, Store, toast, download, debounce, bootWithStore } = window.JPCore;

  const state = {
    cfg: { sources: new Set(['official', 'generated', 'sample']), year: '', section: '', count: '10', shuffleQ: true },
    run: null, // { questions:[{q,opts}], idx, total, answers }
    qSearch: '',
    genUnchecked: new Set(), // bài học user đã bỏ chọn ở panel sinh câu (giữ qua các lần re-render)
  };

  const els = {};

  /* ---------------- tabs ---------------- */
  function setTab(tab) {
    $$('.seg-btn').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('#panelPlay').hidden = tab !== 'play';
    $('#panelBank').hidden = tab !== 'bank';
    $('#panelSkill').hidden = tab !== 'skill';
  }

  /* ---------------- filters ---------------- */
  function fillSelect(sel, values, allLabel) {
    const cur = sel.value;
    sel.innerHTML = `<option value="">${esc(allLabel)}</option>` +
      values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (values.includes(cur)) sel.value = cur;
  }

  function refreshFilters() {
    const qs = Store.questions();
    const years = [...new Set(qs.map(q => q.year).filter(Boolean))].sort().reverse();
    const sections = [...new Set(qs.map(q => q.section).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    fillSelect($('#fYear'), years, t('quiz.yearAll'));
    fillSelect($('#fSection'), sections, t('quiz.sectionAll'));
  }

  /* ---------------- quiz run ---------------- */
  function prep(q) {
    const opts = (q.options || []).map((text, i) => ({ text: String(text), correct: i === q.answer }));
    return { q, opts: shuffle(opts) };
  }

  function startQuiz() {
    if (!state.cfg.sources.size) { toast(t('quiz.pickSource')); return; }
    let pool = Store.questions().filter(q => state.cfg.sources.has(q.source || 'sample'));
    if (state.cfg.year) pool = pool.filter(q => q.year === state.cfg.year);
    if (state.cfg.section) pool = pool.filter(q => q.section === state.cfg.section);
    if (!pool.length) { toast(t('quiz.noMatch')); return; }
    if (state.cfg.shuffleQ) pool = shuffle(pool);
    if (state.cfg.count !== 'all') pool = pool.slice(0, Number(state.cfg.count));
    state.run = { questions: pool.map(prep), idx: 0, total: pool.length, answers: [] };
    renderQuestion();
  }

  function renderQuestion() {
    const { questions, idx, total } = state.run;
    const cur = questions[idx];
    const src = cur.q.source || 'sample';
    const srcLabel = { official: t('quiz.srcOfficial'), generated: t('quiz.srcGenerated'), sample: t('quiz.srcSample') }[src] || src;
    els.area.innerHTML = `
      <div class="q-card" id="quizCard">
        <div class="row spread">
          <span class="small muted">${esc(t('quiz.questionOf', { i: idx + 1, n: total }))}</span>
          <span class="src-badge src-${esc(src)}">${esc(srcLabel)}</span>
        </div>
        ${cur.q.prompt ? `<div class="q-prompt jp">${esc(cur.q.prompt)}</div>` : ''}
        <div class="q-text jp">${esc(cur.q.question)}</div>
        <div class="stack" id="optWrap">
          ${cur.opts.map((o, i) => `<button class="option-btn" type="button" data-i="${i}">
            <span class="opt-key">${'ABCD'[i] || '?'}</span><span>${esc(o.text)}</span>
          </button>`).join('')}
        </div>
        <div class="q-feedback" id="qFeedback" hidden></div>
        <div class="q-explain" id="qExplain" hidden></div>
        <div class="row"><button class="btn btn-primary" id="btnNext" type="button" hidden></button></div>
      </div>`;
    $('#optWrap').addEventListener('click', e => {
      const btn = e.target.closest('.option-btn');
      if (!btn || btn.disabled) return;
      answer(Number(btn.dataset.i));
    });
  }

  function answer(i) {
    const run = state.run;
    const cur = run.questions[run.idx];
    const buttons = $$('#optWrap .option-btn');
    buttons.forEach(b => { b.disabled = true; });
    const correctIdx = cur.opts.findIndex(o => o.correct);
    const correctText = cur.opts[correctIdx]?.text || '';
    const picked = cur.opts[i];
    if (buttons[correctIdx]) buttons[correctIdx].classList.add('is-correct');
    const ok = !!picked?.correct;
    if (!ok && buttons[i]) buttons[i].classList.add('is-wrong');

    const fb = $('#qFeedback');
    fb.hidden = false;
    fb.className = `q-feedback ${ok ? 'ok' : 'no'}`;
    fb.textContent = ok ? t('quiz.correct') : t('quiz.wrong', { ans: correctText });
    if (cur.q.explanation) {
      const ex = $('#qExplain');
      ex.hidden = false;
      ex.textContent = cur.q.explanation;
    }
    run.answers.push({ q: cur.q, picked: picked?.text || '', correct: ok });

    const next = $('#btnNext');
    next.hidden = false;
    next.textContent = t(run.idx + 1 === run.total ? 'quiz.finish' : 'quiz.next');
    next.focus();
    next.addEventListener('click', () => {
      run.idx++;
      if (run.idx >= run.total) renderResult();
      else renderQuestion();
    }, { once: true });
  }

  function renderResult() {
    const { answers, total } = state.run;
    const score = answers.filter(a => a.correct).length;
    const pct = Math.round((score / total) * 100);
    const msg = pct >= 80 ? t('quiz.msgHigh') : pct >= 60 ? t('quiz.msgMid') : t('quiz.msgLow');
    const wrong = answers.filter(a => !a.correct);
    els.area.innerHTML = `
      <div class="q-card">
        <div class="result-big">${esc(t('quiz.resultBig', { score, total }))}</div>
        <p class="muted">${esc(t('quiz.resultSub', { pct, msg }))}</p>
        ${wrong.length ? `
          <h3 class="panel-title">${esc(t('quiz.wrongList'))}</h3>
          <div class="stack">
            ${wrong.map(a => `<div class="wrong-item">
              <div class="q jp">${esc(a.q.question)}</div>
              <div class="small muted">${esc(t('quiz.yourAnswer', { ans: a.picked || '—' }))}</div>
              <div class="small">${esc(t('quiz.correctAnswer', { ans: (a.q.options || [])[a.q.answer] ?? '' }))}</div>
            </div>`).join('')}
          </div>` : ''}
        <div class="row">
          <button class="btn btn-primary" id="btnAgain" type="button">${esc(t('quiz.again'))}</button>
          <button class="btn" id="btnBack" type="button">${esc(t('quiz.backCfg'))}</button>
        </div>
      </div>`;
    $('#btnAgain').addEventListener('click', () => { state.run = null; startQuiz(); });
    $('#btnBack').addEventListener('click', () => { state.run = null; els.area.innerHTML = ''; });
  }

  /* ---------------- bank ---------------- */
  function refreshBank() {
    const qs = Store.questions();
    const counts = { official: 0, generated: 0, sample: 0 };
    for (const q of qs) {
      const s = q.source || 'sample';
      if (s in counts) counts[s]++; else counts.sample++;
    }
    $('#statTotal').textContent = String(qs.length);
    $('#statOfficial').textContent = String(counts.official);
    $('#statGenerated').textContent = String(counts.generated);
    $('#statSample').textContent = String(counts.sample);
    renderGenLessons();
    renderBankList();
    refreshFilters();
  }

  function renderGenLessons() {
    els.genLessons.innerHTML = Store.lessons().length
      ? Store.lessons().map(l => `<label class="chip-check">
          <input type="checkbox" data-lesson="${esc(l.id)}" ${state.genUnchecked.has(l.id) ? '' : 'checked'} />
          <span>${esc(l.name)}</span><span class="chip-count">${Store.countWords(l.id)}</span>
        </label>`).join('')
      : `<span class="muted small">${esc(t('learn.empty'))}</span>`;
  }

  function renderBankList() {
    const q = state.qSearch.trim().toLowerCase();
    let list = Store.questions();
    if (q) {
      list = list.filter(x =>
        String(x.question || '').toLowerCase().includes(q) ||
        String(x.prompt || '').toLowerCase().includes(q) ||
        String(x.id || '').toLowerCase().includes(q)
      );
    }
    list = list.slice(0, 100);
    els.bankList.innerHTML = list.length
      ? `<div class="jp-tbl-wrap">${list.map(x => `
          <div class="bank-row" data-id="${esc(x.id)}">
            <span class="src-badge src-${esc(x.source || 'sample')}">${esc(x.source || 'sample')}</span>
            <span class="q"><span class="jp">${esc(x.question || '')}</span> <span class="muted small">${esc(x.section || '')}</span></span>
            <button class="btn btn-ghost btn-sm" type="button" data-act="delQ" data-i18n-aria="quiz.deleteQ">✕</button>
          </div>`).join('')}</div>`
      : `<div class="empty"><span class="icon" aria-hidden="true">📄</span>${esc(t('quiz.emptyBank'))}</div>`;
    els.bankMeta.textContent = t('quiz.showing', { n: list.length });
  }

  function genRun() {
    const lessonIds = $$('#genLessons input:checked').map(i => i.dataset.lesson);
    const types = $$('input[data-gtype]:checked').map(i => i.dataset.gtype);
    if (!lessonIds.length || !types.length) { toast(t('quiz.genPick')); return; }
    const perType = Number($('#genPerType').value) || 5;
    const items = [];
    for (const id of lessonIds) for (const w of Store.words(id)) items.push({ word: w, lessonId: id });
    const list = window.JPGen.generate(items, { types, perType });
    if (!list.length) { toast(t('quiz.genPick')); return; }
    Store.upsertQuestions(list);
    toast(t('quiz.genDone', { n: list.length }), 'success', 4500);
    refreshBank();
  }

  function genClear() {
    const lessonIds = $$('#genLessons input:checked').map(i => i.dataset.lesson);
    if (!lessonIds.length) { toast(t('quiz.genPick')); return; }
    const n = Store.removeGeneratedForLessons(lessonIds);
    toast(t('quiz.genCleared', { n }), 'success');
    refreshBank();
  }

  async function importQuestions(file) {
    let data = null;
    try { data = JSON.parse(await file.text()); }
    catch { toast(t('quiz.importQError'), 'error'); return; }
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : null);
    if (!arr) { toast(t('quiz.importQError'), 'error'); return; }
    const valid = [];
    let skipped = 0;
    for (const q of arr) {
      const v = window.JPGen.validateQuestion(q);
      if (v.ok) valid.push({ ...q, source: q.source || 'official' });
      else skipped++;
    }
    const { added, updated } = Store.upsertQuestions(valid);
    toast(t('quiz.importQStats', { added, updated, skipped }), skipped ? 'error' : 'success', 5000);
    refreshBank();
  }

  function exportQuestions() {
    download(`nihongo-questions-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({
      kind: 'nihongo-questions', version: 1, exportedAt: new Date().toISOString(), questions: Store.questions(),
    }, null, 2));
    toast(t('toast.downloaded'), 'success');
  }

  /* ---------------- init ---------------- */
  function init() {
    els.area = $('#quizArea');
    els.genLessons = $('#genLessons');
    els.bankList = $('#bankList');
    els.bankMeta = $('#bankMeta');

    $$('.seg-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

    // giữ lựa chọn bài học ở panel sinh câu qua các lần re-render
    els.genLessons.addEventListener('change', e => {
      const input = e.target.closest('input[data-lesson]');
      if (!input) return;
      if (input.checked) state.genUnchecked.delete(input.dataset.lesson);
      else state.genUnchecked.add(input.dataset.lesson);
    });

    // config bindings
    $$('#panelPlay input[data-source]').forEach(cb => cb.addEventListener('change', () => {
      if (cb.checked) state.cfg.sources.add(cb.dataset.source);
      else state.cfg.sources.delete(cb.dataset.source);
    }));
    $('#fYear').addEventListener('change', e => { state.cfg.year = e.target.value; });
    $('#fSection').addEventListener('change', e => { state.cfg.section = e.target.value; });
    $('#fCount').addEventListener('change', e => { state.cfg.count = e.target.value; });
    $('#fShuffle').addEventListener('change', e => { state.cfg.shuffleQ = e.target.checked; });
    $('#btnStart').addEventListener('click', startQuiz);

    // bank
    $('#btnImportQ').addEventListener('click', () => $('#qFile').click());
    $('#qFile').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (f) await importQuestions(f);
      e.target.value = '';
    });
    $('#btnExportQ').addEventListener('click', exportQuestions);
    $('#btnGen').addEventListener('click', genRun);
    $('#btnGenClear').addEventListener('click', genClear);
    $('#qSearch').addEventListener('input', debounce(e => { state.qSearch = e.target.value; renderBankList(); }, 150));
    els.bankList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act="delQ"]');
      if (!btn) return;
      const id = btn.closest('.bank-row')?.dataset.id;
      if (!id) return;
      if (!confirm(t('quiz.confirmDeleteQ'))) return;
      Store.removeQuestions([id]);
      toast(t('dict.deleted', { name: id }), 'success');
      refreshBank();
    });

    refreshBank();

    // Test seam (e2e): trạng thái câu hỏi hiện tại — deterministic, không lộ logic.
    window.__JPQuizState = () => {
      if (!state.run) return null;
      const cur = state.run.questions[state.run.idx];
      if (!cur) return null;
      return {
        idx: state.run.idx + 1, total: state.run.total,
        id: cur.q.id, source: cur.q.source || 'sample',
        question: cur.q.question, prompt: cur.q.prompt || '',
        options: cur.opts.map(o => o.text),
        answerText: cur.opts.find(o => o.correct)?.text ?? '',
      };
    };
  }

  bootWithStore(init);
})();
