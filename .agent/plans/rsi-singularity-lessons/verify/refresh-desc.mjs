#!/usr/bin/env node
/**
 * One-time: refresh stale registry descriptions from SKILL.md frontmatter (KN-045 pattern).
 * Scope: 3 skills changed by distill-agnostic (2026-09-12, KN-047/048 wave).
 * Slice 300 chars — cùng convention scanFs() của harness-manager.
 */
import fs from 'node:fs';

const SKILLS = ['harness-governance', 'harness-process', 'harness-web-ui'];
const FILES = ['.github/harness/registry.json', '.github/skills/registry.json'];

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

for (const file of FILES) {
  if (!fs.existsSync(file)) { console.log(`skip (missing): ${file}`); continue; }
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  for (const s of SKILLS) {
    if (!j.skills || !j.skills[s]) continue;
    const desc = parseFrontmatter(fs.readFileSync(`.github/skills/${s}/SKILL.md`, 'utf8')).description || '';
    const next = desc.slice(0, 300);
    if (next && j.skills[s].description !== next) { j.skills[s].description = next; n++; console.log(`  ↻ ${s}`); }
  }
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
  console.log(`${file} — updated ${n}`);
}
