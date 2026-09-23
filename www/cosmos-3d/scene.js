/**
 * ============================================================================
 *  COSMOS 3D — scene.js (engine three.js)
 * ============================================================================
 *  Nội dung nằm ở scene-data.js — file này chỉ dựng hình + tương tác.
 *  Chỉnh "hình dáng vũ trụ" (kích thước, tốc độ, số sao…) ở CONFIG bên dưới.
 *
 *  three.js v0.186.0 self-host tại ../vendor/three (xem VERSION.txt để nâng cấp).
 * ============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SCENE_DATA } from './scene-data.js';
import { UI_COPY } from './i18n.js';
import { TOUR_DATA } from './tour-data.js';
import { createTour, createTourUI } from './tour.js';

/* ============================== CONFIG ============================== */
const CONFIG = {
  pixelRatioCap: 2,
  core:    { radius: 2.1, glowScale: 14, spin: 0.05 },
  planet:  { radius: 0.55, radiusStep: 0.02, orbit: 6.5, orbitStep: 2.4, speed: 0.16, speedStep: 0.012 },
  entropy: { orbit: 27, speed: 0.05, holeRadius: 1.15, ringRadius: 2.1, glowScale: 14 },
  beacon:  { radius: 16, size: 0.62 },
  stars: [
    { count: 900,  size: 1.6, rMin: 130, rMax: 210, opacity: 0.85 },
    { count: 1400, size: 2.4, rMin: 210, rMax: 310, opacity: 0.6,  tint: 0xbcd0ff },
    { count: 2200, size: 3.4, rMin: 310, rMax: 430, opacity: 0.45 },
  ],
  flyMs: 900,
  warpMs: 900,
  dragClickThreshold: 6,
};

const LEVEL_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', unknown: '#64748b' };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOCALE = document.documentElement.lang === 'en' ? 'en' : 'vi';
const $ = (s) => document.querySelector(s);
const t = (key) => UI_COPY[LOCALE]?.[key] || UI_COPY.vi[key] || key;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dirBase = (p) => (p.endsWith('/') ? p : p.replace(/[^/]*$/, ''));

/* ============================== TEXTURES ============================== */
function radialTexture(inner = 'rgba(255,255,255,.95)', mid = 'rgba(255,255,255,.32)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, mid);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GLOW_TEX = radialTexture();

function makeGlow(color, scale, opacity = 0.42) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW_TEX, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  s.scale.setScalar(scale);
  return s;
}

function makeLabel(html, cls, y, text = '') {
  const el = document.createElement('div');
  el.className = 'c3d-label ' + cls;
  el.innerHTML = html;
  el.setAttribute('aria-label', text);
  const obj = new CSS2DObject(el);
  obj.position.set(0, y, 0);
  return obj;
}

function orbitLine(radius) {
  const pts = [];
  for (let k = 0; k <= 128; k++) {
    const a = (k / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.14 }));
}

/* ============================== ITEM BUILDERS (panel/drawer) ============================== */
function coreItem() {
  const c = SCENE_DATA.core;
  return { id: 'core', zone: 'core', num: c.num, ico: c.ico, title: c.title, meta: c.meta, desc: c.desc, lore: c.lore, link: c.link, linkLabel: c.linkLabel };
}
function phaseItem(p) {
  return { id: 'phase-' + p.num, zone: 'core', num: p.num, ico: '◉', title: `${p.name} — ${p.era}`, meta: `Phase ${Number(p.num)}/${SCENE_DATA.phases.length} · ${p.cosmic}`, desc: p.desc, lore: p.lore || p.cosmic, link: '', linkLabel: '' };
}
function nodeItem(n, i) {
  return { id: 'node-' + n.id, zone: 'map', num: `NODE ${String(i + 1).padStart(2, '0')}`, ico: n.ico, title: n.name, meta: n.file, desc: n.desc, lore: n.lore || SCENE_DATA.nodeLore?.[n.id] || '', link: n.link, linkLabel: n.link ? t('panel.openSource') : '' };
}
function entropyItem(state) {
  const e = SCENE_DATA.entropy;
  const sTxt = state.s === null ? t('common.unavailable') : `S = ${state.s} (${state.level})`;
  return { id: 'entropy', zone: 'core', num: e.num, ico: e.ico, title: e.title, meta: `${e.meta} · ${sTxt}`, desc: e.desc, lore: e.lore, link: e.link, linkLabel: e.linkLabel };
}

/* ============================== SCENE BUILDERS ============================== */
function buildStars(scene) {
  return CONFIG.stars.map((cfg, li) => {
    const pos = new Float32Array(cfg.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < cfg.count; i++) {
      v.randomDirection().multiplyScalar(THREE.MathUtils.lerp(cfg.rMin, cfg.rMax, Math.random()));
      pos.set([v.x, v.y * 0.72, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: cfg.tint || 0xffffff, size: cfg.size, sizeAttenuation: true, map: GLOW_TEX,
      transparent: true, opacity: cfg.opacity, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  });
}

function buildNebula(scene) {
  const specs = [
    { color: 0x7c3aed, pos: [-64, 14, -84], scale: 96, opacity: 0.15 },
    { color: 0x06b6d4, pos: [58, -18, -66], scale: 78, opacity: 0.12 },
    { color: 0xec4899, pos: [128, 24, -40], scale: 88, opacity: 0.1 },
  ];
  specs.forEach((s) => {
    const sp = makeGlow(s.color, s.scale, s.opacity);
    sp.position.set(...s.pos);
    scene.add(sp);
  });
}

function buildCore(scene, reg) {
  const c = SCENE_DATA.core;
  const color = new THREE.Color(c.color);
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(CONFIG.core.radius, 2),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.15, flatShading: true }),
  );
  mesh.add(makeGlow(color, CONFIG.core.glowScale, 0.5));
  mesh.add(makeLabel(`${c.ico} ${c.title}`, 'c3d-label--planet', CONFIG.core.radius + 1.2, c.title));
  scene.add(mesh);
  const entry = { mesh, base: CONFIG.core.radius, label: mesh.children.find((o) => o.isCSS2DObject) };
  reg.core = entry;
  reg.pickables.push(mesh);
  reg.items.set('core', coreItem());
  mesh.userData = { item: reg.items.get('core'), entry };
  return entry;
}

function buildPlanets(scene, reg) {
  const L = SCENE_DATA.phases.length;
  SCENE_DATA.phases.forEach((p, i) => {
    const R = CONFIG.planet.orbit + i * CONFIG.planet.orbitStep;
    const rad = CONFIG.planet.radius + i * CONFIG.planet.radiusStep;
    const tilt = new THREE.Group();
    tilt.rotation.x = THREE.MathUtils.degToRad(i % 3 === 0 ? 5 : i % 3 === 1 ? -5 : 2);
    tilt.rotation.z = THREE.MathUtils.degToRad(i % 2 ? 3 : -3);
    scene.add(tilt);
    tilt.add(orbitLine(R));

    const color = new THREE.Color(p.color);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(rad, 24, 18),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.4, metalness: 0.1 }),
    );
    mesh.add(makeGlow(color, rad * 4.8, 0.36));
    mesh.add(makeLabel(`${p.num} · ${p.name}`, 'c3d-label--planet', rad + 0.8, `${p.name} — ${p.era}`));
    tilt.add(mesh);

    const entry = { mesh, orbitR: R, speed: CONFIG.planet.speed - i * CONFIG.planet.speedStep, angle: (i / L) * Math.PI * 2, label: mesh.children.find((o) => o.isCSS2DObject) };
    placeOnOrbit(mesh, entry.angle, R);
    reg.planets.push(entry);
    reg.pickables.push(mesh);
    const item = phaseItem(p);
    reg.items.set(item.id, item);
    mesh.userData = { item, entry };
  });
}

function buildEntropy(scene, reg, state) {
  const e = SCENE_DATA.entropy;
  const R = CONFIG.entropy.orbit;
  const tilt = new THREE.Group();
  tilt.rotation.x = THREE.MathUtils.degToRad(22);
  scene.add(tilt);
  tilt.add(orbitLine(R));

  const holder = new THREE.Group();
  const color = new THREE.Color(0xef4444);
  const hole = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.entropy.holeRadius, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0x020409 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(CONFIG.entropy.ringRadius, 0.16, 12, 64),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.4 }),
  );
  ring.rotation.x = Math.PI / 2;
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(CONFIG.entropy.ringRadius * 1.22, 0.045, 8, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }),
  );
  ring2.rotation.x = Math.PI / 2;
  const halo = makeGlow(color, CONFIG.entropy.glowScale, 0.24);
  holder.add(hole, ring, ring2, halo);
  holder.add(makeLabel(`${e.ico} ${e.title}`, 'c3d-label--planet', CONFIG.entropy.ringRadius + 0.9, e.title));
  tilt.add(holder);

  const entry = { mesh: holder, ring, ring2, halo, orbitR: R, speed: CONFIG.entropy.speed, angle: 2.4, label: holder.children.find((o) => o.isCSS2DObject), state };
  placeOnOrbit(holder, entry.angle, R);
  applyEntropyState(entry, state);
  reg.entropy = entry;
  const item = entropyItem(state);
  reg.items.set('entropy', item);
  [hole, ring].forEach((m) => { m.userData = { item, entry }; reg.pickables.push(m); });
  return entry;
}

function applyEntropyState(entry, state) {
  const color = new THREE.Color(LEVEL_COLOR[state.level] || LEVEL_COLOR.unknown);
  [entry.ring, entry.ring2].forEach((mesh) => {
    if (!mesh) return;
    mesh.material.color.copy(color);
    if (mesh.material.emissive) mesh.material.emissive.copy(color);
    mesh.material.emissiveIntensity = state.s === null ? 0.5 : 1.4;
  });
  if (entry.halo) entry.halo.material.color.copy(color);
}

function buildBeacons(scene, reg) {
  const N = SCENE_DATA.nodes.length;
  const center = new THREE.Vector3(...SCENE_DATA.zones.map.target);
  const golden = Math.PI * (3 - Math.sqrt(5));
  SCENE_DATA.nodes.forEach((n, i) => {
    const y = N === 1 ? 0 : 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    const color = new THREE.Color(n.color);
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(CONFIG.beacon.size, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1, roughness: 0.35, metalness: 0.2, flatShading: true }),
    );
    mesh.position.copy(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(CONFIG.beacon.radius).add(center));
    mesh.add(makeGlow(color, CONFIG.beacon.size * 4.2, 0.34));
    const label = makeLabel(`<span class="ico">${n.ico}</span>${esc(n.name)}`, 'c3d-label--beacon', CONFIG.beacon.size + 0.6, n.name);
    label.visible = false;
    mesh.add(label);
    scene.add(mesh);

    const entry = { mesh, label };
    reg.beacons.push(entry);
    reg.pickables.push(mesh);
    const item = nodeItem(n, i);
    reg.items.set(item.id, item);
    mesh.userData = { item, entry };
  });
}

function placeOnOrbit(mesh, angle, radius) {
  mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

function buildConstellation(scene, reg) {
  const byId = new Map(reg.beacons.map((entry) => [entry.mesh.userData.item.id.replace('node-', ''), entry.mesh]));
  const positions = [];
  const colors = [];
  const center = new THREE.Vector3(...SCENE_DATA.zones.map.target);
  const lineColor = new THREE.Color(0x67e8f9);
  for (const [fromId, toId] of SCENE_DATA.links) {
    const from = byId.get(fromId);
    const to = byId.get(toId);
    if (!from || !to) continue;
    const a = from.position.clone().sub(center);
    const b = to.position.clone().sub(center);
    positions.push(...a.toArray(), ...b.toArray());
    colors.push(...lineColor.toArray(), ...lineColor.toArray());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.visible = false;
  scene.add(lines);
  reg.constellation = { lines, segments: positions.length / 6 };
  return reg.constellation;
}

/* ============================== HOVER ============================== */
function highlight(entry) {
  if (!entry) return;
  entry.mesh.scale.setScalar(1.18);
  entry.mesh.traverse?.((o) => { if (o.material && o.material.emissiveIntensity) o.material.emissiveIntensity *= 2.2; });
  if (entry.label) entry.label.element.classList.add('on');
}
function unhighlight(entry) {
  if (!entry) return;
  entry.mesh.scale.setScalar(1);
  entry.mesh.traverse?.((o) => { if (o.material && o.material.emissiveIntensity) o.material.emissiveIntensity /= 2.2; });
  if (entry.label) entry.label.element.classList.remove('on');
}

/* ============================== UI (panel · drawer · zone · fly) ============================== */
function makeFly(camera, controls) {
  const f = { active: false, t: 0, dur: 1, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTgt: new THREE.Vector3(), toTgt: new THREE.Vector3() };
  function flyTo(pos, target, instant) {
    if (instant || REDUCED) { camera.position.copy(pos); controls.target.copy(target); f.active = false; return; }
    f.active = true; f.t = 0; f.dur = CONFIG.flyMs / 1000;
    f.fromPos.copy(camera.position); f.toPos.copy(pos);
    f.fromTgt.copy(controls.target); f.toTgt.copy(target);
  }
  function stepFly(dt) {
    if (!f.active) return;
    f.t += dt / f.dur;
    const k = Math.min(1, f.t);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(f.fromPos, f.toPos, e);
    controls.target.lerpVectors(f.fromTgt, f.toTgt, e);
    if (k >= 1) f.active = false;
  }
  return { flyTo, stepFly };
}

function makePanel(controls) {
  const panel = $('#panel');
  let open = false;
  let restoreFocus = null;
  function openItem(item, opts = {}) {
    if (!item) return;
    open = true;
    if (!opts.restore) restoreFocus = opts.trigger || document.activeElement;
    controls.autoRotate = false;                       // đang đọc → không tự quay
    $('#panelNum').textContent = item.num;
    $('#panelIco').textContent = item.ico;
    $('#panelTitle').textContent = item.title;
    $('#panelMeta').textContent = item.meta;
    $('#panelDesc').textContent = item.desc;
    const lore = $('#panelLore');
    lore.textContent = item.lore || '';
    lore.hidden = !item.lore;
    const link = $('#panelLink');
    if (item.link) { link.href = item.link; link.textContent = item.linkLabel || '→ mở'; link.hidden = false; }
    else { link.hidden = true; }
    panel.classList.add('open');
    if (opts.focus) $('#panelClose').focus({ preventScroll: true });
  }
  function closePanel() {
    if (!open) return;
    open = false;
    panel.classList.remove('open');
    controls.autoRotate = !REDUCED;
    if (restoreFocus && typeof restoreFocus.focus === 'function') restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
  }
  return { openItem, closePanel, isOpen: () => open };
}

function setLabel(entry, on) { if (entry && entry.label) entry.label.visible = on; }

/** HUD entropy: S + màu mức (low/medium/high). */
function paintEntropyHud(st) {
  const hudS = $('#hudS');
  hudS.textContent = st.s === null ? '—' : String(st.s);
  hudS.className = st.s === null ? '' : st.level === 'high' ? 'hot' : st.level === 'medium' ? 'warn' : 'ok';
}

function formatFreshness(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('common.unavailable');
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(date);
}

function paintTelemetry(data) {
  const signal = $('#telemetryState');
  const source = $('#telemetrySource');
  const generated = $('#telemetryGenerated');
  source.textContent = data.source;
  generated.textContent = `${t('telemetry.generated')} · ${formatFreshness(data.generatedAt)}`;
  signal.className = `signal-dot ${data.stale ? 'stale' : ''}`;
  signal.title = data.stale ? t('telemetry.stale') : t('telemetry.fresh');
  $('#hudS').textContent = data.signals.entropy;
  $('#hudPolicy').textContent = data.signals.policy ? 'OK' : 'BLOCK';
  $('#hudDissent').textContent = data.signals.dissent;
  $('#hudGravity').textContent = data.signals.gravity;
  $('#hudKn').textContent = data.signals.kn;
}

function makeZones({ camera, reg, flyTo, closePanel }) {
  let current = 'core';
  let lastZone = '';
  /** Vị trí camera cho zone — tự lùi xa hơn khi aspect hẹp (mobile/tablet) để không cắt nhãn ở rìa. */
  function viewFor(name) {
    const z = SCENE_DATA.zones[name];
    const tgt = new THREE.Vector3(...z.target);
    const k = camera.aspect < 1.1 ? 1.35 : camera.aspect < 1.5 ? 1.15 : 1;
    const pos = tgt.clone().add(new THREE.Vector3(...z.pos).sub(tgt).multiplyScalar(k));
    return { pos, tgt, label: z.label };
  }
  function switchZone(name, opts = {}) {
    if (!SCENE_DATA.zones[name]) return;
    const warp = $('#warp');
    if (warp) {
      warp.dataset.warp = name;
      if (lastZone !== name) {
        lastZone = name;
        warp.classList.remove('active');
        // Keep active as the state marker until the next zone change; CSS owns the visual fade.
        warp.classList.add('active');
      }
    }
    current = name;
    const v = viewFor(name);
    flyTo(v.pos, v.tgt, opts.instant);
    document.querySelectorAll('.switcher .btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zone === name)));
    $('#hudZone').textContent = v.label;
    setLabel(reg.core, name === 'core');
    reg.planets.forEach((e) => setLabel(e, name === 'core'));
    setLabel(reg.entropy, name === 'core');
    reg.beacons.forEach((e) => setLabel(e, name === 'map'));
    if (reg.constellation) reg.constellation.lines.visible = name === 'map';
    if (!opts.silent) closePanel();
  }
  return { switchZone, viewFor, current: () => current };
}

function makeHero({ flyTo, viewFor, getZone }) {
  const hero = $('#hero');
  function hideHero() {
    if (!hero || hero.classList.contains('hide')) return;
    hero.classList.add('hide');
    const v = viewFor(getZone());
    flyTo(v.pos, v.tgt);
  }
  return { hideHero };
}

function buildDrawer({ reg, onPick }) {
  const list = $('#drawerList');
  const sep = (t) => { const li = document.createElement('li'); li.className = 'drawer-sep'; li.textContent = t; list.appendChild(li); };
  const add = (ico, name, tag, item) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'drawer-item';
    b.innerHTML = `<span class="ico" aria-hidden="true">${esc(ico)}</span><span class="nm">${esc(name)}</span><span class="tag">${esc(tag)}</span>`;
    b.addEventListener('click', () => onPick(item));
    li.appendChild(b); list.appendChild(li);
  };
  sep('LÕI & PIPELINE');
  const core = reg.items.get('core');
  add(core.ico, core.title, 'CORE', core);
  SCENE_DATA.phases.forEach((p) => add('🪐', `${p.num} ${p.name}`, 'PHASE', reg.items.get('phase-' + p.num)));
  sep('ENTROPY');
  const ent = reg.items.get('entropy');
  add(ent.ico, ent.title, 'S', ent);
  sep('VÙNG HỆ THỐNG');
  SCENE_DATA.nodes.forEach((n) => add(n.ico, n.name, n.file.split(/[/ ]/)[0], reg.items.get('node-' + n.id)));
}

function makeTourController({ reg, zones, panel, hero }) {
  let ui;
  const tour = createTour({
    stops: TOUR_DATA.stops,
    intervalMs: TOUR_DATA.intervalMs,
    reduced: REDUCED,
    onStep: (step) => {
      zones.switchZone(step.zone || 'core', { silent: true });
      if (step.target) panel.openItem(reg.items.get(step.target), { focus: false, restore: true });
      const mark = $('#tourMark');
      if (mark) mark.textContent = step.ico || '✦';
    },
    onState: (state) => ui?.sync(state),
  });
  ui = createTourUI({ tour, reduced: REDUCED });
  return { tour, open: () => { hero.hideHero(); tour.start(0); } };
}

function wireUI({ camera, controls, reg, entropyState, telemetry }) {
  const drawer = $('#drawer');
  const state = { booted: false, entropy: entropyState, telemetry };
  const { flyTo, stepFly } = makeFly(camera, controls);
  const panel = makePanel(controls);
  const zones = makeZones({ camera, reg, flyTo, closePanel: panel.closePanel });
  const hero = makeHero({ flyTo, viewFor: zones.viewFor, getZone: zones.current });
  const tourController = makeTourController({ reg, zones, panel, hero });
  const tour = tourController.tour;

  function toggleDrawer(on) {
    const show = typeof on === 'boolean' ? on : drawer.hidden;
    drawer.hidden = !show;
    $('#btnDrawer').setAttribute('aria-expanded', String(show));
  }

  function applyEntropy(st, entry) {
    state.entropy = st;
    paintEntropyHud(st);
    if (entry) applyEntropyState(entry, st);
  }

  function firstFrame() {
    if (state.booted) return;
    state.booted = true;
    $('#boot').classList.add('hide');
    $('#hudCount').textContent = String(reg.pickables.length);
    paintTelemetry(state.telemetry);
  }

  function wireEvents() {
    document.querySelectorAll('.switcher .btn').forEach((b) => b.addEventListener('click', () => zones.switchZone(b.dataset.zone)));
    const openTour = () => { tourController.open(); $('#btnTour').setAttribute('aria-expanded', 'true'); };
    $('#btnTour').addEventListener('click', openTour);
    $('#btnTourHero').addEventListener('click', openTour);
    $('#panelClose').addEventListener('click', panel.closePanel);
    $('#btnDrawer').addEventListener('click', () => toggleDrawer());
    $('#btnDrawerClose').addEventListener('click', () => toggleDrawer(false));
    $('#btnExplore').addEventListener('click', hero.hideHero);
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      if (panel.isOpen()) panel.closePanel();
      else if (!drawer.hidden) toggleDrawer(false);
      else hero.hideHero();
    });
  }

  buildDrawer({
    reg,
    onPick: (item) => { zones.switchZone(item.zone); panel.openItem(item, { focus: true }); toggleDrawer(false); },
  });
  wireEvents();

  return {
    openItem: panel.openItem, closePanel: panel.closePanel, switchZone: zones.switchZone,
    stepFly, firstFrame, applyEntropy, hideHero: hero.hideHero, toggleDrawer,
    startTour: () => tour.start(0), stopTour: tour.stop, nextTour: tour.next, prevTour: tour.prev,
    tourState: tour.state,
    telemetry: () => state.telemetry,
    constellation: () => reg.constellation,
    stats: () => ({ zone: zones.current(), panelOpen: panel.isOpen(), booted: state.booted, entropy: state.entropy }),
  };
}

/* ============================== POINTER (hover · click) ============================== */
function wirePointer(renderer, camera, reg, ui) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvas = renderer.domElement;
  let hovered = null;
  let down = null;

  function pick(ev) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(reg.pickables, false);
    return hits.length ? hits[0].object : null;
  }

  function setHover(mesh) {
    if (hovered === mesh) return;
    if (hovered) unhighlight(hovered.userData.entry);
    hovered = mesh;
    if (mesh) highlight(mesh.userData.entry);
    canvas.style.cursor = mesh ? 'pointer' : 'grab';
  }

  canvas.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse') setHover(pick(ev)); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerdown', (ev) => { down = { x: ev.clientX, y: ev.clientY }; ui.hideHero(); });
  canvas.addEventListener('pointerup', (ev) => {
    if (!down) return;
    const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
    down = null;
    if (moved > CONFIG.dragClickThreshold) return;   // vừa kéo orbit — không tính là click
    const mesh = pick(ev);
    if (mesh) ui.openItem(mesh.userData.item);
    else ui.closePanel();
  });

  return { hovered: () => (hovered ? hovered.userData.item.id : null) };
}

/* ============================== MAIN ============================== */
function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

function createGfx(canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.pixelRatioCap));
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'c3d-labels';
    labelRenderer.domElement.setAttribute('aria-hidden', 'true');
    $('#stage').appendChild(labelRenderer.domElement);
    return { renderer, labelRenderer };
  } catch { return null; }
}

function makeResize({ canvas, camera, renderer, labelRenderer }) {
  return function onResize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
  };
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0x38406b, 0.9));
  const coreLight = new THREE.PointLight(0xc4b5fd, 60, 260, 1.8);
  scene.add(coreLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(30, 40, 25);
  scene.add(keyLight);
}

/** Quỹ đạo + nhịp thở của lõi — chỉ chạy khi không reduced-motion. */
function advanceBodies(reg, dt, t) {
  reg.planets.forEach((e) => { e.angle += dt * e.speed; placeOnOrbit(e.mesh, e.angle, e.orbitR); });
  reg.entropy.angle += dt * reg.entropy.speed;
  placeOnOrbit(reg.entropy.mesh, reg.entropy.angle, reg.entropy.orbitR);
  reg.entropy.ring.rotation.z += dt * 0.6;
  reg.entropy.ring2.rotation.z -= dt * 0.32;
  reg.entropy.ring2.scale.setScalar(1 + Math.sin(t * 1.4) * 0.025);
  reg.core.mesh.rotation.y += dt * CONFIG.core.spin;
  reg.core.mesh.scale.setScalar(1 + Math.sin(t * 1.6) * 0.02);
  reg.starLayers.forEach((s, i) => { s.rotation.y += dt * (0.004 + i * 0.0015); });
}

/** Vòng lặp render — dừng khi tab ẩn (KN-031). */
function startLoop({ scene, camera, controls, renderer, labelRenderer, reg, ui }) {
  const timer = new THREE.Timer();
  if (typeof timer.connect === 'function') timer.connect(document);
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    if (!REDUCED) advanceBodies(reg, dt, timer.getElapsed());
    ui.stepFly(dt);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    ui.firstFrame();
  }
  requestAnimationFrame(loop);
}

async function main() {
  if (!hasWebGL2()) { showFallback(); return; }
  const canvas = $('#c3d-canvas');
  const gfx = createGfx(canvas);
  if (!gfx) { showFallback(); return; }
  const { renderer, labelRenderer } = gfx;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050810);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
  camera.position.copy(REDUCED ? new THREE.Vector3(...SCENE_DATA.zones.core.pos) : new THREE.Vector3(0, 30, 92));

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.enablePan = false;
  controls.autoRotate = !REDUCED;
  controls.autoRotateSpeed = 0.35;
  controls.target.set(...SCENE_DATA.zones.core.target);
  addLights(scene);

  const reg = { pickables: [], planets: [], beacons: [], items: new Map(), core: null, entropy: null, starLayers: [] };
  reg.starLayers = buildStars(scene);
  buildNebula(scene);
  buildCore(scene, reg);
  buildPlanets(scene, reg);
  const entropyState = await loadEntropyState();
  const telemetry = await loadTelemetry();
  const entropyEntry = buildEntropy(scene, reg, entropyState);
  buildBeacons(scene, reg);
  buildConstellation(scene, reg);

  const ui = wireUI({ camera, controls, reg, entropyState, telemetry });
  const pointer = wirePointer(renderer, camera, reg, ui);
  exposeApi({ reg, ui, pointer, camera });

  const onResize = makeResize({ canvas, camera, renderer, labelRenderer });
  onResize();
  window.addEventListener('resize', onResize);

  ui.applyEntropy(entropyState, entropyEntry);
  ui.switchZone('core', { silent: true, instant: REDUCED });
  startLoop({ scene, camera, controls, renderer, labelRenderer, reg, ui });
}

async function loadEntropyState() {
  try {
    const res = await fetch(dirBase(location.pathname) + '../cosmos/scale.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('scale.json ' + res.status);
    const j = await res.json();
    const S = Number(j?.entropy?.S);
    if (!Number.isFinite(S)) throw new Error('S missing');
    return { s: S, level: j?.entropy?.level || (S >= 25 ? 'high' : S >= 10 ? 'medium' : 'low') };
  } catch { return { s: null, level: 'unknown' }; }
}

function telemetrySignals(j) {
  const read = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : '—';
  };
  return {
    entropy: read(j?.entropy?.S),
    policy: j?.policy?.ok === true,
    dissent: read(j?.darkEnergy?.D),
    gravity: read(j?.gravity?.G),
    kn: read(j?.counts?.knTotal),
  };
}

function telemetryFreshness(generatedAt) {
  const time = new Date(generatedAt).getTime();
  const ageHours = (Date.now() - time) / 3600000;
  return !Number.isFinite(ageHours) || ageHours > SCENE_DATA.telemetry.staleAfterHours;
}

async function loadTelemetry() {
  const source = SCENE_DATA.telemetry.source;
  try {
    const res = await fetch(dirBase(location.pathname) + source, { cache: 'no-store' });
    if (!res.ok) throw new Error('scale.json ' + res.status);
    const j = await res.json();
    const generatedAt = j.generatedAt || '';
    return { source, generatedAt, stale: telemetryFreshness(generatedAt), signals: telemetrySignals(j) };
  } catch {
    return { source, generatedAt: '', stale: true, signals: telemetrySignals({}) };
  }
}

function showFallback() {
  $('#fallback').hidden = false;
  $('#boot').classList.add('hide');
  const hero = $('#hero');
  if (hero) hero.classList.add('hide');
}

/* API cho guard test (tests/e2e/cosmos-3d.spec.ts) — contract, không phải UI. */
function exposeApi({ reg, ui, pointer, camera }) {
  window.__COSMOS3D = {
    ready: true,
    stats: () => ({
      webgl: true,
      objects: reg.pickables.length,
      items: reg.items.size,
      phases: SCENE_DATA.phases.length,
      nodes: SCENE_DATA.nodes.length,
      labels: [reg.core, ...reg.planets, ...reg.beacons, reg.entropy].filter((e) => e && e.label).length,
      reducedMotion: REDUCED,
      ...ui.stats(),
      entropyS: ui.stats().entropy ? ui.stats().entropy.s : null,
    }),
    open: (id) => { const it = reg.items.get(id); if (it) { ui.switchZone(it.zone); ui.openItem(it); } return !!it; },
    zone: (z) => ui.switchZone(z),
    startTour: ui.startTour,
    stopTour: ui.stopTour,
    nextTour: ui.nextTour,
    prevTour: ui.prevTour,
    tourState: ui.tourState,
    telemetry: () => ui.telemetry(),
    constellation: () => {
      const c = ui.constellation();
      return c ? { segments: c.segments, visible: c.lines.visible } : { segments: 0, visible: false };
    },
    hovered: () => pointer.hovered(),
    cameraPos: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
  };
}

main().catch((err) => {
  console.error('[cosmos-3d]', err);
  showFallback();
});
