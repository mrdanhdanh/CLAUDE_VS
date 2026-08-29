#!/usr/bin/env node
/**
 * Harness Manager — tháo lắp toàn bộ customizations (skill/instruction/agent/prompt/hook) + preset
 * Usage: node harness-manager.mjs <command> [args]
 * No deps, Node 18+ (fetch built-in)
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
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
