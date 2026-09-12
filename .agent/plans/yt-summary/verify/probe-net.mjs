// probe-net.mjs — LIVE probe: translation endpoints + transcript extraction (evidence, không phải production code)
// Mục đích: verify trước khi thiết kế (KN-023: không đoán — phải đo).
// Chạy: node .agent/plans/yt-summary/verify/probe-net.mjs

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const out = (label, obj) => console.log('\n### ' + label + '\n' + (typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)));

// ── 1. Google gtx (free, no key) ──
async function probeGoogleGtx() {
  const text = 'Hello everyone, in this video we will learn about vector databases and retrieval augmented generation.';
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    const body = await res.text();
    if (!res.ok) return { ok: false, status: res.status, body: body.slice(0, 200) };
    const json = JSON.parse(body);
    const vi = Array.isArray(json?.[0]) ? json[0].map(p => p?.[0] || '').join('') : null;
    return { ok: !!vi, status: res.status, ms: Date.now() - t0, detected: json?.[2], vi };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── 2. MyMemory (free, no key) ──
async function probeMyMemory() {
  const text = 'Hello everyone, in this video we will learn about vector databases.';
  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|vi';
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) return { ok: false, status: res.status };
    return { ok: !!json?.responseData?.translatedText, status: res.status, ms: Date.now() - t0, quota: json?.responseDetails, vi: json?.responseData?.translatedText };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── 3. Transcript extraction: watch page → captionTracks → timedtext json3 ──
async function probeTranscript(videoId) {
  try {
    const t0 = Date.now();
    const pageRes = await fetch('https://www.youtube.com/watch?v=' + videoId + '&hl=en', {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+678' },
      signal: AbortSignal.timeout(20000),
    });
    const html = await pageRes.text();
    const m = html.match(/"captionTracks":(\[.*?\])/s);
    if (!m) return { ok: false, step: 'captionTracks', pageStatus: pageRes.status, htmlLen: html.length, hasConsent: html.includes('consent'), note: 'no captionTracks found' };
    const tracks = JSON.parse(m[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"'));
    const track = tracks.find(t => /en/.test(t.languageCode)) || tracks[0];
    const ttRes = await fetch(track.baseUrl + '&fmt=json3', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!ttRes.ok) return { ok: false, step: 'timedtext', status: ttRes.status, trackLang: track.languageCode };
    const json = await ttRes.json();
    const cues = (json.events || []).filter(e => e.segs).map(e => ({ t: Math.round((e.tStartMs || 0) / 1000), text: e.segs.map(s => s.utf8).join('').trim() }));
    return {
      ok: cues.length > 0, ms: Date.now() - t0,
      tracks: tracks.map(t => ({ lang: t.languageCode, kind: t.kind || 'manual', name: t.name?.simpleText || t.name?.runs?.[0]?.text })),
      cueCount: cues.length, first3: cues.slice(0, 3),
    };
  } catch (e) { return { ok: false, error: e.message }; }
}

const google = await probeGoogleGtx();
out('1. Google gtx (en→vi, no key)', google);
const mm = await probeMyMemory();
out('2. MyMemory (en→vi, no key)', mm);
const tr = await probeTranscript('dQw4w9WgXcQ');
out('3. Transcript extraction (dQw4w9WgXcQ)', { ok: tr.ok, ms: tr.ms, cueCount: tr.cueCount, tracks: tr.tracks, first3: tr.first3, error: tr.error, step: tr.step, status: tr.status, pageStatus: tr.pageStatus });
console.log('\n### SUMMARY\n' + JSON.stringify({ gtx: google.ok, mymemory: mm.ok, transcript: tr.ok }));
