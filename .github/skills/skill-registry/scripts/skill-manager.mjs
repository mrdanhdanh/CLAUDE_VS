#!/usr/bin/env node
/**
 * Skill Manager — tháo lắp skill GitHub như plugin (wise usage)
 * Usage: node skill-manager.mjs <install|list|enable|disable|uninstall|sync|help> [args]
 * No deps, Node 18+ (fetch built-in)
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .github/skills/skill-registry/scripts -> .github/skills
const SKILLS_DIR = path.resolve(__dirname, '..', '..');
const REGISTRY_PATH = path.join(SKILLS_DIR, 'registry.json');
const DISABLED_DIR = path.join(SKILLS_DIR, '.disabled');

// ---------- registry ----------
async function loadRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data.version) data.version = 1;
    if (!data.skills) data.skills = {};
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') return { version: 1, skills: {} };
    // corrupt -> backup
    try {
      const bak = REGISTRY_PATH + '.bak.' + Date.now();
      const raw = await fs.readFile(REGISTRY_PATH, 'utf8').catch(() => '');
      await fs.writeFile(bak, raw, 'utf8');
      console.warn(`⚠️  registry.json corrupt — đã backup sang ${path.basename(bak)} và tạo mới`);
    } catch {}
    return { version: 1, skills: {} };
  }
}
async function saveRegistry(reg) {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n', 'utf8');
}
function parseFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const yaml = m[1];
  const out = {};
  for (const line of yaml.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    // strip quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}
function skillNameFromPath(p) {
  const base = path.posix.basename(p.replace(/\/$/, ''));
  if (base.toLowerCase().endsWith('.md')) return path.posix.basename(base, '.md');
  return base;
}
function validateName(name) {
  return /^[a-z0-9-]{1,64}$/.test(name);
}

// ---------- GitHub fetch ----------
async function ghFetch(url, opts = {}) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'skill-manager',
    ...opts.headers,
  };
  // optional token
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  return res;
}

async function fetchSkillFiles(owner, repo, remotePath, ref) {
  // remotePath may be '' (root) or 'skills/foo' or 'SKILL.md'
  const apiPath = remotePath ? encodeURIComponent(remotePath).replace(/%2F/g, '/') : '';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}?ref=${encodeURIComponent(ref)}`;
  const res = await ghFetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // try raw fallback for single SKILL.md
    if (remotePath && res.status === 404) {
      // try raw
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${remotePath}`;
      const rawRes = await fetch(rawUrl);
      if (rawRes.ok) {
        const text = await rawRes.text();
        return [{ path: remotePath, text, downloadUrl: rawUrl }];
      }
    }
    throw new Error(`GitHub API ${res.status} ${res.statusText} for ${owner}/${repo}/${remotePath}@${ref}\n${body.slice(0, 500)}`);
  }
  const data = await res.json();
  // single file
  if (!Array.isArray(data)) {
    if (data.type === 'file' && data.download_url) {
      const r = await fetch(data.download_url);
      if (!r.ok) throw new Error(`Failed to download ${data.download_url}: ${r.status}`);
      const text = await r.text();
      return [{ path: data.path, text, downloadUrl: data.download_url }];
    }
    throw new Error(`Unexpected GitHub response for ${remotePath}`);
  }
  // directory — fetch each file recursively
  const files = [];
  for (const entry of data) {
    if (entry.type === 'file') {
      const r = await fetch(entry.download_url);
      if (!r.ok) throw new Error(`Failed to download ${entry.download_url}: ${r.status}`);
      const text = await r.text();
      files.push({ path: entry.path, text, downloadUrl: entry.download_url });
    } else if (entry.type === 'dir') {
      const sub = await fetchSkillFiles(owner, repo, entry.path, ref);
      files.push(...sub);
    }
  }
  return files;
}

async function installFromGitHub({ owner, repo, remotePath, ref, force, customName }) {
  console.log(`📦 Fetching ${owner}/${repo}/${remotePath || '.'}@${ref} ...`);
  let files;
  try {
    files = await fetchSkillFiles(owner, repo, remotePath, ref);
  } catch (e) {
    console.error(`❌ Fetch failed: ${e.message}`);
    console.error(`   Gợi ý: kiểm tra owner/repo/path/ref, hoặc thử lại với GITHUB_TOKEN nếu bị rate limit.`);
    throw e;
  }
  if (files.length === 0) throw new Error('Không tìm thấy file nào ở path đã cho');

  // find SKILL.md
  let skillMd = files.find(f => path.posix.basename(f.path).toLowerCase() === 'skill.md');
  if (!skillMd) {
    // if single file is SKILL.md itself
    if (files.length === 1 && files[0].path.toLowerCase().endsWith('.md')) skillMd = files[0];
  }
  let fm = {};
  if (skillMd) fm = parseFrontmatter(skillMd.text);

  let name = customName || fm.name || skillNameFromPath(remotePath || `${owner}-${repo}`);
  name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!validateName(name)) {
    throw new Error(`Tên skill không hợp lệ: "${name}" — phải là [a-z0-9-]{1,64}`);
  }

  const reg = await loadRegistry();
  if (reg.skills[name] && !force) {
    throw new Error(`Skill "${name}" đã tồn tại. Dùng --force để ghi đè hoặc uninstall trước.`);
  }

  // determine local dest
  const destDir = path.join(SKILLS_DIR, name);
  const disabledDest = path.join(DISABLED_DIR, name);
  // if exists in disabled, remove it first if force
  if (existsSync(destDir) && !force) throw new Error(`Folder đã tồn tại: ${destDir}`);
  if (existsSync(disabledDest) && !force) throw new Error(`Skill đang bị disable tại ${disabledDest} — enable hoặc uninstall trước.`);

  // clean dest if force
  if (force) {
    await fs.rm(destDir, { recursive: true, force: true });
    await fs.rm(disabledDest, { recursive: true, force: true });
  }

  await fs.mkdir(destDir, { recursive: true });

  // write files: need to compute relative path inside skill
  // remotePath is the skill root; files have path like "skills/foo/SKILL.md"
  // we want to strip remotePath prefix
  const prefix = remotePath ? remotePath.replace(/\/$/, '') + '/' : '';
  for (const f of files) {
    let rel = f.path;
    if (prefix && rel.startsWith(prefix)) rel = rel.slice(prefix.length);
    // if remotePath was a single file, rel will be basename
    if (rel === '' || rel === f.path && files.length === 1 && !prefix) rel = path.posix.basename(f.path);
    const localPath = path.join(destDir, rel);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, f.text, 'utf8');
  }

  // if no SKILL.md at root but we fetched a single file, ensure it's named SKILL.md
  if (!existsSync(path.join(destDir, 'SKILL.md')) && skillMd && files.length === 1) {
    const singleRel = path.posix.basename(skillMd.path);
    if (singleRel.toLowerCase() !== 'skill.md') {
      await fs.rename(path.join(destDir, singleRel), path.join(destDir, 'SKILL.md'));
    }
  }

  const description = fm.description || `Skill từ ${owner}/${repo}/${remotePath || ''}`;
  reg.skills[name] = {
    source: `${owner}/${repo}`,
    path: remotePath || '',
    ref,
    enabled: true,
    description: description.slice(0, 300),
    installedAt: new Date().toISOString(),
  };
  await saveRegistry(reg);
  console.log(`✅ Installed "${name}" → .github/skills/${name} (enabled)`);
  console.log(`   ${description.slice(0, 120)}`);
  return name;
}

// ---------- local install (for demo/offline) ----------
async function installFromLocal(localPath, customName, force) {
  const abs = path.resolve(localPath);
  const stat = await fs.stat(abs).catch(() => null);
  if (!stat) throw new Error(`Local path không tồn tại: ${abs}`);
  let files = [];
  let skillMdText = '';
  if (stat.isDirectory()) {
    // walk
    async function walk(dir, base) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = path.posix.join(base, e.name);
        if (e.isDirectory()) await walk(full, rel);
        else {
          const text = await fs.readFile(full, 'utf8');
          files.push({ rel, text });
          if (e.name.toLowerCase() === 'skill.md' && !skillMdText) skillMdText = text;
        }
      }
    }
    await walk(abs, '');
  } else {
    const text = await fs.readFile(abs, 'utf8');
    files = [{ rel: path.basename(abs), text }];
    skillMdText = text;
  }
  const fm = skillMdText ? parseFrontmatter(skillMdText) : {};
  let name = customName || fm.name || path.basename(abs, path.extname(abs));
  name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!validateName(name)) throw new Error(`Tên skill không hợp lệ: "${name}"`);
  const reg = await loadRegistry();
  if (reg.skills[name] && !force) throw new Error(`Skill "${name}" đã tồn tại. Dùng --force.`);
  const destDir = path.join(SKILLS_DIR, name);
  const disabledDest = path.join(DISABLED_DIR, name);
  if (force) {
    await fs.rm(destDir, { recursive: true, force: true });
    await fs.rm(disabledDest, { recursive: true, force: true });
  } else {
    if (existsSync(destDir) || existsSync(disabledDest)) throw new Error(`Skill "${name}" đã tồn tại`);
  }
  await fs.mkdir(destDir, { recursive: true });
  for (const f of files) {
    const localPath = path.join(destDir, f.rel);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, f.text, 'utf8');
  }
  // ensure SKILL.md
  if (!existsSync(path.join(destDir, 'SKILL.md')) && files.length === 1) {
    await fs.rename(path.join(destDir, files[0].rel), path.join(destDir, 'SKILL.md'));
  }
  reg.skills[name] = {
    source: `local:${localPath}`,
    path: localPath,
    ref: 'local',
    enabled: true,
    description: (fm.description || `Local skill ${name}`).slice(0, 300),
    installedAt: new Date().toISOString(),
  };
  await saveRegistry(reg);
  console.log(`✅ Installed local "${name}" → .github/skills/${name}`);
  return name;
}

// ---------- enable/disable ----------
async function setEnabled(name, enabled) {
  const reg = await loadRegistry();
  const entry = reg.skills[name];
  if (!entry) throw new Error(`Skill "${name}" không có trong registry. Chạy "list" để xem.`);
  const src = path.join(SKILLS_DIR, name);
  const dst = path.join(DISABLED_DIR, name);
  if (enabled) {
    if (existsSync(src)) {
      if (entry.enabled) console.log(`ℹ️  "${name}" đã enabled`);
      else {
        entry.enabled = true;
        await saveRegistry(reg);
        console.log(`✅ "${name}" đã enabled (đã ở .github/skills/${name})`);
      }
      return;
    }
    if (!existsSync(dst)) throw new Error(`Không tìm thấy folder cho "${name}" ở cả enabled và disabled`);
    await fs.mkdir(SKILLS_DIR, { recursive: true });
    await fs.rename(dst, src);
    entry.enabled = true;
    await saveRegistry(reg);
    console.log(`✅ Enabled "${name}" — moved .disabled/${name} → ${name}`);
  } else {
    if (existsSync(dst)) {
      if (!entry.enabled) console.log(`ℹ️  "${name}" đã disabled`);
      else {
        entry.enabled = false;
        await saveRegistry(reg);
        console.log(`✅ "${name}" đã disabled (đã ở .disabled)`);
      }
      return;
    }
    if (!existsSync(src)) throw new Error(`Không tìm thấy folder cho "${name}"`);
    await fs.mkdir(DISABLED_DIR, { recursive: true });
    await fs.rename(src, dst);
    entry.enabled = false;
    await saveRegistry(reg);
    console.log(`✅ Disabled "${name}" — moved ${name} → .disabled/${name}`);
    console.log(`   (skill sẽ không hiện trong slash "/" cho đến khi enable lại)`);
  }
}

async function uninstall(name) {
  const reg = await loadRegistry();
  if (!reg.skills[name]) throw new Error(`Skill "${name}" không có trong registry`);
  const src = path.join(SKILLS_DIR, name);
  const dst = path.join(DISABLED_DIR, name);
  await fs.rm(src, { recursive: true, force: true });
  await fs.rm(dst, { recursive: true, force: true });
  delete reg.skills[name];
  await saveRegistry(reg);
  console.log(`🗑️  Uninstalled "${name}" — đã xóa folder và registry`);
}

// ---------- list ----------
async function list() {
  const reg = await loadRegistry();
  const names = Object.keys(reg.skills).sort();
  if (names.length === 0) {
    console.log('Chưa có skill nào. Cài thử:');
    console.log('  node .github/skills/skill-registry/scripts/skill-manager.mjs install owner/repo --path skills/my-skill');
    return;
  }
  // check actual fs state
  console.log(`\n📚 Skills (${names.length}) — registry: .github/skills/registry.json\n`);
  console.log(`  ${'NAME'.padEnd(20)} ${'ENABLED'.padEnd(9)} ${'SOURCE'.padEnd(28)} DESCRIPTION`);
  console.log(`  ${'-'.repeat(20)} ${'-'.repeat(9)} ${'-'.repeat(28)} ${'-'.repeat(40)}`);
  for (const n of names) {
    const e = reg.skills[n];
    const enabledFs = existsSync(path.join(SKILLS_DIR, n));
    const disabledFs = existsSync(path.join(DISABLED_DIR, n));
    let status = e.enabled ? '✅ enabled' : '⏸ disabled';
    if (e.enabled && !enabledFs && disabledFs) status = '⚠️  mismatch (enabled nhưng ở .disabled)';
    if (!e.enabled && enabledFs && !disabledFs) status = '⚠️  mismatch (disabled nhưng ở skills/)';
    if (!enabledFs && !disabledFs) status = '❌ missing';
    console.log(`  ${n.padEnd(20)} ${status.padEnd(9)} ${(e.source || '').padEnd(28)} ${(e.description || '').slice(0, 50)}`);
  }
  console.log(`\n  Disabled folder: .github/skills/.disabled/ (${existsSync(DISABLED_DIR) ? 'exists' : 'not created yet'})`);
  console.log(`  Wise usage: agent chỉ load skill khi description match task — xem .github/skills/skill-registry/SKILL.md\n`);
}

// ---------- sync ----------
async function sync() {
  const reg = await loadRegistry();
  const entries = Object.entries(reg.skills).filter(([, v]) => v.source !== 'local' && !v.source.startsWith('local:'));
  if (entries.length === 0) {
    console.log('Không có skill GitHub nào để sync (chỉ có local).');
    return;
  }
  console.log(`🔄 Syncing ${entries.length} skills từ GitHub...`);
  for (const [name, meta] of entries) {
    const [owner, repo] = meta.source.split('/');
    if (!owner || !repo) {
      console.warn(`⚠️  Skip "${name}": source không hợp lệ ${meta.source}`);
      continue;
    }
    try {
      await installFromGitHub({ owner, repo, remotePath: meta.path || '', ref: meta.ref || 'main', force: true, customName: name });
      // restore enabled state
      if (!meta.enabled) await setEnabled(name, false);
      console.log(`   ✓ ${name}`);
    } catch (e) {
      console.error(`   ✗ ${name}: ${e.message}`);
    }
  }
  console.log('✅ Sync xong');
}

// ---------- help ----------
function help() {
  console.log(`
Skill Manager — tháo lắp skill GitHub (wise)

Usage:
  node .github/skills/skill-registry/scripts/skill-manager.mjs <command> [options]

Commands:
  install <owner/repo> [--path skills/foo] [--ref main] [--name my-skill] [--force]
      Cài skill từ GitHub. --path là folder chứa SKILL.md (hoặc file .md).
      Ví dụ: install anthropics/skills --path skills/web-design --ref main

  install --local <path> [--name my-skill] [--force]
      Cài từ local folder/file (dùng để test offline).

  list
      Liệt kê skills, trạng thái enabled/disabled, source.

  enable <name>     Bật skill (move .disabled/<name> → skills/<name>)
  disable <name>    Tắt skill (move skills/<name> → .disabled/<name>) — không xóa
  uninstall <name>  Gỡ hẳn (xóa folder + registry)
  sync              Cài lại tất cả skills GitHub từ registry (dùng sau khi clone repo)
  help              Hiện trợ giúp này

Tháo lắp wise:
  - Disable không xóa file — chỉ move sang .github/skills/.disabled/
  - Agent chỉ load skill khi description match task (progressive loading)
  - Xem hướng dẫn: .github/skills/skill-registry/SKILL.md
  - Quy tắc: .github/instructions/skill-usage.instructions.md

Env:
  GITHUB_TOKEN  (optional) để tránh rate limit
`);
}

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') return help();
  try {
    if (cmd === 'list' || cmd === 'ls') return await list();
    if (cmd === 'enable') {
      const name = args[1];
      if (!name) throw new Error('Thiếu <name>. Ví dụ: enable my-skill');
      return await setEnabled(name, true);
    }
    if (cmd === 'disable') {
      const name = args[1];
      if (!name) throw new Error('Thiếu <name>. Ví dụ: disable my-skill');
      return await setEnabled(name, false);
    }
    if (cmd === 'uninstall' || cmd === 'remove' || cmd === 'rm') {
      const name = args[1];
      if (!name) throw new Error('Thiếu <name>. Ví dụ: uninstall my-skill');
      return await uninstall(name);
    }
    if (cmd === 'sync') return await sync();
    if (cmd === 'install' || cmd === 'add') {
      // parse options
      let source = null;
      let localPath = null;
      let remotePath = '';
      let ref = 'main';
      let customName = null;
      let force = false;
      // first non-flag arg after install is source (owner/repo) or --local
      let i = 1;
      // handle --local
      if (args[i] === '--local') {
        localPath = args[i + 1];
        if (!localPath) throw new Error('Thiếu path sau --local');
        i += 2;
      } else if (args[i] && !args[i].startsWith('--')) {
        source = args[i];
        i += 1;
      }
      for (; i < args.length; i++) {
        const a = args[i];
        if (a === '--path') remotePath = args[++i] || '';
        else if (a.startsWith('--path=')) remotePath = a.slice(7);
        else if (a === '--ref') ref = args[++i] || 'main';
        else if (a.startsWith('--ref=')) ref = a.slice(6);
        else if (a === '--name') customName = args[++i] || null;
        else if (a.startsWith('--name=')) customName = a.slice(7);
        else if (a === '--force' || a === '-f') force = true;
        else if (a === '--local') { localPath = args[++i]; }
        else throw new Error(`Unknown option: ${a}`);
      }
      if (localPath) return await installFromLocal(localPath, customName, force);
      if (!source) throw new Error('Thiếu <owner/repo>. Ví dụ: install owner/repo --path skills/foo');
      const [owner, repo] = source.split('/');
      if (!owner || !repo) throw new Error(`Source không hợp lệ: "${source}" — phải là owner/repo`);
      return await installFromGitHub({ owner, repo: repo.replace(/\.git$/, ''), remotePath, ref, force, customName });
    }
    throw new Error(`Unknown command: ${cmd}. Chạy "help" để xem.`);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exitCode = 1;
  }
}

main();
