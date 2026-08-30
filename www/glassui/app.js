/* GlassUI — app.js · YUNIE · playground + sheet + tabbar + copy */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const toastEl = $('#toast');

function toast(msg, ms=2600){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=> toastEl.classList.remove('show'), ms);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast('Đã sao chép ✓');
    return true;
  }catch{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); toast('Đã sao chép ✓'); }catch{ toast('Không sao chép được'); }
    ta.remove();
    return false;
  }
}

// ---------- Rainbow fallback — chỉ chạy khi @property chưa hỗ trợ ----------
// Khi @property được hỗ trợ, CSS animation gốc (rotate-angle) tự chạy → không cần JS.
// Khi KHÔNG hỗ trợ, custom property --angle không thể interpolate bằng CSS → tắt animation gốc
// (qua class .js-rainbow trên <html>) và tự drive --angle bằng requestAnimationFrame.
// Dùng class ở <html> (không phải per-element) để không bị reset bởi playground (className='').
(function initRainbowFallback(){
  const els = document.querySelectorAll('.rainbow-animated, .glass-rainbow.animated');
  if(!els.length) return;
  const mqlReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Phát hiện @property đúng cách. CSS.supports('syntax: "<angle>"') KHÔNG test được @property
  // (syntax không phải property) → luôn false → sai. Dùng CSS.registerProperty thay thế.
  const supportsAtProperty = (typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function');
  if(supportsAtProperty) return; // native CSS animation chạy bình thường, không cần JS

  // Fallback: tắt animation gốc, drive --angle bằng JS
  document.documentElement.classList.add('js-rainbow');
  const map = new Map();
  els.forEach(el=>{
    const isGlass = el.classList.contains('glass-rainbow');
    const defaultSpeed = isGlass ? 4 : 3;
    const speedStr = getComputedStyle(el).getPropertyValue('--angle-speed')
      || getComputedStyle(document.documentElement).getPropertyValue('--angle-speed')
      || (defaultSpeed + 's');
    const speed = parseFloat(speedStr) || defaultSpeed;
    map.set(el, { angle: Math.random()*360, speed, defaultSpeed, last: performance.now() });
  });
  function tick(now){
    const isReduced = mqlReduced.matches;
    map.forEach((state, el)=>{
      if(!document.body.contains(el)) return;
      // hover-only: chỉ chạy khi hover/focus
      if(el.classList.contains('rainbow-hover') && !el.matches(':hover') && !el.matches(':focus-within')) {
        state.last = now;
        return;
      }
      const delta = now - state.last;
      state.last = now;
      // Cập nhật speed nếu playground đổi
      const curSpeedStr = getComputedStyle(el).getPropertyValue('--angle-speed')
        || getComputedStyle(document.documentElement).getPropertyValue('--angle-speed')
        || (state.defaultSpeed + 's');
      let curSpeed = parseFloat(curSpeedStr) || state.speed;
      // Khi reduced-motion bật, chạy chậm hơn (tối thiểu 6s) để tôn trọng a11y nhưng vẫn thấy xoay
      if(isReduced) curSpeed = Math.max(curSpeed, 6);
      if(curSpeed !== state.speed) state.speed = curSpeed;
      const degPerMs = 360 / (curSpeed * 1000);
      state.angle = (state.angle + delta * degPerMs) % 360;
      el.style.setProperty('--angle', state.angle + 'deg');
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ---------- Theme ----------
const btnTheme = $('#btnTheme');
let isDark = localStorage.getItem('glassui-theme') === 'dark';
function applyTheme(dark){
  isDark = dark;
  localStorage.setItem('glassui-theme', dark ? 'dark' : 'light');
  if(dark){
    document.documentElement.style.setProperty('--glass-fill', 'rgb(15 23 42 / 55%)');
    document.documentElement.style.setProperty('--glass-rim', 'rgb(255 255 255 / 15%)');
    document.documentElement.style.setProperty('--glass-shadow', 'rgb(0 0 0 / 35%)');
    document.body.style.background = '#0f172a';
    document.body.style.color = '#f1f5f9';
    if(btnTheme) btnTheme.textContent = '☀';
    if(btnTheme) btnTheme.setAttribute('aria-label','Chế độ sáng');
  }else{
    document.documentElement.style.setProperty('--glass-fill', 'rgb(255 255 255 / 10%)');
    document.documentElement.style.setProperty('--glass-rim', 'rgb(255 255 255 / 25%)');
    document.documentElement.style.setProperty('--glass-shadow', 'rgb(0 0 0 / 15%)');
    document.body.style.background = '#f8fafc';
    document.body.style.color = '#0f172a';
    if(btnTheme) btnTheme.textContent = '◐';
    if(btnTheme) btnTheme.setAttribute('aria-label','Chế độ tối');
  }
}
applyTheme(isDark);
if(btnTheme){
  btnTheme.addEventListener('click', ()=> applyTheme(!isDark));
}

// ---------- Sheet (dialog) ----------
const sheet = $('#infoSheet');
const btnSheet = $('#btnSheet');
const btnCloseSheet = $('#btnCloseSheet');
const btnOpenSheet = $('#btnOpenSheet');

function openSheet(){
  if(!sheet) return;
  if(typeof sheet.showModal === 'function') sheet.showModal();
  else sheet.setAttribute('open','');
  document.body.style.overflow = 'hidden';
}
function closeSheet(){
  if(!sheet) return;
  if(typeof sheet.close === 'function') try{ sheet.close(); }catch{ sheet.removeAttribute('open'); }
  else sheet.removeAttribute('open');
  document.body.style.overflow = '';
}
if(btnSheet) btnSheet.addEventListener('click', openSheet);
if(btnOpenSheet) btnOpenSheet.addEventListener('click', openSheet);
if(btnCloseSheet) btnCloseSheet.addEventListener('click', closeSheet);
if(sheet){
  sheet.addEventListener('click', (e)=>{
    const rect = sheet.getBoundingClientRect();
    if(e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right){
      closeSheet();
    }
  });
  sheet.addEventListener('close', ()=> document.body.style.overflow = '');
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && sheet.hasAttribute('open')) closeSheet();
  });
}

// ---------- Tab bar auto-hide ----------
const tabBar = $('#tabBar');
let lastY = 0;
let ticking = false;
window.addEventListener('scroll', ()=>{
  if(ticking) return;
  ticking = true;
  requestAnimationFrame(()=>{
    const y = window.scrollY;
    if(tabBar){
      if(y > lastY && y > 120) tabBar.classList.add('minimized');
      else tabBar.classList.remove('minimized');
    }
    lastY = y;
    ticking = false;
  });
}, { passive:true });

// ---------- Copy helpers ----------
const tokensCSS = `:root {
  --glass-blur: 12px;
  --glass-saturate: 180%;
  --glass-fill: rgb(255 255 255 / 10%);
  --glass-rim: rgb(255 255 255 / 25%);
  --glass-highlight: rgb(255 255 255 / 40%);
  --glass-shadow: rgb(0 0 0 / 15%);
  --glass-radius: 999px;
  --glass-tint: transparent;
  --rainbow: conic-gradient(from var(--angle, 0deg), #ff3b30, #ff9500, #ffcc02, #34c759, #007aff, #af52de, #ff3b30);
  --border-w: 2px;
  --radius: 16px;
}`;

function getCodeText(id){
  const el = document.getElementById(id);
  return el ? el.textContent.trim() : '';
}

// data-copy-target buttons
$$('[data-copy-target]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-copy-target');
    const text = getCodeText(id);
    if(text) copyText(text);
  });
});

// data-copy (shorthand)
const copyMap = {
  'glass-base': 'code-glass-base',
  'rainbow-animated': 'code-rainbow-animated',
  'combo': 'code-combo',
};
$$('[data-copy]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const key = btn.getAttribute('data-copy');
    const id = copyMap[key];
    if(id){
      const text = getCodeText(id);
      if(text) copyText(text);
    } else if(key === 'tokens'){
      copyText(tokensCSS);
    }
  });
});

$('#btnCopyTokens')?.addEventListener('click', ()=> copyText(tokensCSS));
$('#btnCopySheet')?.addEventListener('click', ()=> copyText(tokensCSS));
$('#btnHeroPrimary')?.addEventListener('click', ()=> copyText(tokensCSS));

// ---------- Playground ----------
const playCard = $('#playCard');
const rangeBlur = $('#rangeBlur');
const rangeSat = $('#rangeSat');
const rangeBorder = $('#rangeBorder');
const rangeSpeed = $('#rangeSpeed');
const inputTint = $('#inputTint');
const rangeTintA = $('#rangeTintA');
const checkAnimate = $('#checkAnimate');
const checkGlass = $('#checkGlass');
const valBlur = $('#valBlur');
const valSat = $('#valSat');
const valBorder = $('#valBorder');
const valSpeed = $('#valSpeed');
const codePlay = $('#codePlay');
const btnCopyPlay = $('#btnCopyPlay');
const btnReset = $('#btnReset');

function hexToRgb(hex){
  const h = hex.replace('#','');
  const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const n = parseInt(full, 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function updatePlayground(){
  if(!playCard) return;
  const blur = rangeBlur ? rangeBlur.value : 12;
  const sat = rangeSat ? rangeSat.value : 180;
  const border = rangeBorder ? rangeBorder.value : 2;
  const speed = rangeSpeed ? rangeSpeed.value : 3;
  const tintHex = inputTint ? inputTint.value : '#6366f1';
  const tintA = rangeTintA ? rangeTintA.value : 0;
  const animate = checkAnimate ? checkAnimate.checked : true;
  const glass = checkGlass ? checkGlass.checked : true;

  // update CSS variables on card
  playCard.style.setProperty('--glass-blur', blur + 'px');
  playCard.style.setProperty('--glass-saturate', sat + '%');
  playCard.style.setProperty('--border-w', border + 'px');
  playCard.style.setProperty('--angle-speed', speed + 's');
  // also update global for rainbow speed
  document.documentElement.style.setProperty('--angle-speed', speed + 's');
  document.documentElement.style.setProperty('--border-w', border + 'px');

  // tint
  if(tintA > 0){
    const {r,g,b} = hexToRgb(tintHex);
    const alpha = (tintA/100).toFixed(2);
    playCard.style.setProperty('--glass-tint', `rgb(${r} ${g} ${b} / ${alpha})`);
  } else {
    playCard.style.setProperty('--glass-tint', 'transparent');
  }

  // glass vs rainbow only
  playCard.className = '';
  if(glass){
    playCard.classList.add('glass-rainbow');
    if(animate) playCard.classList.add('animated');
  } else {
    playCard.classList.add(animate ? 'rainbow-animated' : 'rainbow-border');
    playCard.style.background = 'white';
    playCard.style.color = '#0f172a';
    // need to ensure rainbow border visible
    if(!animate){
      // static
    }
  }
  if(glass){
    playCard.style.background = '';
    playCard.style.color = '';
  }

  // update labels
  if(valBlur) valBlur.textContent = blur + 'px';
  if(valSat) valSat.textContent = sat + '%';
  if(valBorder) valBorder.textContent = border + 'px';
  if(valSpeed) valSpeed.textContent = speed + 's';

  // update code preview
  if(codePlay){
    const tintStr = tintA > 0 ? `  --glass-tint: rgb(${hexToRgb(tintHex).r} ${hexToRgb(tintHex).g} ${hexToRgb(tintHex).b} / ${(tintA/100).toFixed(2)});\n` : '';
    codePlay.textContent = `:root {
  --glass-blur: ${blur}px;
  --glass-saturate: ${sat}%;
  --border-w: ${border}px;
  --angle-speed: ${speed}s;
${tintStr}}${glass ? '\n/* .glass-rainbow' + (animate ? '.animated' : '') + ' */' : '\n/* .rainbow-' + (animate ? 'animated' : 'border') + ' */'}`;
  }
}

[rangeBlur, rangeSat, rangeBorder, rangeSpeed, inputTint, rangeTintA, checkAnimate, checkGlass].forEach(el=>{
  if(el) el.addEventListener('input', updatePlayground);
  if(el && el.type === 'checkbox') el.addEventListener('change', updatePlayground);
});

if(btnCopyPlay){
  btnCopyPlay.addEventListener('click', ()=>{
    const text = codePlay ? codePlay.textContent : '';
    if(text) copyText(text);
  });
}

if(btnReset){
  btnReset.addEventListener('click', ()=>{
    if(rangeBlur) rangeBlur.value = 12;
    if(rangeSat) rangeSat.value = 180;
    if(rangeBorder) rangeBorder.value = 2;
    if(rangeSpeed) rangeSpeed.value = 3;
    if(inputTint) inputTint.value = '#6366f1';
    if(rangeTintA) rangeTintA.value = 0;
    if(checkAnimate) checkAnimate.checked = true;
    if(checkGlass) checkGlass.checked = true;
    updatePlayground();
    toast('Đã reset playground');
  });
}

// init
updatePlayground();

// ---------- Smooth scroll offset for fixed header ----------
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(!href || href === '#') return;
    const target = document.querySelector(href);
    if(target){
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior:'smooth' });
      history.pushState(null,'',href);
    }
  });
});

// ---------- Keyboard: / to focus playground ----------
document.addEventListener('keydown', (e)=>{
  if(e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT'){
    e.preventDefault();
    const el = $('#rangeBlur');
    if(el) el.focus();
  }
});
