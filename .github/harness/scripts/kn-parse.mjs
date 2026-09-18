#!/usr/bin/env node
/**
 * kn-parse.mjs — KN parsing + scoring, shared bởi auto-learn.mjs ↔ auto-researcher.mjs
 * Trước đây 2 file duplicate ~150 dòng (đã từng drift: tokenize từng được copy tay).
 * Tách ra 1 nguồn duy nhất — chống drift + qua Slop Gate cross-file (KN-047).
 * 0 dependency ngoài node builtins. Behavior giữ nguyên 100% (pairwise verified: 30/30 + 7/7).
 */
import fs from 'node:fs/promises';

// ---------- tokenize ----------
export function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const tokens = lower.match(/[a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/gi) || [];
  const stop = new Set([
    'va','và','la','là','cua','của','cho','voi','với','trong','mot','một','cac','các','nhung','nhưng','de','để','co','có','khong','không','da','đã','bi','bị','thi','thì','ma','mà','ve','về','tu','từ','den','đến','khi','neu','nếu','se','sẽ','duoc','được','nay','này','do','đó','voi','với','the','and','or','a','an','is','are','to','of','in','on','for','with','as','by','at','be','this','that','it','from','are','was','were','has','have','had','will','would','can','could','should','may','might','must','been','being','also','just','only','very','more','most','some','any','all','each','few','many','other','such','no','nor','not','but','if','then','than','so','too','very'
  ]);
  return tokens.filter(t => t.length > 1 && !stop.has(t));
}

const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function computeIDF(queryTokens, kns) {
  const N = kns.length || 1;
  const idf = {};
  for (const qt of queryTokens) {
    const qtNorm = stripDiacritics(qt);
    let df = 0;
    for (const kn of kns) {
      const has = kn.tokens.some(t => t===qt || t.includes(qt) || qt.includes(t) || stripDiacritics(t)===qtNorm);
      if (has) df++;
    }
    idf[qt] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

// ---------- parse knowleged.md ----------
export function parseKnTags(block) {
  const tagsLineM = block.match(/Tags:\s*([^\n]+)/);
  if (!tagsLineM) return [];
  const raw = tagsLineM[1];
  const bt = [...raw.matchAll(/`([^`]+)`/g)].map(x => x[1].trim());
  if (bt.length) return bt;
  return raw.split(/[\s,]+/).filter(Boolean).map(t => t.replace(/`/g,'').trim()).filter(Boolean);
}

export function parseKnBlock(part) {
  const firstNL = part.indexOf('\n');
  const firstLine = firstNL >= 0 ? part.slice(0, firstNL) : part;
  const m = firstLine.match(/KN-(\d+)\s*[—\-–]\s*(.+)/);
  if (!m) return null;
  if (m[1] === 'XXX' || /Tiêu đề ngắn gọn/.test(m[2])) return null;
  const title = m[2].trim();
  if (title.includes('Tiêu đề')) return null;
  const block = firstNL >= 0 ? part.slice(firstNL + 1) : '';
  const tags = parseKnTags(block);
  // bold format: "- **Severity:** major" — [^\w]* bỏ qua `**`/backtick giữa colon và value (bug 0/55 major 2026-09-13)
  const sevM = block.match(/Severity:[^\w]*(\w+)/i);
  const dateM = block.match(/Ngày:[^\d]*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  const lessonM = block.match(/Bài học[^:]*:\s*([^\n]+)/);
  const lesson = lessonM ? lessonM[1].trim().slice(0,200) : title.slice(0,120);
  const detail = block.slice(0, 2500);
  return {
    id: `KN-${m[1].padStart(3,'0')}`,
    title, tags, lesson, detail,
    severity: sevM ? sevM[1].toLowerCase() : 'minor',
    date: dateM ? dateM[1] : '',
    tokens: tokenize(`${title} ${tags.join(' ')} ${lesson} ${detail}`),
    titleTokens: tokenize(title),
    tagTokens: tokenize(tags.join(' ')),
    block: block.slice(0,600),
  };
}

export function parseKnTableFallback(text) {
  const kns = [];
  const tableRe = /\|\s*(KN-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|([^|]+)\|/g;
  let tm;
  while ((tm = tableRe.exec(text)) !== null) {
    const id = tm[1].trim();
    if (id === 'KN-001' && tm[2].includes('Ví dụ')) continue;
    const lesson = tm[2].trim();
    kns.push({ id, title: lesson.slice(0,60), tags: [], lesson, detail: lesson, severity:'minor', date:'', tokens: tokenize(lesson), titleTokens: tokenize(lesson), tagTokens: [], block: lesson });
  }
  return kns;
}

export async function parseKNs(knowlegedPath) {
  let text = '';
  try { text = await fs.readFile(knowlegedPath, 'utf8'); } catch (e) { return { kns: [], raw: '', error: e.message }; }
  text = text.replace(/\r\n/g, '\n');
  const parts = text.split(/^###\s*KN-/m);
  const kns = [];
  for (let i = 1; i < parts.length; i++) {
    const kn = parseKnBlock('KN-' + parts[i]);
    if (kn) kns.push(kn);
  }
  return { kns: kns.length ? kns : parseKnTableFallback(text), raw: text };
}

// ---------- integrity (KN-066) ----------
// Dup/orphan/order giữa Bảng tóm tắt (`| KN-XXX |`) vs Chi tiết (`### KN-XXX —`).
// Chống double-yield ID đa phiên (14/09: 3 phiên cùng nhận 1 ID, 2 phiên cùng yield).
// Dùng CHUNG bởi `auto-learn.mjs status` (idIntegrity) + guard `tests/e2e/kn-id-integrity.spec.ts`.
const KN_ROW_RE = /^\|\s*(KN-\d{3})\s*\|/gm;
const KN_DET_RE = /^###\s+(KN-\d{3})\b/gm;

function collectKnIds(text, re) {
  return [...text.matchAll(re)].map((m) => m[1]);
}

function knDupIssues(list, label) {
  const issues = [];
  const count = new Map();
  for (const id of list) count.set(id, (count.get(id) || 0) + 1);
  for (const [id, n] of count) if (n > 1) issues.push(`${label}: trùng ${id} ×${n}`);
  return issues;
}

// ---------- next ID allocation (KN-066: chống double-yield khi draft chưa paste) ----------
// Draft bug.md có thể giữ "Related KN: `KN-XXX`" TRƯỚC khi paste; không tính claim này vào max →
// propose yield trùng (near-miss 18/09: draft 16/09 giữ KN-068 → propose 18/09 cũng ra KN-068).
// excludeSlug: bỏ qua claim của CHÍNH bug đang propose — giữ idempotent (regenerate draft không tự đẩy số lên).
export function computeNextKnId(existingIds = [], claimedIds = []) {
  let maxId = 0;
  for (const id of [...existingIds, ...claimedIds]) {
    const n = parseInt(String(id).replace(/^KN-/, ''), 10);
    if (Number.isFinite(n) && n > maxId) maxId = n;
  }
  return `KN-${String(maxId + 1).padStart(3, '0')}`;
}

export async function collectClaimedKnIds(bugsDir, excludeSlug = null) {
  const claimed = [];
  let entries;
  try { entries = await fs.readdir(bugsDir, { withFileTypes: true }); } catch { return claimed; }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith('_') || e.name === excludeSlug) continue;
    try {
      const text = await fs.readFile(`${bugsDir}/${e.name}/bug.md`, 'utf8');
      const m = text.match(/Related KN:\*\*[^\n]*?(KN-\d{3})/);
      if (m) claimed.push(m[1]);
    } catch {}
  }
  return claimed;
}

function knOrphanIssues(list, other, label, otherLabel) {
  const has = new Set(other);
  return list.filter((id) => !has.has(id)).map((id) => `${label} có ${id}, ${otherLabel} thiếu`);
}

function knOrderIssues(list, label) {
  const num = (x) => parseInt(x.slice(3), 10);
  const issues = [];
  for (let i = 1; i < list.length; i++) {
    if (num(list[i]) < num(list[i - 1])) issues.push(`${label} sai thứ tự: ${list[i - 1]} → ${list[i]}`);
  }
  return issues;
}

/** checkKnIntegrity: [] = sạch — dup (2 danh sách) + orphan row↔detail + order (gap OK). */
export function checkKnIntegrity(text) {
  const rows = collectKnIds(text, KN_ROW_RE);
  const det = collectKnIds(text, KN_DET_RE);
  return [
    ...knDupIssues(rows, 'bảng tóm tắt'),
    ...knDupIssues(det, 'chi tiết'),
    ...knOrphanIssues(rows, det, 'bảng', 'chi tiết'),
    ...knOrphanIssues(det, rows, 'chi tiết', 'bảng'),
    ...knOrderIssues(rows, 'bảng tóm tắt'),
    ...knOrderIssues(det, 'chi tiết'),
  ];
}

// ---------- scoring ----------
export function countTokenMatches(tokens, qt) {
  return tokens.filter(t => t === qt || t.includes(qt) || qt.includes(t)).length;
}

export function scoreToken(kn, qt, w) {
  let s = (countTokenMatches(kn.titleTokens, qt) * 1.5 + countTokenMatches(kn.tagTokens, qt) * 2.0 + countTokenMatches(kn.tokens, qt) * 0.5) * w;
  const qtNorm = stripDiacritics(qt);
  if (qtNorm !== qt) {
    const cNorm = kn.tokens.filter(t => stripDiacritics(t) === qtNorm).length;
    s += cNorm * 0.8 * w;
  }
  return s;
}

export function scoreKN(queryTokens, queryRaw, kn, idf) {
  let score = 0;
  const qLower = queryRaw.toLowerCase();
  if (kn.title.toLowerCase().includes(qLower)) score += 3;
  if (kn.detail.toLowerCase().includes(qLower)) score += 1;
  for (const qt of queryTokens) {
    const w = idf ? (idf[qt] || 1) : 1;
    score += scoreToken(kn, qt, w);
  }
  return Math.round(score * 10) / 10;
}
