#!/usr/bin/env node
/**
 * Credentials store — AES-256-GCM, never logged, redacted in audit/status
 * Usage:
 *   node .agent/scripts/credentials.mjs set <KEY> --value "sk-..." [--actor YUNIE]
 *   node .agent/scripts/credentials.mjs get <KEY>
 *   node .agent/scripts/credentials.mjs list
 *   node .agent/scripts/credentials.mjs delete <KEY>
 * Key: HARNESS_CRED_KEY env (base64 32 bytes) or ~/.harness/key (auto-gen) or .agent/credentials.key (fallback)
 * No deps, Node 18+
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const ENC_PATH = path.join(ROOT, '.agent', 'credentials.enc.json');
const LOCAL_KEY_PATH = path.join(ROOT, '.agent', 'credentials.key');
const HOME_KEY_PATH = path.join(os.homedir(), '.harness', 'key');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--') && !next.startsWith('-')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

async function getKey() {
  // 1. env
  if (process.env.HARNESS_CRED_KEY) {
    const b64 = process.env.HARNESS_CRED_KEY.trim();
    try {
      const buf = Buffer.from(b64, 'base64');
      if (buf.length === 32) return buf;
      // if not base64, try hex or raw
      if (buf.length !== 32) {
        // try raw string padded/hashed
        return crypto.createHash('sha256').update(b64).digest();
      }
    } catch {}
    return crypto.createHash('sha256').update(b64).digest();
  }
  // 2. home key
  if (existsSync(HOME_KEY_PATH)) {
    try {
      const b64 = (await fs.readFile(HOME_KEY_PATH, 'utf8')).trim();
      const buf = Buffer.from(b64, 'base64');
      if (buf.length === 32) return buf;
    } catch {}
  }
  // 3. local key
  if (existsSync(LOCAL_KEY_PATH)) {
    try {
      const b64 = (await fs.readFile(LOCAL_KEY_PATH, 'utf8')).trim();
      const buf = Buffer.from(b64, 'base64');
      if (buf.length === 32) return buf;
    } catch {}
  }
  // 4. auto-gen local key
  const key = crypto.randomBytes(32);
  const b64 = key.toString('base64');
  await fs.mkdir(path.dirname(LOCAL_KEY_PATH), { recursive: true });
  await fs.writeFile(LOCAL_KEY_PATH, b64 + '\n', 'utf8');
  // try also home
  try {
    await fs.mkdir(path.dirname(HOME_KEY_PATH), { recursive: true });
    if (!existsSync(HOME_KEY_PATH)) await fs.writeFile(HOME_KEY_PATH, b64 + '\n', 'utf8');
  } catch {}
  console.log(`🔑 Generated new credential key at ${path.relative(ROOT, LOCAL_KEY_PATH)} (also ${HOME_KEY_PATH} if writable)`);
  console.log(`   Set HARNESS_CRED_KEY env to share across machines`);
  return key;
}

async function loadStore(key) {
  if (!existsSync(ENC_PATH)) return {};
  try {
    const raw = JSON.parse(await fs.readFile(ENC_PATH, 'utf8'));
    if (!raw.iv || !raw.tag || !raw.data) return {};
    const iv = Buffer.from(raw.iv, 'base64');
    const tag = Buffer.from(raw.tag, 'base64');
    const data = Buffer.from(raw.data, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(plain.toString('utf8'));
  } catch (e) {
    console.error(`❌ Failed to decrypt credentials: ${e.message}`);
    console.error(`   Try setting correct HARNESS_CRED_KEY or delete ${path.relative(ROOT, ENC_PATH)} to reset`);
    process.exit(1);
  }
}

async function saveStore(key, store) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plain = Buffer.from(JSON.stringify(store), 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64'),
  };
  await fs.mkdir(path.dirname(ENC_PATH), { recursive: true });
  await fs.writeFile(ENC_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const key = await getKey();

  if (cmd === 'set') {
    const name = args._[1];
    const value = args.value || args.v;
    if (!name || !value) {
      console.error('Usage: credentials.mjs set <KEY> --value "secret"');
      process.exit(1);
    }
    if (!/^[A-Z0-9_]{1,64}$/.test(name)) {
      console.error('KEY must be UPPER_SNAKE_CASE (A-Z0-9_)');
      process.exit(1);
    }
    const store = await loadStore(key);
    store[name] = value;
    await saveStore(key, store);
    console.log(`✅ Set ${name} (encrypted, ${Object.keys(store).length} keys total)`);
    console.log(`   Never logged — audit will redact`);
  } else if (cmd === 'get') {
    const name = args._[1];
    if (!name) {
      console.error('Usage: credentials.mjs get <KEY>');
      process.exit(1);
    }
    const store = await loadStore(key);
    if (!(name in store)) {
      console.error(`❌ Key not found: ${name}`);
      process.exit(1);
    }
    // only print if explicitly requested — warn
    console.log(store[name]);
  } else if (cmd === 'list') {
    const store = await loadStore(key);
    const keys = Object.keys(store);
    if (!keys.length) {
      console.log('No credentials stored yet — use: credentials.mjs set <KEY> --value "..."');
      return;
    }
    console.log(`Credentials: ${keys.length} keys (values hidden)`);
    for (const k of keys) {
      console.log(`  • ${k} — *** (${store[k].length} chars)`);
    }
    console.log(`\nEnc file: ${path.relative(ROOT, ENC_PATH)} (AES-256-GCM)`);
  } else if (cmd === 'delete' || cmd === 'rm') {
    const name = args._[1];
    if (!name) {
      console.error('Usage: credentials.mjs delete <KEY>');
      process.exit(1);
    }
    const store = await loadStore(key);
    if (!(name in store)) {
      console.error(`❌ Key not found: ${name}`);
      process.exit(1);
    }
    delete store[name];
    await saveStore(key, store);
    console.log(`✅ Deleted ${name} (${Object.keys(store).length} keys remaining)`);
  } else {
    console.error(`Unknown command: ${cmd}\nUsage: credentials.mjs <set|get|list|delete> [args]`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
