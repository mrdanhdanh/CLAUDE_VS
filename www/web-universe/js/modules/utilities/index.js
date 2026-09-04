export const manifest = {
  id: 'utilities',
  name: 'Utilities',
  version: '1.0.0',
  category: 'utilities',
  description: 'Calculator, stopwatch, timer, clock, countdown, random, password, unit converter, text stats, color tools.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🧰',
};

let els = {};
let ctxRef = null;
let stopwatchInterval = null;
let stopwatchMs = 0;
let timerInterval = null;
let timerSec = 0;
let clockInterval = null;
let countdownInterval = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx){
  ctxRef=ctx;
  container.innerHTML=`
    <div class="utils-grid">
      <div class="utils-card">
        <h4>🧮 Calculator</h4>
        <input id="calcInput" placeholder="2+2*3" style="width:100%;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 13px var(--font-mono)" />
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">
          <button class="btn btn-ghost btn-xs" data-calc="7">7</button><button class="btn btn-ghost btn-xs" data-calc="8">8</button><button class="btn btn-ghost btn-xs" data-calc="9">9</button><button class="btn btn-ghost btn-xs" data-calc="/">/</button>
          <button class="btn btn-ghost btn-xs" data-calc="4">4</button><button class="btn btn-ghost btn-xs" data-calc="5">5</button><button class="btn btn-ghost btn-xs" data-calc="6">6</button><button class="btn btn-ghost btn-xs" data-calc="*">*</button>
          <button class="btn btn-ghost btn-xs" data-calc="1">1</button><button class="btn btn-ghost btn-xs" data-calc="2">2</button><button class="btn btn-ghost btn-xs" data-calc="3">3</button><button class="btn btn-ghost btn-xs" data-calc="-">-</button>
          <button class="btn btn-ghost btn-xs" data-calc="0">0</button><button class="btn btn-ghost btn-xs" data-calc=".">.</button><button class="btn btn-primary btn-xs" data-action="calc-eq">=</button><button class="btn btn-ghost btn-xs" data-calc="+">+</button>
          <button class="btn btn-ghost btn-xs" data-action="calc-clear" style="grid-column:span 2">Clear</button><button class="btn btn-ghost btn-xs" data-calc="(">(</button><button class="btn btn-ghost btn-xs" data-calc=")">)</button>
        </div>
        <div id="calcOut" style="margin-top:8px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:700 14px var(--font-mono);min-height:32px"></div>
      </div>

      <div class="utils-card">
        <h4>⏱ Stopwatch</h4>
        <div id="swDisplay" style="font:700 24px var(--font-mono);text-align:center;padding:12px;background:var(--surface-2);border-radius:8px">00:00.0</div>
        <div style="display:flex;gap:6px;margin-top:8px;justify-content:center">
          <button class="btn btn-primary btn-xs" data-action="sw-start">Start</button><button class="btn btn-ghost btn-xs" data-action="sw-stop">Stop</button><button class="btn btn-ghost btn-xs" data-action="sw-reset">Reset</button>
        </div>
      </div>

      <div class="utils-card">
        <h4>⏲ Timer</h4>
        <div style="display:flex;gap:6px">
          <input id="timerMin" type="number" placeholder="Min" value="1" min="0" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
          <input id="timerSec" type="number" placeholder="Sec" value="0" min="0" max="59" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        </div>
        <div id="timerDisplay" style="font:700 20px var(--font-mono);text-align:center;padding:8px;margin-top:8px;background:var(--surface-2);border-radius:8px">01:00</div>
        <div style="display:flex;gap:6px;margin-top:8px;justify-content:center">
          <button class="btn btn-primary btn-xs" data-action="timer-start">Start</button><button class="btn btn-ghost btn-xs" data-action="timer-stop">Stop</button><button class="btn btn-ghost btn-xs" data-action="timer-reset">Reset</button>
        </div>
      </div>

      <div class="utils-card">
        <h4>🕐 Clock</h4>
        <div id="clockDisplay" style="font:700 20px var(--font-mono);text-align:center;padding:12px;background:var(--surface-2);border-radius:8px"></div>
        <div class="muted small" id="clockDate" style="text-align:center;margin-top:4px"></div>
      </div>

      <div class="utils-card">
        <h4>⏳ Countdown</h4>
        <input id="countdownDate" type="datetime-local" style="width:100%;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)" />
        <div id="countdownOut" style="font:700 14px var(--font-mono);text-align:center;padding:8px;margin-top:8px;background:var(--surface-2);border-radius:8px">—</div>
      </div>

      <div class="utils-card">
        <h4>🎲 Random</h4>
        <div style="display:flex;gap:6px">
          <input id="randMin" type="number" placeholder="Min" value="1" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
          <input id="randMax" type="number" placeholder="Max" value="100" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
          <button class="btn btn-primary btn-xs" data-action="rand-gen">Generate</button>
        </div>
        <div id="randOut" style="font:700 18px var(--font-mono);text-align:center;padding:8px;margin-top:8px;background:var(--surface-2);border-radius:8px">—</div>
      </div>

      <div class="utils-card">
        <h4>🔑 Password</h4>
        <div style="display:flex;gap:6px;align-items:center">
          <label class="small">Len <input id="pwLen" type="number" value="12" min="4" max="32" style="width:60px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" /></label>
          <label class="toggle small"><input type="checkbox" id="pwNum" checked /> Numbers</label>
          <label class="toggle small"><input type="checkbox" id="pwSym" checked /> Symbols</label>
        </div>
        <button class="btn btn-primary btn-xs" data-action="pw-gen" style="margin-top:8px">Generate</button>
        <div id="pwOut" style="margin-top:8px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono);word-break:break-all;min-height:32px"></div>
      </div>

      <div class="utils-card">
        <h4>📏 Unit Converter</h4>
        <select id="unitType" style="width:100%;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-sans)">
          <option value="length">Length (m ↔ ft)</option><option value="weight">Weight (kg ↔ lb)</option><option value="temp">Temp (°C ↔ °F)</option>
        </select>
        <div style="display:flex;gap:6px;margin-top:6px">
          <input id="unitIn" type="number" placeholder="Value" value="1" style="flex:1;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
          <button class="btn btn-ghost btn-xs" data-action="unit-convert">Convert</button>
        </div>
        <div id="unitOut" style="margin-top:8px;padding:8px;background:var(--surface-2);border-radius:8px;font:500 11px var(--font-mono);min-height:32px"></div>
      </div>

      <div class="utils-card">
        <h4>📝 Text Stats</h4>
        <textarea id="textStatsIn" placeholder="Type text…" style="width:100%;min-height:60px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono)">Hello WEB UNIVERSE — this is a sample text for statistics.</textarea>
        <div id="textStatsOut" style="margin-top:8px;padding:8px;background:var(--surface-2);border-radius:8px;font:400 11px var(--font-mono);line-height:1.6"></div>
      </div>

      <div class="utils-card">
        <h4>🎨 Color Tools</h4>
        <input type="color" id="colorPick" value="#6366f1" style="width:100%;height:40px;padding:2px" />
        <div id="colorOut" style="margin-top:8px;padding:8px;background:var(--surface-2);border-radius:8px;font:400 11px var(--font-mono)"></div>
        <div id="colorPreview" style="margin-top:8px;height:32px;border-radius:8px;border:1px solid var(--border);background:#6366f1"></div>
      </div>
    </div>
  `;
  els={
    calcInput: container.querySelector('#calcInput'),
    calcOut: container.querySelector('#calcOut'),
    swDisplay: container.querySelector('#swDisplay'),
    timerMin: container.querySelector('#timerMin'),
    timerSec: container.querySelector('#timerSec'),
    timerDisplay: container.querySelector('#timerDisplay'),
    clockDisplay: container.querySelector('#clockDisplay'),
    clockDate: container.querySelector('#clockDate'),
    countdownDate: container.querySelector('#countdownDate'),
    countdownOut: container.querySelector('#countdownOut'),
    randMin: container.querySelector('#randMin'),
    randMax: container.querySelector('#randMax'),
    randOut: container.querySelector('#randOut'),
    pwLen: container.querySelector('#pwLen'),
    pwNum: container.querySelector('#pwNum'),
    pwSym: container.querySelector('#pwSym'),
    pwOut: container.querySelector('#pwOut'),
    unitType: container.querySelector('#unitType'),
    unitIn: container.querySelector('#unitIn'),
    unitOut: container.querySelector('#unitOut'),
    textIn: container.querySelector('#textStatsIn'),
    textOut: container.querySelector('#textStatsOut'),
    colorPick: container.querySelector('#colorPick'),
    colorOut: container.querySelector('#colorOut'),
    colorPreview: container.querySelector('#colorPreview'),
  };
  // Calculator
  container.querySelectorAll('[data-calc]').forEach(btn=>{
    btn.addEventListener('click',()=>{ els.calcInput.value+=btn.dataset.calc; });
  });
  function calcEval(){
    const expr=els.calcInput.value.trim();
    if(!expr) return;
    try{
      // sanitize: only allow numbers, operators, parens, dot, spaces
      if(!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Invalid chars');
      const res=Function('"use strict"; return ('+expr+')')();
      els.calcOut.textContent=String(res);
      els.calcOut.style.color='var(--success)';
    }catch(e){ els.calcOut.textContent='Error: '+e.message; els.calcOut.style.color='var(--danger)'; }
  }
  container.querySelector('[data-action="calc-eq"]')?.addEventListener('click', calcEval);
  els.calcInput.addEventListener('keydown',e=>{ if(e.key==='Enter') calcEval(); });
  container.querySelector('[data-action="calc-clear"]')?.addEventListener('click',()=>{ els.calcInput.value=''; els.calcOut.textContent=''; });

  // Stopwatch
  function fmtSw(ms){
    const totalSec=Math.floor(ms/1000);
    const min=Math.floor(totalSec/60).toString().padStart(2,'0');
    const sec=(totalSec%60).toString().padStart(2,'0');
    const tenth=Math.floor((ms%1000)/100);
    return `${min}:${sec}.${tenth}`;
  }
  container.querySelector('[data-action="sw-start"]')?.addEventListener('click',()=>{
    if(stopwatchInterval) return;
    const start=Date.now()-stopwatchMs;
    stopwatchInterval=setInterval(()=>{
      stopwatchMs=Date.now()-start;
      els.swDisplay.textContent=fmtSw(stopwatchMs);
    },100);
  });
  container.querySelector('[data-action="sw-stop"]')?.addEventListener('click',()=>{
    if(stopwatchInterval) clearInterval(stopwatchInterval);
    stopwatchInterval=null;
  });
  container.querySelector('[data-action="sw-reset"]')?.addEventListener('click',()=>{
    if(stopwatchInterval) clearInterval(stopwatchInterval);
    stopwatchInterval=null; stopwatchMs=0; els.swDisplay.textContent='00:00.0';
  });

  // Timer
  function fmtTimer(s){
    const m=Math.floor(s/60).toString().padStart(2,'0');
    const sec=(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }
  function updateTimerDisplay(){ els.timerDisplay.textContent=fmtTimer(timerSec); }
  container.querySelector('[data-action="timer-start"]')?.addEventListener('click',()=>{
    if(timerInterval) return;
    const min=parseInt(els.timerMin.value,10)||0;
    const sec=parseInt(els.timerSec.value,10)||0;
    if(timerSec===0) timerSec=min*60+sec;
    if(timerSec<=0) return;
    updateTimerDisplay();
    timerInterval=setInterval(()=>{
      timerSec--;
      updateTimerDisplay();
      if(timerSec<=0){
        clearInterval(timerInterval); timerInterval=null;
        els.timerDisplay.textContent='Done! ✓';
        els.timerDisplay.style.color='var(--success)';
        setTimeout(()=>{ els.timerDisplay.style.color=''; },2000);
      }
    },1000);
  });
  container.querySelector('[data-action="timer-stop"]')?.addEventListener('click',()=>{
    if(timerInterval) clearInterval(timerInterval);
    timerInterval=null;
  });
  container.querySelector('[data-action="timer-reset"]')?.addEventListener('click',()=>{
    if(timerInterval) clearInterval(timerInterval);
    timerInterval=null; timerSec=0;
    const min=parseInt(els.timerMin.value,10)||0;
    const sec=parseInt(els.timerSec.value,10)||0;
    timerSec=min*60+sec;
    updateTimerDisplay();
  });
  updateTimerDisplay();

  // Clock
  function updateClock(){
    const now=new Date();
    els.clockDisplay.textContent=now.toLocaleTimeString('vi-VN',{hour12:false});
    els.clockDate.textContent=now.toLocaleDateString('vi-VN',{weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }
  updateClock();
  clockInterval=setInterval(updateClock,1000);
  els._clockInterval=clockInterval;

  // Countdown
  function updateCountdown(){
    const val=els.countdownDate.value;
    if(!val){ els.countdownOut.textContent='—'; return; }
    const target=new Date(val).getTime();
    const diff=target-Date.now();
    if(diff<=0){ els.countdownOut.textContent='Time is up! ✓'; return; }
    const d=Math.floor(diff/86400000), h=Math.floor(diff%86400000/3600000), m=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000);
    els.countdownOut.textContent=`${d}d ${h}h ${m}m ${s}s`;
  }
  els.countdownDate.addEventListener('change',()=>{
    if(countdownInterval) clearInterval(countdownInterval);
    updateCountdown();
    countdownInterval=setInterval(updateCountdown,1000);
    els._countdownInterval=countdownInterval;
  });

  // Random
  container.querySelector('[data-action="rand-gen"]')?.addEventListener('click',()=>{
    const min=parseInt(els.randMin.value,10)||0;
    const max=parseInt(els.randMax.value,10)||100;
    const val=Math.floor(Math.random()*(max-min+1))+min;
    els.randOut.textContent=String(val);
  });

  // Password
  container.querySelector('[data-action="pw-gen"]')?.addEventListener('click',()=>{
    const len=parseInt(els.pwLen.value,10)||12;
    const useNum=els.pwNum.checked, useSym=els.pwSym.checked;
    let chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(useNum) chars+='0123456789';
    if(useSym) chars+='!@#$%^&*';
    let pw='';
    const arr=new Uint32Array(len);
    crypto.getRandomValues(arr);
    for(let i=0;i<len;i++) pw+=chars[arr[i]%chars.length];
    els.pwOut.textContent=pw;
  });

  // Unit converter
  container.querySelector('[data-action="unit-convert"]')?.addEventListener('click',()=>{
    const type=els.unitType.value;
    const val=parseFloat(els.unitIn.value);
    if(isNaN(val)){ els.unitOut.textContent='Invalid number'; return; }
    let out='';
    if(type==='length') out=`${val} m = ${(val*3.28084).toFixed(2)} ft\n${val} ft = ${(val/3.28084).toFixed(2)} m`;
    else if(type==='weight') out=`${val} kg = ${(val*2.20462).toFixed(2)} lb\n${val} lb = ${(val/2.20462).toFixed(2)} kg`;
    else if(type==='temp') out=`${val}°C = ${(val*9/5+32).toFixed(1)}°F\n${val}°F = ${((val-32)*5/9).toFixed(1)}°C`;
    els.unitOut.textContent=out;
  });

  // Text stats
  function updateTextStats(){
    const text=els.textIn.value;
    const words=text.trim()?text.trim().split(/\s+/).length:0;
    const chars=text.length;
    const lines=text?text.split('\n').length:0;
    const reading=Math.ceil(words/200);
    els.textOut.innerHTML=`Words: <b>${words}</b> · Chars: <b>${chars}</b> · Lines: <b>${lines}</b> · Reading: <b>${reading} min</b>`;
  }
  els.textIn.addEventListener('input', updateTextStats);
  updateTextStats();

  // Color
  function updateColor(){
    const hex=els.colorPick.value;
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    els.colorOut.textContent=`HEX: ${hex}\nRGB: rgb(${r},${g},${b})\nHSL: hsl(${Math.round((r/255)*360)}, ${Math.round((g/255)*100)}%, ${Math.round((b/255)*100)}%)`;
    els.colorPreview.style.background=hex;
  }
  els.colorPick.addEventListener('input', updateColor);
  updateColor();

  ctxRef?.logger?.info('utilities: mounted');
}

export async function unmount(){
  if(stopwatchInterval) clearInterval(stopwatchInterval);
  if(timerInterval) clearInterval(timerInterval);
  if(els._clockInterval) clearInterval(els._clockInterval);
  if(els._countdownInterval) clearInterval(els._countdownInterval);
  stopwatchInterval=null; timerInterval=null; clockInterval=null; countdownInterval=null;
  els={}; ctxRef=null;
}
export async function destroy(){ await unmount(); }
