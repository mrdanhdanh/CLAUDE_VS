export const manifest = {
  id: 'viz-lab',
  name: 'Viz Lab',
  version: '1.0.0',
  category: 'viz',
  description: 'Bar, line, pie, scatter, histogram, heatmap, realtime — Canvas/SVG.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '📈',
};

let els = {};
let ctxRef = null;
let chartType = 'bar';
let chartData = [];
let realtimeInterval = null;
let worker = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function randomData(n=8, max=100){
  return Array.from({length:n},(_,i)=>({ label: 'Item '+(i+1), value: Math.floor(Math.random()*max)+10 }));
}
function ensureData(){
  if(chartData.length===0) chartData=randomData(8,100);
}

function drawBar(ctx, data, w, h){
  const pad={top:20,right:20,bottom:30,left:40};
  const cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
  const max=Math.max(...data.map(d=>d.value),1);
  const barW=cw/data.length*0.7, gap=cw/data.length*0.3;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  // axes
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,h-pad.bottom); ctx.lineTo(w-pad.right,h-pad.bottom); ctx.stroke();
  // bars
  data.forEach((d,i)=>{
    const x=pad.left + i*(barW+gap) + gap/2;
    const bh=(d.value/max)*ch;
    const y=h-pad.bottom-bh;
    ctx.fillStyle=`hsl(${240+i*30},70%,60%)`;
    ctx.fillRect(x,y,barW,bh);
    ctx.fillStyle='#94a3b8'; ctx.font='10px Inter'; ctx.textAlign='center';
    ctx.fillText(d.label.slice(0,6), x+barW/2, h-pad.bottom+14);
    ctx.fillStyle='#fff'; ctx.font='700 10px Inter';
    ctx.fillText(String(d.value), x+barW/2, y-4);
  });
}
function drawLine(ctx, data, w, h){
  const pad={top:20,right:20,bottom:30,left:40};
  const cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
  const max=Math.max(...data.map(d=>d.value),1), min=Math.min(...data.map(d=>d.value),0);
  const range=max-min||1;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,h-pad.bottom); ctx.lineTo(w-pad.right,h-pad.bottom); ctx.stroke();
  // line
  ctx.strokeStyle='#06b6d4'; ctx.lineWidth=2; ctx.beginPath();
  data.forEach((d,i)=>{
    const x=pad.left + (i/(data.length-1))*cw;
    const y=h-pad.bottom - ((d.value-min)/range)*ch;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // points
  data.forEach((d,i)=>{
    const x=pad.left + (i/(data.length-1))*cw;
    const y=h-pad.bottom - ((d.value-min)/range)*ch;
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#06b6d4'; ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
  });
}
function drawPie(ctx, data, w, h){
  const cx=w/2, cy=h/2, r=Math.min(w,h)*0.35;
  const total=data.reduce((s,d)=>s+d.value,0)||1;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  let start=-Math.PI/2;
  data.forEach((d,i)=>{
    const angle=(d.value/total)*Math.PI*2;
    ctx.fillStyle=`hsl(${i*360/data.length},70%,60%)`;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+angle); ctx.closePath(); ctx.fill();
    // label
    const mid=start+angle/2;
    const lx=cx+Math.cos(mid)*(r+20), ly=cy+Math.sin(mid)*(r+20);
    ctx.fillStyle='#e2e8f0'; ctx.font='10px Inter'; ctx.textAlign='center';
    ctx.fillText(d.label.slice(0,6), lx, ly);
    start+=angle;
  });
}
function drawScatter(ctx, data, w, h){
  const pad={top:20,right:20,bottom:30,left:40};
  const cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
  const max=Math.max(...data.map(d=>d.value),1);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,h-pad.bottom); ctx.lineTo(w-pad.right,h-pad.bottom); ctx.stroke();
  data.forEach((d,i)=>{
    const x=pad.left + Math.random()*cw;
    const y=h-pad.bottom - (d.value/max)*ch + (Math.random()-0.5)*20;
    ctx.fillStyle=`hsl(${200+Math.random()*60},70%,60%)`;
    ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
  });
}
function drawHistogram(ctx, data, w, h){
  const pad={top:20,right:20,bottom:30,left:40};
  const cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
  const bins=8;
  const max=Math.max(...data.map(d=>d.value),1);
  const binSize=max/bins;
  const counts=new Array(bins).fill(0);
  data.forEach(d=>{ const b=Math.min(bins-1, Math.floor(d.value/binSize)); counts[b]++; });
  const maxCount=Math.max(...counts,1);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.beginPath(); ctx.moveTo(pad.left,pad.top); ctx.lineTo(pad.left,h-pad.bottom); ctx.lineTo(w-pad.right,h-pad.bottom); ctx.stroke();
  const barW=cw/bins*0.8, gap=cw/bins*0.2;
  counts.forEach((c,i)=>{
    const x=pad.left + i*(barW+gap) + gap/2;
    const bh=(c/maxCount)*ch;
    const y=h-pad.bottom-bh;
    ctx.fillStyle=`hsl(${260-i*10},70%,60%)`;
    ctx.fillRect(x,y,barW,bh);
    ctx.fillStyle='#94a3b8'; ctx.font='9px Inter'; ctx.textAlign='center';
    ctx.fillText(`${Math.round(i*binSize)}-${Math.round((i+1)*binSize)}`, x+barW/2, h-pad.bottom+12);
  });
}
function drawHeatmap(ctx, data, w, h){
  const cols=8, rows=6;
  const cw=w-40, ch=h-40;
  const cellW=cw/cols, cellH=ch/rows;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,w,h);
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const val=Math.random();
      const hue=240 - val*240;
      ctx.fillStyle=`hsl(${hue},80%,60%)`;
      ctx.fillRect(20+c*cellW,20+r*cellH,cellW-2,cellH-2);
    }
  }
}

function renderChart(){
  if(!els.canvas) return;
  const canvas=els.canvas;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr; canvas.height=300*dpr;
  canvas.style.height='300px';
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width, h=300;
  ensureData();
  if(chartType==='bar') drawBar(ctx,chartData,w,h);
  else if(chartType==='line') drawLine(ctx,chartData,w,h);
  else if(chartType==='pie') drawPie(ctx,chartData,w,h);
  else if(chartType==='scatter') drawScatter(ctx,chartData,w,h);
  else if(chartType==='histogram') drawHistogram(ctx,chartData,w,h);
  else if(chartType==='heatmap') drawHeatmap(ctx,chartData,w,h);
  else if(chartType==='realtime') drawLine(ctx,chartData,w,h);
}

function startRealtime(){
  stopRealtime();
  // Worker that generates data
  const code=`onmessage=function(e){
    let val=50;
    setInterval(()=>{
      val+= (Math.random()-0.5)*10;
      val=Math.max(10,Math.min(100,val));
      postMessage({value: Math.round(val)});
    }, 300);
  }`;
  const blob=new Blob([code],{type:'application/javascript'});
  const url=URL.createObjectURL(blob);
  worker=new Worker(url);
  chartData=randomData(20,100);
  worker.onmessage=(e)=>{
    chartData.shift();
    chartData.push({label:'T'+Date.now()%1000, value:e.data.value});
    renderChart();
  };
  worker.postMessage('start');
  // also fallback interval if worker fails
  realtimeInterval=setInterval(()=>{},1000);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function stopRealtime(){
  if(worker){ try{worker.terminate();}catch{} worker=null; }
  if(realtimeInterval) clearInterval(realtimeInterval);
  realtimeInterval=null;
}

export async function mount(container, ctx){
  ctxRef=ctx;
  chartData=randomData(8,100);
  container.innerHTML=`
    <div class="viz-toolbar">
      <div class="viz-tabs" role="tablist" aria-label="Chart types">
        <button class="viz-tab active" data-type="bar">Bar</button>
        <button class="viz-tab" data-type="line">Line</button>
        <button class="viz-tab" data-type="pie">Pie</button>
        <button class="viz-tab" data-type="scatter">Scatter</button>
        <button class="viz-tab" data-type="histogram">Histogram</button>
        <button class="viz-tab" data-type="heatmap">Heatmap</button>
        <button class="viz-tab" data-type="realtime">Realtime</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-action="random">Random Data</button>
        <button class="btn btn-ghost btn-sm" data-action="export">Export PNG</button>
        <button class="btn btn-ghost btn-sm" data-action="realtime-start">Start RT</button>
        <button class="btn btn-ghost btn-sm" data-action="realtime-stop">Stop RT</button>
      </div>
    </div>
    <canvas id="vizCanvas" style="width:100%;height:300px;background:#0f172a;border:1px solid var(--border);border-radius:10px;display:block;margin-top:10px"></canvas>
    <div class="muted small" id="vizInfo" style="margin-top:6px"></div>
    <div class="muted small" style="margin-top:4px">Realtime: Worker → Data Stream → Aggregator → Chart pipeline</div>
  `;
  els={
    canvas: container.querySelector('#vizCanvas'),
    info: container.querySelector('#vizInfo'),
  };
  container.querySelectorAll('.viz-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      chartType=btn.dataset.type;
      container.querySelectorAll('.viz-tab').forEach(b=>b.classList.toggle('active',b.dataset.type===chartType));
      if(chartType==='realtime') startRealtime();
      else stopRealtime();
      renderChart();
      els.info.textContent=`Chart: ${chartType} · ${chartData.length} points`;
    });
  });
  container.querySelector('[data-action="random"]')?.addEventListener('click',()=>{
    chartData=randomData(chartType==='realtime'?20:8,100);
    renderChart();
    els.info.textContent=`Randomized · ${chartData.length} points`;
  });
  container.querySelector('[data-action="export"]')?.addEventListener('click',()=>{
    const url=els.canvas.toDataURL('image/png');
    const a=document.createElement('a'); a.href=url; a.download=`chart-${chartType}.png`; a.click();
  });
  container.querySelector('[data-action="realtime-start"]')?.addEventListener('click',()=>{
    chartType='realtime';
    container.querySelectorAll('.viz-tab').forEach(b=>b.classList.toggle('active',b.dataset.type==='realtime'));
    startRealtime();
  });
  container.querySelector('[data-action="realtime-stop"]')?.addEventListener('click', stopRealtime);
  // resize
  const ro=new ResizeObserver(()=> renderChart());
  ro.observe(els.canvas);
  els._ro=ro;
  renderChart();
  els.info.textContent=`Chart: ${chartType} · ${chartData.length} points`;
  ctxRef?.logger?.info('viz-lab: mounted');
}

export async function pause(){ stopRealtime(); }
export async function resume(){ if(chartType==='realtime') startRealtime(); }
export async function unmount(){
  stopRealtime();
  if(els._ro) try{els._ro.disconnect();}catch{}
  els={}; ctxRef=null;
}
export async function destroy(){ await unmount(); }
