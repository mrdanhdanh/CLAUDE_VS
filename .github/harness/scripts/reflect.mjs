#!/usr/bin/env node
/**
 * Reflect — P1-1 Harness 2.1 (Lesson 09 Metacognition)
 * Self-reflection after Verify fail: suggest a DIFFERENT strategy + append experience.
 * Usage:
 *   node reflect.mjs --verify-output "build fail X" --attempt 2
 *   node reflect.mjs --verify-output "..." --attempt 1 --json
 * Exit: 0 always (advisory), 2 on error
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EXP_PATH = path.join(ROOT, '.agent', 'memory', 'experience.jsonl');

const STRATEGIES = [
  { id: 'narrow-scope', label: 'Thu hẹp scope: chỉ sửa 1 file, 1 lỗi tại 1 thời điểm', when: (out, attempt) => /multiple|many|scope|all/i.test(out) || attempt >= 3 },
  { id: 'reorder', label: 'Đổi thứ tự: fix lỗi đầu tiên trong log trước, bỏ qua lỗi sau (có thể là hệ quả)', when: (out) => /error|fail/i.test(out) },
  { id: 'test-first', label: 'Thêm test trước: viết failing test tái hiện lỗi rồi mới sửa (tdd-gate)', when: (out) => /test|spec|assert/i.test(out) },
  { id: 'reread-plan', label: 'Đọc lại plan + knowleged: kiểm tra có chạm KN cũ không, áp dụng Cách phòng tránh', when: () => true },
  { id: 'fresh-eyes', label: 'Fresh eyes: thử reproduce như user mới, không dùng workaround (KN-005)', when: (out, attempt) => attempt >= 2 },
];

export function suggestStrategy(verifyOutput = '', attempt = 1, prevStrategies = []) {
  const out = String(verifyOutput || '');
  // Pick first matching strategy NOT in prevStrategies (ensure different)
  for (const s of STRATEGIES) {
    if (prevStrategies.includes(s.id)) continue;
    try {
      if (s.when(out, attempt)) return s;
    } catch { continue; }
  }
  // Fallback: first not-used, else reread-plan
  const fallback = STRATEGIES.find(s => !prevStrategies.includes(s.id)) || STRATEGIES[3];
  return fallback;
}

export function loadExperience() {
  try {
    if (!fs.existsSync(EXP_PATH)) return [];
    return fs.readFileSync(EXP_PATH, 'utf8').trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

export function appendExperience(record) {
  fs.mkdirSync(path.dirname(EXP_PATH), { recursive: true });
  // redact secrets
  const safe = { ...record };
  if (safe.verifyOutput) safe.verifyOutput = String(safe.verifyOutput).slice(0, 500);
  fs.appendFileSync(EXP_PATH, JSON.stringify(safe) + '\n', 'utf8');
  return safe;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const verifyOutput = args['verify-output'] || args.verifyOutput || args.output || '';
  const attempt = Number(args.attempt || 1);
  if (!verifyOutput) {
    console.error('Usage: reflect.mjs --verify-output "..." --attempt <n> [--json]');
    process.exit(2);
  }
  const exp = loadExperience();
  const prevStrategies = exp.slice(-5).map(e => e.strategy).filter(Boolean);
  const s = suggestStrategy(verifyOutput, attempt, prevStrategies);
  const record = {
    ts: new Date().toISOString(),
    attempt,
    strategy: s.id,
    label: s.label,
    verifyOutput: String(verifyOutput).slice(0, 500),
    prevStrategies,
  };
  appendExperience(record);
  if (args.json) {
    console.log(JSON.stringify({ strategy: s.id, label: s.label, record }, null, 2));
  } else {
    console.log(`🪞 reflection (attempt ${attempt}):`);
    console.log(`   prev: ${prevStrategies.length ? prevStrategies.join(', ') : '(none)'}`);
    console.log(`   next: ${s.id} — ${s.label}`);
    console.log(`   logged to .agent/memory/experience.jsonl`);
  }
  process.exit(0);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { suggestStrategy, loadExperience, appendExperience, STRATEGIES };
