window.n5Storage = {
  get: (k) => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => localStorage.removeItem(k)
};
window.n5Speech = {
  speak: (text, lang) => {
    if (!('speechSynthesis' in window)) return false;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'ja-JP';
    u.rate = 0.9;
    speechSynthesis.speak(u);
    return true;
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
