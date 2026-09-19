// Verify chính xác active-dot — scroll INSTANT (loại nhiễu smooth-scroll)
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3000/cosmos/index.html', { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// Log offsetTop thật của mọi section theo DOM
const tops = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('section[id]').forEach(s => out.push({ id: s.id, top: s.offsetTop }));
  return out;
});
console.log('=== DOM order + offsetTop thật ===');
tops.forEach(t => console.log(`  ${t.id.padEnd(12)} ${t.top}`));

const arrOrder = await page.evaluate(() => {
  // trích array từ chính scope — không truy cập được, nên in lại theo con số đã biết
  return ['hero','phil','pipeline','map','calendar','lab','observatory','integration','future'];
});

async function measureIn(id) {
  await page.evaluate(secId => {
    const el = document.getElementById(secId);
    // scroll instant: top của section nằm giữa vùng nhìn (giống user đang đọc)
    const y = el.offsetTop + el.offsetHeight * 0.5 - window.innerHeight * 0.5;
    window.scrollTo({ top: y, behavior: 'instant' });
  }, id);
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const act = document.querySelector('.scroll-dot.active');
    const mid = window.scrollY + window.innerHeight * 0.35;
    return { active: act ? act.dataset.target : '(none)', scrollY: Math.round(window.scrollY), mid: Math.round(mid) };
  });
}

console.log('\n=== Đo giữa từng section (user đang đọc) ===');
let fails = 0;
for (const id of ['hero', 'phil', 'pipeline', 'lab', 'map', 'calendar', 'observatory', 'integration', 'future']) {
  const r = await measureIn(id);
  const ok = r.active === id;
  if (!ok) fails++;
  console.log(`  giữa #${id.padEnd(12)} → active=${r.active.padEnd(12)} ${ok ? '✅' : '❌ SAI'} (scrollY=${r.scrollY}, mid=${r.mid})`);
}
console.log(`\nTổng sai: ${fails}/9`);

// Mô phỏng đúng logic hiện tại để chỉ ra nguyên nhân
console.log('\n=== Mô phỏng logic hiện tại (array order, last-wins, offsetTop<=mid) ===');
for (const id of ['lab', 'map', 'calendar']) {
  const r = await page.evaluate((secId) => {
    const el = document.getElementById(secId);
    const y = el.offsetTop + 400; window.scrollTo({ top: y, behavior: 'instant' });
    return null;
  }, id);
  await page.waitForTimeout(200);
  const sim = await page.evaluate(() => {
    const mid = window.scrollY + window.innerHeight * 0.35;
    const arr = ['hero','phil','pipeline','map','calendar','lab','observatory','integration','future'];
    let active = arr[0], log = [];
    for (const sec of arr) {
      const el = document.getElementById(sec);
      if (el.offsetTop <= mid) { active = sec; log.push(`${sec}(${el.offsetTop})`); }
    }
    return { active, passing: log, mid: Math.round(mid) };
  });
  console.log(`  trong #${id}: passing=[${sim.passing.join(', ')}] → active=${sim.active} (mid=${sim.mid})`);
}

await browser.close();
