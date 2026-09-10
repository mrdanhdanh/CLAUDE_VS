#!/usr/bin/env node
/**
 * Archify vendor installer — clone tt-a1i/archify into vendor/archify
 * Usage: node .github/skills/archify/scripts/install.mjs [--ref main] [--force]
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_DIR = path.resolve(__dirname, '..');
const VENDOR_DIR = path.join(SKILL_DIR, 'vendor', 'archify');
const REPO = 'tt-a1i/archify';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { ref: 'main', force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ref' && args[i+1]) { opts.ref = args[++i]; }
    else if (args[i] === '--force') opts.force = true;
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: node install.mjs [--ref <branch|tag>] [--force]\n  Clone ${REPO} into vendor/archify\n  --ref main (default) | v2.16.0 | main\n  --force  remove existing vendor first`);
      process.exit(0);
    }
  }
  return opts;
}

async function main() {
  const { ref, force } = parseArgs();
  console.log(`📦 Archify installer — ${REPO}@${ref} → vendor/archify`);

  if (existsSync(VENDOR_DIR)) {
    if (!force) {
      console.log(`ℹ️  vendor/archify đã tồn tại. Dùng --force để cài lại.`);
      console.log(`   Kiểm tra: node vendor/archify/bin/archify.mjs doctor`);
      return;
    }
    console.log(`🗑️  Removing existing vendor/archify ...`);
    await fs.rm(VENDOR_DIR, { recursive: true, force: true });
  }

  await fs.mkdir(path.dirname(VENDOR_DIR), { recursive: true });

  // Try git clone first (fast, full history)
  let cloned = false;
  try {
    execSync('git --version', { stdio: 'ignore' });
    console.log(`🔧 git clone https://github.com/${REPO}.git --branch ${ref} --depth 1 ...`);
    execSync(`git clone https://github.com/${REPO}.git "${VENDOR_DIR}" --branch ${ref} --depth 1`, { stdio: 'inherit' });
    cloned = true;
  } catch (e) {
    console.log(`⚠️  git clone failed (${e.message?.slice(0,120)}), fallback to zip download ...`);
  }

  if (!cloned) {
    // Fallback: download zip via fetch
    const zipUrl = `https://github.com/${REPO}/archive/refs/heads/${ref}.zip`;
    const tagZipUrl = `https://github.com/${REPO}/archive/refs/tags/${ref}.zip`;
    let url = zipUrl;
    console.log(`📥 Downloading ${url} ...`);
    let res = await fetch(url);
    if (!res.ok && ref.startsWith('v')) {
      console.log(`   heads failed (${res.status}), trying tags: ${tagZipUrl}`);
      url = tagZipUrl;
      res = await fetch(url);
    }
    if (!res.ok) throw new Error(`Download failed ${res.status} ${res.statusText} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const tmpZip = path.join(SKILL_DIR, `archify-${ref}.zip`);
    await fs.writeFile(tmpZip, buf);
    console.log(`📦 Saved ${tmpZip} (${(buf.length/1024).toFixed(0)} KB) — extracting ...`);
    // Use PowerShell Expand-Archive on Windows, unzip on Unix
    try {
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${path.dirname(VENDOR_DIR)}' -Force"`, { stdio: 'inherit' });
        // zip contains archify-main/ or archify-v2.16.0/
        const entries = await fs.readdir(path.dirname(VENDOR_DIR));
        const extracted = entries.find(n => n.startsWith('archify-') && n !== 'archify');
        if (extracted) {
          await fs.rm(VENDOR_DIR, { recursive: true, force: true }).catch(()=>{});
          await fs.rename(path.join(path.dirname(VENDOR_DIR), extracted), VENDOR_DIR);
        }
      } else {
        execSync(`unzip -q "${tmpZip}" -d "${path.dirname(VENDOR_DIR)}"`, { stdio: 'inherit' });
        const entries = await fs.readdir(path.dirname(VENDOR_DIR));
        const extracted = entries.find(n => n.startsWith('archify-') && n !== 'archify');
        if (extracted) {
          await fs.rm(VENDOR_DIR, { recursive: true, force: true }).catch(()=>{});
          await fs.rename(path.join(path.dirname(VENDOR_DIR), extracted), VENDOR_DIR);
        }
      }
    } finally {
      await fs.rm(tmpZip, { force: true }).catch(()=>{});
    }
  }

  // Verify — bin nằm ở vendor/archify/archify/bin (repo root chứa skill package con)
  const binPath = existsSync(path.join(VENDOR_DIR, 'archify', 'bin', 'archify.mjs'))
    ? path.join(VENDOR_DIR, 'archify', 'bin', 'archify.mjs')
    : path.join(VENDOR_DIR, 'bin', 'archify.mjs');
  if (!existsSync(binPath)) {
    console.warn(`⚠️  Không tìm thấy ${binPath} — kiểm tra ref "${ref}" có đúng không?`);
  } else {
    console.log(`✅ Installed vendor/archify @ ${ref}`);
    try {
      const out = execSync(`node "${binPath}" doctor`, { encoding: 'utf8', cwd: path.dirname(binPath) });
      console.log(out.slice(0, 800));
    } catch (e) {
      console.log(`   doctor output: ${e.stdout?.slice(0,400) || e.message.slice(0,200)}`);
    }
    console.log(`\n🎉 Xong! Thử:\n  node vendor/archify/archify/bin/archify.mjs demo /tmp/archify-demo\n  node vendor/archify/archify/bin/archify.mjs guide "Show API request with Redis cache miss" --json`);
  }
  console.log(`\n💡 Skill vẫn tháo lắp được: node .github/harness/scripts/harness-manager.mjs disable skill archify`);
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
