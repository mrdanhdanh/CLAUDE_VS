// resource-manager.js — FPS (rAF), DOM nodes, workers, timers, canvas, estimate CPU
export function createResourceManager({ state, eventBus, logger } = {}) {
  let fps = 60;
  let rafId = null;
  let frames = 0;
  let lastFpsTs = performance.now();
  let fpsSamples = [];
  let domNodes = 0;
  let canvasCount = 0;
  let timerCount = 0;
  let workerCount = 0;
  let intervalId = null;
  let running = false;

  // Wrap timers to count (estimate)
  const origSetTimeout = window.setTimeout.bind(window);
  const origSetInterval = window.setInterval.bind(window);
  const origClearTimeout = window.clearTimeout.bind(window);
  const origClearInterval = window.clearInterval.bind(window);
  const activeTimers = new Set();
  let wrapped = false;

  function wrapTimers() {
    if (wrapped) return;
    wrapped = true;
    window.setTimeout = function(fn, ms, ...args) {
      const id = origSetTimeout(() => { activeTimers.delete(id); fn(...args); }, ms);
      activeTimers.add(id);
      return id;
    };
    window.setInterval = function(fn, ms, ...args) {
      const id = origSetInterval(fn, ms, ...args);
      activeTimers.add(id);
      return id;
    };
    window.clearTimeout = function(id) { activeTimers.delete(id); return origClearTimeout(id); };
    window.clearInterval = function(id) { activeTimers.delete(id); return origClearInterval(id); };
  }
  function unwrapTimers() {
    if (!wrapped) return;
    window.setTimeout = origSetTimeout;
    window.setInterval = origSetInterval;
    window.clearTimeout = origClearTimeout;
    window.clearInterval = origClearInterval;
    wrapped = false;
  }

  function tickFps(now) {
    frames++;
    if (now - lastFpsTs >= 1000) {
      fps = Math.round((frames * 1000) / (now - lastFpsTs));
      fpsSamples.push(fps);
      if (fpsSamples.length > 30) fpsSamples.shift();
      frames = 0;
      lastFpsTs = now;
    }
    if (running) rafId = requestAnimationFrame(tickFps);
  }

  function sample() {
    try { domNodes = document.querySelectorAll('*').length; } catch { domNodes = 0; }
    try { canvasCount = document.querySelectorAll('canvas').length; } catch { canvasCount = 0; }
    timerCount = activeTimers.size;
    // workerCount is set externally via setWorkerCount
    const avgFps = fpsSamples.length ? Math.round(fpsSamples.reduce((a,b)=>a+b,0)/fpsSamples.length) : fps;
    const payload = { fps, avgFps, domNodes, canvas: canvasCount, timers: timerCount, workers: workerCount, estimateCpu: estimateCpu(fps, domNodes, timerCount) };
    state?.setRuntime({ fps, domNodes, workers: workerCount, timers: timerCount, canvas: canvasCount });
    eventBus?.emit('resource:update', payload);
    return payload;
  }

  function estimateCpu(fpsVal, dom, timers) {
    // Heuristic estimate — NOT OS measurement (spec §25)
    let score = 0;
    if (fpsVal < 55) score += 30;
    else if (fpsVal < 50) score += 50;
    if (dom > 3000) score += 20;
    if (dom > 6000) score += 20;
    if (timers > 20) score += 15;
    if (timers > 50) score += 15;
    return Math.min(100, Math.max(5, score + 10));
  }

  function start() {
    if (running) return;
    running = true;
    wrapTimers();
    lastFpsTs = performance.now();
    frames = 0;
    rafId = requestAnimationFrame(tickFps);
    intervalId = origSetInterval(sample, 1000);
    logger?.info('resource: started');
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (intervalId) origClearInterval(intervalId);
    rafId = null; intervalId = null;
    // keep timer wrapping for counts? unwrap on stop
    // keep wrapped to continue counting — don't unwrap
  }
  function setWorkerCount(n) { workerCount = n; }
  function getSnapshot() {
    return { fps, avgFps: fpsSamples.length ? Math.round(fpsSamples.reduce((a,b)=>a+b,0)/fpsSamples.length) : fps, domNodes, canvas: canvasCount, timers: timerCount, workers: workerCount };
  }
  function destroy() {
    stop();
    unwrapTimers();
    fpsSamples = [];
  }

  return { start, stop, sample, getSnapshot, setWorkerCount, estimateCpu, destroy };
}
