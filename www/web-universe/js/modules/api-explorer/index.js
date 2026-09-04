export const manifest = {
  id: 'api-explorer',
  name: 'API Explorer',
  version: '1.0.0',
  category: 'api',
  description: 'Auto-detect 20+ Web APIs — support, permission, demo, description.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🔍',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const APIS = [
  { name:'Canvas', check:()=> !!document.createElement('canvas').getContext, desc:'2D drawing', demo:()=>{ const c=document.createElement('canvas'); c.width=100;c.height=40; const ctx=c.getContext('2d'); ctx.fillStyle='#6366f1'; ctx.fillRect(0,0,100,40); ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.fillText('Canvas ✓',10,24); return c; } },
  { name:'WebGL', check:()=> !!document.createElement('canvas').getContext('webgl'), desc:'3D graphics', demo:null },
  { name:'WebGPU', check:()=> 'gpu' in navigator, desc:'Next-gen GPU', demo:null },
  { name:'Web Audio', check:()=> !!(window.AudioContext||window.webkitAudioContext), desc:'Audio processing', demo:null },
  { name:'Clipboard', check:()=> !!navigator.clipboard, desc:'Copy/paste', demo: async()=>{ await navigator.clipboard.writeText('hello'); return 'Copied hello ✓'; } },
  { name:'Geolocation', check:()=> 'geolocation' in navigator, desc:'Location', demo:()=> new Promise((res,rej)=> navigator.geolocation.getCurrentPosition(p=>res(`Lat ${p.coords.latitude.toFixed(2)}`), e=>rej(e.message), {timeout:5000})) },
  { name:'Notifications', check:()=> 'Notification' in window, desc:'Push notifications', demo: async()=>{ const p=await Notification.requestPermission(); return `Permission: ${p}`; } },
  { name:'WebSocket', check:()=> 'WebSocket' in window, desc:'Real-time', demo:null },
  { name:'IndexedDB', check:()=> 'indexedDB' in window, desc:'Client DB', demo:null },
  { name:'Worker', check:()=> 'Worker' in window, desc:'Background threads', demo:null },
  { name:'Service Worker', check:()=> 'serviceWorker' in navigator, desc:'Offline/cache', demo:null },
  { name:'Fetch', check:()=> 'fetch' in window, desc:'Network requests', demo: async()=>{ const r=await fetch('https://jsonplaceholder.typicode.com/posts/1'); return `Fetch ${r.status} ✓`; } },
  { name:'WebRTC', check:()=> 'RTCPeerConnection' in window, desc:'P2P', demo:null },
  { name:'MediaDevices', check:()=> !!navigator.mediaDevices, desc:'Camera/mic', demo:null },
  { name:'Vibration', check:()=> 'vibrate' in navigator, desc:'Haptics', demo:()=>{ navigator.vibrate(100); return 'Vibrated 100ms'; } },
  { name:'Battery', check:()=> 'getBattery' in navigator, desc:'Battery status', demo: async()=>{ const b=await navigator.getBattery(); return `${Math.round(b.level*100)}% ${b.charging?'charging':''}`; } },
  { name:'Bluetooth', check:()=> 'bluetooth' in navigator, desc:'BLE', demo:null },
  { name:'USB', check:()=> 'usb' in navigator, desc:'USB devices', demo:null },
  { name:'Share', check:()=> 'share' in navigator, desc:'Web Share', demo:null },
  { name:'Fullscreen', check:()=> !!document.documentElement.requestFullscreen, desc:'Fullscreen', demo:null },
  { name:'Picture-in-Picture', check:()=> !!document.pictureInPictureEnabled, desc:'PiP video', demo:null },
  { name:'Web Share', check:()=> 'canShare' in navigator, desc:'Share check', demo:null },
  { name:'Storage Estimate', check:()=> !!(navigator.storage&&navigator.storage.estimate), desc:'Quota', demo: async()=>{ const e=await navigator.storage.estimate(); return `${(e.usage/1024/1024).toFixed(1)}MB / ${(e.quota/1024/1024).toFixed(0)}MB`; } },
  { name:'BroadcastChannel', check:()=> 'BroadcastChannel' in window, desc:'Cross-tab messaging', demo:null },
  { name:'SharedWorker', check:()=> 'SharedWorker' in window, desc:'Shared worker', demo:null },
];

export async function mount(container, ctx){
  ctxRef=ctx;
  container.innerHTML=`
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <input id="apiSearch" placeholder="Search API…" style="flex:1;min-width:160px;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
      <select id="apiFilter" style="height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)">
        <option value="all">All</option><option value="ok">✓ Supported</option><option value="no">✗ Not supported</option>
      </select>
      <span class="muted small" id="apiCount" style="align-self:center"></span>
    </div>
    <div class="api-grid" id="apiGrid"></div>
  `;
  els={
    search: container.querySelector('#apiSearch'),
    filter: container.querySelector('#apiFilter'),
    grid: container.querySelector('#apiGrid'),
    count: container.querySelector('#apiCount'),
  };
  let filter='all', query='';
  function render(){
    const q=query.toLowerCase();
    let list=APIS.filter(api=>{
      const supported=api.check();
      if(filter==='ok'&&!supported) return false;
      if(filter==='no'&&supported) return false;
      if(q && !api.name.toLowerCase().includes(q) && !api.desc.toLowerCase().includes(q)) return false;
      return true;
    });
    const supportedCount=APIS.filter(a=>a.check()).length;
    els.count.textContent=`${supportedCount}/${APIS.length} supported`;
    els.grid.innerHTML=list.map(api=>{
      const ok=api.check();
      return `<div class="api-card ${ok?'ok':'no'}">
        <div class="api-card-head">
          <span><b>${escapeHtml(api.name)}</b> <span class="muted small">${escapeHtml(api.desc)}</span></span>
          <span class="badge ${ok?'badge-ok':'badge-error'}">${ok?'✓ Supported':'✗ Not supported'}</span>
        </div>
        <div class="api-card-body">
          <div class="muted small">Check: <code>${escapeHtml(api.check.toString().slice(0,80))}…</code></div>
          ${api.demo?`<button class="btn btn-ghost btn-xs" data-demo="${escapeHtml(api.name)}">Demo</button><span class="muted small" id="demo-${api.name.replace(/\s/g,'-')}" style="margin-left:6px"></span>`:'<span class="muted small">No demo</span>'}
        </div>
      </div>`;
    }).join('');
    els.grid.querySelectorAll('[data-demo]').forEach(btn=>{
      btn.addEventListener('click', async()=>{
        const name=btn.dataset.demo;
        const api=APIS.find(a=>a.name===name);
        const out=container.querySelector(`#demo-${name.replace(/\s/g,'-')}`);
        if(!api||!api.demo||!out) return;
        out.textContent='Running…';
        try{
          const res=await api.demo();
          if(res instanceof HTMLElement){
            out.innerHTML=''; out.appendChild(res);
          } else {
            out.textContent=String(res).slice(0,200);
            out.style.color='var(--success)';
          }
        }catch(e){
          out.textContent='Error: '+e.message;
          out.style.color='var(--danger)';
        }
      });
    });
  }
  els.search.addEventListener('input',()=>{ query=els.search.value; render(); });
  els.filter.addEventListener('change',()=>{ filter=els.filter.value; render(); });
  render();
  ctxRef?.logger?.info('api-explorer: mounted', {total:APIS.length, supported: APIS.filter(a=>a.check()).length});
}

export async function unmount(){ els={}; ctxRef=null; }
export async function destroy(){ await unmount(); }
