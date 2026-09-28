/* =============================================================
   Nihongo N5 — Trang Từ điển (quản lý bài học + từ vựng)
   ID dòng duy nhất, không tái sử dụng — xóa là không hồi lại.
   ============================================================= */
(() => {
  'use strict';
  const { $, t, esc, deaccent, Store, toast, download, debounce, UI, bootWithStore, openDialog } = window.JPCore;

  const state = {
    lessonId: UI.get('dictLesson', null),
    search: '',
    sort: { col: null, dir: 1 },
    editingWordId: null,
    editingLessonId: null,
  };

  const els = {};

  /* ---------------- lessons ---------------- */
  function renderLessons() {
    const lessons = Store.lessons();
    if (!lessons.length) {
      els.lessonRows.innerHTML = `<p class="empty small">${esc(t('dict.noLessons'))}</p>`;
      state.lessonId = null;
      return;
    }
    if (!state.lessonId || !Store.getLesson(state.lessonId)) {
      state.lessonId = lessons[0].id;
      UI.set('dictLesson', state.lessonId);
    }
    els.lessonRows.innerHTML = lessons.map(l => `
      <div class="lesson-row ${l.id === state.lessonId ? 'active' : ''}" data-id="${esc(l.id)}">
        <button class="pick" type="button" data-act="pick" title="${esc(l.name)}">${esc(l.name)}</button>
        <span class="cnt">${esc(t('learn.words', { n: Store.countWords(l.id) }))}</span>
        <button class="btn btn-ghost btn-sm" type="button" data-act="editLesson" data-i18n-aria="dict.editLesson">✎</button>
        <button class="btn btn-ghost btn-sm" type="button" data-act="delLesson" data-i18n-aria="ui.delete">✕</button>
      </div>`).join('');
    els.contentTitle.textContent = Store.getLesson(state.lessonId)?.name || '—';
  }

  /* ---------------- table ---------------- */
  function viewRows() {
    let rows = Store.words(state.lessonId);
    const q = state.search.trim();
    if (q) {
      const qq = deaccent(q);
      rows = rows.filter(w =>
        deaccent(w.kanji).includes(qq) || deaccent(w.kana).includes(qq) || deaccent(w.vi).includes(qq) ||
        (w.examples || []).some(ex => deaccent(ex.jp).includes(qq) || deaccent(ex.vi).includes(qq))
      );
    }
    const { col, dir } = state.sort;
    if (col) {
      rows.sort((a, b) => {
        const av = col === 'kanji' ? (a.kanji || a.kana) : a[col];
        const bv = col === 'kanji' ? (b.kanji || b.kana) : b[col];
        return String(av || '').localeCompare(String(bv || ''), col === 'vi' ? 'vi' : 'ja') * dir;
      });
    }
    return rows;
  }

  function exPreview(w) {
    const ex = (w.examples || [])[0];
    if (!ex) return '<span class="muted">—</span>';
    return `<span class="jp">${esc(ex.jp)}</span>${ex.vi ? `<br>${esc(ex.vi)}` : ''}`;
  }

  function renderSortHeaders() {
    for (const [thId, col] of [['#thKanji', 'kanji'], ['#thKana', 'kana'], ['#thVi', 'vi']]) {
      const th = $(thId);
      if (state.sort.col === col) th.setAttribute('aria-sort', state.sort.dir === 1 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    }
  }

  function renderTable() {
    if (!state.lessonId) {
      els.tbody.innerHTML = `<tr><td colspan="6">${esc(t('dict.selectLesson'))}</td></tr>`;
      els.tableMeta.textContent = '';
      return;
    }
    const total = Store.countWords(state.lessonId);
    const rows = viewRows();
    els.tableMeta.textContent = t('dict.rowCount', { x: rows.length, y: total });
    els.tbody.innerHTML = rows.length
      ? rows.map((w, i) => `<tr data-id="${esc(w.id)}">
          <td>${i + 1}</td>
          <td class="cell-kanji jp">${esc(w.kanji) || '<span class="muted">—</span>'}</td>
          <td class="cell-kana jp">${esc(w.kana)}</td>
          <td>${esc(w.vi)}</td>
          <td class="cell-ex">${exPreview(w)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm btn-ghost" type="button" data-act="edit" data-i18n-aria="ui.edit">✎</button>
              <button class="btn btn-sm btn-ghost" type="button" data-act="del" data-i18n-aria="ui.delete">✕</button>
            </div>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="6"><span class="muted">${esc(t('dict.emptyLesson'))}</span></td></tr>`;
    renderSortHeaders();
    window.JPCore.applyI18n(els.tbody);
  }

  function renderAll() {
    renderLessons();
    renderTable();
  }

  /* ---------------- word dialog ---------------- */
  function exRow(ex = { jp: '', vi: '' }) {
    const row = document.createElement('div');
    row.className = 'ex-row';
    row.innerHTML = `
      <input class="input jp ex-jp-input" placeholder="日本語の文" value="${esc(ex.jp)}" />
      <input class="input ex-vi-input" placeholder="Nghĩa tiếng Việt" value="${esc(ex.vi)}" />
      <button class="btn btn-ghost btn-sm" type="button" data-act="delEx" data-i18n-aria="ui.delete">✕</button>`;
    row.querySelector('[data-act="delEx"]').addEventListener('click', () => row.remove());
    return row;
  }

  function openWordDlg(word) {
    state.editingWordId = word ? word.id : null;
    $('#wordDlgTitle').textContent = t(word ? 'dict.wordEditor' : 'dict.newWord');
    $('#wordIdChip').innerHTML = word
      ? `${esc(t('dict.irreversible'))} <span class="id-chip">${esc(word.id)}</span>`
      : esc(t('dict.irreversible'));
    $('#wKanji').value = word?.kanji || '';
    $('#wKana').value = word?.kana || '';
    $('#wVi').value = word?.vi || '';
    els.exList.innerHTML = '';
    const list = (word?.examples && word.examples.length) ? word.examples : [{ jp: '', vi: '' }];
    list.forEach(ex => els.exList.appendChild(exRow(ex)));
    openDialog($('#wordDlg'));
    $('#wKanji').focus();
  }

  function saveWord() {
    if (!state.lessonId) return;
    const kanji = $('#wKanji').value.trim();
    const kana = $('#wKana').value.trim();
    const vi = $('#wVi').value.trim();
    if (!kanji && !kana) { toast(t('dict.errKana'), 'error'); return; }
    if (!vi) { toast(t('dict.errVi'), 'error'); return; }
    const examples = Array.from(els.exList.querySelectorAll('.ex-row'))
      .map(row => ({ jp: row.querySelector('.ex-jp-input').value.trim(), vi: row.querySelector('.ex-vi-input').value.trim() }))
      .filter(e => e.jp || e.vi);
    if (state.editingWordId) Store.updateWord(state.lessonId, state.editingWordId, { kanji, kana, vi, examples });
    else Store.addWord(state.lessonId, { kanji, kana, vi, examples });
    $('#wordDlg').close();
    toast(t('dict.saved'), 'success');
    renderAll();
  }

  /* ---------------- lesson dialog ---------------- */
  function openLessonDlg(lesson) {
    state.editingLessonId = lesson ? lesson.id : null;
    $('#lessonDlgTitle').textContent = t(lesson ? 'dict.editLesson' : 'dict.newLesson');
    $('#lName').value = lesson?.name || '';
    $('#lSource').value = lesson?.source || '';
    $('#lDesc').value = lesson?.description || '';
    openDialog($('#lessonDlg'));
    $('#lName').focus();
  }

  function saveLesson() {
    const name = $('#lName').value.trim();
    if (!name) { toast(t('dict.name'), 'error'); return; }
    const data = { name, source: $('#lSource').value, description: $('#lDesc').value };
    if (state.editingLessonId) {
      Store.updateLesson(state.editingLessonId, data);
    } else {
      const l = Store.addLesson(data);
      state.lessonId = l.id;
      UI.set('dictLesson', l.id);
    }
    $('#lessonDlg').close();
    toast(t('dict.saved'), 'success');
    renderAll();
  }

  /* ---------------- import / export ---------------- */
  function openImportDlg() {
    $('#importTitle').textContent = state.lessonId
      ? t('dict.importTitle', { name: Store.getLesson(state.lessonId)?.name || '' })
      : t('dict.import');
    $('#importFile').value = '';
    openDialog($('#importDlg'));
  }

  async function runImport() {
    const file = $('#importFile').files[0];
    if (!file) { toast(t('dict.pickFile')); return; }
    let data = null;
    try { data = JSON.parse(await file.text()); }
    catch { toast(t('dict.importError'), 'error'); return; }
    const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'merge';
    let stats = null;
    if (Array.isArray(data)) {
      if (!state.lessonId) { toast(t('dict.selectLesson')); return; }
      stats = Store.importWords(state.lessonId, data, mode);
    } else if (data && typeof data === 'object' && Array.isArray(data.lessons) && data.words) {
      stats = Store.importAll(data, mode);
    } else if (data && typeof data === 'object' && Array.isArray(data.words)) {
      if (!state.lessonId) { toast(t('dict.selectLesson')); return; }
      stats = Store.importWords(state.lessonId, data.words, mode);
    }
    if (!stats) { toast(t('dict.importError'), 'error'); return; }
    if (state.lessonId && !Store.getLesson(state.lessonId)) state.lessonId = Store.lessons()[0]?.id || null;
    toast(t('dict.importStats', { added: stats.added || 0, updated: stats.updated || 0, skipped: stats.skipped || 0 }), 'success', 5000);
    $('#importDlg').close();
    renderAll();
  }

  function exportLesson() {
    const lesson = Store.getLesson(state.lessonId);
    if (!lesson) return;
    download(`nihongo-${lesson.id}.json`, JSON.stringify({
      kind: 'nihongo-lesson', version: 1, exportedAt: new Date().toISOString(),
      lesson, words: Store.words(lesson.id),
    }, null, 2));
    toast(t('toast.downloaded'), 'success');
  }

  function exportAll() {
    download(`nihongo-backup-${new Date().toISOString().slice(0, 10)}.json`, Store.exportAll());
    toast(t('toast.downloaded'), 'success');
  }

  /* ---------------- init ---------------- */
  function wireDialogs() {
    document.querySelectorAll('dialog.modal').forEach(dlg => {
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
      dlg.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => dlg.close()));
    });
  }

  function init() {
    els.lessonRows = $('#lessonRows');
    els.tbody = $('#tbody');
    els.tableMeta = $('#tableMeta');
    els.contentTitle = $('#contentTitle');
    els.exList = $('#exList');

    wireDialogs();

    // lesson list actions
    els.lessonRows.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      const row = e.target.closest('.lesson-row');
      if (!row) return;
      const id = row.dataset.id;
      const lesson = Store.getLesson(id);
      if (!lesson) return;
      if (!btn || btn.dataset.act === 'pick') {
        state.lessonId = id;
        UI.set('dictLesson', id);
        renderLessons();
        renderTable();
        return;
      }
      if (btn.dataset.act === 'editLesson') openLessonDlg(lesson);
      if (btn.dataset.act === 'delLesson') {
        const n = Store.countWords(id);
        if (!confirm(t('dict.confirmDeleteLesson', { name: lesson.name, n }))) return;
        Store.deleteLesson(id);
        if (state.lessonId === id) state.lessonId = Store.lessons()[0]?.id || null;
        toast(t('dict.deletedLesson', { name: lesson.name }), 'success');
        renderAll();
      }
    });

    $('#btnNewLesson').addEventListener('click', () => openLessonDlg(null));
    $('#lessonSave').addEventListener('click', saveLesson);

    // table actions
    els.tbody.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const tr = e.target.closest('tr');
      const id = tr?.dataset.id;
      if (!id) return;
      const word = Store.words(state.lessonId).find(w => w.id === id);
      if (!word) return;
      if (btn.dataset.act === 'edit') openWordDlg(word);
      if (btn.dataset.act === 'del') {
        const name = word.kanji || word.kana;
        if (!confirm(t('dict.confirmDeleteWord', { name }))) return;
        Store.deleteWord(state.lessonId, id);
        toast(t('dict.deleted', { name }), 'success');
        renderAll();
      }
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.sort;
        state.sort = state.sort.col === col ? { col, dir: -state.sort.dir } : { col, dir: 1 };
        renderTable();
      });
    });

    $('#searchInput').addEventListener('input', debounce(e => {
      state.search = e.target.value;
      renderTable();
    }, 150));

    // toolbar
    $('#btnAddRow').addEventListener('click', () => {
      if (!state.lessonId) { toast(t('dict.selectLesson')); return; }
      openWordDlg(null);
    });
    $('#btnImport').addEventListener('click', openImportDlg);
    $('#importRun').addEventListener('click', runImport);
    $('#btnExportLesson').addEventListener('click', exportLesson);
    $('#btnExportAll').addEventListener('click', exportAll);
    $('#btnRestore').addEventListener('click', async () => {
      if (!confirm(t('dict.confirmRestore'))) return;
      await Store.reset();
      state.lessonId = Store.lessons()[0]?.id || null;
      UI.set('dictLesson', state.lessonId);
      toast(t('dict.saved'), 'success');
      renderAll();
    });

    // word dialog
    $('#addEx').addEventListener('click', () => els.exList.appendChild(exRow()));
    $('#wordSave').addEventListener('click', saveWord);

    renderAll();
  }

  bootWithStore(init);
})();
