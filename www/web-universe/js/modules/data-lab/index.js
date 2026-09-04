export const manifest = {
  id: 'data-lab',
  name: 'Data Lab',
  version: '1.0.0',
  category: 'data',
  description: 'CSV/JSON parser, table, sort/filter/search, virtual scroll, benchmark.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📊',
};

let els = {};
let ctxRef = null;
let data = [];
let filtered = [];
let sortCol = null;
let sortDir = 1;
let page = 0;
let pageSize = 20;
let virtualEnabled = true;
let searchQuery = '';

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if(lines.length===0) return [];
  const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{
    // handle quoted commas
    const vals = [];
    let cur='', inQ=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){ inQ=!inQ; }
      else if(c===','&&!inQ){ vals.push(cur.trim().replace(/^"|"$/g,'')); cur=''; }
      else cur+=c;
    }
    vals.push(cur.trim().replace(/^"|"$/g,''));
    const obj={};
    headers.forEach((h,i)=> obj[h]=vals[i]??'');
    return obj;
  });
}

function generateDataset(n) {
  const cats=['A','B','C','D'];
  const names=['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Heidi'];
  return Array.from({length:n},(_,i)=>({
    id: i+1,
    name: names[Math.floor(Math.random()*names.length)] + ' ' + (i+1),
    value: Math.floor(Math.random()*1000),
    category: cats[Math.floor(Math.random()*cats.length)],
    score: (Math.random()*100).toFixed(1),
  }));
}

function applyFilter() {
  let out = data.slice();
  if(searchQuery){
    const q=searchQuery.toLowerCase();
    out = out.filter(row=> Object.values(row).some(v=> String(v).toLowerCase().includes(q)));
  }
  // filter by column
  const col = els.filterCol?.value;
  const op = els.filterOp?.value;
  const val = els.filterVal?.value.trim();
  if(col && op && val){
    out = out.filter(row=>{
      const cell = String(row[col]??'');
      if(op==='contains') return cell.toLowerCase().includes(val.toLowerCase());
      if(op==='equals') return cell===val;
      if(op==='gt') return parseFloat(cell) > parseFloat(val);
      if(op==='lt') return parseFloat(cell) < parseFloat(val);
      return true;
    });
  }
  // sort
  if(sortCol){
    out.sort((a,b)=>{
      const av=a[sortCol], bv=b[sortCol];
      const an=parseFloat(av), bn=parseFloat(bv);
      if(!isNaN(an)&&!isNaN(bn)) return (an-bn)*sortDir;
      return String(av).localeCompare(String(bv))*sortDir;
    });
  }
  filtered = out;
  page=0;
  renderTable();
  updateStats();
}

function renderTable() {
  if(!els.tableWrap) return;
  const cols = data.length? Object.keys(data[0]) : [];
  if(cols.length===0){
    els.tableWrap.innerHTML='<div class="muted small" style="padding:16px;text-align:center">No data — load CSV/JSON or generate</div>';
    return;
  }
  // header
  const header = `<thead><tr>${cols.map(c=>`<th data-col="${c}" style="cursor:pointer;user-select:none">${escapeHtml(c)} ${sortCol===c?(sortDir===1?'↑':'↓'):''}</th>`).join('')}<th>Actions</th></tr></thead>`;
  if(virtualEnabled && filtered.length>100){
    // virtual scroll
    const rowH=32, visible=10, totalH=filtered.length*rowH;
    const scrollTop = els.tableWrap.scrollTop||0;
    const start = Math.floor(scrollTop/rowH);
    const end = Math.min(filtered.length, start+visible+5);
    const slice = filtered.slice(start,end);
    const offsetY = start*rowH;
    const rows = slice.map((row,idx)=>{
      const realIdx=start+idx;
      return `<tr style="height:${rowH}px">${cols.map(c=>`<td>${escapeHtml(String(row[c]??''))}</td>`).join('')}<td><button class="btn btn-ghost btn-xs" data-del="${realIdx}">Del</button></td></tr>`;
    }).join('');
    els.tableWrap.innerHTML=`<div style="height:${totalH}px;position:relative"><table style="position:absolute;top:${offsetY}px;width:100%">${header}<tbody>${rows}</tbody></table></div>`;
    // need to keep scroll container
    els.tableWrap.style.height='320px'; els.tableWrap.style.overflow='auto';
    els.tableWrap.onscroll=()=> renderTable();
  } else {
    // pagination
    const totalPages=Math.ceil(filtered.length/pageSize)||1;
    if(page>=totalPages) page=totalPages-1;
    const slice=filtered.slice(page*pageSize,(page+1)*pageSize);
    const rows=slice.map((row,idx)=>{
      const realIdx=page*pageSize+idx;
      return `<tr>${cols.map(c=>`<td>${escapeHtml(String(row[c]??''))}</td>`).join('')}<td><button class="btn btn-ghost btn-xs" data-del="${realIdx}">Del</button></td></tr>`;
    }).join('');
    els.tableWrap.innerHTML=`<table>${header}<tbody>${rows||'<tr><td colspan="'+(cols.length+1)+'" class="muted small" style="text-align:center;padding:12px">No matches</td></tr>'}</tbody></table>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
        <span class="muted small">Page ${page+1}/${totalPages} · ${filtered.length}/${data.length} rows</span>
        <div style="display:flex;gap:6px"><button class="btn btn-ghost btn-xs" data-page="prev" ${page===0?'disabled':''}>Prev</button><button class="btn btn-ghost btn-xs" data-page="next" ${page>=totalPages-1?'disabled':''}>Next</button></div>
      </div>`;
    els.tableWrap.style.height=''; els.tableWrap.style.overflow='';
    els.tableWrap.onscroll=null;
  }
  // bind sort
  els.tableWrap.querySelectorAll('th[data-col]').forEach(th=>{
    th.addEventListener('click',()=>{
      const col=th.dataset.col;
      if(sortCol===col) sortDir*=-1; else { sortCol=col; sortDir=1; }
      applyFilter();
    });
  });
  els.tableWrap.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const idx=parseInt(btn.dataset.del,10);
      const realIdx=data.indexOf(filtered[idx]);
      if(realIdx>=0) data.splice(realIdx,1);
      applyFilter();
    });
  });
  els.tableWrap.querySelectorAll('[data-page]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.dataset.page==='prev'&&page>0) page--;
      if(btn.dataset.page==='next') page++;
      renderTable();
    });
  });
}

function updateStats(){
  if(!els.stats) return;
  const total=data.length, filt=filtered.length;
  const cols=data.length?Object.keys(data[0]).length:0;
  els.stats.textContent=`${filt}/${total} rows · ${cols} cols · ${virtualEnabled?'Virtual':'Paginated'} · Sort: ${sortCol||'—'}`;
}

export async function mount(container, ctx){
  ctxRef=ctx;
  // restore
  try{
    const raw=localStorage.getItem('web-universe:data-lab');
    if(raw){ const p=JSON.parse(raw); if(Array.isArray(p.data)) data=p.data; }
  }catch{}
  if(data.length===0) data=generateDataset(100);
  filtered=data.slice();

  container.innerHTML=`
    <div class="data-toolbar">
      <input type="file" id="dataFile" accept=".csv,.json" style="display:none" />
      <button class="btn btn-primary btn-sm" data-action="load">Load CSV/JSON</button>
      <button class="btn btn-ghost btn-sm" data-action="gen1k">Gen 1k</button>
      <button class="btn btn-ghost btn-sm" data-action="gen10k">Gen 10k</button>
      <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
      <button class="btn btn-ghost btn-sm" data-action="export-csv">Export CSV</button>
      <button class="btn btn-ghost btn-sm" data-action="export-json">Export JSON</button>
      <label class="toggle small"><input type="checkbox" id="virtualToggle" ${virtualEnabled?'checked':''} /> Virtual</label>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <input id="dataSearch" placeholder="Search all…" style="flex:1;min-width:160px;height:32px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 12px var(--font-sans)" />
      <select id="filterCol" style="height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)"><option value="">Filter col</option></select>
      <select id="filterOp" style="height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)"><option value="contains">contains</option><option value="equals">equals</option><option value="gt">> </option><option value="lt">< </option></select>
      <input id="filterVal" placeholder="Value" style="width:120px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
      <button class="btn btn-ghost btn-xs" data-action="filter">Apply</button>
      <button class="btn btn-ghost btn-xs" data-action="filter-clear">Clear</button>
    </div>
    <div class="muted small" id="dataStats" style="margin-top:6px"></div>
    <div class="data-table-wrap" id="dataTable" style="margin-top:8px;border:1px solid var(--border);border-radius:10px;overflow:auto;background:var(--surface)"></div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" data-action="benchmark">Benchmark (1k vs 10k)</button>
      <span class="muted small" id="benchResult" style="align-self:center"></span>
    </div>
    <div class="muted small" style="margin-top:6px">Virtual scroll: only visible rows rendered — benchmark shows difference</div>
  `;
  els={
    tableWrap: container.querySelector('#dataTable'),
    stats: container.querySelector('#dataStats'),
    search: container.querySelector('#dataSearch'),
    filterCol: container.querySelector('#filterCol'),
    filterOp: container.querySelector('#filterOp'),
    filterVal: container.querySelector('#filterVal'),
    benchResult: container.querySelector('#benchResult'),
  };
  function refreshCols(){
    const cols=data.length?Object.keys(data[0]):[];
    els.filterCol.innerHTML='<option value="">Filter col</option>'+cols.map(c=>`<option value="${c}">${escapeHtml(c)}</option>`).join('');
  }
  refreshCols();
  // events
  container.querySelector('[data-action="load"]')?.addEventListener('click',()=> container.querySelector('#dataFile').click());
  container.querySelector('#dataFile')?.addEventListener('change', async()=>{
    const file=container.querySelector('#dataFile').files?.[0];
    if(!file) return;
    const text=await file.text();
    try{
      if(file.name.endsWith('.json')){
        const obj=JSON.parse(text);
        data=Array.isArray(obj)?obj:[obj];
      } else {
        data=parseCSV(text);
      }
      filtered=data.slice(); sortCol=null; page=0; refreshCols(); applyFilter();
      try{ localStorage.setItem('web-universe:data-lab', JSON.stringify({data:data.slice(0,500)})); }catch{}
    }catch(e){ alert('Parse failed: '+e.message); }
    container.querySelector('#dataFile').value='';
  });
  container.querySelector('[data-action="gen1k"]')?.addEventListener('click',()=>{ data=generateDataset(1000); filtered=data.slice(); refreshCols(); applyFilter(); });
  container.querySelector('[data-action="gen10k"]')?.addEventListener('click',()=>{ data=generateDataset(10000); filtered=data.slice(); refreshCols(); applyFilter(); });
  container.querySelector('[data-action="clear"]')?.addEventListener('click',()=>{ data=[]; filtered=[]; refreshCols(); renderTable(); updateStats(); });
  container.querySelector('[data-action="export-csv"]')?.addEventListener('click',()=>{
    if(data.length===0) return;
    const cols=Object.keys(data[0]);
    const csv=[cols.join(',')].concat(data.map(r=> cols.map(c=> `"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='data.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  container.querySelector('[data-action="export-json"]')?.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='data.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  container.querySelector('#virtualToggle')?.addEventListener('change',(e)=>{ virtualEnabled=e.target.checked; renderTable(); updateStats(); });
  els.search.addEventListener('input',()=>{ searchQuery=els.search.value; applyFilter(); });
  container.querySelector('[data-action="filter"]')?.addEventListener('click', applyFilter);
  container.querySelector('[data-action="filter-clear"]')?.addEventListener('click',()=>{ els.filterCol.value=''; els.filterVal.value=''; searchQuery=''; els.search.value=''; applyFilter(); });
  container.querySelector('[data-action="benchmark"]')?.addEventListener('click',()=>{
    const sizes=[1000,10000];
    let html='';
    for(const n of sizes){
      const d=generateDataset(n);
      // normal: render all rows as string
      const t0=performance.now();
      let s='';
      for(let i=0;i<d.length;i++) s+=`<tr><td>${d[i].id}</td></tr>`;
      const t1=performance.now();
      // virtual: only 30 rows
      const t2=performance.now();
      let s2='';
      for(let i=0;i<Math.min(30,d.length);i++) s2+=`<tr><td>${d[i].id}</td></tr>`;
      const t3=performance.now();
      const normal=(t1-t0).toFixed(1), virt=(t3-t2).toFixed(1);
      html+=`<div>${n} rows: Normal <b>${normal}ms</b> vs Virtual <b>${virt}ms</b> — <span style="color:var(--success)">${(normal/virt).toFixed(1)}× faster</span></div>`;
    }
    els.benchResult.innerHTML=html;
  });
  applyFilter();
  ctxRef?.logger?.info('data-lab: mounted', {rows:data.length});
}

export async function unmount(){
  try{ localStorage.setItem('web-universe:data-lab', JSON.stringify({data:data.slice(0,500)})); }catch{}
  els={}; ctxRef=null;
}
export async function destroy(){ await unmount(); }
