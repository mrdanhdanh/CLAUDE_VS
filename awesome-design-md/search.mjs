#!/usr/bin/env node
/**
 * Awesome DESIGN.md — Local Search (BM25-lite, offline, <50ms)
 * Tìm DESIGN.md phù hợp khi user mô tả giao diện
 *
 * Usage:
 *   node awesome-design-md/search.mjs "dark minimal linear" --top_k 5
 *   node awesome-design-md/search.mjs "stripe fintech gradient" --json
 *   node awesome-design-md/search.mjs --list
 *   node awesome-design-md/search.mjs --status
 *   node awesome-design-md/search.mjs "vercel" --top_k 3 --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Args ----------
const args = process.argv.slice(2);
function getArg(name, def=null){
  const idx = args.findIndex(a=> a===`--${name}` || a===`--${name.replace(/_/g,'-')}`);
  if(idx!==-1 && args[idx+1] && !args[idx+1].startsWith('--')) return args[idx+1];
  const eq = args.find(a=> a.startsWith(`--${name}=`) || a.startsWith(`--${name.replace(/_/g,'-')}=`));
  if(eq) return eq.split('=')[1];
  return def;
}
function hasFlag(name){
  return args.includes(`--${name}`) || args.includes(`--${name.replace(/_/g,'-')}`);
}
const queryArg = getArg('query') || getArg('q') || (args[0] && !args[0].startsWith('--') ? args[0] : null);
const topK = Math.min(20, Math.max(1, parseInt(getArg('top_k') || getArg('top-k') || getArg('k') || '5', 10) || 5));
const jsonMode = hasFlag('json');
const listMode = hasFlag('list');
const statusMode = hasFlag('status');
const helpMode = hasFlag('help') || hasFlag('h');

// ---------- Help ----------
if(helpMode || (!queryArg && !listMode && !statusMode)){
  console.log(`
Awesome DESIGN.md — Local Search (BM25-lite, offline)

Tìm DESIGN.md phù hợp khi user mô tả giao diện — 74 designs từ VoltAgent/awesome-design-md

Cách dùng:
  node awesome-design-md/search.mjs "dark minimal linear" --top_k 5
  node awesome-design-md/search.mjs "stripe fintech gradient" --json
  node awesome-design-md/search.mjs "vercel black white" --top_k 3
  node awesome-design-md/search.mjs --list
  node awesome-design-md/search.mjs --status

Tùy chọn:
  --query, -q     Câu truy vấn (hoặc đối số đầu tiên)
  --top_k         Số kết quả (1-20, mặc định 5)
  --json          Xuất JSON (cho AI/harness parse)
  --list          Liệt kê tất cả 74 designs
  --status        Thống kê
  --help          Hiện trợ giúp

Ví dụ cho AI:
  node awesome-design-md/search.mjs "linear dark lavender minimal" --top_k 3 --json
  node awesome-design-md/search.mjs "apple clean white premium" --top_k 3 --json
  node awesome-design-md/search.mjs "stripe fintech purple gradient" --top_k 3 --json

Gợi ý vibe keywords:
  dark, light, minimal, colorful, gradient, glassmorphism, brutalist,
  editorial, dashboard, fintech, saas, ecommerce, luxury, retro, neon
`);
  process.exit(0);
}

// ---------- Load index ----------
function loadIndex(){
  const indexPath = path.join(__dirname, 'index.json');
  if(!fs.existsSync(indexPath)){
    console.error('❌ Chưa có index.json — chạy: node -e "generate index" hoặc git pull');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(indexPath,'utf8'));
}

// ---------- Category map (from README) ----------
const CATEGORY_MAP = {
  'claude':'AI & LLM', 'cohere':'AI & LLM', 'elevenlabs':'AI & LLM', 'minimax':'AI & LLM', 'mistral.ai':'AI & LLM', 'ollama':'AI & LLM', 'opencode.ai':'AI & LLM', 'replicate':'AI & LLM', 'runwayml':'AI & LLM', 'together.ai':'AI & LLM', 'voltagent':'AI & LLM', 'x.ai':'AI & LLM',
  'cursor':'Dev Tools', 'expo':'Dev Tools', 'lovable':'Dev Tools', 'raycast':'Dev Tools', 'superhuman':'Dev Tools', 'vercel':'Dev Tools', 'warp':'Dev Tools',
  'clickhouse':'Backend', 'composio':'Backend', 'hashicorp':'Backend', 'mongodb':'Backend', 'posthog':'Backend', 'sanity':'Backend', 'sentry':'Backend', 'supabase':'Backend',
  'cal':'Productivity', 'intercom':'Productivity', 'linear.app':'Productivity', 'mintlify':'Productivity', 'notion':'Productivity', 'resend':'Productivity', 'zapier':'Productivity', 'slack':'Productivity',
  'airtable':'Design Tools', 'clay':'Design Tools', 'figma':'Design Tools', 'framer':'Design Tools', 'miro':'Design Tools', 'webflow':'Design Tools',
  'binance':'Fintech', 'coinbase':'Fintech', 'kraken':'Fintech', 'mastercard':'Fintech', 'revolut':'Fintech', 'stripe':'Fintech', 'wise':'Fintech',
  'airbnb':'E-commerce', 'meta':'E-commerce', 'nike':'E-commerce', 'shopify':'E-commerce', 'starbucks':'E-commerce',
  'apple':'Media', 'hp':'Media', 'ibm':'Media', 'nvidia':'Media', 'pinterest':'Media', 'playstation':'Media', 'spacex':'Media', 'spotify':'Media', 'theverge':'Media', 'uber':'Media', 'vodafone':'Media', 'wired':'Media',
  'bmw':'Automotive', 'bmw-m':'Automotive', 'bugatti':'Automotive', 'ferrari':'Automotive', 'lamborghini':'Automotive', 'renault':'Automotive', 'tesla':'Automotive',
  'dell-1996':'Retro', 'nintendo-2001':'Retro',
};

// ---------- BM25-lite scoring ----------
function tokenize(s){
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
function scoreDesign(design, queryTokens){
  const slug = design.slug.toLowerCase();
  const name = design.name.toLowerCase();
  const desc = (design.description||'').toLowerCase();
  const cat = (CATEGORY_MAP[design.slug]||'').toLowerCase();
  const colors = Object.values(design.colors||{}).join(' ').toLowerCase();
  // combined text with weights
  let score = 0;
  for(const tok of queryTokens){
    if(slug.includes(tok)) score += 5; // exact slug match = highest
    if(name.toLowerCase().includes(tok)) score += 3;
    if(cat.includes(tok)) score += 2;
    // count occurrences in description
    const descCount = (desc.match(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'))||[]).length;
    score += descCount * 1.5;
    if(colors.includes(tok)) score += 1;
    // vibe keywords boost
    if(desc.includes(tok)) score += 0.5;
  }
  // bonus for exact slug
  if(queryTokens.length===1 && slug===queryTokens[0]) score += 10;
  return score;
}

// ---------- Commands ----------
const data = loadIndex();

if(statusMode){
  const cats = {};
  for(const d of data.designs){
    const c = CATEGORY_MAP[d.slug]||'Other';
    cats[c]=(cats[c]||0)+1;
  }
  const out = { count: data.count, generatedAt: data.generatedAt, categories: cats, total: data.count };
  if(jsonMode) console.log(JSON.stringify(out,null,2));
  else {
    console.log(`\n📦 Awesome DESIGN.md — ${data.count} designs`);
    console.log(`Generated: ${data.generatedAt}`);
    console.log(`\nCategories:`);
    for(const [k,v] of Object.entries(cats).sort((a,b)=>b[1]-a[1])) console.log(`  ${k}: ${v}`);
    console.log(`\nDùng: node awesome-design-md/search.mjs "linear dark" --top_k 5`);
  }
  process.exit(0);
}

if(listMode){
  if(jsonMode) console.log(JSON.stringify(data,null,2));
  else {
    console.log(`\n📦 ${data.count} DESIGN.md:`);
    for(const d of data.designs){
      const cat = CATEGORY_MAP[d.slug]||'Other';
      console.log(`  ${d.slug.padEnd(16)} [${cat.padEnd(12)}] ${d.description.slice(0,70)}...`);
    }
  }
  process.exit(0);
}

// Search
const qTokens = tokenize(queryArg);
const scored = data.designs.map(d=> ({
  ...d,
  category: CATEGORY_MAP[d.slug]||'Other',
  score: scoreDesign(d, qTokens)
})).filter(d=> d.score>0).sort((a,b)=> b.score - a.score).slice(0, topK);

if(jsonMode){
  console.log(JSON.stringify({ query: queryArg, tokens: qTokens, top_k: topK, results: scored }, null, 2));
} else {
  console.log(`\n🔍 Query: "${queryArg}" → top ${scored.length}/${data.count}\n`);
  if(scored.length===0){
    console.log('  Không tìm thấy — thử keywords khác: dark, light, minimal, gradient, fintech, saas, luxury, retro');
    console.log(`  Hoặc --list để xem hết 74 designs`);
  } else {
    scored.forEach((d,i)=>{
      console.log(`${i+1}. ${d.slug} [${d.category}] (score ${d.score.toFixed(1)})`);
      console.log(`   ${d.name}`);
      console.log(`   ${d.description.slice(0,120)}...`);
      console.log(`   primary: ${d.colors.primary||'?'}  → ${d.path}`);
      console.log('');
    });
    console.log(`💡 Copy: cp ${scored[0].path} ./DESIGN.md  → bảo AI "build me a page that looks like this"`);
  }
}
