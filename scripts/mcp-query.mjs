#!/usr/bin/env node
/**
 * MCP Query — client stdio cho www/library/mcp-server.mjs (đúng lớp API duy nhất — quy tắc library-rag)
 *
 * KHÔNG đọc export.json trực tiếp. Spawn MCP server như process riêng (KN-014: không import module
 * có side-effect khởi động stdio server), gọi tools/call search_library, in citation + snippet.
 *
 * Usage:
 *   node scripts/mcp-query.mjs --q "uncertainty principle position momentum" --top 3
 *   node scripts/mcp-query.mjs --q "query 1" --q "query 2" --q "..." --top 2
 *   node scripts/mcp-query.mjs --status                     # get_status
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const queries = [];
let topK = 3;
let showStatus = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--q' && argv[i + 1]) queries.push(argv[++i]);
  else if (argv[i] === '--top' && argv[i + 1]) topK = Math.max(1, Math.min(20, parseInt(argv[++i], 10) || 3));
  else if (argv[i] === '--status') showStatus = true;
}
if (queries.length === 0 && !showStatus) {
  console.error('Usage: node scripts/mcp-query.mjs --q "<query>" [--q ...] [--top N] [--status]');
  process.exit(1);
}

const ROOT = process.cwd();
const SERVER = path.join(ROOT, 'www', 'library', 'mcp-server.mjs');
const child = spawn(process.execPath, [SERVER, '--file', path.join(ROOT, 'www', 'library', 'export.json')], {
  cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
const pending = new Map(); // id -> resolve
let nextId = 1;

function send(obj) { child.stdin.write(JSON.stringify(obj) + '\n'); }
function rpc(method, params, isNotification = false) {
  return new Promise((resolve, reject) => {
    const id = isNotification ? undefined : nextId++;
    const msg = { jsonrpc: '2.0', method, ...(params !== undefined ? { params } : {}), ...(id ? { id } : {}) };
    if (isNotification) { send(msg); resolve(); return; } // notification: không chờ response
    pending.set(id, { resolve, reject, method });
    send(msg);
  });
}

child.stdout.setEncoding('utf8');
child.stdout.on('data', chunk => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message || JSON.stringify(msg.error)}`));
      else p.resolve(msg.result);
    }
  }
});

const TIMEOUT = setTimeout(() => {
  console.error('❌ Timeout 60s — MCP server không phản hồi?');
  child.kill();
  process.exit(1);
}, 60000);

function parseToolResult(result) {
  const text = result && result.content && result.content[0] && result.content[0].text;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function trim(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }

try {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'scripts/mcp-query.mjs', version: '1.0.0' } });
  await rpc('notifications/initialized', undefined, true);

  if (showStatus) {
    const st = parseToolResult(await rpc('tools/call', { name: 'get_status', arguments: {} }));
    console.log('📊 get_status:', JSON.stringify(st, null, 2));
  }

  for (const q of queries) {
    console.log(`\n══════ 🔍 "${q}" (top ${topK}) ══════`);
    const r = parseToolResult(await rpc('tools/call', { name: 'search_library', arguments: { query: q, top_k: topK, enabled_only: true } }));
    const hits = (r && r.hits) || [];
    if (hits.length === 0) { console.log('  (0 hits)'); continue; }
    for (const h of hits) {
      console.log(`  • [${(h.score ?? 0).toFixed?.(2) ?? h.score}] ${h.bookName} · chunk #${h.index} · tr.${h.page}`);
      console.log(`    "${trim(h.snippet || h.text, 260)}"`);
    }
  }

  clearTimeout(TIMEOUT);
  child.kill();
  process.exit(0);
} catch (err) {
  clearTimeout(TIMEOUT);
  console.error('❌', err.message);
  child.kill();
  process.exit(1);
}
