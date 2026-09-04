export const manifest = {
  id: 'network-lab',
  name: 'Network Lab',
  version: '1.0.0',
  category: 'network',
  description: 'Fetch, Request Inspector, WebSocket, Streaming — with abort/timeout/retry.',
  dependencies: [],
  permissions: ['network'],
  lazy: true,
  icon: '🌐',
};

let els = {};
let ctxRef = null;
let activeTab = 'fetch';
let ws = null;
let wsHistory = [];
let abortController = null;
let fetchHistory = [];

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function saveHistory() {
  try { localStorage.setItem('web-universe:network-lab', JSON.stringify({ fetchHistory: fetchHistory.slice(-20), wsHistory: wsHistory.slice(-50) })); } catch {}
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  // Restore history
  try {
    const raw = localStorage.getItem('web-universe:network-lab');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.fetchHistory)) fetchHistory = parsed.fetchHistory;
      if (Array.isArray(parsed.wsHistory)) wsHistory = parsed.wsHistory;
    }
  } catch {}

  container.innerHTML = `
    <div class="network-tabs" role="tablist" aria-label="Network tabs">
      <button class="network-tab active" data-tab="fetch" role="tab" aria-selected="true">Fetch</button>
      <button class="network-tab" data-tab="ws" role="tab" aria-selected="false">WebSocket</button>
      <button class="network-tab" data-tab="stream" role="tab" aria-selected="false">Streaming</button>
    </div>

    <div class="network-pane active" data-pane="fetch">
      <div class="fetch-form">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <select id="fetchMethod" aria-label="Method" style="height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:600 12px var(--font-mono)">
            <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
          </select>
          <input id="fetchUrl" placeholder="https://api.example.com/data" value="https://jsonplaceholder.typicode.com/posts/1" aria-label="URL" style="flex:1;min-width:200px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-mono)" />
          <button class="btn btn-primary btn-sm" data-action="fetch-send">Send</button>
          <button class="btn btn-ghost btn-sm" data-action="fetch-abort">Abort</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <label class="muted small" style="font:600 11px var(--font-sans)">Headers (JSON)</label>
            <textarea id="fetchHeaders" placeholder='{"Content-Type":"application/json"}' aria-label="Headers" style="width:100%;min-height:60px;resize:vertical;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono)">{}</textarea>
          </div>
          <div>
            <label class="muted small" style="font:600 11px var(--font-sans)">Query Params (JSON)</label>
            <textarea id="fetchQuery" placeholder='{"page":"1"}' aria-label="Query" style="width:100%;min-height:60px;resize:vertical;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono)">{}</textarea>
          </div>
        </div>
        <div style="margin-top:8px">
          <label class="muted small" style="font:600 11px var(--font-sans)">Body (for POST/PUT/PATCH)</label>
          <textarea id="fetchBody" placeholder='{"title":"foo","body":"bar"}' aria-label="Body" style="width:100%;min-height:80px;resize:vertical;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono)"></textarea>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center">
          <label class="small" style="display:flex;align-items:center;gap:6px">Timeout <input type="number" id="fetchTimeout" value="10000" min="0" step="1000" style="width:90px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" /> ms</label>
          <label class="small" style="display:flex;align-items:center;gap:6px">Retry <input type="number" id="fetchRetry" value="0" min="0" max="3" style="width:60px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" /></label>
          <button class="btn btn-ghost btn-xs" data-action="fetch-curl">Copy as cURL</button>
          <button class="btn btn-ghost btn-xs" data-action="fetch-clear">Clear</button>
        </div>
      </div>
      <div class="request-inspector" id="fetchInspector" style="margin-top:12px"></div>
      <div class="fetch-history" id="fetchHistory" style="margin-top:8px"></div>
    </div>

    <div class="network-pane" data-pane="ws">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="wsUrl" placeholder="wss://echo.websocket.org or wss://ws.postman-echo.com/raw" value="wss://echo.websocket.org" aria-label="WebSocket URL" style="flex:1;min-width:200px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <button class="btn btn-primary btn-sm" data-action="ws-connect">Connect</button>
        <button class="btn btn-ghost btn-sm" data-action="ws-disconnect" disabled>Disconnect</button>
        <span class="badge" id="wsState" style="align-self:center">DISCONNECTED</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="wsMessage" placeholder="Message to send…" aria-label="Message" style="flex:1;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
        <button class="btn btn-primary btn-sm" data-action="ws-send" disabled>Send</button>
        <button class="btn btn-ghost btn-sm" data-action="ws-clear">Clear</button>
      </div>
      <div class="ws-history" id="wsHistory" style="margin-top:10px;max-height:300px;overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);padding:8px;font:400 11px var(--font-mono);line-height:1.6"></div>
    </div>

    <div class="network-pane" data-pane="stream">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="streamUrl" placeholder="https://api.example.com/stream" value="https://jsonplaceholder.typicode.com/posts" aria-label="Stream URL" style="flex:1;min-width:200px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <button class="btn btn-primary btn-sm" data-action="stream-start">Start Stream</button>
        <button class="btn btn-ghost btn-sm" data-action="stream-abort" disabled>Abort</button>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <div style="flex:1;height:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:999px;overflow:hidden"><div id="streamProgress" style="height:100%;width:0%;background:linear-gradient(90deg,var(--primary),var(--accent-cyan));transition:width .2s"></div></div>
        <span class="muted small" id="streamInfo">Idle</span>
      </div>
      <pre id="streamOutput" style="margin-top:8px;max-height:300px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all">No stream yet — click Start</pre>
    </div>
  `;

  els = {
    fetchMethod: container.querySelector('#fetchMethod'),
    fetchUrl: container.querySelector('#fetchUrl'),
    fetchHeaders: container.querySelector('#fetchHeaders'),
    fetchQuery: container.querySelector('#fetchQuery'),
    fetchBody: container.querySelector('#fetchBody'),
    fetchTimeout: container.querySelector('#fetchTimeout'),
    fetchRetry: container.querySelector('#fetchRetry'),
    fetchInspector: container.querySelector('#fetchInspector'),
    fetchHistory: container.querySelector('#fetchHistory'),
    wsUrl: container.querySelector('#wsUrl'),
    wsState: container.querySelector('#wsState'),
    wsMessage: container.querySelector('#wsMessage'),
    wsHistory: container.querySelector('#wsHistory'),
    streamUrl: container.querySelector('#streamUrl'),
    streamProgress: container.querySelector('#streamProgress'),
    streamInfo: container.querySelector('#streamInfo'),
    streamOutput: container.querySelector('#streamOutput'),
  };

  // Tabs
  container.querySelectorAll('.network-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.network-tab').forEach(b => {
        const active = b.dataset.tab===activeTab;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      container.querySelectorAll('.network-pane').forEach(p => p.classList.toggle('active', p.dataset.pane===activeTab));
    });
  });

  // Fetch
  function renderFetchHistory() {
    if (!els.fetchHistory) return;
    if (fetchHistory.length===0) {
      els.fetchHistory.innerHTML = '<div class="muted small">No history yet</div>';
      return;
    }
    els.fetchHistory.innerHTML = `<div style="font:600 11px var(--font-sans);margin-bottom:6px">History (${fetchHistory.length})</div>` + fetchHistory.slice(-10).reverse().map(h => `
      <div style="padding:6px 8px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;margin-bottom:4px;font:400 11px var(--font-mono);display:flex;justify-content:space-between;gap:8px">
        <span><b>${escapeHtml(h.method)}</b> ${escapeHtml(h.url.slice(0,60))} → <span style="color:${h.status>=200&&h.status<300?'var(--success)':'var(--danger)'}">${h.status}</span> ${h.time}ms</span>
        <span class="muted">${new Date(h.ts).toLocaleTimeString()}</span>
      </div>
    `).join('');
  }
  renderFetchHistory();

  container.querySelector('[data-action="fetch-send"]')?.addEventListener('click', async () => {
    const method = els.fetchMethod.value;
    let url = els.fetchUrl.value.trim();
    if (!url) { alert('Enter URL'); return; }
    let headers = {};
    let query = {};
    try { headers = JSON.parse(els.fetchHeaders.value || '{}'); } catch { alert('Headers JSON invalid'); return; }
    try { query = JSON.parse(els.fetchQuery.value || '{}'); } catch { alert('Query JSON invalid'); return; }
    // Append query
    const qs = new URLSearchParams(query).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    let body = els.fetchBody.value.trim() || undefined;
    // If body looks like JSON and method allows body, keep as is
    const timeout = parseInt(els.fetchTimeout.value,10) || 0;
    const retry = parseInt(els.fetchRetry.value,10) || 0;

    const inspector = els.fetchInspector;
    inspector.innerHTML = `<div style="padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)"><b>REQUEST</b><br/>Method: ${escapeHtml(method)}<br/>URL: ${escapeHtml(url)}<br/>Headers: ${escapeHtml(JSON.stringify(headers))}<br/>Body: ${escapeHtml(body||'—')}<br/><br/><i>Sending…</i></div>`;

    let lastError = null;
    let response = null;
    let timeMs = 0;
    for (let attempt=0; attempt<=retry; attempt++) {
      abortController = new AbortController();
      let timeoutId = null;
      if (timeout>0) timeoutId = setTimeout(()=> abortController.abort(), timeout);
      const start = performance.now();
      try {
        const opts = { method, headers, signal: abortController.signal };
        if (body && !['GET','HEAD'].includes(method)) opts.body = body;
        response = await fetch(url, opts);
        timeMs = Math.round(performance.now() - start);
        if (timeoutId) clearTimeout(timeoutId);
        break;
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = e;
        timeMs = Math.round(performance.now() - start);
        if (e.name==='AbortError') break;
        if (attempt < retry) {
          inspector.innerHTML += `<div class="muted small">Retry ${attempt+1}/${retry}…</div>`;
          await new Promise(r=> setTimeout(r, 500));
          continue;
        }
      }
    }

    if (!response) {
      const msg = lastError ? lastError.message : 'Unknown error';
      const isAbort = lastError?.name==='AbortError';
      inspector.innerHTML = `<div style="padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font:400 11px var(--font-mono)"><b style="color:var(--danger)">ERROR</b><br/>${escapeHtml(isAbort ? 'Aborted / Timeout' : msg)}<br/>Time: ${timeMs}ms</div>`;
      fetchHistory.push({ method, url, status: 0, time: timeMs, ts: Date.now(), error: msg });
      renderFetchHistory(); saveHistory();
      return;
    }

    // Read response
    let respBody = '';
    let respHeaders = {};
    try {
      response.headers.forEach((v,k)=> respHeaders[k]=v);
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await response.json();
        respBody = JSON.stringify(json, null, 2);
      } else {
        respBody = await response.text();
      }
    } catch (e) { respBody = 'Failed to read body: ' + e.message; }

    const size = new Blob([respBody]).size;
    const sizeStr = size < 1024 ? size + ' B' : (size/1024).toFixed(1) + ' KB';
    inspector.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)">
          <b>REQUEST</b><br/>Method: ${escapeHtml(method)}<br/>URL: ${escapeHtml(url)}<br/>Headers: ${escapeHtml(JSON.stringify(headers))}<br/>Body: ${escapeHtml(body||'—')}
        </div>
        <div style="padding:12px;background:${response.ok?'rgba(16,185,129,.08)':'rgba(239,68,68,.08)'};border:1px solid ${response.ok?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'};border-radius:8px;font:400 11px var(--font-mono)">
          <b style="color:${response.ok?'var(--success)':'var(--danger)'}">RESPONSE</b><br/>Status: ${response.status} ${escapeHtml(response.statusText)}<br/>Time: ${timeMs}ms<br/>Size: ${sizeStr}<br/>Headers: ${escapeHtml(JSON.stringify(respHeaders).slice(0,300))}<br/>
        </div>
      </div>
      <pre style="margin-top:8px;max-height:300px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all">${escapeHtml(respBody.slice(0, 8000))}</pre>
    `;
    fetchHistory.push({ method, url, status: response.status, time: timeMs, ts: Date.now() });
    renderFetchHistory(); saveHistory();
  });

  container.querySelector('[data-action="fetch-abort"]')?.addEventListener('click', () => {
    if (abortController) abortController.abort();
  });
  container.querySelector('[data-action="fetch-curl"]')?.addEventListener('click', async () => {
    const method = els.fetchMethod.value;
    const url = els.fetchUrl.value.trim();
    let headers = {};
    try { headers = JSON.parse(els.fetchHeaders.value||'{}'); } catch {}
    const body = els.fetchBody.value.trim();
    let curl = `curl -X ${method} "${url}"`;
    for (const [k,v] of Object.entries(headers)) curl += ` -H "${k}: ${v}"`;
    if (body) curl += ` -d '${body.replace(/'/g,"'\\''")}'`;
    try { await navigator.clipboard.writeText(curl); } catch {}
    alert('cURL copied:\n' + curl.slice(0,300));
  });
  container.querySelector('[data-action="fetch-clear"]')?.addEventListener('click', () => {
    els.fetchInspector.innerHTML = '';
    els.fetchUrl.value = 'https://jsonplaceholder.typicode.com/posts/1';
    els.fetchBody.value = '';
  });

  // WebSocket
  function setWsState(state) {
    if (!els.wsState) return;
    els.wsState.textContent = state;
    els.wsState.style.background = state==='CONNECTED' ? 'rgba(16,185,129,.15)' : state==='CONNECTING' ? 'rgba(245,158,11,.15)' : 'var(--surface-2)';
    els.wsState.style.color = state==='CONNECTED' ? 'var(--success)' : state==='CONNECTING' ? 'var(--warning)' : 'var(--text-2)';
    const isConnected = state==='CONNECTED';
    container.querySelector('[data-action="ws-connect"]').disabled = isConnected;
    container.querySelector('[data-action="ws-disconnect"]').disabled = !isConnected;
    container.querySelector('[data-action="ws-send"]').disabled = !isConnected;
  }
  function addWsLog(dir, msg) {
    const time = new Date().toLocaleTimeString();
    const entry = { dir, msg: String(msg).slice(0,500), time, ts: Date.now() };
    wsHistory.push(entry);
    if (wsHistory.length>100) wsHistory.shift();
    saveHistory();
    renderWsHistory();
  }
  function renderWsHistory() {
    if (!els.wsHistory) return;
    if (wsHistory.length===0) {
      els.wsHistory.innerHTML = '<div class="muted small">No messages yet — connect and send</div>';
      return;
    }
    els.wsHistory.innerHTML = wsHistory.slice(-50).map(h => `
      <div style="padding:4px 6px;border-bottom:1px solid var(--border);display:flex;gap:8px">
        <span style="color:var(--text-3)">${h.time}</span>
        <span style="color:${h.dir==='sent'?'var(--primary)':h.dir==='received'?'var(--success)':'var(--warning)'};font-weight:700">${h.dir==='sent'?'→':h.dir==='received'?'←':'•'} ${h.dir}</span>
        <span style="word-break:break-all">${escapeHtml(h.msg)}</span>
      </div>
    `).join('');
    els.wsHistory.scrollTop = els.wsHistory.scrollHeight;
  }
  renderWsHistory();

  container.querySelector('[data-action="ws-connect"]')?.addEventListener('click', () => {
    const url = els.wsUrl.value.trim();
    if (!url) { alert('Enter WebSocket URL'); return; }
    if (ws) try{ ws.close(); }catch{}
    setWsState('CONNECTING');
    addWsLog('info', `Connecting to ${url}…`);
    try {
      ws = new WebSocket(url);
      ws.onopen = () => { setWsState('CONNECTED'); addWsLog('info', 'Connected ✓'); };
      ws.onmessage = (e) => { addWsLog('received', e.data); };
      ws.onclose = (e) => { setWsState('DISCONNECTED'); addWsLog('info', `Closed (code ${e.code})`); ws=null; };
      ws.onerror = () => { addWsLog('info', 'Error — check URL / CORS'); };
    } catch (e) {
      setWsState('DISCONNECTED');
      addWsLog('info', 'Failed: ' + e.message);
    }
  });
  container.querySelector('[data-action="ws-disconnect"]')?.addEventListener('click', () => {
    if (ws) { ws.close(); ws=null; }
    setWsState('DISCONNECTED');
  });
  container.querySelector('[data-action="ws-send"]')?.addEventListener('click', () => {
    const msg = els.wsMessage.value.trim();
    if (!msg) return;
    if (!ws || ws.readyState!==WebSocket.OPEN) { alert('Not connected'); return; }
    ws.send(msg);
    addWsLog('sent', msg);
    els.wsMessage.value='';
  });
  els.wsMessage?.addEventListener('keydown', (e)=> { if(e.key==='Enter') container.querySelector('[data-action="ws-send"]')?.click(); });
  container.querySelector('[data-action="ws-clear"]')?.addEventListener('click', () => { wsHistory=[]; renderWsHistory(); saveHistory(); });

  // Streaming
  let streamAbort = null;
  container.querySelector('[data-action="stream-start"]')?.addEventListener('click', async () => {
    const url = els.streamUrl.value.trim();
    if (!url) { alert('Enter URL'); return; }
    streamAbort = new AbortController();
    container.querySelector('[data-action="stream-start"]').disabled=true;
    container.querySelector('[data-action="stream-abort"]').disabled=false;
    els.streamOutput.textContent = 'Streaming…\n';
    els.streamInfo.textContent = 'Streaming…';
    els.streamProgress.style.width='10%';
    try {
      const res = await fetch(url, { signal: streamAbort.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No body stream — browser may not support streaming for this response');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let received = 0;
      const total = parseInt(res.headers.get('content-length')||'0',10);
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        els.streamOutput.textContent = text.slice(0, 8000) + (text.length>8000 ? '\n…truncated' : '');
        els.streamOutput.scrollTop = els.streamOutput.scrollHeight;
        if (total) {
          const pct = Math.min(100, Math.round(received/total*100));
          els.streamProgress.style.width = pct + '%';
          els.streamInfo.textContent = `${received} / ${total} bytes (${pct}%)`;
        } else {
          els.streamInfo.textContent = `${received} bytes`;
          els.streamProgress.style.width = Math.min(90, 10 + received/1000) + '%';
        }
      }
      els.streamProgress.style.width='100%';
      els.streamInfo.textContent = `Done — ${received} bytes`;
    } catch (e) {
      if (e.name==='AbortError') {
        els.streamInfo.textContent='Aborted';
        els.streamOutput.textContent += '\n[Aborted]';
      } else {
        els.streamInfo.textContent='Error: ' + e.message;
        els.streamOutput.textContent += '\n[Error] ' + e.message;
      }
    } finally {
      container.querySelector('[data-action="stream-start"]').disabled=false;
      container.querySelector('[data-action="stream-abort"]').disabled=true;
      streamAbort=null;
    }
  });
  container.querySelector('[data-action="stream-abort"]')?.addEventListener('click', () => {
    if (streamAbort) streamAbort.abort();
  });

  ctxRef?.logger?.info('network-lab: mounted');
}

export async function unmount() {
  if (ws) try{ ws.close(); }catch{}
  ws=null;
  if (abortController) try{ abortController.abort(); }catch{}
  abortController=null;
  els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
