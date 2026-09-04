export const manifest = {
  id: 'dependency-graph',
  name: 'Dependency Graph',
  version: '1.0.0',
  category: 'system',
  description: 'Visualize module dependencies — nodes, edges, highlight, disable warning.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🕸',
};

let els = {};
let ctxRef = null;
let selectedId = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function getCatalog() {
  try {
    if (window.WEB_UNIVERSE?.CATALOG) return window.WEB_UNIVERSE.CATALOG;
    if (window.WEB_UNIVERSE?.moduleManager?.list) {
      return window.WEB_UNIVERSE.moduleManager.list().map(m=> ({ id: m.id, name: m.meta.name, dependencies: m.meta.dependencies||[] }));
    }
  } catch {}
  // fallback static
  return [
    { id:'text-editor', name:'Text Editor', dependencies:[] },
    { id:'canvas-lab', name:'Canvas Lab', dependencies:[] },
    { id:'json-tool', name:'JSON Tool', dependencies:[] },
    { id:'markdown', name:'Markdown', dependencies:[] },
    { id:'code-playground', name:'Code Playground', dependencies:['text-editor'] },
    { id:'svg-lab', name:'SVG Lab', dependencies:[] },
    { id:'webgl-lab', name:'WebGL Lab', dependencies:['canvas-lab'] },
    { id:'webgpu', name:'WebGPU Lab', dependencies:[] },
    { id:'audio-lab', name:'Media Lab', dependencies:[] },
    { id:'file-lab', name:'File Lab', dependencies:[] },
    { id:'storage-lab', name:'Storage Lab', dependencies:['file-lab'] },
    { id:'network-lab', name:'Network Lab', dependencies:[] },
  ];
}

function renderGraph() {
  if (!els.svg) return;
  const catalog = getCatalog();
  const nodes = catalog.map(c=> ({ id: c.id, name: c.name, deps: c.dependencies||[] }));
  const n = nodes.length;
  const cols = Math.ceil(Math.sqrt(n));
  const cellW = 140, cellH = 70;
  const width = cols * cellW + 40;
  const rows = Math.ceil(n / cols);
  const height = rows * cellH + 40;
  els.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  els.svg.setAttribute('width', width);
  els.svg.setAttribute('height', height);
  els.svg.innerHTML = '';

  // positions
  const pos = new Map();
  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * cellW + cellW/2;
    const y = 20 + row * cellH + cellH/2;
    pos.set(node.id, { x, y, node });
  });

  // edges
  const svgNS = 'http://www.w3.org/2000/svg';
  // defs for arrow
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/></marker>
    <marker id="arrow-hl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
  els.svg.appendChild(defs);

  // draw edges first
  nodes.forEach(node => {
    node.deps.forEach(depId => {
      const from = pos.get(depId);
      const to = pos.get(node.id);
      if (!from || !to) return;
      const isHighlighted = selectedId && (selectedId===node.id || selectedId===depId || 
        (getDependents(selectedId).includes(node.id) && getDependencies(selectedId).includes(depId)) ||
        (selectedId===node.id && node.deps.includes(depId)) ||
        (nodes.find(n=>n.id===selectedId)?.deps.includes(node.id))
      );
      // simpler: highlight if selected is either end
      const hl = selectedId && (selectedId===node.id && node.deps.includes(depId) || 
        nodes.find(n=>n.id===selectedId)?.deps.includes(node.id) && depId===selectedId ||
        selectedId===depId && nodes.some(n=>n.id===selectedId && n.deps.includes(node.id))
      );
      // Actually highlight if edge is connected to selected
      const connected = selectedId && (selectedId===node.id || selectedId===depId || 
        getDependents(selectedId).includes(node.id) && node.deps.includes(depId));
      // For simplicity: highlight if selectedId is source or target
      const isHL = selectedId && (selectedId===node.id || selectedId===depId);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', isHL ? '#f59e0b' : '#94a3b8');
      line.setAttribute('stroke-width', isHL ? '2.5' : '1.5');
      line.setAttribute('marker-end', isHL ? 'url(#arrow-hl)' : 'url(#arrow)');
      line.setAttribute('opacity', selectedId && !isHL ? '0.25' : '1');
      els.svg.appendChild(line);
    });
  });

  // nodes
  nodes.forEach(node => {
    const p = pos.get(node.id);
    const isSelected = selectedId===node.id;
    const isDep = selectedId && getDependencies(selectedId).includes(node.id);
    const isDependent = selectedId && getDependents(selectedId).includes(node.id);
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${p.x},${p.y})`);
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => {
      selectedId = selectedId===node.id ? null : node.id;
      renderGraph();
      renderInfo();
    });
    g.addEventListener('mouseenter', () => {
      // hover highlight
      g.querySelector('circle').setAttribute('stroke-width', '3');
    });
    g.addEventListener('mouseleave', () => {
      g.querySelector('circle').setAttribute('stroke-width', isSelected ? '3' : '2');
    });

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '28');
    circle.setAttribute('fill', isSelected ? '#6366f1' : isDep ? '#fef3c7' : isDependent ? '#dcfce7' : '#fff');
    circle.setAttribute('stroke', isSelected ? '#4f46e5' : isDep ? '#f59e0b' : isDependent ? '#10b981' : '#e2e8f0');
    circle.setAttribute('stroke-width', isSelected ? '3' : '2');
    if (selectedId && !isSelected && !isDep && !isDependent) circle.setAttribute('opacity', '0.5');
    g.appendChild(circle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '4');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.setAttribute('font-weight', '600');
    text.setAttribute('fill', isSelected ? '#fff' : '#0f172a');
    text.textContent = node.id.slice(0,8);
    g.appendChild(text);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '42');
    label.setAttribute('font-size', '9');
    label.setAttribute('font-family', 'Inter, sans-serif');
    label.setAttribute('fill', '#64748b');
    label.textContent = node.name.slice(0,14);
    g.appendChild(label);

    els.svg.appendChild(g);
  });
}

function getDependencies(id) {
  const catalog = getCatalog();
  const node = catalog.find(n=>n.id===id);
  return node ? node.dependencies||[] : [];
}
function getDependents(id) {
  const catalog = getCatalog();
  return catalog.filter(n=> (n.dependencies||[]).includes(id)).map(n=>n.id);
}

function renderInfo() {
  if (!els.info) return;
  if (!selectedId) {
    els.info.innerHTML = '<span class="muted small">Click a node to see dependencies</span>';
    return;
  }
  const catalog = getCatalog();
  const node = catalog.find(n=>n.id===selectedId);
  if (!node) return;
  const deps = getDependencies(selectedId);
  const dependents = getDependents(selectedId);
  const status = window.WEB_UNIVERSE?.moduleManager?.get(selectedId)?.status || 'unknown';
  els.info.innerHTML = `
    <div><b>${escapeHtml(node.name)}</b> <span class="badge">${escapeHtml(selectedId)}</span> <span class="badge" style="background:${status==='active'?'rgba(16,185,129,.12)':'var(--surface-2)'}">${escapeHtml(status)}</span></div>
    <div style="margin-top:6px">Depends on: ${deps.length ? deps.map(d=>`<span class="badge" style="background:#fef3c7">${escapeHtml(d)}</span>`).join(' ') : '<span class="muted small">— none</span>'}</div>
    <div style="margin-top:4px">Required by: ${dependents.length ? dependents.map(d=>`<span class="badge" style="background:#dcfce7">${escapeHtml(d)}</span>`).join(' ') : '<span class="muted small">— none</span>'}</div>
    <div style="margin-top:8px;display:flex;gap:6px">
      <button class="btn btn-ghost btn-xs" data-action="highlight-deps">Highlight Deps</button>
      <button class="btn btn-ghost btn-xs" data-action="try-disable">Try Disable</button>
    </div>
  `;
  els.info.querySelector('[data-action="try-disable"]')?.addEventListener('click', async () => {
    try {
      await window.WEB_UNIVERSE.moduleManager.disable(selectedId);
      alert(`Disabled ${selectedId} ✓`);
      renderGraph();
      renderInfo();
    } catch (e) {
      if (e.dependents) {
        alert(`Cannot disable ${selectedId} — required by: ${e.dependents.join(', ')}`);
      } else {
        alert(`Disable failed: ${e.message}`);
      }
    }
  });
  els.info.querySelector('[data-action="highlight-deps"]')?.addEventListener('click', () => {
    renderGraph();
  });
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="dep-toolbar">
      <span class="muted small">Nodes: circles · Edges: dependencies → dependents · Click to select</span>
      <button class="btn btn-ghost btn-xs" data-action="refresh">Refresh</button>
      <button class="btn btn-ghost btn-xs" data-action="clear">Clear Selection</button>
    </div>
    <div style="overflow:auto;border:1px solid var(--border);border-radius:10px;background:var(--surface);padding:12px">
      <svg id="depSvg" role="img" aria-label="Dependency graph" style="display:block;min-width:600px"></svg>
    </div>
    <div id="depInfo" style="margin-top:10px;padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:400 11px var(--font-sans)"></div>
    <div class="muted small" style="margin-top:8px">Tip: Try disabling a dependency that is required — you will see the warning modal (already in Module Manager)</div>
  `;
  els = {
    svg: container.querySelector('#depSvg'),
    info: container.querySelector('#depInfo'),
  };
  container.querySelector('[data-action="refresh"]')?.addEventListener('click', () => { renderGraph(); renderInfo(); });
  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => { selectedId=null; renderGraph(); renderInfo(); });
  renderGraph();
  renderInfo();
  ctxRef?.logger?.info('dependency-graph: mounted');
}

export async function unmount() { els={}; ctxRef=null; selectedId=null; }
export async function destroy() { await unmount(); }
