#!/usr/bin/env node
/**
 * Local SLM — P2-3 Harness 2.2 (Lesson 17 Foundry Local + Qwen)
 * Hybrid local-first: status, locality routing, OpenAI-compatible chat with fallback.
 * Endpoint: FOUNDRY_LOCAL_ENDPOINT (default http://localhost:12434/v1)
 * Model: FOUNDRY_LOCAL_MODEL (default qwen2.5-7b-instruct)
 * Usage:
 *   node local.mjs status
 *   node local.mjs route --query "my password reset"
 *   node local.mjs chat --prompt "hello"
 * No deps, Node 18+ (fetch built-in).
 */
import { tokenize } from '../../../www/library/rag-loop.mjs';

const ENDPOINT = process.env.FOUNDRY_LOCAL_ENDPOINT || 'http://localhost:12434/v1';
const MODEL = process.env.FOUNDRY_LOCAL_MODEL || 'qwen2.5-7b-instruct';

const SENSITIVE_RE = /password|token|secret|private|personal|credential|ssn|credit/i;
const OFFLINE_RE = /offline|plane|outage|local-?only|on-?device|airplane/i;
const HARD_RE = /plan.*trip|compare.*3|analy[sz]e.*codebase|multi-?hop|research.*report/i;

export function routeLocality(query = '') {
  const q = String(query);
  if (SENSITIVE_RE.test(q)) return { locality: 'local', reason: 'sensitive — privacy' };
  if (OFFLINE_RE.test(q)) return { locality: 'local', reason: 'offline/outage — graceful' };
  if (HARD_RE.test(q)) return { locality: 'cloud', reason: 'hard multi-hop — needs frontier' };
  const tokens = tokenize(q);
  if (tokens.length <= 3) return { locality: 'local', reason: 'simple bounded' };
  return { locality: 'local', reason: 'default privacy-first' };
}

export async function checkStatus(endpoint = ENDPOINT, timeoutMs = 10000) {
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/models`, { signal: ctrl.signal });
    clearTimeout(t);
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { available: false, endpoint, model: MODEL, reason: `HTTP ${res.status}`, latencyMs };
    let models = [];
    try { models = (await res.json()).data?.map(m => m.id) || []; } catch {}
    return { available: true, endpoint, model: MODEL, models, latencyMs };
  } catch (e) {
    return { available: false, endpoint, model: MODEL, reason: e.name === 'AbortError' ? 'timeout' : e.message, latencyMs: Date.now() - t0 };
  }
}

export async function chatLocal(prompt = '', opts = {}) {
  const endpoint = opts.endpoint || ENDPOINT;
  const model = opts.model || MODEL;
  const timeoutMs = opts.timeoutMs || 30000;
  // Never log raw prompt — only lengths
  const promptLen = String(prompt).length;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: String(prompt) }], max_tokens: 500 }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content || '';
    return { backend: 'local', model, promptLen, textLen: text.length, text: text.slice(0, 2000) };
  } catch (e) {
    return { backend: 'cloud-fallback', model, promptLen, reason: e.name === 'AbortError' ? 'timeout' : e.message };
  }
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  (async () => {
    try {
      if (cmd === 'status') {
        const s = await checkStatus();
        if (args.json) console.log(JSON.stringify(s, null, 2));
        else if (s.available) console.log(`✅ Foundry Local: ${s.endpoint} model=${s.model} latency=${s.latencyMs}ms`);
        else console.log(`○ Foundry Local unavailable: ${s.reason} (${s.endpoint}) — graceful, use cloud`);
      } else if (cmd === 'route') {
        const r = routeLocality(args.query || args.q || '');
        if (args.json) console.log(JSON.stringify({ query: args.query, ...r }, null, 2));
        else console.log(`🤖 ${r.locality}: ${r.reason}`);
      } else if (cmd === 'chat') {
        const r = await chatLocal(args.prompt || '');
        if (args.json) console.log(JSON.stringify(r, null, 2));
        else if (r.backend === 'local') console.log(`✅ local (${r.model}): ${r.text.slice(0, 200)}`);
        else console.log(`○ fallback cloud: ${r.reason} (prompt ${r.promptLen} chars, not logged)`);
      } else {
        console.error('Usage: local.mjs <status|route|chat> [options]');
        process.exit(2);
      }
    } catch (e) {
      console.error(`❌ ${e.message}`);
      process.exit(1);
    }
  })();
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { routeLocality, checkStatus, chatLocal };
