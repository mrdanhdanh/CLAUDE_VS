#!/usr/bin/env node
/**
 * Plan Validate — P0-3 Harness 2.1 (Lesson 07 Planning Structured Output)
 * Validate plan.md frontmatter YAML subset + route subtasks to agents.
 * Usage:
 *   node plan-validate.mjs --file .agent/plans/foo/plan.md
 *   node plan-validate.mjs --file plan.md --route
 *   node plan-validate.mjs --file plan.md --json
 * Exit: 0 = valid (incl. legacy+warning), 1 = invalid, 2 = error
 * No deps, Node 18+
 */
import fs from 'node:fs';
import path from 'node:path';

export const AGENTS = ['explore', 'plan', 'design', 'implement', 'polish', 'verify', 'yunie'];

// ---------- Minimal YAML subset parser ----------
// Supports:
//   plan:
//     main_task: "..." (or '...' or bare)
//     is_greeting: true|false
//     subtasks:
//       - task_details: "..."
//         assigned_agent: implement
// Also supports inline comments (# ...) and quoted strings.
function stripComment(line) {
  // Remove # comment not inside quotes
  let inSingle = false, inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === '#' && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

function unquote(s) {
  s = String(s).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseScalar(s) {
  s = String(s).trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  return unquote(s);
}

export function parseFrontmatter(text) {
  const m = String(text).match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { frontmatter: null, body: String(text) };
  const yaml = m[1];
  const body = String(text).slice(m[0].length);
  try {
    const frontmatter = parseYamlSubset(yaml);
    return { frontmatter, body };
  } catch (e) {
    return { frontmatter: null, body: String(text), parseError: e.message };
  }
}

function parseYamlSubset(yaml) {
  const lines = yaml.split('\n').map(l => stripComment(l).replace(/\r$/, ''));
  const root = {};
  // Very small state machine for our known shape:
  // plan:
  //   main_task: ...
  //   is_greeting: ...
  //   subtasks:
  //     - task_details: ...
  //       assigned_agent: ...
  let currentTop = null;
  let currentSubtask = null;
  let inSubtasks = false;
  let planObj = null;

  for (let raw of lines) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^(\s*)/)[1].length;
    const trimmed = raw.trim();
    if (trimmed.startsWith('- ')) {
      // list item — only subtasks supported
      if (!inSubtasks) throw new Error(`Unexpected list item outside subtasks: ${trimmed}`);
      currentSubtask = {};
      if (!planObj.subtasks) planObj.subtasks = [];
      planObj.subtasks.push(currentSubtask);
      const rest = trimmed.slice(2).trim();
      if (rest) {
        const idx = rest.indexOf(':');
        if (idx !== -1) {
          const k = rest.slice(0, idx).trim();
          const v = rest.slice(idx + 1).trim();
          currentSubtask[k] = parseScalar(v);
        }
      }
      continue;
    }
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();

    if (indent === 0) {
      currentTop = key;
      inSubtasks = false;
      currentSubtask = null;
      if (val) {
        root[key] = parseScalar(val);
        planObj = null;
      } else {
        if (key === 'plan') {
          planObj = {};
          root[key] = planObj;
        } else {
          root[key] = {};
        }
      }
    } else if (indent === 2 && currentTop === 'plan' && planObj) {
      if (key === 'subtasks' && !val) {
        inSubtasks = true;
        planObj.subtasks = [];
      } else if (key === 'subtasks' && val) {
        // inline empty?
        planObj.subtasks = parseScalar(val);
        inSubtasks = false;
      } else {
        planObj[key] = parseScalar(val);
        inSubtasks = false;
      }
      currentSubtask = null;
    } else if (indent >= 4 && inSubtasks && currentSubtask) {
      currentSubtask[key] = parseScalar(val);
    } else if (indent === 2 && currentTop !== 'plan') {
      root[currentTop][key] = parseScalar(val);
    }
  }
  return root;
}

export function validatePlan(text) {
  const { frontmatter, parseError } = parseFrontmatter(text);
  if (parseError) {
    return { valid: false, errors: [`frontmatter parse error: ${parseError}`], warnings: [], plan: null };
  }
  if (!frontmatter || !frontmatter.plan) {
    return { valid: true, errors: [], warnings: ['legacy markdown (no frontmatter plan)'], plan: null };
  }
  const errors = [];
  const warnings = [];
  const plan = frontmatter.plan;

  if (typeof plan !== 'object' || plan === null || Array.isArray(plan)) {
    return { valid: false, errors: ['plan must be an object'], warnings, plan: null };
  }
  if (!plan.main_task || typeof plan.main_task !== 'string' || !plan.main_task.trim()) {
    errors.push('plan.main_task must be a non-empty string');
  } else if (plan.main_task.trim().length < 3) {
    errors.push('plan.main_task too short (min 3 chars)');
  }
  if (plan.is_greeting !== undefined && typeof plan.is_greeting !== 'boolean') {
    errors.push('plan.is_greeting must be boolean');
  }
  if (!Array.isArray(plan.subtasks)) {
    errors.push('plan.subtasks must be an array');
  } else if (plan.subtasks.length < 1 || plan.subtasks.length > 10) {
    errors.push(`plan.subtasks must have 1-10 items (got ${plan.subtasks.length})`);
  } else {
    plan.subtasks.forEach((st, i) => {
      const n = i + 1;
      if (!st || typeof st !== 'object') {
        errors.push(`subtask #${n} must be an object`);
        return;
      }
      if (!st.task_details || typeof st.task_details !== 'string' || !st.task_details.trim()) {
        errors.push(`subtask #${n}: task_details must be a non-empty string`);
      } else if (st.task_details.trim().length < 3 || st.task_details.trim().length > 200) {
        errors.push(`subtask #${n}: task_details must be 3-200 chars`);
      }
      if (!st.assigned_agent || typeof st.assigned_agent !== 'string') {
        errors.push(`subtask #${n}: assigned_agent is required`);
      } else if (!AGENTS.includes(st.assigned_agent)) {
        errors.push(`subtask #${n}: assigned_agent must be one of: ${AGENTS.join(', ')} (got "${st.assigned_agent}")`);
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings, plan: errors.length === 0 ? plan : null };
}

export function routePlan(plan) {
  const map = {};
  if (!plan || !Array.isArray(plan.subtasks)) return map;
  for (const st of plan.subtasks) {
    const agent = st.assigned_agent;
    if (!map[agent]) map[agent] = [];
    map[agent].push(st.task_details);
  }
  return map;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args.file || args.f;
  if (!file) {
    console.error('Usage: plan-validate.mjs --file <plan.md> [--route] [--json]');
    process.exit(2);
  }
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    console.error(`❌ file not found: ${full}`);
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch (e) {
    console.error(`❌ read failed: ${e.message}`);
    process.exit(2);
  }
  const res = validatePlan(text);
  if (args.json) {
    const out = { ...res };
    if (args.route && res.valid && res.plan) out.route = routePlan(res.plan);
    console.log(JSON.stringify(out, null, 2));
  } else {
    if (!res.valid) {
      console.error(`❌ plan invalid: ${full}`);
      res.errors.forEach(e => console.error(`  - ${e}`));
    } else if (res.warnings.length > 0) {
      console.log(`⚠️ plan valid (legacy): ${full}`);
      res.warnings.forEach(w => console.log(`  - ${w}`));
      if (res.plan) console.log(`✅ plan valid: ${res.plan.subtasks.length} subtasks`);
    } else {
      console.log(`✅ plan valid: ${res.plan.subtasks.length} subtasks — "${res.plan.main_task.slice(0, 60)}"`);
    }
    if (args.route && res.valid && res.plan) {
      const map = routePlan(res.plan);
      console.log('--- route ---');
      for (const [agent, tasks] of Object.entries(map)) {
        console.log(`  ${agent}:`);
        tasks.forEach(t => console.log(`    - ${t}`));
      }
    }
  }
  process.exit(res.valid ? 0 : 1);
}

// Only run main if executed directly (not imported)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain) main();
