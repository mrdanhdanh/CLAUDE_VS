#!/usr/bin/env node
/**
 * distill-agnostic.mjs — DisCo Phase 3 (arXiv:2609.02749v1 §3.2, task-agnostic form)
 * Chưng cất docs/knowleged.md (KN entries) + .agent/bugs/ thành skill library dùng chung
 * tại .github/skills/harness-<theme>/ — harness-manager tự đăng ký qua scanFs bootstrap.
 *
 * Node 18+, 0 deps. Idempotent — chạy lại sau khi thêm KN mới.
 * CLI:
 *   node .github/harness/scripts/distill-agnostic.mjs [--dry] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const KNOWLEDGE_PATH = path.join(ROOT, 'docs', 'knowleged.md');
const BUGS_DIR = path.join(ROOT, '.agent', 'bugs');
const OUT_DIR = path.join(ROOT, '.github', 'skills');
const PAPER = 'DisCo arXiv:2609.02749v1 §3.2 (task-agnostic)';

// ---------- theme rules (priority order, first match wins) ----------
const THEMES = [
  { id: 'governance', title: 'Governance & Verifier Integrity', match: ['governance', 'tdd', 'safety', 'reward-hacking'] },
  { id: 'minimal', title: 'Minimal Code & YAGNI', match: ['minimal', 'ponytail', 'yagni'] },
  { id: 'build-config', title: 'Build & Config', match: ['build', 'config', 'dotnet', 'api'] },
  { id: 'process', title: 'Process & Self-Improvement', match: ['process', 'knowledge', 'automation', 'benchmark', 'aar', 'quality', 'dx', 'self-improving'] },
  { id: 'web-ui', title: 'Web UI & UX', match: ['ui', 'css', 'a11y', 'animation', 'theme', 'state', 'i18n', 'contrast', 'spacing', 'button', 'responsive', 'ux', 'perf', 'data'] },
];

// ---------- parse knowleged.md ----------
function parseKnowleged(md) {
  const warnings = [];
  // Summary table: | KN-002 | date | bug | root | lesson | tags |
  const lessons = {};
  for (const line of String(md || '').split(/\r?\n/)) {
    if (!/^\|\s*KN-\d+\s*\|/.test(line)) continue;
    const cols = line.split('|').map(s => s.trim());
    if (cols.length < 7) continue;
    lessons[cols[1]] = cols[5]; // col 5 = "Bài học (1 câu)"
  }
  // Detail sections: ### KN-XXX — Title ... until next ### or ---
  const sections = String(md || '').split(/^### /m).slice(1);
  const entries = [];
  for (const sec of sections) {
    const head = sec.match(/^(KN-\d+)\s*[—–-]\s*(.+)$/m);
    if (!head) continue;
    const id = head[1];
    const title = head[2].trim();
    const grab = (label) => {
      const m = sec.match(new RegExp(`-\\s*\\*\\*${label}:\\*\\*\\s*(.+)`, 'm'));
      return m ? m[1].trim() : '';
    };
    const severity = (grab('Severity').match(/critical|major|minor/) || ['minor'])[0];
    const bugM = grab('Bug report').match(/`([^`]+)`/);
    const bugReport = bugM ? bugM[1] : '';
    const tagsLine = grab('Tags');
    const tags = (tagsLine.match(/`([^`]+)`/g) || []).map(t => t.replace(/`/g, '').trim()).filter(Boolean);
    // Cách phòng tránh bullets: các dòng "  - ..." sau label, đến khi gặp label khác
    const avoid = [];
    const avoidIdx = sec.indexOf('**Cách phòng tránh:**');
    if (avoidIdx !== -1) {
      const tail = sec.slice(avoidIdx);
      const stop = tail.search(/\n-\s*\*\*(Tags|Người ghi):\*\*/);
      const block = stop === -1 ? tail : tail.slice(0, stop);
      for (const l of block.split(/\r?\n/)) {
        const m = l.match(/^\s+-\s+(.+)/);
        if (m) avoid.push(m[1].trim());
      }
    }
    if (!tags.length) warnings.push(`${id}: không parse được tags → fallback theme web-ui`);
    entries.push({ id, title, severity, bugReport, tags, avoid, lesson: lessons[id] || '' });
  }
  return { entries, warnings };
}

// ---------- parse .agent/bugs/ ----------
function parseBugs() {
  let dirs = [];
  try { dirs = fs.readdirSync(BUGS_DIR, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_') && e.name !== 'README.md').map(e => e.name); } catch {}
  return dirs.map(name => {
    let title = name;
    try {
      const txt = fs.readFileSync(path.join(BUGS_DIR, name, 'bug.md'), 'utf8');
      const h = txt.match(/^#\s+(.+)$/m);
      if (h) title = h[1].trim();
    } catch {}
    return { slug: name, title, path: `.agent/bugs/${name}/bug.md` };
  });
}

// ---------- group by theme ----------
function themeOf(entry) {
  for (const t of THEMES) {
    if (entry.tags.some(tag => t.match.includes(tag))) return t.id;
  }
  return 'web-ui'; // fallback
}

function groupEntries(entries) {
  const groups = {};
  for (const t of THEMES) groups[t.id] = [];
  for (const e of entries) groups[themeOf(e)].push(e);
  return groups;
}

// ---------- anti-patterns (lọc theo KN của theme) ----------
function antiPatternsFor(md, knIds) {
  const idx = md.indexOf('## Anti-patterns tích lũy');
  if (idx === -1) return [];
  const block = md.slice(idx, md.indexOf('## ', idx + 10));
  return block.split(/\r?\n/).filter(l => l.trim().startsWith('- ❌') && knIds.some(id => l.includes(id))).map(l => l.trim());
}

// ---------- generators ----------
function buildDescription(theme, entries) {
  const ids = entries.map(e => e.id).join(', ');
  const kw = [...new Set(entries.flatMap(e => e.tags))].slice(0, 10).join(', ');
  return `Task-agnostic lessons "${theme.title}" chưng cất từ docs/knowleged.md (${entries.length} KN: ${ids}) + .agent/bugs/. Use when task chạm ${kw} — áp Cách phòng tránh trước khi code, tránh lặp bug cũ. DisCo-lite, regenerate bằng distill-agnostic.mjs.`;
}

function buildSkillMd(theme, entries, anti) {
  const lessons = entries.map(e => {
    const avoid = e.avoid.length ? e.avoid.map(a => `  - ${a}`).join('\n') : '  - (xem evidence.md)';
    return `### ${e.id} — ${e.title} (${e.severity})\n- **Bài học:** ${e.lesson || 'xem evidence.md'}\n- **Bug report:** ${e.bugReport || '—'}\n- **Cách phòng tránh:**\n${avoid}`;
  }).join('\n\n');
  const antiBlock = anti.length ? anti.map(a => `- ${a}`).join('\n') : '- (chưa có anti-pattern ghi KN cho theme này)';
  return `---
name: harness-${theme.id}
description: "${buildDescription(theme, entries).replace(/"/g, "'")}"
user-invocable: false
---

# Harness ${theme.title} — Bài học task-agnostic (DisCo-lite)

> Chưng cất từ \`docs/knowleged.md\` + \`.agent/bugs/\` — **KHÔNG sửa tay**, regenerate bằng \`node .github/harness/scripts/distill-agnostic.mjs\`. Nguồn: ${PAPER}.

## When to Use

- Task chạm theme **${theme.title}** (tags: ${[...new Set(entries.flatMap(e => e.tags))].join(', ')})
- Trước khi code/fix — áp **Cách phòng tránh** ngay để không lặp bug cũ
- Review/plan — check anti-patterns bên dưới

## Bài học (${entries.length} KN)

${lessons}

## Anti-patterns (đừng lặp lại)

${antiBlock}

## Nguồn

- \`docs/knowleged.md\` — ${entries.map(e => e.id).join(', ')}
- Chi tiết đầy đủ: \`references/evidence.md\` (progressive disclosure)
- Regenerate: \`node .github/harness/scripts/distill-agnostic.mjs\`
`;
}

function buildEvidence(theme, entries, bugs) {
  const related = bugs.filter(b => entries.some(e => e.bugReport && b.path && e.bugReport.includes(b.slug)));
  const details = entries.map(e => {
    const raw = e._raw || '';
    return raw ? raw.trim() : `### ${e.id} — ${e.title}\n(Chi tiết không parse được — xem docs/knowleged.md)`;
  }).join('\n\n---\n\n');
  return `# Evidence — harness-${theme.id} (${PAPER})

> Substrate layer của skill — full text từ docs/knowleged.md. Sinh tự động ${new Date().toISOString()}.

## Bug reports liên quan (${related.length}/${bugs.length} bugs)

${related.length ? related.map(b => `- \`${b.path}\` — ${b.title}`).join('\n') : '- (không bug nào khớp slug — KN có thể ghi trực tiếp)'}

## Full KN details

${details}
`;
}

function buildRecord(theme, entries, checks, verdict) {
  return {
    task: `task-agnostic: ${theme.id}`,
    form: 'task-agnostic',
    anchor: {
      knowleged: entries.map(e => e.id),
      bugs: entries.map(e => e.bugReport).filter(Boolean),
    },
    capabilities: [...new Set(entries.flatMap(e => e.tags))],
    evidence: entries.map(e => e.bugReport).filter(Boolean),
    checks,
    gaps: [],
    verdict,
    generatedAt: new Date().toISOString(),
    paper: PAPER,
  };
}

// ---------- self-verify (4 checks như Phase 1) ----------
function verifySkill(dir, theme, entries, { skipRecord = false } = {}) {
  const checks = [];
  const skillPath = path.join(dir, 'SKILL.md');
  const evPath = path.join(dir, 'references', 'evidence.md');
  const recPath = path.join(dir, 'record.json');
  checks.push({ id: 'files-exist', pass: fs.existsSync(skillPath) && fs.existsSync(evPath) && (skipRecord || fs.existsSync(recPath)) });
  let fmOk = false;
  try {
    const txt = fs.readFileSync(skillPath, 'utf8');
    fmOk = /^name:\s*harness-/m.test(txt) && /^description:\s*".+"/m.test(txt);
  } catch {}
  checks.push({ id: 'frontmatter', pass: fmOk });
  let recOk = false;
  try {
    const rec = JSON.parse(fs.readFileSync(recPath, 'utf8'));
    recOk = Array.isArray(rec.anchor?.knowleged) && rec.anchor.knowleged.length > 0 && Array.isArray(rec.capabilities) && rec.capabilities.length > 0;
  } catch {}
  checks.push({ id: 'record-complete', pass: recOk });
  let noMutate = true;
  try {
    const txt = fs.readFileSync(skillPath, 'utf8').toLowerCase();
    noMutate = !/có thể sửa test|edit the test to pass|modify tests to pass/.test(txt);
  } catch {}
  checks.push({ id: 'no-test-mutate-advice', pass: noMutate });
  const verdict = checks.every(c => c.pass) ? 'G-accepted' : 'G~-candidate-needs-review';
  return { checks, verdict };
}

// ---------- main ----------
function distill({ dry = false } = {}) {
  const md = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
  const { entries, warnings } = parseKnowleged(md);
  // giữ raw section cho evidence.md
  const sections = md.split(/^### /m).slice(1);
  for (const e of entries) {
    const raw = sections.find(s => s.startsWith(e.id));
    e._raw = raw ? '### ' + raw.split(/\n---/)[0].split(/\n## /)[0] : '';
  }
  const bugs = parseBugs();
  const groups = groupEntries(entries);

  const results = [];
  for (const theme of THEMES) {
    const list = groups[theme.id];
    if (!list.length) continue;
    const dir = path.join(OUT_DIR, `harness-${theme.id}`);
    const anti = antiPatternsFor(md, list.map(e => e.id));
    const skillMd = buildSkillMd(theme, list, anti);
    const evidence = buildEvidence(theme, list, bugs);
    if (!dry) {
      fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), skillMd, 'utf8');
      fs.writeFileSync(path.join(dir, 'references', 'evidence.md'), evidence, 'utf8');
      // record.json phải tồn tại trước khi verify đủ 4 checks — ghi tạm bằng pre-checks (3, bỏ record)
      const pre = verifySkill(dir, theme, list, { skipRecord: true });
      fs.writeFileSync(path.join(dir, 'record.json'), JSON.stringify(buildRecord(theme, list, pre.checks, pre.verdict), null, 2) + '\n', 'utf8');
    }
    const { checks, verdict } = dry
      ? { checks: [{ id: 'dry-run', pass: true }], verdict: 'dry-run' }
      : verifySkill(dir, theme, list);
    if (!dry) fs.writeFileSync(path.join(dir, 'record.json'), JSON.stringify(buildRecord(theme, list, checks, verdict), null, 2) + '\n', 'utf8');
    results.push({ slug: `harness-${theme.id}`, dir: path.relative(ROOT, dir), kns: list.map(e => e.id), verdict, checks });
  }
  return { entries: entries.length, bugs: bugs.length, warnings, results };
}

// ---------- CLI ----------
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const json = args.includes('--json');
try {
  const out = distill({ dry });
  if (json) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`🧪 distill-agnostic — ${PAPER}`);
    console.log(`   Nguồn: docs/knowleged.md (${out.entries} KN) + .agent/bugs/ (${out.bugs} bugs)`);
    for (const w of out.warnings) console.log(`   ⚠️  ${w}`);
    for (const r of out.results) {
      const pass = r.checks.filter(c => c.pass).length;
      console.log(`   ${r.verdict === 'G-accepted' ? '✅' : '⚠️ '} ${r.slug} — ${r.kns.join(', ')} → ${r.dir} [${pass}/${r.checks.length} checks, ${r.verdict}]`);
    }
    console.log(`\n📌 Đăng ký: harness-manager tự bootstrap qua scanFs — chạy "node .github/harness/scripts/harness-manager.mjs status" để xác nhận.`);
    if (dry) console.log('   (dry-run — chưa ghi file, bỏ --dry để ghi)');
  }
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
