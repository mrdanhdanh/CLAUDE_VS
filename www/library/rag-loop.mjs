/**
 * Library RAG — Agentic Loop (Maker-Checker) · P0-1 Harness 2.1
 * Pure ESM, 0 deps, Node + browser compatible.
 * Reuses BM25 (K1=1.2, B=0.75) + STOPWORDS from mcp-server.mjs / app.js
 * Exports: tokenize, buildIndex, searchBM25, evaluateGap, refineQuery, agenticSearch, SYNONYMS
 */

// ---------- STOPWORDS (same as mcp-server.mjs / app.js) ----------
export const STOPWORDS = new Set([
  'va','la','cua','các','cac','nhung','nhưng','voi','với','cho','trong','tren','trên','duoi','dưới','tu','từ','den','đến','de','để','da','đã','dang','đang','se','sẽ','thi','thì','ma','mà','neu','nếu','khi','tai','tại','ve','về','co','có','khong','không','mot','một','hai','ba','bon','năm','sau','truoc','trước','nay',
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','whom','where','when','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','now'
]);

export function tokenize(text){
  return String(text).toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g)
    .filter(t=> t.length>=2 && !STOPWORDS.has(t));
}

export const K1 = 1.2;
export const B = 0.75;

export function buildIndex(chunks, registry, enabledOnly=true){
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

export function searchBM25(query, chunks, registry, top_k=5, enabledOnly=true){
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

// ---------- Synonym map (heuristic, v1) ----------
export const SYNONYMS = {
  "mcp": ["mcp", "tool", "client", "server"],
  "a2a": ["a2a", "agent", "card"],
  "nlweb": ["nlweb", "embeddings", "vector"],
  "rag": ["rag", "retrieval", "agentic"],
  "planning": ["planning", "task", "decomposition", "pydantic"],
  "plan": ["plan", "planning", "task"],
  "multi": ["multi", "group", "chat", "hand-off", "handoff"],
  "agent": ["agent", "tool", "memory"],
  "metacognition": ["metacognition", "self-reflection", "corrective"],
  "memory": ["memory", "mem0", "cognee", "episodic"],
  "context": ["context", "poisoning", "scratchpad", "compress"],
  "receipt": ["receipt", "ed25519", "jcs", "hash", "chain"],
  "browser": ["browser", "playwright", "cdp", "cua"],
  "local": ["local", "slm", "qwen", "foundry"],
  "tool": ["tool", "function", "calling", "schema"],
  "trustworthy": ["trustworthy", "safety", "injection", "poisoning"],
  "observability": ["observability", "traces", "spans", "opentelemetry"],
  "deploy": ["deploy", "routing", "caching", "scaling"],
  "framework": ["framework", "maf", "foundry"],
  "protocol": ["protocol", "mcp", "a2a", "nlweb"]
};

export function evaluateGap(hits, {minHits=2, minScore=1.0}={}){
  if(!hits || hits.length===0) return {hasGap:true, reason:'no_hits'};
  if(hits.length < minHits) return {hasGap:true, reason:`few_hits:${hits.length}<${minHits}`};
  if(hits[0].score < minScore) return {hasGap:true, reason:`low_score:${hits[0].score}<${minScore}`};
  return {hasGap:false, reason:'ok'};
}

export function refineQuery(query, attempt=1){
  const tokens = tokenize(query);
  if(attempt <= 1) return query;
  if(attempt === 2){
    const expanded = new Set(tokens);
    tokens.forEach(t=>{
      const syns = SYNONYMS[t];
      if(syns){
        syns.forEach(s=>{
          tokenize(s).forEach(tok=> expanded.add(tok));
        });
      }
      // also handle hyphenated keys like "multi-agent" -> check if token is part of key
      // For robustness, check all SYNONYMS keys that contain token
      for(const [key, vals] of Object.entries(SYNONYMS)){
        const keyTokens = tokenize(key);
        if(keyTokens.includes(t) && key !== t){
          vals.forEach(s=> tokenize(s).forEach(tok=> expanded.add(tok)));
        }
      }
    });
    return [...expanded].join(' ');
  }
  // attempt >=3 : split tokens fallback — return tokens joined (already) but ensure we don't duplicate
  // For attempt 3, we return original tokens joined; agenticSearch will also do per-token merge
  return tokens.join(' ');
}

export function agenticSearch(query, chunks, registry, opts={}){
  const top_k = Math.min(20, Math.max(1, Number(opts.top_k || 5)));
  const enabledOnly = opts.enabled_only !== false && opts.enabledOnly !== false;
  const maxRounds = Math.min(5, Math.max(1, Number(opts.maxRounds || opts.max_rounds || 3)));
  const minHits = Number(opts.minHits ?? opts.min_hits ?? 2);
  const minScore = Number(opts.minScore ?? opts.min_score ?? 1.0);

  if(!query || !String(query).trim()) throw new Error('query rỗng');
  const qTokens = tokenize(query);
  if(qTokens.length===0) throw new Error('query rỗng');

  const total_chunks = chunks.length;
  const enabled_books = Object.values(registry).filter(b=>b.enabled).length;
  const file = opts.file || undefined;

  if(total_chunks===0 || enabled_books===0){
    return {
      query: String(query),
      hits: [],
      rounds: 0,
      refinedQueries: [],
      gap: {hasGap:true, reason:'no_data'},
      total_chunks,
      enabled_books,
      ...(file?{file}:{})
    };
  }

  let currentQuery = String(query);
  let hits = searchBM25(currentQuery, chunks, registry, top_k, enabledOnly);
  let refinedQueries = [currentQuery];
  let gap = evaluateGap(hits, {minHits, minScore});
  let rounds = 1;

  if(!gap.hasGap){
    return { query: String(query), hits, rounds, refinedQueries, gap, total_chunks, enabled_books, ...(file?{file}:{}) };
  }

  for(let attempt=2; attempt<=maxRounds; attempt++){
    const nextQuery = refineQuery(String(query), attempt);
    if(!refinedQueries.includes(nextQuery)) refinedQueries.push(nextQuery);
    currentQuery = nextQuery;
    // count round even if dup — ensures maxRounds reached for no_hits queries

    if(attempt === 3){
      // Try normal search first
      const normalHits = searchBM25(currentQuery, chunks, registry, top_k, enabledOnly);
      // Per-token merge fallback
      const tokens = tokenize(String(query));
      const perTokenMap = new Map();
      tokens.forEach(tok=>{
        const th = searchBM25(tok, chunks, registry, top_k, enabledOnly);
        th.forEach(h=>{
          if(!perTokenMap.has(h.chunkId)) perTokenMap.set(h.chunkId, h);
          else {
            const existing = perTokenMap.get(h.chunkId);
            if(h.score > existing.score) perTokenMap.set(h.chunkId, h);
          }
        });
      });
      const merged = [...perTokenMap.values()].sort((a,b)=>b.score-a.score).slice(0, top_k);
      // Choose better
      const normalTop = normalHits[0]?.score || 0;
      const mergedTop = merged[0]?.score || 0;
      if(merged.length > normalHits.length || mergedTop > normalTop){
        hits = merged;
      } else {
        hits = normalHits;
      }
    } else {
      hits = searchBM25(currentQuery, chunks, registry, top_k, enabledOnly);
    }

    gap = evaluateGap(hits, {minHits, minScore});
    rounds = attempt;
    if(!gap.hasGap) break;
  }

  return { query: String(query), hits, rounds, refinedQueries, gap, total_chunks, enabled_books, ...(file?{file}:{}) };
}

export default { tokenize, buildIndex, searchBM25, evaluateGap, refineQuery, agenticSearch, SYNONYMS, STOPWORDS, K1, B };
