import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.find((v) => v.startsWith('--out='));
const out = path.resolve(outArg ? outArg.slice(6) : path.join(here, 'space-bunny-free-50s.mp4'));
const voiceArg = process.argv.find((v) => v.startsWith('--voice-wav='));
const wav = voiceArg ? path.resolve(voiceArg.slice(12)) : path.join(here, 'voiceover.wav');
const duration = 50;
const fps = 30;

async function makeVoice() {
  if (process.platform !== 'win32') return false;
  const text = 'Space Bunny là model ẩn danh mới trên OpenCode, model id space-bunny-free, đang mở miễn phí trong thời gian giới hạn. Cả OpenCode và OpenRouter đều ghi model này có một triệu token context và hỗ trợ multimodal. Nhưng retention thì hai nguồn nói khác nhau: OpenCode ghi zero ngày, còn OpenRouter nói prompt có thể được lưu lại. Chưa có paper, model card, hay benchmark độc lập. Vì vậy đừng tin quảng cáo, hãy tự test: sửa bug, đọc repo, hoặc xây một tính năng nhỏ. Bạn sẽ thử Space Bunny với task nào?';
  const ps = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $voice=$s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'vi-VN' } | Select-Object -First 1; if ($null -ne $voice) { $s.SelectVoice($voice.VoiceInfo.Name) }; $s.Rate=-1; $s.SetOutputToWaveFile('${wav.replaceAll("'", "''")}'); $s.Speak('${text.replaceAll("'", "''")}'); $s.Dispose()`;
  await new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`voiceover exit ${code}`)));
  });
  return true;
}

const hasVoice = voiceArg ? (await access(wav).then(() => true).catch(() => { throw new Error(`--voice-wav không tồn tại: ${wav}`); })) : await makeVoice();
const wavB64 = hasVoice ? (await readFile(wav)).toString('base64') : '';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
await page.goto(`file://${path.join(here, 'index.html')}`);
await page.waitForFunction(() => window.__spaceBunny?.duration === 50);
const result = await page.evaluate(async ({ wavB64, duration, fps, hasVoice }) => {
  const canvas = document.querySelector('#canvas');
  const draw = window.__spaceBunny.draw;
  window.__spaceBunny.freeze = true; // stop page's own rAF loop fighting the capture loop
  const video = canvas.captureStream(fps);
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  let voice = null;
  if (hasVoice) {
    // KHÔNG dùng new Audio('file://…') + createMediaElementSource: với trang file://, Chromium coi
    // file:// là cross-origin nên graph WebAudio nhận toàn số 0 (im lặng) dù element vẫn “chạy”.
    // decodeAudioData + BufferSource thì cùng origin, tiếng đi qua đủ.
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
}, { wavB64, duration, fps, hasVoice });

await browser.close();
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, Buffer.from(result.bytes));
await readFile(out);
console.log(JSON.stringify({ out, mime: result.mime, bytes: result.size, duration, fps, audio: result.audio }));

// Guard: file phải có track audio VÀ có tiếng thật — fail loud, không ship clip im lặng (KN-056).
if (hasVoice) {
  const guard = spawn(process.execPath, [path.join(here, 'verify-audio.mjs'), out], { stdio: 'inherit' });
  const code = await new Promise((resolve) => guard.on('exit', resolve));
  if (code !== 0) {
    console.error('⛔ Guard âm thanh FAIL — clip không có tiếng, không xuất bản file này.');
    process.exit(1);
  }
}
