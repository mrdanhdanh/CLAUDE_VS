// logger.js — DEBUG/INFO/WARN/ERROR + devMode + subscribers
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
export function createLogger({ level = 'info', devMode = false } = {}) {
  let currentLevel = level;
  let dev = devMode;
  const entries = [];
  const subs = new Set();
  const maxEntries = 500;

  function shouldLog(lvl) {
    return LEVELS[lvl] >= LEVELS[currentLevel];
  }
  function push(lvl, msg, data) {
    const entry = { ts: Date.now(), level: lvl, msg: String(msg), data };
    entries.push(entry);
    if (entries.length > maxEntries) entries.shift();
    // console
    const fn = lvl === 'error' ? console.error : lvl === 'warn' ? console.warn : lvl === 'debug' ? console.debug : console.log;
    if (shouldLog(lvl)) fn(`[${lvl.toUpperCase()}]`, msg, data ?? '');
    for (const s of [...subs]) try { s(entry); } catch {}
  }
  function debug(msg, data) { push('debug', msg, data); }
  function info(msg, data) { push('info', msg, data); }
  function warn(msg, data) { push('warn', msg, data); }
  function error(msg, data) { push('error', msg, data); }

  function setLevel(lvl) { if (lvl in LEVELS) currentLevel = lvl; }
  function getLevel() { return currentLevel; }
  function setDevMode(v) { dev = !!v; }
  function getDevMode() { return dev; }
  function getEntries(filterLevel) {
    if (!filterLevel || !(filterLevel in LEVELS)) return [...entries];
    const min = LEVELS[filterLevel];
    return entries.filter(e => LEVELS[e.level] >= min);
  }
  function clear() { entries.length = 0; for (const s of [...subs]) try { s(null); } catch {} }
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

  return { debug, info, warn, error, setLevel, getLevel, setDevMode, getDevMode, getEntries, clear, subscribe, LEVELS };
}
