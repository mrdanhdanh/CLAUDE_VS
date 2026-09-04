export const manifest = {
  id: 'devtools',
  name: 'DevTools',
  version: '1.0.0',
  category: 'devtools',
  description: 'JSON, base64, URL, timestamp, UUID, color, regex, text, hash, query, CSV, base converter.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🛠️',
};

let els = {};
let ctxRef = null;

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export async function mount(container, ctx){
  ctxRef=ctx;
  container.innerHTML=`
    <div class="devtools-tabs" role="tablist" aria-label="DevTools">
      <button class="devtools-tab active" data-tab="json">JSON</button>
      <button class="devtools-tab" data-tab="base64">Base64</button>
      <button class="devtools-tab" data-tab="url">URL</button>
      <button class="devtools-tab" data-tab="time">Time</button>
      <button class="devtools-tab" data-tab="uuid">UUID</button>
      <button class="devtools-tab" data-tab="color">Color</button>
      <button class="devtools-tab" data-tab="regex">Regex</button>
      <button class="devtools-tab" data-tab="text">Text</button>
      <button class="devtools-tab" data-tab="hash">Hash</button>
      <button class="devtools-tab" data-tab="query">Query</button>
      <button class="devtools-tab" data-tab="csv">CSV</button>
      <button class="devtools-tab" data-tab="base">Base</button>
    </div>

    <div class="devtools-pane active" data-pane="json">
      <textarea id="dtJsonIn" placeholder='{"hello":"world"}' style="width:100%;min-height:100px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)"></textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="json-format">Format</button><button class="btn btn-ghost btn-xs" data-action="json-min">Minify</button><button class="btn btn-ghost btn-xs" data-action="json-validate">Validate</button></div>
      <pre id="dtJsonOut" style="margin-top:8px;max-height:160px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="base64">
      <textarea id="dtB64In" placeholder="Hello world" style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)"></textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="b64-enc">Encode</button><button class="btn btn-ghost btn-xs" data-action="b64-dec">Decode</button></div>
      <pre id="dtB64Out" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="devtools-pane" data-pane="url">
      <textarea id="dtUrlIn" placeholder="https://example.com/?q=hello world" style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)"></textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="url-enc">Encode</button><button class="btn btn-ghost btn-xs" data-action="url-dec">Decode</button><button class="btn btn-ghost btn-xs" data-action="url-comp-enc">Encode Component</button><button class="btn btn-ghost btn-xs" data-action="url-comp-dec">Decode Component</button></div>
      <pre id="dtUrlOut" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="devtools-pane" data-pane="time">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary btn-xs" data-action="time-now">Now</button>
        <input id="dtTimeIn" placeholder="1700000000000 or 2024-01-01" style="flex:1;min-width:160px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <button class="btn btn-ghost btn-xs" data-action="time-parse">Parse</button>
      </div>
      <pre id="dtTimeOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="uuid">
      <button class="btn btn-primary btn-sm" data-action="uuid-gen">Generate UUID</button>
      <button class="btn btn-ghost btn-sm" data-action="uuid-bulk">Generate 5</button>
      <pre id="dtUuidOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="color">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input type="color" id="dtColorPick" value="#6366f1" style="width:48px;height:36px;padding:2px" />
        <input id="dtColorIn" placeholder="#6366f1 or rgb(99,102,241)" value="#6366f1" style="flex:1;min-width:160px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <button class="btn btn-ghost btn-xs" data-action="color-convert">Convert</button>
      </div>
      <pre id="dtColorOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
      <div id="dtColorPreview" style="margin-top:8px;height:40px;border-radius:8px;border:1px solid var(--border);background:#6366f1"></div>
    </div>
    <div class="devtools-pane" data-pane="regex">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="dtRegexPat" placeholder="Pattern e.g. \\d+" style="flex:2;min-width:160px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <input id="dtRegexFlags" placeholder="Flags g,i,m" value="g" style="width:80px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
      </div>
      <textarea id="dtRegexText" placeholder="Test text: abc 123 def 456" style="width:100%;min-height:60px;margin-top:6px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;font:400 11px var(--font-mono)">abc 123 def 456 hello 789</textarea>
      <button class="btn btn-primary btn-xs" data-action="regex-test" style="margin-top:6px">Test</button>
      <pre id="dtRegexOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="text">
      <textarea id="dtTextIn" placeholder="Hello World" style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)">Hello World</textarea>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        <button class="btn btn-ghost btn-xs" data-action="text-upper">UPPER</button><button class="btn btn-ghost btn-xs" data-action="text-lower">lower</button><button class="btn btn-ghost btn-xs" data-action="text-camel">camelCase</button><button class="btn btn-ghost btn-xs" data-action="text-snake">snake_case</button><button class="btn btn-ghost btn-xs" data-action="text-kebab">kebab-case</button><button class="btn btn-ghost btn-xs" data-action="text-reverse">Reverse</button>
      </div>
      <pre id="dtTextOut" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="hash">
      <textarea id="dtHashIn" placeholder="Text to hash" style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)">hello</textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="hash-sha256">SHA-256</button><button class="btn btn-ghost btn-xs" data-action="hash-sha1">SHA-1</button></div>
      <pre id="dtHashOut" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="devtools-pane" data-pane="query">
      <textarea id="dtQueryIn" placeholder="https://example.com/?a=1&b=hello%20world" style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)">https://example.com/?a=1&b=hello%20world&c=3</textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="query-parse">Parse</button><button class="btn btn-ghost btn-xs" data-action="query-stringify">Stringify</button></div>
      <pre id="dtQueryOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="csv">
      <textarea id="dtCsvIn" placeholder='a,b,c&#10;1,2,3' style="width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;font:400 11px var(--font-mono)">a,b,c
1,2,3
4,5,6</textarea>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="btn btn-primary btn-xs" data-action="csv-to-json">CSV → JSON</button><button class="btn btn-ghost btn-xs" data-action="json-to-csv">JSON → CSV</button></div>
      <pre id="dtCsvOut" style="margin-top:8px;max-height:160px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
    <div class="devtools-pane" data-pane="base">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="dtBaseIn" placeholder="255" value="255" style="flex:1;min-width:120px;height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)" />
        <select id="dtBaseFrom" style="height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)"><option value="10">Dec</option><option value="16">Hex</option><option value="2">Bin</option><option value="8">Oct</option></select>
        <span style="align-self:center">→</span>
        <select id="dtBaseTo" style="height:32px;padding:0 8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font:500 11px var(--font-mono)"><option value="16">Hex</option><option value="10">Dec</option><option value="2">Bin</option><option value="8">Oct</option></select>
        <button class="btn btn-primary btn-xs" data-action="base-convert">Convert</button>
      </div>
      <pre id="dtBaseOut" style="margin-top:8px;max-height:120px;overflow:auto;background:var(--surface-2);padding:10px;border-radius:8px;font:400 11px var(--font-mono);white-space:pre-wrap"></pre>
    </div>
  `;
  // Tabs
  container.querySelectorAll('.devtools-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab=btn.dataset.tab;
      container.querySelectorAll('.devtools-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
      container.querySelectorAll('.devtools-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab));
    });
  });
  // JSON
  container.querySelector('[data-action="json-format"]')?.addEventListener('click',()=>{
    try{ const obj=JSON.parse(container.querySelector('#dtJsonIn').value); container.querySelector('#dtJsonOut').textContent=JSON.stringify(obj,null,2); }catch(e){ container.querySelector('#dtJsonOut').textContent='Error: '+e.message; }
  });
  container.querySelector('[data-action="json-min"]')?.addEventListener('click',()=>{
    try{ const obj=JSON.parse(container.querySelector('#dtJsonIn').value); container.querySelector('#dtJsonOut').textContent=JSON.stringify(obj); }catch(e){ container.querySelector('#dtJsonOut').textContent='Error: '+e.message; }
  });
  container.querySelector('[data-action="json-validate"]')?.addEventListener('click',()=>{
    try{ JSON.parse(container.querySelector('#dtJsonIn').value); container.querySelector('#dtJsonOut').textContent='✓ Valid JSON'; container.querySelector('#dtJsonOut').style.color='var(--success)'; }catch(e){ container.querySelector('#dtJsonOut').textContent='✗ Invalid: '+e.message; container.querySelector('#dtJsonOut').style.color='var(--danger)'; }
  });
  // Base64
  container.querySelector('[data-action="b64-enc"]')?.addEventListener('click',()=>{
    try{ container.querySelector('#dtB64Out').textContent=btoa(unescape(encodeURIComponent(container.querySelector('#dtB64In').value))); }catch(e){ container.querySelector('#dtB64Out').textContent='Error: '+e.message; }
  });
  container.querySelector('[data-action="b64-dec"]')?.addEventListener('click',()=>{
    try{ container.querySelector('#dtB64Out').textContent=decodeURIComponent(escape(atob(container.querySelector('#dtB64In').value))); }catch(e){ container.querySelector('#dtB64Out').textContent='Error: '+e.message; }
  });
  // URL
  container.querySelector('[data-action="url-enc"]')?.addEventListener('click',()=>{ container.querySelector('#dtUrlOut').textContent=encodeURI(container.querySelector('#dtUrlIn').value); });
  container.querySelector('[data-action="url-dec"]')?.addEventListener('click',()=>{ try{ container.querySelector('#dtUrlOut').textContent=decodeURI(container.querySelector('#dtUrlIn').value); }catch(e){ container.querySelector('#dtUrlOut').textContent='Error: '+e.message; } });
  container.querySelector('[data-action="url-comp-enc"]')?.addEventListener('click',()=>{ container.querySelector('#dtUrlOut').textContent=encodeURIComponent(container.querySelector('#dtUrlIn').value); });
  container.querySelector('[data-action="url-comp-dec"]')?.addEventListener('click',()=>{ try{ container.querySelector('#dtUrlOut').textContent=decodeURIComponent(container.querySelector('#dtUrlIn').value); }catch(e){ container.querySelector('#dtUrlOut').textContent='Error: '+e.message; } });
  // Time
  container.querySelector('[data-action="time-now"]')?.addEventListener('click',()=>{
    const now=Date.now();
    container.querySelector('#dtTimeOut').textContent=`Now: ${now}\nISO: ${new Date(now).toISOString()}\nLocale: ${new Date(now).toLocaleString()}\nUTC: ${new Date(now).toUTCString()}`;
  });
  container.querySelector('[data-action="time-parse"]')?.addEventListener('click',()=>{
    const val=container.querySelector('#dtTimeIn').value.trim();
    if(!val) return;
    let d;
    if(/^\d+$/.test(val)) d=new Date(parseInt(val,10));
    else d=new Date(val);
    if(isNaN(d.getTime())) container.querySelector('#dtTimeOut').textContent='Invalid date';
    else container.querySelector('#dtTimeOut').textContent=`Timestamp: ${d.getTime()}\nISO: ${d.toISOString()}\nLocale: ${d.toLocaleString()}\nUTC: ${d.toUTCString()}\nRelative: ${Math.round((Date.now()-d.getTime())/1000)}s ago`;
  });
  // UUID
  container.querySelector('[data-action="uuid-gen"]')?.addEventListener('click',()=>{
    const uuid=crypto.randomUUID();
    container.querySelector('#dtUuidOut').textContent=uuid;
  });
  container.querySelector('[data-action="uuid-bulk"]')?.addEventListener('click',()=>{
    const uuids=Array.from({length:5},()=>crypto.randomUUID()).join('\n');
    container.querySelector('#dtUuidOut').textContent=uuids;
  });
  // Color
  function hexToRgb(hex){
    const m=hex.replace('#','');
    const r=parseInt(m.slice(0,2),16), g=parseInt(m.slice(2,4),16), b=parseInt(m.slice(4,6),16);
    return {r,g,b};
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; } else {
      const d=max-min;
      s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){ case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; }
      h/=6;
    }
    return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
  }
  container.querySelector('[data-action="color-convert"]')?.addEventListener('click',()=>{
    const val=container.querySelector('#dtColorIn').value.trim();
    let r,g,b;
    if(val.startsWith('#')){
      const rgb=hexToRgb(val);
      r=rgb.r; g=rgb.g; b=rgb.b;
    } else if(val.startsWith('rgb')){
      const m=val.match(/\d+/g);
      if(m){ r=parseInt(m[0]); g=parseInt(m[1]); b=parseInt(m[2]); }
    }
    if(r===undefined){ container.querySelector('#dtColorOut').textContent='Invalid color'; return; }
    const hsl=rgbToHsl(r,g,b);
    const hex='#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
    container.querySelector('#dtColorOut').textContent=`HEX: ${hex}\nRGB: rgb(${r},${g},${b})\nHSL: hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`;
    container.querySelector('#dtColorPreview').style.background=hex;
  });
  container.querySelector('#dtColorPick')?.addEventListener('input',(e)=>{
    container.querySelector('#dtColorIn').value=e.target.value;
    container.querySelector('#dtColorPreview').style.background=e.target.value;
  });
  // Regex
  container.querySelector('[data-action="regex-test"]')?.addEventListener('click',()=>{
    const pat=container.querySelector('#dtRegexPat').value;
    const flags=container.querySelector('#dtRegexFlags').value;
    const text=container.querySelector('#dtRegexText').value;
    try{
      const re=new RegExp(pat, flags);
      const matches=[...text.matchAll(re)];
      if(matches.length===0) container.querySelector('#dtRegexOut').textContent='No matches';
      else container.querySelector('#dtRegexOut').textContent=matches.map((m,i)=>`Match ${i+1}: \"${m[0]}\" at ${m.index} — groups: ${JSON.stringify(m.slice(1))}`).join('\n');
    }catch(e){ container.querySelector('#dtRegexOut').textContent='Error: '+e.message; }
  });
  // Text
  const textIn=()=> container.querySelector('#dtTextIn').value;
  const textOut=container.querySelector('#dtTextOut');
  container.querySelector('[data-action="text-upper"]')?.addEventListener('click',()=> textOut.textContent=textIn().toUpperCase());
  container.querySelector('[data-action="text-lower"]')?.addEventListener('click',()=> textOut.textContent=textIn().toLowerCase());
  container.querySelector('[data-action="text-camel"]')?.addEventListener('click',()=> textOut.textContent=textIn().replace(/[-_\s]+(.)?/g,(_,c)=>c?c.toUpperCase():'').replace(/^(.)/,c=>c.toLowerCase()));
  container.querySelector('[data-action="text-snake"]')?.addEventListener('click',()=> textOut.textContent=textIn().replace(/([A-Z])/g,'_$1').replace(/[-\s]+/g,'_').toLowerCase().replace(/^_/,'')); 
  container.querySelector('[data-action="text-kebab"]')?.addEventListener('click',()=> textOut.textContent=textIn().replace(/([A-Z])/g,'-$1').replace(/[_\s]+/g,'-').toLowerCase().replace(/^-/,''));
  container.querySelector('[data-action="text-reverse"]')?.addEventListener('click',()=> textOut.textContent=textIn().split('').reverse().join(''));
  // Hash
  async function hashAlgo(algo){
    const text=container.querySelector('#dtHashIn').value;
    try{
      const buf=await crypto.subtle.digest(algo, new TextEncoder().encode(text));
      const hex=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
      container.querySelector('#dtHashOut').textContent=`${algo}: ${hex}`;
    }catch(e){ container.querySelector('#dtHashOut').textContent='Error: '+e.message; }
  }
  container.querySelector('[data-action="hash-sha256"]')?.addEventListener('click',()=> hashAlgo('SHA-256'));
  container.querySelector('[data-action="hash-sha1"]')?.addEventListener('click',()=> hashAlgo('SHA-1'));
  // Query
  container.querySelector('[data-action="query-parse"]')?.addEventListener('click',()=>{
    const url=container.querySelector('#dtQueryIn').value;
    try{
      const u=new URL(url);
      const params={};
      u.searchParams.forEach((v,k)=> params[k]=v);
      container.querySelector('#dtQueryOut').textContent=JSON.stringify({origin:u.origin, pathname:u.pathname, params},null,2);
    }catch(e){ container.querySelector('#dtQueryOut').textContent='Error: '+e.message; }
  });
  container.querySelector('[data-action="query-stringify"]')?.addEventListener('click',()=>{
    try{
      const obj=JSON.parse(container.querySelector('#dtQueryIn').value);
      const sp=new URLSearchParams(obj).toString();
      container.querySelector('#dtQueryOut').textContent=sp;
    }catch(e){ container.querySelector('#dtQueryOut').textContent='Error: '+e.message+' (enter JSON object)'; }
  });
  // CSV
  container.querySelector('[data-action="csv-to-json"]')?.addEventListener('click',()=>{
    const text=container.querySelector('#dtCsvIn').value;
    try{
      const lines=text.trim().split('\n');
      const headers=lines[0].split(',').map(h=>h.trim());
      const rows=lines.slice(1).map(l=>{
        const vals=l.split(',').map(v=>v.trim());
        const obj={}; headers.forEach((h,i)=> obj[h]=vals[i]??''); return obj;
      });
      container.querySelector('#dtCsvOut').textContent=JSON.stringify(rows,null,2);
    }catch(e){ container.querySelector('#dtCsvOut').textContent='Error: '+e.message; }
  });
  container.querySelector('[data-action="json-to-csv"]')?.addEventListener('click',()=>{
    try{
      const arr=JSON.parse(container.querySelector('#dtCsvIn').value);
      if(!Array.isArray(arr)) throw new Error('Not an array');
      const cols=Object.keys(arr[0]||{});
      const csv=[cols.join(',')].concat(arr.map(r=> cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))).join('\n');
      container.querySelector('#dtCsvOut').textContent=csv;
    }catch(e){ container.querySelector('#dtCsvOut').textContent='Error: '+e.message; }
  });
  // Base converter
  container.querySelector('[data-action="base-convert"]')?.addEventListener('click',()=>{
    const val=container.querySelector('#dtBaseIn').value.trim();
    const from=parseInt(container.querySelector('#dtBaseFrom').value,10);
    const to=parseInt(container.querySelector('#dtBaseTo').value,10);
    try{
      const num=parseInt(val, from);
      if(isNaN(num)) throw new Error('Invalid number for base '+from);
      container.querySelector('#dtBaseOut').textContent=`${val} (base ${from}) = ${num.toString(to)} (base ${to})\nDec: ${num}\nHex: ${num.toString(16)}\nBin: ${num.toString(2)}\nOct: ${num.toString(8)}`;
    }catch(e){ container.querySelector('#dtBaseOut').textContent='Error: '+e.message; }
  });

  ctxRef?.logger?.info('devtools: mounted');
}

export async function unmount(){ els={}; ctxRef=null; }
export async function destroy(){ await unmount(); }
