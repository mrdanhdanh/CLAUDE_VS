/* YUNIE STATUS — app.js */
const $ = (s, r=document) => r.querySelector(s);
const toastEl = $('#toast');

function toast(msg, ms=2600){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> toastEl.classList.remove('show'), ms);
}

function fmtTime(iso){
  try{
    const d = new Date(iso);
    if(isNaN(d)) return iso;
    return d.toLocaleString('vi-VN', { dateStyle:'medium', timeStyle:'short' }) + ` · ${iso}`;
  }catch{ return iso }
}

function healthBadge(status){
  if(status==='ok') return '<span class="tag tag-on">● OK</span>';
  if(status==='warn') return '<span class="tag" style="background:#fef3c7;border-color:#fde68a;color:#92400e">● WARN</span>';
  return '<span class="tag tag-off">● FAIL</span>';
}

async function loadStatus(){
  const res = await fetch('./status.json', { cache:'no-store' });
  if(!res.ok) throw new Error(`status.json ${res.status}`);
  return res.json();
}

function renderStats(data){
  const c = data.counts || {};
  const order = [
    { key:'skills', label:'Skills', icon:'🧩', cls:'skill' },
    { key:'instructions', label:'Instructions', icon:'📜', cls:'instruction' },
    { key:'agents', label:'Agents', icon:'🤖', cls:'agent' },
    { key:'prompts', label:'Prompts', icon:'💬', cls:'prompt' },
    { key:'hooks', label:'Hooks', icon:'🪝', cls:'hook' },
  ];
  const statsEl = $('#stats');
  statsEl.innerHTML = order.map(o=>{
    const v = c[o.key] || { enabled:0, total:0, disabled:0 };
    const pct = v.total ? Math.round(v.enabled / v.total * 100) : 0;
    const sub = v.total ? `${v.enabled}/${v.total} enabled` : '—';
    return `
      <div class="stat" role="status" aria-label="${o.label} ${sub}">
        <div class="stat-top">
          <span class="stat-icon ${o.cls}" aria-hidden="true">${o.icon}</span>
          <span class="tag ${pct===100?'tag-on':''}">${pct}%</span>
        </div>
        <strong>${v.enabled}</strong>
        <span>${o.label}</span>
        <small>${sub}${v.disabled?` · ${v.disabled} disabled`:''}</small>
        <div class="progress" aria-hidden="true"><i style="width:${pct}%"></i></div>
      </div>
    `;
  }).join('');
}

function renderRegistry(data){
  const reg = data.registry || {};
  const counts = data.counts || {};
  const rows = [];
  const typeMap = {
    skills: { label:'Skill', icon:'🧩' },
    instructions: { label:'Instruction', icon:'📜' },
    agents: { label:'Agent', icon:'🤖' },
    prompts: { label:'Prompt', icon:'💬' },
    hooks: { label:'Hook', icon:'🪝' },
  };
  for(const [key, names] of Object.entries(reg)){
    const meta = typeMap[key] || { label:key, icon:'•' };
    const list = Array.isArray(names) ? names : Object.keys(names);
    for(const name of list){
      // try to find enabled state from counts or registry object
      let enabled = true;
      if(names && typeof names === 'object' && !Array.isArray(names) && names[name]){
        enabled = names[name].enabled !== false;
      } else {
        // fallback: assume enabled if in list
        enabled = true;
      }
      const desc = (names[name] && names[name].description) ? names[name].description : '';
      rows.push(`
        <tr>
          <td><span class="tag">${meta.icon} ${meta.label}</span></td>
          <td class="mono"><strong>${name}</strong></td>
          <td style="color:var(--color-neutral-500);max-width:420px">${desc?desc.slice(0,90):'<span style="color:#94a3b8">—</span>'}</td>
          <td>${enabled?'<span class="tag tag-on"><i class="status-dot dot-on"></i>enabled</span>':'<span class="tag tag-off"><i class="status-dot dot-off"></i>disabled</span>'}</td>
        </tr>
      `);
    }
  }
  // If registry is flat arrays (our status.json), render with enabled from counts
  if(rows.length===0){
    $('#registryBody').innerHTML = `<tr><td colspan="4"><div class="empty">Chưa có dữ liệu registry — kiểm tra status.json</div></td></tr>`;
    return;
  }
  $('#registryBody').innerHTML = rows.join('');
  const total = Object.values(counts).reduce((a,b)=>a+(b.total||0),0);
  const enabled = Object.values(counts).reduce((a,b)=>a+(b.enabled||0),0);
  $('#registryTag').textContent = `${enabled}/${total} enabled`;
}

function renderPresets(data){
  const presets = data.presets || [];
  if(!presets.length){
    $('#presetList').innerHTML = `<div class="empty">Chưa có preset</div>`;
    return;
  }
  $('#presetList').innerHTML = presets.map(p=>`
    <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9">
      <div>
        <div class="mono" style="font-weight:700">${p.name}</div>
        <div style="color:var(--color-neutral-500);font-size:13px;margin-top:2px">${p.description||''}</div>
      </div>
      <span class="tag">${p.name==='api-minimal'?'minimal':p.name==='full'?'all':'web'}</span>
    </div>
  `).join('') + `<div style="margin-top:10px;color:var(--color-neutral-500);font-size:12px">Dùng: <span class="kbd">preset apply &lt;name&gt;</span></div>`;
}

function renderPlans(data){
  const plans = data.plans || [];
  const demos = data.demos || [];
  const all = [
    ...plans.map(p=>({ name:p, type:'plan', path:`.agent/plans/${p}/` })),
    ...demos.map(d=>({ name:d.name, type:'demo', path:d.path, status:d.status }))
  ];
  if(!all.length){
    $('#plansList').innerHTML = `<div class="empty">Chưa có plan/demo</div>`;
    return;
  }
  $('#plansList').innerHTML = all.map(x=>`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9">
      <div>
        <div style="font-weight:700;font-size:13px">${x.type==='demo'?'🎨':'📄'} ${x.name}</div>
        <div class="mono" style="color:var(--color-neutral-500);font-size:11px">${x.path}</div>
      </div>
      <span class="tag ${x.status==='ok'?'tag-on':''}">${x.type}</span>
    </div>
  `).join('');
}

function renderHealth(data){
  const h = data.health || {};
  $('#healthSub').textContent = h.lastCheck ? `last check: ${fmtTime(h.lastCheck)}` : '';
  const checks = (h.checks||[]).map(c=>`<li style="padding:4px 0;border-bottom:1px solid #f1f5f9">${c}</li>`).join('');
  $('#healthCard').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      ${healthBadge(h.status||'ok')}
      <span style="font-weight:700">${h.status==='ok'?'Hệ thống ổn định':h.status}</span>
      <span style="margin-left:auto;color:var(--color-neutral-500);font-size:12px">${h.errors||0} errors</span>
    </div>
    <ul style="margin:0;padding:0;list-style:none;font-size:13px">${checks || '<li style="color:#94a3b8">Chưa có checks</li>'}</ul>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn btn-ghost" href="./status.json" target="_blank" rel="noopener">Xem status.json</a>
      <button class="btn btn-ghost" id="btnCopyJson" type="button">Copy JSON</button>
    </div>
  `;
  $('#btnCopyJson')?.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast('Đã copy status.json');
    }catch{ toast('Không copy được — mở status.json thủ công'); }
  });
}

function renderPages(data){
  const p = data.pages || {};
  const entries = p.entries || [];
  $('#pagesCard').innerHTML = `
    <div style="color:var(--color-neutral-500);font-size:13px;margin-bottom:10px">
      Root: <span class="kbd">${p.root||'www'}</span> · Workflow: <span class="kbd">${p.workflow||'.github/workflows/pages.yml'}</span>
    </div>
    <div style="display:grid;gap:8px">
      ${entries.map(e=>`
        <a href="./${e.path}" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:white;text-decoration:none;color:inherit">
          <div>
            <div style="font-weight:700;font-size:13px">${e.title||e.path}</div>
            <div class="mono" style="color:var(--color-neutral-500);font-size:11px">${e.path}</div>
          </div>
          <span class="tag">${e.type||'page'}</span>
        </a>
      `).join('')}
    </div>
    <div style="margin-top:10px;color:var(--color-neutral-500);font-size:12px">${p.note||'Copy file mới vào www/ là tự deploy.'}</div>
  `;
}

function renderHero(data){
  $('#metaGenerated').textContent = data.generatedAt ? fmtTime(data.generatedAt) : '—';
  $('#metaBy').textContent = data.generatedBy || 'YUNIE';
  $('#metaPipeline').textContent = data.harness?.pipeline || 'Idea → … → Done';
  const h = data.health;
  $('#metaHealth').innerHTML = h ? `${healthBadge(h.status)} ${h.status}` : '—';
}

async function boot(){
  try{
    const data = await loadStatus();
    renderHero(data);
    renderStats(data);
    renderRegistry(data);
    renderPresets(data);
    renderPlans(data);
    renderHealth(data);
    renderPages(data);
  }catch(e){
    console.error(e);
    $('#stats').innerHTML = `<div class="card card-pad" style="grid-column:1/-1"><div class="empty">Không load được status.json<br><span class="mono" style="font-size:11px">${String(e.message||e)}</span><br><span style="font-size:12px">Mở file:// trực tiếp có thể bị CORS — chạy <span class="kbd">npx serve www</span> hoặc push lên Pages.</span></div></div>`;
    toast('Lỗi load status.json — xem console');
  }
}

$('#btnRefresh')?.addEventListener('click', ()=>{ boot(); toast('Đã làm mới'); });
$('#btnCheck')?.addEventListener('click', async ()=>{
  toast('YUNIE đang kiểm tra… (mở Copilot Chat gõ: yunie kiểm tra hệ thống)');
  // Try to re-fetch
  await boot();
});

boot();
