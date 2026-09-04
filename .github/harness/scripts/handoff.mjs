#!/usr/bin/env node
/**
 * Handoff — P1-1 Harness 2.1 (Lesson 08 Multi-Agent)
 * Rule-based agent handoff with explicit rules + visibility.
 * Usage:
 *   node handoff.mjs --from implement --to polish --reason "ui-changed"
 *   node handoff.mjs --from implement --to foo --reason "x"
 *   node handoff.mjs --list
 * Exit: 0 = permitted, 1 = refused, 2 = error
 * No deps, Node 18+
 */

export const AGENTS = ['explore', 'plan', 'design', 'implement', 'polish', 'verify', 'yunie'];

export const RULES = [
  { id: 'implement-polish-ui', from: 'implement', to: 'polish', match: (reason) => /ui|css|style|responsive|polish/i.test(reason || '') },
  { id: 'implement-verify-default', from: 'implement', to: 'verify', match: () => true },
  { id: 'polish-verify-default', from: 'polish', to: 'verify', match: () => true },
  { id: 'verify-implement-fail', from: 'verify', to: 'implement', match: (reason) => /fail|error|fix|retry/i.test(reason || '') },
  { id: 'plan-implement-approved', from: 'plan', to: 'implement', match: (reason) => /approv|ok|confirm|pass/i.test(reason || '') },
  { id: 'explore-plan-default', from: 'explore', to: 'plan', match: () => true },
  { id: 'design-implement-default', from: 'design', to: 'implement', match: () => true },
  { id: 'yunie-any', from: 'yunie', to: '*', match: () => true },
];

export function checkHandoff(from, to, reason = '') {
  if (!AGENTS.includes(from)) {
    return { permitted: false, rule: null, reason: `unknown from agent: ${from} (must be one of: ${AGENTS.join(', ')})` };
  }
  if (!AGENTS.includes(to)) {
    return { permitted: false, rule: null, reason: `unknown to agent: ${to} (must be one of: ${AGENTS.join(', ')})` };
  }
  if (from === to) {
    return { permitted: false, rule: null, reason: 'from and to must differ' };
  }
  for (const r of RULES) {
    const fromOk = r.from === from;
    const toOk = r.to === '*' || r.to === to;
    if (fromOk && toOk && r.match(reason)) {
      return { permitted: true, rule: r.id, reason: `matched ${r.id}` };
    }
  }
  return { permitted: false, rule: null, reason: `no rule for ${from}→${to} (reason: "${reason}")` };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) {
    console.log('Agents: ' + AGENTS.join(', '));
    console.log('Rules:');
    RULES.forEach(r => console.log(`  - ${r.id}: ${r.from}→${r.to}`));
    process.exit(0);
  }
  const from = args.from;
  const to = args.to;
  const reason = args.reason || '';
  if (!from || !to) {
    console.error('Usage: handoff.mjs --from <agent> --to <agent> [--reason "..."] [--json]');
    process.exit(2);
  }
  const res = checkHandoff(from, to, reason);
  if (args.json) console.log(JSON.stringify({ from, to, reason, ...res }, null, 2));
  else if (res.permitted) console.log(`✅ handoff permitted: ${from}→${to} (${res.rule}) ${reason ? `reason="${reason}"` : '(no reason — add one for visibility)'}`);
  else console.log(`⛔ handoff refused: ${from}→${to} — ${res.reason}`);
  if (!reason && res.permitted) console.error('⚠️ warning: empty reason (add --reason for visibility)');
  process.exit(res.permitted ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main();

export default { AGENTS, RULES, checkHandoff };
