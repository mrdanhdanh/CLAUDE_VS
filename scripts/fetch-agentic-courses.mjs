#!/usr/bin/env node
/**
 * fetch-agentic-courses.mjs — Tải TOÀN BỘ nội dung công khai (verbatim) của các
 * nguồn khóa học AI Agentic MIỄN PHÍ về docs/ai-agentic-courses/full/<source-id>/
 * để dùng offline + nạp RAG (không cần fetch lại sau này).
 *
 * Nguồn có repo công khai:
 *   1. microsoft/ai-agents-for-beginners (MIT)       — 19 lesson READMEs + README + STUDY_GUIDE + AGENTS + LICENSE
 *   2. huggingface/agents-course        (Apache-2.0) — toàn bộ units/en/** (mdx → md)
 *   3. anthropics/courses               (xem LICENSE) — 5 khóa: README + notebook (ipynb → md, bỏ outputs)
 *
 * Node 18+ (global fetch), 0 dependencies.
 *
 * Usage:
 *   node scripts/fetch-agentic-courses.mjs             # tải, bỏ qua file đã có
 *   node scripts/fetch-agentic-courses.mjs --force     # tải lại toàn bộ
 *   node scripts/fetch-agentic-courses.mjs --only huggingface-agents-course
 *   node scripts/fetch-agentic-courses.mjs --list      # chỉ liệt kê file sẽ tải (không tải)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_ROOT = path.resolve(__dirname, '..', 'docs', 'ai-agentic-courses', 'full');

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const LIST_ONLY = argv.includes('--list');
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const UA = { 'User-Agent': 'claude-harness-fetch-agentic-courses' };
const API = 'https://api.github.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const timeout = () => AbortSignal.timeout(30000);

async function ghJson(url) {
  const res = await fetch(url, { headers: UA, signal: timeout() });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
}

async function ghRaw(repo, branch, p) {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${p.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { headers: UA, signal: timeout() });
  if (!res.ok) throw new Error(`RAW ${res.status}: ${p}`);
  return res.text();
}

/** ipynb → markdown (markdown cells + code cells, bỏ outputs cho nhẹ) */
function ipynbToMd(text) {
  let nb;
  try { nb = JSON.parse(text); } catch { return null; }
  const out = [];
  for (const cell of nb.cells ?? []) {
    const src = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
    if (!src.trim()) continue;
    if (cell.cell_type === 'markdown') out.push(src.trim());
    else if (cell.cell_type === 'code') out.push('```python\n' + src.replace(/[ \t]+$/gm, '').trim() + '\n```');
  }
  return out.join('\n\n');
}

const SOURCES = [
  {
    id: 'microsoft-ai-agents-for-beginners',
    repo: 'microsoft/ai-agents-for-beginners',
    branch: 'main',
    label: 'Microsoft — AI Agents for Beginners',
    async list() {
      const entries = await ghJson(`${API}/repos/${this.repo}/contents?ref=${this.branch}`);
      const lessons = entries
        .filter((e) => e.type === 'dir' && /^\d{2}-/.test(e.name))
        .map((e) => e.name)
        .sort();
      return [...lessons.map((d) => `${d}/README.md`), 'README.md', 'STUDY_GUIDE.md', 'AGENTS.md', 'LICENSE'];
    },
  },
  {
    id: 'huggingface-agents-course',
    repo: 'huggingface/agents-course',
    branch: 'main',
    label: 'Hugging Face — Agents Course',
    async list() {
      const tree = await ghJson(`${API}/repos/${this.repo}/git/trees/${this.branch}?recursive=1`);
      if (tree.truncated) console.warn('  ⚠ tree truncated — danh sách có thể thiếu');
      return tree.tree
        .filter((e) => e.type === 'blob')
        .map((e) => e.path)
        .filter((p) => /^units\/en\/.+\.(md|mdx)$/.test(p) || p === 'LICENSE');
    },
  },
  {
    id: 'anthropic-courses-github',
    repo: 'anthropics/courses',
    branch: 'master',
    label: 'Anthropic — courses (GitHub)',
    async list() {
      const tree = await ghJson(`${API}/repos/${this.repo}/git/trees/${this.branch}?recursive=1`);
      if (tree.truncated) console.warn('  ⚠ tree truncated — danh sách có thể thiếu');
      return tree.tree
        .filter((e) => e.type === 'blob')
        .map((e) => e.path)
        .filter((p) => /\.(md|ipynb|py|txt)$/.test(p) || p === 'LICENSE')
        .filter((p) => !/(^|\/)(images?|\.github)\//i.test(p));
    },
  },
];

function relOutPath(source, repoPath) {
  let rel = repoPath;
  if (source.id === 'huggingface-agents-course') rel = rel.replace(/^units\/en\//, '');
  rel = rel.replace(/\.mdx$/, '.md').replace(/\.ipynb$/, '.md');
  const parts = rel.split('/').filter((s) => s && s !== '.' && s !== '..');
  return path.join(DEST_ROOT, source.id, ...parts);
}

async function main() {
  const manifest = { fetchedAt: new Date().toISOString(), script: 'scripts/fetch-agentic-courses.mjs', repos: [] };
  let grandFiles = 0;
  let grandBytes = 0;

  for (const src of SOURCES) {
    if (ONLY && ONLY !== src.id) continue;
    console.log(`\n▶ ${src.label}  [${src.repo}@${src.branch}]`);

    let files;
    try {
      files = await src.list();
    } catch (err) {
      console.error(`  ✗ Không lấy được danh sách file: ${err.message}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`  • ${files.length} file trong nguồn`);
    if (LIST_ONLY) {
      for (const f of files) console.log(`    - ${f}`);
      continue;
    }

    let ok = 0; let skip = 0; let fail = 0; let bytes = 0;
    for (const p of files) {
      const dest = relOutPath(src, p);
      try {
        if (existsSync(dest) && !FORCE) { skip++; continue; }
        const text = await ghRaw(src.repo, src.branch, p);
        const content = p.endsWith('.ipynb') ? ipynbToMd(text) : text;
        if (content == null) { console.error(`  ✗ notebook parse fail: ${p}`); fail++; continue; }
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, content, 'utf8');
        ok++;
        bytes += Buffer.byteLength(content, 'utf8');
        await sleep(25);
      } catch (err) {
        fail++;
        console.error(`  ✗ ${p}: ${err.message}`);
      }
    }
    console.log(`  ✓ ${src.id}: tải ${ok} · bỏ qua ${skip} · lỗi ${fail} · ${(bytes / 1024).toFixed(1)} KB`);
    manifest.repos.push({
      id: src.id,
      repo: src.repo,
      branch: src.branch,
      url: `https://github.com/${src.repo}`,
      totalInSource: files.length,
      downloaded: ok,
      skipped: skip,
      failed: fail,
      bytes,
      paths: files,
    });
    grandFiles += ok;
    grandBytes += bytes;
  }

  if (!LIST_ONLY) {
    manifest.totals = { downloaded: grandFiles, bytes: grandBytes };
    await mkdir(DEST_ROOT, { recursive: true });
    await writeFile(path.join(DEST_ROOT, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n✅ TỔNG: ${grandFiles} file mới · ${(grandBytes / 1024).toFixed(1)} KB → docs/ai-agentic-courses/full/`);
    console.log('   Manifest (nguồn gốc từng file): docs/ai-agentic-courses/full/_manifest.json');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
