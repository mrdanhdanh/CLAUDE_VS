export const manifest = {
  id: 'markdown',
  name: 'Markdown',
  version: '1.0.0',
  category: 'text',
  description: 'Markdown editor + live preview, heading navigation, export HTML/Markdown.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📄',
};

let els = {};
let ctxRef = null;
let debounceTimer = null;
let headings = [];

const STORAGE_KEY = 'web-universe:markdown';
const DEFAULT_MD = `# WEB UNIVERSE — Markdown

Welcome to **Markdown** live preview! Gõ bên trái, xem bên phải.

## Features

- **Bold**, *italic*, \`inline code\`, [link](https://example.com)
- Lists, blockquotes, code blocks, tables

### Code Block

\`\`\`js
console.log("Hello WEB UNIVERSE");
\`\`\`

### List

- Item one
- Item two
  - Nested item

1. First
2. Second

> Blockquote — trích dẫn hay.

---

| Feature | Status |
|---------|--------|
| Headings | ✓ |
| Bold/Italic | ✓ |
| Code | ✓ |

Try editing this text!
`;

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,40) || 'heading';
}

function parseMarkdown(md) {
  // Extract code blocks first
  const codeBlocks = [];
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code.trim())}</code></pre>`);
    return `@@CODEBLOCK_${idx}@@`;
  });
  // Escape HTML (but keep code blocks placeholders)
  // We escape line by line, but placeholders are safe
  const lines = html.split('\n');
  let out = [];
  let inList = false;
  let listType = null; // 'ul' | 'ol'
  let inBlockquote = false;
  let tableBuffer = [];

  function flushList() {
    if (inList) { out.push(`</${listType}>`); inList = false; listType = null; }
  }
  function flushBlockquote() {
    if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false; }
  }
  function flushTable() {
    if (tableBuffer.length >= 2) {
      // Check if second row is separator
      const sep = tableBuffer[1];
      if (/^[\s|:-]+$/.test(sep) && sep.includes('-')) {
        const headers = tableBuffer[0].split('|').map(s=>s.trim()).filter(Boolean);
        out.push('<table><thead><tr>' + headers.map(h=>`<th>${parseInline(h)}</th>`).join('') + '</tr></thead><tbody>');
        for (let i=2;i<tableBuffer.length;i++) {
          const cells = tableBuffer[i].split('|').map(s=>s.trim()).filter(Boolean);
          if (cells.length===0) continue;
          out.push('<tr>' + cells.map(c=>`<td>${parseInline(c)}</td>`).join('') + '</tr>');
        }
        out.push('</tbody></table>');
      } else {
        // Not a table, render as paragraphs
        for (const row of tableBuffer) out.push(`<p>${parseInline(row)}</p>`);
      }
    } else if (tableBuffer.length===1) {
      out.push(`<p>${parseInline(tableBuffer[0])}</p>`);
    }
    tableBuffer = [];
  }

  for (let i=0;i<lines.length;i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Code block placeholder
    if (trimmed.startsWith('@@CODEBLOCK_')) {
      flushList(); flushBlockquote(); flushTable();
      const idx = parseInt(trimmed.match(/@@CODEBLOCK_(\d+)@@/)?.[1]||'0',10);
      out.push(codeBlocks[idx]||'');
      continue;
    }
    // Empty line
    if (trimmed === '') {
      flushList(); flushBlockquote(); flushTable();
      continue;
    }
    // Table row detection
    if (trimmed.includes('|') && trimmed.startsWith('|') || (trimmed.includes('|') && tableBuffer.length>0)) {
      // Could be table — buffer it
      if (trimmed.includes('|')) {
        tableBuffer.push(trimmed);
        // Look ahead: if next line is not table-like, flush
        const next = lines[i+1]?.trim() || '';
        if (!next.includes('|') || next==='') {
          // Will flush on next non-table line or at end
          // But check if we have at least header+sep
          if (tableBuffer.length>=2 && /^[\s|:-]+$/.test(tableBuffer[1]||'') ) {
            // keep buffering until non-table
          } else if (tableBuffer.length===1 && !next.includes('|')) {
            flushTable();
          }
        }
        continue;
      }
    }
    if (tableBuffer.length>0) flushTable();

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList(); flushBlockquote();
      out.push('<hr/>');
      continue;
    }
    // Heading
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      flushList(); flushBlockquote();
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      const id = slugify(text) + '-' + i;
      headings.push({ level, text, id });
      out.push(`<h${level} id="${id}">${parseInline(text)}</h${level}>`);
      continue;
    }
    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList();
      if (!inBlockquote) { out.push('<blockquote>'); inBlockquote = true; }
      const content = trimmed.replace(/^>\s?/, '');
      out.push(`<p>${parseInline(content)}</p>`);
      // Check if next line is not blockquote
      const next = lines[i+1]?.trim() || '';
      if (!next.startsWith('>')) { flushBlockquote(); }
      continue;
    }
    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushBlockquote();
      if (!inList || listType!=='ul') { flushList(); out.push('<ul>'); inList=true; listType='ul'; }
      out.push(`<li>${parseInline(ulMatch[1])}</li>`);
      const next = lines[i+1]?.trim() || '';
      if (!next.match(/^[-*]\s+/) && !next.match(/^\d+\.\s+/)) { flushList(); }
      continue;
    }
    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushBlockquote();
      if (!inList || listType!=='ol') { flushList(); out.push('<ol>'); inList=true; listType='ol'; }
      out.push(`<li>${parseInline(olMatch[1])}</li>`);
      const next = lines[i+1]?.trim() || '';
      if (!next.match(/^\d+\.\s+/) && !next.match(/^[-*]\s+/)) { flushList(); }
      continue;
    }
    // Paragraph
    flushList(); flushBlockquote();
    out.push(`<p>${parseInline(trimmed)}</p>`);
  }
  flushList(); flushBlockquote(); flushTable();
  let result = out.join('\n');
  // Restore code blocks
  codeBlocks.forEach((block, idx) => {
    result = result.replace(`@@CODEBLOCK_${idx}@@`, block);
  });
  return result;
}

function parseInline(text) {
  // Escape first
  let s = escapeHtml(text);
  // Inline code `code`
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold **text** or __text__
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic *text* or _text_ (avoid already bold)
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/(?<!_) _([^_\n]+)_(?!_)/g, '<em>$1</em>');
  // Fix italic with single * (without lookbehind for compat)
  // Link [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Autolink <http...>
  s = s.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return s;
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  headings = [];
  container.innerHTML = `
    <div class="md-toolbar" role="toolbar" aria-label="Markdown toolbar">
      <button class="btn btn-ghost btn-xs" data-md="bold" aria-label="Bold" title="Bold (Ctrl+B)"><b>B</b></button>
      <button class="btn btn-ghost btn-xs" data-md="italic" aria-label="Italic" title="Italic (Ctrl+I)"><i>I</i></button>
      <button class="btn btn-ghost btn-xs" data-md="code" aria-label="Inline code" title="Inline code"><code>&lt;&gt;</code></button>
      <button class="btn btn-ghost btn-xs" data-md="h1" aria-label="Heading 1" title="Heading 1">H1</button>
      <button class="btn btn-ghost btn-xs" data-md="h2" aria-label="Heading 2" title="Heading 2">H2</button>
      <button class="btn btn-ghost btn-xs" data-md="link" aria-label="Link" title="Link">🔗</button>
      <button class="btn btn-ghost btn-xs" data-md="quote" aria-label="Quote" title="Quote">❝</button>
      <button class="btn btn-ghost btn-xs" data-md="ul" aria-label="Bullet list" title="Bullet list">• List</button>
      <button class="btn btn-ghost btn-xs" data-md="ol" aria-label="Ordered list" title="Ordered list">1. List</button>
      <button class="btn btn-ghost btn-xs" data-md="hr" aria-label="Horizontal rule" title="Horizontal rule">―</button>
      <span style="flex:1"></span>
      <button class="btn btn-ghost btn-xs" data-action="clear" aria-label="Clear">Clear</button>
      <button class="btn btn-ghost btn-xs" data-action="copy" aria-label="Copy markdown">Copy</button>
    </div>
    <div class="md-layout">
      <div class="md-editor-wrap">
        <textarea class="md-editor" id="mdEditor" placeholder="Gõ markdown ở đây…" aria-label="Markdown editor" spellcheck="false"></textarea>
        <div class="md-status"><span id="mdStats" class="muted small"></span><span id="mdSaveHint" class="muted small" style="margin-left:auto">Autosave ✓</span></div>
      </div>
      <div class="md-preview-wrap">
        <div class="md-preview" id="mdPreview" role="region" aria-label="Markdown preview"></div>
      </div>
    </div>
    <div class="md-footer">
      <div class="md-outline" id="mdOutline" aria-label="Heading navigation"></div>
      <div class="md-actions">
        <button class="btn btn-ghost btn-sm" data-action="export-md">Export .md</button>
        <button class="btn btn-primary btn-sm" data-action="export-html">Export HTML</button>
      </div>
    </div>
  `;

  els = {
    editor: container.querySelector('#mdEditor'),
    preview: container.querySelector('#mdPreview'),
    outline: container.querySelector('#mdOutline'),
    stats: container.querySelector('#mdStats'),
    hint: container.querySelector('#mdSaveHint'),
  };

  // Restore
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    els.editor.value = saved !== null ? saved : DEFAULT_MD;
  } catch { els.editor.value = DEFAULT_MD; }

  function updateStats() {
    const text = els.editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text ? text.split('\n').length : 0;
    els.stats.textContent = `${words} words · ${chars} chars · ${lines} lines`;
  }

  function render() {
    headings = [];
    const md = els.editor.value;
    if (!md.trim()) {
      els.preview.innerHTML = '<div class="muted small" style="padding:24px;text-align:center">Bắt đầu gõ markdown để xem preview…</div>';
      els.outline.innerHTML = '<span class="muted small">Chưa có heading</span>';
      return;
    }
    const html = parseMarkdown(md);
    els.preview.innerHTML = html;
    // Outline
    if (headings.length) {
      els.outline.innerHTML = headings.map(h => `<a href="#${h.id}" data-href="${h.id}" class="md-outline-item md-level-${h.level}">${escapeHtml(h.text)}</a>`).join('');
      els.outline.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const id = a.dataset.href;
          const target = els.preview.querySelector(`#${CSS.escape(id)}`);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // highlight
          els.outline.querySelectorAll('a').forEach(x=> x.classList.remove('active'));
          a.classList.add('active');
        });
      });
    } else {
      els.outline.innerHTML = '<span class="muted small">Chưa có heading</span>';
    }
  }

  function scheduleRender() {
    clearTimeout(debounceTimer);
    els.hint.textContent = 'Saving…';
    debounceTimer = setTimeout(() => {
      render();
      updateStats();
      try { localStorage.setItem(STORAGE_KEY, els.editor.value); } catch {}
      els.hint.textContent = 'Autosave ✓';
    }, 200);
  }

  els.editor.addEventListener('input', scheduleRender);
  // Sync scroll: editor scroll -> preview scroll proportionally
  els.editor.addEventListener('scroll', () => {
    const ratio = els.editor.scrollTop / Math.max(1, els.editor.scrollHeight - els.editor.clientHeight);
    els.preview.scrollTop = ratio * Math.max(0, els.preview.scrollHeight - els.preview.clientHeight);
  });

  // Toolbar
  function insertAtCursor(before, after='', placeholder='') {
    const el = els.editor;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end) || placeholder;
    const next = el.value.slice(0, start) + before + selected + after + el.value.slice(end);
    el.value = next;
    const cursor = start + before.length + selected.length + after.length;
    // If no selection, place cursor inside
    if (!el.value.slice(start,end)) {
      el.setSelectionRange(start + before.length, start + before.length + placeholder.length);
    } else {
      el.setSelectionRange(cursor, cursor);
    }
    el.focus();
    scheduleRender();
    // Immediate render for toolbar
    clearTimeout(debounceTimer);
    render(); updateStats();
    try { localStorage.setItem(STORAGE_KEY, el.value); } catch {}
  }

  container.querySelector('[data-md="bold"]')?.addEventListener('click', () => insertAtCursor('**','**','bold'));
  container.querySelector('[data-md="italic"]')?.addEventListener('click', () => insertAtCursor('*','*','italic'));
  container.querySelector('[data-md="code"]')?.addEventListener('click', () => insertAtCursor('`','`','code'));
  container.querySelector('[data-md="h1"]')?.addEventListener('click', () => insertAtCursor('# ','','Heading'));
  container.querySelector('[data-md="h2"]')?.addEventListener('click', () => insertAtCursor('## ','','Heading'));
  container.querySelector('[data-md="link"]')?.addEventListener('click', () => insertAtCursor('[','](https://example.com)','text'));
  container.querySelector('[data-md="quote"]')?.addEventListener('click', () => insertAtCursor('> ','','quote'));
  container.querySelector('[data-md="ul"]')?.addEventListener('click', () => insertAtCursor('- ','','item'));
  container.querySelector('[data-md="ol"]')?.addEventListener('click', () => insertAtCursor('1. ','','item'));
  container.querySelector('[data-md="hr"]')?.addEventListener('click', () => insertAtCursor('\n---\n','',''));

  // Actions
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    els.editor.value = '';
    scheduleRender();
    clearTimeout(debounceTimer); render(); updateStats();
    try { localStorage.setItem(STORAGE_KEY, ''); } catch {}
  });
  container.querySelector('[data-action="copy"]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(els.editor.value); ctxRef?.logger?.info('markdown: copied'); } catch {}
  });
  container.querySelector('[data-action="export-md"]')?.addEventListener('click', () => {
    const text = els.editor.value;
    if (!text.trim()) { ctxRef?.logger?.warn('markdown: nothing to export'); return; }
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'document.md'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });
  container.querySelector('[data-action="export-html"]')?.addEventListener('click', () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Export</title><style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.6}pre{background:#0f172a;color:#e2e8f0;padding:16px;border-radius:8px;overflow:auto}code{background:#f1f5f9;padding:2px 6px;border-radius:4px}blockquote{border-left:3px solid #6366f1;padding-left:12px;color:#64748b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc}</style></head><body>${els.preview.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'document.html'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });

  // Keyboard shortcuts
  els.editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='b') { e.preventDefault(); insertAtCursor('**','**','bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='i') { e.preventDefault(); insertAtCursor('*','*','italic'); }
    if (e.key==='Tab') { e.preventDefault(); insertAtCursor('  ','',''); }
  });

  // Initial render
  render();
  updateStats();
  ctxRef?.logger?.info('markdown: mounted');
}

export async function pause() { clearTimeout(debounceTimer); }
export async function resume() {}
export async function unmount() {
  clearTimeout(debounceTimer);
  debounceTimer = null;
  els = {};
  headings = [];
  ctxRef = null;
}
export async function destroy() { await unmount(); }
