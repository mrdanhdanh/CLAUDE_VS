/* Library RAG Local — app.js · BM25 + IndexedDB + Parser + UI + API · 0đ offline */
const LS_KEY = 'library:registry';
const DB_NAME = 'libraryDB';
const STORE = 'chunks';
const CHUNK_SIZE = 2400;
const CHUNK_OVERLAP = 400;
const K1 = 1.2;
const B = 0.75;

// ---------- Helpers ----------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const escapeHtml = s => String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtSize = b => {
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/1024/1024).toFixed(1) + ' MB';
};
const fmtDate = iso => {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }); } catch { return iso; }
};
const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
const toastEl = $('#toast');
function toast(msg, ms=2600){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> toastEl.classList.remove('show'), ms);
}
function uid(name){
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'sach';
  return base + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6);
}

// ---------- IndexedDB ----------
function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if(!db.objectStoreNames.contains(STORE)){
        const s = db.createObjectStore(STORE, { keyPath:'id' });
        s.createIndex('bookId','bookId',{unique:false});
      }
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}
async function dbGetAllChunks(){
  const db = await openDB();
  return new Promise((res, rej)=>{
    const tx = db.transaction(STORE,'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = ()=> res(req.result || []);
    req.onerror = ()=> rej(req.error);
  });
}
async function dbPutChunks(chunks){
  const db = await openDB();
  return new Promise((res, rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    chunks.forEach(c=> store.put(c));
    tx.oncomplete = ()=> res();
    tx.onerror = ()=> rej(tx.error);
  });
}
async function dbDeleteByBook(bookId){
  const db = await openDB();
  return new Promise((res, rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    const store = tx.objectStore(STORE);
    const idx = store.index('bookId');
    const req = idx.getAllKeys(IDBKeyRange.only(bookId));
    req.onsuccess = ()=>{
      const keys = req.result || [];
      keys.forEach(k=> store.delete(k));
      // also need to handle tx complete
    };
    tx.oncomplete = ()=> res();
    tx.onerror = ()=> rej(tx.error);
  });
}
async function dbClearAll(){
  const db = await openDB();
  return new Promise((res, rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = ()=> res();
    tx.onerror = ()=> rej(tx.error);
  });
}

// ---------- Registry ----------
function loadRegistry(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return {};
    const j = JSON.parse(raw);
    return j && typeof j==='object' ? j : {};
  }catch{ return {}; }
}
function saveRegistry(reg){
  localStorage.setItem(LS_KEY, JSON.stringify(reg));
  // also save export for MCP
  try{
    const exp = { generatedAt: new Date().toISOString(), registry: reg };
    localStorage.setItem('library:export', JSON.stringify(exp));
  }catch{}
  scheduleAutoExport();
}
let _autoExportTimer = null;
function scheduleAutoExport(){
  clearTimeout(_autoExportTimer);
  _autoExportTimer = setTimeout(()=> autoExport().catch(()=>{}), 400);
}
async function autoExport(){
  try{
    const chunks = await dbGetAllChunks();
    const data = { version:1, exportedAt: new Date().toISOString(), registry, chunks };
    localStorage.setItem('library:export:full', JSON.stringify(data));
    // also keep a small preview for debugging
    localStorage.setItem('library:export:preview', JSON.stringify({ exportedAt: data.exportedAt, total: Object.keys(registry).length, chunks: chunks.length }));
    checkExportStale();
  }catch{}
}
async function checkExportStale(){
  const banner = document.getElementById('exportBanner');
  if(!banner) return;
  try{
    const res = await fetch('./export.json', { cache:'no-store' });
    if(!res.ok){ banner.hidden = false; return; }
    const fileData = await res.json();
    const fileReg = fileData.registry || {};
    const localIds = Object.keys(registry).sort().join('|');
    const fileIds = Object.keys(fileReg).sort().join('|');
    const localChunks = Object.values(registry).reduce((a,b)=>a+(b.chunks||0),0);
    const fileChunks = fileData.chunks ? fileData.chunks.length : Object.values(fileReg).reduce((a,b)=>a+(b.chunks||0),0);
    const stale = localIds !== fileIds || localChunks !== fileChunks;
    banner.hidden = !stale;
    if(stale){
      const localCount = Object.keys(registry).length;
      const fileCount = Object.keys(fileReg).length;
      const msg = banner.querySelector('#exportBannerMsg');
      if(msg) msg.textContent = `Thư viện đã thay đổi (${localCount} sách, ${localChunks} chunks) — file export.json còn cũ (${fileCount} sách, ${fileChunks} chunks). Bấm Xuất để cập nhật cho /harness.`;
    }
  }catch{
    // if fetch fails (file://), hide banner
    banner.hidden = true;
  }
}
let registry = loadRegistry();
let allChunks = []; // from IndexedDB
let bm25Index = null; // {docs, docFreq, avgdl, N}

// ---------- Tokenize & BM25 ----------
const STOPWORDS = new Set([
  'va','la','cua','các','cac','nhung','nhưng','voi','với','cho','trong','tren','trên','duoi','dưới','tu','từ','den','đến','de','để','da','đã','dang','đang','se','sẽ','thi','thì','ma','mà','neu','nếu','khi','tai','tại','ve','về','co','có','khong','không','mot','một','hai','ba','bon','năm','sau','truoc','trước','nay','nay','nay','nay',
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','where','when','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','now'
]);
function tokenize(text){
  return String(text).toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g)
    .filter(t=> t.length>=2 && !STOPWORDS.has(t));
}
function buildBM25(chunks, reg){
  const enabledIds = new Set(Object.values(reg).filter(b=>b.enabled).map(b=>b.id));
  const docs = chunks.filter(c=> enabledIds.has(c.bookId)).map(c=>{
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
function bm25Search(query, top_k=10){
  if(!bm25Index || bm25Index.N===0) return [];
  const qTokens = tokenize(query);
  if(qTokens.length===0) return [];
  const { docs, docFreq, avgdl, N } = bm25Index;
  const scores = docs.map(d=>{
    let score = 0;
    qTokens.forEach(t=>{
      const tf = d.tf[t] || 0;
      if(tf===0) return;
      const df = docFreq[t] || 0;
      const idf = Math.log(1 + (N - df + 0.5)/(df + 0.5));
      const denom = tf + K1 * (1 - B + B * (d.len / (avgdl||1)));
      score += idf * (tf * (K1+1)) / denom;
    });
    return { doc:d, score };
  }).filter(x=> x.score>0)
    .sort((a,b)=> b.score - a.score)
    .slice(0, top_k)
    .map(({doc, score})=>{
      const snippet = makeSnippet(doc.text, qTokens);
      return {
        bookId: doc.bookId,
        bookName: doc.bookName,
        chunkId: doc.id,
        index: doc.index,
        page: doc.page,
        text: doc.text,
        snippet,
        score: Number(score.toFixed(3))
      };
    });
  return scores;
}
function makeSnippet(text, qTokens, len=300){
  const lower = text.toLowerCase();
  let pos = -1;
  for(const t of qTokens){
    const p = lower.indexOf(t);
    if(p!==-1){ pos=p; break; }
  }
  if(pos===-1) pos=0;
  const start = Math.max(0, pos - 80);
  const end = Math.min(text.length, start + len);
  let snippet = text.slice(start, end);
  if(start>0) snippet = '…' + snippet;
  if(end<text.length) snippet = snippet + '…';
  return snippet;
}
function highlight(text, query){
  const tokens = tokenize(query);
  if(tokens.length===0) return escapeHtml(text);
  let out = escapeHtml(text);
  // sort longest first to avoid nested
  const uniq = [...new Set(tokens)].sort((a,b)=> b.length - a.length);
  uniq.forEach(t=>{
    const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
    out = out.replace(re, '<mark>$1</mark>');
  });
  return out;
}

// ---------- Chunking ----------
function chunkText(text, bookId, bookName, pages){
  const chunks = [];
  // split by double newline first
  const paras = text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  let current = '';
  let idx = 0;
  const pushChunk = (t)=>{
    if(!t.trim()) return;
    // if too long, split by sentence
    if(t.length <= CHUNK_SIZE){
      chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: t, page: estimatePage(idx, chunks.length, pages) });
      idx++;
    } else {
      // split by sentence
      const sentences = t.split(/(?<=[.!?。！？])\s+/);
      let buf = '';
      for(const s of sentences){
        if((buf + ' ' + s).length > CHUNK_SIZE){
          if(buf){
            chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length, pages) });
            idx++;
            // overlap
            const overlap = buf.slice(-CHUNK_OVERLAP);
            buf = overlap + ' ' + s;
          } else {
            // single sentence too long, hard split
            for(let i=0;i<s.length;i+=CHUNK_SIZE-CHUNK_OVERLAP){
              const part = s.slice(i, i+CHUNK_SIZE);
              chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length, pages) });
              idx++;
            }
            buf = '';
          }
        } else {
          buf = buf ? buf + ' ' + s : s;
        }
      }
      if(buf){
        chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: buf, page: estimatePage(idx, chunks.length, pages) });
        idx++;
      }
    }
  };
  for(const p of paras){
    if((current + '\n\n' + p).length > CHUNK_SIZE){
      if(current) pushChunk(current);
      // overlap
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = overlap ? overlap + '\n\n' + p : p;
      // if still too long, push directly
      if(current.length > CHUNK_SIZE*1.5){
        pushChunk(current);
        current = '';
      }
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if(current) pushChunk(current);
  // fallback if no paras
  if(chunks.length===0 && text.trim()){
    for(let i=0;i<text.length;i+=CHUNK_SIZE-CHUNK_OVERLAP){
      const part = text.slice(i, i+CHUNK_SIZE);
      chunks.push({ id: `${bookId}#${String(idx).padStart(3,'0')}`, bookId, bookName, index: idx, text: part, page: estimatePage(idx, chunks.length, pages) });
      idx++;
    }
  }
  return chunks;
}
function estimatePage(idx, total, pages){
  if(!pages || pages<=1) return idx+1;
  // distribute chunks across pages
  return Math.min(pages, Math.max(1, Math.round((idx+1)/Math.max(1,total) * pages) || 1));
}

// ---------- Parsers ----------
async function parsePDF(file){
  if(typeof pdfjsLib === 'undefined'){
    throw new Error('PDF.js chưa tải được (mất mạng?). Thử lại hoặc dùng TXT/MD.');
  }
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = pdf.numPages;
  let full = '';
  for(let i=1;i<=pages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(it=> it.str || '').join(' ');
    full += strings + '\n\n';
    // progress callback via global
    if(window._pdfProgress) window._pdfProgress(i, pages);
  }
  if(!full.trim()){
    throw new Error('PDF này không có text (có thể là scan). Chưa hỗ trợ OCR — hãy thử DOCX/TXT.');
  }
  return { text: full, pages };
}
async function parseDOCX(file){
  if(typeof mammoth === 'undefined'){
    throw new Error('Mammoth chưa tải được (mất mạng?). Thử lại.');
  }
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  const text = res.value || '';
  if(!text.trim()) throw new Error('DOCX rỗng hoặc không đọc được.');
  return { text, pages: 1 };
}
async function parseText(file){
  const text = await file.text();
  if(!text.trim()) throw new Error('File rỗng.');
  return { text, pages: 1 };
}
function getFileType(file){
  const name = file.name.toLowerCase();
  if(name.endsWith('.pdf')) return 'pdf';
  if(name.endsWith('.docx')) return 'docx';
  if(name.endsWith('.doc')) return 'doc';
  if(name.endsWith('.md') || name.endsWith('.markdown')) return 'md';
  if(name.endsWith('.txt')) return 'txt';
  return 'unknown';
}
function typeLabel(t){
  if(t==='pdf') return 'PDF';
  if(t==='docx') return 'DOCX';
  if(t==='md') return 'MD';
  if(t==='txt') return 'TXT';
  return t.toUpperCase();
}
function typeIcon(t){
  if(t==='pdf') return '📄';
  if(t==='docx') return '📝';
  if(t==='md') return '📋';
  if(t==='txt') return '📃';
  return '📚';
}

// ---------- State ----------
let activeFilter = 'all';
let sortBy = 'newest';
let viewMode = 'grid';
let searchQuery = '';

// ---------- Render ----------
function renderStats(){
  const books = Object.values(registry);
  const total = books.length;
  const enabled = books.filter(b=>b.enabled).length;
  const read = books.filter(b=>b.read).length;
  const chunks = books.filter(b=>b.enabled).reduce((a,b)=>a+(b.chunks||0),0);
  const totalChunks = books.reduce((a,b)=>a+(b.chunks||0),0);
  const statsEl = $('#stats');
  if(!statsEl) return;
  const items = [
    { label:'Tổng sách', value: total, sub: `${totalChunks} chunks`, icon:'📚', cls:'total' },
    { label:'Đang gắn', value: enabled, sub: `${chunks} chunks tìm được`, icon:'🧩', cls:'enabled' },
    { label:'Đã đọc', value: read, sub: total? Math.round(read/total*100)+'%' : '—', icon:'✅', cls:'read' },
    { label:'Tổng chunk', value: totalChunks, sub: enabled? `${chunks} đang gắn` : '—', icon:'⚡', cls:'chunks' },
  ];
  statsEl.innerHTML = items.map(it=>`
    <div class="stat" role="listitem" tabindex="0" aria-label="${it.label}: ${it.value}">
      <div class="stat-top">
        <span class="stat-icon ${it.cls}" aria-hidden="true">${it.icon}</span>
        <span class="tag">${it.label}</span>
      </div>
      <strong>${it.value}</strong>
      <span class="stat-label">${it.label}</span>
      <small>${it.sub}</small>
    </div>
  `).join('');
  const heroStats = $('#heroStats');
  if(heroStats) heroStats.textContent = `${total} sách · ${enabled} đang gắn · ${chunks} chunks`;
  const booksTag = $('#booksTag');
  if(booksTag) booksTag.textContent = `${filteredBooks().length} / ${total} hiển thị`;
}
function filteredBooks(){
  let books = Object.values(registry);
  if(activeFilter==='enabled') books = books.filter(b=>b.enabled);
  else if(activeFilter==='disabled') books = books.filter(b=>!b.enabled);
  else if(activeFilter==='read') books = books.filter(b=>b.read);
  else if(activeFilter==='unread') books = books.filter(b=>!b.read);
  // sort
  if(sortBy==='newest') books.sort((a,b)=> new Date(b.addedAt) - new Date(a.addedAt));
  else if(sortBy==='name') books.sort((a,b)=> a.name.localeCompare(b.name, 'vi'));
  else if(sortBy==='chunks') books.sort((a,b)=> (b.chunks||0)-(a.chunks||0));
  else if(sortBy==='progress') books.sort((a,b)=> (b.progress||0)-(a.progress||0));
  return books;
}
function renderBooks(){
  const grid = $('#bookGrid');
  const empty = $('#booksEmpty');
  if(!grid) return;
  const books = filteredBooks();
  renderStats();
  if(Object.keys(registry).length===0){
    grid.innerHTML = '';
    if(empty) empty.hidden = false;
    grid.classList.remove('is-list');
    return;
  }
  if(books.length===0){
    grid.innerHTML = '';
    if(empty){
      empty.hidden = false;
      empty.innerHTML = `<strong>Không có sách nào khớp bộ lọc</strong><br>Thử đổi bộ lọc hoặc tìm kiếm khác.`;
    }
    return;
  }
  if(empty) empty.hidden = true;
  grid.classList.toggle('is-list', viewMode==='list');
  grid.innerHTML = books.map(b=>{
    const pct = b.progress||0;
    const isRead = b.read;
    const isEnabled = b.enabled;
    const iconCls = b.type==='pdf'?'pdf': b.type==='docx'?'docx': b.type==='md'?'md':'txt';
    return `
      <div class="book-card ${isEnabled?'':'is-disabled'} ${isRead?'is-read':''}" role="listitem" tabindex="0" aria-label="${escapeHtml(b.name)} ${isEnabled?'đang gắn':'đã tháo'} ${isRead?'đã đọc':'chưa đọc'}">
        <div class="book-card-head">
          <div class="book-icon ${iconCls}" aria-hidden="true">${typeIcon(b.type)}</div>
          <div class="book-main">
            <div class="book-title" title="${escapeHtml(b.name)}">${escapeHtml(b.name)}</div>
            <div class="book-meta">
              <span>${typeLabel(b.type)}</span>
              <span>·</span>
              <span>${b.chunks||0} chunks</span>
              <span>·</span>
              <span>${fmtSize(b.size||0)}</span>
              <span>·</span>
              <span>${fmtDate(b.addedAt)}</span>
              ${b.pages? `<span>·</span><span>${b.pages} trang</span>`:''}
            </div>
            <div class="book-badges" style="margin-top:6px">
              ${isEnabled? '<span class="tag tag-on">● Đang gắn</span>' : '<span class="tag tag-off">○ Đã tháo</span>'}
              ${isRead? '<span class="tag tag-read">✓ Đã đọc</span>' : '<span class="tag tag-unread">○ Chưa đọc</span>'}
            </div>
          </div>
        </div>
        <div class="book-progress">
          <div class="book-progress-head">
            <span>Tiến độ</span>
            <strong>${pct}%</strong>
          </div>
          <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ ${pct}%">
            <i style="width:${pct}%;background:${pct===100?'var(--lib-success)':'linear-gradient(90deg, var(--lib-primary), var(--lib-secondary))'}"></i>
          </div>
          <input type="range" min="0" max="100" value="${pct}" data-id="${b.id}" class="progress-range" aria-label="Điều chỉnh tiến độ ${escapeHtml(b.name)}" style="margin-top:8px" />
        </div>
        <div class="book-actions">
          <button class="btn ${isEnabled?'btn-ghost':'btn-primary'} btn-sm" data-action="toggle-enable" data-id="${b.id}" aria-label="${isEnabled?'Tháo':'Gắn'} ${escapeHtml(b.name)}">
            ${isEnabled? '🧩 Tháo' : '✓ Gắn'}
          </button>
          <button class="btn ${isRead?'btn-ghost':'btn-primary'} btn-sm" data-action="toggle-read" data-id="${b.id}" aria-label="${isRead?'Đánh dấu chưa đọc':'Đánh dấu đã đọc'}">
            ${isRead? '○ Chưa đọc' : '✓ Đã đọc'}
          </button>
          <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${b.id}" aria-label="Xóa ${escapeHtml(b.name)}" style="color:var(--lib-danger);border-color:var(--lib-danger-border)">
            🗑 Xóa
          </button>
        </div>
      </div>
    `;
  }).join('');
  // bind range
  grid.querySelectorAll('.progress-range').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const id = e.target.dataset.id;
      const v = parseInt(e.target.value,10);
      const card = e.target.closest('.book-card');
      if(card){
        const bar = card.querySelector('.progress i');
        const strong = card.querySelector('.book-progress-head strong');
        if(bar) bar.style.width = v+'%';
        if(strong) strong.textContent = v+'%';
      }
    });
    inp.addEventListener('change', e=>{
      const id = e.target.dataset.id;
      const v = parseInt(e.target.value,10);
      setProgress(id, v);
    });
  });
}
function renderResults(results, query, timeMs){
  const section = $('#resultsSection');
  const list = $('#resultsList');
  const empty = $('#resultsEmpty');
  const title = $('#resultsTitle');
  const tag = $('#resultsTag');
  const info = $('#searchInfo');
  const timeEl = $('#searchTime');
  if(!section || !list) return;
  if(!query.trim()){
    section.hidden = true;
    if(info) info.textContent = 'Gõ để tìm trong sách đang gắn';
    if(timeEl) timeEl.textContent = '';
    return;
  }
  section.hidden = false;
  if(title) title.textContent = `Kết quả cho “${query.slice(0,40)}”`;
  if(tag) tag.textContent = `${results.length} kết quả · ${timeMs}ms`;
  if(info) info.textContent = results.length? `Tìm thấy ${results.length} đoạn` : 'Không tìm thấy';
  if(timeEl) timeEl.textContent = `${timeMs}ms`;
  if(results.length===0){
    list.innerHTML = '';
    if(empty) empty.hidden = false;
    return;
  }
  if(empty) empty.hidden = true;
  list.innerHTML = results.map(r=>`
    <div class="result-item" role="listitem">
      <div class="result-head">
        <span class="result-book">${escapeHtml(r.bookName)}</span>
        <span class="result-cite">chunk #${r.index} · trang ${r.page}</span>
        <span class="result-score">${r.score}</span>
      </div>
      <div class="result-snippet">${highlight(r.snippet, query)}</div>
      <div class="result-actions">
        <button class="btn btn-ghost btn-sm" data-copy="${escapeHtml(r.text).slice(0,2000)}" aria-label="Copy đoạn">Copy</button>
        <button class="btn btn-ghost btn-sm" data-book="${r.bookId}" aria-label="Xem sách">Xem sách</button>
      </div>
    </div>
  `).join('');
  // bind copy
  list.querySelectorAll('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(()=> toast('Đã copy đoạn')).catch(()=> toast('Copy thất bại'));
    });
  });
  list.querySelectorAll('[data-book]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-book');
      const el = document.querySelector(`[data-id="${id}"]`);
      if(el) el.closest('.book-card')?.scrollIntoView({behavior:'smooth', block:'center'});
      toast('Đã cuộn tới sách');
    });
  });
}

// ---------- Actions ----------
function toggleEnable(id){
  const b = registry[id];
  if(!b) return;
  b.enabled = !b.enabled;
  saveRegistry(registry);
  bm25Index = buildBM25(allChunks, registry);
  renderBooks();
  // re-search if query
  if(searchQuery.trim()){
    const t0 = performance.now();
    const res = bm25Search(searchQuery, 20);
    const dt = Math.round(performance.now()-t0);
    renderResults(res, searchQuery, dt);
  }
  toast(b.enabled? `Đã gắn “${b.name}”` : `Đã tháo “${b.name}” — không còn tìm thấy`);
}
function toggleRead(id){
  const b = registry[id];
  if(!b) return;
  b.read = !b.read;
  if(b.read) b.progress = 100;
  else if(b.progress===100) b.progress = 0;
  saveRegistry(registry);
  renderBooks();
  toast(b.read? 'Đã đánh dấu đã đọc' : 'Đã đánh dấu chưa đọc');
}
function setProgress(id, v){
  const b = registry[id];
  if(!b) return;
  b.progress = Math.max(0, Math.min(100, v));
  if(b.progress===100) b.read = true;
  else if(b.progress<100 && b.read && v<100) b.read = false;
  saveRegistry(registry);
  renderBooks();
  toast(`Tiến độ ${b.progress}%`);
}
let pendingDeleteId = null;
function confirmDelete(id){
  const b = registry[id];
  if(!b) return;
  pendingDeleteId = id;
  const modal = $('#modal');
  const title = $('#modalTitle');
  const desc = $('#modalDesc');
  if(title) title.textContent = 'Xóa sách?';
  if(desc) desc.textContent = `Bạn chắc muốn xóa “${b.name}” (${b.chunks} chunks)? Hành động này xóa luôn chunks trong IndexedDB và không thể hoàn tác.`;
  if(modal){
    modal.hidden = false;
    modal.classList.add('is-open');
    // focus trap
    const confirmBtn = $('#modalConfirm');
    if(confirmBtn) confirmBtn.focus();
    document.body.style.overflow = 'hidden';
  }
}
async function doDelete(){
  if(!pendingDeleteId) return;
  const id = pendingDeleteId;
  const b = registry[id];
  pendingDeleteId = null;
  closeModal();
  if(!b) return;
  try{
    await dbDeleteByBook(id);
    allChunks = allChunks.filter(c=> c.bookId!==id);
    delete registry[id];
    saveRegistry(registry);
    bm25Index = buildBM25(allChunks, registry);
    renderBooks();
    if(searchQuery.trim()){
      const t0 = performance.now();
      const res = bm25Search(searchQuery, 20);
      const dt = Math.round(performance.now()-t0);
      renderResults(res, searchQuery, dt);
    }
    toast(`Đã xóa “${b.name}”`);
  }catch(e){
    toast('Xóa thất bại: ' + e.message);
  }
}
function closeModal(){
  const modal = $('#modal');
  if(modal){
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  pendingDeleteId = null;
}

// ---------- Upload ----------
async function handleFiles(files){
  const list = [...files];
  if(list.length===0) return;
  const zone = $('#uploadZone');
  const prog = $('#uploadProgress');
  const bar = $('#uploadBar');
  const text = $('#uploadText');
  const errEl = $('#uploadError');
  if(errEl) errEl.hidden = true;
  if(prog) prog.hidden = false;
  let done = 0;
  for(const file of list){
    const type = getFileType(file);
    if(type==='unknown'){
      if(errEl){ errEl.textContent = `Bỏ qua “${file.name}”: định dạng không hỗ trợ (chỉ PDF/DOCX/TXT/MD)`; errEl.hidden=false; }
      continue;
    }
    if(type==='doc'){
      if(errEl){ errEl.textContent = `“${file.name}” là .doc cũ — vui lòng Save As .docx rồi upload lại.`; errEl.hidden=false; }
      continue;
    }
    if(file.size > 50*1024*1024){
      if(errEl){ errEl.textContent = `“${file.name}” quá lớn (>50MB), bỏ qua.`; errEl.hidden=false; }
      continue;
    }
    const id = uid(file.name);
    if(text) text.textContent = `Đang đọc ${file.name}…`;
    if(bar) bar.style.width = `${Math.round(done/list.length*100)}%`;
    try{
      let parsed;
      if(type==='pdf'){
        window._pdfProgress = (cur, total)=>{
          if(text) text.textContent = `Đang đọc ${file.name}… trang ${cur}/${total}`;
          if(bar) bar.style.width = `${Math.round((done + cur/total)/list.length*100)}%`;
        };
        parsed = await parsePDF(file);
        window._pdfProgress = null;
      } else if(type==='docx'){
        parsed = await parseDOCX(file);
      } else {
        parsed = await parseText(file);
      }
      if(text) text.textContent = `Đang chia chunk ${file.name}…`;
      const chunks = chunkText(parsed.text, id, file.name, parsed.pages);
      if(chunks.length===0) throw new Error('Không tạo được chunk (file rỗng?)');
      // save registry
      registry[id] = {
        id, name: file.name, type, enabled:true, read:false, progress:0,
        chunks: chunks.length, size: file.size, addedAt: new Date().toISOString(), pages: parsed.pages
      };
      saveRegistry(registry);
      await dbPutChunks(chunks);
      allChunks.push(...chunks);
      bm25Index = buildBM25(allChunks, registry);
      renderBooks();
      done++;
      if(bar) bar.style.width = `${Math.round(done/list.length*100)}%`;
      if(text) text.textContent = `Đã thêm ${file.name} — ${chunks.length} chunks`;
      toast(`Đã thêm “${file.name}” — ${chunks.length} chunks`);
    }catch(e){
      console.error(e);
      if(errEl){ errEl.textContent = `Lỗi “${file.name}”: ${e.message}`; errEl.hidden=false; }
      toast(`Lỗi ${file.name}: ${e.message}`);
    }
  }
  if(prog) setTimeout(()=> prog.hidden=true, 1200);
  if(bar) bar.style.width = '0%';
}

// ---------- Export / Import ----------
async function doExport(){
  const chunks = await dbGetAllChunks();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    registry,
    chunks
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `library-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  // also save export.json for MCP (via localStorage, user can copy)
  try{
    localStorage.setItem('library:export:chunks', JSON.stringify(chunks.slice(0,5)));
  }catch{}
  toast('Đã xuất file JSON');
}
async function doImport(file){
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if(!data.registry) throw new Error('File không có registry');
    const reg = data.registry;
    const chunks = data.chunks || [];
    // merge
    let added = 0;
    for(const [id, book] of Object.entries(reg)){
      if(!registry[id]){
        registry[id] = book;
        added++;
      }
    }
    saveRegistry(registry);
    if(chunks.length){
      await dbPutChunks(chunks);
      allChunks = await dbGetAllChunks();
    } else {
      allChunks = await dbGetAllChunks();
    }
    bm25Index = buildBM25(allChunks, registry);
    renderBooks();
    toast(`Đã nhập ${added} sách mới, ${chunks.length} chunks`);
  }catch(e){
    toast('Import thất bại: ' + e.message);
  }
}

// ---------- Search ----------
const doSearch = debounce(()=>{
  const q = searchQuery;
  if(!q.trim()){
    renderResults([], '', 0);
    return;
  }
  const t0 = performance.now();
  const res = bm25Search(q, 20);
  const dt = Math.round(performance.now()-t0);
  renderResults(res, q, dt);
}, 150);

// ---------- Bind ----------
function bindEvents(){
  // search
  const input = $('#searchInput');
  const clear = $('#searchClear');
  if(input){
    input.addEventListener('input', e=>{
      searchQuery = e.target.value;
      if(clear) clear.hidden = !searchQuery;
      doSearch();
    });
    input.addEventListener('keydown', e=>{
      if(e.key==='Escape'){
        searchQuery = '';
        input.value = '';
        if(clear) clear.hidden = true;
        renderResults([], '', 0);
      }
    });
  }
  if(clear){
    clear.addEventListener('click', ()=>{
      searchQuery = '';
      if(input) input.value = '';
      clear.hidden = true;
      renderResults([], '', 0);
      if(input) input.focus();
    });
  }
  // keyboard /
  document.addEventListener('keydown', e=>{
    if(e.key==='/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName!=='INPUT' && document.activeElement?.tagName!=='TEXTAREA'){
      e.preventDefault();
      if(input) input.focus();
    }
    if(e.key==='Escape'){
      const modal = $('#modal');
      if(modal && !modal.hidden) closeModal();
    }
  });
  // upload zone
  const zone = $('#uploadZone');
  const fileInput = $('#fileInput');
  if(zone && fileInput){
    zone.addEventListener('click', ()=> fileInput.click());
    zone.addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        fileInput.click();
      }
    });
    zone.addEventListener('dragover', e=>{
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', ()=> zone.classList.remove('dragover'));
    zone.addEventListener('drop', e=>{
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if(files.length) handleFiles(files);
    });
    fileInput.addEventListener('change', e=>{
      const files = e.target.files;
      if(files.length) handleFiles(files);
      e.target.value = '';
    });
  }
  // filter pills
  $$('#filterPills .filter-pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeFilter = btn.dataset.filter || 'all';
      $$('#filterPills .filter-pill').forEach(p=>{
        const on = p.dataset.filter===activeFilter;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-pressed', String(on));
      });
      renderBooks();
    });
  });
  // sort
  const sortSel = $('#sortSelect');
  if(sortSel){
    sortSel.addEventListener('change', e=>{
      sortBy = e.target.value;
      renderBooks();
    });
  }
  // view toggle
  $$('.view-toggle .view-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      viewMode = btn.dataset.view || 'grid';
      $$('.view-toggle .view-btn').forEach(b=>{
        const on = b.dataset.view===viewMode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      renderBooks();
    });
  });
  // book actions delegate
  const grid = $('#bookGrid');
  if(grid){
    grid.addEventListener('click', e=>{
      const btn = e.target.closest('[data-action]');
      if(!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if(action==='toggle-enable') toggleEnable(id);
      else if(action==='toggle-read') toggleRead(id);
      else if(action==='delete') confirmDelete(id);
    });
  }
  // modal
  const modal = $('#modal');
  const backdrop = $('#modalBackdrop');
  const cancel = $('#modalCancel');
  const confirm = $('#modalConfirm');
  if(backdrop) backdrop.addEventListener('click', closeModal);
  if(cancel) cancel.addEventListener('click', closeModal);
  if(confirm) confirm.addEventListener('click', doDelete);
  if(modal){
    modal.addEventListener('keydown', e=>{
      if(e.key==='Escape') closeModal();
      // focus trap simple
      if(e.key==='Tab'){
        const focusable = modal.querySelectorAll('button');
        if(focusable.length===0) return;
        const first = focusable[0];
        const last = focusable[focusable.length-1];
        if(e.shiftKey && document.activeElement===first){
          e.preventDefault(); last.focus();
        } else if(!e.shiftKey && document.activeElement===last){
          e.preventDefault(); first.focus();
        }
      }
    });
  }
  // export/import
  const btnExport = $('#btnExport');
  if(btnExport) btnExport.addEventListener('click', doExport);
  const importFile = $('#importFile');
  if(importFile){
    importFile.addEventListener('change', e=>{
      const f = e.target.files[0];
      if(f) doImport(f);
      e.target.value = '';
    });
  }
  // export banner
  const btnBannerExport = $('#btnExportBanner');
  if(btnBannerExport) btnBannerExport.addEventListener('click', doExport);
  const btnDismiss = $('#btnDismissBanner');
  if(btnDismiss) btnDismiss.addEventListener('click', ()=>{
    const b = document.getElementById('exportBanner');
    if(b) b.hidden = true;
    try{ localStorage.setItem('library:banner:dismissed', Date.now().toString()); }catch{}
  });
  // help
  const btnHelp = $('#btnHelp');
  const helpSec = $('#helpSection');
  if(btnHelp && helpSec){
    btnHelp.addEventListener('click', ()=>{
      helpSec.hidden = !helpSec.hidden;
      if(!helpSec.hidden) helpSec.scrollIntoView({behavior:'smooth'});
    });
  }
  const btnCopyApi = $('#btnCopyApi');
  if(btnCopyApi){
    btnCopyApi.addEventListener('click', ()=>{
      const code = `await window.LibrarySearch.search("điều khoản thanh toán", {top_k:5})`;
      navigator.clipboard.writeText(code).then(()=> toast('Đã copy')).catch(()=> toast(code));
    });
  }
  const btnTest = $('#btnTestSearch');
  if(btnTest){
    btnTest.addEventListener('click', ()=>{
      const inp = $('#searchInput');
      if(inp){ inp.value='hợp đồng'; searchQuery='hợp đồng'; if($('#searchClear')) $('#searchClear').hidden=false; doSearch(); inp.focus(); }
    });
  }
}

// ---------- API for AI ----------
function exposeAPI(){
  window.LibrarySearch = {
    search: (q, opts={})=>{
      const top_k = opts.top_k || opts.topK || 5;
      const enabledOnly = opts.enabledOnly !== false;
      // if enabledOnly false, temporarily build index with all
      if(!enabledOnly){
        const tmpIdx = buildBM25(allChunks, Object.fromEntries(Object.entries(registry).map(([k,v])=> [k, {...v, enabled:true}])));
        const old = bm25Index;
        bm25Index = tmpIdx;
        const res = bm25Search(q, top_k);
        bm25Index = old;
        return res;
      }
      return bm25Search(q, top_k);
    },
    listBooks: ()=> Object.values(registry),
    getBook: (id)=> registry[id] || null,
    getStatus: ()=>{
      const books = Object.values(registry);
      return {
        total: books.length,
        enabled: books.filter(b=>b.enabled).length,
        read: books.filter(b=>b.read).length,
        chunks: books.reduce((a,b)=>a+(b.chunks||0),0),
        enabledChunks: books.filter(b=>b.enabled).reduce((a,b)=>a+(b.chunks||0),0)
      };
    },
    toggleEnable: toggleEnable,
    toggleRead: toggleRead,
    setProgress: setProgress,
    // for fetch-style
    fetchSearch: async (q, top_k=5)=>{
      return bm25Search(q, top_k);
    }
  };
  // also support fetch /library/api/search?q=... via service worker? Instead, document that AI can call window.LibrarySearch
  console.log('[Library] API ready: window.LibrarySearch.search(q, {top_k})');
}

// ---------- Init ----------
async function init(){
  bindEvents();
  exposeAPI();
  try{
    allChunks = await dbGetAllChunks();
  }catch(e){
    console.warn('IndexedDB fail', e);
    allChunks = [];
    toast('IndexedDB không khả dụng — search sẽ không lưu được');
  }
  bm25Index = buildBM25(allChunks, registry);
  renderBooks();
  // if no books, show demo hint
  if(Object.keys(registry).length===0 && allChunks.length===0){
    // add demo book for testing
    const demoText = `HỢP ĐỒNG MẪU — ĐIỀU KHOẢN THANH TOÁN\n\nĐiều 5. Thanh toán: Bên A thanh toán cho Bên B trong vòng 30 ngày kể từ ngày nhận hóa đơn hợp lệ. Quá hạn sẽ tính lãi 0.05%/ngày.\n\nĐiều 6. Rủi ro pháp lý: Bên vi phạm chịu trách nhiệm bồi thường thiệt hại thực tế, bao gồm chi phí luật sư.\n\nChương 5. Quản lý rủi ro: Đánh giá rủi ro pháp lý, tài chính, vận hành. Lập kế hoạch dự phòng.\n\nPhụ lục A: Biểu mẫu nghiệm thu, biên bản bàn giao.`;
    const demoId = 'demo-hop-dong-mau';
    if(!registry[demoId]){
      const demoChunks = chunkText(demoText, demoId, 'Demo — Hợp đồng mẫu.txt', 1);
      registry[demoId] = { id:demoId, name:'Demo — Hợp đồng mẫu.txt', type:'txt', enabled:true, read:false, progress:0, chunks: demoChunks.length, size: demoText.length, addedAt: new Date().toISOString(), pages:1 };
      saveRegistry(registry);
      await dbPutChunks(demoChunks);
      allChunks.push(...demoChunks);
      bm25Index = buildBM25(allChunks, registry);
      renderBooks();
      toast('Đã tạo sách demo — thử tìm “thanh toán” hoặc “rủi ro”');
    }
  }
  // handle ?q= param
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || params.get('search');
  if(q){
    const inp = $('#searchInput');
    if(inp){ inp.value=q; searchQuery=q; if($('#searchClear')) $('#searchClear').hidden=false; doSearch(); }
  }
  // check export stale after init
  setTimeout(()=> checkExportStale().catch(()=>{}), 800);
  // also check when tab becomes visible
  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden) checkExportStale().catch(()=>{});
  });
}
init();

// expose for debugging
window._lib = { get registry(){return registry}, get chunks(){return allChunks}, get index(){return bm25Index}, buildBM25, bm25Search };
