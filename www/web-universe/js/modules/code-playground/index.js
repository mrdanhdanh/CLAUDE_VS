export const manifest = {
  id: 'code-playground',
  name: 'Code Playground',
  version: '1.0.0',
  category: 'text',
  description: 'HTML/CSS/JS live preview + console, error display, reset.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '💻',
};

let els = {};
let ctxRef = null;
let activeTab = 'html';
let autoRun = false;
let autoTimer = null;
let messageHandler = null;

const STORAGE_KEY = 'web-universe:code-playground';
const DEFAULTS = {
  html: '<h1>Hello WEB UNIVERSE</h1>\n<p>Edit HTML/CSS/JS and click <b>Run</b> to preview.</p>\n<button onclick="greet()">Click me</button>',
  css: 'body { font-family: system-ui; padding: 24px; background: #f8fafc; color: #0f172a; }\nh1 { color: #6366f1; }\nbutton { background: #6366f1; color: white; border: 0; padding: 8px 16px; border-radius: 8px; cursor: pointer; }\nbutton:hover { background: #4f46e5; }',
  js: 'function greet() {\n  console.log("Hello from playground!");\n  document.body.insertAdjacentHTML("beforeend", "<p>✓ JS ran at " + new Date().toLocaleTimeString() + "</p>");\n}\nconsole.log("Playground ready — click the button!");',
};

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function buildSrcDoc(html, css, js) {
  // Inject console capture + error handling
  const capture = `
<script>
(function(){
  function send(type, args){
    try { parent.postMessage({ source: 'code-playground', type, args: args.map(a => {
      try { return typeof a==='object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); }
    }) }, '*'); } catch(e){}
  }
  const origLog = console.log, origWarn = console.warn, origError = console.error;
  console.log = function(){ origLog.apply(console, arguments); send('log', [].slice.call(arguments)); };
  console.warn = function(){ origWarn.apply(console, arguments); send('warn', [].slice.call(arguments)); };
  console.error = function(){ origError.apply(console, arguments); send('error', [].slice.call(arguments)); };
  window.addEventListener('error', function(e){ send('error', [e.message + ' at ' + (e.filename||'') + ':' + (e.lineno||'')]); });
  window.addEventListener('unhandledrejection', function(e){ send('error', ['Unhandled: ' + (e.reason && e.reason.message || e.reason)]); });
})();
<\/script>`;
  const style = css ? `<style>${css}</style>` : '';
  const body = html || '';
  // JS wrapped in try/catch
  const script = js ? `<script>try {\n${js}\n} catch(e){ console.error(e.message); parent.postMessage({source:'code-playground',type:'error',args:[e.message]},'*'); }<\/script>` : '';
  return `<!doctype html><html><head><meta charset="utf-8">${style}${capture}</head><body>${body}${script}</body></html>`;
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  // Restore
  let saved = null;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) saved = JSON.parse(raw); } catch {}
  const htmlVal = saved?.html ?? DEFAULTS.html;
  const cssVal = saved?.css ?? DEFAULTS.css;
  const jsVal = saved?.js ?? DEFAULTS.js;

  container.innerHTML = `
    <div class="cp-toolbar">
      <div class="cp-tabs" role="tablist" aria-label="Code tabs">
        <button class="cp-tab active" data-tab="html" role="tab" aria-selected="true">HTML</button>
        <button class="cp-tab" data-tab="css" role="tab" aria-selected="false">CSS</button>
        <button class="cp-tab" data-tab="js" role="tab" aria-selected="false">JS</button>
      </div>
      <div class="cp-actions">
        <label class="toggle small"><input type="checkbox" id="cpAutoRun" /> Auto-run</label>
        <button class="btn btn-primary btn-sm" data-action="run">▶ Run</button>
        <button class="btn btn-ghost btn-sm" data-action="reset">Reset</button>
      </div>
    </div>
    <div class="cp-layout">
      <div class="cp-editor-wrap">
        <textarea class="cp-editor" id="cpHtml" aria-label="HTML editor" spellcheck="false" placeholder="HTML…"></textarea>
        <textarea class="cp-editor hidden" id="cpCss" aria-label="CSS editor" spellcheck="false" placeholder="CSS…"></textarea>
        <textarea class="cp-editor hidden" id="cpJs" aria-label="JS editor" spellcheck="false" placeholder="JavaScript…"></textarea>
        <div class="cp-hint muted small">Tab inserts 2 spaces · Ctrl+Enter to Run</div>
      </div>
      <div class="cp-preview-wrap">
        <div class="cp-preview-head"><span>Preview</span><span class="muted small" id="cpPreviewHint">sandbox iframe</span></div>
        <iframe class="cp-iframe" id="cpIframe" sandbox="allow-scripts" title="Code preview" loading="lazy"></iframe>
      </div>
    </div>
    <div class="cp-console" role="log" aria-live="polite" aria-label="Console">
      <div class="cp-console-head"><span>Console</span><button class="btn btn-ghost btn-xs" data-action="clear-console">Clear</button></div>
      <div class="cp-console-body" id="cpConsole"></div>
    </div>
  `;

  els = {
    html: container.querySelector('#cpHtml'),
    css: container.querySelector('#cpCss'),
    js: container.querySelector('#cpJs'),
    iframe: container.querySelector('#cpIframe'),
    console: container.querySelector('#cpConsole'),
    autoRun: container.querySelector('#cpAutoRun'),
    tabs: [...container.querySelectorAll('.cp-tab')],
  };

  els.html.value = htmlVal;
  els.css.value = cssVal;
  els.js.value = jsVal;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: els.html.value, css: els.css.value, js: els.js.value })); } catch {}
  }
  function scheduleSave() {
    clearTimeout(autoTimer);
    // Don't use autoTimer for save — separate
    save();
    if (autoRun) {
      clearTimeout(els._autoRunTimer);
      els._autoRunTimer = setTimeout(run, 600);
    }
  }

  function logToConsole(type, args) {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12:false });
    const line = document.createElement('div');
    line.className = `cp-log cp-log-${type}`;
    const icon = type==='error' ? '✗' : type==='warn' ? '⚠' : '›';
    line.innerHTML = `<span class="cp-log-time">${time}</span><span class="cp-log-icon">${icon}</span><span class="cp-log-msg">${escapeHtml(args.join(' '))}</span>`;
    els.console.appendChild(line);
    els.console.scrollTop = els.console.scrollHeight;
  }
  function clearConsole() { els.console.innerHTML = '<div class="muted small" style="padding:8px">No logs yet — Run to see output.</div>'; }

  function run() {
    const html = els.html.value;
    const css = els.css.value;
    const js = els.js.value;
    const srcdoc = buildSrcDoc(html, css, js);
    // Clear console before run? Keep previous but add separator
    const sep = document.createElement('div');
    sep.className = 'cp-log-sep';
    sep.textContent = `— Run at ${new Date().toLocaleTimeString('vi-VN')} —`;
    els.console.appendChild(sep);
    els.console.scrollTop = els.console.scrollHeight;
    els.iframe.srcdoc = srcdoc;
    save();
    ctxRef?.logger?.debug('code-playground: run', { html: html.length, css: css.length, js: js.length });
  }

  // Tabs
  function switchTab(tab) {
    activeTab = tab;
    els.tabs.forEach(t => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });
    els.html.classList.toggle('hidden', tab!=='html');
    els.css.classList.toggle('hidden', tab!=='css');
    els.js.classList.toggle('hidden', tab!=='js');
    const activeEl = tab==='html' ? els.html : tab==='css' ? els.css : els.js;
    activeEl.focus();
  }
  els.tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Editors
  [els.html, els.css, els.js].forEach(el => {
    el.addEventListener('input', scheduleSave);
    el.addEventListener('keydown', (e) => {
      if (e.key==='Tab') {
        e.preventDefault();
        const start = el.selectionStart, end = el.selectionEnd;
        el.value = el.value.slice(0,start) + '  ' + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + 2;
        scheduleSave();
      }
      if ((e.ctrlKey||e.metaKey) && e.key==='Enter') {
        e.preventDefault(); run();
      }
    });
  });

  // Actions
  container.querySelector('[data-action="run"]')?.addEventListener('click', run);
  container.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
    els.html.value = DEFAULTS.html;
    els.css.value = DEFAULTS.css;
    els.js.value = DEFAULTS.js;
    save();
    clearConsole();
    run();
  });
  container.querySelector('[data-action="clear-console"]')?.addEventListener('click', clearConsole);
  els.autoRun.addEventListener('change', () => {
    autoRun = els.autoRun.checked;
    if (autoRun) run();
  });

  // Message from iframe
  messageHandler = (e) => {
    const data = e.data;
    if (!data || data.source !== 'code-playground') return;
    if (data.type==='log') logToConsole('log', data.args);
    else if (data.type==='warn') logToConsole('warn', data.args);
    else if (data.type==='error') logToConsole('error', data.args);
  };
  window.addEventListener('message', messageHandler);

  // Initial
  clearConsole();
  run();
  ctxRef?.logger?.info('code-playground: mounted');
}

export async function pause() {
  clearTimeout(autoTimer);
  if (els._autoRunTimer) clearTimeout(els._autoRunTimer);
}
export async function resume() {}
export async function unmount() {
  clearTimeout(autoTimer);
  if (els._autoRunTimer) clearTimeout(els._autoRunTimer);
  if (messageHandler) window.removeEventListener('message', messageHandler);
  messageHandler = null;
  els = {};
  ctxRef = null;
}
export async function destroy() { await unmount(); }
