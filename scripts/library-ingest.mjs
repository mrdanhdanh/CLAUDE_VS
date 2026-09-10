#!/usr/bin/env node
/**
 * Library Ingest — nạp file (PDF/MD/TXT) vào www/library/export.json
 *
 * - PDF: Playwright headless + pdf.js 3.11.174 (cdnjs) — parse GIỐNG www/library/app.js parsePDF()
 *        (mỗi trang: items.map(str).join(' ') + '\n\n')
 * - Chunk: GIỐNG app.js chunkText() (CHUNK_SIZE 2400, overlap 400, estimatePage same)
 * - An toàn: backup export.json (pattern library-export-*.json — gitignored) + validate JSON sau ghi
 * - Dedupe: cùng tên + size đã có → skip
 *
 * Usage:
 *   node scripts/library-ingest.mjs <file> [--name "Tên sách"] [--peek]
 *
 * Examples:
 *   node scripts/library-ingest.mjs books/cosmo.pdf --peek
 *   node scripts/library-ingest.mjs books/cosmo.pdf --name "Cosmos — Cosmos"
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const EXPORT_PATH = path.join(ROOT, 'www', 'library', 'export.json');
const CHUNK_SIZE = 2400;
const CHUNK_OVERLAP = 400;
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ---------- args ----------
const argv = process.argv.slice(2);
const peek = argv.includes('--peek');
const nameIdx = argv.indexOf('--name');
const customName = nameIdx >= 0 ? (argv[nameIdx + 1] || '') : '';
const fileArg = argv.find(a => !a.startsWith('--') && a !== customName);
if (!fileArg) {
  console.error('Usage: node scripts/library-ingest.mjs <file> [--name "Tên sách"] [--peek]');
  process.exit(1);
}
const FILE_PATH = path.resolve(ROOT, fileArg);
if (!fs.existsSync(FILE_PATH)) {
  console.error(`❌ Không thấy file: ${FILE_PATH}`);
  process.exit(1);
}
const ext = path.extname(FILE_PATH).toLowerCase();
if (!['.pdf', '.md', '.markdown', '.txt'].includes(ext)) {
  console.error(`❌ Chỉ hỗ trợ .pdf/.md/.txt — nhận "${ext}"`);
  process.exit(1);
}
const isPdf = ext === '.pdf';

// ---------- helpers (copy nguyên logic app.js) ----------
function uid(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'sach';
  return base + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}
function estimatePage(idx, total, pages) {
  if (!pages || pages <= 1) return idx + 1;
  return Math.min(pages, Math.max(1, Math.round((idx + 1) / Math.max(1, total) * pages) || 1));
}
function chunkText(text, bookId, bookName, pages) {
  const chunks = [];
  const paras = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  let current = '';
  let idx = 0;
  const pushChunk = (t) => {
    if (!t.trim()) return;
    if (t.length <= CHUNK_SIZE) {
      chunks.push({ id: `${bookId}#${String(idx).padStart(3, '0')}`, bookId, bookName, index: idx, text: t, page: estimatePage(idx, chunks.length, pages) });
      idx++;
    } else {
      const sentences = t.split(/(?<=[.!?。！？])\s+/);
      let buf = '';
      for (const s of sentences) {
        if ((buf + ' ' + s).length > CHUNK_SIZE) {
          if (buf) {
            chunks.push({ id: `${bookId}#${String(idx).padStart(3, '0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length, pages) });
            idx++;
            const overlap = buf.slice(-CHUNK_OVERLAP);
            buf = overlap + ' ' + s;
          } else {
            for (let i = 0; i < s.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
              const part = s.slice(i, i + CHUNK_SIZE);
              chunks.push({ id: `${bookId}#${String(idx).padStart(3, '0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length, pages) });
              idx++;
            }
            buf = '';
          }
        } else {
          buf = buf ? buf + ' ' + s : s;
        }
      }
      if (buf) {
        chunks.push({ id: `${bookId}#${String(idx).padStart(3, '0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length, pages) });
        idx++;
      }
    }
  };
  for (const p of paras) {
    if ((current + '\n\n' + p).length > CHUNK_SIZE) {
      if (current) pushChunk(current);
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = overlap ? overlap + '\n\n' + p : p;
      if (current.length > CHUNK_SIZE * 1.5) {
        pushChunk(current);
        current = '';
      }
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) pushChunk(current);
  if (chunks.length === 0 && text.trim()) {
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      const part = text.slice(i, i + CHUNK_SIZE);
      chunks.push({ id: `${bookId}#${String(idx).padStart(3, '0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length, pages) });
      idx++;
    }
  }
  return chunks;
}

// ---------- static server tối giản (origin thật cho pdf.js) ----------
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (req.url === '/_ingest.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html><html><head><meta charset="utf-8"><script src="${PDFJS}"></script></head><body>ingest</body></html>`);
      } else {
        res.writeHead(404);
        res.end('not found');
      }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// ---------- extract PDF (giống parsePDF app.js + metadata) ----------
async function extractPDF(filePath, { peekOnly = false } = {}) {
  const b64 = fs.readFileSync(filePath).toString('base64');
  const srv = await startServer();
  const port = srv.address().port;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/_ingest.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => typeof window.pdfjsLib !== 'undefined', null, { timeout: 60000 });
    const res = await page.evaluate(async ({ b64, peekOnly, workerUrl }) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pages = pdf.numPages;
      let meta = {};
      try { const md = await pdf.getMetadata(); meta = (md && md.info) || {}; } catch (e) {}
      if (peekOnly) {
        const pageChars = [];
        let sample = '';
        let samplePage = 0;
        for (let i = 1; i <= pages; i++) {
          const pg = await pdf.getPage(i);
          const content = await pg.getTextContent();
          const t = content.items.map(it => it.str || '').join(' ');
          pageChars.push(t.trim().length);
          if (!sample && t.trim().length > 40) { sample = t; samplePage = i; }
        }
        return { title: String(meta.Title || '').trim(), author: String(meta.Author || '').trim(), pages, text: sample, pageChars, samplePage };
      }
      let full = '';
      for (let i = 1; i <= pages; i++) {
        const pg = await pdf.getPage(i);
        const content = await pg.getTextContent();
        full += content.items.map(it => it.str || '').join(' ') + '\n\n';
      }
      return { title: String(meta.Title || '').trim(), author: String(meta.Author || '').trim(), pages, text: full };
    }, { b64, peekOnly, workerUrl: PDFJS_WORKER });
    return res;
  } finally {
    await browser.close();
    srv.close();
  }
}

// ---------- main ----------
async function main() {
  const t0 = Date.now();
  const st = fs.statSync(FILE_PATH);
  console.log(`📚 Library Ingest — ${path.relative(ROOT, FILE_PATH)} (${(st.size / 1024 / 1024).toFixed(2)} MB)`);

  let extracted;
  if (isPdf) {
    console.log('⏳ Trích text bằng pdf.js (Playwright headless)…');
    extracted = await extractPDF(FILE_PATH, { peekOnly: peek });
  } else {
    extracted = { title: '', author: '', pages: 1, text: fs.readFileSync(FILE_PATH, 'utf8') };
    if (peek) extracted.text = extracted.text.slice(0, 600);
  }

  console.log(`   Title : ${extracted.title || '(none)'}`);
  console.log(`   Author: ${extracted.author || '(none)'}`);
  console.log(`   Pages : ${extracted.pages} · Text: ${extracted.text.length} chars`);

  if (peek) {
    if (extracted.pageChars) {
      const withText = extracted.pageChars.filter(c => c > 40).length;
      const totalChars = extracted.pageChars.reduce((a, b) => a + b, 0);
      console.log(`   Scan : ${withText}/${extracted.pages} trang có text · ${totalChars} chars tổng`);
      if (withText === 0) {
        console.log('   ⚠️  PDF scan (ảnh, không có text layer) — chưa hỗ trợ OCR, không ingest được.');
      } else {
        console.log(`   Sample: trang ${extracted.samplePage}`);
      }
    }
    console.log('--- PEEK (đoạn đầu để nhận diện) ---');
    console.log(extracted.text.replace(/\s+/g, ' ').slice(0, 300).trim() || '(trống)');
    console.log('------------------------------------');
    return;
  }

  let safeTitle = (extracted.title || '').trim();
  if (/\uFFFD|\u00EF\u00BF\u00BD|\u02D9/.test(safeTitle)) safeTitle = ''; // metadata mojibake → fallback tên file
  const bookName = customName || safeTitle || path.basename(FILE_PATH);
  let data = { version: 1, exportedAt: new Date().toISOString(), registry: {}, chunks: [] };
  if (fs.existsSync(EXPORT_PATH)) data = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const registry = data.registry || (data.registry = {});
  const chunks = data.chunks || (data.chunks = []);

  const dup = Object.values(registry).find(b => b.name === bookName && b.size === st.size);
  if (dup) {
    console.log(`⏭  Đã có trong Library: “${dup.name}” (${dup.chunks} chunks) — bỏ qua.`);
    return;
  }

  const id = uid(path.basename(FILE_PATH));
  console.log(`✂️  Chunking 2400/400 (giống app.js)… id=${id}`);
  const bookChunks = chunkText(extracted.text, id, bookName, extracted.pages);
  if (bookChunks.length === 0) {
    console.error('❌ Không tạo được chunk — file rỗng hoặc PDF scan (chưa hỗ trợ OCR).');
    process.exit(1);
  }

  registry[id] = {
    id,
    name: bookName,
    type: isPdf ? 'pdf' : (ext === '.txt' ? 'txt' : 'md'),
    enabled: true,
    read: false,
    progress: 0,
    chunks: bookChunks.length,
    size: st.size,
    addedAt: new Date().toISOString(),
    pages: extracted.pages,
  };
  chunks.push(...bookChunks);
  data.exportedAt = new Date().toISOString();

  // backup (pattern library-export-*.json → đã gitignore)
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const bak = path.join(ROOT, 'www', 'library', `library-export-${stamp}-pre-${path.basename(FILE_PATH, ext)}.json`);
  if (fs.existsSync(EXPORT_PATH)) {
    fs.copyFileSync(EXPORT_PATH, bak);
    console.log(`🗄  Backup: ${path.relative(ROOT, bak)}`);
  }

  fs.writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2), 'utf8');

  // validate
  try {
    const v = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
    if (!v.registry || !Array.isArray(v.chunks)) throw new Error('shape sai');
  } catch (e) {
    console.error('❌ JSON invalid sau khi ghi:', e.message);
    process.exit(1);
  }
  const outMB = (fs.statSync(EXPORT_PATH).size / 1024 / 1024).toFixed(2);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Đã nạp “${bookName}” — ${bookChunks.length} chunks · ${extracted.pages} trang (${secs}s)`);
  console.log(`📊 Library: ${Object.keys(registry).length} sách · ${chunks.length} chunks · export.json ${outMB} MB · JSON OK`);
}

main().catch(e => { console.error('❌ Ingest thất bại:', e.message); process.exit(1); });
