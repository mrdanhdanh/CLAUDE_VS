// Guard: mượt khung trong MP4 đã ghi — đo khung rơi THẬT khi phát lại (getVideoPlaybackQuality).
// verify-perf chỉ đo chi phí draw(t) trên trang; file ghi ra vẫn có thể rơi khung vì stall cấp
// browser/encoder (đo được: outlier 66–258ms không lộ ra ở p95 command cost).
//
//   node verify-mp4-smooth.mjs                          # tự tìm *.mp4 trong thư mục clip
//   node verify-mp4-smooth.mjs my-clip-45s.mp4
//   node verify-mp4-smooth.mjs my-clip-45s.mp4 --rate=4 --max-drop=0.03 --min-fps=28
//
// Ngưỡng mặc định: khung rơi ≤3% · fps trung bình ≥28 (clip 30fps). Exit 1 nếu vượt.
import { chromium } from 'playwright';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
let target = fileArg ? path.resolve(fileArg) : '';
if (!target) {
  const mp4s = (await readdir(here)).filter((f) => f.endsWith('.mp4')).sort();
  if (!mp4s.length) {
    console.error('⛔ Không tìm thấy .mp4 nào — truyền đường dẫn tường minh');
    process.exit(2);
  }
  target = path.join(here, mp4s[mp4s.length - 1]);
}
const rate = Number(arg('rate', '4'));
const maxDrop = Number(arg('max-drop', '0.03'));
const minFps = Number(arg('min-fps', '28'));

try {
  const info = await stat(target);
  const b64 = (await readFile(target)).toString('base64');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const out = await page.evaluate(async ({ data, rate }) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playbackRate = rate;
    video.src = `data:video/mp4;base64,${data}`;
    document.body.appendChild(video);
    await new Promise((res, rej) => {
      video.onloadedmetadata = res;
      video.onerror = () => rej(new Error('metadata error'));
      setTimeout(() => rej(new Error('timeout metadata')), 30000);
    });
    let worst = 0;
    let last = performance.now();
    await new Promise((res) => {
      const tick = () => {
        if (video.ended) return res();
        const now = performance.now();
        worst = Math.max(worst, now - last);
        last = now;
        requestAnimationFrame(tick);
      };
      video.onended = res;
      video.play().then(tick).catch(() => res());
      setTimeout(res, 120000);
    });
    const q = video.getVideoPlaybackQuality();
    return {
      duration: +video.duration.toFixed(2),
      width: video.videoWidth,
      height: video.videoHeight,
      totalVideoFrames: q.totalVideoFrames,
      droppedVideoFrames: q.droppedVideoFrames,
      droppedRatio: +(q.droppedVideoFrames / Math.max(1, q.totalVideoFrames)).toFixed(4),
      worstRealtimeGapMs: +worst.toFixed(1)
    };
  }, { data: b64, rate });
  await browser.close();

  const fps = out.totalVideoFrames / out.duration;
  console.log(JSON.stringify({
    target: path.relative(process.cwd(), target),
    sizeMB: +(info.size / 1048576).toFixed(2),
    playbackRate: rate,
    ...out,
    avgFps: +fps.toFixed(2),
    thresholds: { maxDropRatio: maxDrop, minAvgFps: minFps }
  }, null, 1));

  const fail = [];
  if (out.droppedRatio > maxDrop) fail.push(`khung rơi ${(out.droppedRatio * 100).toFixed(1)}% > ${(maxDrop * 100).toFixed(0)}%`);
  if (fps < minFps) fail.push(`fps trung bình ${fps.toFixed(1)} < ${minFps}`);
  if (fail.length) {
    console.error(`⛔ MP4 không mượt — ${fail.join(' · ')} (giảm chi phí draw / bake texture rồi render lại)`);
    process.exit(1);
  }
  console.log(`✅ MP4 mượt — ${fps.toFixed(1)}fps · rơi ${(out.droppedRatio * 100).toFixed(1)}% khung · ${out.width}×${out.height} · ${out.duration}s`);
} catch (error) {
  console.error('verify-mp4-smooth failed:', error.message);
  process.exit(1);
}
