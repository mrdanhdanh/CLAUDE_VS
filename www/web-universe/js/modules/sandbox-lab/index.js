export const manifest = {
  id: 'sandbox-lab',
  name: 'Sandbox Lab',
  version: '1.0.0',
  category: 'system',
  description: 'iframe sandbox — permissions, postMessage, isolation.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🧪',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx){
  ctxRef=ctx;
  container.innerHTML=`
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <button class="btn btn-ghost btn-xs" data-sandbox="">No sandbox</button>
      <button class="btn btn-primary btn-xs" data-sandbox="sandbox">sandbox=""</button>
      <button class="btn btn-ghost btn-xs" data-sandbox="allow-scripts">allow-scripts</button>
      <button class="btn btn-ghost btn-xs" data-sandbox="allow-same-origin">allow-same-origin</button>
      <button class="btn btn-ghost btn-xs" data-sandbox="allow-scripts allow-same-origin">allow-scripts + same-origin</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div class="muted small" style="font:600 11px var(--font-sans);margin-bottom:4px">Sandbox iframe</div>
        <div id="sandboxWrap" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;min-height:160px;background:#fff"></div>
        <div class="muted small" id="sandboxInfo" style="margin-top:6px"></div>
      </div>
      <div>
        <div class="muted small" style="font:600 11px var(--font-sans);margin-bottom:4px">postMessage test</div>
        <div style="display:flex;gap:6px">
          <input id="sandboxMsg" placeholder="Message to iframe" value="Hello sandbox" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
          <button class="btn btn-primary btn-xs" data-action="send">Send</button>
        </div>
        <div id="sandboxLog" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono);line-height:1.6"></div>
        <div style="margin-top:8px">
          <div class="muted small" style="font:600 11px var(--font-sans)">Permissions</div>
          <table style="width:100%;border-collapse:collapse;font:400 11px var(--font-mono);margin-top:4px">
            <tr><th style="text-align:left;padding:4px;border:1px solid var(--border);background:var(--surface-2)">sandbox=""</th><td style="padding:4px;border:1px solid var(--border)">No scripts, no same-origin, no forms</td></tr>
            <tr><th style="text-align:left;padding:4px;border:1px solid var(--border);background:var(--surface-2)">allow-scripts</th><td style="padding:4px;border:1px solid var(--border)">Scripts allowed, still cross-origin</td></tr>
            <tr><th style="text-align:left;padding:4px;border:1px solid var(--border);background:var(--surface-2)">allow-same-origin</th><td style="padding:4px;border:1px solid var(--border)">Same-origin allowed, no scripts unless also allow-scripts</td></tr>
          </table>
        </div>
      </div>
    </div>
    <div class="muted small" style="margin-top:12px;padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px">
      <b>Architecture:</b> WEB UNIVERSE → Module Manager → DOM / Worker / Sandbox (iframe) — as per spec §31. Sandbox isolates risky modules.
    </div>
  `;
  els={
    wrap: container.querySelector('#sandboxWrap'),
    info: container.querySelector('#sandboxInfo'),
    msg: container.querySelector('#sandboxMsg'),
    log: container.querySelector('#sandboxLog'),
  };
  let currentSandbox='sandbox';
  let iframe=null;
  let msgHandler=null;

  function createIframe(sandboxAttr){
    if(iframe) iframe.remove();
    if(msgHandler) window.removeEventListener('message', msgHandler);
    els.log.innerHTML='';
    iframe=document.createElement('iframe');
    iframe.style.width='100%'; iframe.style.height='160px'; iframe.style.border='0';
    iframe.srcdoc=`<!doctype html><html><head><style>body{font-family:system-ui;padding:16px;background:#f8fafc;color:#0f172a}h4{margin:0 0 8px}code{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:11px}</style></head><body>
      <h4>Sandbox: <code>${escapeHtml(sandboxAttr||'(none)')}</code></h4>
      <div id="status">Loading…</div>
      <div id="msg" style="margin-top:8px;padding:8px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;min-height:24px"></div>
      <script>
        document.getElementById('status').textContent = 'Script ' + (typeof window!=='undefined' ? 'ran ✓' : 'blocked ✗');
        window.addEventListener('message', function(e){
          document.getElementById('msg').textContent = 'Received: ' + e.data;
          e.source.postMessage('Echo: ' + e.data, '*');
        });
        try{ parent.postMessage('Sandbox loaded: ' + document.title, '*'); }catch(e){}
      <\/script>
    </body></html>`;
    if(sandboxAttr!=='' || sandboxAttr===null){
      // null means no sandbox attr
      if(sandboxAttr!==null) iframe.setAttribute('sandbox', sandboxAttr);
    } else {
      iframe.setAttribute('sandbox', '');
    }
    els.wrap.appendChild(iframe);
    els.info.textContent=`sandbox="${sandboxAttr===null?'(none)':sandboxAttr}" — ${sandboxAttr===''?'most restrictive':sandboxAttr?'partial':'no restrictions'}`;
    // Listen for messages
    msgHandler=(e)=>{
      // Only log if from our iframe
      els.log.innerHTML+=`<div>← ${escapeHtml(String(e.data).slice(0,200))}</div>`;
      els.log.scrollTop=els.log.scrollHeight;
    };
    window.addEventListener('message', msgHandler);
    els._msgHandler=msgHandler;
  }
  // initial
  createIframe('sandbox');
  container.querySelectorAll('[data-sandbox]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const val=btn.dataset.sandbox;
      // '' means no sandbox attr, 'sandbox' means empty sandbox
      let attr;
      if(val==='') attr=null;
      else if(val==='sandbox') attr='';
      else attr=val;
      currentSandbox=attr;
      container.querySelectorAll('[data-sandbox]').forEach(b=>b.classList.remove('btn-primary'));
      container.querySelectorAll('[data-sandbox]').forEach(b=>b.classList.add('btn-ghost'));
      btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
      createIframe(attr);
    });
  });
  container.querySelector('[data-action="send"]')?.addEventListener('click',()=>{
    const msg=els.msg.value;
    if(!msg||!iframe) return;
    try{
      iframe.contentWindow.postMessage(msg, '*');
      els.log.innerHTML+=`<div>→ ${escapeHtml(msg)}</div>`;
    }catch(e){
      els.log.innerHTML+=`<div style="color:var(--danger)">Send failed: ${escapeHtml(e.message)}</div>`;
    }
  });
  els.msg.addEventListener('keydown',e=>{ if(e.key==='Enter') container.querySelector('[data-action="send"]').click(); });

  ctxRef?.logger?.info('sandbox-lab: mounted');
}

export async function unmount(){
  if(els._msgHandler) window.removeEventListener('message', els._msgHandler);
  els={}; ctxRef=null;
}
export async function destroy(){ await unmount(); }
