#!/usr/bin/env node
/**
 * Library Ingest BATCH — nạp HÀNG LOẠT file .md/.txt vào www/library/export.json
 *
 * - Dùng cho corpus khóa học: docs/ai-agentic-courses/full/** (200+ file)
 * - Chunk: GIỐNG library-ingest.mjs / www/library/app.js (CHUNK_SIZE 2400, overlap 400, estimatePage)
 *   ⚠ Khi sửa chunking ở www/library/app.js → cập nhật CẢ 3 nơi (app.js, library-ingest.mjs, file này)
 * - Batch tối ưu: đọc export.json 1 lần · 1 backup · 1 write · validate JSON sau ghi
 * - Dedupe: sách cùng tên đã có → skip (idempotent — chạy lại không nhân bản)
 * - An toàn: backup pattern library-export-*.json (gitignored) + JSON.parse validate + exit code theo failures
 *
 * Usage:
 *   node scripts/library-ingest-batch.mjs [--dir <path>] [--dry-run] [--limit N] [--replace] [--include-license]
 *
 * Default dir: docs/ai-agentic-courses/full
 *   --dry-run           chỉ liệt kê kế hoạch, không ghi
 *   --limit N           chỉ xử lý N file đầu (test nhanh)
 *   --replace           sách cùng tên đã có → xóa rồi nạp lại (dùng khi corpus cập nhật)
 *   --include-license   nạp cả file LICENSE (mặc định bỏ)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXPORT_PATH = path.join(ROOT, 'www', 'library', 'export.json');
const DEFAULT_DIR = path.join(ROOT, 'docs', 'ai-agentic-courses', 'full');
const CHUNK_SIZE = 2400;
const CHUNK_OVERLAP = 400;

// ---------- args ----------
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n/, ''));
  process.exit(0);
}
const dryRun = argv.includes('--dry-run');
const replace = argv.includes('--replace');
const includeLicense = argv.includes('--include-license');
const dirIdx = argv.indexOf('--dir');
const limitIdx = argv.indexOf('--limit');
const scanDir = dirIdx >= 0 ? path.resolve(ROOT, argv[dirIdx + 1] || '') : DEFAULT_DIR;
const limit = limitIdx >= 0 ? Math.max(1, parseInt(argv[limitIdx + 1], 10) || 0) : 0;
if (!fs.existsSync(scanDir) || !fs.statSync(scanDir).isDirectory()) {
  console.error(`❌ Không thấy thư mục: ${scanDir}`);
  process.exit(1);
}

// ---------- helpers (ĐỒNG BỘ với library-ingest.mjs + www/library/app.js) ----------
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

// ---------- labels nguồn → tên sách đẹp ----------
const LABELS = {
  'microsoft-ai-agents-for-beginners': 'Microsoft AI Agents',
  'huggingface-agents-course': 'HF Agents Course',
  'anthropic-courses-github': 'Anthropic Courses',
  'langchain-academy': 'LangChain Academy',
  'aws-skill-builder': 'AWS Skill Builder',
  'google-skills': 'Google Skills',
};
function bookNameFor(rel) {
  const segs = rel.split('/');
  const label = LABELS[segs[0]] || segs[0];
  let rest = segs.slice(1).join('/').replace(/\.(md|markdown|txt)$/i, '');
  if (rest.endsWith('/README')) rest = rest.slice(0, -'/README'.length);
  return `${label} — ${rest}`;
}

// ---------- walk ----------
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full, out); continue; }
    if (!entry.isFile()) continue;
    const isLicense = /^LICENSE$/i.test(entry.name);
    if (!/\.(md|markdown|txt)$/i.test(entry.name) && !isLicense) continue;
    out.push(full);
  }
  return out;
}

// ---------- main ----------
function main() {
  const t0 = Date.now();
  console.log(`📚 Library Ingest BATCH — ${path.relative(ROOT, scanDir)}`);
  const all = walk(scanDir).sort();
  let files = all
    .map((abs) => ({ abs, rel: path.relative(scanDir, abs).split(path.sep).join('/') }))
    .filter(({ rel }) => rel.includes('/')); // bỏ file meta ở root (README.md của corpus)
  const skippedRoot = all.length - files.length;
  const licenseCount = files.filter(({ rel }) => /(^|\/)LICENSE$/i.test(rel)).length;
  if (!includeLicense) files = files.filter(({ rel }) => !/(^|\/)LICENSE$/i.test(rel));
  if (limit) files = files.slice(0, limit);
  console.log(`   Quét: ${all.length} file · kế hoạch: ${files.length} (bỏ ${skippedRoot} meta root${includeLicense ? '' : `, ${licenseCount} LICENSE`})`);

  // load export hiện có
  let data = { version: 1, exportedAt: new Date().toISOString(), registry: {}, chunks: [] };
  if (fs.existsSync(EXPORT_PATH)) data = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const registry = data.registry || (data.registry = {});
  const chunks = data.chunks || (data.chunks = []);
  const byName = new Map();
  for (const b of Object.values(registry)) {
    const k = String(b.name || '').toLowerCase();
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(b);
  }

  // pass 1 — phân loại
  const plan = [];
  const seen = new Set();
  let skipDup = 0;
  for (const { abs, rel } of files) {
    const name = bookNameFor(rel);
    const key = name.toLowerCase();
    if (seen.has(key)) { console.log(`   ⚠ trùng tên trong batch, bỏ: ${rel}`); continue; }
    seen.add(key);
    const existing = byName.get(key) || [];
    if (existing.length && !replace) { skipDup++; continue; }
    plan.push({ abs, rel, name, existing });
  }

  if (dryRun) {
    console.log(`   Kế hoạch nạp: ${plan.length} sách · đã có (skip): ${skipDup}${replace ? ' · replace: xóa bản cũ' : ''}`);
    for (const p of plan.slice(0, 40)) console.log(`     + ${p.name}`);
    if (plan.length > 40) console.log(`     … và ${plan.length - 40} file nữa`);
    console.log('(dry-run — không ghi gì)');
    return;
  }

  // pass 2 — đọc + chunk
  const perSource = new Map(); // label -> {files, chunks}
  const newChunks = [];
  const removedIds = new Set();
  let added = 0; let failed = 0; let empty = 0;
  for (const p of plan) {
    try {
      const text = fs.readFileSync(p.abs, 'utf8');
      if (!text.trim()) { empty++; console.log(`   ⚠ rỗng, bỏ: ${p.rel}`); continue; }
      const st = fs.statSync(p.abs);
      for (const old of p.existing) removedIds.add(old.id);
      const id = uid(p.name);
      const bookChunks = chunkText(text, id, p.name, 1);
      if (bookChunks.length === 0) { failed++; console.log(`   ✗ 0 chunk: ${p.rel}`); continue; }
      registry[id] = {
        id,
        name: p.name,
        type: /\.txt$/i.test(p.rel) ? 'txt' : 'md',
        enabled: true,
        read: false,
        progress: 0,
        chunks: bookChunks.length,
        size: st.size,
        addedAt: new Date().toISOString(),
        pages: 1,
      };
      newChunks.push(...bookChunks);
      added++;
      const label = p.name.split(' — ')[0];
      const s = perSource.get(label) || { files: 0, chunks: 0 };
      s.files++; s.chunks += bookChunks.length;
      perSource.set(label, s);
      console.log(`   ✓ ${p.name}  (${bookChunks.length} chunks)`);
    } catch (err) {
      failed++;
      console.error(`   ✗ ${p.rel}: ${err.message}`);
    }
  }

  if (added === 0) {
    console.log(`\nℹ️  Không có gì mới — export.json giữ nguyên (đã có: ${skipDup}${failed ? ` · lỗi: ${failed}` : ''}).`);
    if (failed) process.exitCode = 1;
    return;
  }

  // pass 3 — ghi (1 lần)
  data.chunks = chunks.filter((c) => !removedIds.has(c.bookId));
  data.chunks.push(...newChunks);
  data.exportedAt = new Date().toISOString();

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const bak = path.join(ROOT, 'www', 'library', `library-export-${stamp}-pre-batch.json`);
  if (fs.existsSync(EXPORT_PATH)) {
    fs.copyFileSync(EXPORT_PATH, bak);
    console.log(`🗄  Backup: ${path.relative(ROOT, bak)}`);
  }
  fs.writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2), 'utf8');

  try {
    const v = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
    if (!v.registry || !Array.isArray(v.chunks)) throw new Error('shape sai');
  } catch (e) {
    console.error('❌ JSON invalid sau khi ghi:', e.message, '— khôi phục từ backup!');
    if (fs.existsSync(bak)) fs.copyFileSync(bak, EXPORT_PATH);
    process.exit(1);
  }

  const outMB = (fs.statSync(EXPORT_PATH).size / 1024 / 1024).toFixed(2);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n── Tổng theo nguồn ──');
  for (const [label, s] of [...perSource.entries()].sort((a, b) => b[1].files - a[1].files)) {
    console.log(`   ${label.padEnd(22)} ${String(s.files).padStart(3)} files · ${s.chunks} chunks`);
  }
  console.log(`\n✅ Đã nạp ${added} sách mới — ${newChunks.length} chunks (${secs}s) · skip: ${skipDup} · lỗi: ${failed}${empty ? ` · rỗng: ${empty}` : ''}${removedIds.size ? ` · xóa cũ: ${removedIds.size} sách (--replace)` : ''}`);
  console.log(`📊 Library: ${Object.keys(registry).length} sách · ${data.chunks.length} chunks · export.json ${outMB} MB · JSON OK`);
  if (failed) process.exitCode = 1;
}

try {
  main();
} catch (e) {
  console.error('❌ Batch thất bại:', e.message);
  process.exit(1);
}
