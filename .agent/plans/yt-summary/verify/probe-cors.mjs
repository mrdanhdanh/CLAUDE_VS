// probe-cors.mjs — đo CORS headers của 2 translation endpoint (quyết định browser-mode có khả thi)
// Chạy: node .agent/plans/yt-summary/verify/probe-cors.mjs
const targets = [
  ['gtx  ', 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=hello%20world'],
  ['mymem', 'https://api.mymemory.translated.net/get?q=hello%20world&langpair=en|vi'],
];
for (const [name, url] of targets) {
  try {
    const res = await fetch(url, { headers: { Origin: 'https://pages.github.io', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) });
    console.log(name, '| status', res.status, '| ACAO:', res.headers.get('access-control-allow-origin') || '(none)', '| ACAC:', res.headers.get('access-control-allow-credentials') || '-');
  } catch (e) { console.log(name, '| ERROR', e.message); }
}
