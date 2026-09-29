// Guard: tương phản token màu chữ trên nền panel (WCAG 4.5:1).
// Bug thật đã bắt (30/09): token `dim` #5f7396 chỉ 3.35–4.21:1 trên panel/panel2 nhưng đang chở
// chữ thật (note "số do Anthropic công bố", nhãn caveat) — không guard nào khác thấy.
//
//   node verify-contrast.mjs                 # tự đọc index.html cạnh script
//   node verify-contrast.mjs --page=index.html --min=4.5
//
// Quy ước: key thuộc nhóm trang trí/border (line/grid/bg*) KHÔNG tính là chữ; còn lại phải ≥ ngưỡng
// trên MỌI nền panel có thể gặp (bg0/bg1/panel/panel2) — nền sáng nhất là ca xấu nhất.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const pagePath = path.join(here, arg('page', 'index.html'));
const min = Number(arg('min', '4.5'));
const DECORATIVE = ['line', 'grid', 'bg', 'bg0', 'bg1', 'panel', 'panel2'];
const BG_RE = /^(bg|panel)/; // chỉ nền thật — `line`/`grid` là viền, không chở chữ

const hexToRgb = (h) => {
  const s = h.replace('#', '');
  const v = s.length === 3 ? s.split('').map((x) => x + x).join('') : s;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(hexToRgb(a)), lum(hexToRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

try {
  const html = await readFile(pagePath, 'utf8');
  const block = html.match(/const C\s*=\s*\{([\s\S]*?)\};/);
  if (!block) throw new Error('không tìm thấy object token C (đổi regex cho khớp code)');
  const C = {};
  for (const m of block[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*['"](#[0-9a-fA-F]{3,8})['"]/g)) C[m[1]] = m[2];
  const keys = Object.keys(C);
  if (!keys.length) throw new Error('object C không có token màu hex nào');

  const bgs = keys.filter((k) => BG_RE.test(k));
  const fgs = keys.filter((k) => !DECORATIVE.includes(k));
  const fails = [];
  for (const fg of fgs) {
    for (const bg of bgs) {
      const r = ratio(C[fg], C[bg]);
      if (r < min) fails.push({ fg, bg, ratio: +r.toFixed(2) });
    }
  }
  const worst = fails.sort((a, b) => a.ratio - b.ratio).slice(0, 6);
  console.log(JSON.stringify({
    page: path.relative(process.cwd(), pagePath),
    tokens: keys.length,
    colourTokens: fgs.length,
    backgrounds: bgs,
    minRequired: min,
    failures: worst
  }, null, 1));

  if (fails.length) {
    console.error(`⛔ contrast FAIL — ${fails.length} cặp chữ/nền < ${min}:1 (chỉ tính token KHÔNG thuộc nhóm trang trí ${DECORATIVE.join('/')})`);
    process.exit(1);
  }
  console.log(`✅ contrast OK — ${fgs.length} token chữ ≥ ${min}:1 trên mọi nền panel`);
} catch (error) {
  console.error('verify-contrast failed:', error.message);
  process.exit(1);
}
