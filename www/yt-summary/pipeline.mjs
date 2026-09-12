/**
 * YT Summary — pipeline.mjs (v1)
 * Module THUẦN (0 dep, không đụng DOM/node API) — dùng chung cho:
 *   • scripts/yt-summary/build.mjs (node CLI + CI)
 *   • www/yt-summary/app.js (browser lane: paste .vtt → xử lý tại chỗ)
 *
 * Luồng: parseSubtitles → cleanCues → buildSentences → segmentSentences → summarizeSegments
 *        → (build.mjs/app.js gắn translation) → buildDoc
 *
 * Triết lý: EXTRACTIVE (không LLM) — giá trị thật nằm ở LƯỢC BỎ thầm lặng,
 * không phải "viết lại văn". UI phải nói thật điều này.
 */

export const PIPELINE_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────
// Tiện ích
// ─────────────────────────────────────────────────────────────

export function formatTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return (h ? h + ':' : '') + mm + ':' + String(ss).padStart(2, '0');
}

export function extractVideoId(input) {
  if (!input) return null;
  const s = String(input).trim();
  let m;
  if ((m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/))) return m[1];
  if (/^[A-Za-z0-9_-]{6,20}$/.test(s)) return s; // raw id
  return null;
}

function titleCase(s) {
  return String(s || '').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

// ─────────────────────────────────────────────────────────────
// Bước 1 — PARSE phụ đề (VTT / SRT / JSON3)
// ─────────────────────────────────────────────────────────────

function tsToSec(ts) {
  // 00:01:02.345 | 00:01:02,345 | 01:02.345 | 62.3
  const m = String(ts).trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  if (m) return (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4].padEnd(3, '0')) / 1000;
  const n = parseFloat(ts);
  return isNaN(n) ? 0 : n;
}

/** Bỏ mọi thẻ thời gian/format của YouTube auto-caption (<00:00:01.000>, <c>, </c>, <v Name>) */
function stripVttInline(s) {
  return String(s).replace(/<\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}>/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export function parseVtt(text) {
  const cues = [];
  const kind = /^Kind:\s*captions/mi.test(text) ? 'auto' : 'manual';
  const blocks = String(text).replace(/\r\n/g, '\n').split('\n\n');
  for (const b of blocks) {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const ti = lines.findIndex(l => l.includes('-->'));
    if (ti === -1) continue;
    const [a, bb] = lines[ti].split('-->');
    const start = tsToSec(a), end = tsToSec((bb || '').trim().split(/\s+/)[0]);
    const raw = lines.slice(ti + 1).join(' ').trim();
    if (raw) cues.push({ start, end: Math.max(end, start), text: stripVttInline(raw) });
  }
  return { cues, kind, format: 'vtt' };
}

export function parseSrt(text) {
  const cues = [];
  const blocks = String(text).replace(/\r\n/g, '\n').split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    const ti = lines.findIndex(l => l.includes('-->'));
    if (ti === -1) continue;
    const [a, bb] = lines[ti].split('-->');
    const start = tsToSec(a), end = tsToSec((bb || '').trim().split(/\s+/)[0]);
    const raw = stripVttInline(lines.slice(ti + 1).join(' ').trim());
    if (raw) cues.push({ start, end: Math.max(end, start), text: raw });
  }
  return { cues, kind: 'manual', format: 'srt' };
}

export function parseJson3(data) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  const cues = [];
  for (const ev of (obj.events || [])) {
    if (!ev.segs) continue;
    const text = ev.segs.map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim();
    if (text) cues.push({ start: (ev.tStartMs || 0) / 1000, end: ((ev.tStartMs || 0) + (ev.dDurationMs || 0)) / 1000, text });
  }
  return { cues, kind: 'auto', format: 'json3' };
}

/** Auto-detect + parse. `name` chỉ để log. */
export function parseSubtitles(text, name = '') {
  const t = String(text || '');
  if (/^\s*WEBVTT/m.test(t)) return parseVtt(t);
  if (/^\s*\{/.test(t)) { try { return parseJson3(t); } catch { /* fallthrough */ } }
  if (/\d{1,2}:\d{2}:\d{2},\d{3}\s*-->/.test(t)) return parseSrt(t);
  if (t.includes('-->')) return parseVtt(t);
  throw new Error('Không nhận dạng được định dạng phụ đề (.vtt/.srt/.json3) cho ' + (name || 'input'));
}

// ─────────────────────────────────────────────────────────────
// Bước 2 — CLEAN: lược bỏ thầm lặng ([Music], rolling dup, boilerplate, filler)
// ─────────────────────────────────────────────────────────────

const ANNOTATION_RE = /^[\[(♪].*[\])♪]$|^\s*♪+\s*$/;           // [Music] (Applause) ♪
const INLINE_ANNOTATION_RE = /\[(?:music|applause|laughter|âm nhạc|vỗ tay)\]/gi;
const FILLER_RE = /\b(u+h+m?|u+m+|e+r+m?|h+m+)\b[,.]?\s*/gi;      // chỉ interjection đứng riêng
const BOILERPLATE_RES = [
  /like and subscribe/i, /hit the bell/i, /(smash|ring) that/i, /thanks? for watching/i,
  /link in the (description|comments)/i, /subscri(be|bing) (to|now)/i, /(this|today'?s) video is sponsored/i,
  /sponsored by/i, /use (my |the )?(code|link)/i, /(promo|discount) code/i, /support (the|my) channel/i,
  /patreon\.com/i, /\bwelcome back to (my|the) channel\b/i, /(don'?t forget to )?subscribe/i,
  /see you (in|next|soon)/i, /(that'?s|that is|that.s) (all|it) (for today|for now|guys)/i,
  /helps? the channel/i, /great deal/i, /check it out and/i, /back to the video/i,
  /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b[^.!?]{0,40}[.!?]?\s*$/i, // greeting thuần
  /\bwelcome back\b/i, /\bwithout further ado\b/i, /\blet'?s (get|dive) (started|in|into (it|this))\b/i,
  /\bin this video,? (we|i|you)\b/i,
];
const SPONSOR_HINT_RE = /sponsor|promo code|discount code|use code|patreon|support the channel|great deal/i;
const SPONSOR_END_RE = /back to (the )?(video|content|show|topic)/i;

function stripBrackets(t) {
  return t.replace(INLINE_ANNOTATION_RE, ' ').replace(/\((?:music|applause|laughter)\)/gi, ' ').replace(/♪/g, ' ');
}

function stripBoilerplateCue(text) {
  // câu chứa boilerplate → bỏ cả câu, giữ phần còn lại của cue
  const sentences = text.split(/(?<=[.!?…])\s+/);
  const kept = sentences.filter(s => !BOILERPLATE_RES.some(re => re.test(s)));
  return { text: kept.join(' ').trim(), removedAny: kept.length !== sentences.length };
}

export function cleanCues(rawCues, opts = {}) {
  const aggressive = opts.aggressive !== false; // auto-caption → merge rolling mạnh hơn
  const dropped = [];
  const out = [];
  const tok = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').split(/\s+/).filter(Boolean);
  let sponsorUntil = 0; // vùng quảng cáo đang bị lược (sponsor-region detection)

  for (const c of rawCues) {
    let t = stripVttInline(stripBrackets(String(c.text || ''))).replace(/\s+/g, ' ').trim();
    t = t.replace(/^>>\s*/, '').replace(/\s*>>\s*/g, ' '); // speaker markers
    if (!t || ANNOTATION_RE.test(t.trim())) { dropped.push({ start: c.start, end: c.end, reason: /(music|applause|laughter|♪)/i.test(t) ? 'music' : 'empty' }); continue; }

    // ── vùng quảng cáo: từ marker sponsor → return marker (cap 90s để không lược quá tay) ──
    if (SPONSOR_HINT_RE.test(t)) {
      const ended = SPONSOR_END_RE.test(t);
      if (!ended) sponsorUntil = c.end + 90;
      dropped.push({ start: c.start, end: c.end, reason: 'sponsor' });
      if (ended) sponsorUntil = 0;
      continue;
    }
    if (c.start < sponsorUntil) {
      if (SPONSOR_END_RE.test(t)) sponsorUntil = 0;
      dropped.push({ start: c.start, end: c.end, reason: 'sponsor' });
      continue;
    }

    const bp = stripBoilerplateCue(t); t = bp.text;
    if (!t) { dropped.push({ start: c.start, end: c.end, reason: 'boilerplate' }); continue; }
    t = t.replace(FILLER_RE, ' ').replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
    if (!t) { dropped.push({ start: c.start, end: c.end, reason: 'filler' }); continue; }

    // merge rolling duplicate với cue trước (YouTube auto-caption)
    if (out.length) {
      const prev = out[out.length - 1];
      const p = tok(prev.text), n = tok(t);
      let k = 0;
      while (k < Math.min(p.length, n.length) && p[p.length - k - 1] === n[k]) k++; // suffix(prev) == prefix(new)
      const isDup = t.toLowerCase() === prev.text.toLowerCase() || prev.text.toLowerCase().includes(t.toLowerCase());
      const isGrow = t.toLowerCase().startsWith(prev.text.toLowerCase()) || (aggressive && k >= 2 && k < n.length);
      if (isDup) { prev.end = Math.max(prev.end, c.end); dropped.push({ start: c.start, end: c.end, reason: 'dup' }); continue; }
      if (isGrow) {
        const merged = t.toLowerCase().startsWith(prev.text.toLowerCase()) ? t : prev.text + ' ' + n.slice(k).join(' ');
        prev.text = merged; prev.end = Math.max(prev.end, c.end);
        dropped.push({ start: c.start, end: c.end, reason: 'dup' }); continue;
      }
    }
    out.push({ start: c.start, end: Math.max(c.end, c.start), text: t });
  }

  // ghép cue ngắn liền kề chưa kết câu
  const merged = [];
  for (const c of out) {
    const prev = merged[merged.length - 1];
    if (prev && !/[.!?…]$/.test(prev.text) && (c.start - prev.end) < 1.2 && prev.text.length + c.text.length < 220) {
      prev.text = (prev.text + ' ' + c.text).replace(/\s+/g, ' '); prev.end = c.end;
    } else merged.push({ ...c });
  }

  const stats = { cuesRaw: rawCues.length, cuesClean: merged.length, droppedCues: dropped.length };
  return { cues: merged, dropped, stats };
}

// ─────────────────────────────────────────────────────────────
// Bước 3 — SENTENCES + SEGMENT (topic-shift bằng TF-IDF cosine)
// ─────────────────────────────────────────────────────────────

const TOPIC_PATTERNS = [
  /\b(?:talk about|talking about|discuss(?:ing)?|dive into|move to|moving to|focus on|look at|think about|let'?s (?:start with|do)|what (?:is|are) (?:a|an|the)?)\s+/i,
];

/** Cụm chủ đề tự nhiên từ câu "let's talk about X" / "what is X" — ưu tiên hơn bigram. */
function topicPhraseFromText(text) {
  const t = String(text || '');
  for (const re of TOPIC_PATTERNS) {
    const m = t.match(re);
    if (!m) continue;
    const rest = t.slice(m.index + m[0].length);
    const words = rest.replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(Boolean);
    const arr = [];
    for (const w of words) {
      if (arr.length >= 3) break;
      if (arr.length === 0 && STOP.has(w.toLowerCase())) continue;
      if (arr.length > 0 && STOP.has(w.toLowerCase())) break;
      arr.push(w);
    }
    while (arr.length && STOP.has(arr[arr.length - 1].toLowerCase())) arr.pop();
    if (arr.length >= 2 && /ing$/i.test(arr[arr.length - 1])) arr.pop();
    const phrase = arr.join(' ');
    const toks = phrase.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
    if (toks.length) return titleCase(phrase);
  }
  return null;
}

const STOP = new Set([
  // en
  'a','an','the','and','or','but','if','then','so','of','to','in','on','at','for','with','by','from','as','is','are','was','were','be','been','being','it','its','this','that','these','those','i','you','he','she','we','they','me','him','her','us','them','my','your','his','their','our','do','does','did','done','have','has','had','will','would','can','could','should','may','might','must','not','no','yes','there','here','when','where','who','what','how','why','just','really','very','about','into','out','up','down','over','also','than','too','only','some','any','all','more','most','much','many','like','get','got','going','gonna','gotta','okay','ok','yeah','well','right','know','think','see','look','want','need','make','made','thing','things','one','two','going','way','lot','bit',
  // vi
  'và','là','của','có','không','được','trong','cho','với','người','những','các','một','này','đó','thì','mà','nên','như','để','ra','vào','lên','xuống','rồi','đã','đang','sẽ','vẫn','còn','cũng','nhưng','hoặc','nếu','vì','do','từ','đến','về','theo','trên','dưới','giữa','khi','lúc','thế','vậy','ạ','nhé','nha','ừ','vâng','dạ','chúng','ta','mình','bạn','anh','chị','em','họ','nó','tôi','hơn','nữa','đấy','thôi','xong','đi','làm','nói','biết','thấy','được','muốn','cần',
  // connectives (cải thiện title extraction)
  'because','since','while','after','before','during','whether','however','therefore','thus','instead','rather','actually','basically','simply','especially','generally','usually','often','always','never','maybe','perhaps','probably','still','even','ever','once','around','across','along','among','toward','without','within','through','upon','via','per','each','other','such','same','both','either','neither','another','every','next','last','first','second','third','later','earlier',
]);

function tokens(s) {
  return String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
}

export function buildSentences(cues) {
  const sentences = [];
  let cur = null;
  for (const c of cues) {
    if (!cur) { cur = { start: c.start, end: c.end, text: c.text }; continue; }
    const gap = c.start - cur.end;
    const boundary = gap > 1.4 || /[.!?…]$/.test(cur.text) || cur.text.length > 320;
    if (boundary) { sentences.push(cur); cur = { start: c.start, end: c.end, text: c.text }; }
    else { cur.text += ' ' + c.text; cur.end = c.end; }
  }
  if (cur) sentences.push(cur);
  return sentences.map(s => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }));
}

function idfMap(sentences) {
  const df = new Map();
  const toks = sentences.map(s => tokens(s.text));
  for (const ts of toks) for (const w of new Set(ts)) df.set(w, (df.get(w) || 0) + 1);
  const idf = new Map();
  const N = Math.max(1, sentences.length);
  for (const [w, d] of df) idf.set(w, Math.log(N / d) + 1);
  return { idf, toks };
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [k, v] of a) if (b.has(k)) dot += v * b.get(k);
  return (na && nb) ? dot / Math.sqrt(na * nb) : 0;
}

function countVec(toks, idf) {
  const m = new Map();
  for (const w of toks) m.set(w, (m.get(w) || 0) + (idf.get(w) || 1));
  return m;
}

export function segmentSentences(sentences, opts = {}) {
  const { idf, toks } = idfMap(sentences);
  const dur = sentences.length ? sentences[sentences.length - 1].end : 0;
  const minSec = opts.minSec != null ? opts.minSec : Math.min(120, Math.max(45, dur * 0.10));
  const maxSec = opts.maxSec != null ? opts.maxSec : 240;
  const SIM_T = opts.simThreshold != null ? opts.simThreshold : 0.10;
  const segs = [];
  let cur = null;
  let winToks = [];
  const sims = [];

  const push = () => { if (cur && cur.sentences.length) segs.push(cur); cur = null; winToks = []; };

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const st = toks[i];
    if (!cur) { cur = { sentences: [s] }; }
    else {
      const winVec = countVec(winToks.slice(-200), idf);
      const sim = cosine(winVec, countVec(st, idf));
      sims.push(sim);
      const len = s.end - cur.sentences[0].start;
      const longEnough = len >= minSec;
      const topicShift = sim < SIM_T && longEnough;
      const tooLong = (s.start - cur.sentences[0].start) >= maxSec;
      if (topicShift || tooLong) {
        push();
        cur = { sentences: [s] };
      } else {
        cur.sentences.push(s);
      }
    }
    winToks.push(...st);
  }
  push();

  return segs.map((g, idx) => ({
    i: idx + 1,
    start: g.sentences[0].start,
    end: g.sentences[g.sentences.length - 1].end,
    sentences: g.sentences,
    tokensPer: g.sentences.map(s => tokens(s.text)),
    idf,
  }));
}

// ─────────────────────────────────────────────────────────────
// Bước 4 — SUMMARIZE (extractive): title / summary / bullets / keywords
// ─────────────────────────────────────────────────────────────

function trimAt(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:]$/, '') + '…';
}

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}

export function summarizeSegments(segs) {
  return segs.map(seg => {
    const idf = seg.idf;
    const scored = seg.sentences.map((s, i) => {
      const ts = seg.tokensPer[i];
      let sc = 0;
      for (const w of new Set(ts)) sc += idf.get(w) || 1;
      sc = sc / Math.pow(Math.max(6, ts.length), 0.55);
      if (i === 0) sc *= 1.1;
      return { i, s, sc, ts };
    }).sort((a, b) => b.sc - a.sc);

    const best = scored[0];
    const summary = best ? trimAt(best.s.text, 240) : '(không đủ nội dung)';

    const bullets = [];
    for (const c of scored.slice(1)) {
      if (bullets.length >= 2) break;
      if (jaccard(best.ts, c.ts) > 0.6) continue;
      bullets.push(trimAt(c.s.text, 180));
    }

    // title: (1) cụm chủ đề tự nhiên → (2) bigram đếm tuyến tính → (3) unigram → (4) câu đầu
    const natural = topicPhraseFromText(best ? best.s.text : '') || topicPhraseFromText(seg.sentences[0] ? seg.sentences[0].text : '');
    let title = natural ? trimAt(natural, 34) : null;
    if (!title) {
      const freq = new Map(); const uniFreq = new Map();
      for (const ts of seg.tokensPer) {
        for (let i = 0; i < ts.length; i++) {
          uniFreq.set(ts[i], (uniFreq.get(ts[i]) || 0) + 1);
          if (i + 1 < ts.length) { const bg = ts[i] + ' ' + ts[i + 1]; freq.set(bg, (freq.get(bg) || 0) + 1); }
        }
      }
      let bestPhrase = null, bestScore = 0;
      for (const [bg, n] of freq) {
        const [a, b] = bg.split(' ');
        const repeated = (uniFreq.get(a) || 0) >= 2 || (uniFreq.get(b) || 0) >= 2;
        if (n < 2 && !repeated) continue; // cụm yếu (chỉ xuất hiện 1 lần, từ cũng không lặp)
        const sc = ((idf.get(a) || 1) + (idf.get(b) || 1)) * (1 + n) * (1 + 0.25 * Math.min(4, (uniFreq.get(a) || 0) + (uniFreq.get(b) || 0)));
        if (sc > bestScore) { bestScore = sc; bestPhrase = bg; }
      }
      let bestUni = null, bestUniScore = 0;
      for (const [w, n] of uniFreq) {
        const sc = (idf.get(w) || 1) * (1 + n);
        if (sc > bestUniScore) { bestUniScore = sc; bestUni = w; }
      }
      title = titleCase(bestPhrase || bestUni || (best ? best.s.text.split(' ').slice(0, 4).join(' ') : 'Đoạn ' + seg.i));
    }

    // keywords: top 5 uni theo idf * (1+count)
    const kws = [...(() => {
      const uni = new Map();
      for (const ts of seg.tokensPer) for (const w of ts) uni.set(w, (uni.get(w) || 0) + 1);
      return uni;
    })()].map(([w, n]) => ({ w, sc: (idf.get(w) || 1) * (1 + n) }))
      .sort((a, b) => b.sc - a.sc).slice(0, 5).map(x => x.w);

    return {
      i: seg.i, start: seg.start, end: seg.end,
      title, summary, bullets, keywords: kws,
      startSec: seg.start, endSec: seg.end,
      _sentences: seg.sentences,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Bước 5 — DỊCH: detect ngôn ngữ + chunk (network do caller lo)
// ─────────────────────────────────────────────────────────────

const VI_CHARS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/gi;

export function detectLang(text) {
  const t = String(text || '');
  const letters = (t.match(/\p{L}/gu) || []).length || 1;
  const vi = (t.match(VI_CHARS) || []).length;
  if (vi / letters > 0.04) return 'vi';
  const sample = t.toLowerCase().slice(0, 4000);
  const enHits = (sample.match(/\b(the|and|of|to|is|that|you|this|it|with)\b/g) || []).length;
  const words = Math.max(1, (sample.match(/\s+/g) || []).length);
  return (enHits / words) > 0.04 ? 'en' : 'other';
}

export function chunkForTranslation(text, max = 1200) {
  const src = String(text || '').trim();
  if (!src) return [];
  const sentences = src.split(/(?<=[.!?…])\s+/);
  const chunks = []; let cur = '';
  const pushCur = () => { if (cur.trim()) chunks.push(cur.trim()); cur = ''; };
  for (let s of sentences) {
    while (s.length > max) { // câu quá dài → cắt cứng tại khoảng trắng
      if (cur) pushCur();
      let cut = s.lastIndexOf(' ', max);
      if (cut < max * 0.5) cut = max;
      chunks.push(s.slice(0, cut).trim()); s = s.slice(cut).trim();
    }
    if ((cur + ' ' + s).trim().length > max) pushCur();
    cur = (cur ? cur + ' ' + s : s);
  }
  pushCur();
  return chunks;
}

// ─────────────────────────────────────────────────────────────
// Bước 6 — ASSEMBLE doc (schema thống nhất node + browser)
// ─────────────────────────────────────────────────────────────

export function groupDroppedRanges(dropped, minSec = 6) {
  const ranges = [];
  for (const d of dropped.sort((a, b) => a.start - b.start)) {
    const last = ranges[ranges.length - 1];
    if (last && d.start - last.end <= 4) {
      last.end = Math.max(last.end, d.end);
      if (d.reason === 'boilerplate' || d.reason === 'music') last.reason = last.reason === 'empty' || last.reason === 'dup' ? d.reason : last.reason;
    } else ranges.push({ start: d.start, end: d.end, reason: d.reason });
  }
  return ranges.filter(r => (r.end - r.start) >= minSec && r.reason !== 'dup');
}

export function buildDoc({ meta = {}, parsed, cleaned, segments, translation = null, demo = false }) {
  const words = cleaned.cues.reduce((n, c) => n + c.text.split(/\s+/).filter(Boolean).length, 0);
  const dur = meta.durationSec || Math.max(0, ...cleaned.cues.map(c => c.end));
  const src = cleaned.cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
  const pct = cleaned.stats.cuesRaw ? Math.round(100 * cleaned.stats.droppedCues / cleaned.stats.cuesRaw) : 0;

  const segOut = segments.map(s => {
    const t = translation && translation.map ? translation.map.get(s.i) : null;
    return {
      i: s.i, start: s.start, end: s.end, dropped: false, dropReason: null,
      title: (t && t.title) || s.title,
      summary: (t && t.summary) || s.summary,
      bullets: (t && t.bullets) || s.bullets,
      keywords: (t && t.keywords) || s.keywords,
      titleSrc: s.title, summarySrc: s.summary, bulletsSrc: s.bullets, keywordsSrc: s.keywords,
      transcript: (t && t.transcript) || s._sentences.map(x => x.text).join(' '),
      transcriptSrc: s._sentences.map(x => x.text).join(' '),
    };
  });

  return {
    schema: 1,
    pipeline: PIPELINE_VERSION,
    id: meta.id, url: meta.url != null ? meta.url : (demo ? null : (meta.id ? 'https://www.youtube.com/watch?v=' + meta.id : null)),
    title: meta.title || '(không có tiêu đề)', titleVi: (translation && translation.titleVi) || null,
    channel: meta.channel || null, durationSec: Math.round(dur),
    lang: meta.lang || detectLang(src),
    source: meta.source || 'vtt-file', sourceKind: parsed.kind,
    demo: !!demo, generatedAt: new Date().toISOString(),
    generator: 'yt-summary/build.mjs v' + PIPELINE_VERSION,
    stats: {
      cuesRaw: cleaned.stats.cuesRaw, cuesClean: cleaned.stats.cuesClean, droppedCues: cleaned.stats.droppedCues,
      cleanedPct: pct, words, segments: segOut.length, readingMin: Math.max(1, Math.round(words / 200)),
    },
    translation: translation ? {
      applied: !!translation.applied, provider: translation.provider || null,
      chunks: translation.chunks || 0, failed: translation.failed || 0,
      partial: !!(translation.failed && translation.failed > 0), chars: translation.chars || 0,
    } : { applied: false, provider: null, chunks: 0, failed: 0, partial: false, chars: 0 },
    segments: segOut,
    droppedSegments: groupDroppedRanges(cleaned.dropped).map(r => ({ start: Math.round(r.start), end: Math.round(r.end), reason: r.reason })),
    transcript: (translation && translation.transcriptVi) || src,
    transcriptOriginal: translation && translation.applied ? src : null,
  };
}

export function upsertIndex(index, entry) {
  const idx = index && Array.isArray(index.videos) ? index : { generatedAt: null, generator: 'yt-summary', videos: [] };
  const rest = idx.videos.filter(v => v.id !== entry.id);
  idx.videos = [entry, ...rest].sort((a, b) => String(b.addedAt).localeCompare(String(a.addedAt)));
  idx.generatedAt = new Date().toISOString();
  return idx;
}

export function indexEntry(doc) {
  return {
    id: doc.id, title: doc.title, titleVi: doc.titleVi, channel: doc.channel,
    durationSec: doc.durationSec, lang: doc.lang, translated: !!(doc.translation && doc.translation.applied),
    cleanedPct: doc.stats.cleanedPct, segments: doc.stats.segments, words: doc.stats.words,
    demo: !!doc.demo, addedAt: doc.generatedAt,
  };
}

/** ONE CALL cho cả browser + node: từ text phụ đề → mọi thành phần trước dịch. */
export function runPipeline(vttText, opts = {}) {
  const parsed = parseSubtitles(vttText, opts.name);
  const cleaned = cleanCues(parsed.cues, { aggressive: parsed.kind === 'auto' });
  const sentences = buildSentences(cleaned.cues);
  const segs = segmentSentences(sentences, opts);
  const summarized = summarizeSegments(segs);
  return { parsed, cleaned, sentences, segments: summarized };
}
