// anchors3.mjs — verify anchors cho backlog batch (#14 + smoke tests)
import fs from 'node:fs';
const kn = fs.readFileSync('docs/knowleged.md', 'utf8');
const al = fs.readFileSync('.github/harness/scripts/auto-learn.mjs', 'utf8');
const sp = fs.readFileSync('tests/e2e/auto-learn-guard.spec.ts', 'utf8');
const checks = [
  ['kn:KN-025 tags', kn, '- **Tags:** `process` `agent` `self-evolving` `procedural-graph` `a-jit`'],
  ['kn:KN-026 tags', kn, '- **Tags:** `process` `self-evolving` `memory` `evidence` `funnel`'],
  ['kn:KN-027 tags', kn, '- **Tags:** `process` `rl` `consistency` `self-distillation` `verification` `scaffold`'],
  ['kn:KN-037 bullet', kn, '  - Claim "nhanh hơn/tốt hơn" phải kèm số đo — không vibes (KN-019).'],
  ['kn:KN-038 tags', kn, '- **Tags:** `ui` `data` `verify` `docs` `physics` `content-drift`'],
  ['kn:KN-062 guard', kn, 'dup-gate `evaluate` — KN trùng → FAIL + chỉ đích danh + hint GỘP; chủ đề mới → PASS không chặn oan'],
  ['kn:KN-062 dẫn chứng', kn, '- **Dẫn chứng (ngoài model — KN-023):** LoCoMo 86.3% LLM-judge'],
  ['kn:KN-067 recall', kn, 'recall@3 100% (34/34, 65 KN) + demo với snapshot versions'],
  ['kn:KN-007 tags', kn, '- **Tags:** `process` `knowledge` `automation` `dx`'],
  ['kn:KN-015 tags', kn, '- **Tags:** `build` `deploy` `ci` `workflow` `pages`'],
  ['kn:UpdatedAt', kn, '*UpdatedAt: 2026-09-18T14:18:00Z'],
  ['al:threshold', al, 'const DUPLICATE_THRESHOLD = 15; // tuned: >15 likely duplicate'],
  ['al:dup branch', al, "if (isDuplicate) { decision = 'FAIL'; reasons.push(`Trùng KN hiện có: ${topScored.id} score ${topScored.score} ≥ ${DUPLICATE_THRESHOLD}"],
  ['al:print dup', al, "duplicate=${checks.isDuplicate ? scored[0].id+'('+scored[0].score+')' : 'no'}"],
  ['sp:header L15', sp, ' *  4. `evaluate` CONSOLIDATION gate (KN-062 — Memora): KN trùng ≥ threshold → FAIL + chỉ đích danh + hint GỘP;'],
  ['sp:dup test name', sp, "test('evaluate: KN trùng → FAIL + chỉ đích danh + hint GỘP (consolidation gate — KN-062)', () => {"],
  ['sp:dup asserts', sp, "expect(data.decision).toBe('FAIL');\n      expect(data.checks.isDuplicate).toBe(true);"],
];
for (const [name, src, s] of checks) console.log((src.includes(s) ? 'OK   ' : 'MISS ') + name);
// uniqueness check cho anchors sẽ replace
for (const [name, src, s] of checks.slice(0, 9)) {
  const n = src.split(s).length - 1;
  if (n > 1) console.log(`DUP! ${n}× ${name}`);
}
