// Guard + chẩn đoán âm thanh cho clip: file MP4 có track audio và có TIẾNG thật không?
// Dùng:
//   node www/space-bunny-free/verify-audio.mjs             # kiểm file MP4 mặc định
//   node www/space-bunny-free/verify-audio.mjs <file>      # kiểm file khác
//   node www/space-bunny-free/verify-audio.mjs --codecs    # thêm: codec MediaRecorder hỗ trợ
//   node www/space-bunny-free/verify-audio.mjs --diagnose  # thêm: đo pipeline file:// + media element y như render
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wantCodecs = args.includes('--codecs');
const wantDiagnose = args.includes('--diagnose');
const fileArg = args.find((a) => !a.startsWith('--'));
const target = path.resolve(fileArg || path.join(here, 'space-bunny-free-50s.mp4'));
const MIN_PEAK = 0.02;

function scanBoxes(buf) {
  const handlers = [];
  const formats = [];
  const walk = (start, end) => {
    let off = start;
    while (off + 8 <= end) {
      const size = buf.readUInt32BE(off);
      const type = buf.toString('latin1', off + 4, off + 8);
      if (size < 8 || off + size > end) break;
      if (type === 'hdlr') handlers.push(buf.toString('latin1', off + 16, off + 20));
      if (type === 'stsd') {
        const count = buf.readUInt32BE(off + 12);
        let p = off + 16;
        for (let i = 0; i < count && p + 8 <= off + size; i++) {
          const esize = buf.readUInt32BE(p);
          formats.push(buf.toString('latin1', p + 4, p + 8));
          if (esize < 8) break;
          p += esize;
        }
      }
      if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'mvex', 'udta'].includes(type)) walk(off + 8, off + size);
      off += size;
    }
  };
  walk(0, buf.length);
  return { handlers, formats };
}

try {
  const buf = await readFile(target);
  const isWav = buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WAVE';
  const { handlers, formats } = isWav ? { handlers: [], formats: [] } : scanBoxes(buf);
  const hasAudioTrack = isWav || handlers.includes('soun') || formats.some((f) => ['mp4a', 'Opus', 'opus', 'twos', 'sowt'].includes(f));
  const hasVideoTrack = !isWav && (handlers.includes('vide') || formats.some((f) => ['avc1', 'vp09', 'av01'].includes(f)));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const b64 = buf.toString('base64');
  const decoded = await page.evaluate(async (data) => {
    try {
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const ctx = new AudioContext();
      const audio = await ctx.decodeAudioData(bytes.buffer);
      const ch = audio.getChannelData(0);
      let peak = 0;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < ch.length; i += 7) {
        const v = Math.abs(ch[i]);
        if (v > peak) peak = v;
        sum += v * v;
        count++;
      }
      return { ok: true, duration: +audio.duration.toFixed(2), sampleRate: audio.sampleRate, peak: +peak.toFixed(4), rms: +Math.sqrt(sum / count).toFixed(4) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, b64);

  const extra = {};
  if (wantCodecs) {
    extra.codecs = await page.evaluate(() => {
      const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'audio/mp4;codecs=mp4a.40.2'];
      return Object.fromEntries(list.map((m) => [m, MediaRecorder.isTypeSupported(m)]));
    });
  }
  if (wantDiagnose) {
    // A/B hai cách đưa tiếng vào luồng ghi: media element (cách render đang dùng) vs decodeAudioData + BufferSource.
    const wavB64 = (await readFile(path.join(here, 'voiceover.wav'))).toString('base64');
    const diagPage = await browser.newPage({ viewport: { width: 540, height: 960 } });
    await diagPage.goto(`file://${path.join(here, 'index.html')}`);
    extra.pipeline = await diagPage.evaluate(async ({ wavUrl, wavB64 }) => {
      const sample = async (ctx, node) => {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        node.connect(analyser);
        analyser.connect(ctx.destination);
        await ctx.resume();
        node.start?.();
        const data = new Float32Array(analyser.fftSize);
        let peak = 0;
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 20));
          analyser.getFloatTimeDomainData(data);
          for (const v of data) peak = Math.max(peak, Math.abs(v));
        }
        return peak;
      };
      const out = {};
      try {
        const audio = new Audio(wavUrl);
        audio.preload = 'auto';
        const ctx = new AudioContext();
        await audio.play();
        const peak = await sample(ctx, ctx.createMediaElementSource(audio));
        out.mediaElement = { peak: +peak.toFixed(4), state: ctx.state, currentTime: +audio.currentTime.toFixed(2) };
      } catch (e) {
        out.mediaElement = { error: e.message };
      }
      try {
        const bin = atob(wavB64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(bytes.buffer);
        const node = ctx.createBufferSource();
        node.buffer = decoded;
        const peak = await sample(ctx, node);
        out.bufferSource = { peak: +peak.toFixed(4), duration: +decoded.duration.toFixed(2) };
      } catch (e) {
        out.bufferSource = { error: e.message };
      }
      return out;
    }, { wavUrl: `file://${path.join(here, 'voiceover.wav').replaceAll('\\', '/')}`, wavB64 });
  }
  await browser.close();

  const silent = !decoded.ok || decoded.peak < MIN_PEAK;
  console.log(JSON.stringify({
    target: path.relative(process.cwd(), target),
    bytes: buf.length,
    container: isWav ? 'RIFF/WAVE' : 'ISO-BMFF (mp4)',
    hasVideoTrack,
    hasAudioTrack,
    handlers,
    formats,
    decodedAudio: decoded,
    ...extra,
    verdict: silent ? '⛔ SILENT / NO AUDIO' : '✅ AUDIO OK'
  }, null, 2));
  if (silent) process.exit(1);
} catch (error) {
  console.error('verify-audio failed:', error.message);
  process.exit(1);
}
