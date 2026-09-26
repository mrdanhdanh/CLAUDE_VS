import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Guard perf cho clip canvas render realtime (KN-083, 26.09.2026)
 *
 * Vì sao: MediaRecorder capture realtime — nếu draw(t) tốn hơn ngân sách 33.3ms/khung
 * thì khung bị ghi lặp (clip giật) mà KHÔNG throw, KHÔNG lỗi console; ảnh frames tĩnh
 * không thấy. Clip `lang-ai-era` từng ở 22.9fps (interval p95 47.7ms, stall 1111ms)
 * trước khi fix — chỉ lộ ra khi user xem MP4.
 *
 * Lưới: (1) template guard phải tồn tại + giữ gate khớp execution model thật (rAF);
 *       (2) negative control chạy thật — trang cố tình chậm PHẢI fail (KN-074/KN-078:
 *           phải chứng minh đường ĐỎ, không chỉ marker "đã chạy");
 *       (3) regression trên clip thật đã fix (lang-ai-era) PHẢI pass.
 */

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, '.github', 'skills', 'video-clip', 'templates', 'verify-perf.mjs');
const CLIP = path.join(ROOT, 'www', 'lang-ai-era');

test.describe.configure({ timeout: 90_000 });

test.describe('Clip perf — guard KN-083 (draw quá chậm → khung ghi lặp im lặng)', () => {
  test('template verify-perf tồn tại + giữ gate khớp execution model (avg + interval p95)', () => {
    expect(fs.existsSync(TEMPLATE), 'template guard phải tồn tại trong skill video-clip').toBe(true);
    const src = fs.readFileSync(TEMPLATE, 'utf8');
    expect(src, 'phải đo nhịp khung THẬT qua rAF (không chỉ vòng for back-to-back)').toContain('requestAnimationFrame');
    expect(src, 'gate phải có interval p95 (nhịp khung)').toMatch(/interval[\s\S]{0,400}p95/);
    expect(src, 'gate phải có avg cho chi phí vẽ (p95 back-to-back bị backpressure che)').toMatch(/command[\s\S]{0,200}avg/);
    expect(src, 'fail phải exit 1 — fail-closed').toContain('process.exit(1)');
    expect(src, 'ngân sách 30fps phải nằm trong output (1000/30)').toContain('1000 / 30');
    expect(src, 'phải cho override ngưỡng interval-frame').toContain('max-frame');
    expect(fs.existsSync(path.join(CLIP, 'verify-perf.mjs')), 'clip đã fix phải ship guard kèm (không chỉ nằm ở template)').toBe(true);
  });

  test('negative control: trang cố tình chậm (30ms/khung) PHẢI fail — chứng minh đường ĐỎ', () => {
    // Temp dir PHẢI nằm trong repo: script import 'playwright', Node resolve từ node_modules
    // walk-up — để trong os.tmpdir() sẽ ERR_MODULE_NOT_FOUND, test fail vì lý do sai.
    fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
    const dir = fs.mkdtempSync(path.join(ROOT, 'test-results', 'clip-perf-'));
    try {
      fs.copyFileSync(TEMPLATE, path.join(dir, 'verify-perf.mjs'));
      // n > 300: chừa 300 call đầu (warmup) rẻ để test nhanh; phần đo (samples + rAF) đều chậm 30ms.
      fs.writeFileSync(path.join(dir, 'slow.html'), `<!doctype html>
<canvas id="canvas" width="1080" height="1920"></canvas>
<script>
let n = 0;
const draw = () => { if (++n > 300) { const end = performance.now() + 30; while (performance.now() < end) {} } };
window.__clip = { duration: 20, width: 1080, height: 1920, draw, freeze: false };
</script>`);
      const run = spawnSync(process.execPath, ['verify-perf.mjs', '--page=slow.html', '--samples=60', '--frames=30'], { cwd: dir, encoding: 'utf8' });
      expect(run.status, 'trang chậm phải bị guard chặn (exit ≠ 0)').not.toBe(0);
      expect(run.stderr).toContain('perf FAIL');
      expect(run.stdout, 'phải in số đo thật — chứng minh guard ĐÃ CHẠY (KN-074)').toContain('"command"');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('regression: clip lang-ai-era (đã fix) pass — còn trong ngân sách 30fps', () => {
    const run = spawnSync(process.execPath, ['verify-perf.mjs', '--frames=90'], { cwd: CLIP, encoding: 'utf8' });
    expect(run.status, `clip đã fix không được tụt lại dưới ngân sách (KN-083):\n${run.stderr || run.stdout}`).toBe(0);
    expect(run.stdout).toContain('perf OK');
  });
});
