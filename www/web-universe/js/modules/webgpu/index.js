export const manifest = {
  id: 'webgpu',
  name: 'WebGPU Lab',
  version: '1.0.0',
  category: 'graphics',
  description: 'WebGPU adapter/device detection, limits, basic demo — capability-aware.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '⚡',
};

let els = {};
let ctxRef = null;
let adapter = null;
let device = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function checkSupport() {
  const hasGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  return hasGPU;
}

async function requestAdapterInfo() {
  if (!navigator.gpu) throw new Error('navigator.gpu not available');
  const ad = await navigator.gpu.requestAdapter();
  if (!ad) throw new Error('No adapter found — WebGPU not supported on this device/browser');
  adapter = ad;
  // Try to get info
  let info = {};
  try {
    if (ad.requestAdapterInfo) info = await ad.requestAdapterInfo();
    else if (ad.info) info = ad.info;
    else info = { vendor: 'unknown', device: 'unknown', description: 'Adapter info not available' };
  } catch { info = { vendor: 'unknown', device: 'unknown' }; }
  // Features and limits
  const features = [...(ad.features || [])];
  const limits = ad.limits || {};
  return { adapter: ad, info, features, limits };
}

async function requestDeviceInfo(ad) {
  const dev = await ad.requestDevice();
  device = dev;
  const features = [...(dev.features || [])];
  const limits = dev.limits || {};
  const label = dev.label || 'WebGPU Device';
  return { device: dev, features, limits, label };
}

async function runTriangleDemo(canvas) {
  if (!adapter || !device) throw new Error('Adapter/device not ready');
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('Failed to get webgpu context');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });
  const shaderCode = `
    @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
      var pos = array<vec2f, 3>(vec2f(0, 0.6), vec2f(-0.6, -0.6), vec2f(0.6, -0.6));
      return vec4f(pos[i], 0, 1);
    }
    @fragment fn fs() -> @location(0) vec4f {
      return vec4f(0.39, 0.4, 0.95, 1);
    }
  `;
  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs' },
    fragment: { module, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0.06, g: 0.09, b: 0.16, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
  });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  device.queue.submit([encoder.finish()]);
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  const hasGPU = await checkSupport();

  container.innerHTML = `
    <div class="webgpu-status ${hasGPU?'supported':'not-supported'}" id="webgpuStatus">
      <div class="webgpu-badge">${hasGPU ? '✓ WebGPU API available' : '⚠ NOT SUPPORTED'}</div>
      <div class="muted small" id="webgpuHint">${hasGPU ? 'Click Request Adapter to detect hardware.' : 'This browser does not support WebGPU. No emulation — showing real status.'}</div>
    </div>
    <div class="webgpu-actions">
      <button class="btn btn-primary btn-sm" id="btnAdapter" ${!hasGPU?'disabled':''}>Request Adapter</button>
      <button class="btn btn-ghost btn-sm" id="btnDevice" disabled>Request Device</button>
      <button class="btn btn-ghost btn-sm" id="btnDemo" disabled>Triangle Demo</button>
      <button class="btn btn-ghost btn-sm" id="btnClear">Clear</button>
    </div>
    <div class="webgpu-info" id="webgpuInfo"></div>
    <div class="webgpu-canvas-wrap" id="webgpuCanvasWrap" style="display:none">
      <canvas id="webgpuCanvas" width="640" height="360" style="width:100%;height:360px;display:block;background:#0f172a;border:1px solid var(--border);border-radius:10px"></canvas>
      <div class="muted small" style="margin-top:6px">WebGPU triangle — rendered via GPURenderPipeline</div>
    </div>
    <div class="webgpu-note muted small" style="margin-top:12px;padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px">
      <b>Note:</b> WebGPU requires Chrome 113+ / Edge 113+ with compatible GPU. Firefox/Safari may not support yet. This module shows <b>real</b> capability — no fake data.
    </div>
  `;

  els = {
    status: container.querySelector('#webgpuStatus'),
    hint: container.querySelector('#webgpuHint'),
    info: container.querySelector('#webgpuInfo'),
    canvasWrap: container.querySelector('#webgpuCanvasWrap'),
    canvas: container.querySelector('#webgpuCanvas'),
    btnAdapter: container.querySelector('#btnAdapter'),
    btnDevice: container.querySelector('#btnDevice'),
    btnDemo: container.querySelector('#btnDemo'),
  };

  function renderInfo(data) {
    let html = '';
    if (data.info) {
      html += `<div class="webgpu-section"><h4>Adapter Info</h4><table class="webgpu-table">`;
      for (const [k,v] of Object.entries(data.info)) {
        html += `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`;
      }
      html += `</table></div>`;
    }
    if (data.features) {
      html += `<div class="webgpu-section"><h4>Features (${data.features.length})</h4><div class="webgpu-tags">${data.features.map(f=>`<span class="badge">${escapeHtml(f)}</span>`).join('') || '<span class="muted small">None</span>'}</div></div>`;
    }
    if (data.limits) {
      const entries = Object.entries(data.limits).slice(0, 12);
      html += `<div class="webgpu-section"><h4>Limits</h4><table class="webgpu-table">`;
      for (const [k,v] of entries) html += `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`;
      if (Object.keys(data.limits).length>12) html += `<tr><td colspan="2" class="muted small">… and ${Object.keys(data.limits).length-12} more</td></tr>`;
      html += `</table></div>`;
    }
    if (data.label) html += `<div class="muted small">Device: ${escapeHtml(data.label)}</div>`;
    els.info.innerHTML = html;
  }

  els.btnAdapter?.addEventListener('click', async () => {
    els.btnAdapter.disabled = true;
    els.btnAdapter.textContent = 'Requesting…';
    els.hint.textContent = 'Requesting adapter…';
    try {
      const data = await requestAdapterInfo();
      renderInfo(data);
      els.hint.textContent = 'Adapter found — now request device.';
      els.btnDevice.disabled = false;
      els.status.className = 'webgpu-status supported';
      els.status.querySelector('.webgpu-badge').textContent = '✓ Adapter found';
      ctxRef?.logger?.info('webgpu: adapter', data.info);
    } catch (e) {
      els.info.innerHTML = `<div style="color:var(--danger);padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px">${escapeHtml(e.message)}</div>`;
      els.hint.textContent = e.message;
      els.status.className = 'webgpu-status not-supported';
      els.status.querySelector('.webgpu-badge').textContent = '⚠ Adapter failed';
    } finally {
      els.btnAdapter.textContent = 'Request Adapter';
      els.btnAdapter.disabled = false;
    }
  });

  els.btnDevice?.addEventListener('click', async () => {
    if (!adapter) return;
    els.btnDevice.disabled = true;
    els.btnDevice.textContent = 'Requesting…';
    try {
      const data = await requestDeviceInfo(adapter);
      // Append device info
      const prev = els.info.innerHTML;
      let html = prev;
      html += `<div class="webgpu-section"><h4>Device</h4><div>Label: <b>${escapeHtml(data.label)}</b></div><div>Features: ${data.features.map(f=>`<span class="badge">${escapeHtml(f)}</span>`).join('') || 'None'}</div></div>`;
      els.info.innerHTML = html;
      els.hint.textContent = 'Device ready — try Triangle Demo.';
      els.btnDemo.disabled = false;
      ctxRef?.logger?.info('webgpu: device', { features: data.features.length });
    } catch (e) {
      els.info.innerHTML += `<div style="color:var(--danger);margin-top:8px">${escapeHtml(e.message)}</div>`;
    } finally {
      els.btnDevice.textContent = 'Request Device';
      els.btnDevice.disabled = false;
    }
  });

  els.btnDemo?.addEventListener('click', async () => {
    if (!device || !adapter) return;
    els.canvasWrap.style.display = 'block';
    try {
      await runTriangleDemo(els.canvas);
      els.hint.textContent = 'Triangle rendered ✓';
    } catch (e) {
      els.info.innerHTML += `<div style="color:var(--danger);margin-top:8px">Demo failed: ${escapeHtml(e.message)}</div>`;
    }
  });

  container.querySelector('#btnClear')?.addEventListener('click', () => {
    els.info.innerHTML = '';
    els.canvasWrap.style.display = 'none';
    els.hint.textContent = hasGPU ? 'Cleared — request adapter again.' : 'NOT SUPPORTED — no emulation.';
    els.btnDevice.disabled = true;
    els.btnDemo.disabled = true;
    if (device) { try{ device.destroy(); }catch{} device=null; }
    adapter = null;
  });

  // Auto-check on mount: show initial status
  if (!hasGPU) {
    els.info.innerHTML = `<div style="padding:16px;text-align:center;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px"><div style="font:700 14px var(--font-sans);color:var(--danger)">⚠ WebGPU NOT SUPPORTED</div><div class="muted small" style="margin-top:6px">This browser does not expose <code>navigator.gpu</code>.<br/>Try Chrome 113+ / Edge 113+ with GPU enabled.<br/>No fake data is shown.</div></div>`;
  }

  ctxRef?.logger?.info('webgpu: mounted', { hasGPU });
}

export async function unmount() {
  if (device) { try{ device.destroy(); }catch{} }
  device = null; adapter = null; els = {}; ctxRef = null;
}
export async function destroy() { await unmount(); }
