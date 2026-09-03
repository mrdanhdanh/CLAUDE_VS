#!/usr/bin/env node
/**
 * Library RAG Local — MCP Server (stdio)
 * Tools: search_library, list_books, get_book, get_status
 * Reads: www/library/export.json (do UI nút Xuất tạo ra) hoặc path truyền vào
 * Usage:
 *   node www/library/mcp-server.mjs
 *   node www/library/mcp-server.mjs --file ./www/library/export.json
 * MCP config (.vscode/mcp.json):
 *   { "servers": { "library": { "command": "node", "args": ["./www/library/mcp-server.mjs"] } } }
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Load data ----------
function findExportFile() {
  const argIdx = process.argv.indexOf('--file');
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return path.resolve(process.argv[argIdx + 1]);
  }
  if (process.env.LIBRARY_EXPORT) return path.resolve(process.env.LIBRARY_EXPORT);
  // default: www/library/export.json relative to this file
  // + seed.json fallback — RAG không bao giờ rỗng (chatbot quality grounding)
  const candidates = [
    path.join(__dirname, 'export.json'),
    path.join(__dirname, '..', 'library', 'export.json'),
    path.join(process.cwd(), 'www', 'library', 'export.json'),
    path.join(process.cwd(), 'export.json'),
    path.join(__dirname, 'seed.json'),
    path.join(process.cwd(), 'www', 'library', 'seed.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function loadData() {
  const file = findExportFile();
  if (!fs.existsSync(file)) {
    return { registry: {}, chunks: [], _file: file, _missing: true };
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const j = JSON.parse(raw);
    // support both {registry, chunks} and {registry: {id: {...}}} shapes
    const registry = j.registry || {};
    const chunks = j.chunks || [];
    const isSeed = path.basename(file) === 'seed.json';
    return { registry, chunks, _file: file, _missing: false, ...(isSeed ? { _seed: true } : {}) };
  } catch (e) {
    return { registry: {}, chunks: [], _file: file, _error: e.message };
  }
}

// ---------- BM25 (same as app.js) ----------
const STOPWORDS = new Set([
  'va','la','cua','các','cac','nhung','nhưng','voi','với','cho','trong','tren','trên','duoi','dưới','tu','từ','den','đến','de','để','da','đã','dang','đang','se','sẽ','thi','thì','ma','mà','neu','nếu','khi','tai','tại','ve','về','co','có','khong','không','mot','một','hai','ba','bon','năm','sau','truoc','trước','nay',
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','where','when','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','now'
]);
function tokenize(text){
  return String(text).toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g)
    .filter(t=> t.length>=2 && !STOPWORDS.has(t));
}
const K1 = 1.2, B = 0.75;
function buildIndex(chunks, registry, enabledOnly=true){
  const enabledIds = enabledOnly ? new Set(Object.values(registry).filter(b=>b.enabled).map(b=>b.id)) : null;
  const docs = chunks.filter(c=> !enabledOnly || enabledIds.has(c.bookId)).map(c=>{
    const tokens = tokenize(c.text);
    const tf = {};
    tokens.forEach(t=> tf[t]=(tf[t]||0)+1);
    return { ...c, tokens, tf, len: tokens.length };
  });
  const N = docs.length;
  if(N===0) return { docs:[], docFreq:{}, avgdl:0, N:0 };
  const docFreq = {};
  docs.forEach(d=>{
    const seen = new Set(Object.keys(d.tf));
    seen.forEach(t=> docFreq[t]=(docFreq[t]||0)+1);
  });
  const avgdl = docs.reduce((a,d)=>a+d.len,0)/N;
  return { docs, docFreq, avgdl, N };
}
function searchBM25(query, chunks, registry, top_k=5, enabledOnly=true){
  const idx = buildIndex(chunks, registry, enabledOnly);
  if(idx.N===0) return [];
  const qTokens = tokenize(query);
  if(qTokens.length===0) return [];
  const { docs, docFreq, avgdl, N } = idx;
  const scored = docs.map(d=>{
    let score=0;
    qTokens.forEach(t=>{
      const tf = d.tf[t]||0;
      if(!tf) return;
      const df = docFreq[t]||0;
      const idf = Math.log(1 + (N - df + 0.5)/(df + 0.5));
      const denom = tf + K1 * (1 - B + B * (d.len/(avgdl||1)));
      score += idf * (tf*(K1+1))/denom;
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

// ---------- MCP Protocol ----------
const TOOLS = [
  {
    name: 'search_library',
    description: 'Tìm trong thư viện RAG local (BM25). Chỉ tìm trong sách đang gắn (enabled) mặc định. Trả về citation: bookName, chunkId, page, score, snippet.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type:'string', description:'Câu truy vấn (vd: điều khoản thanh toán, chương 5 rủi ro)' },
        top_k: { type:'number', description:'Số kết quả (1-20, mặc định 5)', default:5 },
        enabled_only: { type:'boolean', description:'Chỉ tìm trong sách đang gắn (mặc định true)', default:true }
      },
      required: ['query']
    }
  },
  {
    name: 'list_books',
    description: 'Liệt kê tất cả sách trong thư viện với trạng thái enabled/read/progress/chunks.',
    inputSchema: { type:'object', properties:{}, required:[] }
  },
  {
    name: 'get_book',
    description: 'Lấy chi tiết 1 sách theo id (kèm chunks nếu cần).',
    inputSchema: {
      type:'object',
      properties:{
        id: { type:'string', description:'ID sách (vd: demo-hop-dong-mau)' },
        include_chunks: { type:'boolean', description:'Có trả về chunks không (mặc định false)', default:false }
      },
      required:['id']
    }
  },
  {
    name: 'get_status',
    description: 'Thống kê thư viện: tổng sách, đang gắn, đã đọc, tổng chunk.',
    inputSchema: { type:'object', properties:{}, required:[] }
  }
];

function send(obj){
  process.stdout.write(JSON.stringify(obj) + '\n');
}

let initialized = false;

process.stdin.setEncoding('utf8');
let buffer = '';
process.stdin.on('data', chunk=>{
  buffer += chunk;
  let idx;
  while((idx = buffer.indexOf('\n')) !== -1){
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx+1);
    if(!line) continue;
    let msg;
    try{ msg = JSON.parse(line); }catch{ continue; }
    handleMessage(msg);
  }
});

function handleMessage(msg){
  const { id, method, params } = msg;
  if(method === 'initialize'){
    initialized = true;
    send({
      jsonrpc:'2.0', id,
      result:{
        protocolVersion:'2024-11-05',
        capabilities:{ tools:{} },
        serverInfo:{ name:'library-rag-local', version:'1.0.0' }
      }
    });
    // notification
    send({ jsonrpc:'2.0', method:'notifications/tools/list_changed' });
    return;
  }
  if(method === 'notifications/initialized'){
    return;
  }
  if(method === 'tools/list'){
    send({ jsonrpc:'2.0', id, result:{ tools: TOOLS } });
    return;
  }
  if(method === 'tools/call'){
    const { name, arguments: args } = params || {};
    const data = loadData();
    if(data._missing){
      send({ jsonrpc:'2.0', id, result:{
        content:[{ type:'text', text:`Chưa có export.json. Hãy mở www/library/index.html → bấm Xuất để tạo file tại ${data._file}. Hiện tại thư viện rỗng.` }],
        isError:true
      }});
      return;
    }
    if(data._error){
      send({ jsonrpc:'2.0', id, result:{
        content:[{ type:'text', text:`Lỗi đọc export.json: ${data._error}` }],
        isError:true
      }});
      return;
    }
    try{
      let result;
      if(name === 'search_library'){
        const q = args?.query || '';
        const top_k = Math.min(20, Math.max(1, Number(args?.top_k || 5)));
        const enabled_only = args?.enabled_only !== false;
        if(!q.trim()) throw new Error('query rỗng');
        const hits = searchBM25(q, data.chunks, data.registry, top_k, enabled_only);
        result = {
          query: q,
          hits,
          total_chunks: data.chunks.length,
          enabled_books: Object.values(data.registry).filter(b=>b.enabled).length,
          file: data._file
        };
        send({ jsonrpc:'2.0', id, result:{
          content:[{ type:'text', text: JSON.stringify(result, null, 2) }]
        }});
        return;
      }
      if(name === 'list_books'){
        const books = Object.values(data.registry);
        send({ jsonrpc:'2.0', id, result:{
          content:[{ type:'text', text: JSON.stringify({ total: books.length, books, file: data._file }, null, 2) }]
        }});
        return;
      }
      if(name === 'get_book'){
        const bid = args?.id;
        const book = data.registry[bid];
        if(!book) throw new Error(`Không tìm thấy sách id="${bid}"`);
        const chunks = args?.include_chunks ? data.chunks.filter(c=>c.bookId===bid) : undefined;
        send({ jsonrpc:'2.0', id, result:{
          content:[{ type:'text', text: JSON.stringify({ book, chunks, file: data._file }, null, 2) }]
        }});
        return;
      }
      if(name === 'get_status'){
        const books = Object.values(data.registry);
        const status = {
          total: books.length,
          enabled: books.filter(b=>b.enabled).length,
          read: books.filter(b=>b.read).length,
          chunks: books.reduce((a,b)=>a+(b.chunks||0),0),
          enabledChunks: books.filter(b=>b.enabled).reduce((a,b)=>a+(b.chunks||0),0),
          file: data._file
        };
        send({ jsonrpc:'2.0', id, result:{
          content:[{ type:'text', text: JSON.stringify(status, null, 2) }]
        }});
        return;
      }
      throw new Error(`Unknown tool: ${name}`);
    }catch(e){
      send({ jsonrpc:'2.0', id, result:{
        content:[{ type:'text', text:`Lỗi: ${e.message}` }],
        isError:true
      }});
    }
    return;
  }
  if(id !== undefined){
    send({ jsonrpc:'2.0', id, error:{ code:-32601, message:`Method not found: ${method}` }});
  }
}

// Handle shutdown
process.stdin.on('end', ()=> process.exit(0));
process.on('SIGINT', ()=> process.exit(0));
process.on('SIGTERM', ()=> process.exit(0));

// Log to stderr (not stdout)
console.error(`[library-mcp] Ready. Export file: ${findExportFile()}`);
console.error(`[library-mcp] Tools: ${TOOLS.map(t=>t.name).join(', ')}`);
