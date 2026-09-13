#!/usr/bin/env node
/**
 * Auto-Learn — hệ thống tự học hỏi tự động (Engram-lite + Reef-lite)
 * - suggest: gợi ý KN liên quan khi code (BM25-lite + Wilson score)
 * - log: auto tạo draft bug.md khi có lỗi
 * - propose: sinh KN draft từ bug.md để dán vào knowleged.md
 * - attest: peer verification (Engram-lite) — Wilson-ranked
 * - search/get: MCP-like aliases for suggest/propose
 * - status: tổng quan học hỏi
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize, computeIDF, parseKNs, scoreKN } from './kn-parse.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(GITHUB_DIR, '..');
const KNOWLEGED = path.join(ROOT, 'docs', 'knowleged.md');
const BUGS_DIR = path.join(ROOT, '.agent', 'bugs');
const PLANS_DIR = path.join(ROOT, '.agent', 'plans');
const TEMPLATE = path.join(BUGS_DIR, '_template', 'bug.md');
const VERSIONS_DIR = path.join(ROOT, '.agent', 'versions');
const RECORDS_DIR = path.join(ROOT, '.agent', 'records');
const REPORTS_FILE = path.join(ROOT, '.agent', 'reports.jsonl');
const ATTEST_FILE = path.join(ROOT, '.agent', 'attestations.jsonl');

// Vòng chống tái lập (KN-056): radar khi log + guard gate khi propose + coverage audit
const RECURRENCE_KN_MIN = 25; // calibrate 2026-09-13: liên quan thật ≥ 31, nhiễu tối đa 15
const RECURRENCE_BUG_MIN = 18;
const GUARD_SCAN_DIRS = ['tests'];
const GUARD_FILE_RE = /\.(spec|test)\.(js|ts|mjs|cs)$/i;

// ---------- helpers ----------
// tokenize/computeIDF/parseKNs/scoreKN — shared module kn-parse.mjs (trước là duplicate)

function normalizeSlug(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'bug';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Vòng chống tái lập (KN-056): radar tái lập ----------
// Bug tái lập dù có KN vì không ai phát hiện "đây là tái lập" lúc log.
// Radar đối chiếu text bug mới với toàn bộ KN + bug cũ (BM25-lite, ngưỡng calibrate).

function rankCorpus(query, items, minScore, topK) {
  const qTokens = tokenize(query);
  if (!qTokens.length || !items.length) return [];
  const idf = computeIDF(qTokens, items);
  return items
    .map((it) => ({ key: it.id, title: it.title, severity: it.severity || 'minor', score: Math.round(scoreKN(qTokens, query, it, idf) * 10) / 10 }))
    .filter((it) => it.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function bugToCorpusItem(slug, bugText) {
  const { title, tags } = extractBugMeta(bugText, slug);
  const detail = bugText.slice(0, 2500);
  return {
    id: slug, title, tags: tags.split(/\s+/).filter(Boolean), lesson: title, detail,
    tokens: tokenize(`${title} ${tags} ${detail}`), titleTokens: tokenize(title), tagTokens: tokenize(tags),
  };
}

async function scanRecurrence({ title, error, file, excludeSlug, baseDir = BUGS_DIR }) {
  const query = [title, error, file].filter(Boolean).join(' ');
  const { kns } = await parseKNs(KNOWLEGED);
  const bugItems = [];
  for (const slug of await listBugSlugs(baseDir)) {
    if (slug === excludeSlug) continue;
    try { bugItems.push(bugToCorpusItem(slug, await fs.readFile(path.join(baseDir, slug, 'bug.md'), 'utf8'))); } catch {}
  }
  return { query, kns: rankCorpus(query, kns, RECURRENCE_KN_MIN, 3), bugs: rankCorpus(query, bugItems, RECURRENCE_BUG_MIN, 3) };
}

function buildRadarBlock(radar) {
  const lines = [
    ...radar.kns.map((k) => `> - 🔁 NGHI TÁI LẬP **[${k.key}]** (score ${k.score}): ${k.title}`),
    ...radar.bugs.map((b) => `> - 🔁 NGHI TÁI LẬP **bug cũ \`${b.key}\`** (score ${b.score}): ${b.title}`),
  ];
  if (!lines.length) return '';
  const lead = radar.kns.length ? radar.kns[0].key : `bug cũ ${radar.bugs[0].key}`;
  return [
    `> 🔁 **RADAR TÁI LẬP** — đối chiếu KN + bug cũ thấy nghi vấn:`,
    ...lines,
    `> → Đọc **Cách phòng tránh** trong \`docs/knowleged.md\` TRƯỚC khi fix. Nếu là tái lập thật: ghi rõ "tái lập của ${lead}" + **vì sao lưới cũ không bắt được** → nâng lưới (Guard) rồi mới fix.`,
    '',
  ].join('\n');
}

function printRadar(radar) {
  const n = radar.kns.length + radar.bugs.length;
  if (!n) {
    console.log(`✅ Radar tái lập: không thấy KN/bug tương tự (KN ≥ ${RECURRENCE_KN_MIN}, bug ≥ ${RECURRENCE_BUG_MIN}).`);
    return;
  }
  console.log(`🔁 RADAR TÁI LẬP — ${n} nghi vấn:`);
  for (const k of radar.kns) console.log(`   - [${k.key}] score ${k.score} — ${k.title}`);
  for (const b of radar.bugs) console.log(`   - [bug cũ] ${b.key} score ${b.score} — ${b.title}`);
  console.log(`   → Đọc Cách phòng tránh (docs/knowleged.md) TRƯỚC khi fix; là tái lập thật → nâng lưới (Guard) rồi mới fix.`);
}

// ---------- Engram-lite: Wilson score + attestations ----------
function wilsonScore(up, total, z = 1.96) {
  if (total === 0) return 0;
  const p = up / total;
  const n = total;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return (centre - margin) / denom;
}

function parseAttestLine(line, map) {
  try {
    const a = JSON.parse(line);
    const id = a.kn || a.id || a.bug || '';
    if (!id) return;
    // normalize to KN-XXX
    const knId = id.startsWith('KN-') ? id : null;
    if (!knId) return;
    if (!map.has(knId)) map.set(knId, { up: 0, total: 0 });
    const e = map.get(knId);
    e.total++;
    if (a.result === 'pass' || a.score >= 0.7) e.up++;
  } catch {}
}

async function loadAttestations() {
  const map = new Map(); // knId -> {up, total}
  try {
    if (!existsSync(ATTEST_FILE)) return map;
    const text = await fs.readFile(ATTEST_FILE, 'utf8');
    for (const line of text.trim().split('\n').filter(Boolean)) parseAttestLine(line, map);
  } catch {}
  return map;
}

function resolveAttestInput(opts) {
  const kn = opts.kn || opts.id || opts.bug || '';
  const result = opts.result || opts.r || '';
  if (!kn) {
    console.error('❌ Thiếu --kn <KN-XXX> hoặc --bug <slug>. Ví dụ: attest --kn KN-003 --result pass');
    process.exit(1);
  }
  return { kn, result };
}

function resolveAttestScore(scoreRaw, result) {
  const score = scoreRaw !== undefined ? parseFloat(scoreRaw) : (result === 'pass' ? 1 : result === 'fail' ? 0 : NaN);
  if (isNaN(score)) {
    console.error('❌ Thiếu --result pass|fail hoặc --score 0..1');
    process.exit(1);
  }
  return score;
}

function printAttestHuman(knId, entry, wilson, e) {
  console.log(`✅ Attested ${knId}: ${entry.result} (score=${entry.score}) — wilson=${wilson.toFixed(3)} (${e.up}/${e.total})`);
  console.log(`   → suggest sẽ rank cao hơn cho KN có wilson cao`);
}

async function attest(opts, json = false) {
  const { kn, result } = resolveAttestInput(opts);
  const score = resolveAttestScore(opts.score, result);
  const knId = kn.startsWith('KN-') ? kn : kn;
  const entry = {
    ts: new Date().toISOString(),
    kn: knId,
    result: score >= 0.7 ? 'pass' : 'fail',
    score,
    actor: opts.actor || 'YUNIE',
    note: (opts.note || opts.feedback || '').slice(0, 500),
  };
  await fs.mkdir(path.dirname(ATTEST_FILE), { recursive: true });
  await fs.appendFile(ATTEST_FILE, JSON.stringify(entry) + '\n', 'utf8');
  const map = await loadAttestations();
  const e = map.get(knId) || { up: 0, total: 0 };
  const wilson = wilsonScore(e.up, e.total);
  if (json) console.log(JSON.stringify({ ...entry, wilson, attestations: e }, null, 2));
  else printAttestHuman(knId, entry, wilson, e);
  return entry;
}

function scoreKnWithWilson(kns, qTokens, query, idf, attestMap, topK) {
  return kns.map(kn => {
    const base = scoreKN(qTokens, query, kn, idf);
    const att = attestMap.get(kn.id);
    const wilson = att ? wilsonScore(att.up, att.total) : 0;
    // Wilson boost: up to +2 points for highly attested KN
    const boosted = base + wilson * 2;
    return { ...kn, score: Math.round(boosted * 10) / 10, baseScore: base, wilson, attestations: att || { up: 0, total: 0 } };
  })
    .filter(k=>k.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0, topK);
}

function printSuggestHuman(query, kns, scored) {
  console.log(`🔍 suggest "${query}" — tìm thấy ${scored.length}/${kns.length} KN liên quan:`);
  for (const k of scored) {
    const wilsonStr = k.attestations.total ? ` wilson=${k.wilson.toFixed(3)}(${k.attestations.up}/${k.attestations.total})` : '';
    console.log(`  [${k.id}] score ${k.score} (base ${k.baseScore}${wilsonStr}) — ${k.title} (${k.severity}, ${k.tags.join(' ') || 'no-tags'})`);
    if (k.lesson) console.log(`       → ${k.lesson.slice(0,100)}`);
    console.log(`       snippet: ${k.block.slice(0,120).replace(/\n/g,' ').trim()}...`);
  }
  console.log(`\n📚 Xem chi tiết: docs/knowleged.md → ${scored.map(s=>s.id).join(', ')}`);
}

async function suggest(query, topK=3, json=false) {
  const { kns, error } = await parseKNs(KNOWLEGED);
  if (error) {
    console.error(`⚠️  Không đọc được knowleged.md: ${error}`);
    process.exit(1);
  }
  if (kns.length === 0) {
    const msg = 'Chưa có bài học nào trong knowleged.md — hãy tạo KN đầu tiên sau khi fix bug.';
    if (json) console.log(JSON.stringify({ query, results: [], message: msg }, null, 2));
    else console.log(`🔍 suggest "${query}" → ${msg}`);
    return;
  }
  const qTokens = tokenize(query);
  if (qTokens.length === 0) qTokens.push(...query.toLowerCase().split(/\s+/).filter(Boolean));
  const idf = computeIDF(qTokens, kns);
  const attestMap = await loadAttestations();
  const scored = scoreKnWithWilson(kns, qTokens, query, idf, attestMap, topK);
  if (json) {
    console.log(JSON.stringify({ query, queryTokens: qTokens, totalKN: kns.length, results: scored.map(k=>({ id:k.id, title:k.title, tags:k.tags, severity:k.severity, date:k.date, score:k.score, baseScore:k.baseScore, wilson: Math.round(k.wilson*1000)/1000, attestations:k.attestations, lesson:k.lesson.slice(0,120), snippet:k.block.slice(0,200).replace(/\n/g,' ') })) }, null, 2));
    return;
  }
  if (scored.length === 0) {
    console.log(`🔍 suggest "${query}" → Không tìm thấy KN liên quan (đã scan ${kns.length} KN). Thử từ khóa khác: ${qTokens.join(', ')}`);
    console.log(`💡 Gợi ý: kiểm tra lại tags trong knowleged.md hoặc thêm KN mới.`);
    return;
  }
  printSuggestHuman(query, kns, scored);
}

function resolveBugDir(title, slug, baseDir = BUGS_DIR) {
  const date = todayISO();
  let dirName = `${date}-${slug}`;
  let dir = path.join(baseDir, dirName);
  // handle duplicate
  let suffix = 2;
  while (existsSync(dir)) {
    dirName = `${date}-${slug}-${suffix}`;
    dir = path.join(baseDir, dirName);
    suffix++;
    if (suffix>20) break;
  }
  return { date, dirName, dir };
}

async function fillBugTemplate(title, dirName, date, error, file, radarBlock = '') {
  let template = '';
  try { template = await fs.readFile(TEMPLATE, 'utf8'); } catch {
    template = `# Bug: ${title}\n\n## Meta\n- **Slug:** ${dirName}\n- **Ngày:** ${date}\n- **Severity:** minor\n- **Tags:** \n\n## 1. Reproduce\n\n## 2. Root Cause\n\n## 3. Fix\n\n## 4. Verification\n\n## 5. Lesson\n\n## 6. Prevention\n`;
  }
  // fill template
  const now = new Date().toISOString();
  let content = template
    .replace('<Tiêu đề ngắn gọn>', title)
    .replace('YYYY-MM-DD-<slug>', dirName)
    .replace('YYYY-MM-DD', date);
  // inject error info at top if not already
  const header = `> 🤖 Auto-log bởi auto-learn.mjs — ${now}\n> **Error:** \`${error.replace(/`/g,"'")}\`${file ? `\n> **File:** \`${file}\`` : ''}\n> **Title:** ${title}\n\n`;
  if (!content.includes('Auto-log')) content = header + radarBlock + content;
  // ensure file:line hint
  if (file && !content.includes(file)) {
    content = content.replace('## 1. Reproduce', `## 1. Reproduce\n\n> File gợi ý: \`${file}\` — kiểm tra log/error trên.\n`);
  }
  return content;
}

async function logBug(opts) {
  const error = opts.error || opts.msg || 'unknown error';
  const file = opts.file || '';
  const title = opts.title || error.slice(0, 60);
  const slug = opts.slug || normalizeSlug(title);
  const baseDir = opts.dir ? path.resolve(ROOT, opts.dir) : BUGS_DIR;
  const { date, dirName, dir } = resolveBugDir(title, slug, baseDir);
  const radar = opts['no-scan'] ? { kns: [], bugs: [] } : await scanRecurrence({ title, error, file, excludeSlug: dirName, baseDir });
  const content = await fillBugTemplate(title, dirName, date, error, file, buildRadarBlock(radar));
  printRadar(radar);
  const outPath = path.join(dir, 'bug.md');
  if (opts['dry-run']) {
    console.log(`[dry-run] Không ghi file — sẽ tạo ${path.relative(ROOT, outPath)}:\n──────────\n${content}──────────`);
    return dirName;
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(outPath, content, 'utf8');
  console.log(`✅ Đã tạo draft bug: ${path.relative(ROOT, outPath)}`);
  console.log(`   Slug: ${dirName}`);
  console.log(`   Error: ${error.slice(0,80)}`);
  if (file) console.log(`   File: ${file}`);
  console.log(`\n📝 Tiếp theo:`);
  console.log(`   1. Mở ${path.relative(ROOT, outPath)} điền Reproduce + Root Cause`);
  console.log(`   2. Sau khi fix: node .github/harness/scripts/auto-learn.mjs propose --bug ${dirName}`);
  return dirName;
}

function findNextKnId(kns) {
  let maxId = 0;
  for (const k of kns) {
    const n = parseInt(k.id.replace('KN-',''),10);
    if (n>maxId) maxId=n;
  }
  return `KN-${String(maxId+1).padStart(3,'0')}`;
}

// match pattern đầu tiên bắt được → group 1 (trim); không có → fallback
function firstMatch(text, patterns, fallback = '') {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return fallback;
}

// Guard (KN-056): lưới chống tái lập — test/invariant khoá bug; major/critical bắt buộc có.
function normalizeGuard(raw) {
  const v = (raw || '').replace(/`/g, '').trim();
  if (!v) return { present: false, raw: '' };
  const low = v.toLowerCase();
  if (/^(—|–|-|n\/a|none|chưa|todo|<)/.test(low) || low.includes('chưa điền') || low.includes('chưa có')) return { present: false, raw: v };
  return { present: true, raw: v };
}

// Trích metadata từ bug.md — dùng chung propose ↔ evaluate ↔ commit (defaults khác nhau giữ y nguyên)
function extractBugMeta(bugText, bugSlug, defaults = {}) {
  const title = (firstMatch(bugText, [/^#\s*Bug:\s*(.+)/m, /Title:\s*(.+)/]) || bugSlug).slice(0, 80);
  const severity = (firstMatch(bugText, [/Severity:[^\w]*(\w+)/i]) || 'major').toLowerCase();
  const tags = firstMatch(bugText, [/Tags:\s*([^\n]+)/]).replace(/`/g, '') || defaults.tags || 'ui';
  const root = (firstMatch(bugText, [/Why 5.*?:\s*(.+)/, /Root.*?:\s*(.+)/i]) || defaults.root || 'Chưa điền — hãy bổ sung 5 Whys trong bug.md').slice(0, 200);
  const fix = (firstMatch(bugText, [/Approach:\s*(.+)/, /Cách sửa:\s*(.+)/]) || defaults.fix || 'Chưa điền — mô tả cách sửa ở gốc').slice(0, 200);
  const guard = normalizeGuard(firstMatch(bugText, [/\*\*Guard:\*\*\s*([^\n]+)/, /^\s*Guard:\s*([^\n]+)/m]));
  return { title, severity, tags, root, fix, guard };
}

function buildKnDraft({ nextId, title, severity, root, fix, tags, today, bugSlug, author, guardText = '—' }) {
  return `### ${nextId} — ${title}

- **Ngày:** ${today}
- **Bug report:** \`.agent/bugs/${bugSlug}/bug.md\`
- **Severity:** ${severity}
- **Guard:** ${guardText}
- **Triệu chứng:** ${title} — xem bug.md Reproduce
- **Nguyên nhân gốc:** ${root}
- **Cách sửa:** ${fix}
- **Cách phòng tránh:**
  - Thêm checklist liên quan vào docs/knowleged.md Checklist phòng tránh chung
  - Chạy \`node .github/harness/scripts/auto-learn.mjs suggest "<từ khóa>"\` trước khi code tương tự
- **Tags:** ${tags}
- **Người ghi:** ${author}
`;
}

function buildKnTableRow({ nextId, today, title, root, tags }) {
  return `| ${nextId} | ${today} | ${title.slice(0,30)} | ${root.slice(0,30)} | ${title.slice(0,40)} | \`${tags.split(/\s+/).slice(0,3).join(' ')}\` |`;
}

// Guard gate (KN-056): major/critical thiếu Guard → cảnh báo; --strict → exit 1 (fail-closed)
function computeGuardGate(nextId, severity, guard) {
  const needsGuard = severity === 'major' || severity === 'critical';
  if (!needsGuard) return { needsGuard, gateWarning: null, guardText: '—' };
  if (guard.present) return { needsGuard, gateWarning: null, guardText: guard.raw };
  return {
    needsGuard,
    gateWarning: `${nextId} (${severity}) THIẾU Guard — KN không có lưới sẽ tái lập. Thêm '- **Guard:** <test|invariant path>' vào bug.md rồi propose lại.`,
    guardText: '⚠️ CHƯA CÓ — viết test/invariant trước khi close (GUARD GATE)',
  };
}

function enforceStrictGuard(opts, gateWarning) {
  if (opts.strict && gateWarning) process.exit(1);
}

function printGuardGate(gateWarning, needsGuard, guard) {
  if (gateWarning) console.log(`\n⛔ GUARD GATE FAIL: ${gateWarning}\n   → node .github/harness/scripts/auto-learn.mjs guards   # xem coverage toàn bộ`);
  else if (needsGuard) console.log(`\n✅ Guard: ${guard.raw}`);
}

async function suggestSimilarSlugs(baseDir, bugSlug) {
  try {
    const dirs = await fs.readdir(baseDir, { withFileTypes: true });
    const cands = dirs.filter((d) => d.isDirectory() && d.name.includes(bugSlug.slice(0, 10))).map((d) => d.name).slice(0, 5);
    if (cands.length) console.log(`Gợi ý slug gần đúng: ${cands.join(', ')}`);
  } catch {}
}

async function propose(bugSlug, json=false, opts = {}) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: --bug 2026-08-30-mat-dau-tieng-viet');
    process.exit(1);
  }
  const baseDir = opts.dir ? path.resolve(ROOT, opts.dir) : BUGS_DIR;
  const bugPath = path.join(baseDir, bugSlug, 'bug.md');
  if (!existsSync(bugPath)) {
    console.error(`❌ Không tìm thấy ${path.relative(ROOT, bugPath)}`);
    await suggestSimilarSlugs(baseDir, bugSlug);
    process.exit(1);
  }
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns } = await parseKNs(KNOWLEGED);
  const nextId = findNextKnId(kns);
  const { title, severity, tags, root, fix, guard } = extractBugMeta(bugText, bugSlug);
  const today = todayISO();
  const { needsGuard, gateWarning, guardText } = computeGuardGate(nextId, severity, guard);

  const draft = buildKnDraft({ nextId, title, severity, root, fix, tags, today, bugSlug, author: 'YUNIE / auto-learn propose', guardText });
  const tableRow = buildKnTableRow({ nextId, today, title, root, tags });

  if (json) {
    console.log(JSON.stringify({ nextId, bugSlug, title, severity, tags, guard, gateWarning, draft, tableRow }, null, 2));
    enforceStrictGuard(opts, gateWarning);
    return;
  }
  console.log(`📋 Đề xuất KN mới từ bug ${bugSlug}:\n`);
  console.log(`— Bảng tóm tắt (dán vào ## Bảng tóm tắt):`);
  console.log(tableRow);
  console.log(`\n— Chi tiết (dán vào ## Chi tiết bài học, trước <!-- Thêm bài học mới -->):\n`);
  console.log(draft);
  console.log(`\n— Anti-pattern (thêm vào ## Anti-patterns tích lũy nếu phù hợp):`);
  console.log(`- ❌ ${title} — ${root.slice(0,60)}`);
  printGuardGate(gateWarning, needsGuard, guard);
  console.log(`\n✅ Sau khi dán, chạy: node .github/harness/scripts/auto-learn.mjs status`);
  console.log(`   và commit docs/knowleged.md + .agent/bugs/${bugSlug}/bug.md`);
  console.log(`\n🔬 Reef-lite: để có gate evaluate trước khi commit:`);
  console.log(`   node .github/harness/scripts/auto-learn.mjs evaluate --bug ${bugSlug}`);
  console.log(`   node .github/harness/scripts/auto-learn.mjs commit --bug ${bugSlug}  # chỉ commit khi evaluate PASS`);
  enforceStrictGuard(opts, gateWarning);
}

// ---------- Reef-lite: Serve → Observe → Grow → Commit ----------

function genRecordId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `rec-${ts}-${rnd}`;
}

function resolveRecordFields(opts) {
  const scenario = opts.scenario || opts.s || 'default';
  const prompt = opts.prompt || opts.p || opts.msg || '';
  const response = opts.response || opts.r || '';
  return { scenario, prompt, response };
}

function printRecordHuman(rec, prompt) {
  console.log(`✅ Recorded interaction: ${rec.id}`);
  console.log(`   scenario: ${rec.scenario}`);
  console.log(`   prompt: ${prompt.slice(0, 80)}`);
  console.log(`   → report: node .github/harness/scripts/auto-learn.mjs report --references ${rec.id} --score 1 --feedback "ok"`);
}

async function recordInteraction(opts, json=false) {
  const { scenario, prompt, response } = resolveRecordFields(opts);
  if (!prompt) {
    console.error('❌ Thiếu --prompt "mô tả interaction". Ví dụ: record --scenario "fix-rainbow" --prompt "sửa border xoay"');
    process.exit(1);
  }
  await fs.mkdir(RECORDS_DIR, { recursive: true });
  const id = genRecordId();
  const rec = {
    id,
    scenario,
    prompt: prompt.slice(0, 2000),
    response: response.slice(0, 2000),
    createdAt: new Date().toISOString(),
    meta: { file: opts.file || '', title: opts.title || '' }
  };
  await fs.writeFile(path.join(RECORDS_DIR, `${id}.json`), JSON.stringify(rec, null, 2), 'utf8');
  // also append to reports index for quick lookup
  if (json) console.log(JSON.stringify(rec, null, 2));
  else printRecordHuman(rec, prompt);
  return id;
}

function resolveReportRefs(opts) {
  const refsRaw = opts.references || opts.refs || opts.receipt || opts.bug || '';
  const bugSlug = opts.bug || '';
  let references = [];
  // allow --bug <slug> as shorthand for referencing a bug
  if (bugSlug && !refsRaw) {
    // find record ids linked to bug or just use bug slug as reference
    references = [bugSlug];
  } else if (refsRaw) {
    references = refsRaw.split(/[,\s]+/).filter(Boolean);
    // if refs contain bug slug pattern, keep as is
  }
  return { references, bugSlug };
}

function validateReportScore(scoreRaw) {
  if (scoreRaw === undefined || scoreRaw === '') {
    console.error('❌ Thiếu --score <0..1>. Ví dụ: report --score 1 --feedback "pass" --references rec-xxx');
    process.exit(1);
  }
  const score = parseFloat(scoreRaw);
  if (isNaN(score) || score < 0 || score > 1) {
    console.error('❌ --score phải là số 0..1 (ví dụ 0, 0.5, 1)');
    process.exit(1);
  }
  return score;
}

// validate references exist (warn if not)
function warnMissingRefs(references) {
  for (const r of references) {
    const recPath = path.join(RECORDS_DIR, `${r}.json`);
    const bugPath = path.join(BUGS_DIR, r, 'bug.md');
    if (!existsSync(recPath) && !existsSync(bugPath) && !r.startsWith('rec-')) {
      console.warn(`⚠️  Reference "${r}" không tìm thấy trong records/ hay bugs/ — vẫn ghi nhưng nên kiểm tra.`);
    }
  }
}

async function appendBugNote(bugSlug, entry, score, feedback, references) {
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  if (!existsSync(bugPath)) return;
  try {
    const bugText = await fs.readFile(bugPath, 'utf8');
    const note = `\n\n> 📊 Report ${entry.ts}: score=${score} feedback="${feedback.slice(0,80)}" refs=${references.join(',')}\n`;
    if (!bugText.includes(entry.ts)) {
      await fs.appendFile(bugPath, note, 'utf8');
    }
  } catch {}
}

function printReportHuman(entry, score, references, scenario, bugSlug) {
  console.log(`✅ Reported feedback: score=${score} → ${references.join(', ')}`);
  if (entry.feedback) console.log(`   feedback: ${entry.feedback.slice(0, 100)}`);
  console.log(`   scenario: ${scenario}`);
  console.log(`   → evaluate: node .github/harness/scripts/auto-learn.mjs evaluate --bug ${bugSlug || references[0]}`);
}

async function reportFeedback(opts, json=false) {
  const scoreRaw = opts.score;
  const feedback = opts.feedback || opts.msg || '';
  const scenario = opts.scenario || opts.s || 'default';
  const { references, bugSlug } = resolveReportRefs(opts);
  const score = validateReportScore(scoreRaw);
  if (references.length === 0) {
    console.error('❌ Thiếu --references <id> hoặc --bug <slug>. Ví dụ: --references rec-abc123 hoặc --bug 2026-08-30-xyz');
    process.exit(1);
  }
  await fs.mkdir(path.dirname(REPORTS_FILE), { recursive: true });
  warnMissingRefs(references);
  const entry = {
    ts: new Date().toISOString(),
    scenario,
    score,
    feedback: feedback.slice(0, 2000),
    references,
    bug: bugSlug || null
  };
  await fs.appendFile(REPORTS_FILE, JSON.stringify(entry) + '\n', 'utf8');
  // if bug slug provided, also append a note to bug.md
  if (bugSlug) await appendBugNote(bugSlug, entry, score, feedback, references);
  if (json) console.log(JSON.stringify(entry, null, 2));
  else printReportHuman(entry, score, references, scenario, bugSlug);
  return entry;
}

function checkBugReadiness(bugText) {
  // check Fix section filled
  const fixSection = bugText.match(/## 3\. Fix([\s\S]*?)## 4\./);
  const fixContent = fixSection ? fixSection[1].trim() : '';
  const hasFix = fixContent.length > 50 && !fixContent.includes('<Tiêu đề') && !fixContent.includes('Chưa điền');
  const hasApproach = /Approach:/i.test(bugText) && !/Approach:\s*Chưa điền/i.test(bugText);
  // check status
  const isFixed = /Status:\s*`?fixed`?/i.test(bugText) || /Status:\s*fixed/i.test(bugText);
  const isOpen = /Status:\s*`?open`?/i.test(bugText);
  return { hasFix, hasApproach, isFixed, isOpen };
}

async function loadBugReports(bugSlug) {
  const reports = [];
  try {
    if (existsSync(REPORTS_FILE)) {
      const lines = (await fs.readFile(REPORTS_FILE, 'utf8')).trim().split('\n').filter(Boolean);
      for (const l of lines) {
        try {
          const r = JSON.parse(l);
          if (r.references && r.references.includes(bugSlug) || r.bug === bugSlug) reports.push(r);
        } catch {}
      }
    }
  } catch {}
  return reports;
}

function scoreDuplicateCandidates(kns, title) {
  // duplicate check via suggest
  const qTokens = tokenize(title);
  const idf = computeIDF(qTokens, kns);
  return kns.map(kn => ({ ...kn, score: scoreKN(qTokens, title, kn, idf) }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, 3);
}

const DUPLICATE_THRESHOLD = 15; // tuned: >15 likely duplicate

function decideEvalGate({ hasFix, isDuplicate, topScored, isOpen, isFixed, reports, avgScore, hasPositiveReport }) {
  // gate logic: PASS if hasFix and not duplicate and (no reports or has positive)
  let decision = 'PASS';
  const reasons = [];
  if (!hasFix) { decision = 'FAIL'; reasons.push('Fix section chưa điền đủ (cần Approach + Files Changed)'); }
  if (isDuplicate) { decision = 'FAIL'; reasons.push(`Trùng KN hiện có: ${topScored.id} score ${topScored.score} ≥ ${DUPLICATE_THRESHOLD} — có thể đã có bài học tương tự`); }
  if (reports.length > 0 && !hasPositiveReport && avgScore !== null && avgScore < 0.5) {
    decision = 'FAIL'; reasons.push(`Reports điểm thấp avg ${avgScore.toFixed(2)} — chưa đủ bằng chứng fix tốt`);
  }
  if (isOpen && !isFixed && reports.length===0) {
    // allow PASS with warning if no reports but fix exists — reef-lite local doesn't require report
    reasons.push('Chưa có report — sẽ commit nhưng nên report --score để có version history đầy đủ');
  }
  if (decision === 'PASS' && reasons.length===0) reasons.push('Đủ điều kiện commit — không trùng, có fix, reports ok');
  return { decision, reasons };
}

function printEvaluateHuman(result, bugSlug, scored) {
  const { decision, reasons, checks } = result;
  const icon = decision==='PASS' ? '✅' : '⛔';
  console.log(`${icon} Evaluate ${bugSlug} → ${decision}`);
  console.log(`   title: ${result.title}`);
  console.log(`   nextId: ${result.nextId}`);
  console.log(`   checks: hasFix=${checks.hasFix} hasApproach=${checks.hasApproach} isFixed=${checks.isFixed} reports=${checks.reports} avgScore=${checks.avgScore!==null?checks.avgScore.toFixed(2):'—'} duplicate=${checks.isDuplicate ? scored[0].id+'('+scored[0].score+')' : 'no'}`);
  if (scored.length) console.log(`   top KN: ${scored.map(s=>`${s.id}(${s.score})`).join(', ')}`);
  console.log(`   reasons:`);
  for (const r of reasons) console.log(`     - ${r}`);
  if (decision==='PASS') console.log(`\n→ Sẵn sàng commit: node .github/harness/scripts/auto-learn.mjs commit --bug ${bugSlug}`);
  else console.log(`\n→ Chưa commit được — hãy bổ sung fix/report hoặc kiểm tra trùng lặp.`);
}

async function evaluateCandidate(bugSlug, json=false) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: evaluate --bug 2026-08-30-xyz');
    process.exit(1);
  }
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  if (!existsSync(bugPath)) {
    console.error(`❌ Không tìm thấy ${path.relative(ROOT, bugPath)}`);
    process.exit(1);
  }
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns } = await parseKNs(KNOWLEGED);
  const { title } = extractBugMeta(bugText, bugSlug);
  const { hasFix, hasApproach, isFixed, isOpen } = checkBugReadiness(bugText);
  const scored = scoreDuplicateCandidates(kns, title);
  const topScore = scored[0]?.score || 0;
  const isDuplicate = topScore >= DUPLICATE_THRESHOLD;
  const reports = await loadBugReports(bugSlug);
  const avgScore = reports.length ? (reports.reduce((s,r)=>s+r.score,0)/reports.length) : null;
  const hasPositiveReport = reports.some(r=>r.score >= 0.7);
  const { decision, reasons } = decideEvalGate({ hasFix, isDuplicate, topScored: scored[0], isOpen, isFixed, reports, avgScore, hasPositiveReport });
  const result = {
    bug: bugSlug,
    title,
    decision,
    reasons,
    checks: {
      hasFix,
      hasApproach,
      isFixed,
      isOpen,
      topDuplicate: scored[0] ? { id: scored[0].id, title: scored[0].title, score: topScore } : null,
      isDuplicate,
      reports: reports.length,
      avgScore,
      hasPositiveReport
    },
    scored: scored.map(s=>({ id:s.id, title:s.title, score:s.score })),
    nextId: findNextKnId(kns)
  };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printEvaluateHuman(result, bugSlug, scored);
  }
  return result;
}

function insertKnTableRow(text, tableRow) {
  if (!text.includes('| KN-')) return text;
  // find last table row
  const lines = text.split('\n');
  let lastTableIdx = -1;
  for (let i=0;i<lines.length;i++) if (/^\|\s*KN-\d+/.test(lines[i])) lastTableIdx=i;
  if (lastTableIdx < 0) return text;
  lines.splice(lastTableIdx+1, 0, tableRow);
  return lines.join('\n');
}

function insertKnDetail(text, detail) {
  const marker = '<!-- Thêm bài học mới';
  if (text.includes(marker)) return text.replace(marker, detail + '\n' + marker);
  // fallback: append before Anti-patterns
  const apMarker = '## Anti-patterns';
  if (text.includes(apMarker)) return text.replace(apMarker, detail + '\n' + apMarker);
  return text + '\n' + detail;
}

function bumpUpdatedAt(text, nextId, title, nowISO) {
  if (!text.includes('UpdatedAt:')) return text;
  return text.replace(/UpdatedAt:\s*[^\n]+/, `UpdatedAt: ${nowISO} — ${nextId} added (${title.slice(0,30)})`);
}

async function snapshotKnowleged(today, nextId, title) {
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  const snapshotName = `${today}-${nextId}-${normalizeSlug(title).slice(0,20)}`;
  const snapshotPath = path.join(VERSIONS_DIR, `${snapshotName}.md`);
  try {
    const before = await fs.readFile(KNOWLEGED, 'utf8');
    await fs.writeFile(snapshotPath, before, 'utf8');
  } catch {}
  return { snapshotName, snapshotPath };
}

async function markBugFixed(bugPath) {
  try {
    let bugT = await fs.readFile(bugPath, 'utf8');
    if (bugT.includes('Status:** `open`') || bugT.includes('Status: `open`')) {
      bugT = bugT.replace(/Status:\s*`?open`?/i, 'Status: `fixed`');
      await fs.writeFile(bugPath, bugT, 'utf8');
    }
  } catch {}
}

function printCommitHuman(nextId, bugSlug, snapshotPath, nowISO) {
  console.log(`\n✅ Committed ${nextId} từ ${bugSlug}`);
  console.log(`   snapshot: ${path.relative(ROOT, snapshotPath)}`);
  console.log(`   knowleged.md đã cập nhật — UpdatedAt: ${nowISO}`);
  console.log(`   → kiểm tra: node .github/harness/scripts/auto-learn.mjs status`);
  console.log(`   → history: node .github/harness/scripts/auto-learn.mjs history`);
}

async function commitCandidate(bugSlug, json=false) {
  if (!bugSlug) {
    console.error('❌ Thiếu --bug <slug>. Ví dụ: commit --bug 2026-08-30-xyz');
    process.exit(1);
  }
  // first evaluate
  const evalRes = await evaluateCandidate(bugSlug, false);
  if (evalRes.decision !== 'PASS') {
    console.log(`\n⛔ Commit bị chặn — evaluate = FAIL. Sửa theo reasons trên rồi thử lại.`);
    if (!json) process.exit(2);
    return { ...evalRes, committed: false };
  }
  // generate draft
  const bugPath = path.join(BUGS_DIR, bugSlug, 'bug.md');
  const bugText = await fs.readFile(bugPath, 'utf8');
  const { kns } = await parseKNs(KNOWLEGED);
  const nextId = findNextKnId(kns);
  const { title, severity, tags, root, fix } = extractBugMeta(bugText, bugSlug, { tags: 'process', root: 'Xem bug.md Root Cause', fix: 'Xem bug.md Fix' });
  const today = todayISO();
  // create version snapshot before edit
  const { snapshotName, snapshotPath } = await snapshotKnowleged(today, nextId, title);
  // build draft blocks
  const tableRow = buildKnTableRow({ nextId, today, title, root, tags });
  const detail = buildKnDraft({ nextId, title, severity, root, fix, tags, today, bugSlug, author: 'YUNIE / reef-lite commit' });
  // append to knowleged.md: find table end and detail insertion point
  const nowISO = new Date().toISOString();
  let text = await fs.readFile(KNOWLEGED, 'utf8');
  text = insertKnTableRow(text, tableRow);
  text = insertKnDetail(text, detail);
  text = bumpUpdatedAt(text, nextId, title, nowISO);
  await fs.writeFile(KNOWLEGED, text, 'utf8');
  // update bug.md status to fixed if not already
  await markBugFixed(bugPath);
  // write version meta
  const meta = {
    id: nextId,
    bug: bugSlug,
    title,
    committedAt: nowISO,
    snapshot: path.relative(ROOT, snapshotPath),
    eval: evalRes,
    tableRow,
    detail: detail.slice(0, 500)
  };
  await fs.writeFile(path.join(VERSIONS_DIR, `${snapshotName}.json`), JSON.stringify(meta, null, 2), 'utf8');
  if (json) console.log(JSON.stringify({ ...meta, committed: true }, null, 2));
  else printCommitHuman(nextId, bugSlug, snapshotPath, nowISO);
  return { ...meta, committed: true };
}

async function listVersions(json=false) {
  let files = [];
  try {
    const entries = await fs.readdir(VERSIONS_DIR, { withFileTypes:true });
    files = entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).sort().reverse();
  } catch { files=[]; }
  const versions = [];
  for (const f of files.slice(0, 20)) {
    try {
      const j = JSON.parse(await fs.readFile(path.join(VERSIONS_DIR, f), 'utf8'));
      versions.push(j);
    } catch {}
  }
  if (json) { console.log(JSON.stringify({ total: files.length, versions }, null, 2)); return; }
  console.log(`📚 Versions — ${files.length} snapshots trong .agent/versions/`);
  if (versions.length===0) console.log('   (chưa có version nào — commit lần đầu sẽ tạo snapshot)');
  for (const v of versions.slice(0, 10)) {
    console.log(`  ${v.id} ← ${v.bug} @ ${v.committedAt.slice(0,10)} — ${v.title.slice(0,50)}`);
  }
  if (files.length>10) console.log(`   ... và ${files.length-10} version cũ hơn`);
}

async function readRecentReports(limit) {
  const reports = [];
  try {
    if (existsSync(REPORTS_FILE)) {
      const lines = (await fs.readFile(REPORTS_FILE, 'utf8')).trim().split('\n').filter(Boolean);
      for (const l of lines.slice(-20)) {
        try { reports.push(JSON.parse(l)); } catch {}
      }
    }
  } catch {}
  return reports.slice(-limit);
}

async function readRecentVersions(limit) {
  const versions = [];
  try {
    const entries = await fs.readdir(VERSIONS_DIR, { withFileTypes:true });
    const jsons = entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).sort().reverse().slice(0,10);
    for (const f of jsons) {
      try { versions.push(JSON.parse(await fs.readFile(path.join(VERSIONS_DIR, f), 'utf8'))); } catch {}
    }
  } catch {}
  return versions.slice(0, limit);
}

async function readRecentRecords() {
  try {
    const entries = await fs.readdir(RECORDS_DIR, { withFileTypes:true });
    return entries.filter(e=>e.isFile() && e.name.endsWith('.json')).map(e=>e.name).slice(-5);
  } catch { return []; }
}

function printHistoryHuman(reports, versions, records) {
  console.log(`🔄 Reef-lite History — Serve → Observe → Grow → Commit`);
  console.log(`\n  Serve (records): ${records.length} interactions trong .agent/records/`);
  if (records.length) console.log(`    → ${records.join(', ')}`);
  console.log(`\n  Observe (reports): ${reports.length} reports gần đây`);
  for (const r of reports.slice(-5)) {
    console.log(`    ${r.ts.slice(0,16)} score=${r.score} refs=${r.references.join(',')} — ${r.feedback.slice(0,50)}`);
  }
  if (reports.length===0) console.log('    (chưa có report — dùng: report --bug <slug> --score 1 --feedback "ok")');
  console.log(`\n  Grow → Commit (versions): ${versions.length} commits`);
  for (const v of versions.slice(0,5)) {
    console.log(`    ${v.committedAt.slice(0,16)} ${v.id} ← ${v.bug}`);
  }
  if (versions.length===0) console.log('    (chưa có commit — dùng: commit --bug <slug> sau khi evaluate PASS)');
  console.log(`\n💡 Loop: record → report → propose → evaluate → commit → versions`);
}

async function showHistory(json=false) {
  const reports = await readRecentReports(20);
  const versions = await readRecentVersions(10);
  const records = await readRecentRecords();
  if (json) { console.log(JSON.stringify({ reports: reports.slice(-10), versions: versions.slice(0,5), records }, null, 2)); return; }
  printHistoryHuman(reports, versions, records);
}

// ---------- Hawking Radiation — nợ bay hơi (roadmap card, 2026-09-12) ----------
// Lỗ đen không "ăn" thì bay hơi: draft mở già đi theo thời gian thay vì tích tụ tới heat death.
// ≥30d → escalate (journal + nhắc) · ≥90d → evaporate (note + Status, gợi ý chuyển hoá KN).
// Journal append-only, idempotent: chỉ ghi khi action ĐỔI.
const HAWKING_DEFAULT = { escalateDays: 30, evaporateDays: 90 };
// Human sign-off gate (siết 2026-09-12, user duyệt): tách intent/execution —
// agent chỉ ĐỀ XUẤT, mutation bug.md phải có người ký; danh tính agent không tự ký được.
const AGENT_SIGNER_EXACT = /^(agent|bot|auto|automation|ai|system|ci|cd|yunie|verify|implement|critic|planner|designer|polish|explore|learn|copilot|github[-_ ]?copilot)$/i;
const AGENT_SIGNER_CONTAINS = /(^|[-_\s])(agent|bot|auto|copilot|yunie|verify|ci)([-_\s]|$)/i;
function validateSigner(raw) {
  const signer = typeof raw === 'string' ? raw.trim() : '';
  if (!signer || signer === 'true') return { ok: false, reason: 'thiếu --sign (chưa có người ký)' };
  if (AGENT_SIGNER_EXACT.test(signer) || AGENT_SIGNER_CONTAINS.test(signer)) {
    return { ok: false, reason: `"${signer}" là danh tính agent — chỉ human được ký` };
  }
  return { ok: true, signer };
}

function ageDaysFromSlug(slug, fallbackMs, nowMs) {
  const m = /^(\d{4})-(\d{2})-(\d{2})-/.exec(slug);
  const base = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : fallbackMs;
  return Math.max(0, Math.floor((nowMs - base) / 86400000));
}

function parseWatchdogOpts(opts) {
  const nowMs = opts.now ? new Date(opts.now).getTime() : Date.now();
  if (Number.isNaN(nowMs)) throw new Error('--now không hợp lệ: ' + opts.now);
  const dir = opts.dir ? path.resolve(ROOT, opts.dir) : BUGS_DIR;
  return {
    asJson: !!opts.json,
    apply: !!opts.apply,
    dir,
    journal: opts.journal ? path.resolve(ROOT, opts.journal) : path.join(dir, 'hawking.jsonl'),
    nowMs,
    escalateDays: Number(opts['escalate-days'] ?? HAWKING_DEFAULT.escalateDays),
    evaporateDays: Number(opts['evaporate-days'] ?? HAWKING_DEFAULT.evaporateDays),
    outPath: opts.out ? path.resolve(ROOT, opts.out) : null,
  };
}

async function readBugFile(bugFile) {
  try {
    const text = await fs.readFile(bugFile, 'utf8');
    const mtime = (await fs.stat(bugFile)).mtimeMs;
    return { text, mtime };
  } catch { return null; }
}

function judgeHawkingBug(slug, text, mtime, nowMs, escalateDays, evaporateDays) {
  if (!/-\s*\*\*Status:\*\*\s*`?open`?/i.test(text)) return null;
  const ageDays = ageDaysFromSlug(slug, mtime, nowMs);
  const action = ageDays >= evaporateDays ? 'evaporate' : ageDays >= escalateDays ? 'escalate' : 'fresh';
  return { slug, date: /^\d{4}-\d{2}-\d{2}/.test(slug) ? slug.slice(0, 10) : null, ageDays, status: 'open', action };
}

async function scanHawkingBugs(dir, nowMs, escalateDays, evaporateDays) {
  const bugs = [];
  let closed = 0;
  let dirs = [];
  try {
    dirs = (await fs.readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && e.name !== '_template')
      .map((e) => e.name);
  } catch { return { bugs, closed }; }
  for (const slug of dirs) {
    const got = await readBugFile(path.join(dir, slug, 'bug.md'));
    if (!got) continue;
    const bug = judgeHawkingBug(slug, got.text, got.mtime, nowMs, escalateDays, evaporateDays);
    if (bug) bugs.push(bug); else closed++;
  }
  bugs.sort((a, b) => b.ageDays - a.ageDays || a.slug.localeCompare(b.slug));
  return { bugs, closed };
}

function hawkingCounts(bugs, closed) {
  const by = (action) => bugs.filter((b) => b.action === action).length;
  return {
    bugsTotal: bugs.length + closed,
    open: bugs.length,
    fresh: by('fresh'),
    escalate: by('escalate'),
    evaporate: by('evaporate'),
    closed,
  };
}

// GATE: mutation bắt buộc human sign-off — thiếu/agent ký → REFUSED + dry-run, không ghi gì (fail-closed)
function refuseHawkingSignoff(sig, bugs) {
  const planned = bugs.filter((b) => b.action !== 'fresh');
  console.log('⛔ REFUSED — mutation cần human sign-off (chưa áp dụng gì).');
  console.log('   Lý do: ' + sig.reason);
  console.log('   Kế hoạch (dry-run — human review trước khi ký):');
  if (!planned.length) console.log('     (không có action nào cần áp dụng)');
  for (const b of planned) console.log('     [' + b.action + '] ' + b.slug + ' — ' + b.ageDays + ' ngày');
  console.log('   Human duyệt xong chạy lại: watchdog --apply --sign "<tên người>"');
  console.error('⛔ REFUSED (hawking-signoff): ' + sig.reason + ' — human chạy: watchdog --apply --sign "<tên>"');
  process.exit(2);
}

// journal cũ → entry cuối cùng per slug (idempotent: chỉ ghi khi action đổi)
async function readHawkingJournal(journal) {
  const lastBySlug = new Map();
  try {
    const raw = await fs.readFile(journal, 'utf8');
    for (const line of raw.trim().split('\n').filter(Boolean)) {
      try { const e = JSON.parse(line); lastBySlug.set(e.slug, e); } catch {}
    }
  } catch {}
  return lastBySlug;
}

async function evaporateBug(dir, b, result, evaporateDays) {
  const bugDir = path.join(dir, b.slug);
  const dateStr = result.generatedAt.slice(0, 10);
  await fs.appendFile(path.join(bugDir, 'hawking.md'),
    `\n## 🌑 Hawking Radiation — ${dateStr}\n\nDraft mở **${b.ageDays} ngày** (ngưỡng ${evaporateDays}d) → bay hơi. Status: open → evaporated.\n\n> Lịch sử giữ nguyên. Chuyển hoá kiến thức: \`node .github/harness/scripts/auto-learn.mjs propose --bug ${b.slug}\`\n`, 'utf8');
  const bugFile = path.join(bugDir, 'bug.md');
  const text = await fs.readFile(bugFile, 'utf8');
  const updated = text.replace(/-\s*\*\*Status:\*\*\s*`?open`?/i, '- **Status:** `evaporated`');
  if (updated !== text) await fs.writeFile(bugFile, updated, 'utf8');
}

async function applyHawkingEntry(b, ctx) {
  if (b.action === 'fresh') return null;
  const prev = ctx.lastBySlug.get(b.slug);
  if (prev && prev.action === b.action) return null; // không lặp
  const entry = { ts: ctx.result.generatedAt, slug: b.slug, ageDays: b.ageDays, action: b.action, prev: prev ? prev.action : null, signedBy: ctx.sig.signer };
  await fs.mkdir(path.dirname(ctx.journal), { recursive: true });
  await fs.appendFile(ctx.journal, JSON.stringify(entry) + '\n', 'utf8');
  if (b.action === 'evaporate') await evaporateBug(ctx.dir, b, ctx.result, ctx.evaporateDays);
  return entry;
}

async function applyHawking(bugs, ctx) {
  const entries = [];
  for (const b of bugs) {
    const entry = await applyHawkingEntry(b, ctx);
    if (entry) entries.push(entry);
  }
  return entries;
}

async function writeWatchdogOutput(result, outPath) {
  if (!outPath) return;
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
}

function printWatchdogHuman(result, entries, escalateDays, evaporateDays) {
  const { counts, bugs } = result;
  console.log('🌑 HAWKING RADIATION — nợ bay hơi (' + counts.bugsTotal + ' bug)');
  console.log('   Mở: ' + counts.open + ' · fresh ' + counts.fresh + ' · escalate ' + counts.escalate + ' · evaporate ' + counts.evaporate + ' · đã đóng ' + counts.closed);
  if (!counts.open) console.log('   ✅ không có draft quá hạn — lỗ đen sạch');
  else for (const b of bugs) console.log('   [' + b.action + '] ' + b.slug + ' — ' + b.ageDays + ' ngày');
  console.log('');
  console.log('   ≥' + escalateDays + 'd: escalate (journal + nhắc) · ≥' + evaporateDays + 'd: note + Status → evaporated (giữ lịch sử, gợi ý propose KN)');
  for (const e of entries) console.log('   ✍️ đã áp dụng (signed by ' + e.signedBy + '): [' + e.action + '] ' + e.slug + ' — ' + e.ageDays + ' ngày');
  console.log('   Đo: watchdog [--json] [--out <f>] · Áp dụng (cần human sign-off): watchdog --apply --sign "<tên người>"' + (entries.length ? ' (' + entries.length + ' entry mới)' : ''));
}

async function watchdog(opts = {}) {
  const { asJson, apply, dir, journal, nowMs, escalateDays, evaporateDays, outPath } = parseWatchdogOpts(opts);
  const { bugs, closed } = await scanHawkingBugs(dir, nowMs, escalateDays, evaporateDays);
  const counts = hawkingCounts(bugs, closed);
  const result = {
    generatedAt: new Date(nowMs).toISOString(),
    generatedBy: 'auto-learn.mjs watchdog',
    policy: { escalateDays, evaporateDays },
    counts,
    bugs,
  };

  let entries = [];
  if (apply) {
    const sig = validateSigner(opts.sign);
    if (!sig.ok) refuseHawkingSignoff(sig, bugs); // fail-closed — không ghi gì
    const lastBySlug = await readHawkingJournal(journal);
    entries = await applyHawking(bugs, { journal, dir, result, sig, evaporateDays, lastBySlug });
  }

  await writeWatchdogOutput(result, outPath);
  if (asJson || outPath) { console.log(JSON.stringify(result, null, 2)); return; }
  printWatchdogHuman(result, entries, escalateDays, evaporateDays);
}

// ---------- CMB Anisotropy — heatmap KN × tag × tháng (roadmap card #3, 2026-09-12) ----------
// Điểm lạnh: coldness = bugCount − knCount (bug nổ nhiều hơn bài học). KN 0 tham chiếu trong bugs/plans
// → fresh (<14 ngày, chờ tham chiếu) | merge-or-delete. Helpers tách nhỏ giữ CC thấp (Slop Gate KN-047).
const HEATMAP_FRESH_DAYS = 14;

async function collectBugTagData() {
  const bugs = [];
  let dirs = [];
  try {
    dirs = (await fs.readdir(BUGS_DIR, { withFileTypes: true })).filter((e) => e.isDirectory() && e.name !== '_template').map((e) => e.name);
  } catch { return bugs; }
  for (const slug of dirs) {
    let text = '';
    try { text = await fs.readFile(path.join(BUGS_DIR, slug, 'bug.md'), 'utf8'); } catch { continue; }
    const tagsLineM = text.match(/-\s*\*\*Tags:\*\*\s*([^\n]+)/);
    const tags = tagsLineM ? [...tagsLineM[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim()) : [];
    bugs.push({ slug, date: /^\d{4}-\d{2}-\d{2}/.test(slug) ? slug.slice(0, 10) : null, tags });
  }
  return bugs;
}

function isRefFile(name) {
  return name.endsWith('.md') || name.endsWith('.json');
}

async function walkRefFiles(dir, out = [], match = isRefFile) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkRefFiles(p, out, match);
    else if (e.isFile() && match(e.name)) out.push(p);
  }
  return out;
}

// Ngày của KN: field Ngày: trong block → fallback quét dòng bảng tóm tắt | KN-xxx | YYYY-MM-DD |
function knDate(kn, raw) {
  if (kn.date) return kn.date;
  const m = raw.match(new RegExp('\\|\\s*' + kn.id + '\\s*\\|\\s*([0-9]{4}-[0-9]{2}-[0-9]{2})'));
  return m ? m[1] : '';
}

function buildHeatmapGrid(kns, raw) {
  const knByTag = new Map();
  const monthsSet = new Set();
  for (const k of kns) {
    const date = knDate(k, raw);
    const bucket = date ? date.slice(0, 7) : 'unknown';
    monthsSet.add(bucket);
    for (const t of new Set(k.tags)) {
      if (!knByTag.has(t)) knByTag.set(t, new Map());
      const m = knByTag.get(t);
      m.set(bucket, (m.get(bucket) || 0) + 1);
    }
  }
  const months = [...monthsSet].sort((a, b) => (a === 'unknown' ? 1 : b === 'unknown' ? -1 : a.localeCompare(b)));
  const tagTotals = new Map();
  const rows = [...knByTag.keys()].map((tag) => {
    const cells = months.map((m) => knByTag.get(tag).get(m) || 0);
    const total = cells.reduce((a, b) => a + b, 0);
    tagTotals.set(tag, total);
    return { tag, total, cells };
  }).sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));
  return { months, rows, tagTotals };
}

function buildColdSpots(tagTotals, bugs) {
  const bugByTag = new Map();
  for (const b of bugs) for (const t of new Set(b.tags)) bugByTag.set(t, (bugByTag.get(t) || 0) + 1);
  const allTags = new Set([...tagTotals.keys(), ...bugByTag.keys()]);
  return [...allTags].map((tag) => {
    const kn = tagTotals.get(tag) || 0;
    const bug = bugByTag.get(tag) || 0;
    return { tag, kn, bug, coldness: bug - kn };
  }).filter((s) => s.coldness >= 1)
    .sort((a, b) => b.coldness - a.coldness || b.bug - a.bug || a.tag.localeCompare(b.tag));
}

// KN-049 class (2026-09-12): plan/bug thật viết shorthand — "KN-033/034/035/036" (slash-list)
// hoặc "KN-033→036"/"KN-001..004" (range) — regex full-token bỏ sót các id giữa → false "0 tham chiếu"
// cho KN có thật (KN-035). Expand shorthand trước khi match; guard: range ngược hoặc span >30 →
// giữ nguyên (chống expand bừa từ typo). Detector metric phải khớp data thật — cùng bài học KN-049.
function expandKnRefs(text) {
  const lists = text.replace(/KN-(\d{3})((?:\/\d{3})+)/g, (_m, first, rest) =>
    ['KN-' + first, ...rest.split('/').filter(Boolean).map((n) => 'KN-' + n)].join(' '));
  return lists.replace(/KN-(\d{3})\s*(?:→|->|\.\.)\s*(?:KN-)?(\d{3})(?!\d)/g, (m, a, b) => {
    const start = Number(a), end = Number(b);
    if (end <= start || end - start > 30) return m;
    const ids = [];
    for (let i = start; i <= end; i++) ids.push('KN-' + String(i).padStart(3, '0'));
    return ids.join(' ');
  });
}

function buildZeroRef(kns, raw, allRefs, nowMs) {
  const zeroRef = [];
  for (const k of kns) {
    if ((allRefs.match(new RegExp(k.id + '(?!\\d)', 'g')) || []).length) continue;
    const date = knDate(k, raw);
    const ageDays = date ? Math.floor((nowMs - Date.parse(date + 'T00:00:00Z')) / 864e5) : null;
    zeroRef.push({
      id: k.id, title: k.title, date: date || null, ageDays,
      action: ageDays != null && ageDays < HEATMAP_FRESH_DAYS ? 'fresh' : 'merge-or-delete',
    });
  }
  return zeroRef.sort((a, b) => (b.ageDays ?? 1e9) - (a.ageDays ?? 1e9) || a.id.localeCompare(b.id));
}

async function collectRefTexts() {
  const refFiles = [...await walkRefFiles(BUGS_DIR), ...await walkRefFiles(PLANS_DIR)];
  const refTexts = [];
  for (const f of refFiles) { try { refTexts.push(await fs.readFile(f, 'utf8')); } catch {} }
  return { refFiles, refTexts };
}

function printHeatmapHuman({ kns, bugs, rows, months, refFiles, coldSpots, zeroRef }) {
  console.log('🌡️ CMB ANISOTROPY — ' + kns.length + ' KN · ' + bugs.length + ' bug · ' + rows.length + ' tag · ' + months.length + ' tháng (' + months.join(', ') + ')');
  console.log('   Grid: ' + rows.length + ' tag × ' + months.length + ' tháng · ref files: ' + refFiles.length);
  if (!coldSpots.length) console.log('   ✅ không có điểm lạnh — không tag nào bug vượt KN');
  else {
    console.log('   ❄️ Điểm lạnh (bug > KN): ' + coldSpots.length);
    for (const s of coldSpots.slice(0, 5)) console.log('      ' + s.tag + ' — bug ' + s.bug + ' / KN ' + s.kn + ' (cold ' + s.coldness + ')');
  }
  if (!zeroRef.length) console.log('   ✅ mọi KN đều được tham chiếu trong bugs/plans');
  else {
    console.log('   👻 KN 0 tham chiếu: ' + zeroRef.length);
    for (const z of zeroRef) console.log('      ' + z.id + ' — ' + (z.ageDays ?? '?') + ' ngày [' + z.action + '] ' + z.title.slice(0, 60));
  }
  console.log('   → Ưu tiên viết KN cho điểm lạnh · KN cũ 0 ref → gộp hoặc xoá (knowleged.md)');
  console.log('   Mirror: --out www/cosmos/heatmap.json · refresh: npm run cosmos:refresh');
}

async function statsHeatmap(opts = {}) {
  const asJson = !!opts.json;
  const nowMs = opts.now ? new Date(opts.now).getTime() : Date.now();
  if (Number.isNaN(nowMs)) throw new Error('--now không hợp lệ: ' + opts.now);
  const outPath = opts.out ? path.resolve(ROOT, opts.out) : null;

  const { kns, raw } = await parseKNs(KNOWLEGED);
  const bugs = await collectBugTagData();
  const { refFiles, refTexts } = await collectRefTexts();

  const { months, rows, tagTotals } = buildHeatmapGrid(kns, raw);
  const coldSpots = buildColdSpots(tagTotals, bugs);
  const zeroRef = buildZeroRef(kns, raw, expandKnRefs(refTexts.join('\n')), nowMs);

  const result = {
    generatedAt: new Date(nowMs).toISOString(),
    generatedBy: 'auto-learn.mjs stats --heatmap',
    policy: { cold: 'bugCount − knCount ≥ 1', freshDays: HEATMAP_FRESH_DAYS, refScope: ['.agent/bugs', '.agent/plans'], bucket: 'YYYY-MM' },
    counts: { knTotal: kns.length, bugTotal: bugs.length, tags: rows.length, months, coldSpots: coldSpots.length, zeroRef: zeroRef.length, refFiles: refFiles.length },
    grid: { months, rows },
    coldSpots,
    zeroRef,
  };

  if (outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  if (asJson || outPath) { console.log(JSON.stringify(result, null, 2)); return; }
  printHeatmapHuman({ kns, bugs, rows, months, refFiles, coldSpots, zeroRef });
}

// ---------- Guard coverage (KN-056): KN nào có lưới chống tái lập ----------
// Lưới = file test (spec/test) tham chiếu KN-XXX trong nội dung, HOẶC dòng "- **Guard:** <path>" trong KN detail.
async function collectGuardMap(kns) {
  const map = new Map(); // KN-XXX -> Set(relPath)
  const add = (id, file) => { if (!map.has(id)) map.set(id, new Set()); map.get(id).add(file); };
  const files = [];
  for (const d of GUARD_SCAN_DIRS) await walkRefFiles(path.join(ROOT, d), files, (n) => GUARD_FILE_RE.test(n));
  for (const f of files) {
    let text = '';
    try { text = await fs.readFile(f, 'utf8'); } catch { continue; }
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    for (const m of text.matchAll(/KN-\d{3}/g)) add(m[0], rel);
  }
  for (const kn of kns) {
    const gm = kn.detail.match(/\*\*Guard:\*\*\s*([^\n]+)/);
    if (!gm) continue;
    for (const m of gm[1].matchAll(/[\w./-]+\.(?:spec|test)\.(?:ts|js|mjs|cs)/g)) {
      if (existsSync(path.join(ROOT, m[0]))) add(kn.id, m[0]);
    }
  }
  return map;
}

function printGuardsHuman(guards, result) {
  const { counts, priority } = result;
  console.log(`🔒 GUARD COVERAGE — ${counts.total} KN · có lưới: ${counts.withGuard} · chưa: ${counts.withoutGuard} · ưu tiên (major/critical): ${counts.priority}`);
  for (const [id, files] of Object.entries(guards)) console.log(`   ✅ ${id} → ${files.join(', ')}`);
  if (priority.length) {
    const head = priority.slice(0, 12).map((m) => m.id).join(', ');
    console.log(`   ⚠️ Ưu tiên viết lưới: ${head}${priority.length > 12 ? ` …(+${priority.length - 12})` : ''}`);
  }
  console.log(`   → Thêm lưới: viết test khoá bug trong tests/e2e/*.spec.ts + nhắc KN-XXX trong comment, hoặc thêm '- **Guard:** <path>' vào KN detail.`);
}

async function guardsAudit(opts = {}) {
  const { kns } = await parseKNs(KNOWLEGED);
  const map = await collectGuardMap(kns);
  const guards = {};
  const missing = [];
  for (const kn of kns) {
    const files = map.get(kn.id) ? [...map.get(kn.id)] : [];
    if (files.length) guards[kn.id] = files;
    else missing.push({ id: kn.id, title: kn.title, severity: kn.severity });
  }
  const isPri = (m) => m.severity === 'major' || m.severity === 'critical';
  const ordered = [...missing.filter(isPri), ...missing.filter((m) => !isPri(m))];
  const result = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'auto-learn.mjs guards',
    policy: { scanDirs: GUARD_SCAN_DIRS, detection: 'KN-XXX trong test file HOẶC "- **Guard:** <path>" trong KN', required: 'major/critical' },
    counts: { total: kns.length, withGuard: kns.length - missing.length, withoutGuard: missing.length, priority: ordered.filter(isPri).length },
    guards,
    missing: ordered,
    priority: ordered.filter(isPri),
  };
  if (opts.out) {
    const outPath = path.resolve(ROOT, opts.out);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  }
  if (opts.json || opts.out) { console.log(JSON.stringify(result, null, 2)); return; }
  printGuardsHuman(guards, result);
}

async function listBugSlugs(dir = BUGS_DIR) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes:true });
    return entries.filter(e=>e.isDirectory() && e.name !== '_template').map(e=>e.name);
  } catch { return []; }
}

async function countOpenDrafts(bugs) {
  let drafts = 0;
  for (const b of bugs) {
    try {
      const t = await fs.readFile(path.join(BUGS_DIR, b, 'bug.md'), 'utf8');
      const isOpen = t.includes('Status:** `open`') || t.includes('Status: `open`') || t.includes('**Status:** open') || /-\s*\*\*Status:\*\*\s*open/i.test(t);
      if (isOpen) drafts++;
    } catch {}
  }
  return drafts;
}

async function readLastUpdated() {
  try {
    const raw = await fs.readFile(KNOWLEGED, 'utf8');
    const m = raw.match(/UpdatedAt:\s*([^\n]+)/);
    if (m) return m[1].trim();
  } catch {}
  return '';
}

function computeTopTags(kns) {
  const tagCount = {};
  for (const k of kns) for (const t of k.tags) tagCount[t]=(tagCount[t]||0)+1;
  return Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

async function countReefLite() {
  let recordsCount = 0, reportsCount = 0, versionsCount = 0;
  try { const e = await fs.readdir(RECORDS_DIR, { withFileTypes:true }); recordsCount = e.filter(x=>x.isFile() && x.name.endsWith('.json')).length; } catch {}
  try { if (existsSync(REPORTS_FILE)) { const t=(await fs.readFile(REPORTS_FILE,'utf8')).trim(); reportsCount = t ? t.split('\n').filter(Boolean).length : 0; } } catch {}
  try { const e = await fs.readdir(VERSIONS_DIR, { withFileTypes:true }); versionsCount = e.filter(x=>x.isFile() && x.name.endsWith('.json')).length; } catch {}
  return { records: recordsCount, reports: reportsCount, versions: versionsCount };
}

function printStatusCommands() {
  console.log(`\n💡 Lệnh:`);
  console.log(`   suggest "từ khóa"  → gợi ý KN liên quan`);
  console.log(`   log --error "msg" --file "path" --title "tên" → tạo bug draft`);
  console.log(`   propose --bug <slug> → sinh KN draft`);
  console.log(`   record --prompt "mô tả" [--scenario name] → ghi interaction (Serve)`);
  console.log(`   report --score 0..1 --feedback "ok" --references <id> → ghi feedback (Observe)`);
  console.log(`   evaluate --bug <slug> → kiểm tra trước khi commit (Grow gate)`);
  console.log(`   commit --bug <slug> → evaluate PASS mới ghi knowleged.md + snapshot (Commit)`);
  console.log(`   history / versions → xem loop Serve→Commit`);
  console.log(`   watchdog [--apply] → Hawking: draft ≥30d escalate · ≥90d evaporate (note + Status, giữ lịch sử)`);
  console.log(`   watchdog --apply --sign "<tên người>" → mutation BẮT BUỘC human sign-off (agent tự ký = refused, exit 2)`);
}

function printStatusHuman({ kns, bugs, drafts, lastUpdated, topTags, reefLite }) {
  console.log(`📊 Auto-Learn Status — ${new Date().toISOString()}`);
  console.log(`   KN: ${kns.length} bài học trong docs/knowleged.md ${lastUpdated ? `(UpdatedAt: ${lastUpdated})` : ''}`);
  if (kns.length) console.log(`      → ${kns.map(k=>k.id).join(', ')}`);
  if (topTags.length) console.log(`      top tags: ${topTags.map(([t,c])=>`${t}(${c})`).join(', ')}`);
  console.log(`   Bugs: ${bugs.length} trong .agent/bugs/ (${drafts} drafts auto-log)`);
  if (bugs.length) console.log(`      → ${bugs.slice(0,5).join(', ')}${bugs.length>5?' ...':''}`);
  console.log(`   Reef-lite: records=${reefLite.records} reports=${reefLite.reports} versions=${reefLite.versions} (.agent/records/ + reports.jsonl + versions/)`);
  console.log(`   Health: ${kns.length>=5 ? '✅' : '⚠️'} ${kns.length>=5 ? 'đủ bài học' : 'cần thêm KN'} | ${drafts>0 ? `⚠️ ${drafts} draft chưa propose` : '✅ không có draft tồn'}`);
  printStatusCommands();
}

async function status(json=false) {
  const { kns } = await parseKNs(KNOWLEGED);
  const bugs = await listBugSlugs();
  const drafts = await countOpenDrafts(bugs);
  const lastUpdated = await readLastUpdated();
  const topTags = computeTopTags(kns);
  const reefLite = await countReefLite();
  const out = { knTotal: kns.length, bugsTotal: bugs.length, drafts, lastUpdated, topTags, bugs: bugs.slice(0,10), kns: kns.map(k=>({id:k.id, title:k.title, tags:k.tags, severity:k.severity})), reefLite };
  if (json) { console.log(JSON.stringify(out, null, 2)); return; }
  printStatusHuman({ kns, bugs, drafts, lastUpdated, topTags, reefLite });
}

// ---------- CLI ----------
function parseSuggestArgs(rest) {
  const opts = {};
  // handle --json, --top
  const qParts = [];
  for (let i=0;i<rest.length;i++) {
    if (rest[i]==='--json') opts.json=true;
    else if (rest[i]==='--top' || rest[i]==='--top_k') { opts.top = parseInt(rest[i+1],10); i++; }
    else if (rest[i].startsWith('--')) {}
    else qParts.push(rest[i]);
  }
  return { opts, query: qParts.join(' ').replace(/^["']|["']$/g,'') };
}

function parseGenericArgs(args) {
  // generic --key value
  const opts = {};
  for (let i=1;i<args.length;i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : 'true';
      if (v!=='true') i++;
      opts[k]=v;
      if (k==='json') opts.json=true;
    }
  }
  return opts;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  if (cmd === 'suggest') {
    // suggest "query with spaces" or suggest word1 word2
    const { opts, query } = parseSuggestArgs(args.slice(1));
    return { cmd, query, opts };
  }
  return { cmd, query: '', opts: parseGenericArgs(args) };
}

function printHelp() {
  console.log(`Auto-Learn — hệ thống tự học hỏi tự động (reef-lite + Engram-lite)

Usage:
  node .github/harness/scripts/auto-learn.mjs suggest "từ khóa" [--top 3] [--json]  (alias: search)
  node .github/harness/scripts/auto-learn.mjs log --error "msg" --file "path" --title "tên" [--slug slug] [--dir dir] [--dry-run] [--no-scan]  (tự RADAR tái lập)
  node .github/harness/scripts/auto-learn.mjs propose --bug <slug> [--json] [--dir dir] [--strict]  (alias: get --bug <slug>)  (GUARD GATE: major/critical thiếu Guard → --strict exit 1)
  node .github/harness/scripts/auto-learn.mjs guards [--json] [--out <file>]  (Guard coverage — KN nào có lưới chống tái lập)
  node .github/harness/scripts/auto-learn.mjs attest --kn KN-003 --result pass|fail [--score 0..1] [--note "..."]  (Engram-lite Wilson)
  node .github/harness/scripts/auto-learn.mjs status [--json]
  node .github/harness/scripts/auto-learn.mjs stats --heatmap [--json] [--out <file>] [--now ISO]  (CMB anisotropy — grid tag×tháng · điểm lạnh · KN 0 tham chiếu)
  node .github/harness/scripts/auto-learn.mjs watchdog [--json] [--out <file>] [--dir <bugsDir>] [--now ISO] [--apply --sign "<tên người>"]  (Hawking — nợ bay hơi)
  # Reef-lite (Serve → Observe → Grow → Commit):
  node .github/harness/scripts/auto-learn.mjs record --prompt "mô tả" [--scenario name] [--response "..."] [--json]
  node .github/harness/scripts/auto-learn.mjs report --score 0..1 --feedback "ok" --references <id> [--bug <slug>] [--scenario name] [--json]
  node .github/harness/scripts/auto-learn.mjs evaluate --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs commit --bug <slug> [--json]
  node .github/harness/scripts/auto-learn.mjs history [--json]
  node .github/harness/scripts/auto-learn.mjs versions [--json]

Examples:
  node .github/harness/scripts/auto-learn.mjs suggest "rainbow border không xoay"
  node .github/harness/scripts/auto-learn.mjs log --error "RZ9986 Techniques Blazor" --file "N5Blazor/Components/Pages/Home.razor" --title "mất dấu tiếng Việt"
  node .github/harness/scripts/auto-learn.mjs propose --bug 2026-08-30-mat-dau-tieng-viet
  node .github/harness/scripts/auto-learn.mjs record --prompt "sửa border xoay" --scenario fix-rainbow
  node .github/harness/scripts/auto-learn.mjs report --bug 2026-08-30-xyz --score 1 --feedback "pass"
  node .github/harness/scripts/auto-learn.mjs evaluate --bug 2026-08-30-xyz
  node .github/harness/scripts/auto-learn.mjs commit --bug 2026-08-30-xyz
  node .github/harness/scripts/auto-learn.mjs history

Flow tự động:
  1. Trước khi code → suggest "mô tả task" để xem KN liên quan
  2. Khi lỗi → log --error "..." để tạo bug draft (tự RADAR: đối chiếu KN + bug cũ — nghi tái lập là cảnh báo)
  3. Sau khi fix → propose --bug <slug> để sinh KN draft dán vào knowleged.md (GUARD GATE: major/critical phải có lưới)
  3b. Tái lập thật → nâng lưới (Guard) TRƯỚC, fix SAU; kiểm coverage: guards
  Reef-lite:
  4. Serve: record --prompt "..." → .agent/records/rec-xxx.json (x-reef-agent-record-id)
  5. Observe: report --score 1 --references rec-xxx → .agent/reports.jsonl
  6. Grow: evaluate --bug <slug> → gate (trùng? có fix? reports?)
  7. Commit: commit --bug <slug> → snapshot + append knowleged.md (chỉ khi PASS)
`);
    return;
}

// guard clauses — message + exit codes verbatim từ bản cũ
function requireSuggestQuery(query) {
  if (!query) { console.error('❌ Thiếu query. Ví dụ: suggest "rainbow border"'); process.exit(1); }
}

function requireGetBug(opts, query) {
  const bug = opts.bug || opts.slug || query;
  if (!bug) { console.error('❌ Thiếu --bug <slug>. Ví dụ: get --bug 2026-08-30-xyz'); process.exit(1); }
  return bug;
}

// handler map — thay chuỗi if/else 14 nhánh (Map: cmd lạ luôn miss, không dính prototype key)
function makeHandlers(opts, json) {
  return new Map(Object.entries({
    log: () => logBug(opts),
    propose: () => propose(opts.bug || opts.slug, json, opts),
    guards: () => guardsAudit(opts),
    attest: () => attest(opts, json),
    status: () => status(json),
    watchdog: () => watchdog(opts),
    stats: () => statsHeatmap(opts),
    record: () => recordInteraction(opts, json),
    report: () => reportFeedback(opts, json),
    evaluate: () => evaluateCandidate(opts.bug || opts.slug, json),
    commit: () => commitCandidate(opts.bug || opts.slug, json),
    history: () => showHistory(json),
    versions: () => listVersions(json),
  }));
}

async function dispatch(cmd, query, opts) {
  const json = !!opts.json;
  if (cmd === 'suggest' || cmd === 'search') {
    requireSuggestQuery(query);
    return suggest(query, opts.top || 3, json);
  }
  if (cmd === 'get') return propose(requireGetBug(opts, query), json, opts);
  if (cmd === 'stats' && !opts.heatmap) {
    console.error('❌ stats cần --heatmap (view duy nhất hiện có). Ví dụ: stats --heatmap --json --out www/cosmos/heatmap.json');
    process.exit(1);
  }
  const handler = makeHandlers(opts, json).get(cmd);
  if (!handler) { console.error(`❌ Lệnh không biết: ${cmd}. Gõ --help để xem.`); process.exit(1); }
  return handler();
}

async function main() {
  const { cmd, query, opts } = parseArgs(process.argv);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { printHelp(); return; }
  try {
    await dispatch(cmd, query, opts);
  } catch (e) {
    console.error(`❌ Lỗi: ${e.message}`);
    if (process.env.DEBUG) console.error(e.stack);
    process.exit(1);
  }
}

main();
