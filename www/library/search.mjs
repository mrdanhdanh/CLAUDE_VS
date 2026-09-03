#!/usr/bin/env node
/**
 * Library RAG Local — CLI Search for Harness
 * Dùng cho /harness, AI, terminal — đọc export.json (do UI nút Xuất tạo ra)
 *
 * Usage:
 *   node www/library/search.mjs "điều khoản thanh toán" --top_k 5
 *   node www/library/search.mjs --query "machine learning" --top_k 3 --json
 *   node www/library/search.mjs --list
 *   node www/library/search.mjs --status
 *   node www/library/search.mjs --help
 *   node www/library/search.mjs "query" --file ./www/library/export.json
 *   node www/library/search.mjs "query" --all  # tìm cả sách đã tháo
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
  // also support --name=value
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
const fileArg = getArg('file') || getArg('export') || process.env.LIBRARY_EXPORT || null;
const listMode = hasFlag('list');
const statusMode = hasFlag('status');
const helpMode = hasFlag('help') || hasFlag('h');
const allMode = hasFlag('all');
const enabledOnly = !allMode && !hasFlag('all');

// ---------- Help ----------
if(helpMode || (!queryArg && !listMode && !statusMode)){
  console.log(`
Library RAG Local — CLI Search (BM25, offline, <100ms)

Dùng cho /harness, AI, terminal — đọc www/library/export.json

Cách dùng:
  node www/library/search.mjs "điều khoản thanh toán" --top_k 5
  node www/library/search.mjs --query "machine learning" --top_k 3 --json
  node www/library/search.mjs --list
  node www/library/search.mjs --status
  node www/library/search.mjs "query" --file ./www/library/export.json
  node www/library/search.mjs "query" --all          # tìm cả sách đã tháo

Tùy chọn:
  --query, -q     Câu truy vấn (hoặc đối số đầu tiên)
  --top_k, --top-k, --k  Số kết quả (1-20, mặc định 5)
  --json          Xuất JSON (cho harness parse)
  --file <path>   Đường dẫn export.json (mặc định tự tìm)
  --list          Liệt kê tất cả sách
  --status        Thống kê thư viện
  --all           Tìm cả sách đã tháo (mặc định chỉ đang gắn)
  --help, -h      Hiện trợ giúp

Lưu ý:
  - Cần bấm "Xuất" trong www/library/index.html để tạo export.json trước
  - File mặc định: www/library/export.json (tự tìm theo cwd và script dir)
  - Harness nên gọi ở phase Explore để lấy context từ sách

Ví dụ cho harness:
  node www/library/search.mjs "rủi ro pháp lý chương 5" --top_k 5 --json
`);
  process.exit(0);
}

// ---------- Find export file ----------
function findExportFile(){
  if(fileArg) return path.resolve(fileArg);
  const candidates = [
    path.join(process.cwd(), 'www', 'library', 'export.json'),
    path.join(__dirname, 'export.json'),
    path.join(process.cwd(), 'export.json'),
    path.join(__dirname, '..', 'library', 'export.json'),
    // seed fallback — RAG không bao giờ rỗng (chatbot quality grounding)
    path.join(process.cwd(), 'www', 'library', 'seed.json'),
    path.join(__dirname, 'seed.json'),
  ];
  for(const p of candidates){
    if(fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function loadData(){
  const file = findExportFile();
  if(!fs.existsSync(file)){
    // seed fallback — nếu không có export nào, dùng seed.json cùng folder
    const seedFallback = [path.join(__dirname, 'seed.json'), path.join(process.cwd(), 'www', 'library', 'seed.json')].find(p => fs.existsSync(p));
    if(seedFallback){
      try{
        const raw = fs.readFileSync(seedFallback, 'utf8');
        const j = JSON.parse(raw);
        return { registry: j.registry || {}, chunks: j.chunks || [], _file: seedFallback, _seed: true };
      }catch(e){
        return { registry:{}, chunks:[], _file: seedFallback, _error: e.message };
      }
    }
    return { registry:{}, chunks:[], _file:file, _missing:true };
  }
  try{
    const raw = fs.readFileSync(file, 'utf8');
    const j = JSON.parse(raw);
    const registry = j.registry || {};
    const chunks = j.chunks || [];
    const isSeed = path.basename(file) === 'seed.json';
    return { registry, chunks, _file:file, _missing:false, ...(isSeed ? {_seed:true} : {}) };
  }catch(e){
    return { registry:{}, chunks:[], _file:file, _error:e.message };
  }
}

// ---------- BM25 ----------
const STOPWORDS = new Set([
  'va','la','cua','các','cac','nhung','nhưng','voi','với','cho','trong','tren','trên','duoi','dưới','tu','từ','den','đến','de','để','da','đã','dang','đang','se','sẽ','thi','thì','ma','mà','neu','nếu','khi','tai','tại','ve','về','co','có','khong','không','mot','một','hai','ba','bon','năm','sau','truoc','trước','nay',
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','where','when','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','now'
]);
function tokenize(text){
  return String(text).toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g)
    .filter(t=> t.length>=2 && !STOPWORDS.has(t));
}
const K1=1.2, B=0.75;
function buildIndex(chunks, registry, enabledOnly=true){
  const enabledIds = enabledOnly ? new Set(Object.values(registry).filter(b=>b.enabled).map(b=>b.id)) : null;
  const docs = chunks.filter(c=> !enabledOnly || enabledIds.has(c.bookId)).map(c=>{
    const tokens = tokenize(c.text);
    const tf={};
    tokens.forEach(t=> tf[t]=(tf[t]||0)+1);
    return { ...c, tokens, tf, len: tokens.length };
  });
  const N=docs.length;
  if(N===0) return { docs:[], docFreq:{}, avgdl:0, N:0 };
  const docFreq={};
  docs.forEach(d=>{
    const seen=new Set(Object.keys(d.tf));
    seen.forEach(t=> docFreq[t]=(docFreq[t]||0)+1);
  });
  const avgdl=docs.reduce((a,d)=>a+d.len,0)/N;
  return { docs, docFreq, avgdl, N };
}
function searchBM25(query, chunks, registry, top_k=5, enabledOnly=true){
  const idx=buildIndex(chunks, registry, enabledOnly);
  if(idx.N===0) return [];
  const qTokens=tokenize(query);
  if(qTokens.length===0) return [];
  const { docs, docFreq, avgdl, N }=idx;
  const scored=docs.map(d=>{
    let score=0;
    qTokens.forEach(t=>{
      const tf=d.tf[t]||0;
      if(!tf) return;
      const df=docFreq[t]||0;
      const idf=Math.log(1 + (N - df + 0.5)/(df + 0.5));
      const denom=tf + K1 * (1 - B + B * (d.len/(avgdl||1)));
      score+= idf * (tf*(K1+1))/denom;
    });
    return { doc:d, score };
  }).filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0, top_k)
    .map(({doc, score})=> ({
      bookId: doc.bookId,
      bookName: doc.bookName,
      chunkId: doc.id,
      index: doc.index,
      page: doc.page,
      text: doc.text.slice(0,600),
      snippet: doc.text.slice(0,300) + (doc.text.length>300?'…':''),
      score: Number(score.toFixed(3))
    }));
  return scored;
}

// ---------- Main ----------
const data = loadData();

if(data._missing){
  const msg = `Chưa có export.json tại ${data._file}\n→ Hãy mở www/library/index.html → bấm "Xuất" để tạo file.\n→ Hoặc chỉ định file: node www/library/search.mjs "query" --file <path>`;
  if(jsonMode) console.log(JSON.stringify({ error: msg, file: data._file }, null, 2));
  else console.error(msg);
  process.exit(1);
}
if(data._error){
  const msg = `Lỗi đọc export.json: ${data._error} (${data._file})`;
  if(jsonMode) console.log(JSON.stringify({ error: msg }, null, 2));
  else console.error(msg);
  process.exit(1);
}

if(listMode){
  const books=Object.values(data.registry);
  if(jsonMode){
    console.log(JSON.stringify({ total: books.length, books, file: data._file }, null, 2));
  } else {
    if(books.length===0) console.log('Thư viện rỗng — chưa có sách nào.');
    else {
      console.log(`Thư viện: ${books.length} sách (file: ${data._file})\n`);
      books.forEach(b=>{
        console.log(`- ${b.name} [${b.type}] ${b.enabled?'● Đang gắn':'○ Đã tháo'} ${b.read?'✓ Đã đọc':'○ Chưa đọc'} — ${b.chunks} chunks · ${b.progress||0}% · ${b.pages||'?'} trang`);
        console.log(`  id: ${b.id}`);
      });
    }
  }
  process.exit(0);
}

if(statusMode){
  const books=Object.values(data.registry);
  const status={
    total: books.length,
    enabled: books.filter(b=>b.enabled).length,
    read: books.filter(b=>b.read).length,
    chunks: books.reduce((a,b)=>a+(b.chunks||0),0),
    enabledChunks: books.filter(b=>b.enabled).reduce((a,b)=>a+(b.chunks||0),0),
    file: data._file
  };
  if(jsonMode) console.log(JSON.stringify(status, null, 2));
  else {
    console.log(`Thư viện: ${status.total} sách · ${status.enabled} đang gắn · ${status.read} đã đọc`);
    console.log(`Chunks: ${status.chunks} tổng · ${status.enabledChunks} đang gắn (tìm được)`);
    console.log(`File: ${status.file}`);
  }
  process.exit(0);
}

// Search mode
if(!queryArg || !queryArg.trim()){
  console.error('Thiếu query. Ví dụ: node www/library/search.mjs "điều khoản thanh toán" --top_k 5');
  process.exit(1);
}
const t0=Date.now();
const hits=searchBM25(queryArg, data.chunks, data.registry, topK, enabledOnly);
const dt=Date.now()-t0;

if(jsonMode){
  console.log(JSON.stringify({
    query: queryArg,
    top_k: topK,
    enabled_only: enabledOnly,
    hits,
    total_chunks: data.chunks.length,
    enabled_books: Object.values(data.registry).filter(b=>b.enabled).length,
    time_ms: dt,
    file: data._file
  }, null, 2));
} else {
  console.log(`Tìm "${queryArg}" — ${hits.length} kết quả (${dt}ms, ${enabledOnly?'chỉ đang gắn':'cả đã tháo'}, top_k=${topK})\n`);
  if(hits.length===0){
    console.log('Không tìm thấy. Thử từ khóa khác hoặc kiểm tra sách đang gắn (--all để tìm cả đã tháo).');
  } else {
    hits.forEach((h,i)=>{
      console.log(`${i+1}. ${h.bookName} — chunk #${h.index} · trang ${h.page} · score ${h.score}`);
      console.log(`   ${h.snippet.replace(/\n/g,' ')}`);
      console.log(`   id: ${h.chunkId}\n`);
    });
  }
  console.log(`File: ${data._file} · Tổng chunks: ${data.chunks.length}`);
}
