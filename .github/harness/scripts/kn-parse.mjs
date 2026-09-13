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
