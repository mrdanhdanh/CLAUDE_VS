#!/usr/bin/env node
/**
 * Archify generate helper — tạo candidate JSON + validate + deliver trong 1 lệnh
 * Usage: node .github/skills/archify/scripts/generate.mjs --type architecture --input candidate.json --output out.html [--quality showcase]
 * Hoặc: node generate.mjs --type workflow --prompt "CI/CD with approval" --output out.html
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');
const VENDOR_DIR = path.join(SKILL_DIR, 'vendor', 'archify');
// bin nằm ở vendor/archify/archify/bin (repo root chứa skill package con) — fallback vendor/archify/bin
const BIN = existsSync(path.join(VENDOR_DIR, 'archify', 'bin', 'archify.mjs'))
  ? path.join(VENDOR_DIR, 'archify', 'bin', 'archify.mjs')
  : path.join(VENDOR_DIR, 'bin', 'archify.mjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { type: 'architecture', quality: 'showcase' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i+1]) opts.type = args[++i];
    else if (args[i] === '--input' && args[i+1]) opts.input = args[++i];
    else if (args[i] === '--output' && args[i+1]) opts.output = args[++i];
    else if (args[i] === '--quality' && args[i+1]) opts.quality = args[++i];
    else if (args[i] === '--prompt' && args[i+1]) opts.prompt = args[++i];
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage:
  node generate.mjs --type <architecture|workflow|sequence|dataflow|lifecycle> --input <candidate.json> --output <out.html> [--quality showcase]
  node generate.mjs --type architecture --prompt "Browser -> API -> DB" --output out.html
Options:
  --type     diagram type (default: architecture)
  --input    candidate JSON path (nếu có sẵn)
  --prompt   mô tả để gợi ý (dùng với --type để guide)
  --output   output HTML path (bắt buộc cho deliver)
  --quality  showcase|standard (default: showcase)`);
      process.exit(0);
    }
  }
  return opts;
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts });
    if (out) console.log(out.slice(0, 2000));
    return { ok: true, out };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '') || e.message;
    console.log(out.slice(0, 3000));
    return { ok: false, out, status: e.status };
  }
}

async function main() {
  const opts = parseArgs();
  const validTypes = ['architecture','workflow','sequence','dataflow','lifecycle'];
  if (!validTypes.includes(opts.type)) {
    console.error(`❌ --type phải là một trong: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Check vendor
  if (!existsSync(BIN)) {
    console.error(`❌ Chưa cài vendor/archify. Chạy:\n  node .github/skills/archify/scripts/install.mjs\nHoặc global: npx skills add tt-a1i/archify -g`);
    process.exit(1);
  }

  // If --prompt without --input: use guide to suggest type
  if (opts.prompt && !opts.input) {
    console.log(`🔍 Guide cho prompt: "${opts.prompt}"`);
    run(`node "${BIN}" guide "${opts.prompt.replace(/"/g, '\\"')}" --json`);
    console.log(`\n💡 Hãy tạo candidate JSON theo schema rồi chạy lại với --input <candidate.json> --output <out.html>`);
    console.log(`   Schema: vendor/archify/schemas/${opts.type}.schema.json`);
    console.log(`   Example: vendor/archify/examples/`);
    return;
  }

  if (!opts.input) {
    console.error(`❌ Thiếu --input <candidate.json> (hoặc dùng --prompt để guide)`);
    process.exit(1);
  }
  if (!existsSync(opts.input)) {
    console.error(`❌ Không tìm thấy input: ${opts.input}`);
    process.exit(1);
  }
  if (!opts.output) {
    console.error(`❌ Thiếu --output <out.html>`);
    process.exit(1);
  }

  // Validate
  console.log(`\n🔍 Validate ${opts.type} ${opts.input} --quality ${opts.quality} ...`);
  const v = run(`node "${BIN}" validate ${opts.type} "${opts.input}" --quality ${opts.quality} --json`);
  if (!v.ok) {
    console.log(`\n❌ Validate failed — sửa theo diagnostics[].supportedFixes rồi chạy lại.`);
    console.log(`   Chi tiết: node "${BIN}" validate ${opts.type} "${opts.input}" --quality ${opts.quality} --json`);
    process.exit(1);
  }
  console.log(`✅ Validate passed (showcase)`);

  // Deliver
  console.log(`\n📦 Deliver ${opts.type} ${opts.input} → ${opts.output} ...`);
  await fs.mkdir(path.dirname(path.resolve(opts.output)), { recursive: true });
  const d = run(`node "${BIN}" deliver ${opts.type} "${opts.input}" "${opts.output}" --quality ${opts.quality} --json`);
  if (!d.ok) {
    console.error(`❌ Deliver failed — xem diagnostics trên.`);
    process.exit(1);
  }
  console.log(`✅ Delivered: ${opts.output}`);
  console.log(`   Mở: file:///${path.resolve(opts.output).replace(/\\/g, '/')}`);

  // Optional visual-check hint
  console.log(`\n🔍 (Optional) Browser evidence:\n  node "${BIN}" visual-check "${opts.output}" --json`);
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
