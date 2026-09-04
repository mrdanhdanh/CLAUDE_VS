/**
 * Router + Cache — P1-6 Harness 2.1 (Lesson 16 Deploying Scalable Agents)
 * Model routing (fast 1-shot vs deep iterative) + response cache (TTL 5m, max 50).
 * Pure ESM, 0 deps, Node + browser compatible.
 * Exports: routeQuery, cacheGet, cacheSet, cachedSearch, cacheStats, clearCache, COMPLEX_TOKENS
 */
import { tokenize } from './rag-loop.mjs';

export const COMPLEX_TOKENS = new Set([
  'mcp', 'a2a', 'nlweb', 'rag', 'planning', 'plan', 'multi', 'agent',
  'metacognition', 'memory', 'mem0', 'cognee', 'context', 'poisoning',
  'receipt', 'ed25519', 'jcs', 'observability', 'traces', 'spans',
  'deploy', 'routing', 'caching', 'framework', 'maf', 'foundry',
  'protocol', 'tool', 'trustworthy', 'safety', 'browser', 'playwright',
  'local', 'slm', 'qwen',
]);

export function routeQuery(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return 'fast';
  const hasComplex = tokens.some(t => COMPLEX_TOKENS.has(t));
  if (hasComplex) return 'deep';
  if (tokens.length <= 3) return 'fast';
  return 'deep';
}

// ---------- Cache (in-memory, TTL 5m, max 50, LRU-ish) ----------
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 50;
const _cache = new Map(); // key -> {value, expiresAt}

export function cacheKey(query, opts = {}) {
  const q = String(query || '').toLowerCase().trim();
  const top_k = opts.top_k ?? opts.topK ?? 5;
  const enabled = (opts.enabled_only ?? opts.enabledOnly) !== false;
  const mode = opts.mode || 'auto';
  return `${mode}|${q}|${top_k}|${enabled ? 1 : 0}`;
}

export function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return { hit: false };
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return { hit: false, expired: true };
  }
  // refresh LRU order
  _cache.delete(key);
  _cache.set(key, entry);
  return { hit: true, value: entry.value };
}

export function cacheSet(key, value) {
  if (_cache.size >= CACHE_MAX) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function cacheStats() {
  return { size: _cache.size, max: CACHE_MAX, ttlMs: CACHE_TTL_MS };
}

export function clearCache() {
  _cache.clear();
}

export default { routeQuery, cacheGet, cacheSet, cacheStats, clearCache, cacheKey, COMPLEX_TOKENS };
