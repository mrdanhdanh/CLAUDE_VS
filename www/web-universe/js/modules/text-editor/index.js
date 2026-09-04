export const manifest = {
  id: 'text-editor',
  name: 'Text Editor',
  version: '1.0.0',
  category: 'text',
  description: 'Plain text editor với word/char/line count, autosave, find/replace, undo/redo.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📝',
};

let els = {};
let autosaveTimer = null;
let ctxRef = null;

export async function load() {
  // preload hook — nothing heavy
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="module-toolbar">
      <button class="btn btn-ghost btn-sm" data-action="undo">↩ Undo</button>
      <button class="btn btn-ghost btn-sm" data-action="redo">↪ Redo</button>
      <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
      <button class="btn btn-ghost btn-sm" data-action="copy">Copy</button>
      <span class="muted small" id="teAutosaveHint" style="margin-left:auto;align-self:center">Autosave ✓</span>
    </div>
    <textarea class="te-textarea" id="teInput" placeholder="Gõ văn bản ở đây… Thử gõ vài dòng, F5 sẽ giữ lại (autosave)." aria-label="Text editor"></textarea>
    <div class="te-stats" id="teStats">
      <span>Words: <b id="teWords">0</b></span>
      <span>Chars: <b id="teChars">0</b></span>
      <span>Lines: <b id="teLines">0</b></span>
      <span>Chars (no space): <b id="teCharsNoSpace">0</b></span>
    </div>
    <div class="divider"></div>
    <div class="te-findbar">
      <input id="teFind" placeholder="Find" aria-label="Find" />
      <input id="teReplace" placeholder="Replace" aria-label="Replace" />
      <button class="btn btn-ghost btn-sm" data-action="find">Find</button>
      <button class="btn btn-primary btn-sm" data-action="replace">Replace All</button>
      <button class="btn btn-ghost btn-sm" data-action="selectAll">Select All</button>
    </div>
    <div class="muted small" id="teFindInfo" style="margin-top:8px;min-height:18px"></div>
  `;

  els = {
    input: container.querySelector('#teInput'),
    words: container.querySelector('#teWords'),
    chars: container.querySelector('#teChars'),
    lines: container.querySelector('#teLines'),
    charsNoSpace: container.querySelector('#teCharsNoSpace'),
    find: container.querySelector('#teFind'),
    replace: container.querySelector('#teReplace'),
    findInfo: container.querySelector('#teFindInfo'),
    hint: container.querySelector('#teAutosaveHint'),
  };

  // Restore from localStorage
  try {
    const saved = localStorage.getItem('web-universe:text-editor');
    if (saved) els.input.value = saved;
  } catch {}

  const updateStats = () => {
    const text = els.input.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text ? text.split('\n').length : 0;
    const noSpace = text.replace(/\s/g, '').length;
    els.words.textContent = words;
    els.chars.textContent = chars;
    els.lines.textContent = lines;
    els.charsNoSpace.textContent = noSpace;
  };

  const scheduleAutosave = () => {
    els.hint.textContent = 'Saving…';
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try { localStorage.setItem('web-universe:text-editor', els.input.value); } catch {}
      els.hint.textContent = 'Autosave ✓';
      ctxRef?.logger?.debug('text-editor: autosaved', { chars: els.input.value.length });
    }, 500);
  };

  els.input.addEventListener('input', () => { updateStats(); scheduleAutosave(); });
  updateStats();

  // Toolbar
  container.querySelector('[data-action="undo"]')?.addEventListener('click', () => document.execCommand('undo'));
  container.querySelector('[data-action="redo"]')?.addEventListener('click', () => document.execCommand('redo'));
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => { els.input.value = ''; updateStats(); scheduleAutosave(); els.input.focus(); });
  container.querySelector('[data-action="copy"]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(els.input.value); ctxRef?.logger?.info('text-editor: copied'); } catch {}
  });
  container.querySelector('[data-action="selectAll"]')?.addEventListener('click', () => { els.input.focus(); els.input.select(); });

  const doFind = () => {
    const q = els.find.value;
    if (!q) { els.findInfo.textContent = ''; return; }
    const text = els.input.value;
    const count = (text.match(new RegExp(escapeReg(q), 'g')) || []).length;
    els.findInfo.textContent = count ? `Found ${count} match(es) for "${q}"` : `No matches for "${q}"`;
    // highlight by selecting first occurrence
    const idx = text.indexOf(q);
    if (idx !== -1) { els.input.focus(); els.input.setSelectionRange(idx, idx + q.length); }
  };
  const doReplace = () => {
    const q = els.find.value;
    const r = els.replace.value;
    if (!q) return;
    const before = els.input.value;
    const after = before.split(q).join(r);
    els.input.value = after;
    updateStats(); scheduleAutosave();
    els.findInfo.textContent = `Replaced — ${before.length} → ${after.length} chars`;
  };
  container.querySelector('[data-action="find"]')?.addEventListener('click', doFind);
  container.querySelector('[data-action="replace"]')?.addEventListener('click', doReplace);
  els.find.addEventListener('keydown', (e) => { if (e.key === 'Enter') doFind(); });
  els.replace.addEventListener('keydown', (e) => { if (e.key === 'Enter') doReplace(); });

  // Keyboard: Ctrl+Z/Y handled by browser
  ctxRef?.logger?.info('text-editor: mounted');
}

export async function pause() {
  // pause autosave timer
  clearTimeout(autosaveTimer);
}

export async function resume() {
  // nothing
}

export async function unmount() {
  clearTimeout(autosaveTimer);
  autosaveTimer = null;
  els = {};
  ctxRef = null;
}

export async function destroy() {
  await unmount();
}

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
