// probe-relay.mjs — LIVE probe: Invidious/Piped relay instances (no key, server-side từ IP của họ)
// + retry direct scrape để phân biệt "IP bị flag tạm thời" vs "chặn vĩnh viễn".
// Chạy: node .agent/plans/yt-summary/verify/probe-relay.mjs
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const VID = 'dQw4w9WgXcQ';

async function tryUrl(label, url, parse) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    if (!res.ok) return { label, ok: false, status: res.status, ms: Date.now() - t0, head: text.slice(0, 120) };
    const parsed = parse(text);
    return { label, ok: !!parsed.ok, status: res.status, ms: Date.now() - t0, ...parsed };
  } catch (e) { return { label, ok: false, error: e.message.slice(0, 100) }; }
}

const invidious = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
  'https://iv.melmac.space',
  'https://invidious.f5.si',
  'https://invidious.privacyredirect.com',
];

function parseCaptionList(text) {
  const j = JSON.parse(text);
  if (!Array.isArray(j)) return { ok: false, note: 'not array' };
  const en = j.find(c => /^en/.test(c.language_code)) || j[0];
  return { ok: j.length > 0, tracks: j.map(c => c.language_code + (c.label ? ':' + c.label : '')).slice(0, 6), first: en?.url || null };
}

const results = [];
for (const base of invidious) {
  results.push(await tryUrl(base + '/api/v1/captions/' + VID, base + '/api/v1/captions/' + VID, parseCaptionList));
}

// lấy nội dung 1 track nếu instance nào sống
let captionBody = null;
const live = results.find(r => r.ok && r.first);
if (live) {
  const u = live.first.startsWith('http') ? live.first : live.label + live.first;
  captionBody = await tryUrl('captionBody:' + live.label, u + (u.includes('?') ? '&' : '?') + 'lang=en', (t) => ({ ok: /WEBVTT|<text|(?:^|\n)\d+/.test(t), sample: t.slice(0, 200), len: t.length }));
}

// Piped
const piped = await tryUrl('piped:kavin.rocks', 'https://pipedapi.kavin.rocks/streams/' + VID, (t) => {
  const j = JSON.parse(t);
  return { ok: Array.isArray(j.subtitles) && j.subtitles.length > 0, title: j.title, duration: j.duration, subs: (j.subtitles || []).map(s => s.code).slice(0, 8) };
});

// retry direct scrape (phân biệt tạm thời vs vĩnh viễn)
const direct = await tryUrl('direct:watch-page', 'https://www.youtube.com/watch?v=' + VID + '&hl=en', (t) => ({ ok: t.includes('captionTracks'), len: t.length, status429: false }));

console.log('\n### INVIDIOUS');
for (const r of results) console.log(JSON.stringify(r));
console.log('\n### CAPTION BODY\n' + JSON.stringify(captionBody));
console.log('\n### PIPED\n' + JSON.stringify(piped));
console.log('\n### DIRECT RETRY\n' + JSON.stringify(direct));
console.log('\n### SUMMARY\n' + JSON.stringify({ invidiousAlive: results.filter(r => r.ok).length + '/' + results.length, piped: piped.ok, direct: direct.ok }));
