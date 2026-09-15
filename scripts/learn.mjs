#!/usr/bin/env node
/**
 * learn.mjs — Thời khóa biểu + tracker tiến độ cho curriculum
 * "AI Engineering from Scratch" (rohitg00/ai-engineering-from-scratch)
 * 20 phases · 521 bài thực tế (repo tự ghi 523 — đã đối chiếu ROADMAP + thư mục
 * trên đĩa GitHub ngày 2026-09-15: P10 thiếu số 23–24, P19 thiếu 18–19, đã retire) · MIT
 *
 * 0 deps · Node 18+ (cần global fetch cho lệnh sync) · Windows-safe
 *
 * Usage: node scripts/learn.mjs <command> [args]
 *   sync                Tải ROADMAP.md mới nhất → docs/learning-path/curriculum.json (fail-closed)
 *   render              Sinh docs/learning-path/timetable.md từ curriculum + progress
 *   done <id|next> [n]  Ghi nhận đã học: "14.1" | "14" (cả phase) | "next" | "next 3"
 *   undo <id>           Bỏ ghi nhận: "14.1" | "14"
 *   next [n]            Xem n bài kế tiếp (không ghi nhận)
 *   status              Tiến độ tổng + từng phase + ETA
 *   pace <hours>        Đặt nhịp học giờ/tuần (mặc định 10)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'docs', 'learning-path');
const CURRICULUM = path.join(DIR, 'curriculum.json');
const PROGRESS = path.join(DIR, 'progress.json');
const TIMETABLE = path.join(DIR, 'timetable.md');

const SOURCES = [
  'https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/ROADMAP.md',
  'https://cdn.jsdelivr.net/gh/rohitg00/ai-engineering-from-scratch@main/ROADMAP.md',
];
const SOURCE_REPO = 'https://github.com/rohitg00/ai-engineering-from-scratch';
// 521 = số bài thực trên đĩa (2026-09-15). Repo tự ghi 523 nhưng ROADMAP + dirs khớp 521.
const EXPECTED_LESSONS = 521;
const LEP_DOWN_NOTE = `> \u2139\uFE0F Repo tự ghi **523 bài**; đối chiếu ROADMAP + danh sách thư mục trên đĩa GitHub (15/09/2026) \u2192 **${EXPECTED_LESSONS} bài thực tế** (P10 không có số 23\u201324, P19 không có 18\u201319 \u2014 \u0111\u00e3 retire). Số liệu file này tính từ bản thực tế.`;

/* ---------------- io helpers ---------------- */

const today = () => new Date().toISOString().slice(0, 10);

function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}
function writeText(p, s) {
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, s, 'utf8');
}
function writeJson(p, o) { writeText(p, JSON.stringify(o, null, 2) + '\n'); }
function fail(msg) { console.error('\u2716 ' + msg); process.exit(1); }

/* ---------------- load + normalize ---------------- */

function loadCurriculum() {
  const raw = readJson(CURRICULUM);
  if (!raw || !Array.isArray(raw.phases) || !raw.phases.length) {
    fail('Chưa có curriculum.json — chạy trước: node scripts/learn.mjs sync');
  }
  const phases = raw.phases.map((ph) => ({
    num: ph.num,
    name: ph.name,
    hoursStated: ph.hoursStated ?? null,
    lessons: (ph.lessons || []).map((l) => Array.isArray(l)
      ? { num: l[0], title: l[1], minutes: l[2] ?? null }
      : { num: l.num, title: l.title, minutes: l.minutes ?? null }),
  }));
  return { ...raw, phases };
}

function loadProgress() {
  let p = readJson(PROGRESS);
  if (!p || typeof p !== 'object') p = {};
  const fresh = !p.startedAt;
  p.version = p.version || 1;
  p.startedAt = p.startedAt || today();
  p.updatedAt = p.updatedAt || today();
  p.paceHoursPerWeek = Number(p.paceHoursPerWeek) > 0 ? Number(p.paceHoursPerWeek) : 10;
  if (!p.done || typeof p.done !== 'object') p.done = {};
  if (fresh) writeJson(PROGRESS, p);
  return p;
}

/* ---------------- stats ---------------- */

function flatten(c) {
  const out = [];
  for (const ph of c.phases) {
    for (const l of ph.lessons) {
      out.push({
        id: `${ph.num}.${l.num}`, num: l.num, title: l.title,
        minutes: l.minutes, phase: ph.num, phaseName: ph.name,
      });
    }
  }
  return out;
}

function stats(c, p) {
  const flat = flatten(c);
  const doneIds = new Set(Object.keys(p.done || {}));
  let doneCount = 0, doneMin = 0, totalMin = 0, capMin = 0, coreMin = 0;
  for (const l of flat) {
    const m = l.minutes || 0;
    totalMin += m;
    if (l.phase === 19) capMin += m; else coreMin += m;
    if (doneIds.has(l.id)) { doneCount++; doneMin += m; }
  }
  return { flat, doneIds, doneCount, doneMin, totalMin, coreMin, capMin, total: flat.length };
}

/* ---------------- sync ---------------- */

function stripMd(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRoadmap(md) {
  const phases = [];
  const seen = new Set();
  let cur = null;
  for (const line of md.split(/\r?\n/)) {
    const head = line.match(/^##\s+Phase\s+(\d+)\s*:\s*(.*)$/);
    if (head) {
      const nameRaw = head[2];
      const stripped = nameRaw.match(/^(.*?)\s*[\u2014\u2013-]\s*(?:\u2705|\u{1F6A7}|\u2B1A).*$/u);
      const name = (stripped ? stripped[1] : nameRaw).trim();
      const hrs = (line.match(/\(~(\d+(?:\.\d+)?)\s*hours?\)/i) || [])[1];
      cur = { num: +head[1], name, hoursStated: hrs ? +hrs : null, lessons: [] };
      phases.push(cur);
      continue;
    }
    if (!cur || !line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((s) => s.trim());
    if (cells.length < 5) continue;
    if (!/^\d{1,2}$/.test(cells[1])) continue;
    const title = stripMd(cells[2]);
    if (!title || /^[-\u2013\u2014]+$/.test(title) || /^(lesson|project)$/i.test(title)) continue;
    let minutes = null;
    for (const cell of cells.slice(3)) {
      let m = cell.match(/~\s*(\d+(?:\.\d+)?)\s*min/i);
      if (m) { minutes = Math.round(+m[1]); break; }
      m = cell.match(/~\s*(\d+(?:\.\d+)?)\s*(?:hr|hour)/i);
      if (m) { minutes = Math.round(+m[1] * 60); break; }
    }
    if (minutes == null) continue;
    const num = +cells[1];
    const key = `${cur.num}.${num}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cur.lessons.push({ num, title, minutes });
  }
  return phases;
}

function serializeCurriculum(c) {
  const out = [];
  out.push('{');
  out.push(`  "source": ${JSON.stringify(c.source)},`);
  out.push(`  "sourceRepo": ${JSON.stringify(c.sourceRepo)},`);
  out.push(`  "syncedAt": ${JSON.stringify(c.syncedAt)},`);
  out.push(`  "totalLessons": ${c.totalLessons},`);
  out.push(`  "totalMinutes": ${c.totalMinutes},`);
  out.push('  "phases": [');
  c.phases.forEach((ph, pi) => {
    const lastPhase = pi === c.phases.length - 1;
    out.push(`    { "num": ${ph.num}, "name": ${JSON.stringify(ph.name)}, "hoursStated": ${ph.hoursStated == null ? 'null' : ph.hoursStated}, "lessons": [`);
    ph.lessons.forEach((l, li) => {
      const tail = li === ph.lessons.length - 1 ? '' : ',';
      out.push(`      [${l.num}, ${JSON.stringify(l.title)}, ${l.minutes == null ? 'null' : l.minutes}]${tail}`);
    });
    out.push(`    ] }${lastPhase ? '' : ','}`);
  });
  out.push('  ]');
  out.push('}');
  return out.join('\n') + '\n';
}

async function download() {
  if (typeof fetch !== 'function') fail('Cần Node 18+ (global fetch). Kiểm tra: node -v');
  let lastErr = null;
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'harness-learn/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes('## Phase') && text.length > 10000) return { text, url };
      throw new Error('nội dung bất thường');
    } catch (e) { lastErr = e; }
  }
  fail(`Không tải được ROADMAP (${lastErr ? lastErr.message : 'unknown'}). Giữ nguyên curriculum.json cũ.`);
}

async function cmdSync() {
  console.log('\u23F3 Tải ROADMAP.md...');
  const { text, url } = await download();
  const phases = parseRoadmap(text);
  const total = phases.reduce((s, ph) => s + ph.lessons.length, 0);
  const empty = phases.filter((ph) => !ph.lessons.length).map((ph) => ph.num);
  console.log(`\u{1F4E6} Parse: ${phases.length} phases · ${total} bài${empty.length ? ` · \u26A0 phase trống: ${empty.join(',')}` : ''}`);
  if (phases.length < 20 || total < 500 || empty.length) {
    fail(`Parse nghi vấn — kỳ vọng 20 phases/~${EXPECTED_LESSONS} bài. KHÔNG ghi đè curriculum.json.`);
  }
  const totalMinutes = phases.reduce((s, ph) => s + ph.lessons.reduce((a, l) => a + (l.minutes || 0), 0), 0);
  const c = { source: url, sourceRepo: SOURCE_REPO, syncedAt: today(), totalLessons: total, totalMinutes, phases };
  writeText(CURRICULUM, serializeCurriculum(c));
  console.log(`\u2714 curriculum.json — ${total} bài · ~${Math.round(totalMinutes / 60)}h`);
  if (total !== EXPECTED_LESSONS) console.log(`\u26A0 Lệch kỳ vọng ${EXPECTED_LESSONS} bài — repo có thể đã cập nhật, kiểm tra nguồn.`);
}

/* ---------------- render ---------------- */

function fmtMin(m) { return m == null ? '' : (m < 120 ? `${m}\u2032` : `${Math.round(m / 60)}h`); }
function fmtDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}` : '';
}
function bar(ratio, width = 10) {
  const f = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return '\u2588'.repeat(f) + '\u2591'.repeat(width - f);
}

function renderTimetable(c, p) {
  const s = stats(c, p);
  const pace = p.paceHoursPerWeek;
  const pct = s.total ? (s.doneCount / s.total) * 100 : 0;
  const pctTxt = pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
  const remMin = Math.max(0, s.totalMin - s.doneMin);
  const weeksLeft = pace > 0 ? Math.ceil(remMin / 60 / pace) : '-';
  const L = [];

  L.push('# \u{1F393} Thời khóa biểu — AI Engineering from Scratch');
  L.push('');
  L.push(`> **${s.total} bài · ${c.phases.length} phases · ~${Math.round(s.totalMin / 60)} giờ** · nguồn: [rohitg00/ai-engineering-from-scratch](${SOURCE_REPO}) (MIT) · snapshot ${c.syncedAt}`);
  L.push(`> **Tiến độ: ${s.doneCount}/${s.total} (${pctTxt}%)** · ${(s.doneMin / 60).toFixed(1)}h/${Math.round(s.totalMin / 60)}h đã học · còn ~${Math.round(remMin / 60)}h \u2248 **${weeksLeft} tuần** @ ${pace}h/tuần`);
  L.push('');

  L.push('## \u26A1 Cách ghi nhận — "gọi là học"');
  L.push('');
  L.push('| Sếp gõ (chat với YUNIE) | Việc xảy ra |');
  L.push('|---|---|');
  L.push('| `học 3.2` | Ghi nhận đã học bài Phase 3 · bài 02 (kèm ngày) |');
  L.push('| `học tiếp` · `học tiếp 3` | Ghi nhận 1 / 3 bài kế tiếp trong lộ trình |');
  L.push('| `học 3` | Ghi nhận cả Phase 3 |');
  L.push('| `học + giảng 14.1` | YUNIE giảng tóm tắt bài (từ docs/en.md của repo) rồi ghi nhận |');
  L.push('| `học gì tiếp?` · `trạng thái học` · `học lại 3.2` | Xem bài kế tiếp / tiến độ / bỏ ghi nhận |');
  L.push('');
  L.push('> CLI tương đương: `node scripts/learn.mjs done 3.2` · `done next 3` · `status` · `undo 3.2` · `pace 12`');
  L.push('> \u26A0 File này render tự động từ `curriculum.json` + `progress.json` — đừng sửa tay (`node scripts/learn.mjs render`).');
  L.push('');

  L.push('## \u{1F5D3} Nhịp độ gợi ý');
  L.push('');
  L.push(`| Nhịp | Core (Phase 0\u201318, ~${Math.round(s.coreMin / 60)}h) | Capstone (Phase 19, ~${Math.round(s.capMin / 60)}h — chọn lọc) |`);
  L.push('|---|---|---|');
  for (const w of [5, 10, 15, 20]) {
    L.push(`| ${w}h/tuần | ~${Math.ceil(s.coreMin / 60 / w)} tuần (~${Math.round(s.coreMin / 60 / w / 4.33)} tháng) | ~${Math.ceil(s.capMin / 60 / w)} tuần |`);
  }
  L.push('');

  L.push(`## \u{1F4CA} Tổng quan ${c.phases.length} phases`);
  L.push('');
  L.push(`| # | Phase | Bài | Giờ | @${pace}h/tuần | Tiến độ |`);
  L.push('|---|---|---|---|---|---|');
  for (const ph of c.phases) {
    const phMin = ph.lessons.reduce((a, l) => a + (l.minutes || 0), 0);
    const done = ph.lessons.filter((l) => s.doneIds.has(`${ph.num}.${l.num}`)).length;
    const ratio = ph.lessons.length ? done / ph.lessons.length : 0;
    L.push(`| ${ph.num} | ${ph.name} | ${ph.lessons.length} | ~${Math.round(phMin / 60)}h | ~${(phMin / 60 / pace).toFixed(1)} tuần | ${bar(ratio)} ${done}/${ph.lessons.length} |`);
  }
  L.push('');

  for (const ph of c.phases) {
    const phMin = ph.lessons.reduce((a, l) => a + (l.minutes || 0), 0);
    const done = ph.lessons.filter((l) => s.doneIds.has(`${ph.num}.${l.num}`)).length;
    L.push(`## Phase ${ph.num} — ${ph.name}`);
    L.push('');
    const bits = [
      `${ph.lessons.length} bài`,
      `~${Math.round(phMin / 60)}h`,
      `~${(phMin / 60 / pace).toFixed(1)} tuần @${pace}h/tuần`,
      `tiến độ ${done}/${ph.lessons.length}`,
    ];
    if (ph.num === 19) bits.push('chọn dự án theo mục tiêu — không cần tuần tự');
    L.push('`' + bits.join(' · ') + '`');
    L.push('');
    for (const l of ph.lessons) {
      const id = `${ph.num}.${l.num}`;
      const isDone = s.doneIds.has(id);
      const meta = [l.minutes ? fmtMin(l.minutes) : null, isDone ? `\u2705 ${fmtDate(p.done[id])}` : null].filter(Boolean).join(' · ');
      L.push(`- [${isDone ? 'x' : ' '}] **${id}** ${l.title}${meta ? ' · ' + meta : ''}`);
    }
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push(LEP_DOWN_NOTE);
  L.push('');

  writeText(TIMETABLE, L.join('\n'));
  console.log(`\u2714 timetable.md — ${s.doneCount}/${s.total} bài (${pctTxt}%)`);
  return s;
}

/* ---------------- commands ---------------- */

function nextUndone(s, p, n) {
  return s.flat.filter((l) => !(l.id in p.done)).slice(0, n || 1);
}

function resolveTargets(s, c, p, arg, count) {
  if (!arg || arg === 'next') return nextUndone(s, p, count || 1);
  const m = String(arg).match(/^(\d+)(?:\.(\d+))?$/);
  if (!m) fail(`Không hiểu "${arg}" — dùng: 14.1 | 14 | next [n]`);
  const phNum = +m[1];
  const ph = c.phases.find((x) => x.num === phNum);
  if (!ph) fail(`Không có phase ${phNum} (0\u201319)`);
  let targets;
  if (m[2] == null) {
    targets = ph.lessons.map((l) => ({ id: `${phNum}.${l.num}`, num: l.num, title: l.title, minutes: l.minutes, phase: phNum, phaseName: ph.name }));
  } else {
    const les = ph.lessons.find((l) => l.num === +m[2]);
    if (!les) fail(`Không có bài ${arg} trong Phase ${phNum}`);
    targets = [{ id: `${phNum}.${les.num}`, num: les.num, title: les.title, minutes: les.minutes, phase: phNum, phaseName: ph.name }];
  }
  return targets.filter((t) => !(t.id in p.done));
}

function cmdDone(args) {
  const c = loadCurriculum();
  const p = loadProgress();
  const targets = resolveTargets(stats(c, p), c, p, args[0], args[1] ? +args[1] : 1);
  if (!targets.length) { console.log('\u{1F389} Không còn bài nào chưa học!'); return; }
  const stamp = today();
  for (const t of targets) p.done[t.id] = stamp;
  p.updatedAt = stamp;
  writeJson(PROGRESS, p);
  for (const t of targets) console.log(`\u2714 ${t.id} ${t.title}  (P${t.phase} ${t.phaseName})`);
  const s = renderTimetable(c, p);
  console.log(`\u{1F4CA} ${s.doneCount}/${s.total} (${((s.doneCount / s.total) * 100).toFixed(1)}%)`);
  const nx = nextUndone(stats(c, p), p, 1)[0];
  if (nx) console.log(`\u{1F449} Kế tiếp: ${nx.id} ${nx.title} — xong thì gõ "học tiếp"`);
  else console.log('\u{1F389} Hoàn thành toàn bộ lộ trình!');
}

function cmdUndo(args) {
  if (!args[0]) fail('Thiếu id — dùng: undo 14.1 | undo 14');
  const c = loadCurriculum();
  const p = loadProgress();
  const m = String(args[0]).match(/^(\d+)(?:\.(\d+))?$/);
  if (!m) fail(`Không hiểu "${args[0]}"`);
  const phNum = +m[1];
  const ph = c.phases.find((x) => x.num === phNum);
  if (!ph) fail(`Không có phase ${phNum}`);
  const ids = m[2] == null ? ph.lessons.map((l) => `${phNum}.${l.num}`) : [`${phNum}.${m[2]}`];
  let removed = 0;
  for (const id of ids) if (id in p.done) { delete p.done[id]; removed++; }
  if (!removed) { console.log('\u2139 Không có gì để bỏ (chưa ghi nhận).'); return; }
  p.updatedAt = today();
  writeJson(PROGRESS, p);
  console.log(`\u21A9 Đã bỏ ghi nhận ${removed} bài`);
  renderTimetable(c, p);
}

function cmdNext(args) {
  const c = loadCurriculum();
  const p = loadProgress();
  const s = stats(c, p);
  const n = args[0] ? +args[0] : 5;
  const nx = nextUndone(s, p, n);
  if (!nx.length) { console.log('\u{1F389} Hết lộ trình!'); return; }
  console.log(`\u{1F4DA} ${nx.length} bài kế tiếp (còn lại ${s.total - s.doneCount} bài):`);
  for (const t of nx) console.log(`  \u2022 ${t.id} ${t.title} · ${fmtMin(t.minutes) || '-'} · P${t.phase} ${t.phaseName}`);
}

function cmdStatus() {
  const c = loadCurriculum();
  const p = loadProgress();
  const s = stats(c, p);
  const pct = s.total ? (s.doneCount / s.total) * 100 : 0;
  const remH = Math.round((s.totalMin - s.doneMin) / 60);
  console.log(`\u{1F4CA} Tiến độ: ${s.doneCount}/${s.total} (${pct.toFixed(1)}%) · ${(s.doneMin / 60).toFixed(1)}h/${Math.round(s.totalMin / 60)}h · còn ~${remH}h \u2248 ${Math.ceil(remH / p.paceHoursPerWeek)} tuần @${p.paceHoursPerWeek}h/tuần`);
  console.log('');
  for (const ph of c.phases) {
    const done = ph.lessons.filter((l) => `${ph.num}.${l.num}` in p.done).length;
    const ratio = ph.lessons.length ? done / ph.lessons.length : 0;
    const label = `P${String(ph.num).padStart(2, ' ')} ${ph.name}`.slice(0, 36).padEnd(36);
    console.log(`${label} ${bar(ratio)} ${done}/${ph.lessons.length}`);
  }
  const nx = nextUndone(s, p, 1)[0];
  console.log('');
  if (nx) console.log(`\u{1F449} Kế tiếp: ${nx.id} ${nx.title} (P${nx.phase} ${nx.phaseName})`);
  else console.log('\u{1F389} Hoàn thành toàn bộ!');
}

function cmdPace(args) {
  const h = Number(args[0]);
  if (!(h > 0)) fail('Dùng: pace <giờ mỗi tuần> — ví dụ: pace 12');
  const c = loadCurriculum();
  const p = loadProgress();
  p.paceHoursPerWeek = h;
  p.updatedAt = today();
  writeJson(PROGRESS, p);
  console.log(`\u2714 Nhịp mới: ${h}h/tuần`);
  renderTimetable(c, p);
}

function cmdRender() {
  const c = loadCurriculum();
  const p = loadProgress();
  renderTimetable(c, p);
}

/* ---------------- main ---------------- */

const HELP = `\u{1F4D8} learn.mjs — Thời khóa biểu "AI Engineering from Scratch" (20 phases · 521 bài)

Usage: node scripts/learn.mjs <command> [args]

  sync                Tải ROADMAP.md mới nhất → curriculum.json (fail-closed nếu parse nghi vấn)
  render              Sinh lại timetable.md từ curriculum + progress
  done <id|next> [n]  Ghi nhận đã học: "14.1" · "14" (cả phase) · "next" · "next 3"
  undo <id>           Bỏ ghi nhận: "14.1" · "14"
  next [n]            Xem n bài kế tiếp (không ghi nhận)
  status              Tiến độ tổng + từng phase
  pace <hours>        Nhịp học giờ/tuần (mặc định 10)

Ví dụ:
  node scripts/learn.mjs done next      # học bài kế tiếp
  node scripts/learn.mjs done 14.1      # học Phase 14 · bài 01
  node scripts/learn.mjs status`;

const [cmd, ...args] = process.argv.slice(2);
const table = {
  sync: cmdSync,
  render: cmdRender,
  done: cmdDone,
  undo: cmdUndo,
  next: cmdNext,
  status: cmdStatus,
  pace: cmdPace,
  help: () => console.log(HELP),
};

if (!cmd) { console.log(HELP); process.exit(0); }
if (!table[cmd]) { console.log(HELP); fail(`Không có lệnh "${cmd}"`); }
await table[cmd](args);
