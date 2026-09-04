export const manifest = {
  id: 'device-lab',
  name: 'Device Lab',
  version: '1.0.0',
  category: 'device',
  description: 'Geolocation, orientation, motion, battery, network, clipboard, share, fullscreen — capability-aware.',
  dependencies: [],
  permissions: ['location'],
  lazy: true,
  icon: '📱',
};

let els = {};
let ctxRef = null;
let orientationHandler = null;
let motionHandler = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hasAPI(name) {
  const checks = {
    geolocation: () => 'geolocation' in navigator,
    orientation: () => 'DeviceOrientationEvent' in window,
    motion: () => 'DeviceMotionEvent' in window,
    vibration: () => 'vibrate' in navigator,
    battery: () => 'getBattery' in navigator,
    network: () => 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator,
    clipboard: () => !!navigator.clipboard,
    share: () => !!navigator.share,
    fullscreen: () => !!document.documentElement.requestFullscreen,
  };
  try { return checks[name] ? checks[name]() : false; } catch { return false; }
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  container.innerHTML = `
    <div class="device-grid">
      <div class="device-card" data-device="geolocation">
        <div class="device-card-head"><span>📍 Geolocation</span><span class="badge ${hasAPI('geolocation')?'badge-ok':'badge-error'}">${hasAPI('geolocation')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="geoBody"><span class="muted small">Click Get Location</span></div>
        <button class="btn btn-primary btn-xs" data-action="geo">Get Location</button>
      </div>
      <div class="device-card" data-device="orientation">
        <div class="device-card-head"><span>🧭 Orientation</span><span class="badge ${hasAPI('orientation')?'badge-ok':'badge-error'}">${hasAPI('orientation')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="orientBody"><span class="muted small">Waiting…</span></div>
        <button class="btn btn-ghost btn-xs" data-action="orient-start">Start</button>
        <button class="btn btn-ghost btn-xs" data-action="orient-stop">Stop</button>
      </div>
      <div class="device-card" data-device="motion">
        <div class="device-card-head"><span>🏃 Motion</span><span class="badge ${hasAPI('motion')?'badge-ok':'badge-error'}">${hasAPI('motion')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="motionBody"><span class="muted small">Waiting…</span></div>
        <button class="btn btn-ghost btn-xs" data-action="motion-start">Start</button>
        <button class="btn btn-ghost btn-xs" data-action="motion-stop">Stop</button>
      </div>
      <div class="device-card" data-device="vibration">
        <div class="device-card-head"><span>📳 Vibration</span><span class="badge ${hasAPI('vibration')?'badge-ok':'badge-error'}">${hasAPI('vibration')?'✓':'✗'}</span></div>
        <div class="device-card-body"><span class="muted small">${hasAPI('vibration')?'Tap to vibrate':'Not supported'}</span></div>
        <button class="btn btn-ghost btn-xs" data-action="vibrate">Vibrate 200ms</button>
        <button class="btn btn-ghost btn-xs" data-action="vibrate-pattern">Pattern</button>
      </div>
      <div class="device-card" data-device="battery">
        <div class="device-card-head"><span>🔋 Battery</span><span class="badge ${hasAPI('battery')?'badge-ok':'badge-error'}">${hasAPI('battery')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="batteryBody"><span class="muted small">Checking…</span></div>
        <button class="btn btn-ghost btn-xs" data-action="battery">Refresh</button>
      </div>
      <div class="device-card" data-device="network">
        <div class="device-card-head"><span>🌐 Network Info</span><span class="badge ${hasAPI('network')?'badge-ok':'badge-error'}">${hasAPI('network')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="networkBody"><span class="muted small">Checking…</span></div>
        <button class="btn btn-ghost btn-xs" data-action="network">Refresh</button>
      </div>
      <div class="device-card" data-device="screen">
        <div class="device-card-head"><span>🖥 Screen</span><span class="badge badge-ok">✓</span></div>
        <div class="device-card-body" id="screenBody"></div>
      </div>
      <div class="device-card" data-device="clipboard">
        <div class="device-card-head"><span>📋 Clipboard</span><span class="badge ${hasAPI('clipboard')?'badge-ok':'badge-error'}">${hasAPI('clipboard')?'✓':'✗'}</span></div>
        <div class="device-card-body">
          <input id="clipInput" placeholder="Text to copy" style="width:100%;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
          <div style="display:flex;gap:6px;margin-top:6px">
            <button class="btn btn-ghost btn-xs" data-action="clip-copy">Copy</button>
            <button class="btn btn-ghost btn-xs" data-action="clip-paste">Paste</button>
          </div>
          <div class="muted small" id="clipBody" style="margin-top:6px;word-break:break-all"></div>
        </div>
      </div>
      <div class="device-card" data-device="share">
        <div class="device-card-head"><span>📤 Web Share</span><span class="badge ${hasAPI('share')?'badge-ok':'badge-error'}">${hasAPI('share')?'✓':'✗'}</span></div>
        <div class="device-card-body"><span class="muted small">${hasAPI('share')?'Share current page':'Not supported (HTTPS + mobile)'}</span></div>
        <button class="btn btn-ghost btn-xs" data-action="share">Share</button>
      </div>
      <div class="device-card" data-device="fullscreen">
        <div class="device-card-head"><span>⛶ Fullscreen</span><span class="badge ${hasAPI('fullscreen')?'badge-ok':'badge-error'}">${hasAPI('fullscreen')?'✓':'✗'}</span></div>
        <div class="device-card-body" id="fsBody"><span class="muted small">Click to toggle</span></div>
        <button class="btn btn-ghost btn-xs" data-action="fullscreen">Toggle Fullscreen</button>
      </div>
    </div>
  `;

  els = {
    geoBody: container.querySelector('#geoBody'),
    orientBody: container.querySelector('#orientBody'),
    motionBody: container.querySelector('#motionBody'),
    batteryBody: container.querySelector('#batteryBody'),
    networkBody: container.querySelector('#networkBody'),
    screenBody: container.querySelector('#screenBody'),
    clipInput: container.querySelector('#clipInput'),
    clipBody: container.querySelector('#clipBody'),
    fsBody: container.querySelector('#fsBody'),
  };

  // Screen info
  function updateScreen() {
    if (!els.screenBody) return;
    els.screenBody.innerHTML = `
      <div>Screen: <b>${screen.width}×${screen.height}</b></div>
      <div>Window: <b>${window.innerWidth}×${window.innerHeight}</b></div>
      <div>DPR: <b>${window.devicePixelRatio}</b></div>
      <div>Pixel ratio: <b>${window.devicePixelRatio}</b></div>
      <div>Orientation: <b>${screen.orientation?.type || 'unknown'}</b></div>
    `;
  }
  updateScreen();
  window.addEventListener('resize', updateScreen);

  // Geolocation
  container.querySelector('[data-action="geo"]')?.addEventListener('click', () => {
    if (!hasAPI('geolocation')) { els.geoBody.textContent = 'Not supported'; return; }
    els.geoBody.textContent = 'Requesting…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        els.geoBody.innerHTML = `<div>Lat: <b>${pos.coords.latitude.toFixed(5)}</b></div><div>Lon: <b>${pos.coords.longitude.toFixed(5)}</b></div><div>Accuracy: <b>${pos.coords.accuracy}m</b></div>`;
      },
      (err) => { els.geoBody.innerHTML = `<span style="color:var(--danger)">${escapeHtml(err.message)}</span>`; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Orientation
  container.querySelector('[data-action="orient-start"]')?.addEventListener('click', async () => {
    if (!hasAPI('orientation')) return;
    // iOS requires permission
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') { els.orientBody.textContent = 'Permission denied'; return; }
      }
    } catch {}
    orientationHandler = (e) => {
      els.orientBody.innerHTML = `<div>α: <b>${(e.alpha??0).toFixed(1)}°</b></div><div>β: <b>${(e.beta??0).toFixed(1)}°</b></div><div>γ: <b>${(e.gamma??0).toFixed(1)}°</b></div>`;
    };
    window.addEventListener('deviceorientation', orientationHandler);
    els.orientBody.textContent = 'Listening… move device';
  });
  container.querySelector('[data-action="orient-stop"]')?.addEventListener('click', () => {
    if (orientationHandler) window.removeEventListener('deviceorientation', orientationHandler);
    orientationHandler = null;
    els.orientBody.textContent = 'Stopped';
  });

  // Motion
  container.querySelector('[data-action="motion-start"]')?.addEventListener('click', async () => {
    if (!hasAPI('motion')) return;
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') { els.motionBody.textContent = 'Permission denied'; return; }
      }
    } catch {}
    motionHandler = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      els.motionBody.innerHTML = `<div>x: <b>${(acc.x??0).toFixed(2)}</b></div><div>y: <b>${(acc.y??0).toFixed(2)}</b></div><div>z: <b>${(acc.z??0).toFixed(2)}</b></div>`;
    };
    window.addEventListener('devicemotion', motionHandler);
    els.motionBody.textContent = 'Listening… move device';
  });
  container.querySelector('[data-action="motion-stop"]')?.addEventListener('click', () => {
    if (motionHandler) window.removeEventListener('devicemotion', motionHandler);
    motionHandler = null;
    els.motionBody.textContent = 'Stopped';
  });

  // Vibration
  container.querySelector('[data-action="vibrate"]')?.addEventListener('click', () => {
    if (hasAPI('vibration')) navigator.vibrate(200);
  });
  container.querySelector('[data-action="vibrate-pattern"]')?.addEventListener('click', () => {
    if (hasAPI('vibration')) navigator.vibrate([100, 50, 100, 50, 200]);
  });

  // Battery
  async function updateBattery() {
    if (!hasAPI('battery')) { els.batteryBody.textContent = 'Not supported'; return; }
    try {
      const bat = await navigator.getBattery();
      els.batteryBody.innerHTML = `<div>Level: <b>${Math.round(bat.level*100)}%</b></div><div>Charging: <b>${bat.charging?'Yes':'No'}</b></div><div>Charging time: <b>${bat.chargingTime===Infinity?'—':bat.chargingTime+'s'}</b></div>`;
    } catch (e) { els.batteryBody.textContent = 'Error: ' + e.message; }
  }
  updateBattery();
  container.querySelector('[data-action="battery"]')?.addEventListener('click', updateBattery);

  // Network
  function updateNetwork() {
    if (!hasAPI('network')) { els.networkBody.textContent = 'Not supported'; return; }
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) { els.networkBody.textContent = 'No connection info'; return; }
    els.networkBody.innerHTML = `<div>Type: <b>${conn.effectiveType||conn.type||'unknown'}</b></div><div>Downlink: <b>${conn.downlink||'—'} Mbps</b></div><div>RTT: <b>${conn.rtt||'—'} ms</b></div><div>SaveData: <b>${conn.saveData?'Yes':'No'}</b></div>`;
  }
  updateNetwork();
  container.querySelector('[data-action="network"]')?.addEventListener('click', updateNetwork);

  // Clipboard
  container.querySelector('[data-action="clip-copy"]')?.addEventListener('click', async () => {
    const text = els.clipInput.value;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); els.clipBody.textContent = 'Copied ✓'; } catch (e) { els.clipBody.textContent = 'Copy failed: ' + e.message; }
  });
  container.querySelector('[data-action="clip-paste"]')?.addEventListener('click', async () => {
    try { const text = await navigator.clipboard.readText(); els.clipBody.textContent = 'Pasted: ' + text.slice(0,200); els.clipInput.value = text; } catch (e) { els.clipBody.textContent = 'Paste failed: ' + e.message + ' (requires permission)'; }
  });

  // Share
  container.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    if (!hasAPI('share')) { alert('Web Share not supported'); return; }
    try { await navigator.share({ title: 'WEB UNIVERSE', text: 'Check out WEB UNIVERSE — Modular Browser OS', url: location.href }); } catch (e) { if (e.name!=='AbortError') alert('Share failed: ' + e.message); }
  });

  // Fullscreen
  function updateFS() {
    if (!els.fsBody) return;
    els.fsBody.textContent = document.fullscreenElement ? '● Fullscreen active' : '○ Not fullscreen';
  }
  document.addEventListener('fullscreenchange', updateFS);
  updateFS();
  container.querySelector('[data-action="fullscreen"]')?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (e) { alert('Fullscreen failed: ' + e.message); }
  });

  ctxRef?.logger?.info('device-lab: mounted');
}

export async function unmount() {
  if (orientationHandler) window.removeEventListener('deviceorientation', orientationHandler);
  if (motionHandler) window.removeEventListener('devicemotion', motionHandler);
  orientationHandler=null; motionHandler=null;
  els={}; ctxRef=null;
}
export async function destroy() { await unmount(); }
