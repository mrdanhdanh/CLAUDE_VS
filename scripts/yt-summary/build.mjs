#!/usr/bin/env node
/**
 * YT Summary — CLI builder (v1)
 * YouTube (hoặc file phụ đề) → transcript sạch + bảng tóm tắt + bản dịch tiếng Việt → JSON.
 *
 * Lane extraction (theo thứ tự, đo thật 2026-09-12 — xem .agent/plans/yt-summary/verify/):
 *   1. --vtt <file>                  file .vtt/.srt/.json3 có sẵn  (LUÔN chạy)
 *   2. yt-dlp                        + --cookies / --cookies-from-browser (tùy chọn)
 *   3. builtin scrape watch-page     last-ditch, 5s timeout
 * Dịch vi (no key): Google gtx (node) → MyMemory fallback. KHÔNG log cookies.
 *
 * Usage:
 *   node scripts/yt-summary/build.mjs --url "https://youtu.be/XXXX" [--cookies-from-browser edge]
 *   node scripts/yt-summary/build.mjs --vtt path/demo.vtt --id demo-vector-db --title "..." [--demo]
 *   Flags: --out <dir> (default www/yt-summary/data) · --delay <ms> (default 320) · --no-translate · --force
 * Exit: 0 ok · 2 usage · 3 extraction failed (mọi lane) · 4 write error
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const pipeline = await import(new URL('../../www/yt-summary/pipeline.mjs', import.meta.url).href);

// ── args ──
const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i !== -1 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : def; };
const URL_IN = typeof arg('url', null) === 'string' ? arg('url', null) : null;
const VTT_IN = typeof arg('vtt', null) === 'string' ? arg('vtt', null) : null;
const COOKIES = typeof arg('cookies', null) === 'string' ? arg('cookies', null) : null;
const COOKIES_BROWSER = typeof arg('cookies-from-browser', null) === 'string' ? arg('cookies-from-browser', null) : null;
const ID_ARG = typeof arg('id', null) === 'string' ? arg('id', null) : null;
const TITLE_ARG = typeof arg('title', null) === 'string' ? arg('title', null) : null;
const CHANNEL_ARG = typeof arg('channel', null) === 'string' ? arg('channel', null) : null;
const OUT_DIR = path.resolve(ROOT, typeof arg('out', null) === 'string' ? arg('out', null) : 'www/yt-summary/data');
const DELAY = parseInt(arg('delay', '320'), 10) || 320;
const MIN_SEC = parseInt(arg('min-sec', '0'), 10) || undefined;
const MAX_SEC = parseInt(arg('max-sec', '0'), 10) || undefined;
const NO_TRANSLATE = !!arg('no-translate', false);
const FORCE = !!arg('force', false);
const DEMO = !!arg('demo', false);

const log = (...a) => console.log('[yt-summary]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

if (!URL_IN && !VTT_IN) { console.error('Usage: --url <youtube> | --vtt <file>  (xem header file)'); process.exit(2); }

// ── 1. Lấy phụ đề ──
function ytdlpBin() {
  for (const cmd of [['yt-dlp', []], ['python', ['-m', 'yt_dlp']], ['python3', ['-m', 'yt_dlp']]]) {
    try {
      const r = spawnSync(cmd[0], [...cmd[1], '--version'], { encoding: 'utf8', timeout: 20000 });
      if (r.status === 0) return { bin: cmd[0], pre: cmd[1], version: String(r.stdout).trim() };
    } catch { /* next */ }
  }
  return null;
}

function runYtdlp(extra, args) {
  const r = spawnSync(extra.bin, [...extra.pre, ...args], { encoding: 'utf8', timeout: 180000 });
  return { ok: r.status === 0, stderr: (r.stderr || '') + (r.stdout || '') };
}

async function laneYtdlp(videoId) {
  const ytdlp = ytdlpBin();
  if (!ytdlp) { log('yt-dlp: không có trong PATH — bỏ lane này'); return null; }
  log('yt-dlp', ytdlp.version, '— thử tải phụ đề…');
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'yts-'));
  const outTpl = path.join(tmp, '%(id)s.%(ext)s');
  const base = ['--skip-download', '--no-playlist', '--write-subs', '--write-auto-subs',
    '--sub-langs', 'all,-live_chat', '--sub-format', 'json3/vtt/best', '-o', outTpl];
  if (COOKIES) base.push('--cookies', COOKIES);
  if (COOKIES_BROWSER) base.push('--cookies-from-browser', COOKIES_BROWSER);

  let r = runYtdlp(ytdlp, [...base, '--js-runtimes', 'node', '--print', 'META|%(id)s|%(duration)s|%(title)s|%(channel)s|%(language)s', `https://www.youtube.com/watch?v=${videoId}`]);
  if (!r.ok && /js-runtimes|unrecognized arguments/i.test(r.stderr)) {
    r = runYtdlp(ytdlp, [...base, '--print', 'META|%(id)s|%(duration)s|%(title)s|%(channel)s|%(language)s', `https://www.youtube.com/watch?v=${videoId}`]);
  }
  if (!r.ok) { log('yt-dlp fail:', r.stderr.split('\n').filter(l => /ERROR|blocked|Sign in/i.test(l)).slice(0, 2).join(' | ') || 'unknown'); return null; }

  const metaLine = (r.stderr.split('\n').find(l => l.startsWith('META|')) || '').split('|');
  const meta = { id: metaLine[1], durationSec: +metaLine[2] || null, title: metaLine[3], channel: metaLine[4], langHint: (metaLine[5] || '').split('-')[0] || null };

  const files = (await fsp.readdir(tmp)).filter(f => /\.(vtt|srt|json3)$/i.test(f));
  if (!files.length) { log('yt-dlp: không có phụ đề nào (video này chưa bật caption)'); return { meta, cues: null }; }
  const prefer = (f) => {
    const l = f.split('.').slice(1).join('.');
    let s = 0;
    if (meta.langHint && l.startsWith(meta.langHint)) s += 8;
    if (l.startsWith('en')) s += 4;
    if (l.startsWith('vi')) s += 2;
    if (!f.includes('.auto.')) s += 1;
    return s;
  };
  files.sort((a, b) => prefer(b) - prefer(a));
  const chosen = path.join(tmp, files[0]);
  log('yt-dlp: phụ đề chọn →', files[0]);
  const parsed = pipeline.parseSubtitles(await fsp.readFile(chosen, 'utf8'), files[0]);
  const auto = files[0].includes('.auto.');
  await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  return { meta, parsed: { ...parsed, kind: auto ? 'auto' : parsed.kind } };
}

async function laneScrape(videoId) {
  log('builtin scrape: thử watch-page (last-ditch)…');
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+678' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { log('scrape: HTTP', res.status); return null; }
    const html = await res.text();
    const m = html.match(/"captionTracks":(\[.*?\])/s);
    if (!m) { log('scrape: không thấy captionTracks'); return null; }
    const tracks = JSON.parse(m[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"'));
    const track = tracks.find(t => /^en/.test(t.languageCode)) || tracks[0];
    const tt = await fetch(track.baseUrl + '&fmt=json3', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (!tt.ok) { log('scrape: timedtext HTTP', tt.status); return null; }
    const parsed = pipeline.parseJson3(await tt.json());
    log('scrape: OK —', parsed.cues.length, 'cues');
    return { meta: { id: videoId, langHint: (track.languageCode || '').split('-')[0] }, parsed };
  } catch (e) { log('scrape fail:', e.message); return null; }
}

async function laneOembedMeta(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = await res.json();
    return { title: j.title, channel: j.author_name };
  } catch { return null; }
}

// ── 2. Dịch (no key) — chuỗi: gtx → clients5 → mymemory, CIRCUIT BREAKER theo host ──
const breakers = new Map(); // host → { fails, downUntil }
const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };
const isDown = (h) => { const b = breakers.get(h); return !!(b && Date.now() < b.downUntil); };
const trip = (h) => { const b = breakers.get(h) || { fails: 0, downUntil: 0 }; b.fails++; b.downUntil = Date.now() + (b.fails >= 2 ? 15 * 60 * 1000 : 2 * 60 * 1000); breakers.set(h, b); };
const heal = (h) => breakers.delete(h);

/** Parse đa hình: gtx `[[["text",...]],...]` · clients5 `[["text","en"]]` · sentences `{sentences:[{trans}]}` */
function parseGtxJson(j) {
  if (!j || typeof j !== 'object') return null;
  const isLang = (s) => /^[a-z]{2}(-[A-Za-z]{2,})?$/.test(String(s));
  const parts = [];
  const walk = (x) => {
    if (typeof x === 'string') { if (!isLang(x)) parts.push(x); return; }
    if (Array.isArray(x)) { for (const y of x) walk(y); return; }
    if (x && typeof x === 'object') {
      if (typeof x.trans === 'string') parts.push(x.trans);
      if (typeof x.utf8 === 'string') parts.push(x.utf8);
      if (Array.isArray(x.segs)) walk(x.segs);
      if (Array.isArray(x.sentences)) walk(x.sentences);
    }
  };
  walk(j);
  const out = parts.join(' ').replace(/\s+/g, ' ').trim();
  return out || null;
}

async function googleTranslateLike(endpoint, q) {
  const host = hostOf(endpoint);
  if (isDown(host)) throw new Error(host + ' circuit-open');
  let res;
  try { res = await fetch(endpoint + encodeURIComponent(q), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) }); }
  catch (e) { trip(host); throw new Error('gtx fetch: ' + e.message); }
  if (!res.ok) { trip(host); throw new Error('gtx ' + res.status); }
  const vi = parseGtxJson(await res.json().catch(() => null));
  if (!vi) { trip(host); throw new Error('gtx empty'); }
  heal(host);
  return vi;
}
const GTX_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=';
const GTX2_URL = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=vi&q=';

let memoQuotaTripped = false;
async function mymemoryText(text, stats) {
  if (memoQuotaTripped) { stats.failed += pipeline.chunkForTranslation(text, 460).length; return text; }
  const parts = pipeline.chunkForTranslation(text, 460);
  const out = [];
  for (const p of parts) {
    if (p.length < 3) { out.push(p); continue; }
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(p) + '&langpair=en|vi';
    let vi = null, ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
        const j = await res.json().catch(() => null);
        const details = String((j && j.responseDetails) || '');
        if (/USED ALL AVAILABLE FREE TRANSLATIONS/i.test(details)) {
          memoQuotaTripped = true;
          console.log('\n[yt-summary] ⚠️ MyMemory hết quota hôm nay (reset sau ~5h) — các chunk còn lại giữ bản gốc.');
          break;
        }
        const t = j && j.responseData && j.responseData.translatedText;
        if (res.ok && t && !/MYMEMORY WARNING/i.test(t)) { vi = String(t); ok = true; }
      } catch { /* retry */ }
      if (!ok && !memoQuotaTripped && attempt === 0) await sleep(1600);
    }
    if (ok) out.push(vi);
    else { out.push(p); stats.failed++; }
    if (memoQuotaTripped) break;
    await sleep(220);
  }
  return out.join(' ');
}

async function translateText(text, stats) {
  if (!text || !text.trim()) return '';
  const chunks = pipeline.chunkForTranslation(text, 900);
  const out = [];
  for (const ch of chunks) {
    stats.chunks++;
    let vi = null, via = null;
    try { vi = await googleTranslateLike(GTX_URL, ch); via = 'gtx'; }
    catch (e) { if (process.env.YTS_DEBUG) console.error('\n[dbg] gtx:', e.message); }
    if (vi == null) {
      try { vi = await googleTranslateLike(GTX2_URL, ch); via = 'gtx2'; }
      catch (e) { if (process.env.YTS_DEBUG) console.error('\n[dbg] gtx2:', e.message); }
    }
    if (vi == null) {
      try { vi = await mymemoryText(ch, stats); via = 'mymemory'; }
      catch (e) { if (process.env.YTS_DEBUG) console.error('\n[dbg] mymemory:', e.message); vi = null; }
    }
    if (vi == null) { vi = ch; }
    stats[via === 'gtx' ? 'gtx' : via === 'gtx2' ? 'gtx2' : via === 'mymemory' ? 'mymemory' : 'failed']++;
    out.push(capFirst(vi));
    stats.chars += ch.length;
    await sleep(DELAY + Math.floor(Math.random() * 120));
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

/** Viết hoa chữ đầu của bản dịch (MyMemory/gtx trả về chữ thường) */
function capFirst(s) {
  const t = String(s || '');
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

// ── 3. Main ──
async function main() {
  let videoId = ID_ARG, meta = { id: videoId }, parsed = null, source = 'vtt-file';

  if (VTT_IN) {
    const p = path.resolve(ROOT, VTT_IN);
    if (!fs.existsSync(p)) { console.error('Không thấy file:', VTT_IN); process.exit(2); }
    parsed = pipeline.parseSubtitles(await fsp.readFile(p, 'utf8'), VTT_IN);
    // fixture auto-caption có header Kind: captions → aggressive merge
    if (/\.(vtt|srt|json3)$/i.test(VTT_IN)) parsed.kind = /^Kind:\s*captions/mi.test(await fsp.readFile(p, 'utf8')) ? 'auto' : parsed.kind;
    log('lane vtt-file:', parsed.cues.length, 'cues ·', parsed.kind);
  } else {
    videoId = pipeline.extractVideoId(URL_IN);
    if (!videoId) { console.error('Link YouTube không hợp lệ:', URL_IN); process.exit(2); }
    meta.id = videoId;

    const outFile = path.join(OUT_DIR, videoId + '.json');
    if (fs.existsSync(outFile) && !FORCE) {
      log('Đã có', videoId + '.json — dùng --force để build lại. Xong.');
      process.exit(0);
    }

    const ytdlp = await laneYtdlp(videoId);
    if (ytdlp) { meta = { ...meta, ...ytdlp.meta }; parsed = ytdlp.parsed; source = 'ytdlp' + (COOKIES || COOKIES_BROWSER ? '+cookies' : ''); }
    if (!parsed) {
      const sc = await laneScrape(videoId);
      if (sc) { meta = { ...meta, ...sc.meta }; parsed = sc.parsed; source = 'watch-page'; }
    }
    if (!parsed) {
      const oe = await laneOembedMeta(videoId);
      if (oe) meta = { ...meta, ...oe };
      console.error('\n❌ Không lane nào lấy được phụ đề cho video', videoId + '.');
      console.error('   YouTube đang chặn IP này (đo thật 2026-09-12 — xem .agent/plans/yt-summary/verify/). Gợi ý:');
      console.error('   1. Chạy local với cookies:  node scripts/yt-summary/build.mjs --url ... --cookies-from-browser edge   (đóng Edge trước)');
      console.error('   2. Xuất cookies.txt (extension "Get cookies.txt LOCALLY") rồi:  --cookies path/to/cookies.txt');
      console.error('   3. Tải .vtt/.srt bằng extension rồi:  --vtt path/to/file.vtt --id ' + videoId + (meta.title ? ` --title "${meta.title}"` : ''));
      process.exit(3);
    }
    if (parsed.cues && parsed.cues.length === 0) {
      console.error('❌ Video không có phụ đề (kể cả auto). Không tóm tắt được → không ghi JSON rác.');
      process.exit(3);
    }
  }

  if (!videoId) videoId = 'demo-' + path.basename(VTT_IN || 'sample').replace(/\W+/g, '-').toLowerCase();
  meta.id = videoId;
  meta.title = meta.title || TITLE_ARG || null;
  meta.channel = meta.channel || CHANNEL_ARG || null;
  // URL canonical chỉ khi có videoId YouTube thật (không sinh URL giả cho demo/vtt)
  meta.url = URL_IN && /^https?:/i.test(URL_IN) ? URL_IN
    : (!DEMO && !VTT_IN && videoId && !videoId.startsWith('demo-')) ? 'https://www.youtube.com/watch?v=' + videoId
    : null;

  // pipeline
  const cleaned = pipeline.cleanCues(parsed.cues, { aggressive: parsed.kind === 'auto' });
  const sentences = pipeline.buildSentences(cleaned.cues);
  const segs = pipeline.segmentSentences(sentences, { minSec: MIN_SEC, maxSec: MAX_SEC });
  const segments = pipeline.summarizeSegments(segs);
  const fullSrc = cleaned.cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
  const lang = pipeline.detectLang(fullSrc);
  log(`pipeline: ${parsed.cues.length} cues → ${cleaned.cues.length} sạch (lược ${cleaned.stats.droppedCues}) → ${segments.length} phần · ${lang}`);

  // dịch
  let translation = null;
  if (!NO_TRANSLATE && lang !== 'vi') {
    const stats = { chunks: 0, gtx: 0, gtx2: 0, mymemory: 0, failed: 0, chars: 0 };
    const map = new Map();
    log('dịch vi: bắt đầu (gtx → gtx2 → mymemory, circuit breaker)…');
    const titleVi = null; // KHÔNG dịch title (thuật ngữ — dịch máy làm rác; UI hiển thị titleSrc)
    for (const s of segments) {
      map.set(s.i, {
        title: null, titleKeepSrc: true,
        summary: await translateText(s.summary, stats),
        bullets: (await translateText(s.bullets.join(' | '), stats)).split('|').map(x => x.trim()).filter(Boolean),
        keywords: null, keywordsKeepSrc: true,
        transcript: await translateText(s._sentences.map(x => x.text).join(' '), stats),
      });
      if (map.get(s.i).bullets.length !== s.bullets.length) map.get(s.i).bullets = s.bullets;
      process.stdout.write('.');
    }
    process.stdout.write('\n');
    const provider = stats.mymemory === 0 ? (stats.gtx2 === 0 ? 'gtx' : 'gtx+gtx2') : ((stats.gtx + stats.gtx2) === 0 ? 'mymemory' : 'mixed');
    translation = {
      applied: true, provider, chunks: stats.chunks, failed: stats.failed, chars: stats.chars, map,
      titleVi,
      transcriptVi: [...map.values()].map(t => t.transcript).filter(Boolean).join(' '),
    };
    log(`dịch vi: xong — ${stats.chunks} chunks (gtx ${stats.gtx} · gtx2 ${stats.gtx2} · mymemory ${stats.mymemory} · fail ${stats.failed})`);
  } else {
    log(NO_TRANSLATE ? 'dịch: bỏ qua (--no-translate)' : 'dịch: bỏ qua (nguồn đã là tiếng Việt)');
  }

  // assemble + ghi
  const doc = pipeline.buildDoc({
    meta: { ...meta, title: meta.title || TITLE_ARG || '(không rõ tiêu đề)', lang },
    parsed, cleaned, segments, translation, demo: DEMO,
  });

  await fsp.mkdir(OUT_DIR, { recursive: true });
  const docPath = path.join(OUT_DIR, videoId + '.json');
  await fsp.writeFile(docPath, JSON.stringify(doc, null, 1));
  const idxPath = path.join(OUT_DIR, 'index.json');
  let index = null;
  try { index = JSON.parse(await fsp.readFile(idxPath, 'utf8')); } catch { index = null; }
  index = pipeline.upsertIndex(index, pipeline.indexEntry(doc));
  await fsp.writeFile(idxPath, JSON.stringify(index, null, 1));

  log(`✅ ${path.relative(ROOT, docPath)} — ${doc.stats.segments} phần · ${doc.stats.words} từ · lược ${doc.stats.cleanedPct}% · vi=${doc.translation.applied} (${doc.translation.provider || '—'})`);
}

main().catch(e => { console.error('[yt-summary] LỖI:', e.message); process.exit(4); });
