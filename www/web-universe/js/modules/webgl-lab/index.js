export const manifest = {
  id: 'webgl-lab',
  name: 'WebGL Lab',
  version: '1.0.0',
  category: 'graphics',
  description: 'WebGL renderer — triangle, texture, cube, lighting, camera.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🧊',
};

let els = {};
let ctxRef = null;
let gl = null;
let rafId = null;
let demo = 'triangle';
let wireframe = false;
let lighting = true;
let clearColor = '#0f172a';
let rotation = 0;
let programs = {};
let buffers = {};

const STORAGE_KEY = 'web-universe:webgl-lab';

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ demo, wireframe, lighting, clearColor })); } catch {}
}

function createShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Shader compile: ' + err);
  }
  return s;
}
function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error('Program link: ' + err);
  }
  return prog;
}

// Minimal mat4
function perspective(out, fovy, aspect, near, far) {
  const f = 1/Math.tan(fovy/2);
  out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
  out[4]=0; out[5]=f; out[6]=0; out[7]=0;
  out[8]=0; out[9]=0; out[10]=(far+near)/(near-far); out[11]=-1;
  out[12]=0; out[13]=0; out[14]=(2*far*near)/(near-far); out[15]=0;
  return out;
}
function translate(out, a, v) {
  out.set(a);
  out[12]=a[0]*v[0]+a[4]*v[1]+a[8]*v[2]+a[12];
  out[13]=a[1]*v[0]+a[5]*v[1]+a[9]*v[2]+a[13];
  out[14]=a[2]*v[0]+a[6]*v[1]+a[10]*v[2]+a[14];
  out[15]=a[3]*v[0]+a[7]*v[1]+a[11]*v[2]+a[15];
  return out;
}
function rotateY(out, a, rad) {
  const s=Math.sin(rad), c=Math.cos(rad);
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3], a20=a[8],a21=a[9],a22=a[10],a23=a[11];
  out[0]=a00*c - a20*s; out[1]=a01*c - a21*s; out[2]=a02*c - a22*s; out[3]=a03*c - a23*s;
  out[8]=a00*s + a20*c; out[9]=a01*s + a21*c; out[10]=a02*s + a22*c; out[11]=a03*s + a23*c;
  out[4]=a[4]; out[5]=a[5]; out[6]=a[6]; out[7]=a[7];
  out[12]=a[12]; out[13]=a[13]; out[14]=a[14]; out[15]=a[15];
  return out;
}
function rotateX(out, a, rad) {
  const s=Math.sin(rad), c=Math.cos(rad);
  const a10=a[4],a11=a[5],a12=a[6],a13=a[7], a20=a[8],a21=a[9],a22=a[10],a23=a[11];
  out[4]=a10*c + a20*s; out[5]=a11*c + a21*s; out[6]=a12*c + a22*s; out[7]=a13*c + a23*s;
  out[8]=a20*c - a10*s; out[9]=a21*c - a11*s; out[10]=a22*c - a12*s; out[11]=a23*c - a13*s;
  out[0]=a[0]; out[1]=a[1]; out[2]=a[2]; out[3]=a[3];
  out[12]=a[12]; out[13]=a[13]; out[14]=a[14]; out[15]=a[15];
  return out;
}

function initGL(canvas) {
  gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return null;
  // Shaders
  const vsTriangle = `
    attribute vec2 aPos;
    attribute vec3 aColor;
    varying vec3 vColor;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); vColor = aColor; }
  `;
  const fsTriangle = `
    precision mediump float;
    varying vec3 vColor;
    void main(){ gl_FragColor = vec4(vColor, 1.0); }
  `;
  const vsCube = `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    varying vec3 vColor;
    varying vec3 vNormal;
    void main(){
      gl_Position = uMVP * vec4(aPos, 1.0);
      vColor = aColor;
      vNormal = mat3(uModel) * aNormal;
    }
  `;
  const fsCube = `
    precision mediump float;
    varying vec3 vColor;
    varying vec3 vNormal;
    uniform float uLighting;
    void main(){
      vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
      float diff = max(dot(normalize(vNormal), lightDir), 0.0);
      float lit = mix(1.0, 0.3 + 0.7*diff, uLighting);
      gl_FragColor = vec4(vColor * lit, 1.0);
    }
  `;
  try {
    programs.triangle = createProgram(gl, vsTriangle, fsTriangle);
    programs.cube = createProgram(gl, vsCube, fsCube);
  } catch (e) {
    console.error(e);
    return null;
  }
  // Buffers - triangle
  const triVerts = new Float32Array([
    0, 0.7,  1,0,0,
    -0.6, -0.5,  0,1,0,
    0.6, -0.5,  0,0,1,
  ]);
  buffers.triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.triangle);
  gl.bufferData(gl.ARRAY_BUFFER, triVerts, gl.STATIC_DRAW);

  // Cube: 36 vertices (12 triangles) with pos, normal, color
  const cubeData = [];
  const faces = [
    // front
    { n:[0,0,1], c:[1,0.3,0.3], verts:[[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]] },
    { n:[0,0,-1], c:[0.3,1,0.3], verts:[[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]] },
    { n:[0,1,0], c:[0.3,0.3,1], verts:[[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]] },
    { n:[0,-1,0], c:[1,1,0.3], verts:[[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]] },
    { n:[1,0,0], c:[1,0.3,1], verts:[[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]] },
    { n:[-1,0,0], c:[0.3,1,1], verts:[[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]] },
  ];
  for (const f of faces) {
    const v = f.verts;
    const idx = [0,1,2, 0,2,3];
    for (const i of idx) {
      cubeData.push(v[i][0], v[i][1], v[i][2], f.n[0], f.n[1], f.n[2], f.c[0], f.c[1], f.c[2]);
    }
  }
  buffers.cube = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cube);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);
  buffers.cubeCount = 36;

  // Texture quad (simple gradient texture)
  const quadVerts = new Float32Array([
    -0.7,-0.7, 0,0,
    0.7,-0.7, 1,0,
    0.7,0.7, 1,1,
    -0.7,0.7, 0,1,
  ]);
  buffers.quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quad);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
  const quadIdx = new Uint16Array([0,1,2, 0,2,3]);
  buffers.quadIdx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.quadIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIdx, gl.STATIC_DRAW);
  // Create texture
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const texCanvas = document.createElement('canvas');
  texCanvas.width=64; texCanvas.height=64;
  const tctx = texCanvas.getContext('2d');
  const grad = tctx.createLinearGradient(0,0,64,64);
  grad.addColorStop(0,'#6366f1'); grad.addColorStop(0.5,'#06b6d4'); grad.addColorStop(1,'#8b5cf6');
  tctx.fillStyle=grad; tctx.fillRect(0,0,64,64);
  tctx.fillStyle='rgba(255,255,255,.9)'; tctx.font='700 10px sans-serif'; tctx.fillText('WEBGL', 12, 36);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  buffers.texture = tex;
  // Quad program
  const vsQuad = `
    attribute vec2 aPos;
    attribute vec2 aUV;
    varying vec2 vUV;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); vUV = aUV; }
  `;
  const fsQuad = `
    precision mediump float;
    varying vec2 vUV;
    uniform sampler2D uTex;
    void main(){ gl_FragColor = texture2D(uTex, vUV); }
  `;
  try { programs.quad = createProgram(gl, vsQuad, fsQuad); } catch(e){ console.error(e); }

  gl.enable(gl.DEPTH_TEST);
  return gl;
}

function hexToRgb(hex) {
  const m = hex.replace('#','');
  const n = parseInt(m,16);
  return [(n>>16 &255)/255, (n>>8 &255)/255, (n &255)/255];
}

function draw() {
  if (!gl) return;
  const canvas = gl.canvas;
  // Resize for HiDPI
  const dpr = Math.min(2, window.devicePixelRatio||1);
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
    gl.viewport(0,0,w,h);
  }
  const rgb = hexToRgb(clearColor);
  gl.clearColor(rgb[0], rgb[1], rgb[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (demo==='triangle') {
    gl.useProgram(programs.triangle);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.triangle);
    const aPos = gl.getAttribLocation(programs.triangle, 'aPos');
    const aColor = gl.getAttribLocation(programs.triangle, 'aColor');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 20, 8);
    gl.drawArrays(wireframe ? gl.LINE_LOOP : gl.TRIANGLES, 0, 3);
  } else if (demo==='texture') {
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(programs.quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quad);
    const aPos = gl.getAttribLocation(programs.quad, 'aPos');
    const aUV = gl.getAttribLocation(programs.quad, 'aUV');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.quadIdx);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);
    gl.uniform1i(gl.getUniformLocation(programs.quad, 'uTex'), 0);
    gl.drawElements(wireframe ? gl.LINE_LOOP : gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.enable(gl.DEPTH_TEST);
  } else if (demo==='cube') {
    gl.useProgram(programs.cube);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cube);
    const aPos = gl.getAttribLocation(programs.cube, 'aPos');
    const aNormal = gl.getAttribLocation(programs.cube, 'aNormal');
    const aColor = gl.getAttribLocation(programs.cube, 'aColor');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aNormal);
    gl.enableVertexAttribArray(aColor);
    // stride 36 bytes: 3 pos + 3 normal + 3 color = 9 floats
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 36, 24);
    // MVP
    const proj = new Float32Array(16);
    const model = new Float32Array(16);
    const mvp = new Float32Array(16);
    perspective(proj, Math.PI/4, gl.canvas.width/gl.canvas.height, 0.1, 100);
    // model = translate(0,0,-3) * rotateY * rotateX
    for(let i=0;i<16;i++) model[i]= i%5===0?1:0;
    translate(model, model, [0,0,-2.5]);
    rotateY(model, model, rotation);
    rotateX(model, model, rotation*0.6);
    // mvp = proj * model
    // simple multiply
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
      mvp[i*4+j]=0;
      for(let k=0;k<4;k++) mvp[i*4+j]+= proj[i*4+k]*model[k*4+j];
    }
    // Actually need correct multiply: proj * model (column-major)
    // Our arrays are column-major? Let's do proper
    const tmp = new Float32Array(16);
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
      tmp[j*4+i]=0;
      for(let k=0;k<4;k++) tmp[j*4+i]+= proj[k*4+i]*model[j*4+k];
    }
    gl.uniformMatrix4fv(gl.getUniformLocation(programs.cube, 'uMVP'), false, tmp);
    gl.uniformMatrix4fv(gl.getUniformLocation(programs.cube, 'uModel'), false, model);
    gl.uniform1f(gl.getUniformLocation(programs.cube, 'uLighting'), lighting?1:0);
    gl.drawArrays(wireframe ? gl.LINES : gl.TRIANGLES, 0, buffers.cubeCount);
  }
}

function loop() {
  rotation += 0.015;
  draw();
  rafId = requestAnimationFrame(loop);
  if (els.fps) {
    // Simple FPS via rAF count
    if (!loop._frames) loop._frames=0, loop._last=performance.now();
    loop._frames++;
    const now = performance.now();
    if (now - loop._last >= 1000) {
      els.fps.textContent = String(Math.round(loop._frames*1000/(now-loop._last)));
      loop._frames=0; loop._last=now;
    }
  }
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      demo = p.demo||demo; wireframe=!!p.wireframe; lighting=p.lighting!==false; clearColor=p.clearColor||clearColor;
    }
  } catch {}

  container.innerHTML = `
    <div class="webgl-toolbar">
      <div class="webgl-demos" role="tablist" aria-label="WebGL demos">
        <button class="btn btn-ghost btn-xs ${demo==='triangle'?'active':''}" data-demo="triangle">Triangle</button>
        <button class="btn btn-ghost btn-xs ${demo==='texture'?'active':''}" data-demo="texture">Texture</button>
        <button class="btn btn-ghost btn-xs ${demo==='cube'?'active':''}" data-demo="cube">Cube 3D</button>
      </div>
      <div class="webgl-toggles">
        <label class="toggle small"><input type="checkbox" id="webglWire" ${wireframe?'checked':''} /> Wireframe</label>
        <label class="toggle small"><input type="checkbox" id="webglLight" ${lighting?'checked':''} /> Lighting</label>
        <label class="small" style="display:flex;align-items:center;gap:6px">Clear <input type="color" id="webglClear" value="${clearColor}" style="width:32px;height:28px;padding:2px" /></label>
      </div>
    </div>
    <div class="webgl-layout">
      <div class="webgl-canvas-wrap">
        <canvas class="webgl-canvas" id="webglCanvas" width="640" height="360" style="width:100%;height:360px;display:block;background:${clearColor};border:1px solid var(--border);border-radius:10px"></canvas>
        <div class="webgl-info" id="webglInfo" style="margin-top:8px;font:400 11px var(--font-mono);color:var(--text-2)"></div>
      </div>
      <div class="webgl-panel">
        <div class="webgl-stat"><span>FPS</span><b id="webglFps">—</b></div>
        <div class="webgl-stat"><span>Demo</span><b id="webglDemoLabel">${demo}</b></div>
        <div class="webgl-cap" id="webglCap"></div>
        <button class="btn btn-ghost btn-xs" data-action="view-shader">View Shader</button>
        <pre class="webgl-shader" id="webglShader" style="display:none;max-height:160px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
      </div>
    </div>
  `;

  els = {
    canvas: container.querySelector('#webglCanvas'),
    info: container.querySelector('#webglInfo'),
    cap: container.querySelector('#webglCap'),
    fps: container.querySelector('#webglFps'),
    demoLabel: container.querySelector('#webglDemoLabel'),
    shader: container.querySelector('#webglShader'),
  };

  // Init GL
  const canvas = els.canvas;
  const ctx2 = initGL(canvas);
  if (!ctx2) {
    els.info.innerHTML = '<span style="color:var(--danger)">⚠ WebGL not supported in this browser.</span> Try Chrome/Firefox with hardware acceleration.';
    els.cap.innerHTML = '<div class="muted small">No WebGL context available.</div>';
    return;
  }
  gl = ctx2;
  // Capability
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION);
    const shading = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    const exts = gl.getSupportedExtensions() || [];
    els.cap.innerHTML = `
      <div style="font:600 11px var(--font-sans);margin-bottom:6px">Capability</div>
      <div>Vendor: <b>${escapeHtml(String(vendor).slice(0,60))}</b></div>
      <div>Renderer: <b>${escapeHtml(String(renderer).slice(0,60))}</b></div>
      <div>Version: <b>${escapeHtml(String(version))}</b></div>
      <div>GLSL: <b>${escapeHtml(String(shading))}</b></div>
      <div style="margin-top:6px">Extensions: <span class="muted">${exts.slice(0,8).join(', ')}${exts.length>8?' …':''}</span> (${exts.length})</div>
    `;
    els.info.textContent = `WebGL ${gl instanceof WebGL2RenderingContext ? '2' : '1'} · ${exts.length} extensions`;
  } catch (e) {
    els.cap.textContent = 'Capability query failed: ' + e.message;
  }

  // Context lost
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (rafId) cancelAnimationFrame(rafId);
    els.info.innerHTML = '<span style="color:var(--warning)">⚠ WebGL context lost — reload to restore.</span>';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    initGL(canvas);
    loop();
  });

  // Controls
  container.querySelectorAll('[data-demo]').forEach(btn => {
    btn.addEventListener('click', () => {
      demo = btn.dataset.demo;
      container.querySelectorAll('[data-demo]').forEach(b=> b.classList.toggle('active', b.dataset.demo===demo));
      if (els.demoLabel) els.demoLabel.textContent = demo;
      save();
    });
  });
  container.querySelector('#webglWire')?.addEventListener('change', (e)=> { wireframe=e.target.checked; save(); });
  container.querySelector('#webglLight')?.addEventListener('change', (e)=> { lighting=e.target.checked; save(); });
  container.querySelector('#webglClear')?.addEventListener('input', (e)=> { clearColor=e.target.value; canvas.style.background=clearColor; save(); });
  container.querySelector('[data-action="view-shader"]')?.addEventListener('click', () => {
    const isHidden = els.shader.style.display==='none';
    els.shader.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      els.shader.textContent = `// Vertex (triangle)\nattribute vec2 aPos;\nattribute vec3 aColor;\nvarying vec3 vColor;\nvoid main(){ gl_Position = vec4(aPos,0,1); vColor=aColor; }\n\n// Fragment\nprecision mediump float;\nvarying vec3 vColor;\nvoid main(){ gl_FragColor=vec4(vColor,1); }\n\n// Cube shaders include MVP + lighting (see source)`;
    }
  });

  // Start loop
  loop();
  ctxRef?.logger?.info('webgl-lab: mounted', { demo });
}

export async function pause() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}
export async function resume() {
  if (!rafId && gl) loop();
}
export async function unmount() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  gl = null;
  programs = {};
  buffers = {};
  els = {};
  ctxRef = null;
}
export async function destroy() { await unmount(); }

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
