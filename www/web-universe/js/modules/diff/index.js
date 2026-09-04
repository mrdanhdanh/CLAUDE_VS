export const manifest = {
  id: 'diff',
  name: 'Diff',
  version: '1.0.0',
  category: 'devtools',
  description: 'Text/JSON diff — side-by-side view, stats, swap, copy.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '⇄',
};

let els = {};
let ctxRef = null;
let mode = 'text'; // 'text' | 'json'
let debounceTimer = null;

const STORAGE_KEY = 'web-universe:diff';
const DEFAULT_LEFT = `WEB UNIVERSE
Core Runtime
Module Manager
Window Manager
Resource Monitor`;
const DEFAULT_RIGHT = `WEB UNIVERSE
Core Runtime v2
Module Manager
Window System
Resource Monitor
Snapshot System`;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// LCS-based line diff
function diffLines(aLines, bLines) {
  const n = aLines.length, m = bLines.length;
  // DP table for LCS length — optimize memory: only need prev row for length, but need backtrack
  // For n,m <= 500, full table is ok (250k cells)
  if (n > 800 || m > 800) {
    // Fallback: simple line-by-line compare for large inputs
    const ops = [];
    const maxLen = Math.max(n,m);
    for (let i=0;i<maxLen;i++) {
      if (i >= n) ops.push({ type:'added', b: bLines[i], bIdx: i });
      else if (i >= m) ops.push({ type:'removed', a: aLines[i], aIdx: i });
      else if (aLines[i]===bLines[i]) ops.push({ type:'equal', a: aLines[i], b: bLines[i], aIdx:i, bIdx:i });
      else { ops.push({ type:'removed', a: aLines[i], aIdx:i }); ops.push({ type:'added', b: bLines[i], bIdx:i }); }
    }
    return ops;
  }
  // Full DP
  const dp = Array.from({length: n+1}, () => new Array(m+1).fill(0));
  for (let i=1;i<=n;i++) {
    for (let j=1;j<=m;j++) {
      if (aLines[i-1]===bLines[j-1]) dp[i][j] = dp[i-1][j-1]+1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  // Backtrack
  const ops = [];
  let i=n, j=m;
  while (i>0 || j>0) {
    if (i>0 && j>0 && aLines[i-1]===bLines[j-1]) {
      ops.push({ type:'equal', a: aLines[i-1], b: bLines[j-1], aIdx:i-1, bIdx:j-1 });
      i--; j--;
    } else if (j>0 && (i===0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.push({ type:'added', b: bLines[j-1], bIdx:j-1 });
      j--;
    } else if (i>0) {
      ops.push({ type:'removed', a: aLines[i-1], aIdx:i-1 });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

function renderDiff(ops) {
  if (ops.length===0) return '<div class="muted small" style="padding:16px;text-align:center">No content — enter text on both sides.</div>';
  let html = '<div class="diff-view">';
  let added=0, removed=0, equal=0;
  for (const op of ops) {
    if (op.type==='equal') { equal++; html += `<div class="diff-line equal"><span class="diff-gutter"> </span><span class="diff-text">${escapeHtml(op.a)}</span></div>`; }
    else if (op.type==='added') { added++; html += `<div class="diff-line added"><span class="diff-gutter">+</span><span class="diff-text">${escapeHtml(op.b)}</span></div>`; }
    else if (op.type==='removed') { removed++; html += `<div class="diff-line removed"><span class="diff-gutter">−</span><span class="diff-text">${escapeHtml(op.a)}</span></div>`; }
  }
  html += '</div>';
  return { html, stats: { added, removed, equal, total: ops.length } };
}

function renderSideBySide(aLines, bLines, ops) {
  // Build aligned rows: for each op, show left and right
  let rows = '';
  let added=0, removed=0, equal=0;
  for (const op of ops) {
    if (op.type==='equal') {
      equal++;
      rows += `<div class="diff-row equal"><div class="diff-cell left"><span class="diff-gutter"> </span>${escapeHtml(op.a)}</div><div class="diff-cell right"><span class="diff-gutter"> </span>${escapeHtml(op.b)}</div></div>`;
    } else if (op.type==='added') {
      added++;
      rows += `<div class="diff-row added"><div class="diff-cell left empty"></div><div class="diff-cell right"><span class="diff-gutter">+</span>${escapeHtml(op.b)}</div></div>`;
    } else if (op.type==='removed') {
      removed++;
      rows += `<div class="diff-row removed"><div class="diff-cell left"><span class="diff-gutter">−</span>${escapeHtml(op.a)}</div><div class="diff-cell right empty"></div></div>`;
    }
  }
  if (!rows) rows = '<div class="muted small" style="padding:16px;text-align:center;grid-column:1/-1">No content</div>';
  return { html: `<div class="diff-sidebyside">${rows}</div>`, stats: { added, removed, equal, total: ops.length } };
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  // Restore
  let saved = null;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) saved = JSON.parse(raw); } catch {}
  const leftVal = saved?.left ?? DEFAULT_LEFT;
  const rightVal = saved?.right ?? DEFAULT_RIGHT;
  mode = saved?.mode || 'text';

  container.innerHTML = `
    <div class="diff-toolbar">
      <div class="diff-mode" role="tablist" aria-label="Diff mode">
        <button class="diff-mode-btn ${mode==='text'?'active':''}" data-mode="text" role="tab" aria-selected="${mode==='text'}">Text</button>
        <button class="diff-mode-btn ${mode==='json'?'active':''}" data-mode="json" role="tab" aria-selected="${mode==='json'}">JSON</button>
      </div>
      <div class="diff-actions">
        <button class="btn btn-ghost btn-xs" data-action="swap" title="Swap left/right">⇄ Swap</button>
        <button class="btn btn-ghost btn-xs" data-action="clear">Clear</button>
        <button class="btn btn-ghost btn-xs" data-action="copy-diff">Copy diff</button>
      </div>
      <div class="diff-stats" id="diffStats"></div>
    </div>
    <div class="diff-inputs">
      <div class="diff-input-wrap">
        <div class="diff-input-head"><span>Left</span><span class="muted small" id="diffLeftInfo"></span></div>
        <textarea class="diff-input" id="diffLeft" aria-label="Left input" spellcheck="false" placeholder="Paste left text or JSON…"></textarea>
      </div>
      <div class="diff-input-wrap">
        <div class="diff-input-head"><span>Right</span><span class="muted small" id="diffRightInfo"></span></div>
        <textarea class="diff-input" id="diffRight" aria-label="Right input" spellcheck="false" placeholder="Paste right text or JSON…"></textarea>
      </div>
    </div>
    <div class="diff-hint muted small" id="diffHint" style="margin-top:8px;min-height:18px"></div>
    <div class="diff-output" id="diffOutput" role="region" aria-label="Diff result"></div>
  `;

  els = {
    left: container.querySelector('#diffLeft'),
    right: container.querySelector('#diffRight'),
    output: container.querySelector('#diffOutput'),
    stats: container.querySelector('#diffStats'),
    hint: container.querySelector('#diffHint'),
    leftInfo: container.querySelector('#diffLeftInfo'),
    rightInfo: container.querySelector('#diffRightInfo'),
  };

  els.left.value = leftVal;
  els.right.value = rightVal;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: els.left.value, right: els.right.value, mode })); } catch {}
  }

  function doDiff() {
    let aText = els.left.value;
    let bText = els.right.value;
    let hint = '';

    if (mode==='json') {
      let aPretty = null, bPretty = null;
      let aOk=true, bOk=true;
      try { aPretty = JSON.stringify(JSON.parse(aText), null, 2); } catch(e){ aOk=false; }
      try { bPretty = JSON.stringify(JSON.parse(bText), null, 2); } catch(e){ bOk=false; }
      if (!aOk || !bOk) {
        hint = 'JSON invalid — showing text diff. Fix JSON to see pretty diff.';
        // fall through to text diff with raw
      } else {
        aText = aPretty;
        bText = bPretty;
        hint = 'JSON pretty-printed before diff.';
      }
    }

    const aLines = aText.split('\n');
    const bLines = bText.split('\n');
    // Handle empty
    const aEmpty = aText.trim()==='';
    const bEmpty = bText.trim()==='';
    if (aEmpty && bEmpty) {
      els.output.innerHTML = '<div class="muted small" style="padding:16px;text-align:center">Enter text on both sides to see diff.</div>';
      els.stats.innerHTML = '';
      els.hint.textContent = hint;
      return;
    }

    const ops = diffLines(aEmpty?[]:aLines, bEmpty?[]:bLines);
    const { html, stats } = renderSideBySide(aEmpty?[]:aLines, bEmpty?[]:bLines, ops);
    els.output.innerHTML = html;
    els.stats.innerHTML = `<span class="diff-stat added">+${stats.added}</span> <span class="diff-stat removed">−${stats.removed}</span> <span class="diff-stat equal">= ${stats.equal}</span>`;
    els.hint.textContent = hint;
    els.leftInfo.textContent = `${aLines.length} lines`;
    els.rightInfo.textContent = `${bLines.length} lines`;
  }

  function scheduleDiff() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { doDiff(); save(); }, 250);
  }

  els.left.addEventListener('input', scheduleDiff);
  els.right.addEventListener('input', scheduleDiff);

  // Mode
  container.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      container.querySelectorAll('[data-mode]').forEach(b => {
        const active = b.dataset.mode===mode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      doDiff(); save();
    });
  });

  // Actions
  container.querySelector('[data-action="swap"]')?.addEventListener('click', () => {
    const tmp = els.left.value;
    els.left.value = els.right.value;
    els.right.value = tmp;
    doDiff(); save();
  });
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    els.left.value = '';
    els.right.value = '';
    doDiff(); save();
  });
  container.querySelector('[data-action="copy-diff"]')?.addEventListener('click', async () => {
    const text = els.output.innerText || '';
    if (!text.trim()) return;
    try { await navigator.clipboard.writeText(text); ctxRef?.logger?.info('diff: copied'); } catch {}
  });

  // Initial
  doDiff();
  ctxRef?.logger?.info('diff: mounted');
}

export async function pause() { clearTimeout(debounceTimer); }
export async function resume() {}
export async function unmount() {
  clearTimeout(debounceTimer);
  debounceTimer = null;
  els = {};
  ctxRef = null;
}
export async function destroy() { await unmount(); }
