# Design: WEB 011 Part 5 — CONCURRENCY + DEVICE + AUDIO ENGINE + PWA

> Design system kế thừa Part 1-4 + wireframe cho 4 labs.

## 1. Design System (kế thừa)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` + `JetBrains Mono`
- Spacing 4/8, radius 8/12/16

### Module-specific tokens
```css
--concurrency-bar-main: #ef4444;
--concurrency-bar-1w: #f59e0b;
--concurrency-bar-4w: #10b981;
--device-ok: #10b981;
--device-warn: #f59e0b;
--device-error: #ef4444;
--audio-key-white: #ffffff;
--audio-key-black: #0f172a;
--audio-key-active: #6366f1;
--pwa-online: #10b981;
--pwa-offline: #ef4444;
```

## 2. Wireframe

### Concurrency Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Prime] [Sort] [Matrix]  [Run Benchmark]                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ MAIN THREAD  ████████████████████ 820ms              │ │
│ │ 1 WORKER     ██████               290ms              │ │
│ │ 4 WORKERS    ██                   110ms              │ │
│ └─────────────────────────────────────────────────────┘ │
│ [MessageChannel] [BroadcastChannel] [SharedWorker]      │
│ Status: ✓/✗ per API                                     │
└─────────────────────────────────────────────────────────┘
```

### Device Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Grid: Geolocation | Orientation | Motion | Battery      │
│       Network Info | Screen | DPR | Clipboard | Share   │
│ Each: ✓/⚠/✗ + value + [Request/Test] button            │
│ [Get Location] [Vibrate] [Copy] [Share] [Fullscreen]    │
└─────────────────────────────────────────────────────────┘
```

### Audio Engine — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Oscillator] [Filter] [Synth] [Drum]                    │
│ Oscillator: [sine/square/saw/tri] Freq ● Gain ●         │
│ Filter: [lowpass/highpass] Freq ● Q ●                   │
│ Analyser: Frequency canvas + Waveform canvas            │
│ Synth: Piano keys  Drum: [Kick] [Snare] [Hihat]         │
└─────────────────────────────────────────────────────────┘
```

### PWA Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Manifest: name, icons, display, theme_color             │
│ SW: ● Registered / ○ Not registered  [Update]           │
│ Cache: size, entries  [Clear Cache]                     │
│ Offline: ● Online / 🔴 Offline  [Test Offline]          │
│ Install: [Install Prompt] if available                  │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- Concurrency: bars stack, controls wrap
- Device: grid 1 col, cards stack
- Audio: controls stack, keys wrap, canvas full-width
- PWA: single column

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Benchmark bars | main/1w/4w | colored, width = time/max, transition |
| Benchmark controls | default/running | task selector, run button, results |
| Channel demo | supported/not | MessageChannel, BroadcastChannel, SharedWorker |
| Device card | ok/warn/error | icon, value, capability badge, action |
| Audio oscillator | sine/square/saw/tri | type selector, freq/gain sliders, play/stop |
| Audio filter | lowpass/highpass | type, freq, Q, bypass |
| Analyser canvas | frequency/waveform | canvas, toggle |
| Synth keys | white/black/active | piano layout, mouse/touch/keyboard |
| Drum pads | kick/snare/hihat | buttons, play |
| PWA status | online/offline | badge, manifest, SW, cache |

## 4. Architecture

### Concurrency Lab
- Worker: `new Worker(URL.createObjectURL(new Blob([code], {type:'application/javascript'})))`
- Pool: 4 workers, distribute tasks, collect results, terminate on unmount
- Tasks: prime (count primes up to N), sort (large array), matrix (multiply)
- Benchmark: `performance.now()` before/after, real timing, not hard-code
- MessageChannel: `new MessageChannel()`, port1/port2 postMessage
- BroadcastChannel: `new BroadcastChannel('test')`, postMessage
- SharedWorker: `new SharedWorker(blobUrl)` if supported, else ✗

### Device Lab
- Geolocation: `navigator.geolocation.getCurrentPosition`
- Orientation: `window.addEventListener('deviceorientation')`
- Motion: `window.addEventListener('devicemotion')`
- Vibration: `navigator.vibrate(pattern)`
- Battery: `navigator.getBattery()` if available
- Network: `navigator.connection` (effectiveType, downlink)
- Screen: `screen.width/height`, `window.devicePixelRatio`
- Clipboard: `navigator.clipboard.readText/writeText`
- Share: `navigator.share` if available
- Fullscreen: `document.documentElement.requestFullscreen`

### Audio Engine
- Context: `new (AudioContext || webkitAudioContext)()`
- Oscillator: `ctx.createOscillator()`, type, frequency, connect to gain
- Gain: `ctx.createGain()`, gain value
- Filter: `ctx.createBiquadFilter()`, type, frequency, Q
- Analyser: `ctx.createAnalyser()`, fftSize, getByteFrequencyData, canvas
- Synth: oscillator per key, frequency from note (A4=440)
- Drum: oscillator + gain envelope for kick/snare/hihat

### PWA Lab
- Manifest: fetch `manifest.webmanifest`, display JSON
- SW: `navigator.serviceWorker.ready`, `registration.active`, `controller`
- Cache: `caches.keys()`, `caches.open`, `cache.keys()`, estimate size
- Offline: `navigator.onLine`, `online/offline` events
- Install: `beforeinstallprompt` event, `prompt()`

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Concurrency | "Running…" | "Select task" | "Worker not supported" | bars + timing |
| Device | "Requesting…" | "—" | "Permission denied" | value |
| Audio | — | "—" | "Web Audio not supported" | playing |
| PWA | "Checking…" | "—" | "SW not supported" | status |

## 6. Animation
- Benchmark bars: width transition 0.6s ease
- Audio keys: active scale 0.95, 100ms
- Respect `prefers-reduced-motion`

## 7. A11y
- Tabs: `role="tablist"`, `aria-selected`
- Bars: `role="progressbar"`
- Keys: `aria-label`, keyboard (A,S,D,F,G,H,J)
- Device cards: semantic, `aria-label`

## 8. File Map (Part 5)
```
www/web-universe/js/modules/concurrency-lab/index.js
www/web-universe/js/modules/device-lab/index.js
www/web-universe/js/modules/audio-engine/index.js
www/web-universe/js/modules/pwa-lab/index.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 5 Concurrency/Device/Audio/PWA*
