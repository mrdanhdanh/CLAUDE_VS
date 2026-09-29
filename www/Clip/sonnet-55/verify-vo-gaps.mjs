// Guard: khe hở lời thoại (VO) — bắt bug "VO xếp theo beat grid" (im lặng 42% → clip nghe "lưng cứng").
// verify-audio chỉ hỏi "CÓ tiếng không"; guard này hỏi "tiếng có ĐỀU không".
//
//   node verify-vo-gaps.mjs                       # kiểm voiceover.wav (hoặc WAV/MP4 truyền vào)
//   node verify-vo-gaps.mjs voiceover-hai-dang-52s.wav
//   node verify-vo-gaps.mjs clip-52s.mp4 --max-gap=2 --min-voiced=0.65
//
// Ngưỡng mặc định: không khe hở nội bộ nào > 2.0s · tổng thời lượng có tiếng ≥ 65%.
// Im lặng cuối clip (end card) báo riêng, không tính là fail.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const target = path.resolve(fileArg || path.join(here, 'voiceover.wav'));
const maxGap = Number(arg('max-gap', '2.0'));
const minVoiced = Number(arg('min-voiced', '0.65'));
const windowMs = Number(arg('window', '60'));
const silenceRms = Number(arg('rms', '0.01'));

try {
  const buf = await readFile(target);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const decoded = await page.evaluate(async ({ data, windowMs, silenceRms }) => {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ctx = new AudioContext();
    const audio = await ctx.decodeAudioData(bytes.buffer);
    const ch = audio.getChannelData(0);
    const per = Math.max(1, Math.round((windowMs / 1000) * audio.sampleRate));
    const frames = [];
    for (let i = 0; i < ch.length; i += per) {
      let sum = 0;
      const end = Math.min(ch.length, i + per);
      for (let k = i; k < end; k++) sum += ch[k] * ch[k];
      frames.push(Math.sqrt(sum / (end - i)));
    }
    return { frames, per, sampleRate: audio.sampleRate, duration: audio.duration };
  }, { data: buf.toString('base64'), windowMs, silenceRms });
  await browser.close();

  const { frames, per, sampleRate } = decoded;
  const step = per / sampleRate;
  const voicedIdx = frames.map((r, i) => (r >= silenceRms ? i : -1)).filter((i) => i >= 0);
  if (!voicedIdx.length) {
    console.error('⛔ VO im ru — không có khung nào vượt ngưỡng RMS');
    process.exit(1);
  }
  const first = voicedIdx[0];
  const last = voicedIdx[voicedIdx.length - 1];
  const gaps = [];
  let runStart = -1;
  for (let i = first; i <= last; i++) {
    const silent = frames[i] < silenceRms;
    if (silent && runStart === -1) runStart = i;
    if (!silent && runStart !== -1) {
      gaps.push({ at: +(runStart * step).toFixed(2), dur: +((i - runStart) * step).toFixed(2) });
      runStart = -1;
    }
  }
  const voicedSec = +((last - first + 1) * step).toFixed(2);
  const speechSec = +(voicedIdx.length * step).toFixed(2);
  const tailSec = +(((frames.length - 1) - last) * step).toFixed(2);
  const totalSec = +decoded.duration.toFixed(2);
  const voicedRatio = +(speechSec / totalSec).toFixed(3);
  const worst = gaps.slice().sort((a, b) => b.dur - a.dur).slice(0, 5);
  const tooLong = gaps.filter((g) => g.dur > maxGap);

  const result = {
    target: path.relative(process.cwd(), target),
    totalSec,
    speechSec,
    voicedRatio,
    speechUntil: +(last * step).toFixed(2),
    tailSilenceSec: tailSec,
    gaps: gaps.length,
    worstGaps: worst,
    thresholds: { maxGapSec: maxGap, minVoicedRatio: minVoiced }
  };
  console.log(JSON.stringify(result, null, 1));

  const fail = [];
  if (tooLong.length) fail.push(`${tooLong.length} khe hở > ${maxGap}s (dài nhất ${worst[0].dur}s @ ${worst[0].at}s)`);
  if (voicedRatio < minVoiced) fail.push(`tỉ lệ có tiếng ${(voicedRatio * 100).toFixed(0)}% < ${(minVoiced * 100).toFixed(0)}%`);
  if (fail.length) {
    console.error(`⛔ VO gaps FAIL — ${fail.join(' · ')} (viết dày lời hoặc rút ngắn beat)`);
    process.exit(1);
  }
  console.log(`✅ VO gaps OK — có tiếng ${speechSec}s/${totalSec}s (${(voicedRatio * 100).toFixed(0)}%) · khe hở dài nhất ${worst.length ? worst[0].dur : 0}s · end card ${tailSec}s`);
} catch (error) {
  console.error('verify-vo-gaps failed:', error.message);
  process.exit(1);
}
