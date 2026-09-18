#!/usr/bin/env node
/**
 * Instruction Budget — kế toán instruction files theo `applyTo` (0-dep, Node 18+)
 *
 * Vấn đề (HackerNoon 16/09/2026 — Xi Yang, "How to Write a CLAUDE.md..."):
 * instruction `applyTo: "**"` load MỌI session = thuế token thường trú. File kiểu
 * "Never section" chỉ có động lực THÊM, không có động lực XÓA → phình vô hạn.
 * Giải: ngân sách always-on đo được + gate (KN-047 spec≠wish, KN-056 có lưới).
 *
 * Usage:
 *   node scripts/instruction-budget.mjs                    # report
 *   node scripts/instruction-budget.mjs --json             # machine output
 *   node scripts/instruction-budget.mjs --dir <path>       # scan dir khác (default .github/instructions)
 *   node scripts/instruction-budget.mjs --budget 1200      # gate: always-on > 1200 dòng → exit 1
 *   node scripts/instruction-budget.mjs --top 8            # số file lớn nhất ở phần "top"
 *
 * Exit: 0 = trong ngân sách · 1 = vượt --budget · 2 = fail-closed (0 file / dir lỗi / arg số không hợp lệ)
 */
import fs from 'node:fs';
import path from 'node:path';

// Ratchet 2026-09-16: pool always-on đo được = 1395 dòng → freeze ở 1400.
// Muốn thêm file/dòng always-on → path-scope (applyTo hẹp hơn) hoặc gộp trước.
const SOFT_BUDGET = 1400;

function parseArgs(args) {
  // Fail-closed (bug 2026-09-18 + OCR delegate review): chặn arg lạ / dạng "=" —
  // gate không bao giờ được "tưởng bật mà tắt" (im lặng bỏ qua --budget=1400, --budjet...).
  const KNOWN = new Set(['--budget', '--top', '--dir', '--json']);
  const unknown = args.find((a) => a.startsWith('--') && !KNOWN.has(a));
  if (unknown) {
    console.error(`⛔ fail-closed: arg không nhận diện — "${unknown}" (dùng: --budget <n> · --top <n> · --dir <path> · --json)`);
    process.exit(2);
  }
  const opt = (name, def) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] != null && !args[i + 1].startsWith('--') ? args[i + 1] : def;
  };
  // parseInt('abc') = NaN → so sánh luôn false → gate PASS oan. Flag CÓ MẶT thì PHẢI có giá trị hữu hạn.
  const num = (raw, name) => {
    const n = Number(raw);
    if (raw == null || String(raw).trim() === '' || !Number.isFinite(n)) {
      console.error(`⛔ fail-closed: ${name} không hợp lệ — "${raw ?? ''}" (cần số hữu hạn)`);
      process.exit(2);
    }
    return Math.trunc(n);
  };
  return {
    dir: opt('--dir', path.join('.github', 'instructions')),
    top: args.includes('--top') ? num(opt('--top', null), '--top') : 8,
    budget: args.includes('--budget') ? num(opt('--budget', null), '--budget') : null,
    jsonOut: args.includes('--json'),
  };
}

function readRows(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.instructions.md')).map((f) => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = (text.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    // thiếu applyTo → coi như always-on (fail-closed: không giả định là scoped)
    const applyTo = (fm.match(/^applyTo:\s*"?(.*?)"?\s*$/m) || [])[1] || '**';
    const lines = text.split(/\r?\n/).length;
    const bytes = Buffer.byteLength(text, 'utf8');
    return {
      file: f,
      name: f.replace('.instructions.md', ''),
      applyTo,
      alwaysOn: applyTo.trim() === '**',
      lines,
      kb: +(bytes / 1024).toFixed(1),
      approxTokens: Math.ceil(bytes / 4), // ước lượng thô chars/4 — đủ để so sánh tương đối
    };
  }).sort((a, b) => b.lines - a.lines);
}

const sum = (arr, k) => arr.reduce((s, r) => s + r[k], 0);

function buildReport(dir, rows, top, budget) {
  const alwaysOn = rows.filter((r) => r.alwaysOn);
  const scoped = rows.filter((r) => !r.alwaysOn);
  const report = {
    dir,
    files: rows.length,
    alwaysOn: {
      count: alwaysOn.length,
      lines: sum(alwaysOn, 'lines'),
      approxTokens: sum(alwaysOn, 'approxTokens'),
      top: alwaysOn.slice(0, top).map((r) => ({ name: r.name, lines: r.lines })),
    },
    scoped: { count: scoped.length, lines: sum(scoped, 'lines') },
    total: { lines: sum(rows, 'lines'), approxTokens: sum(rows, 'approxTokens') },
    softBudget: SOFT_BUDGET,
    budget,
    rows,
  };
  const over = budget != null ? report.alwaysOn.lines > budget : report.alwaysOn.lines > SOFT_BUDGET;
  report.status = budget != null ? (over ? 'fail' : 'pass') : over ? 'warn' : 'ok';
  return report;
}

function printReport(report) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`📏 Instruction Budget — ${report.dir}`);
  console.log(`${pad('file', 40)} ${pad('lines', 6)} ${pad('~tokens', 8)} applyTo`);
  console.log('-'.repeat(92));
  for (const r of report.rows) console.log(`${pad(r.name, 40)} ${pad(r.lines, 6)} ${pad(r.approxTokens, 8)} ${r.applyTo}`);
  console.log('-'.repeat(92));
  console.log(`Tổng: ${report.total.lines} dòng (~${report.total.approxTokens} tokens) · ${report.files} files`);
  console.log(`Always-on ("**"): ${report.alwaysOn.count} files · ${report.alwaysOn.lines} dòng (~${report.alwaysOn.approxTokens} tokens)`);
  console.log(`On-demand (scoped): ${report.scoped.count} files · ${report.scoped.lines} dòng`);
  console.log(`Top always-on: ${report.alwaysOn.top.map((r) => `${r.name} (${r.lines})`).join(' · ')}`);
  const statusMsg = {
    ok: `✅ Trong ngân sách (soft ${SOFT_BUDGET} dòng always-on).`,
    warn: `⚠️ Vượt soft budget ${SOFT_BUDGET} dòng — cân nhắc path-scope file lớn (applyTo hẹp hơn).`,
    fail: `⛔ Vượt budget ${report.budget} dòng (always-on ${report.alwaysOn.lines}) — path-scope hoặc gộp trước khi thêm file mới.`,
    pass: `✅ Trong budget ${report.budget} dòng (always-on ${report.alwaysOn.lines}, headroom ${report.budget - report.alwaysOn.lines}).`,
  };
  console.log(statusMsg[report.status]);
}

function main() {
  const { dir, top, budget, jsonOut } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(dir)) {
    console.error(`⛔ fail-closed: dir không tồn tại — ${dir}`);
    process.exit(2);
  }
  const rows = readRows(dir);
  if (!rows.length) {
    console.error(`⛔ fail-closed: 0 instruction file trong ${dir}`);
    process.exit(2);
  }
  const report = buildReport(dir, rows, top, budget);
  if (jsonOut) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  if (report.status === 'fail') process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(`⛔ ${e.message}`);
  process.exit(2);
}
