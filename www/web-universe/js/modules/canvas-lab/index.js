export const manifest = {
  id: 'canvas-lab',
  name: 'Canvas Lab',
  version: '1.0.0',
  category: 'graphics',
  description: 'Canvas 2D — draw, shapes, gradients, particles, pixel filters.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🎨',
};

let els = {};
let ctx2d = null;
let drawing = false;
let lastPos = null;
let animId = null;
let particles = [];
let mode = 'draw';
let color = '#6366f1';
let lineWidth = 3;
let ctxRef = null;

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="canvas-toolbar">
      <select id="clMode" aria-label="Chế độ">
        <option value="draw">Draw</option>
        <option value="rect">Rectangle</option>
        <option value="circle">Circle</option>
        <option value="line">Line</option>
        <option value="gradient">Gradient</option>
        <option value="particles">Particles</option>
      </select>
      <input type="color" id="clColor" value="${color}" aria-label="Màu" title="Màu" />
      <label class="small muted" style="display:flex;align-items:center;gap:6px">Size <input type="range" id="clSize" min="1" max="20" value="${lineWidth}" style="width:90px" /></label>
      <button class="btn btn-ghost btn-sm" data-action="clear">Clear</button>
      <button class="btn btn-ghost btn-sm" data-action="demo">Demo</button>
      <button class="btn btn-ghost btn-sm" data-action="filter">Grayscale</button>
      <button class="btn btn-ghost btn-sm" data-action="export">Export PNG</button>
    </div>
    <div class="canvas-stage">
      <canvas id="clCanvas" width="720" height="360" aria-label="Canvas Lab"></canvas>
    </div>
    <div class="muted small" style="margin-top:8px">Kéo để vẽ · Particles: animation rAF · Clear để xóa · Export để tải PNG</div>
  `;

  const canvas = container.querySelector('#clCanvas');
  ctx2d = canvas.getContext('2d');
  els = { canvas, modeSel: container.querySelector('#clMode'), colorInput: container.querySelector('#clColor'), sizeInput: container.querySelector('#clSize') };

  // HiDPI
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr) || 720 * dpr;
  canvas.height = Math.round(360 * dpr);
  canvas.style.width = '100%';
  canvas.style.height = '360px';
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.lineCap = 'round';
  ctx2d.lineJoin = 'round';
  clearCanvas();

  mode = els.modeSel.value;
  els.modeSel.addEventListener('change', () => { mode = els.modeSel.value; if (mode === 'particles') startParticles(); else stopParticles(); });
  els.colorInput.addEventListener('input', () => color = els.colorInput.value);
  els.sizeInput.addEventListener('input', () => lineWidth = parseInt(els.sizeInput.value, 10));

  container.querySelector('[data-action="clear"]')?.addEventListener('click', clearCanvas);
  container.querySelector('[data-action="demo"]')?.addEventListener('click', drawDemo);
  container.querySelector('[data-action="filter"]')?.addEventListener('click', applyGrayscale);
  container.querySelector('[data-action="export"]')?.addEventListener('click', () => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'canvas-lab.png'; a.click();
  });

  // Drawing
  let startPos = null;
  let snapshot = null;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (mode === 'particles') return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const p = getPos(e);
    lastPos = p;
    startPos = p;
    if (mode === 'draw') {
      ctx2d.beginPath();
      ctx2d.moveTo(p.x, p.y);
    } else {
      // save snapshot for shape preview
      snapshot = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
    }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = getPos(e);
    if (mode === 'draw') {
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = lineWidth;
      ctx2d.lineTo(p.x, p.y);
      ctx2d.stroke();
      lastPos = p;
    } else if (snapshot) {
      ctx2d.putImageData(snapshot, 0, 0);
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = lineWidth;
      ctx2d.fillStyle = color;
      if (mode === 'rect') {
        ctx2d.strokeRect(startPos.x, startPos.y, p.x - startPos.x, p.y - startPos.y);
      } else if (mode === 'circle') {
        const r = Math.hypot(p.x - startPos.x, p.y - startPos.y);
        ctx2d.beginPath(); ctx2d.arc(startPos.x, startPos.y, r, 0, Math.PI * 2); ctx2d.stroke();
      } else if (mode === 'line') {
        ctx2d.beginPath(); ctx2d.moveTo(startPos.x, startPos.y); ctx2d.lineTo(p.x, p.y); ctx2d.stroke();
      } else if (mode === 'gradient') {
        const g = ctx2d.createLinearGradient(startPos.x, startPos.y, p.x, p.y);
        g.addColorStop(0, color); g.addColorStop(1, '#06b6d4');
        ctx2d.fillStyle = g;
        ctx2d.fillRect(Math.min(startPos.x, p.x), Math.min(startPos.y, p.y), Math.abs(p.x - startPos.x), Math.abs(p.y - startPos.y));
      }
    }
  });
  const endDraw = (e) => {
    if (!drawing) return;
    drawing = false;
    snapshot = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);

  // Touch fallback
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  ctxRef?.logger?.info('canvas-lab: mounted');
}

function clearCanvas() {
  if (!ctx2d) return;
  const canvas = els.canvas;
  const w = canvas.width / (window.devicePixelRatio > 1 ? Math.min(2, window.devicePixelRatio) : 1);
  const h = canvas.height / (window.devicePixelRatio > 1 ? Math.min(2, window.devicePixelRatio) : 1);
  // Use CSS size
  ctx2d.save();
  ctx2d.setTransform(1,0,0,1,0,0);
  ctx2d.clearRect(0,0,canvas.width,canvas.height);
  ctx2d.fillStyle = '#ffffff';
  ctx2d.fillRect(0,0,canvas.width,canvas.height);
  ctx2d.restore();
  // reset transform for HiDPI
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx2d.setTransform(dpr,0,0,dpr,0,0);
}

function drawDemo() {
  if (!ctx2d) return;
  clearCanvas();
  const w = 720, h = 360;
  // Gradient bg
  const g = ctx2d.createLinearGradient(0,0,w,0);
  g.addColorStop(0,'#6366f1'); g.addColorStop(0.5,'#06b6d4'); g.addColorStop(1,'#8b5cf6');
  ctx2d.fillStyle = g;
  ctx2d.fillRect(20,20,w-40,80);
  ctx2d.fillStyle = '#fff';
  ctx2d.font = '700 18px Inter, sans-serif';
  ctx2d.fillText('WEB UNIVERSE — Canvas Lab', 32, 68);
  // Shapes
  ctx2d.strokeStyle = '#0f172a'; ctx2d.lineWidth = 2;
  ctx2d.strokeRect(30,120,120,80);
  ctx2d.beginPath(); ctx2d.arc(220,160,40,0,Math.PI*2); ctx2d.stroke();
  ctx2d.beginPath(); ctx2d.moveTo(300,120); ctx2d.lineTo(380,200); ctx2d.lineTo(300,200); ctx2d.closePath(); ctx2d.stroke();
  // Particles hint
  ctx2d.fillStyle = '#6366f1';
  for (let i=0;i<12;i++) {
    const x = 420 + (i%4)*60;
    const y = 130 + Math.floor(i/4)*40;
    ctx2d.beginPath(); ctx2d.arc(x,y,6,0,Math.PI*2); ctx2d.fill();
  }
  ctx2d.fillStyle = '#64748b';
  ctx2d.font = '500 11px JetBrains Mono, monospace';
  ctx2d.fillText('Demo: shapes · gradients · particles', 30, 260);
}

function applyGrayscale() {
  if (!ctx2d || !els.canvas) return;
  const canvas = els.canvas;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // Need to get image data at device pixels
  ctx2d.save();
  ctx2d.setTransform(1,0,0,1,0,0);
  const img = ctx2d.getImageData(0,0,canvas.width,canvas.height);
  const data = img.data;
  for (let i=0;i<data.length;i+=4) {
    const avg = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
    data[i]=data[i+1]=data[i+2]=avg;
  }
  ctx2d.putImageData(img,0,0);
  ctx2d.restore();
  ctx2d.setTransform(dpr,0,0,dpr,0,0);
}

function startParticles() {
  stopParticles();
  particles = Array.from({length: 40}, () => ({
    x: Math.random()*700, y: Math.random()*340,
    vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2,
    r: 2+Math.random()*4, c: `hsl(${220+Math.random()*40}, 80%, 60%)`
  }));
  const loop = () => {
    if (!ctx2d || mode !== 'particles') return;
    clearCanvas();
    // faint trail
    ctx2d.fillStyle = 'rgba(255,255,255,0.08)';
    // Actually clear already, so draw particles
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > 720) p.vx *= -1;
      if (p.y < 0 || p.y > 360) p.vy *= -1;
      ctx2d.fillStyle = p.c;
      ctx2d.beginPath(); ctx2d.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx2d.fill();
      // connections
      for (const q of particles) {
        const d = Math.hypot(p.x-q.x, p.y-q.y);
        if (d < 80 && d > 0) {
          ctx2d.strokeStyle = `rgba(99,102,241,${0.15*(1-d/80)})`;
          ctx2d.lineWidth = 1;
          ctx2d.beginPath(); ctx2d.moveTo(p.x,p.y); ctx2d.lineTo(q.x,q.y); ctx2d.stroke();
        }
      }
    }
    animId = requestAnimationFrame(loop);
  };
  animId = requestAnimationFrame(loop);
}
function stopParticles() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  particles = [];
}

export async function pause() {
  stopParticles();
}
export async function resume() {
  if (mode === 'particles') startParticles();
}
export async function unmount() {
  stopParticles();
  ctx2d = null;
  els = {};
  ctxRef = null;
}
export async function destroy() { await unmount(); }
