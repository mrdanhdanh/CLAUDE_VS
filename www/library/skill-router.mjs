/**
 * Skill Router — DisCo Phase 2 (arXiv:2609.02749v1 §3.3/§4.2)
 * Researcher mode: search_skills → top-k (progressive disclosure) → get_skill mở đúng skill.
 * Node-only (fs), 0 deps. Reuse tokenize từ rag-loop.mjs.
 * Exports: listSkills, getSkill, searchSkills, SKILLS_DIR, SKILLS_DIRS
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from './rag-loop.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// www/library -> repo root
const ROOT = path.resolve(__dirname, '..', '..');
export const SKILLS_DIR = path.join(ROOT, '.agent', 'skills');
// Phase 3 (task-agnostic): library dùng chung — .github/skills chứa skill distilled + harness skills
export const SKILLS_DIRS = [SKILLS_DIR, path.join(ROOT, '.github', 'skills')];

// ---------- helpers ----------
function parseFrontmatter(txt) {
  const m = String(txt || '').match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return { name: '', description: '' };
  const fm = m[1];
  const nameM = fm.match(/^name:\s*(.+)$/m);
  const descM = fm.match(/^description:\s*"?(.+?)"?\s*$/m);
  return {
    name: nameM ? nameM[1].trim() : '',
    description: descM ? descM[1].trim() : '',
  };
}

function readSkillDir(slug, baseDir = SKILLS_DIR) {
  const dir = path.join(baseDir, slug);
  const skillPath = path.join(dir, 'SKILL.md');
  const recPath = path.join(dir, 'record.json');
  const evPath = path.join(dir, 'references', 'evidence.md');
  if (!fs.existsSync(skillPath)) return null;
  let skillMd = '';
  try { skillMd = fs.readFileSync(skillPath, 'utf8'); } catch { return null; }
  let record = null;
  try { record = JSON.parse(fs.readFileSync(recPath, 'utf8')); } catch { record = null; }
  let evidence = null;
  try { evidence = fs.readFileSync(evPath, 'utf8'); } catch { evidence = null; }
  const { name, description } = parseFrontmatter(skillMd);
  return {
    slug,
    name: name || slug,
    description,
    capabilities: Array.isArray(record?.capabilities) ? record.capabilities : [],
    gaps: Array.isArray(record?.gaps) ? record.gaps : [],
    verdict: record?.verdict || 'unknown',
    generatedAt: record?.generatedAt || null,
    record,
    skillMd,
    evidence,
    path: path.relative(ROOT, dir),
  };
}

// ---------- listSkills ----------
export function listSkills() {
  const seen = new Set();
  const skills = [];
  for (const base of SKILLS_DIRS) {
    let entries = [];
    try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { entries = []; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      if (seen.has(e.name)) continue; // .agent/skills ưu tiên (task-oriented trước)
      const s = readSkillDir(e.name, base);
      if (s) { seen.add(e.name); skills.push(s); }
    }
  }
  skills.sort((a, b) => String(b.generatedAt || '').localeCompare(String(a.generatedAt || '')));
  return skills;
}

// ---------- getSkill ----------
export function getSkill(slug, { include_content = false } = {}) {
  const key = String(slug || '').trim();
  let s = null;
  for (const base of SKILLS_DIRS) {
    s = readSkillDir(key, base);
    if (s) break;
  }
  if (!s) {
    const all = listSkills().map(x => x.slug);
    throw new Error(`Không tìm thấy skill "${slug}". Dùng list_skills để xem: ${all.join(', ') || '(thư viện rỗng)'}`);
  }
  const out = {
    slug: s.slug,
    name: s.name,
    description: s.description,
    capabilities: s.capabilities,
    gaps: s.gaps,
    verdict: s.verdict,
    generatedAt: s.generatedAt,
    path: s.path,
    record: s.record,
  };
  if (include_content) {
    out.skillMd = s.skillMd;
    out.evidence = s.evidence;
  }
  return out;
}

// ---------- searchSkills (BM25-lite, progressive disclosure) ----------
function buildSkillDocs() {
  return listSkills().map(s => {
    const body = s.skillMd.replace(/^---[\s\S]*?---/, ''); // bỏ frontmatter, giữ body
    const nameTok = tokenize(s.name);
    const descTok = tokenize(s.description);
    const capTok = tokenize(s.capabilities.join(' '));
    const bodyTok = tokenize(body);
    const tf = {};
    const add = (toks, w) => toks.forEach(t => { tf[t] = (tf[t] || 0) + w; });
    add(nameTok, 2);
    add(descTok, 1.5);
    add(capTok, 1.5);
    add(bodyTok, 1);
    return { ...s, tf, len: nameTok.length + descTok.length + capTok.length + bodyTok.length };
  });
}

export function searchSkills(query, { top_k = 5 } = {}) {
  const qTokens = tokenize(String(query || ''));
  if (!qTokens.length) return { query, hits: [], total: 0, hint: 'Query rỗng — dùng list_skills để xem toàn bộ.' };
  const docs = buildSkillDocs();
  if (!docs.length) {
    return { query, hits: [], total: 0, hint: 'Thư viện skill rỗng — chạy auto-researcher.mjs --task "..." --distill (task-oriented) hoặc distill-agnostic.mjs (task-agnostic từ knowleged.md) để sinh skill.' };
  }
  const scored = docs.map(d => {
    let score = 0;
    for (const t of qTokens) {
      const tf = d.tf[t] || 0;
      if (!tf) continue;
      // BM25-lite: idf x tf-saturation (k=1.2), bỏ avgdl normalization (docs ngắn, đồng đều)
      const df = docs.filter(x => x.tf[t]).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2);
    }
    return { doc: d, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(20, top_k)))
    .map(({ doc, score }) => ({
      slug: doc.slug,
      name: doc.name,
      description: doc.description,
      capabilities: doc.capabilities,
      verdict: doc.verdict,
      gaps: doc.gaps,
      generatedAt: doc.generatedAt,
      path: doc.path,
      score: Number(score.toFixed(3)),
    }));
  return { query, hits: scored, total: docs.length };
}

export default { listSkills, getSkill, searchSkills, SKILLS_DIR, SKILLS_DIRS };
