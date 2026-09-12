#!/usr/bin/env node
/**
 * Live verify sau deploy Pages — CMB Anisotropy (2026-09-12, run 34696611064).
 * Kiểm 4 URL thật: scale.html#cmb · heatmap.json · index#future counter · slides shipped-line.
 * Exit 1 nếu bất kỳ check nào fail.
 */
const BASE = 'https://mrdanhdanh.github.io/CLAUDE_VS';
const checks = [];
const ok = (name, pass, extra = '') => { checks.push({ name, pass, extra }); console.log((pass ? '✅' : '❌') + ' ' + name + (extra ? ' — ' + extra : '')); };

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  return { status: res.status, text: await res.text() };
}

// 1) scale.html — section #cmb thật
{
  const { status, text } = await get('/cosmos/scale.html');
  ok('scale.html 200', status === 200, 'status=' + status);
  ok('scale.html có section id="cmb"', text.includes('id="cmb"'));
  ok('scale.html có "Bản đồ điểm lạnh"', text.includes('Bản đồ điểm lạnh'));
  ok('scale.html có code-block stats --heatmap', text.includes('stats --heatmap'));
}

// 2) heatmap.json — mirror thật + JSON hợp lệ
{
  const { status, text } = await get('/cosmos/heatmap.json');
  ok('heatmap.json 200', status === 200, 'status=' + status);
  let j = null;
  try { j = JSON.parse(text); } catch {}
  ok('heatmap.json parse OK', !!j);
  if (j) {
    ok('generatedBy = stats --heatmap', String(j.generatedBy).includes('stats --heatmap'));
    ok('knTotal >= 47', (j.counts?.knTotal ?? 0) >= 47, 'knTotal=' + j.counts?.knTotal);
    ok('grid >= 50 tag', (j.grid?.rows?.length ?? 0) >= 50, 'tags=' + j.grid?.rows?.length);
    ok('coldSpots >= 1', (j.coldSpots?.length ?? 0) >= 1, 'cold=' + j.coldSpots?.length);
  }
}

// 3) index.html — roadmap counter mới, card CMB đã gỡ
{
  const { status, text } = await get('/cosmos/index.html');
  ok('index.html 200', status === 200, 'status=' + status);
  ok('index.html "9 hướng cũ đã ship"', text.includes('9 hướng cũ đã ship'));
  ok('index.html "còn 4 đề tài"', text.includes('còn 4 đề tài'));
  ok('index.html card CMB đã gỡ', !text.includes('CMB Anisotropy — Bản đồ điểm lạnh'));
}

// 4) slides.html — shipped-line + CMB, hết li cũ
{
  const { status, text } = await get('/cosmos/slides.html');
  ok('slides.html 200', status === 200, 'status=' + status);
  ok('slides shipped-line có CMB Anisotropy', text.includes('CMB Anisotropy (điểm lạnh)'));
  ok('slides "4 đề tài mới"', text.includes('4 đề tài mới'));
  ok('slides li cũ (heatmap KN tag×time) đã gỡ', !text.includes('heatmap KN tag×time'));
}

const failed = checks.filter((c) => !c.pass);
console.log('\n' + (failed.length === 0 ? '✅ LIVE VERIFY PASS' : '❌ LIVE VERIFY FAIL') + ' — ' + (checks.length - failed.length) + '/' + checks.length + ' checks');
process.exit(failed.length === 0 ? 0 : 1);
