export const manifest = {
  id: 'svg-lab',
  name: 'SVG Lab',
  version: '1.0.0',
  category: 'graphics',
  description: 'SVG shapes, paths, interactive, transform, export.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🔷',
};

let els = {};
let ctxRef = null;
let shapes = [];
let selectedId = null;
let dragState = null;

const STORAGE_KEY = 'web-universe:svg-lab';
const SVG_NS = 'http://www.w3.org/2000/svg';

function uid() { return 's' + Math.random().toString(36).slice(2, 8); }

function defaultShape(type) {
  const base = { id: uid(), type, x: 60 + Math.random()*120, y: 60 + Math.random()*80, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 2, opacity: 1, rotate: 0 };
  if (type==='circle') return { ...base, r: 32 };
  if (type==='rect') return { ...base, w: 100, h: 70, rx: 8 };
  if (type==='ellipse') return { ...base, rx: 50, ry: 32 };
  if (type==='line') return { ...base, x2: base.x+100, y2: base.y+60, fill: 'none' };
  if (type==='polygon') return { ...base, points: '0,-40 35,20 -35,20', fill: '#06b6d4' };
  if (type==='text') return { ...base, text: 'Hello SVG', fontSize: 18, fill: '#0f172a', stroke: 'none' };
  if (type==='path') return { ...base, d: 'M0,0 C40,-40 80,40 120,0', fill: 'none', strokeWidth: 3 };
  return base;
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ shapes, selectedId })); } catch {}
}

function render() {
  if (!els.svg) return;
  // Clear
  while (els.svg.firstChild) els.svg.removeChild(els.svg.firstChild);
  // Grid bg via pattern already in defs? We'll add defs
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML = `<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.5"/></pattern>`;
  els.svg.appendChild(defs);
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width','100%'); bg.setAttribute('height','100%'); bg.setAttribute('fill','url(#grid)');
  els.svg.appendChild(bg);

  for (const s of shapes) {
    let el;
    const isSelected = s.id===selectedId;
    const common = `opacity:${s.opacity};cursor:move;`;
    if (s.type==='circle') {
      el = document.createElementNS(SVG_NS, 'circle');
      el.setAttribute('cx', s.x); el.setAttribute('cy', s.y); el.setAttribute('r', s.r);
    } else if (s.type==='rect') {
      el = document.createElementNS(SVG_NS, 'rect');
      el.setAttribute('x', s.x); el.setAttribute('y', s.y); el.setAttribute('width', s.w); el.setAttribute('height', s.h); el.setAttribute('rx', s.rx||0);
    } else if (s.type==='ellipse') {
      el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', s.x); el.setAttribute('cy', s.y); el.setAttribute('rx', s.rx); el.setAttribute('ry', s.ry);
    } else if (s.type==='line') {
      el = document.createElementNS(SVG_NS, 'line');
      el.setAttribute('x1', s.x); el.setAttribute('y1', s.y); el.setAttribute('x2', s.x2); el.setAttribute('y2', s.y2);
    } else if (s.type==='polygon') {
      el = document.createElementNS(SVG_NS, 'polygon');
      // points relative to x,y
      const pts = s.points.split(' ').map(p => {
        const [px,py] = p.split(',').map(Number);
        return `${s.x+px},${s.y+py}`;
      }).join(' ');
      el.setAttribute('points', pts);
    } else if (s.type==='text') {
      el = document.createElementNS(SVG_NS, 'text');
      el.setAttribute('x', s.x); el.setAttribute('y', s.y);
      el.setAttribute('font-size', s.fontSize);
      el.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      el.textContent = s.text;
    } else if (s.type==='path') {
      el = document.createElementNS(SVG_NS, 'path');
      // d relative to x,y
      const d = s.d.replace(/([MLC])/g, (m, c) => c);
      // Simple: translate path
      el.setAttribute('d', s.d);
      el.setAttribute('transform', `translate(${s.x},${s.y})`);
    }
    if (!el) continue;
    el.setAttribute('fill', s.fill||'none');
    el.setAttribute('stroke', s.stroke||'none');
    el.setAttribute('stroke-width', s.strokeWidth||0);
    el.style.cssText = common;
    if (s.rotate) {
      const cx = s.x + (s.w? s.w/2 : 0);
      const cy = s.y + (s.h? s.h/2 : 0);
      el.setAttribute('transform', (el.getAttribute('transform')||'') + ` rotate(${s.rotate} ${cx} ${cy})`);
    }
    if (isSelected) {
      el.setAttribute('stroke', '#6366f1');
      el.setAttribute('stroke-width', Math.max(2, s.strokeWidth||2));
      el.style.filter = 'drop-shadow(0 0 6px rgba(99,102,241,.4))';
    }
    el.dataset.id = s.id;
    el.style.pointerEvents = 'all';
    // Events
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      selectedId = s.id;
      render(); renderProps();
      save();
      // Start drag
      const pt = getSVGPoint(e);
      dragState = { id: s.id, startX: pt.x, startY: pt.y, origX: s.x, origY: s.y, origX2: s.x2, origY2: s.y2 };
      el.setPointerCapture(e.pointerId);
    });
    els.svg.appendChild(el);
  }
  // Update code view
  if (els.code) {
    try {
      const clone = els.svg.cloneNode(true);
      // Remove grid bg and defs for cleaner export? Keep but simplify
      els.code.textContent = new XMLSerializer().serializeToString(clone).slice(0, 2000);
    } catch { els.code.textContent = '<svg>…</svg>'; }
  }
}

function getSVGPoint(e) {
  const pt = els.svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const ctm = els.svg.getScreenCTM().inverse();
  return pt.matrixTransform(ctm);
}

function renderProps() {
  if (!els.props) return;
  const s = shapes.find(x=>x.id===selectedId);
  if (!s) {
    els.props.innerHTML = '<div class="muted small" style="padding:12px;text-align:center">Chọn một shape để chỉnh props</div>';
    return;
  }
  const fields = [];
  fields.push(`<div class="svg-prop"><label>Type</label><span class="badge">${s.type}</span></div>`);
  fields.push(`<div class="svg-prop"><label>X</label><input type="range" min="0" max="400" value="${s.x}" data-prop="x" /></div>`);
  fields.push(`<div class="svg-prop"><label>Y</label><input type="range" min="0" max="300" value="${s.y}" data-prop="y" /></div>`);
  if (s.r!==undefined) fields.push(`<div class="svg-prop"><label>Radius</label><input type="range" min="5" max="80" value="${s.r}" data-prop="r" /></div>`);
  if (s.w!==undefined) fields.push(`<div class="svg-prop"><label>W</label><input type="range" min="20" max="200" value="${s.w}" data-prop="w" /></div>`);
  if (s.h!==undefined) fields.push(`<div class="svg-prop"><label>H</label><input type="range" min="20" max="150" value="${s.h}" data-prop="h" /></div>`);
  if (s.rx!==undefined && s.type!=='circle') fields.push(`<div class="svg-prop"><label>RX</label><input type="range" min="0" max="50" value="${s.rx}" data-prop="rx" /></div>`);
  if (s.ry!==undefined) fields.push(`<div class="svg-prop"><label>RY</label><input type="range" min="5" max="80" value="${s.ry}" data-prop="ry" /></div>`);
  if (s.fontSize!==undefined) fields.push(`<div class="svg-prop"><label>Font</label><input type="range" min="10" max="36" value="${s.fontSize}" data-prop="fontSize" /></div>`);
  fields.push(`<div class="svg-prop"><label>Fill</label><input type="color" value="${s.fill.startsWith('#')?s.fill:'#6366f1'}" data-prop="fill" /></div>`);
  fields.push(`<div class="svg-prop"><label>Stroke</label><input type="color" value="${s.stroke.startsWith('#')?s.stroke:'#0f172a'}" data-prop="stroke" /></div>`);
  fields.push(`<div class="svg-prop"><label>Stroke W</label><input type="range" min="0" max="8" value="${s.strokeWidth}" data-prop="strokeWidth" /></div>`);
  fields.push(`<div class="svg-prop"><label>Opacity</label><input type="range" min="0" max="100" value="${Math.round(s.opacity*100)}" data-prop="opacity" /></div>`);
  fields.push(`<div class="svg-prop"><label>Rotate</label><input type="range" min="0" max="360" value="${s.rotate}" data-prop="rotate" /></div>`);
  if (s.text!==undefined) fields.push(`<div class="svg-prop"><label>Text</label><input type="text" value="${s.text.replace(/"/g,'&quot;')}" data-prop="text" style="flex:1" /></div>`);
  fields.push(`<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-ghost btn-xs" data-action="duplicate">Duplicate</button><button class="btn btn-danger btn-xs" data-action="delete">Delete</button></div>`);
  els.props.innerHTML = fields.join('');
  // Bind
  els.props.querySelectorAll('[data-prop]').forEach(inp => {
    const prop = inp.dataset.prop;
    const handler = () => {
      let val = inp.value;
      if (['x','y','r','w','h','rx','ry','fontSize','strokeWidth','rotate'].includes(prop)) val = parseFloat(val);
      else if (prop==='opacity') val = parseFloat(val)/100;
      s[prop] = val;
      render(); save();
      // Update range display? keep
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });
  els.props.querySelector('[data-action="duplicate"]')?.addEventListener('click', () => {
    const copy = { ...s, id: uid(), x: s.x+20, y: s.y+20 };
    shapes.push(copy); selectedId = copy.id; render(); renderProps(); save();
  });
  els.props.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    shapes = shapes.filter(x=>x.id!==s.id); selectedId = null; render(); renderProps(); save();
  });
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  // Restore
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.shapes)) shapes = parsed.shapes;
      selectedId = parsed.selectedId || null;
    }
  } catch {}
  if (shapes.length===0) {
    shapes = [defaultShape('circle'), defaultShape('rect'), defaultShape('text')];
    selectedId = shapes[0].id;
  }

  container.innerHTML = `
    <div class="svg-toolbar">
      <div class="svg-palette" role="toolbar" aria-label="Shape palette">
        <button class="btn btn-ghost btn-xs" data-shape="circle" title="Circle">○ Circle</button>
        <button class="btn btn-ghost btn-xs" data-shape="rect" title="Rectangle">▭ Rect</button>
        <button class="btn btn-ghost btn-xs" data-shape="ellipse" title="Ellipse">⬭ Ellipse</button>
        <button class="btn btn-ghost btn-xs" data-shape="line" title="Line">— Line</button>
        <button class="btn btn-ghost btn-xs" data-shape="polygon" title="Polygon">⬡ Poly</button>
        <button class="btn btn-ghost btn-xs" data-shape="text" title="Text">T Text</button>
        <button class="btn btn-ghost btn-xs" data-shape="path" title="Path">〰 Path</button>
      </div>
      <div class="svg-actions">
        <button class="btn btn-ghost btn-xs" data-action="clear">Clear</button>
        <button class="btn btn-ghost btn-xs" data-action="random">Random</button>
        <button class="btn btn-primary btn-xs" data-action="export">Export SVG</button>
      </div>
    </div>
    <div class="svg-layout">
      <div class="svg-canvas-wrap">
        <svg class="svg-canvas" id="svgCanvas" viewBox="0 0 500 340" role="img" aria-label="SVG canvas" style="width:100%;height:340px;background:#fff;border:1px solid var(--border);border-radius:10px"></svg>
        <div class="muted small" style="margin-top:6px">Click shape để chọn · Kéo để di chuyển · Props bên phải</div>
      </div>
      <div class="svg-props" id="svgProps" aria-label="Properties"></div>
    </div>
    <div class="svg-code-wrap">
      <div class="svg-code-head"><span>SVG Source</span><button class="btn btn-ghost btn-xs" data-action="copy-code">Copy</button></div>
      <pre class="svg-code" id="svgCode" style="max-height:120px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all"></pre>
    </div>
  `;

  els = {
    svg: container.querySelector('#svgCanvas'),
    props: container.querySelector('#svgProps'),
    code: container.querySelector('#svgCode'),
  };

  // Palette
  container.querySelectorAll('[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.shape;
      const s = defaultShape(type);
      shapes.push(s); selectedId = s.id; render(); renderProps(); save();
    });
  });
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    shapes = []; selectedId = null; render(); renderProps(); save();
  });
  container.querySelector('[data-action="random"]')?.addEventListener('click', () => {
    const types = ['circle','rect','ellipse','line','polygon','text'];
    const t = types[Math.floor(Math.random()*types.length)];
    const s = defaultShape(t);
    shapes.push(s); selectedId = s.id; render(); renderProps(); save();
  });
  container.querySelector('[data-action="export"]')?.addEventListener('click', () => {
    if (shapes.length===0) { ctxRef?.logger?.warn('svg-lab: nothing to export'); return; }
    const clone = els.svg.cloneNode(true);
    // Remove grid bg for export? Keep
    const str = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([str], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'svg-lab.svg'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });
  container.querySelector('[data-action="copy-code"]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(els.code.textContent); } catch {}
  });

  // Deselect on bg click
  els.svg.addEventListener('pointerdown', (e) => {
    if (e.target===els.svg || e.target.tagName==='rect' && e.target.getAttribute('fill')==='url(#grid)') {
      selectedId = null; render(); renderProps(); save();
    }
  });
  // Drag move
  els.svg.addEventListener('pointermove', (e) => {
    if (!dragState) return;
    const pt = getSVGPoint(e);
    const dx = pt.x - dragState.startX;
    const dy = pt.y - dragState.startY;
    const s = shapes.find(x=>x.id===dragState.id);
    if (!s) return;
    s.x = dragState.origX + dx;
    s.y = dragState.origY + dy;
    if (s.x2!==undefined) { s.x2 = dragState.origX2 + dx; s.y2 = dragState.origY2 + dy; }
    render();
  });
  const endDrag = () => {
    if (dragState) { dragState = null; renderProps(); save(); }
  };
  els.svg.addEventListener('pointerup', endDrag);
  els.svg.addEventListener('pointercancel', endDrag);

  render(); renderProps();
  ctxRef?.logger?.info('svg-lab: mounted', { shapes: shapes.length });
}

export async function pause() {}
export async function resume() {}
export async function unmount() {
  shapes = []; selectedId = null; dragState = null; els = {}; ctxRef = null;
}
export async function destroy() { await unmount(); }
