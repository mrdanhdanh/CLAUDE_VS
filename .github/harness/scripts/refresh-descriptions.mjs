#!/usr/bin/env node
/**
 * Refresh registry descriptions ← SKILL.md frontmatter.
 *
 * Vì sao cần: `loadRegistry()` (harness-manager) chỉ THÊM entry thiếu — không refresh
 * description cũ. Sau mỗi lần `distill-agnostic.mjs` regenerate 5 skill `harness-*`
 * (KN list trong frontmatter đổi), registry giữ mô tả cũ → stale âm thầm nhiều ngày.
 * Bước này thuộc maintenance chain sau khi thêm KN mới.
 *
 *   node .github/harness/scripts/refresh-descriptions.mjs --check   # dry-run; exit 1 nếu stale
 *   node .github/harness/scripts/refresh-descriptions.mjs --apply   # ghi registry.json
 *
 * Quy ước khớp harness-manager.mjs: description slice(0, 300), bỏ ngoặc kép bao ngoài.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const REGISTRY = path.join(ROOT, '.github', 'harness', 'registry.json');
const SKILLS_DIR = path.join(ROOT, '.github', 'skills');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const check = args.includes('--check') || !apply;
if (args.includes('--help')) {
  console.log('Usage: refresh-descriptions.mjs [--check|--apply]');
  process.exit(0);
}

try {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const stale = [];

  for (const [name, entry] of Object.entries(reg.skills || {})) {
    const rel = entry.file || path.join(name, 'SKILL.md');
    const full = path.join(SKILLS_DIR, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const dm = fm[1].match(/^\s*description:\s*([\s\S]+?)\s*$/m);
    if (!dm) continue;
    let desc = dm[1].trim();
    if ((desc.startsWith('"') && desc.endsWith('"')) || (desc.startsWith("'") && desc.endsWith("'"))) {
      desc = desc.slice(1, -1);
    }
    desc = desc.slice(0, 300);
    if (desc !== entry.description) stale.push({ name, desc });
  }

  if (stale.length === 0) {
    console.log('✅ registry descriptions: 0 stale');
    process.exit(0);
  }
  for (const { name, desc } of stale) {
    console.log(`⚠️  stale: ${name} — ${desc.slice(0, 70)}…`);
  }
  if (check) {
    console.error(`\n❌ ${stale.length} description stale — chạy lại với --apply`);
    process.exit(1);
  }
  for (const { name, desc } of stale) {
    reg.skills[name].description = desc;
  }
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  console.log(`✅ registry updated: ${stale.length} description`);
} catch (e) {
  console.error('refresh-descriptions failed:', e.message);
  process.exit(2);
}
