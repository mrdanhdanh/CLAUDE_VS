// probe-translators.mjs — đo các relay dịch công khai còn lại (no key)
// Chạy: node .agent/plans/yt-summary/verify/probe-translators.mjs
const TEXT = 'Vector databases make meaning searchable by turning content into vectors.';
const enc = encodeURIComponent(TEXT);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

const targets = [
  ['lingva.ml', `https://lingva.ml/api/v1/auto/vi/${enc}`, 'json', (j) => j.translation],
  ['lingva.delta', `https://lingva.thedaviddelta.com/api/v1/auto/vi/${enc}`, 'json', (j) => j.translation],
  ['lingva.garudalinux', `https://lingva.garudalinux.org/api/v1/auto/vi/${enc}`, 'json', (j) => j.translation],
  ['simplytranslate', `https://simplytranslate.org/api/translate?engine=google&from=auto&to=vi&text=${enc}`, 'text', (t) => t],
  ['libre.terraprint', `https://translate.terraprint.co/translate`, 'POST-libre', null],
];

for (const [name, url, kind] of targets) {
  const t0 = Date.now();
  try {
    let res;
    if (kind === 'POST-libre') {
      res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ q: TEXT, source: 'auto', target: 'vi', format: 'text' }),
        signal: AbortSignal.timeout(15000),
      });
    } else {
      res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    }
    const body = await res.text();
    let out = null;
    try { const j = JSON.parse(body); out = kind === 'json' ? j.translation : (j.translatedText || JSON.stringify(j).slice(0, 100)); }
    catch { out = body.slice(0, 140); }
    console.log(JSON.stringify({ name, status: res.status, ms: Date.now() - t0, out: String(out || '').slice(0, 140) }));
  } catch (e) {
    console.log(JSON.stringify({ name, error: e.message.slice(0, 90) }));
  }
}
