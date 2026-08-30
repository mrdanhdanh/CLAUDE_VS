// site.js — chung cho www/n5-blazor (static, không cần dotnet)
const N5 = (() => {
  const KEY = 'n5-progress';
  const def = () => ({ learnedKana:[], learnedKanji:[], learnedVocabIds:[], learnedGrammarIds:[], bookmarks:[], streakDays:0, lastStudyDate:null, quizScores:{} });
  let cache = null;
  function load(){
    if(cache) return cache;
    try{
      const raw = localStorage.getItem(KEY);
      if(raw){ const p = JSON.parse(raw); cache = {...def(), ...p,
        learnedKana: new Set(p.learnedKana||[]),
        learnedKanji: new Set(p.learnedKanji||[]),
        learnedVocabIds: new Set(p.learnedVocabIds||[]),
        learnedGrammarIds: new Set(p.learnedGrammarIds||[]),
        bookmarks: new Set(p.bookmarks||[]),
        quizScores: p.quizScores||{}
      }; } else cache = {...def(), learnedKana:new Set(), learnedKanji:new Set(), learnedVocabIds:new Set(), learnedGrammarIds:new Set(), bookmarks:new Set(), quizScores:{}};
    }catch{ cache = {...def(), learnedKana:new Set(), learnedKanji:new Set(), learnedVocabIds:new Set(), learnedGrammarIds:new Set(), bookmarks:new Set(), quizScores:{}}; }
    // streak
    const today = new Date().toISOString().slice(0,10);
    if(cache.lastStudyDate !== today){
      const yest = new Date(Date.now()-86400000).toISOString().slice(0,10);
      if(cache.lastStudyDate === yest) cache.streakDays = (cache.streakDays||0)+1;
      else if(!cache.lastStudyDate) cache.streakDays = 1;
      else if(cache.lastStudyDate !== today) cache.streakDays = 1;
      cache.lastStudyDate = today;
      save();
    }
    return cache;
  }
  function save(){
    if(!cache) return;
    const out = {
      learnedKana:[...cache.learnedKana],
      learnedKanji:[...cache.learnedKanji],
      learnedVocabIds:[...cache.learnedVocabIds],
      learnedGrammarIds:[...cache.learnedGrammarIds],
      bookmarks:[...cache.bookmarks],
      streakDays:cache.streakDays,
      lastStudyDate:cache.lastStudyDate,
      quizScores:cache.quizScores
    };
    try{ localStorage.setItem(KEY, JSON.stringify(out)); }catch{}
    document.dispatchEvent(new CustomEvent('n5:progress', {detail:cache}));
  }
  function toggleSet(set, val){ if(set.has(val)) set.delete(val); else set.add(val); save(); return set.has(val); }
  return {
    load, save,
    get: load,
    addKana(ch){ const c=load(); const had=c.learnedKana.has(ch); if(!had){c.learnedKana.add(ch); save();} return !had; },
    toggleKana(ch){ return toggleSet(load().learnedKana, ch); },
    toggleKanji(ch){ return toggleSet(load().learnedKanji, ch); },
    toggleVocab(id){ return toggleSet(load().learnedVocabIds, id); },
    toggleGrammar(id){ return toggleSet(load().learnedGrammarIds, id); },
    toggleBookmark(key){ return toggleSet(load().bookmarks, key); },
    recordQuiz(cat, score){ const c=load(); c.quizScores[cat]=Math.max(c.quizScores[cat]||0, score); save(); },
    exportJSON(){ const c=load(); return JSON.stringify({learnedKana:[...c.learnedKana],learnedKanji:[...c.learnedKanji],learnedVocabIds:[...c.learnedVocabIds],learnedGrammarIds:[...c.learnedGrammarIds],bookmarks:[...c.bookmarks],streakDays:c.streakDays,lastStudyDate:c.lastStudyDate,quizScores:c.quizScores}, null, 2); },
    reset(){ cache={...def(), learnedKana:new Set(), learnedKanji:new Set(), learnedVocabIds:new Set(), learnedGrammarIds:new Set(), bookmarks:new Set(), quizScores:{}}; save(); }
  };
})();

// Helper component
function renderHelper({title, purpose, structure, techniques, features, route, component, bulletsTech, bulletsFeat, extra}){
  const id = 'h'+Math.random().toString(36).slice(2,6);
  return `<div class="glass helper open" id="${id}">
    <div class="helper-header" onclick="this.parentElement.classList.toggle('open')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')this.click()" aria-expanded="true">
      <h3>🧭 Helper — ${title}</h3>
      <div style="display:flex;align-items:center;gap:8px"><span class="helper-badge">Static • Glass • Helper</span><span class="helper-toggle">⌄</span></div>
    </div>
    <div class="helper-body">
      <div class="helper-grid">
        <div class="helper-section"><h4>🎯 Trang dùng làm gì</h4><p>${purpose}</p></div>
        <div class="helper-section"><h4>🏗️ Cấu trúc</h4><p>${structure}</p>${route?`<p style="margin-top:6px"><code>${route}</code> • <code>${component}</code></p>`:''}</div>
        <div class="helper-section"><h4>⚙️ Kỹ thuật</h4><p>${techniques}</p>${bulletsTech?`<ul>${bulletsTech.map(b=>`<li>${b}</li>`).join('')}</ul>`:''}</div>
        <div class="helper-section"><h4>✨ Tính năng</h4><p>${features}</p>${bulletsFeat?`<ul>${bulletsFeat.map(b=>`<li>${b}</li>`).join('')}</ul>`:''}</div>
      </div>
      ${extra?`<div class="helper-section"><h4>📝 Ghi chú</h4><p>${extra}</p></div>`:''}
    </div>
  </div>`;
}
function progressRing(value, label, size=96){
  const r=52, C=2*Math.PI*r, off=C*(1-Math.max(0,Math.min(100,value))/100);
  const id='g'+Math.random().toString(36).slice(2,6);
  return `<div class="progress-ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${label} ${value}%">
      <defs><linearGradient id="grad-${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#0ea5e9"/></linearGradient></defs>
      <circle class="progress-ring-bg" cx="60" cy="60" r="${r}"/><circle class="progress-ring-fill" cx="60" cy="60" r="${r}" stroke="url(#grad-${id})" stroke-dasharray="${C}" stroke-dashoffset="${off}"/>
    </svg>
    <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div style="font-size:22px;font-weight:800;line-height:1">${value}%</div><div style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.06em;text-transform:uppercase">${label}</div></div></div>
  </div>`;
}
function speak(text){
  if(window.n5Speech) return window.n5Speech.speak(text, 'ja-JP');
  try{
    if(!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang='ja-JP'; u.rate=0.9; speechSynthesis.speak(u); return true;
  }catch{ return false; }
}
function esc(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// Layout helpers
document.addEventListener('DOMContentLoaded', ()=>{
  // theme toggle
  const btn = document.getElementById('themeToggle');
  if(btn){
    const cur = document.documentElement.getAttribute('data-theme')||'dark';
    btn.textContent = cur==='light' ? '🌙' : '☀️';
    btn.addEventListener('click', ()=>{
      const next = window.n5Theme ? window.n5Theme.toggle() : (document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
      if(!window.n5Theme) document.documentElement.setAttribute('data-theme', next);
      btn.textContent = next==='light' ? '🌙' : '☀️';
    });
  }
  // mobile drawer
  const toggle = document.getElementById('mobileToggle');
  const drawer = document.getElementById('mobileDrawer');
  if(toggle && drawer){
    toggle.addEventListener('click', ()=> drawer.classList.toggle('open'));
    drawer.addEventListener('click', (e)=>{ if(e.target===drawer || e.target.classList.contains('mobile-drawer-backdrop')) drawer.classList.remove('open'); });
  }
  // active nav
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a=>{
    const href = a.getAttribute('href');
    if(href===path || (path==='index.html' && href==='index.html') || (path==='' && href==='index.html')) a.classList.add('active');
  });
  // progress mini
  function updMini(){
    const p=N5.get();
    const pct = Math.round(((p.learnedKanji.size/36)+(p.learnedVocabIds.size/40))/2*100)||0;
    const el=document.getElementById('miniPct'); if(el) el.textContent=pct+'%';
    const bar=document.getElementById('miniBar'); if(bar) bar.style.width=pct+'%';
    const streak=document.getElementById('miniStreak'); if(streak) streak.textContent='🔥 '+p.streakDays+' ngày';
  }
  updMini();
  document.addEventListener('n5:progress', updMini);
});
