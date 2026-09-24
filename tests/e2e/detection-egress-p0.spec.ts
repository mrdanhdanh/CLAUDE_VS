import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const NODE = process.execPath;

function run(script: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(NODE, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 15_000,
    env: { ...process.env, ...env },
  });
  return { code: result.status, out: `${result.stdout || ''}${result.stderr || ''}` };
}

function writeBug(root: string, slug: string, detection: string) {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const field = detection === '' ? '' : `- **Detection:** \`${detection}\`\n`;
  fs.writeFileSync(path.join(dir, 'bug.md'), `# Bug: ${slug}\n\n## Meta\n- **Status:** \`fixed\`\n${field}`, 'utf8');
}

function runCua(args: string[]) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cua-cli-'));
  try {
    const script = path.join(fixture, '.github', 'harness', 'scripts', 'cua-guard.mjs');
    fs.mkdirSync(path.dirname(script), { recursive: true });
    fs.copyFileSync(path.join(ROOT, '.github', 'harness', 'scripts', 'cua-guard.mjs'), script);
    fs.writeFileSync(path.join(fixture, '.github', 'harness', 'cua-identity-policy.json'), JSON.stringify({ version: 1, allow: [] }));
    const result = spawnSync(NODE, [script, ...args], { cwd: fixture, encoding: 'utf8', timeout: 15_000 });
    return { code: result.status, out: `${result.stdout || ''}${result.stderr || ''}` };
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

async function loadCuaModule(allow: string[] = []) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-cua-api-'));
  const scriptPath = path.join(fixture, '.github', 'harness', 'scripts', 'cua-guard.mjs');
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.copyFileSync(path.join(ROOT, '.github', 'harness', 'scripts', 'cua-guard.mjs'), scriptPath);
  fs.writeFileSync(path.join(fixture, '.github', 'harness', 'cua-identity-policy.json'), JSON.stringify({ version: 1, allow }));
  const module = await import(pathToFileURL(scriptPath).href) as { checkAction: (request: Record<string, unknown>) => Record<string, unknown> };
  return {
    checkAction: module.checkAction,
    module,
    evidencePath: path.join(fixture, '.agent', 'cua', 'evidence.jsonl'),
    cleanup: () => fs.rmSync(fixture, { recursive: true, force: true }),
  };
}

const CUA_OPTION_CASES: Array<[string[], string]> = [
  [['check', '--action', 'read', '--url', 'https://docs.example.com', '--token-ttl'], 'requires a value'],
  [['check', '--action', 'read', '--url', 'https://docs.example.com', '--token-ttl', '1', '--token-ttl', '2'], 'duplicate --token-ttl'],
  [['check', '--action', 'read', '--url', 'https://docs.example.com', '--unknown', 'x'], 'unknown option --unknown'],
  [['check', '--action', 'read', '--url', 'https://docs.example.com', '--token-ttl=999'], 'exceeds max'],
];

function expectedDetection() {
  return {
    total: 8,
    classified: 5,
    unknown: 1,
    invalid: 2,
    modes: { GATE: 1, THREW: 1, HUMAN: 1, OPERATOR: 1, LATER: 1 },
    automated: 2,
    automatedShare: 0.4,
  };
}

function writeLedger(evidencePath: string, decision: string, count: number) {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  const ts = new Date().toISOString();
  const record = { ts, decision, action: 'read', origin: 'https://docs.example.com', reasonCode: 'identity', approvedByCaller: false, policyVersion: '1.2.0', egress: 'docs.example.com' };
  fs.writeFileSync(evidencePath, `${Array.from({ length: count }, () => JSON.stringify(record)).join('\n')}\n`, 'utf8');
}

test.describe('Incident detection mode', () => {
  test('status counts valid, unknown and malformed modes without inflating automation', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-detection-'));
    try {
      for (const mode of ['GATE', 'THREW', 'HUMAN', 'OPERATOR', 'LATER']) {
        writeBug(fixture, `valid-${mode.toLowerCase()}`, mode);
      }
      writeBug(fixture, 'missing-mode', '');
      writeBug(fixture, 'invalid-mode', 'MAYBE');
      fs.mkdirSync(path.join(fixture, 'duplicate-mode'), { recursive: true });
      fs.writeFileSync(path.join(fixture, 'duplicate-mode', 'bug.md'), [
        '# Bug: duplicate-mode', '', '## Meta',
        '- **Detection:** `HUMAN`', '- **Detection:** `GATE`', '',
      ].join('\n'), 'utf8');

      const result = run('.github/harness/scripts/auto-learn.mjs', ['status', '--dir', fixture, '--json']);
      expect(result.code, result.out).toBe(0);
      const report = JSON.parse(result.out);
      expect(report.detection).toEqual(expectedDetection());
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  test('bug template exposes the closed detection vocabulary', () => {
    const template = fs.readFileSync(path.join(ROOT, '.agent/bugs/_template/bug.md'), 'utf8');
    expect(template).toContain('**Detection:**');
    for (const mode of ['GATE', 'THREW', 'HUMAN', 'OPERATOR', 'LATER']) {
      expect(template).toContain(mode);
    }
  });

  test('log accepts one valid detection mode and rejects invalid CLI forms', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-log-detection-'));
    try {
      assertValidLog(fixture, 'GATE');
      assertRejectedDetectionArgs(fixture, ['--detection=']);
      assertRejectedDetectionArgs(fixture, ['--detection', 'gate']);
      assertRejectedDetectionArgs(fixture, ['--detection', 'GATE', '--detection=LATER']);
      assertRejectedDetectionArgs(fixture, ['--Detection=GATE']);
      assertRejectedDetectionArgs(fixture, ['--detectoin', 'GATE']);
      assertValidLog(fixture, 'GATE', ['--detection=GATE']);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
});

function assertValidLog(fixture: string, mode: string, args = ['--detection', mode]) {
  const result = run('.github/harness/scripts/auto-learn.mjs', [
    'log', '--dir', fixture, '--error', 'valid write', '--title', 'valid write', ...args, '--dry-run',
  ]);
  expect(result.code, result.out).toBe(0);
  expect(result.out).toContain(`**Detection:** \`${mode}\``);
}

function assertRejectedDetectionArgs(fixture: string, args: string[]) {
  const result = run('.github/harness/scripts/auto-learn.mjs', [
    'log', '--dir', fixture, '--error', 'boundary write', '--title', 'boundary write', ...args, '--dry-run',
  ]);
  expect(result.code, `${args.join(' ')} phải fail-closed`).toBe(1);
}

test.describe('CUA identity and egress policy', () => {
  test('observe action remains permitted without identity', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(result.permitted).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('interactive risky action without identity is refused', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({
        action: 'submit', url: 'https://shop.example.com/buy', approve: true,
        verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42',
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('identity is required for identity-bearing action');
    } finally {
      fixture.cleanup();
    }
  });

  test('unknown non-observe action also requires identity', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({
        action: 'future-risky-op', url: 'https://api.example.com/v1/action', approve: true,
        verifyUrl: 'https://api.example.com/v1/action', verifyDetail: 'id=42',
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('identity is required for identity-bearing action');
    } finally {
      fixture.cleanup();
    }
  });
});

test.describe('CUA operator policy boundary', () => {
  test('operator policy file exists and defaults to deny', () => {
    const policy = JSON.parse(fs.readFileSync(path.join(ROOT, '.github/harness/cua-identity-policy.json'), 'utf8'));
    expect(policy).toEqual({ version: 1, allow: [] });
  });

  test('unattended risky action is refused even with approve and exact tuple', async () => {
    const fixture = await loadCuaModule(['agent:researcher|submit|shop.example.com']);
    try {
      const result = fixture.checkAction({
        action: 'submit', url: 'https://shop.example.com/buy', identity: 'agent:researcher', unattended: true,
        approve: true, verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42',
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('human takeover required for unattended submit');
    } finally {
      fixture.cleanup();
    }
  });

  test('identity-operation-domain mismatch is refused', async () => {
    const fixture = await loadCuaModule(['agent:researcher|submit|shop.example.com']);
    try {
      const result = fixture.checkAction({
        action: 'submit', url: 'https://shop.example.com/buy', identity: 'agent:other', approve: true,
        verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42',
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('identity-operation-domain not allowlisted: agent:other|submit|shop.example.com');
    } finally {
      fixture.cleanup();
    }
  });

  test('caller cannot self-authorize an identity tuple', () => {
    const result = runCua([
      'check', '--action', 'submit', '--url', 'https://shop.example.com/buy', '--identity', 'agent:researcher',
      '--approve', '--verify-url', 'https://shop.example.com/buy', '--verify-detail', 'sku=42',
      '--allow-identity-op', 'agent:researcher|submit|shop.example.com', '--json',
    ]);
    expect(result.code).toBe(1);
    expect(result.out).toContain('operator policy tuple cannot be supplied by caller');
  });
});

test.describe('CUA evidence ledger', () => {
  test('evidence redacts URL and element, and never persists fsPath', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({
        action: 'read',
        url: 'https://docs.example.com/guide?token=url-secret#api_key=hash-secret',
        element: 'password=element-secret',
        fsPath: 'www/index.html',
      });
      expect(result.permitted).toBe(true);
      const evidence = fs.readFileSync(fixture.evidencePath, 'utf8');
      expect(evidence).not.toContain('url-secret');
      expect(evidence).not.toContain('element-secret');
      expect(evidence).not.toContain('hash-secret');
      expect(evidence).not.toContain('fsPath');
      const record = JSON.parse(evidence.trim());
      expect(Object.keys(record).sort()).toEqual(['action', 'approvedByCaller', 'decision', 'egress', 'operation', 'origin', 'policyVersion', 'reasonCode', 'ts']);
      expect(record.approvedByCaller).toBe(false);
    } finally {
      fixture.cleanup();
    }
  });

  test('identity is hashed in evidence, never stored raw', async () => {
    const fixture = await loadCuaModule();
    try {
      fixture.checkAction({ action: 'submit', url: 'https://shop.example.com/buy', identity: 'agent:secret-person', approve: true, verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42' });
      const record = JSON.parse(fs.readFileSync(fixture.evidencePath, 'utf8').trim().split('\n').pop() as string);
      expect(record.identityHash).toMatch(/^[0-9a-f]{16}$/);
      expect(JSON.stringify(record)).not.toContain('secret-person');
    } finally {
      fixture.cleanup();
    }
  });

  test('caller-asserted approval is recorded as untrusted and warned', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://exfil.example.net/page', approve: true });
      expect(result.permitted).toBe(true);
      expect((result.warnings as string[]).some(w => w.includes('approved by caller flag (untrusted)'))).toBe(true);
      const record = JSON.parse(fs.readFileSync(fixture.evidencePath, 'utf8').trim().split('\n').pop() as string);
      expect(record.approvedByCaller).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('action names must be short operation names — raw strings never reach the ledger', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read?token=action-secret', url: 'https://docs.example.com/guide' });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('action must be a short operation name (a-z, 0-9, -, _)');
      const evidence = fs.readFileSync(fixture.evidencePath, 'utf8');
      expect(evidence).not.toContain('action-secret');
      expect(JSON.parse(evidence.trim()).action).toBe('invalid');
    } finally {
      fixture.cleanup();
    }
  });
});

test.describe('CUA budget enforcement', () => {
  test('unreadable or removed evidence cannot reset the budget', async () => {
    const fixture = await loadCuaModule();
    try {
      fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      fs.writeFileSync(fixture.evidencePath, '{not json}\n', 'utf8');
      const corrupt = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(corrupt.permitted).toBe(false);
      expect(corrupt.reasons).toContain('evidence unreadable or malformed');

      fs.rmSync(fixture.evidencePath, { force: true });
      const removed = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(removed.permitted).toBe(false);
      expect(removed.reasons).toContain('evidence unreadable or malformed');
    } finally {
      fixture.cleanup();
    }
  });

  test('truncated (emptied) evidence cannot reset the budget', async () => {
    const fixture = await loadCuaModule();
    try {
      fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      fs.writeFileSync(fixture.evidencePath, '', 'utf8');
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('evidence unreadable or malformed');
    } finally {
      fixture.cleanup();
    }
  });

  test('refused attempts do not consume budget (no self lock-out)', async () => {
    const fixture = await loadCuaModule();
    try {
      writeLedger(fixture.evidencePath, 'refused', 20);
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(result.permitted).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('permitted actions consume budget and stop further actions', async () => {
    const fixture = await loadCuaModule();
    try {
      writeLedger(fixture.evidencePath, 'permitted', 20);
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide' });
      expect(result.permitted).toBe(false);
      expect(result.reasons.some(reason => reason.includes('budget exceeded') && reason.includes('20 permitted actions'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

});

test.describe('CUA filesystem and policy containment', () => {
  test('fsPath outside workspace root is refused (containment, not blacklist)', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide', fsPath: 'C:\\private\\notes.txt' });
      expect(result.permitted).toBe(false);
      expect(result.reasons.some(reason => reason.includes('workspace-only') && reason.includes('outside workspace root'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('relative escape is refused on every platform', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide', fsPath: path.join('..', 'outside.txt') });
      expect(result.permitted).toBe(false);
      expect(result.reasons.some(reason => reason.includes('outside workspace root'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('denied filesystem segments are actually denied', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide', fsPath: '.ssh/id_rsa' });
      expect(result.permitted).toBe(false);
      expect(result.reasons.some(reason => reason.includes('denied segment'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('fs alias outside workspace root is also refused', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({ action: 'read', url: 'https://docs.example.com/guide', fs: 'C:\\private\\notes.txt' });
      expect(result.permitted).toBe(false);
      expect(result.reasons.some(reason => reason.includes('outside workspace root'))).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test('policy defaults are immutable after import', async () => {
    const fixture = await loadCuaModule();
    try {
      const policy = (fixture.module as { POLICY_DEFAULTS?: { egress?: { allowlist?: string[] } } }).POLICY_DEFAULTS;
      expect(policy?.egress?.allowlist).toBeDefined();
      expect(() => policy?.egress?.allowlist?.push('evil.test')).toThrow();
    } finally {
      fixture.cleanup();
    }
  });
});

test.describe('CUA direct API boundaries', () => {
  test('direct checkAction API also ignores caller-supplied policy tuples', async () => {
    const fixture = await loadCuaModule();
    try {
      const result = fixture.checkAction({
        action: 'submit', url: 'https://shop.example.com/buy', identity: 'agent:researcher', approve: true,
        verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42',
        allowIdentityOp: ['agent:researcher|submit|shop.example.com'],
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('operator policy tuple cannot be supplied by caller');
    } finally {
      fixture.cleanup();
    }
  });

  test('operator policy + caller flags still fail without trusted human context', async () => {
    const fixture = await loadCuaModule(['agent:researcher|submit|shop.example.com']);
    try {
      const result = fixture.checkAction({
        action: 'submit', url: 'https://shop.example.com/buy', identity: 'agent:researcher', approve: true,
        verifyUrl: 'https://shop.example.com/buy', verifyDetail: 'sku=42',
      });
      expect(result.permitted).toBe(false);
      expect(result.reasons).toContain('trusted human approval context is required; caller flags cannot grant it');
    } finally {
      fixture.cleanup();
    }
  });

});

test.describe('CUA egress and CLI boundaries', () => {
  test('egress allowlist rejects deceptive substring domains', () => {
    const result = runCua(['check', '--action', 'read', '--url', 'https://evilgithub.com/page', '--json']);
    expect(result.code).toBe(1);
    expect(result.out).toContain('egress default-deny');
  });

  test('non-http schemes are refused even for allowlisted hostnames', () => {
    const result = runCua(['check', '--action', 'read', '--url', 'file://localhost/etc/passwd', '--json']);
    expect(result.code).toBe(1);
    expect(result.out).toContain('valid http/https');
  });

  test('empty checkAction input fails closed', () => {
    const result = runCua(['check', '--json']);
    expect(result.code).toBe(1);
    expect(result.out).toContain('action is required');
  });

  test('CUA CLI rejects missing, duplicate, unknown and out-of-range scalar options', () => {
    for (const [args, marker] of CUA_OPTION_CASES) {
      const result = runCua(args);
      expect(result.code, `${args.join(' ')} phải fail-closed`).toBe(1);
      expect(result.out).toContain(marker);
    }
  });
});
