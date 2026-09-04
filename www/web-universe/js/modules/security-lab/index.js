export const manifest = {
  id: 'security-lab',
  name: 'Security Lab',
  version: '1.0.0',
  category: 'security',
  description: 'XSS, CSP, CORS, iframe sandbox, same-origin, cookies, storage — educational.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🔒',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx){
  ctxRef=ctx;
  container.innerHTML=`
    <div class="security-grid">
      <div class="security-card">
        <h4>🛡 XSS — Escaping</h4>
        <p class="muted small">User input must be escaped before innerHTML</p>
        <input id="xssInput" placeholder='<script>alert(1)</script>' value='<img src=x onerror=alert(1)>' style="width:100%;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <div style="display:flex;gap:6px;margin-top:6px">
          <button class="btn btn-ghost btn-xs" data-action="xss-unsafe">Unsafe innerHTML</button>
          <button class="btn btn-primary btn-xs" data-action="xss-safe">Safe (escaped)</button>
        </div>
        <div id="xssOutput" style="margin-top:8px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;min-height:40px;font:400 11px var(--font-mono);word-break:break-all"></div>
        <div class="muted small" style="margin-top:4px">Unsafe executes script — safe shows escaped text</div>
      </div>

      <div class="security-card">
        <h4>🧹 Sanitization</h4>
        <p class="muted small">Strip tags, keep text</p>
        <input id="sanInput" placeholder="<b>hello</b> <script>evil</script>" value="<b>hello</b> <script>alert(1)</script> world" style="width:100%;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <button class="btn btn-ghost btn-xs" data-action="sanitize" style="margin-top:6px">Sanitize</button>
        <div id="sanOutput" style="margin-top:8px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;min-height:32px;font:400 11px var(--font-mono)"></div>
      </div>

      <div class="security-card">
        <h4>📜 CSP Concept</h4>
        <p class="muted small">Content Security Policy — restrict script sources</p>
        <pre style="background:#0f172a;color:#e2e8f0;padding:8px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap">Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  object-src 'none';</pre>
        <div class="muted small">This page CSP: <code id="cspInfo"></code></div>
      </div>

      <div class="security-card">
        <h4>🌐 CORS Concept</h4>
        <p class="muted small">Cross-Origin Resource Sharing — server controls access</p>
        <button class="btn btn-ghost btn-xs" data-action="cors-test">Test CORS (jsonplaceholder)</button>
        <div id="corsOutput" style="margin-top:8px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;min-height:32px;font:400 11px var(--font-mono)"></div>
      </div>

      <div class="security-card">
        <h4>🖼 iframe Sandbox</h4>
        <p class="muted small">Sandbox restricts iframe capabilities</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-xs" data-action="iframe-none">No sandbox</button>
          <button class="btn btn-ghost btn-xs" data-action="iframe-sandbox">sandbox=\"\"</button>
          <button class="btn btn-ghost btn-xs" data-action="iframe-allow">sandbox=\"allow-scripts\"</button>
        </div>
        <div id="iframeDemo" style="margin-top:8px;min-height:60px;border:1px solid var(--border);border-radius:8px;overflow:hidden"></div>
      </div>

      <div class="security-card">
        <h4>🔗 Same-Origin</h4>
        <p class="muted small">Origin = protocol + host + port</p>
        <div style="font:400 11px var(--font-mono);background:var(--surface-2);padding:8px;border-radius:8px">
          <div>Current: <b id="originCurrent"></b></div>
          <div>Same-origin: <b>https://example.com:443</b> vs <b>https://example.com:443/path</b> → <span style="color:var(--success)">✓ Same</span></div>
          <div>Cross-origin: <b>https://example.com</b> vs <b>https://other.com</b> → <span style="color:var(--danger)">✗ Different</span></div>
        </div>
      </div>

      <div class="security-card">
        <h4>🍪 Cookie Flags</h4>
        <p class="muted small">HttpOnly, Secure, SameSite</p>
        <pre style="background:#0f172a;color:#e2e8f0;padding:8px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap">Set-Cookie: session=abc123;
  HttpOnly; Secure;
  SameSite=Strict;
  Path=/; Max-Age=3600</pre>
        <div class="muted small">Current cookies: <code id="cookieInfo"></code></div>
        <button class="btn btn-ghost btn-xs" data-action="cookie-set">Set Demo Cookie</button>
      </div>

      <div class="security-card">
        <h4>💾 Storage Isolation</h4>
        <p class="muted small">Each origin has isolated storage</p>
        <div style="font:400 11px var(--font-mono);background:var(--surface-2);padding:8px;border-radius:8px">
          <div>Origin: <b id="storageOrigin"></b></div>
          <div>LocalStorage isolated: <span style="color:var(--success)">✓ Yes</span></div>
          <div>IndexedDB isolated: <span style="color:var(--success)">✓ Yes</span></div>
          <div>Cookies isolated: <span style="color:var(--success)">✓ Yes</span></div>
        </div>
      </div>

      <div class="security-card">
        <h4>🔐 Permissions</h4>
        <p class="muted small">Check permission status</p>
        <div id="permList" style="display:flex;flex-direction:column;gap:4px"></div>
      </div>
    </div>
    <div class="muted small" style="margin-top:12px;padding:10px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:8px">⚠ Educational only — no exploit tools. All demos are safe and isolated.</div>
  `;
  els={
    xssInput: container.querySelector('#xssInput'),
    xssOutput: container.querySelector('#xssOutput'),
    sanInput: container.querySelector('#sanInput'),
    sanOutput: container.querySelector('#sanOutput'),
    cspInfo: container.querySelector('#cspInfo'),
    corsOutput: container.querySelector('#corsOutput'),
    iframeDemo: container.querySelector('#iframeDemo'),
    originCurrent: container.querySelector('#originCurrent'),
    cookieInfo: container.querySelector('#cookieInfo'),
    storageOrigin: container.querySelector('#storageOrigin'),
    permList: container.querySelector('#permList'),
  };
  // XSS
  container.querySelector('[data-action="xss-unsafe"]')?.addEventListener('click',()=>{
    const val=els.xssInput.value;
    // UNSAFE — but we sanitize script execution by not actually allowing script? For demo, we show what would happen
    // We use innerHTML but browser will not execute script in this context due to CSP? We'll show warning
    els.xssOutput.innerHTML = `<div style="color:var(--danger)">⚠ Unsafe innerHTML:</div><div style="border:1px dashed var(--danger);padding:6px;border-radius:6px;margin-top:4px">${val}</div><div class="muted small" style="margin-top:4px">If this were real, script would execute. Here it is rendered as HTML (check Elements).</div>`;
    // Actually set innerHTML to show effect (but script won't run due to innerHTML not executing script tags)
    const demo=document.createElement('div');
    demo.innerHTML=val;
    els.xssOutput.appendChild(demo);
  });
  container.querySelector('[data-action="xss-safe"]')?.addEventListener('click',()=>{
    const val=els.xssInput.value;
    els.xssOutput.textContent='';
    const safe=document.createElement('div');
    safe.textContent=val;
    safe.style.padding='6px'; safe.style.border='1px solid var(--success)'; safe.style.borderRadius='6px'; safe.style.marginTop='4px';
    els.xssOutput.innerHTML='<div style="color:var(--success)">✓ Safe (textContent, escaped):</div>';
    els.xssOutput.appendChild(safe);
  });
  // Sanitize
  container.querySelector('[data-action="sanitize"]')?.addEventListener('click',()=>{
    const val=els.sanInput.value;
    const div=document.createElement('div');
    div.textContent=val;
    // Simple sanitize: strip tags via textContent
    els.sanOutput.textContent=div.textContent;
    els.sanOutput.innerHTML=`<div>Original: <code>${escapeHtml(val)}</code></div><div>Sanitized: <b>${escapeHtml(div.textContent)}</b></div>`;
  });
  // CSP
  if(els.cspInfo){
    const csp=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    els.cspInfo.textContent=csp?csp.content:'No CSP meta (default browser policy)';
  }
  // CORS
  container.querySelector('[data-action="cors-test"]')?.addEventListener('click', async()=>{
    els.corsOutput.textContent='Fetching…';
    try{
      const res=await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const json=await res.json();
      els.corsOutput.innerHTML=`<span style="color:var(--success)">✓ CORS allowed</span> — Status ${res.status}<br/><code>${escapeHtml(JSON.stringify(json).slice(0,120))}…</code><div class="muted small" style="margin-top:4px">Server sent Access-Control-Allow-Origin: *</div>`;
    }catch(e){
      els.corsOutput.innerHTML=`<span style="color:var(--danger)">✗ CORS blocked or network error</span><br/>${escapeHtml(e.message)}`;
    }
  });
  // iframe
  function setIframe(sandbox){
    els.iframeDemo.innerHTML='';
    const iframe=document.createElement('iframe');
    iframe.srcdoc='<p style="font-family:sans-serif;padding:12px">Hello from iframe<br/><script>document.write(\"<small>Script ran: \"+ (sandbox?\"sandboxed\":\"no sandbox\") +\"</small>\")</script></p>';
    iframe.style.width='100%'; iframe.style.height='80px'; iframe.style.border='0';
    if(sandbox!==null) iframe.setAttribute('sandbox', sandbox);
    els.iframeDemo.appendChild(iframe);
    els.iframeDemo.insertAdjacentHTML('beforeend', `<div class="muted small" style="padding:4px">sandbox=\"${escapeHtml(sandbox===null?'(none)':sandbox)}\"</div>`);
  }
  container.querySelector('[data-action="iframe-none"]')?.addEventListener('click',()=> setIframe(null));
  container.querySelector('[data-action="iframe-sandbox"]')?.addEventListener('click',()=> setIframe(''));
  container.querySelector('[data-action="iframe-allow"]')?.addEventListener('click',()=> setIframe('allow-scripts'));
  setIframe('');
  // Same-origin
  if(els.originCurrent) els.originCurrent.textContent=location.origin;
  // Cookie
  if(els.cookieInfo) els.cookieInfo.textContent=document.cookie||'(none)';
  container.querySelector('[data-action="cookie-set"]')?.addEventListener('click',()=>{
    document.cookie='demo=hello; SameSite=Lax; Path=/; Max-Age=3600';
    if(els.cookieInfo) els.cookieInfo.textContent=document.cookie||'(none)';
  });
  // Storage
  if(els.storageOrigin) els.storageOrigin.textContent=location.origin;
  // Permissions
  const perms=['geolocation','notifications','camera','microphone','clipboard-read','clipboard-write'];
  if(els.permList){
    for(const name of perms){
      const row=document.createElement('div');
      row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;font:400 11px var(--font-mono)';
      row.innerHTML=`<span>${escapeHtml(name)}</span><span class="muted small" id="perm-${name}">checking…</span>`;
      els.permList.appendChild(row);
      // query
      if(navigator.permissions){
        navigator.permissions.query({name: name==='clipboard-read'||name==='clipboard-write'?name:'geolocation'}).then(r=>{
          const el=row.querySelector(`#perm-${name}`);
          if(el) el.textContent=r.state;
        }).catch(()=>{
          const el=row.querySelector(`#perm-${name}`);
          if(el) el.textContent='unknown';
        });
      } else {
        const el=row.querySelector(`#perm-${name}`);
        if(el) el.textContent='API not supported';
      }
    }
    // Actually query each correctly
    els.permList.innerHTML='';
    for(const name of perms){
      const row=document.createElement('div');
      row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;font:400 11px var(--font-mono)';
      row.innerHTML=`<span>${escapeHtml(name)}</span><span class="muted small" id="perm-${name}">checking…</span>`;
      els.permList.appendChild(row);
      (async()=>{
        try{
          if(!navigator.permissions) throw new Error('no permissions API');
          // Map name to permission descriptor
          let desc={name};
          if(name==='clipboard-read'||name==='clipboard-write') desc={name};
          else if(name==='camera'||name==='microphone') desc={name};
          else desc={name};
          const res=await navigator.permissions.query(desc);
          const el=row.querySelector(`#perm-${name}`);
          if(el) el.textContent=res.state;
          res.onchange=()=>{ if(el) el.textContent=res.state; };
        }catch(e){
          const el=row.querySelector(`#perm-${name}`);
          if(el) el.textContent='unknown';
        }
      })();
    }
  }

  ctxRef?.logger?.info('security-lab: mounted');
}

export async function unmount(){ els={}; ctxRef=null; }
export async function destroy(){ await unmount(); }
