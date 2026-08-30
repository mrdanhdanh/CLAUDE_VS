window.n5Storage = {
  get: (k) => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => localStorage.removeItem(k)
};
window.n5Theme = {
  get: () => localStorage.getItem('n5-theme'),
  set: (v) => localStorage.setItem('n5-theme', v),
  apply: (theme) => {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('n5-theme', t); } catch {}
    return t;
  },
  init: () => {
    let t = null;
    try { t = localStorage.getItem('n5-theme'); } catch {}
    if (!t) {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
    return t;
  },
  toggle: () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    return window.n5Theme.apply(next);
  }
};
// init theme ASAP to avoid flash
try { window.n5Theme.init(); } catch {}
window.n5Speech = {
  speak: (text, lang) => {
    try {
      if (!('speechSynthesis' in window)) { console.warn('speechSynthesis not supported'); return false; }
      // Hủy câu đang đọc để bấm liên tiếp vẫn kêu
      try { speechSynthesis.cancel(); } catch {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'ja-JP';
      u.rate = 0.9;
      u.volume = 1;
      // Ưu tiên voice ja-JP nếu có
      const pickVoice = () => {
        const voices = speechSynthesis.getVoices() || [];
        const ja = voices.find(v => (v.lang||'').toLowerCase().startsWith('ja'));
        if (ja) u.voice = ja;
      };
      pickVoice();
      // Nếu voices chưa load, đợi 1 lần
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = () => { pickVoice(); speechSynthesis.speak(u); };
        // fallback: vẫn speak ngay
        setTimeout(() => { try{ speechSynthesis.speak(u);}catch(e){console.error(e)} }, 100);
        return true;
      }
      speechSynthesis.speak(u);
      return true;
    } catch(e){ console.error('n5Speech error', e); return false; }
  }
};
// Rainbow fallback: if @property not supported, animate --angle via JS on <html>
(function(){
  const hasRegister = typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function';
  if (!hasRegister) {
    document.documentElement.classList.add('js-rainbow');
    let angle = 0;
    function tick(){
      angle = (angle + 0.6) % 360;
      document.documentElement.style.setProperty('--angle', angle + 'deg');
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
