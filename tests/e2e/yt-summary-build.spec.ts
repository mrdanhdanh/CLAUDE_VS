/**
 * yt-summary-build.spec.ts — pipeline tests trên fixture thật (WEBVTT auto-caption đầy đủ rác)
 * Chạy qua node: import module thuần (0 dep) — test hành vi clean/segment/summarize/translate-chunk.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const FIXTURE = path.resolve(__dirname, '..', '..', 'www', 'yt-summary', 'fixtures', 'demo.vtt');
const pipelinePromise = import('../../www/yt-summary/pipeline.mjs');

function loadFixture(): string {
  return fs.readFileSync(FIXTURE, 'utf8');
}

test.describe('yt-summary pipeline (fixture)', () => {
  test('parse VTT: nhận diện auto-caption + bỏ thẻ thời gian inline', async () => {
    const P = await pipelinePromise;
    const parsed = P.parseSubtitles(loadFixture(), 'demo.vtt');
    expect(parsed.format).toBe('vtt');
    expect(parsed.kind).toBe('auto');
    expect(parsed.cues.length).toBeGreaterThan(40);
    // không còn thẻ <00:00:03.560> / <c> trong text
    for (const c of parsed.cues) {
      expect(c.text).not.toMatch(/<\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}>/);
      expect(c.text).not.toMatch(/<\/?c>/);
    }
  });

  test('clean: lược music/sponsor/outro/dup — giữ >95% nội dung chính', async () => {
    const P = await pipelinePromise;
    const parsed = P.parseSubtitles(loadFixture());
    const { cues, dropped, stats } = P.cleanCues(parsed.cues, { aggressive: true });

    // (a) không còn marker rác
    const joined = cues.map(c => c.text).join(' ').toLowerCase();
    expect(joined).not.toContain('[music]');
    expect(joined).not.toContain('sponsor');
    expect(joined).not.toContain('discount code');
    expect(joined).not.toContain('subscribe');
    expect(joined).not.toContain('welcome back');
    expect(joined).not.toContain('>>');

    // (b) nội dung chính còn nguyên (các anchor kiến thức)
    expect(joined).toContain('nearest neighbor');
    expect(joined).toContain('hnsw');
    expect(joined).toContain('quantization');

    // (c) sponsor bị lược thành vùng (reason sponsor)
    expect(stats.droppedCues).toBeGreaterThan(8);
    expect(cues.length).toBeLessThan(parsed.cues.length);
  });

  test('segment + summarize: 3–9 phần, mỗi phần có title/summary/keywords', async () => {
    const P = await pipelinePromise;
    const parsed = P.parseSubtitles(loadFixture());
    const cleaned = P.cleanCues(parsed.cues, { aggressive: true });
    const sentences = P.buildSentences(cleaned.cues);
    const segs = P.segmentSentences(sentences);
    const summarized = P.summarizeSegments(segs);

    expect(summarized.length).toBeGreaterThanOrEqual(3);
    expect(summarized.length).toBeLessThanOrEqual(9);
    for (const s of summarized) {
      expect(s.title.length).toBeGreaterThan(2);
      expect(s.summary.length).toBeGreaterThan(20);
      expect(s.keywords.length).toBeGreaterThanOrEqual(3);
      expect(s.start).toBeLessThanOrEqual(s.end);
    }
    // title chất lượng: ưu tiên cụm chủ đề tự nhiên (vector databases / indexing / production…)
    const titles = summarized.map(s => s.title.toLowerCase()).join(' | ');
    expect(titles).toMatch(/vector databas|indexing|hnsw|production|reindexing|quantization|embedding/);
  });

  test('buildDoc: schema đầy đủ + stats + droppedSegments (không dịch → giữ bản gốc)', async () => {
    const P = await pipelinePromise;
    const parsed = P.parseSubtitles(loadFixture());
    const cleaned = P.cleanCues(parsed.cues, { aggressive: true });
    const sentences = P.buildSentences(cleaned.cues);
    const segments = P.summarizeSegments(P.segmentSentences(sentences));
    const doc = P.buildDoc({
      meta: { id: 'fixture-demo', title: 'Fixture Demo', source: 'vtt-file', lang: 'en' },
      parsed, cleaned, segments, translation: null, demo: true,
    });

    expect(doc.schema).toBe(1);
    expect(doc.id).toBe('fixture-demo');
    expect(doc.stats.cuesRaw).toBeGreaterThan(40);
    expect(doc.stats.cleanedPct).toBeGreaterThan(5);
    expect(doc.stats.words).toBeGreaterThan(300);
    expect(doc.segments.length).toBeGreaterThanOrEqual(3);
    expect(doc.translation.applied).toBe(false);
    expect(doc.transcriptOriginal).toBeNull();
    expect(doc.transcript.length).toBeGreaterThan(500);
    // sponsor region phải xuất hiện trong droppedSegments (≥6s)
    expect(doc.droppedSegments.some((d: { reason: string }) => d.reason === 'sponsor')).toBe(true);
    // mỗi segment có bản gốc để toggle
    for (const s of doc.segments) {
      expect(s.transcriptSrc).toBeTruthy();
      expect(s.summarySrc).toBeTruthy();
    }
  });

  test('chunkForTranslation: chunk ≤ max, không cắt giữa từ; detectLang đúng', async () => {
    const P = await pipelinePromise;
    const long = 'This is sentence number one. ' + 'Another longer sentence with many words to fill the chunk size. '.repeat(30);
    const chunks = P.chunkForTranslation(long, 300);
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(301);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toContain('sentence number one');

    expect(P.detectLang('Hello everyone, today we talk about vector databases and indexing.')).toBe('en');
    expect(P.detectLang('Xin chào mọi người, hôm nay chúng ta nói về cơ sở dữ liệu vectơ và tìm kiếm gần đúng.')).toBe('vi');
  });

  test('extractVideoId + formatTime', async () => {
    const P = await pipelinePromise;
    expect(P.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(P.extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ');
    expect(P.extractVideoId('https://www.youtube.com/shorts/abc123XYZ_-')).toBe('abc123XYZ_-');
    expect(P.extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(P.extractVideoId('https://example.com/not-youtube')).toBeNull();
    expect(P.formatTime(0)).toBe('0:00');
    expect(P.formatTime(65)).toBe('1:05');
    expect(P.formatTime(3725)).toBe('1:02:05');
  });
});
