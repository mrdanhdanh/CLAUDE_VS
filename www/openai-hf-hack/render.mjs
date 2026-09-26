// Render clip dọc 9:16 → MP4, không cần ffmpeg (Playwright Chromium + MediaRecorder).
//
//   node render.mjs --voice-wav=voiceover-hai-dang-50s.wav --out=my-clip-50s.mp4
//   node render.mjs --duration=30 --fps=30 --global=__clip --page=index.html
//
// Sau khi ghi file, script TỰ chạy verify-audio.mjs — im tiếng là exit 1, không ship.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((v) => v.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const globalName = arg('global', '__clip');           // tên biến trên window: window.__clip
const pageName = arg('page', 'index.html');
const durationArg = arg('duration', '');              // bỏ trống = lấy từ trang (nguồn duy nhất)
const fps = Number(arg('fps', '30'));
const outArg = arg('out', '');
const voiceArg = arg('voice-wav', '');
const wav = voiceArg ? path.resolve(voiceArg) : path.join(here, 'voiceover.wav');

if (durationArg && (!Number.isFinite(Number(durationArg)) || Number(durationArg) <= 0)) {
  console.error('⛔ --duration phải là số dương');
  process.exit(2);
}

const hasVoice = voiceArg
  ? await access(wav).then(() => true).catch(() => { throw new Error(`--voice-wav không tồn tại: ${wav}`); })
  : await access(wav).then(() => true).catch(() => false);

if (hasVoice) {
  const probe = spawn(process.execPath, [path.join(here, 'verify-audio.mjs'), wav], { stdio: 'inherit' });
  const code = await new Promise((resolve) => probe.on('exit', resolve));
  if (code !== 0) {
    console.error('⛔ Voiceover im lặng hoặc không có audio — dừng trước khi render.');
    process.exit(1);
  }
} else {
  console.warn(`⚠️  Không có voiceover (${wav}) — clip sẽ im tiếng. Dùng --voice-wav=<file> nếu cần tiếng.`);
}

const wavB64 = hasVoice ? (await readFile(wav)).toString('base64') : '';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
await page.goto(`file://${path.join(here, pageName)}`);
await page.waitForFunction((g) => Boolean(window[g]?.duration && window[g]?.draw), globalName);

// Trang khai `duration` — render chỉ override khi người dùng yêu cầu tường minh.
const duration = durationArg ? Number(durationArg) : await page.evaluate((g) => window[g].duration, globalName);
if (!Number.isFinite(duration) || duration <= 0) {
  console.error('⛔ Trang không khai duration hợp lệ trong window.__clip');
  process.exit(2);
}
const out = path.resolve(outArg || path.join(here, `clip-${duration}s.mp4`));

const result = await page.evaluate(async ({ g, wavB64, duration, fps, hasVoice }) => {
  const clip = window[g];
  const canvas = document.querySelector('#canvas');
  const draw = clip.draw;
  clip.freeze = true; // tắt rAF nội bộ — nếu không, vòng của trang ghi lẫn vào luồng capture
  const video = canvas.captureStream(fps);

  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  let voice = null;
  if (hasVoice) {
    // KHÔNG dùng new Audio('file://…') + createMediaElementSource: trên trang file:// Chromium coi
    // file:// là cross-origin nên graph WebAudio nhận toàn số 0 (im lặng) dù element vẫn “chạy”.
    // decodeAudioData + BufferSource cùng origin → tiếng đi qua đủ.
    const bin = atob(wavB64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const decoded = await audioCtx.decodeAudioData(bytes.buffer);
    voice = audioCtx.createBufferSource();
    voice.buffer = decoded;
    voice.connect(dest);
  }
  await audioCtx.resume();

  const stream = new MediaStream([...video.getVideoTracks(), ...(hasVoice ? dest.stream.getAudioTracks() : [])]);
  const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9'].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error('No supported video mime type');

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });
  const chunks = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start(250);
  if (voice) voice.start();

  const started = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - started) / 1000;
      draw(Math.min(duration, t));
      if (t >= duration) resolve(); else requestAnimationFrame(tick);
    };
    tick();
  });

  recorder.stop();
  await stopped;
  const blob = new Blob(chunks, { type: mime });
  return { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), mime, size: blob.size, audio: hasVoice };
}, { g: globalName, wavB64, duration, fps, hasVoice });

await browser.close();
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, Buffer.from(result.bytes));
await readFile(out);
console.log(JSON.stringify({ out, mime: result.mime, bytes: result.size, duration, fps, audio: result.audio }));

// Guard: clip ĐƯỢC CHO LÀ có tiếng thì track phải có tiếng thật — fail loud, không ship clip im lặng.
if (hasVoice) {
  const guard = spawn(process.execPath, [path.join(here, 'verify-audio.mjs'), out], { stdio: 'inherit' });
  const guardCode = await new Promise((resolve) => guard.on('exit', resolve));
  if (guardCode !== 0) {
    console.error('⛔ Guard âm thanh FAIL — clip không có tiếng, không xuất bản file này.');
    process.exit(1);
  }
}
