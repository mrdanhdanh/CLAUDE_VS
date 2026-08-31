#!/usr/bin/env node
/**
 * Harness Manager — tháo lắp toàn bộ customizations (skill/instruction/agent/prompt/hook) + preset
 * Usage: node harness-manager.mjs <command> [args]
 * No deps, Node 18+ (fetch built-in)
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .github/harness/scripts -> .github
const GITHUB_DIR = path.resolve(__dirname, '..', '..');
const HARNESS_DIR = path.resolve(GITHUB_DIR, 'harness');
const REGISTRY_PATH = path.join(HARNESS_DIR, 'registry.json');
const SKILLS_REGISTRY_PATH = path.join(GITHUB_DIR, 'skills', 'registry.json');
const PRESETS_DIR = path.join(HARNESS_DIR, 'presets');
const TEMPLATES_DIR = path.join(HARNESS_DIR, 'templates');

const TYPE_DEFS = {
  skill: {
    dir: path.join(GITHUB_DIR, 'skills'),
    disabledDir: path.join(GITHUB_DIR, 'skills', '.disabled'),
    pattern: /^(.+)$/, // folder name
    fileInFolder: 'SKILL.md',
    ext: '',
    isFolder: true,
  },
  instruction: {
    dir: path.join(GITHUB_DIR, 'instructions'),
    disabledDir: path.join(GITHUB_DIR, 'instructions', '.disabled'),
    pattern: /^(.+)\.instructions\.md$/,
    ext: '.instructions.md',
    isFolder: false,
  },
  agent: {
    dir: path.join(GITHUB_DIR, 'agents'),
    disabledDir: path.join(GITHUB_DIR, 'agents', '.disabled'),
    pattern: /^(.+)\.agent\.md$/,
    ext: '.agent.md',
    isFolder: false,
  },
  prompt: {
    dir: path.join(GITHUB_DIR, 'prompts'),
    disabledDir: path.join(GITHUB_DIR, 'prompts', '.disabled'),
    pattern: /^(.+)\.prompt\.md$/,
    ext: '.prompt.md',
    isFolder: false,
  },
  hook: {
    dir: path.join(GITHUB_DIR, 'hooks'),
    disabledDir: path.join(GITHUB_DIR, 'hooks', '.disabled'),
    pattern: /^(.+)\.json$/,
    ext: '.json',
    isFolder: false,
  },
};

const ALL_TYPES = Object.keys(TYPE_DEFS);

// ---------- helpers ----------
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}
function validateName(name) {
  return /^[a-z0-9-]{1,64}$/.test(name);
}
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ---------- registry ----------
async function scanFs() {
  const reg = { version: 2, skills: {}, instructions: {}, agents: {}, prompts: {}, hooks: {} };
  for (const type of ALL_TYPES) {
    const def = TYPE_DEFS[type];
    const key = type === 'skill' ? 'skills' : type + 's';
    // enabled
    let entries = [];
    try {
      entries = await fs.readdir(def.dir, { withFileTypes: true });
    } catch {}
    for (const e of entries) {
      if (e.name === '.disabled' || e.name === 'registry.json' || e.name === 'scripts') continue;
      if (def.isFolder) {
        if (!e.isDirectory()) continue;
        const name = e.name;
        if (!validateName(name)) continue;
        const skillMd = path.join(def.dir, name, def.fileInFolder);
        let desc = '';
        let fm = {};
        try {
          const text = await fs.readFile(skillMd, 'utf8');
          fm = parseFrontmatter(text);
          desc = fm.description || '';
        } catch {}
        reg[key][name] = {
          source: 'local',
          path: `skills/${name}`,
          ref: 'local',
          enabled: true,
          description: (desc || `Skill ${name}`).slice(0, 300),
          file: `${name}/${def.fileInFolder}`,
          installedAt: new Date().toISOString(),
        };
      } else {
        if (!e.isFile()) continue;
        const m = e.name.match(def.pattern);
        if (!m) continue;
        const name = m[1];
        if (!validateName(name)) continue;
        const full = path.join(def.dir, e.name);
        let desc = '';
        let fm = {};
        try {
          const text = await fs.readFile(full, 'utf8');
          fm = parseFrontmatter(text);
          desc = fm.description || '';
        } catch {}
        reg[key][name] = {
          source: 'local',
          file: e.name,
          enabled: true,
          description: (desc || `${type} ${name}`).slice(0, 300),
          applyTo: fm.applyTo || undefined,
          installedAt: new Date().toISOString(),
        };
      }
    }
    // disabled
    let disabledEntries = [];
    try {
      disabledEntries = await fs.readdir(def.disabledDir, { withFileTypes: true });
    } catch {}
    for (const e of disabledEntries) {
      if (def.isFolder) {
        if (!e.isDirectory()) continue;
        const name = e.name;
        if (reg[key][name]) continue; // already enabled, skip
        if (!validateName(name)) continue;
        const skillMd = path.join(def.disabledDir, name, def.fileInFolder);
        let desc = '';
        try {
          const text = await fs.readFile(skillMd, 'utf8');
          const fm = parseFrontmatter(text);
          desc = fm.description || '';
        } catch {}
        reg[key][name] = {
          source: 'local',
          path: `skills/${name}`,
          ref: 'local',
          enabled: false,
          description: (desc || `Skill ${name}`).slice(0, 300),
          file: `${name}/${def.fileInFolder}`,
          installedAt: new Date().toISOString(),
        };
      } else {
        if (!e.isFile()) continue;
        const m = e.name.match(def.pattern);
        if (!m) continue;
        const name = m[1];
        if (reg[key][name]) continue;
        if (!validateName(name)) continue;
        const full = path.join(def.disabledDir, e.name);
        let desc = '';
        try {
          const text = await fs.readFile(full, 'utf8');
          const fm = parseFrontmatter(text);
          desc = fm.description || '';
        } catch {}
        reg[key][name] = {
          source: 'local',
          file: e.name,
          enabled: false,
          description: (desc || `${type} ${name}`).slice(0, 300),
          installedAt: new Date().toISOString(),
        };
      }
    }
  }
  return reg;
}

async function loadRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data.version) data.version = 2;
    // ensure keys
    for (const t of ALL_TYPES) {
      const key = t === 'skill' ? 'skills' : t + 's';
      if (!data[key]) data[key] = {};
    }
    // merge with fs scan for missing entries (bootstrap)
    const scanned = await scanFs();
    let changed = false;
    for (const t of ALL_TYPES) {
      const key = t === 'skill' ? 'skills' : t + 's';
      for (const [name, meta] of Object.entries(scanned[key])) {
        if (!data[key][name]) {
          data[key][name] = meta;
          changed = true;
        }
      }
    }
    if (changed) await saveRegistry(data);
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') {
      const scanned = await scanFs();
      await saveRegistry(scanned);
      return scanned;
    }
    // corrupt
    try {
      const bak = REGISTRY_PATH + '.bak.' + Date.now();
      const raw = await fs.readFile(REGISTRY_PATH, 'utf8').catch(() => '');
      await fs.writeFile(bak, raw, 'utf8');
      console.warn(`⚠️  harness registry corrupt — backup ${path.basename(bak)} và tạo mới`);
    } catch {}
    const scanned = await scanFs();
    await saveRegistry(scanned);
    return scanned;
  }
}

async function saveRegistry(reg) {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  // sync skills registry for backward compat
  try {
    const skillsReg = { version: 1, skills: reg.skills || {} };
    await fs.mkdir(path.dirname(SKILLS_REGISTRY_PATH), { recursive: true });
    await fs.writeFile(SKILLS_REGISTRY_PATH, JSON.stringify(skillsReg, null, 2) + '\n', 'utf8');
  } catch {}
}

// ---------- enable/disable ----------
function pathsFor(type, name) {
  const def = TYPE_DEFS[type];
  if (!def) throw new Error(`Unknown type: ${type} (chọn ${ALL_TYPES.join('|')})`);
  if (def.isFolder) {
    return {
      enabled: path.join(def.dir, name),
      disabled: path.join(def.disabledDir, name),
    };
  } else {
    return {
      enabled: path.join(def.dir, name + def.ext),
      disabled: path.join(def.disabledDir, name + def.ext),
    };
  }
}

async function setEnabled(type, name, enabled) {
  if (!TYPE_DEFS[type]) throw new Error(`Unknown type: ${type}`);
  if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
  const reg = await loadRegistry();
  const key = type === 'skill' ? 'skills' : type + 's';
  const entry = reg[key][name];
  if (!entry) throw new Error(`${type} "${name}" không có trong registry. Chạy "list" để xem.`);
  const { enabled: pEnabled, disabled: pDisabled } = pathsFor(type, name);
  const existsEnabled = existsSync(pEnabled);
  const existsDisabled = existsSync(pDisabled);

  if (enabled) {
    if (existsEnabled) {
      if (entry.enabled) console.log(`ℹ️  ${type} "${name}" đã enabled`);
      else {
        entry.enabled = true;
        await saveRegistry(reg);
        console.log(`✅ ${type} "${name}" đã enabled (đã ở ${path.relative(GITHUB_DIR, pEnabled)})`);
      }
      return;
    }
    if (!existsDisabled) throw new Error(`Không tìm thấy file cho ${type} "${name}" ở cả enabled và disabled`);
    await fs.mkdir(path.dirname(pEnabled), { recursive: true });
    await fs.rename(pDisabled, pEnabled);
    entry.enabled = true;
    await saveRegistry(reg);
    console.log(`✅ Enabled ${type} "${name}" — moved .disabled → enabled`);
  } else {
    if (existsDisabled) {
      if (!entry.enabled) console.log(`ℹ️  ${type} "${name}" đã disabled`);
      else {
        entry.enabled = false;
        await saveRegistry(reg);
        console.log(`✅ ${type} "${name}" đã disabled (đã ở .disabled)`);
      }
      return;
    }
    if (!existsEnabled) throw new Error(`Không tìm thấy file cho ${type} "${name}"`);
    await fs.mkdir(path.dirname(pDisabled), { recursive: true });
    await fs.rename(pEnabled, pDisabled);
    entry.enabled = false;
    await saveRegistry(reg);
    console.log(`✅ Disabled ${type} "${name}" — moved enabled → .disabled/${path.basename(pDisabled)}`);
    if (type === 'skill' || type === 'instruction') console.log(`   (sẽ không load cho đến khi enable lại)`);
  }
}

// ---------- list / status ----------
async function list(filterType) {
  const reg = await loadRegistry();
  const types = filterType ? [filterType] : ALL_TYPES;
  if (filterType && !TYPE_DEFS[filterType]) throw new Error(`Unknown type: ${filterType}`);
  let total = 0;
  for (const type of types) {
    const key = type === 'skill' ? 'skills' : type + 's';
    const entries = reg[key] || {};
    const names = Object.keys(entries).sort();
    total += names.length;
    console.log(`\n📦 ${type.toUpperCase()}S (${names.length}) — .github/${type === 'skill' ? 'skills' : type === 'instruction' ? 'instructions' : type === 'agent' ? 'agents' : type === 'prompt' ? 'prompts' : 'hooks'}/`);
    if (names.length === 0) {
      console.log('   (trống)');
      continue;
    }
    console.log(`   ${'NAME'.padEnd(22)} ${'STATUS'.padEnd(14)} ${'SOURCE'.padEnd(22)} DESCRIPTION`);
    console.log(`   ${'-'.repeat(22)} ${'-'.repeat(14)} ${'-'.repeat(22)} ${'-'.repeat(36)}`);
    for (const n of names) {
      const e = entries[n];
      const { enabled: pE, disabled: pD } = pathsFor(type, n);
      const fsEnabled = existsSync(pE);
      const fsDisabled = existsSync(pD);
      let status = e.enabled ? '✅ enabled' : '⏸ disabled';
      if (e.enabled && !fsEnabled && fsDisabled) status = '⚠️ mismatch';
      if (!e.enabled && fsEnabled && !fsDisabled) status = '⚠️ mismatch';
      if (!fsEnabled && !fsDisabled) status = '❌ missing';
      const src = (e.source || '').slice(0, 22);
      const desc = (e.description || '').slice(0, 40);
      console.log(`   ${n.padEnd(22)} ${status.padEnd(14)} ${src.padEnd(22)} ${desc}`);
    }
  }
  if (!filterType) {
    console.log(`\n📊 Tổng: ${total} items — registry: .github/harness/registry.json`);
    console.log(`   Presets: .github/harness/presets/ — chạy "preset list" để xem`);
    console.log(`   Wise: chỉ load khi description/applyTo match task\n`);
  }
}

async function status() {
  const reg = await loadRegistry();
  console.log('\n📊 Harness Status\n');
  for (const type of ALL_TYPES) {
    const key = type === 'skill' ? 'skills' : type + 's';
    const entries = reg[key] || {};
    const names = Object.keys(entries);
    const enabled = names.filter(n => entries[n].enabled).length;
    const disabled = names.length - enabled;
    const icon = type === 'skill' ? '🧩' : type === 'instruction' ? '📜' : type === 'agent' ? '🤖' : type === 'prompt' ? '💬' : '🪝';
    console.log(`  ${icon} ${type.padEnd(12)} ${String(enabled).padStart(2)} enabled / ${String(disabled).padStart(2)} disabled / ${String(names.length).padStart(2)} total`);
  }
  console.log('');
}

// ---------- GitHub fetch ----------
async function ghFetch(url, opts = {}) {
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'harness-manager', ...opts.headers };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(url, { headers });
}

async function fetchSkillFiles(owner, repo, remotePath, ref) {
  const apiPath = remotePath ? encodeURIComponent(remotePath).replace(/%2F/g, '/') : '';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}?ref=${encodeURIComponent(ref)}`;
  const res = await ghFetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (remotePath && res.status === 404) {
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
  if (!Array.isArray(data)) {
    if (data.type === 'file' && data.download_url) {
      const r = await fetch(data.download_url);
      if (!r.ok) throw new Error(`Failed to download ${data.download_url}: ${r.status}`);
      const text = await r.text();
      return [{ path: data.path, text, downloadUrl: data.download_url }];
    }
    throw new Error(`Unexpected GitHub response for ${remotePath}`);
  }
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

async function fetchSingleFile(owner, repo, remotePath, ref) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${remotePath}`;
  const res = await fetch(rawUrl);
  if (!res.ok) {
    // try api
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(remotePath).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`;
    const apiRes = await ghFetch(apiUrl);
    if (!apiRes.ok) throw new Error(`Fetch failed ${res.status} / ${apiRes.status} for ${remotePath}`);
    const data = await apiRes.json();
    if (data.download_url) {
      const r = await fetch(data.download_url);
      if (!r.ok) throw new Error(`Download failed ${r.status}`);
      return await r.text();
    }
    throw new Error(`Not a file: ${remotePath}`);
  }
  return await res.text();
}

// ---------- install ----------
async function install({ type, owner, repo, remotePath, ref, customName, force, localPath }) {
  if (!TYPE_DEFS[type]) throw new Error(`Unknown type: ${type}`);
  const def = TYPE_DEFS[type];
  const reg = await loadRegistry();
  const key = type === 'skill' ? 'skills' : type + 's';

  if (localPath) {
    return await installLocal({ type, localPath, customName, force });
  }

  if (type === 'skill') {
    // reuse skill logic
    console.log(`📦 Fetching skill ${owner}/${repo}/${remotePath || '.'}@${ref} ...`);
    let files;
    try {
      files = await fetchSkillFiles(owner, repo, remotePath, ref);
    } catch (e) {
      console.error(`❌ Fetch failed: ${e.message}`);
      throw e;
    }
    if (files.length === 0) throw new Error('Không tìm thấy file nào');
    let skillMd = files.find(f => path.posix.basename(f.path).toLowerCase() === 'skill.md');
    if (!skillMd && files.length === 1 && files[0].path.toLowerCase().endsWith('.md')) skillMd = files[0];
    let fm = {};
    if (skillMd) fm = parseFrontmatter(skillMd.text);
    let name = customName || fm.name || (remotePath ? path.posix.basename(remotePath.replace(/\/$/, '')) : `${owner}-${repo}`);
    name = normalizeName(name);
    if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
    if (reg[key][name] && !force) throw new Error(`Skill "${name}" đã tồn tại. Dùng --force`);
    const destDir = path.join(def.dir, name);
    const disabledDest = path.join(def.disabledDir, name);
    if (force) {
      await fs.rm(destDir, { recursive: true, force: true });
      await fs.rm(disabledDest, { recursive: true, force: true });
    } else {
      if (existsSync(destDir) || existsSync(disabledDest)) throw new Error(`Skill "${name}" đã tồn tại`);
    }
    await fs.mkdir(destDir, { recursive: true });
    const prefix = remotePath ? remotePath.replace(/\/$/, '') + '/' : '';
    for (const f of files) {
      let rel = f.path;
      if (prefix && rel.startsWith(prefix)) rel = rel.slice(prefix.length);
      if (rel === '' || (rel === f.path && files.length === 1 && !prefix)) rel = path.posix.basename(f.path);
      const local = path.join(destDir, rel);
      await fs.mkdir(path.dirname(local), { recursive: true });
      await fs.writeFile(local, f.text, 'utf8');
    }
    if (!existsSync(path.join(destDir, 'SKILL.md')) && skillMd && files.length === 1) {
      const singleRel = path.posix.basename(skillMd.path);
      if (singleRel.toLowerCase() !== 'skill.md') {
        await fs.rename(path.join(destDir, singleRel), path.join(destDir, 'SKILL.md'));
      }
    }
    const desc = (fm.description || `Skill từ ${owner}/${repo}/${remotePath || ''}`).slice(0, 300);
    reg[key][name] = { source: `${owner}/${repo}`, path: remotePath || '', ref, enabled: true, description: desc, file: `${name}/SKILL.md`, installedAt: new Date().toISOString() };
    await saveRegistry(reg);
    console.log(`✅ Installed skill "${name}" → .github/skills/${name} (enabled)`);
    return name;
  } else {
    // single file types
    if (!remotePath) throw new Error(`Thiếu --path cho ${type}. Ví dụ: --path instructions/my-rule.instructions.md`);
    console.log(`📦 Fetching ${type} ${owner}/${repo}/${remotePath}@${ref} ...`);
    const text = await fetchSingleFile(owner, repo, remotePath, ref);
    const fm = parseFrontmatter(text);
    let base = path.posix.basename(remotePath);
    // derive name from file
    let name = customName || fm.name || base.replace(def.ext, '');
    // if base doesn't have ext, use name as is
    if (!customName && !fm.name) {
      // try to strip ext
      if (base.endsWith(def.ext)) name = base.slice(0, -def.ext.length);
      else name = base.replace(/\.[^.]+$/, '');
    }
    name = normalizeName(name);
    if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
    if (reg[key][name] && !force) throw new Error(`${type} "${name}" đã tồn tại. Dùng --force`);
    const dest = path.join(def.dir, name + def.ext);
    const disabledDest = path.join(def.disabledDir, name + def.ext);
    if (force) {
      await fs.rm(dest, { force: true });
      await fs.rm(disabledDest, { force: true });
    } else {
      if (existsSync(dest) || existsSync(disabledDest)) throw new Error(`${type} "${name}" đã tồn tại`);
    }
    await fs.mkdir(def.dir, { recursive: true });
    await fs.writeFile(dest, text, 'utf8');
    const desc = (fm.description || `${type} từ ${owner}/${repo}/${remotePath}`).slice(0, 300);
    reg[key][name] = { source: `${owner}/${repo}`, path: remotePath, ref, enabled: true, description: desc, file: name + def.ext, applyTo: fm.applyTo, installedAt: new Date().toISOString() };
    await saveRegistry(reg);
    console.log(`✅ Installed ${type} "${name}" → ${path.relative(GITHUB_DIR, dest)} (enabled)`);
    return name;
  }
}

async function installLocal({ type, localPath, customName, force }) {
  const def = TYPE_DEFS[type];
  const reg = await loadRegistry();
  const key = type === 'skill' ? 'skills' : type + 's';
  const abs = path.resolve(localPath);
  const stat = await fs.stat(abs).catch(() => null);
  if (!stat) throw new Error(`Local path không tồn tại: ${abs}`);

  if (type === 'skill') {
    // folder or file
    let files = [];
    let skillMdText = '';
    if (stat.isDirectory()) {
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
    name = normalizeName(name);
    if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
    if (reg[key][name] && !force) throw new Error(`Skill "${name}" đã tồn tại`);
    const destDir = path.join(def.dir, name);
    const disabledDest = path.join(def.disabledDir, name);
    if (force) {
      await fs.rm(destDir, { recursive: true, force: true });
      await fs.rm(disabledDest, { recursive: true, force: true });
    } else if (existsSync(destDir) || existsSync(disabledDest)) throw new Error(`Skill "${name}" đã tồn tại`);
    await fs.mkdir(destDir, { recursive: true });
    for (const f of files) {
      const local = path.join(destDir, f.rel);
      await fs.mkdir(path.dirname(local), { recursive: true });
      await fs.writeFile(local, f.text, 'utf8');
    }
    if (!existsSync(path.join(destDir, 'SKILL.md')) && files.length === 1) {
      await fs.rename(path.join(destDir, files[0].rel), path.join(destDir, 'SKILL.md'));
    }
    reg[key][name] = { source: `local:${abs}`, path: abs, ref: 'local', enabled: true, description: (fm.description || `Local skill ${name}`).slice(0, 300), file: `${name}/SKILL.md`, installedAt: new Date().toISOString() };
    await saveRegistry(reg);
    console.log(`✅ Installed local skill "${name}" → .github/skills/${name}`);
    return name;
  } else {
    // single file
    const text = await fs.readFile(abs, 'utf8');
    const fm = parseFrontmatter(text);
    let name = customName || fm.name || path.basename(abs, path.extname(abs)).replace(/\.instructions|\.agent|\.prompt/, '');
    // strip ext if present
    if (name.endsWith(def.ext.replace(/^\./, ''))) name = name.slice(0, -def.ext.length + 1);
    // better: derive from file name
    const base = path.basename(abs);
    if (!customName && !fm.name) {
      if (base.endsWith(def.ext)) name = base.slice(0, -def.ext.length);
      else name = path.basename(abs, path.extname(abs));
    }
    name = normalizeName(name);
    if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
    if (reg[key][name] && !force) throw new Error(`${type} "${name}" đã tồn tại`);
    const dest = path.join(def.dir, name + def.ext);
    const disabledDest = path.join(def.disabledDir, name + def.ext);
    if (force) {
      await fs.rm(dest, { force: true });
      await fs.rm(disabledDest, { force: true });
    } else if (existsSync(dest) || existsSync(disabledDest)) throw new Error(`${type} "${name}" đã tồn tại`);
    await fs.mkdir(def.dir, { recursive: true });
    await fs.writeFile(dest, text, 'utf8');
    reg[key][name] = { source: `local:${abs}`, path: abs, ref: 'local', enabled: true, description: (fm.description || `Local ${type} ${name}`).slice(0, 300), file: name + def.ext, applyTo: fm.applyTo, installedAt: new Date().toISOString() };
    await saveRegistry(reg);
    console.log(`✅ Installed local ${type} "${name}" → ${path.relative(GITHUB_DIR, dest)}`);
    return name;
  }
}

// ---------- uninstall ----------
async function uninstall(type, name) {
  if (!TYPE_DEFS[type]) throw new Error(`Unknown type: ${type}`);
  const reg = await loadRegistry();
  const key = type === 'skill' ? 'skills' : type + 's';
  if (!reg[key][name]) throw new Error(`${type} "${name}" không có trong registry`);
  const { enabled: pE, disabled: pD } = pathsFor(type, name);
  await fs.rm(pE, { recursive: true, force: true });
  await fs.rm(pD, { recursive: true, force: true });
  delete reg[key][name];
  await saveRegistry(reg);
  console.log(`🗑️  Uninstalled ${type} "${name}"`);
}

// ---------- create ----------
async function create(type, name, opts = {}) {
  if (!TYPE_DEFS[type]) throw new Error(`Unknown type: ${type}`);
  name = normalizeName(name);
  if (!validateName(name)) throw new Error(`Tên không hợp lệ: ${name}`);
  const def = TYPE_DEFS[type];
  const reg = await loadRegistry();
  const key = type === 'skill' ? 'skills' : type + 's';
  if (reg[key][name]) throw new Error(`${type} "${name}" đã tồn tại`);
  const { enabled: pE, disabled: pD } = pathsFor(type, name);
  if (existsSync(pE) || existsSync(pD)) throw new Error(`File đã tồn tại cho ${type} "${name}"`);

  let templatePath;
  let dest;
  if (type === 'skill') {
    templatePath = path.join(TEMPLATES_DIR, 'skill-SKILL.md');
    dest = path.join(def.dir, name, 'SKILL.md');
    await fs.mkdir(path.dirname(dest), { recursive: true });
  } else if (type === 'instruction') {
    templatePath = path.join(TEMPLATES_DIR, 'instruction.md');
    dest = path.join(def.dir, name + def.ext);
  } else if (type === 'agent') {
    templatePath = path.join(TEMPLATES_DIR, 'agent.md');
    dest = path.join(def.dir, name + def.ext);
  } else if (type === 'prompt') {
    templatePath = path.join(TEMPLATES_DIR, 'prompt.md');
    dest = path.join(def.dir, name + def.ext);
  } else if (type === 'hook') {
    // hook template is simple json
    await fs.mkdir(def.dir, { recursive: true });
    const hookContent = JSON.stringify({ hooks: { PostToolUse: [{ type: 'command', command: `echo [${name}] hook`, timeout: 5 }] } }, null, 2) + '\n';
    await fs.writeFile(path.join(def.dir, name + def.ext), hookContent, 'utf8');
    reg[key][name] = { source: 'local', file: name + def.ext, enabled: true, description: `Hook ${name}`, installedAt: new Date().toISOString() };
    await saveRegistry(reg);
    console.log(`✅ Created hook "${name}" → ${path.relative(GITHUB_DIR, path.join(def.dir, name + def.ext))}`);
    return;
  }

  let tmpl = '';
  try {
    tmpl = await fs.readFile(templatePath, 'utf8');
  } catch {
    tmpl = `---\nname: ${name}\ndescription: "Mô tả cho ${name}"\n---\n\n# ${name}\n`;
  }
  const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  tmpl = tmpl.replaceAll('{{NAME}}', name).replaceAll('{{TITLE}}', title);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, tmpl, 'utf8');
  const fm = parseFrontmatter(tmpl);
  reg[key][name] = {
    source: 'local',
    file: type === 'skill' ? `${name}/SKILL.md` : name + def.ext,
    enabled: true,
    description: (fm.description || `${type} ${name}`).slice(0, 300),
    applyTo: fm.applyTo,
    installedAt: new Date().toISOString(),
  };
  await saveRegistry(reg);
  console.log(`✅ Created ${type} "${name}" → ${path.relative(GITHUB_DIR, dest)}`);
  console.log(`   Sửa description/applyTo trong file để agent load wise.`);
}

// ---------- presets ----------
async function presetList() {
  let files = [];
  try {
    files = await fs.readdir(PRESETS_DIR);
  } catch {
    console.log('Chưa có preset nào.');
    return;
  }
  const presets = files.filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json')).sort();
  if (presets.length === 0) {
    console.log('Chưa có preset nào.');
    return;
  }
  console.log('\n📋 Presets — .github/harness/presets/\n');
  for (const p of presets) {
    try {
      const raw = await fs.readFile(path.join(PRESETS_DIR, p + '.json'), 'utf8');
      const data = JSON.parse(raw);
      console.log(`  • ${p.padEnd(16)} — ${data.description || ''}`);
    } catch {
      console.log(`  • ${p} (lỗi đọc)`);
    }
  }
  console.log('\n  Dùng: harness-manager preset apply <name>\n');
}

async function presetApply(name) {
  const presetPath = path.join(PRESETS_DIR, name + '.json');
  let preset;
  try {
    const raw = await fs.readFile(presetPath, 'utf8');
    preset = JSON.parse(raw);
  } catch {
    throw new Error(`Preset "${name}" không tồn tại: ${presetPath}`);
  }
  const reg = await loadRegistry();
  let enabledCount = 0, disabledCount = 0, skipped = 0;
  for (const type of ALL_TYPES) {
    const key = type === 'skill' ? 'skills' : type + 's';
    const map = preset[key] || preset[type] || preset[type + 's'];
    if (!map) continue;
    for (const [itemName, shouldEnable] of Object.entries(map)) {
      const entry = reg[key][itemName];
      if (!entry) {
        console.warn(`⚠️  Skip ${type} "${itemName}" — không có trong registry`);
        skipped++;
        continue;
      }
      const { enabled: pE, disabled: pD } = pathsFor(type, itemName);
      const fsEnabled = existsSync(pE);
      const fsDisabled = existsSync(pD);
      if (shouldEnable && !fsEnabled && fsDisabled) {
        await fs.mkdir(path.dirname(pE), { recursive: true });
        await fs.rename(pD, pE);
        entry.enabled = true;
        enabledCount++;
      } else if (shouldEnable && fsEnabled) {
        if (!entry.enabled) { entry.enabled = true; enabledCount++; }
      } else if (!shouldEnable && fsEnabled && !fsDisabled) {
        await fs.mkdir(path.dirname(pD), { recursive: true });
        await fs.rename(pE, pD);
        entry.enabled = false;
        disabledCount++;
      } else if (!shouldEnable && fsDisabled) {
        if (entry.enabled) { entry.enabled = false; disabledCount++; }
      } else if (!fsEnabled && !fsDisabled) {
        console.warn(`⚠️  Missing file for ${type} "${itemName}"`);
        skipped++;
      }
    }
  }
  await saveRegistry(reg);
  console.log(`✅ Applied preset "${name}" — ${enabledCount} enabled, ${disabledCount} disabled${skipped ? `, ${skipped} skipped` : ''}`);
  console.log(`   ${preset.description || ''}`);
}

async function presetSave(name) {
  if (!validateName(name)) throw new Error(`Tên preset không hợp lệ: ${name}`);
  const reg = await loadRegistry();
  const preset = { name, description: `Preset ${name} — saved ${new Date().toISOString().slice(0, 10)}` };
  for (const type of ALL_TYPES) {
    const key = type === 'skill' ? 'skills' : type + 's';
    preset[key] = {};
    for (const [n, meta] of Object.entries(reg[key] || {})) {
      preset[key][n] = !!meta.enabled;
    }
  }
  const dest = path.join(PRESETS_DIR, name + '.json');
  if (existsSync(dest)) throw new Error(`Preset "${name}" đã tồn tại. Xóa file trước hoặc chọn tên khác.`);
  await fs.mkdir(PRESETS_DIR, { recursive: true });
  await fs.writeFile(dest, JSON.stringify(preset, null, 2) + '\n', 'utf8');
  console.log(`✅ Saved preset "${name}" → .github/harness/presets/${name}.json`);
}

// ---------- sync ----------
async function sync() {
  const reg = await loadRegistry();
  let total = 0, ok = 0, fail = 0;
  for (const type of ALL_TYPES) {
    const key = type === 'skill' ? 'skills' : type + 's';
    for (const [name, meta] of Object.entries(reg[key] || {})) {
      if (!meta.source || meta.source === 'local' || meta.source.startsWith('local:')) continue;
      const [owner, repo] = meta.source.split('/');
      if (!owner || !repo) continue;
      total++;
      try {
        if (type === 'skill') {
          await install({ type, owner, repo: repo.replace(/\.git$/, ''), remotePath: meta.path || '', ref: meta.ref || 'main', customName: name, force: true });
        } else {
          await install({ type, owner, repo: repo.replace(/\.git$/, ''), remotePath: meta.path || meta.file, ref: meta.ref || 'main', customName: name, force: true });
        }
        // restore enabled state
        if (!meta.enabled) await setEnabled(type, name, false);
        ok++;
        console.log(`   ✓ ${type} ${name}`);
      } catch (e) {
        fail++;
        console.error(`   ✗ ${type} ${name}: ${e.message}`);
      }
    }
  }
  if (total === 0) console.log('Không có item GitHub nào để sync (chỉ có local).');
  else console.log(`\n✅ Sync xong: ${ok}/${total} ok, ${fail} fail`);
}

// ---------- export-claude (sinh .claude/ + CLAUDE.md từ .github/ cho Claude Code) ----------
const REPO_ROOT = path.resolve(GITHUB_DIR, '..');
const CLAUDE_DIR = path.join(REPO_ROOT, '.claude');
const CLAUDE_MD_PATH = path.join(REPO_ROOT, 'CLAUDE.md');
const CLAUDE_SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const EXPORT_MANIFEST_PATH = path.join(CLAUDE_DIR, 'harness-export.json');
const EXPORT_MARKER_TEXT = 'generated by harness-manager export-claude — DO NOT EDIT';
const MARKER = (src) => `<!-- ${EXPORT_MARKER_TEXT}, edit ${src} instead -->`;
// relPath chuẩn: luôn dùng '/' (stable trong manifest)
const relPosix = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');
const absOf = (rel) => path.join(REPO_ROOT, ...rel.split('/'));

function stripBom(s) { return s.replace(/^\uFEFF/, ''); }
// Đọc asset md → { fm, body }. Lưu ý: nhiều file có BOM đầu file khiến
// parseFrontmatter regex ^--- fail âm thầm — strip trước khi parse.
async function readAsset(srcPath) {
  const text = stripBom(await fs.readFile(srcPath, 'utf8'));
  const fm = parseFrontmatter(text);
  const m = text.match(/^---\s*\n[\s\S]*?\n---[ \t]*\n?/);
  const body = m ? text.slice(m[0].length) : text;
  return { fm, body };
}

// Dictionary dịch tool names Copilot → Claude Code (ORDER MATTERS: longest-first, /memories/ trước `memory`)
const BODY_REPLACEMENTS = [
  [/\/memories\/repo\//g, 'CLAUDE.md'],
  [/\/memories\/session\//g, 'auto memory'],
  [/\/memories\//g, 'auto memory'],
  [/`memory`(?=[\s,.)]|$)/g, '`auto memory`'],
  [/(?:chạy|sống) trong VS Code Copilot Chat/g, 'chạy trong Claude Code'],
  [/multi_replace_string_in_file/g, 'Edit (nhiều chỗ, nhiều file)'],
  [/replace_string_in_file/g, 'Edit'],
  [/manage_todo_list/g, 'TodoWrite'],
  [/vscode_askQuestions/g, 'AskUserQuestion'],
  [/run_in_terminal/g, 'PowerShell'],
  [/grep_search/g, 'Grep'],
  [/read_file/g, 'Read'],
  [/list_dir/g, 'Glob'],
  [/get_errors/g, 'IDE diagnostics'],
  [/runSubagent/g, 'Agent (subagent)'],
  [/task_complete/g, 'kết thúc task'],
];
function translateBody(text) {
  let out = text;
  for (const [re, to] of BODY_REPLACEMENTS) out = out.replace(re, to);
  return out;
}

// Copilot capability tokens (agent `tools:`) → Claude tool names
const AGENT_TOOL_MAP = {
  read: ['Read'],
  search: ['Grep', 'Glob'],
  edit: ['Edit', 'Write'],
  execute: ['Bash', 'PowerShell'],
  todo: ['TodoWrite'],
  web: ['WebSearch', 'WebFetch'],
  agent: ['Agent'],
};
function mapToolList(raw) {
  if (!raw) return [];
  const tokens = String(raw).replace(/^\[|\]$/g, '').split(',').map(t => t.trim()).filter(Boolean);
  const out = [];
  for (const t of tokens) {
    const mapped = AGENT_TOOL_MAP[t.toLowerCase()];
    if (!mapped) { console.warn(`⚠️  Unknown tool token "${t}" — dropped in export`); continue; }
    for (const m of mapped) if (!out.includes(m)) out.push(m);
  }
  return out;
}

// Replacement riêng cho copilot-instructions.md → CLAUDE.md (chạy TRƯỚC translateBody)
const CLAUDE_MD_REPLACEMENTS = [
  [/Cách gọi: gõ `\/` → chọn trong list → điền `task` → `Enter`\. Yêu cầu \*\*Agent mode\*\* \(dropdown Chat\)\./,
   'Cách gọi: gõ `/<tên>` trong hộp thoại Claude Code rồi nhập arguments.'],
  [/Nếu không hiện gợi ý: `Developer: Reload Window` → kiểm tra `agent: agent` trong frontmatter và `chat\.mcp\.enabled`\./,
   'Nếu không thấy lệnh: chạy lại `harness-manager.mjs export-claude` và kiểm tra `.claude/commands/` có file tương ứng.'],
];

function fmQuote(v) { return JSON.stringify(String(v)); }
// Ghép marker + body: đúng 1 dòng trống giữa marker và nội dung, kết thúc bằng \n
function withMarker(marker, body) {
  return marker + '\n\n' + body.replace(/^[ \t]*(\r?\n)+/, '').replace(/(\r?\n)+$/, '\n');
}

// Asset được export = enabled trong registry VÀ tồn tại trên filesystem (trust filesystem như setEnabled)
async function enabledAssets(reg, type) {
  const key = type === 'skill' ? 'skills' : type + 's';
  const out = [];
  for (const [name, entry] of Object.entries(reg[key] || {})) {
    if (!entry.enabled) continue;
    const p = pathsFor(type, name).enabled;
    if (!existsSync(p)) { console.warn(`⚠️  ${type} "${name}" enabled trong registry nhưng thiếu file — skip`); continue; }
    out.push({ name, entry, srcPath: p });
  }
  return out;
}

async function buildAgents(reg) {
  const files = [];
  for (const { name, entry, srcPath } of await enabledAssets(reg, 'agent')) {
    const { fm, body } = await readAsset(srcPath);
    const src = relPosix(srcPath);
    const lines = [`name: ${name}`, `description: ${fmQuote(fm.description || entry.description || `Agent ${name}`)}`];
    const tools = mapToolList(fm.tools);
    if (tools.length) lines.push(`tools: ${tools.join(', ')}`);
    const content = `---\n${lines.join('\n')}\n---\n` + withMarker(MARKER(src), translateBody(body));
    files.push({ rel: `.claude/agents/${name}.md`, content, source: src });
  }
  return files;
}

async function buildCommands(reg) {
  const files = [];
  for (const { name, entry, srcPath } of await enabledAssets(reg, 'prompt')) {
    const { fm, body } = await readAsset(srcPath);
    const src = relPosix(srcPath);
    const lines = [`description: ${fmQuote(fm.description || entry.description || `/${name}`)}`];
    if (fm['argument-hint']) lines.push(`argument-hint: ${fmQuote(fm['argument-hint'])}`);
    const translated = translateBody(body).replace(/\$\{input:[^}]*\}/g, '$ARGUMENTS');
    const content = `---\n${lines.join('\n')}\n---\n` + withMarker(MARKER(src), translated);
    files.push({ rel: `.claude/commands/${name}.md`, content, source: src });
  }
  return files;
}

async function buildRules(reg) {
  const files = [];
  for (const { name, entry, srcPath } of await enabledAssets(reg, 'instruction')) {
    const { fm, body } = await readAsset(srcPath);
    const src = relPosix(srcPath);
    const applyTo = (fm.applyTo || entry.applyTo || '**').trim();
    // applyTo "**" → rule luôn load (không frontmatter); glob khác → paths: list
    let head = '';
    if (applyTo !== '**') head = `---\npaths:\n  - ${fmQuote(applyTo)}\n---\n`;
    const content = head + withMarker(MARKER(src), translateBody(body));
    files.push({ rel: `.claude/rules/${name}.md`, content, source: src });
  }
  return files;
}

const SKILL_FM_KEYS = ['description', 'user-invocable', 'argument-hint', 'allowed-tools', 'license'];
async function walkDirRecursive(dir, base) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await walkDirRecursive(full, rel));
    else out.push({ rel, full });
  }
  return out;
}
// Cây file expected của 1 skill dir — SKILL.md đã transform, còn lại copy byte-for-byte
async function buildSkillTree(srcDir) {
  const all = await walkDirRecursive(srcDir, '');
  const tree = [];
  for (const f of all) {
    if (f.rel === 'SKILL.md') {
      const { fm, body } = await readAsset(f.full);
      const src = relPosix(f.full);
      const lines = [`name: ${path.basename(srcDir)}`];
      for (const k of SKILL_FM_KEYS) {
        if (fm[k] !== undefined && fm[k] !== '') lines.push(`${k}: ${fmQuote(fm[k])}`);
      }
      const content = `---\n${lines.join('\n')}\n---\n` + withMarker(MARKER(src), translateBody(body));
      tree.push({ rel: 'SKILL.md', bytes: Buffer.from(content, 'utf8') });
    } else {
      tree.push({ rel: f.rel, bytes: await fs.readFile(f.full) });
    }
  }
  return tree;
}
function bytesDigest(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function treeDigest(tree) {
  const h = crypto.createHash('sha256');
  for (const f of [...tree].sort((a, b) => a.rel.localeCompare(b.rel))) {
    h.update(f.rel); h.update('\0'); h.update(bytesDigest(f.bytes)); h.update('\n');
  }
  return h.digest('hex');
}

async function buildSkills(reg) {
  const dirs = [];
  for (const { name, srcPath } of await enabledAssets(reg, 'skill')) {
    const tree = await buildSkillTree(srcPath);
    dirs.push({
      rel: `.claude/skills/${name}`,
      source: relPosix(path.join(srcPath, 'SKILL.md')),
      tree,
      digest: treeDigest(tree),
    });
  }
  return dirs;
}

// Hook event không có matcher → "". PostToolUse special-case theo ý nghĩa hook hiện tại (post-edit checks)
const HOOK_MATCHER_DEFAULTS = { PostToolUse: 'Edit|Write|MultiEdit|NotebookEdit' };
async function collectHooks(reg) {
  const byEvent = {}; // event → [{type, command, timeout}]
  const commands = [];
  for (const { name, srcPath } of await enabledAssets(reg, 'hook')) {
    let data;
    try {
      data = JSON.parse(stripBom(await fs.readFile(srcPath, 'utf8')));
    } catch (e) {
      console.warn(`⚠️  hook "${name}": JSON lỗi (${e.message}) — skip`);
      continue;
    }
    for (const [event, handlers] of Object.entries(data.hooks || {})) {
      if (!Array.isArray(handlers)) continue;
      for (const h of handlers) {
        if (!h || h.type !== 'command' || !h.command) continue;
        const command = translateBody(h.command);
        if (!byEvent[event]) byEvent[event] = [];
        const entry = { type: 'command', command };
        if (typeof h.timeout === 'number') entry.timeout = h.timeout;
        byEvent[event].push(entry);
        commands.push(command);
      }
    }
  }
  return { byEvent, commands };
}

async function buildClaudeMd() {
  const srcPath = path.join(GITHUB_DIR, 'copilot-instructions.md');
  if (!existsSync(srcPath)) return null;
  let text = stripBom(await fs.readFile(srcPath, 'utf8'));
  for (const [re, to] of CLAUDE_MD_REPLACEMENTS) text = text.replace(re, to);
  const src = relPosix(srcPath);
  return { rel: 'CLAUDE.md', content: withMarker(MARKER(src), translateBody(text)), source: src };
}

async function loadManifest() {
  try {
    const data = JSON.parse(await fs.readFile(EXPORT_MANIFEST_PATH, 'utf8'));
    if (!data.files) data.files = {};
    if (!Array.isArray(data.hookCommands)) data.hookCommands = [];
    return data;
  } catch {
    return { version: 1, files: {}, hookCommands: [] };
  }
}

// Merge hooks vào .claude/settings.json — giữ mọi key khác, remove managed hooks cũ rồi append mới
async function mergeHooksIntoSettings({ byEvent, commands }, oldHookCommands, check) {
  let settings = {};
  if (existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      settings = JSON.parse(await fs.readFile(CLAUDE_SETTINGS_PATH, 'utf8'));
      if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) throw new Error('không phải object');
    } catch (e) {
      throw new Error(`.claude/settings.json lỗi (${e.message}) — KHÔNG ghi đè để tránh phá config. Tự sửa/xóa file rồi chạy lại.`);
    }
  }
  const oldSet = new Set(oldHookCommands);
  const hooks = settings.hooks && typeof settings.hooks === 'object' && !Array.isArray(settings.hooks) ? settings.hooks : {};
  // 1) strip managed hooks cũ (để re-run không duplicate)
  for (const [event, blocks] of Object.entries(hooks)) {
    if (!Array.isArray(blocks)) continue;
    const stripped = [];
    for (const block of blocks) {
      if (!block || !Array.isArray(block.hooks)) { stripped.push(block); continue; }
      const kept = block.hooks.filter(h => !(h && oldSet.has(h.command)));
      if (kept.length) stripped.push({ ...block, hooks: kept });
    }
    if (stripped.length) hooks[event] = stripped;
    else delete hooks[event];
  }
  // 2) append hooks mới (mỗi event 1 matcher block)
  for (const [event, handlerList] of Object.entries(byEvent)) {
    if (!handlerList.length) continue;
    const block = { matcher: HOOK_MATCHER_DEFAULTS[event] ?? '', hooks: handlerList };
    if (!Array.isArray(hooks[event])) hooks[event] = [];
    hooks[event].push(block);
  }
  settings.hooks = hooks;
  const newContent = JSON.stringify(settings, null, 2) + '\n';
  const disk = existsSync(CLAUDE_SETTINGS_PATH) ? await fs.readFile(CLAUDE_SETTINGS_PATH, 'utf8') : null;
  const changed = disk !== newContent;
  if (changed && !check) {
    await fs.mkdir(CLAUDE_DIR, { recursive: true });
    await fs.writeFile(CLAUDE_SETTINGS_PATH, newContent, 'utf8');
  }
  return { changed };
}

async function exportClaude({ check = false } = {}) {
  const reg = await loadRegistry();
  const prefix = check ? '[check] ' : '';
  const manifest = await loadManifest();

  // ---- build expected set ----
  const files = new Map(); // rel → { content, source }
  const addFile = (f) => {
    if (files.has(f.rel)) console.warn(`⚠️  Trùng đích ${f.rel} (từ ${f.source}) — file sau ghi đè`);
    files.set(f.rel, f);
  };
  for (const f of await buildAgents(reg)) addFile(f);
  for (const f of await buildCommands(reg)) addFile(f);
  for (const f of await buildRules(reg)) addFile(f);
  const skills = await buildSkills(reg);
  const claudeMd = await buildClaudeMd();

  // Collision guard: CLAUDE.md tồn tại nhưng không do export-claude tạo → không đè
  let claudeMdSkipped = false;
  if (claudeMd && existsSync(CLAUDE_MD_PATH)) {
    const disk = await fs.readFile(CLAUDE_MD_PATH, 'utf8');
    if (!disk.includes(EXPORT_MARKER_TEXT)) {
      console.warn(`⚠️  CLAUDE.md tồn tại (không do export-claude tạo) — không ghi đè. Tự merge nội dung từ .github/copilot-instructions.md rồi xóa đi để export.`);
      claudeMdSkipped = true;
    }
  }

  const counts = { created: 0, updated: 0, unchanged: 0, deleted: 0, kept: 0, skipped: 0 };
  const newFilesMeta = {}; // rel → sha256 | {dir:true, digest}
  const diffs = [];

  // ---- write plain files ----
  const writeIfChanged = async (rel, bytes) => {
    const abs = absOf(rel);
    const existed = existsSync(abs);
    let changed = true;
    if (existed) {
      try { changed = !(await fs.readFile(abs)).equals(Buffer.from(bytes)); } catch {}
    }
    if (!changed) { counts.unchanged++; return false; }
    diffs.push(rel);
    if (check) { counts.skipped++; return true; }
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);
    if (existed) counts.updated++; else counts.created++;
    return true;
  };

  for (const [rel, f] of files) {
    newFilesMeta[rel] = bytesDigest(Buffer.from(f.content, 'utf8'));
    await writeIfChanged(rel, Buffer.from(f.content, 'utf8'));
  }
  if (claudeMd && !claudeMdSkipped) {
    newFilesMeta[claudeMd.rel] = bytesDigest(Buffer.from(claudeMd.content, 'utf8'));
    await writeIfChanged(claudeMd.rel, Buffer.from(claudeMd.content, 'utf8'));
  }

  // ---- skill dirs: rebuild khi digest đổi hoặc thiếu ----
  for (const s of skills) {
    newFilesMeta[s.rel] = { dir: true, digest: s.digest };
    const absDir = absOf(s.rel);
    const recorded = manifest.files[s.rel];
    const same = recorded && recorded.dir && recorded.digest === s.digest;
    let dirOk = same;
    if (same && !existsSync(absDir)) dirOk = false;
    if (dirOk) { counts.unchanged++; continue; }
    diffs.push(s.rel + '/');
    if (check) { counts.skipped++; continue; }
    const skillExisted = existsSync(absDir);
    await fs.rm(absDir, { recursive: true, force: true });
    for (const t of s.tree) {
      const abs = path.join(absDir, ...t.rel.split('/'));
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, t.bytes);
    }
    if (skillExisted) counts.updated++; else counts.created++;
  }

  // ---- orphan cleanup: có trong manifest cũ nhưng không còn trong expected ----
  for (const [rel, meta] of Object.entries(manifest.files)) {
    if (newFilesMeta[rel]) continue; // vẫn expected
    const abs = absOf(rel);
    if (!existsSync(abs)) continue; // đã bị xóa tay
    // chỉ xóa thứ mình generate: hash khớp (file) hoặc marker (dir skill)
    let safe = false;
    if (typeof meta === 'string') {
      const disk = bytesDigest(await fs.readFile(abs));
      safe = disk === meta;
    } else if (meta && meta.dir) {
      const sk = path.join(abs, 'SKILL.md');
      safe = existsSync(sk) && (await fs.readFile(sk, 'utf8')).includes(EXPORT_MARKER_TEXT);
    }
    if (!safe) {
      console.warn(`⚠️  ${rel} đã bị sửa tay — giữ nguyên, không xóa (nguồn đã disable/xóa)`);
      counts.kept++;
      continue;
    }
    diffs.push(rel + ' (xóa)');
    if (check) { counts.skipped++; continue; }
    await fs.rm(abs, { recursive: true, force: true });
    counts.deleted++;
  }

  // ---- hooks → settings.json merge ----
  const hookData = await collectHooks(reg);
  const { changed: hooksChanged } = await mergeHooksIntoSettings(hookData, manifest.hookCommands, check);
  if (hooksChanged) diffs.push('.claude/settings.json (hooks)');

  // ---- save manifest (chỉ khi có thay đổi; không có timestamp để idempotent) ----
  const newManifest = { version: 1, generator: 'harness-manager export-claude', files: newFilesMeta, hookCommands: hookData.commands };
  const manifestChanged = JSON.stringify(manifest.files) !== JSON.stringify(newFilesMeta)
    || JSON.stringify(manifest.hookCommands) !== JSON.stringify(hookData.commands);
  if (!check && manifestChanged) {
    await fs.mkdir(CLAUDE_DIR, { recursive: true });
    await fs.writeFile(EXPORT_MANIFEST_PATH, JSON.stringify(newManifest, null, 2) + '\n', 'utf8');
  }

  // ---- summary ----
  const n = (re) => [...files.values()].filter(f => re.test(f.rel)).length;
  console.log(`\n🤖 ${prefix}export-claude — .github/ → .claude/ + CLAUDE.md (một chiều)`);
  console.log(`   ${n(/\.claude\/agents\//)} agents · ${n(/\.claude\/commands\//)} commands · ${n(/\.claude\/rules\//)} rules · ${skills.length} skills · ${hookData.commands.length} hooks${claudeMd && !claudeMdSkipped ? ' · CLAUDE.md' : ''}`);
  console.log(`   ✅ ${counts.created} mới · ${counts.updated} cập nhật · ${counts.deleted} xóa (orphan) · ${counts.unchanged} unchanged${counts.kept ? ` · ⚠️ ${counts.kept} giữ nguyên (sửa tay)` : ''}${counts.skipped ? ` · ${counts.skipped} sẽ thay đổi` : ''}`);
  if (check) {
    if (diffs.length) {
      console.log(`\n❌ export-claude --check: ${diffs.length} sai lệch so với .github/:`);
      for (const d of diffs) console.log(`   • ${d}`);
      process.exitCode = 1;
    } else {
      console.log(`\n✅ export-claude --check: .claude/ khớp với .github/ — không có gì để regenerate`);
    }
    return;
  }
  console.log(`   Chạy lại sau mỗi enable/disable/create/preset apply. Commit cả .claude/ + CLAUDE.md.\n`);
}

// ---------- help ----------
function help() {
  console.log(`
Harness Manager — tháo lắp toàn bộ customizations (wise)

Usage:
  node .github/harness/scripts/harness-manager.mjs <command> [options]

Commands:
  list [--type <type>]          Liệt kê (type: skill|instruction|agent|prompt|hook)
  status                        Tóm tắt enabled/disabled per type
  enable <type> <name>          Bật (move .disabled → enabled)
  disable <type> <name>         Tắt (move enabled → .disabled) — không xóa
  uninstall <type> <name>       Gỡ hẳn (xóa file + registry)

  install <type> <owner/repo> [--path path/to/file] [--ref main] [--name custom] [--force]
                                Cài từ GitHub. Với skill --path là folder, với các type khác là file.
  install <type> --local <path> [--name custom] [--force]
                                Cài từ local file/folder (test offline)

  create <type> <name>          Scaffold mới từ template (instruction|agent|prompt|skill|hook)
  preset list                   Liệt kê presets
  preset apply <name>           Áp preset (bật/tắt theo preset)
  preset save <name>            Lưu bộ đang bật thành preset mới
  sync                          Cài lại tất cả items GitHub từ registry (sau khi clone)
  export-claude [--check]       Sinh .claude/ + CLAUDE.md (Claude Code) từ registry — idempotent,
                                one-way .github → .claude. --check = dry-run, exit 1 nếu lệch (CI)
  help                          Hiện trợ giúp này

Types: skill | instruction | agent | prompt | hook

Ví dụ:
  harness-manager list
  harness-manager disable instruction product-quality
  harness-manager enable agent designer
  harness-manager install instruction owner/repo --path instructions/nextjs.instructions.md
  harness-manager create instruction my-rule
  harness-manager preset apply web-product
  harness-manager preset apply api-minimal
  harness-manager preset save my-preset
  harness-manager export-claude

Tháo lắp:
  - Disable = move file/folder → .disabled/ + registry.enabled=false (không xóa)
  - Enable  = move ngược lại
  - Registry: .github/harness/registry.json (commit vào git)
  - Presets: .github/harness/presets/*.json
  - Templates: .github/harness/templates/

Wise usage:
  - Agent chỉ load khi description/applyTo match task
  - Đừng bật 20 thứ cùng lúc — dùng preset cho từng dự án
  - Xem: .github/skills/custom-registry/SKILL.md

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
    if (cmd === 'list' || cmd === 'ls') {
      let filter = null;
      const idx = args.indexOf('--type');
      if (idx !== -1) filter = args[idx + 1];
      else if (args[1] && ALL_TYPES.includes(args[1])) filter = args[1];
      return await list(filter);
    }
    if (cmd === 'status') return await status();
    if (cmd === 'enable') {
      const type = args[1], name = args[2];
      if (!type || !name) throw new Error('Dùng: enable <type> <name>  (vd: enable instruction product-quality)');
      return await setEnabled(type, name, true);
    }
    if (cmd === 'disable') {
      const type = args[1], name = args[2];
      if (!type || !name) throw new Error('Dùng: disable <type> <name>  (vd: disable instruction product-quality)');
      return await setEnabled(type, name, false);
    }
    if (cmd === 'uninstall' || cmd === 'remove' || cmd === 'rm') {
      const type = args[1], name = args[2];
      if (!type || !name) throw new Error('Dùng: uninstall <type> <name>');
      return await uninstall(type, name);
    }
    if (cmd === 'create') {
      const type = args[1], name = args[2];
      if (!type || !name) throw new Error('Dùng: create <type> <name>  (vd: create instruction my-rule)');
      return await create(type, name);
    }
    if (cmd === 'preset') {
      const sub = args[1];
      if (sub === 'list' || sub === 'ls' || !sub) return await presetList();
      if (sub === 'apply') {
        const name = args[2];
        if (!name) throw new Error('Dùng: preset apply <name>');
        return await presetApply(name);
      }
      if (sub === 'save') {
        const name = args[2];
        if (!name) throw new Error('Dùng: preset save <name>');
        return await presetSave(name);
      }
      throw new Error(`Unknown preset subcommand: ${sub} (list|apply|save)`);
    }
    if (cmd === 'sync') return await sync();
    if (cmd === 'export-claude' || cmd === 'export') {
      const check = args.includes('--check');
      return await exportClaude({ check });
    }
    if (cmd === 'install' || cmd === 'add') {
      const type = args[1];
      if (!type || !ALL_TYPES.includes(type)) throw new Error(`Thiếu type. Dùng: install <type> <owner/repo>  (type: ${ALL_TYPES.join('|')})`);
      let source = null;
      let localPath = null;
      let remotePath = '';
      let ref = 'main';
      let customName = null;
      let force = false;
      let i = 2;
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
      if (localPath) return await install({ type, localPath, customName, force });
      if (!source) throw new Error(`Thiếu <owner/repo>. Ví dụ: install ${type} owner/repo --path path/to/file`);
      const [owner, repo] = source.split('/');
      if (!owner || !repo) throw new Error(`Source không hợp lệ: "${source}" — phải là owner/repo`);
      return await install({ type, owner, repo: repo.replace(/\.git$/, ''), remotePath, ref, customName, force });
    }
    throw new Error(`Unknown command: ${cmd}. Chạy "help" để xem.`);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exitCode = 1;
  }
}

main();
