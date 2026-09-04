export const manifest = {
  id: 'debug-lab',
  name: 'Debug Lab',
  version: '1.0.0',
  category: 'system',
  description: 'Debug mode — lifecycle, events, workers, network, storage inspector.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🐛',
};

let els = {};
let ctxRef = null;
let eventLog = [];
let lifecycleLog = [];
let unsubscribers = [];

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx){
  ctxRef=ctx;
  const isDevMode = ctx.state?.get()?.ui?.devMode || false;

  container.innerHTML=`
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center">
      <label class="toggle small"><input type="checkbox" id="debugToggle" ${isDevMode?'checked':''} /> Debug Mode</label>
      <span class="muted small">Shows lifecycle, events, workers, network, storage</span>
      <button class="btn btn-ghost btn-xs" data-action="clear">Clear Logs</button>
      <button class="btn btn-ghost btn-xs" data-action="export">Export Logs</button>
    </div>
    <div class="debug-tabs" role="tablist" aria-label="Debug tabs">
      <button class="debug-tab active" data-tab="lifecycle">Lifecycle</button>
      <button class="debug-tab" data-tab="events">Events</button>
      <button class="debug-tab" data-tab="workers">Workers</button>
      <button class="debug-tab" data-tab="network">Network</button>
      <button class="debug-tab" data-tab="storage">Storage</button>
      <button class="debug-tab" data-tab="resource">Resource</button>
    </div>
    <div class="debug-pane active" data-pane="lifecycle">
      <div id="lifecycleLog" style="max-height:300px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font:400 11px var(--font-mono);line-height:1.6"></div>
    </div>
    <div class="debug-pane" data-pane="events">
      <div id="eventLog" style="max-height:300px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font:400 11px var(--font-mono);line-height:1.6"></div>
    </div>
    <div class="debug-pane" data-pane="workers">
      <div id="workerInfo" style="padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)"></div>
    </div>
    <div class="debug-pane" data-pane="network">
      <div id="networkLog" style="max-height:300px;overflow:auto;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)"></div>
    </div>
    <div class="debug-pane" data-pane="storage">
      <div id="storageInfo" style="padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)"></div>
    </div>
    <div class="debug-pane" data-pane="resource">
      <div id="resourceInfo" style="padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-mono)"></div>
    </div>
  `;
  els={
    lifecycleLog: container.querySelector('#lifecycleLog'),
    eventLog: container.querySelector('#eventLog'),
    workerInfo: container.querySelector('#workerInfo'),
    networkLog: container.querySelector('#networkLog'),
    storageInfo: container.querySelector('#storageInfo'),
    resourceInfo: container.querySelector('#resourceInfo'),
  };

  // Tabs
  container.querySelectorAll('.debug-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab=btn.dataset.tab;
      container.querySelectorAll('.debug-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
      container.querySelectorAll('.debug-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab));
      if(tab==='workers') updateWorkers();
      if(tab==='storage') updateStorage();
      if(tab==='resource') updateResource();
      if(tab==='network') updateNetwork();
    });
  });

  // Debug toggle
  container.querySelector('#debugToggle')?.addEventListener('change',(e)=>{
    const v=e.target.checked;
    ctx.state.setUI({ devMode: v });
    ctx.logger.setDevMode(v);
    ctx.logger.setLevel(v?'debug':'info');
    if(v) ctx.logger.info('debug: enabled');
    else ctx.logger.info('debug: disabled');
  });

  // Lifecycle logs — listen to module events
  const lifecycleEvents=['module:registered','module:loaded','module:enabled','module:disabled','module:paused','module:resumed','module:sleep','module:crashed','module:unloaded','window:created','window:removed','window:focused'];
  lifecycleEvents.forEach(ev=>{
    const unsub=ctx.eventBus.on(ev, (payload)=>{
      const time=new Date().toLocaleTimeString();
      lifecycleLog.push(`[${time}] ${ev} ${payload?JSON.stringify(payload).slice(0,100):''}`);
      if(lifecycleLog.length>100) lifecycleLog.shift();
      if(els.lifecycleLog) els.lifecycleLog.innerHTML=lifecycleLog.map(l=>`<div>${escapeHtml(l)}</div>`).join('');
      if(els.lifecycleLog) els.lifecycleLog.scrollTop=els.lifecycleLog.scrollHeight;
    });
    unsubscribers.push(unsub);
  });

  // Event bus log — wrap emit
  const origEmit=ctx.eventBus.emit;
  ctx.eventBus.emit=(event,payload)=>{
    const time=new Date().toLocaleTimeString();
    eventLog.push(`[${time}] ${event} ${payload?JSON.stringify(payload).slice(0,80):''}`);
    if(eventLog.length>100) eventLog.shift();
    if(els.eventLog) {
      els.eventLog.innerHTML=eventLog.map(l=>`<div>${escapeHtml(l)}</div>`).join('');
      els.eventLog.scrollTop=els.eventLog.scrollHeight;
    }
    return origEmit.call(ctx.eventBus, event, payload);
  };
  els._origEmit=origEmit;

  // Workers
  function updateWorkers(){
    if(!els.workerInfo) return;
    const snap=ctx.state.get().runtime;
    const list=ctx.moduleManager.list();
    const active=list.filter(m=>m.status==='active').length;
    els.workerInfo.innerHTML=`
      <div>Active modules: <b>${active}</b></div>
      <div>Workers: <b>${snap.workers||0}</b> (from Resource Manager)</div>
      <div>Module statuses:</div>
      <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">${list.map(m=>`<span class="badge" style="background:${m.status==='active'?'rgba(16,185,129,.12)':m.status==='sleeping'?'rgba(6,182,212,.12)':'var(--surface-2)'}">${escapeHtml(m.id)}:${escapeHtml(m.status)}</span>`).join('')}</div>
    `;
  }
  updateWorkers();

  // Network — intercept fetch
  let networkLogs=[];
  const origFetch=window.fetch;
  window.fetch=async function(...args){
    const start=performance.now();
    const url=String(args[0]).slice(0,80);
    try{
      const res=await origFetch.apply(this,args);
      const time=Math.round(performance.now()-start);
      networkLogs.push(`[${new Date().toLocaleTimeString()}] FETCH ${url} → ${res.status} ${time}ms`);
      if(networkLogs.length>50) networkLogs.shift();
      updateNetwork();
      return res;
    }catch(e){
      const time=Math.round(performance.now()-start);
      networkLogs.push(`[${new Date().toLocaleTimeString()}] FETCH ${url} → ERROR ${e.message} ${time}ms`);
      if(networkLogs.length>50) networkLogs.shift();
      updateNetwork();
      throw e;
    }
  };
  els._origFetch=origFetch;
  els._networkLogs=networkLogs;
  function updateNetwork(){
    if(!els.networkLog) return;
    if(networkLogs.length===0) els.networkLog.innerHTML='<span class="muted small">No network requests yet</span>';
    else els.networkLog.innerHTML=networkLogs.map(l=>`<div>${escapeHtml(l)}</div>`).join('');
  }
  updateNetwork();

  // Storage
  function updateStorage(){
    if(!els.storageInfo) return;
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k.startsWith('web-universe:')) keys.push(k);
    }
    els.storageInfo.innerHTML=`
      <div>web-universe keys: <b>${keys.length}</b></div>
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">${keys.map(k=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 6px;background:var(--surface);border:1px solid var(--border);border-radius:6px"><code>${escapeHtml(k)}</code><span class="muted small">${(localStorage.getItem(k)?.length||0)} chars</span></div>`).join('') || '<span class="muted small">No keys</span>'}</div>
      <div style="margin-top:8px">IndexedDB: <b>web-universe-db</b> — check Storage Lab for details</div>
    `;
  }
  updateStorage();

  // Resource
  function updateResource(){
    if(!els.resourceInfo) return;
    const snap=window.WEB_UNIVERSE?.resourceManager?.getSnapshot();
    if(!snap){ els.resourceInfo.textContent='No data'; return; }
    els.resourceInfo.innerHTML=`
      <div>FPS: <b>${snap.fps}</b></div>
      <div>DOM nodes: <b>${snap.domNodes}</b></div>
      <div>Timers: <b>${snap.timers}</b></div>
      <div>Canvas: <b>${snap.canvas}</b></div>
      <div>Workers: <b>${snap.workers}</b></div>
      <div>Online: <b>${navigator.onLine?'Yes':'No'}</b></div>
    `;
  }
  updateResource();
  const resInterval=setInterval(updateResource,1000);
  els._resInterval=resInterval;

  // Clear / Export
  container.querySelector('[data-action="clear"]')?.addEventListener('click',()=>{
    eventLog=[]; lifecycleLog=[]; networkLogs=[];
    if(els.eventLog) els.eventLog.innerHTML='<span class="muted small">Cleared</span>';
    if(els.lifecycleLog) els.lifecycleLog.innerHTML='<span class="muted small">Cleared</span>';
    if(els.networkLog) els.networkLog.innerHTML='<span class="muted small">Cleared</span>';
  });
  container.querySelector('[data-action="export"]')?.addEventListener('click',()=>{
    const data={ lifecycle: lifecycleLog, events: eventLog, network: networkLogs, time: new Date().toISOString() };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='debug-logs.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  // Initial logs
  lifecycleLog.push(`[${new Date().toLocaleTimeString()}] debug-lab mounted — listening to ${lifecycleEvents.length} events`);
  if(els.lifecycleLog) els.lifecycleLog.innerHTML=lifecycleLog.map(l=>`<div>${escapeHtml(l)}</div>`).join('');

  ctxRef?.logger?.info('debug-lab: mounted');
}

export async function unmount(){
  unsubscribers.forEach(fn=>{ try{fn();}catch{} });
  unsubscribers=[];
  if(els._origEmit && ctxRef?.eventBus) ctxRef.eventBus.emit=els._origEmit;
  if(els._origFetch) window.fetch=els._origFetch;
  if(els._resInterval) clearInterval(els._resInterval);
  if(els._msgHandler) window.removeEventListener('message', els._msgHandler);
  els={}; ctxRef=null; eventLog=[]; lifecycleLog=[];
}
export async function destroy(){ await unmount(); }
