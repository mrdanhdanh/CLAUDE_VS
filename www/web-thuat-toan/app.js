/**
 * 10 Thuật Toán Nâng Cao — Visualizer v2
 * Kadane, TopK, Rotated, QuickSort, Bounds, Container, Substring, NGE, Dijkstra, Knapsack
 */
(function(){
'use strict';

// Navigation
var nav=document.getElementById('nav');
var sections=document.querySelectorAll('.bai-section');
function switchBai(id){
  nav.querySelectorAll('.nav-item').forEach(function(b){
    if(b.getAttribute('data-bai')===id){b.classList.add('active');b.setAttribute('aria-current','page');}
    else{b.classList.remove('active');b.removeAttribute('aria-current');}
  });
  sections.forEach(function(s){ s.hidden = s.id !== 'bai-'+id; });
}
nav.addEventListener('click',function(e){
  var b=e.target.closest('.nav-item'); if(!b) return;
  switchBai(b.getAttribute('data-bai'));
});

// Shared utils
function parseNumbers(raw){
  if(!raw||!raw.trim()) return {valid:false,numbers:[],error:'Vui lòng nhập dãy số.'};
  var parts=raw.split(',').map(function(s){return s.trim();});
  var nums=[];
  for(var i=0;i<parts.length;i++){
    if(parts[i]==='') return {valid:false,numbers:[],error:'Có ô trống giữa các số — kiểm tra dấu phẩy.'};
    var n=Number(parts[i]); if(isNaN(n)||!isFinite(n)) return {valid:false,numbers:[],error:'"'+parts[i]+'" không phải số hợp lệ.'};
    nums.push(n);
  }
  if(nums.length<1) return {valid:false,numbers:[],error:'Phải nhập ít nhất 1 số.'};
  return {valid:true,numbers:nums,error:''};
}
function sleep(ms){ return new Promise(function(r){setTimeout(r,ms);}); }
function highlightPseudo(id,line){
  var el=document.getElementById(id); if(!el) return;
  el.querySelectorAll('span').forEach(function(s){ s.classList.remove('pseudo-active'); });
  if(line){ var t=el.querySelector('[data-line="'+line+'"]'); if(t) t.classList.add('pseudo-active'); }
}
function clearPseudo(id){ highlightPseudo(id,null); }

// ============================================
// 001 Kadane
// ============================================
(function(){
  var input=document.getElementById('001-input');
  var runBtn=document.getElementById('001-run-btn'), randomBtn=document.getElementById('001-random-btn');
  var stepBtn=document.getElementById('001-step-btn'), autoBtn=document.getElementById('001-auto-btn'), resetBtn=document.getElementById('001-reset-btn');
  var speed=document.getElementById('001-speed'), speedVal=document.getElementById('001-speed-val');
  var err=document.getElementById('001-error'), vizCard=document.getElementById('001-viz-card'), viz=document.getElementById('001-array-viz');
  var curEl=document.getElementById('001-cur'), maxEl=document.getElementById('001-max'), idxEl=document.getElementById('001-idx');
  var resCard=document.getElementById('001-result-card'), resVal=document.getElementById('001-result-value'), resDet=document.getElementById('001-result-detail');
  var stepsCard=document.getElementById('001-steps-card'), stepsList=document.getElementById('001-steps-list');
  var cmpCard=document.getElementById('001-compare-card');
  var presets=[
    {v:'-2, 1, -3, 4, -1, 2, 1, -5, 4', label:'Cơ bản'},
    {v:'5, -2, 3, -1, 2, -4, 6, -1', label:'Âm dương lẫn'},
    {v:'-5, -2, -8, -1, -9', label:'Toàn âm'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  function getSpeed(){ return parseInt(speed.value,10); }
  speed.addEventListener('input',function(){ speedVal.textContent=getSpeed()+'ms'; });
  document.getElementById('001-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; clearErr(); hideAll();
    document.querySelectorAll('#001-presets .preset-pill').forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; input.classList.add('input-error-border'); }
  function clearErr(){ err.textContent=''; input.classList.remove('input-error-border'); }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true; cmpCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; clearPseudo('001-pseudo');
    curEl.textContent='0'; maxEl.textContent='0'; idxEl.textContent='0';
    if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động';
    state=null;
  }
  function render(arr,curIdx,curL,bestL,bestR){
    viz.innerHTML='';
    arr.forEach(function(n,i){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=n;
      if(i===curIdx) v.classList.add('current');
      else if(i>=bestL && i<=bestR && bestL!==-1) v.classList.add('max');
      else if(i>=curL && i<=curIdx) v.classList.add('window-active');
      else if(i<curIdx) v.classList.add('done');
      var idx=document.createElement('span'); idx.className='array-index'; idx.textContent='['+i+']';
      cell.appendChild(v); cell.appendChild(idx); viz.appendChild(cell);
    });
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;} return p.numbers;
  }
  function buildState(arr){
    return {arr:arr.slice(), n:arr.length, i:1, cur:arr[0], maxSum:arr[0], curL:0, bestL:0, bestR:0, done:false, steps:[]};
  }
  function doStep(){
    if(!state||state.done) return true;
    var arr=state.arr, i=state.i;
    if(i>=arr.length){ state.done=true; return true; }
    highlightPseudo('001-pseudo','3');
    var prevCur=state.cur;
    if(state.cur + arr[i] > arr[i]){ state.cur = state.cur + arr[i]; }
    else { state.cur = arr[i]; state.curL = i; }
    highlightPseudo('001-pseudo','4');
    if(state.cur > state.maxSum){ state.maxSum=state.cur; state.bestL=state.curL; state.bestR=i; }
    var stepTxt='i='+i+': cur=max('+arr[i]+', '+prevCur+'+'+arr[i]+')='+state.cur+' | maxSum='+state.maxSum;
    if(state.curL!==state.bestL || i!==state.bestR) stepTxt+=' | best ['+state.bestL+','+state.bestR+']';
    state.steps.push(stepTxt);
    var li=document.createElement('li'); li.textContent=stepTxt; stepsList.appendChild(li); stepsCard.hidden=false;
    curEl.textContent=state.cur; maxEl.textContent=state.maxSum; idxEl.textContent=i;
    render(arr,i,state.curL,state.bestL,state.bestR);
    state.i++;
    if(state.i>=arr.length) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('001-pseudo','5');
    var arr=state.arr;
    render(arr,arr.length-1,state.curL,state.bestL,state.bestR);
    var bestArr=arr.slice(state.bestL,state.bestR+1);
    resVal.textContent='Max Sum = '+state.maxSum;
    resDet.textContent='Đoạn ['+state.bestL+', '+state.bestR+'] → ['+bestArr.join(', ')+']';
    resCard.hidden=false;
    // comparison
    var bruteOps=0; var bruteMax=-Infinity;
    for(var a=0;a<arr.length;a++){ var s=0; for(var b=a;b<arr.length;b++){ s+=arr[b]; bruteOps++; if(s>bruteMax) bruteMax=s; } }
    var kadaneOps=arr.length;
    cmpCard.hidden=false;
    var maxOps=Math.max(bruteOps,kadaneOps);
    document.getElementById('001-brute-bar').style.width=Math.round(bruteOps/maxOps*100)+'%';
    document.getElementById('001-kadane-bar').style.width=Math.max(5,Math.round(kadaneOps/maxOps*100))+'%';
    document.getElementById('001-brute-count').textContent=bruteOps+' ops';
    document.getElementById('001-kadane-count').textContent=kadaneOps+' ops';
    document.getElementById('001-compare-winner').textContent='🏆 Kadane nhanh hơn '+(bruteOps/kadaneOps).toFixed(1)+' lần! O(n) vs O(n²)';
  }
  async function handleRun(){
    clearErr(); hideAll();
    var arr=validate(); if(!arr) return;
    state=buildState(arr);
    vizCard.hidden=false;
    highlightPseudo('001-pseudo','1');
    curEl.textContent=state.cur; maxEl.textContent=state.maxSum;
    render(arr,0,0,0,0);
    await sleep(400);
    for(var k=1;k<arr.length;k++){
      doStep();
      await sleep(getSpeed());
    }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var arr=validate(); if(!arr) return;
      state=buildState(arr); vizCard.hidden=false;
      render(state.arr,0,0,0,0);
      curEl.textContent=state.cur; maxEl.textContent=state.maxSum;
      highlightPseudo('001-pseudo','1');
      return;
    }
    var done=doStep();
    if(done) finish();
  }
  function handleAuto(){
    if(isAuto){ clearTimeout(autoTimer); isAuto=false; autoBtn.textContent='▶ Tự động'; return; }
    if(!state){ handleStep(); if(!state) return; }
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){ isAuto=false; autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return; }
      var done=doStep();
      if(done){ isAuto=false; autoBtn.textContent='▶ Tự động'; finish(); return; }
      autoTimer=setTimeout(tick,getSpeed());
    }
    autoTimer=setTimeout(tick,getSpeed());
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*6)+5;
    var a=[]; for(var i=0;i<len;i++) a.push(Math.floor(Math.random()*21)-10);
    input.value=a.join(', '); clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
  input.addEventListener('input',clearErr);
})();

// ============================================
// 002 Top K
// ============================================
(function(){
  var input=document.getElementById('002-input'), kInput=document.getElementById('002-k');
  var runBtn=document.getElementById('002-run-btn'), randomBtn=document.getElementById('002-random-btn');
  var stepBtn=document.getElementById('002-step-btn'), autoBtn=document.getElementById('002-auto-btn'), resetBtn=document.getElementById('002-reset-btn');
  var err=document.getElementById('002-error'), vizCard=document.getElementById('002-viz-card');
  var freqViz=document.getElementById('002-freq-viz'), heapViz=document.getElementById('002-heap-viz');
  var heapSizeEl=document.getElementById('002-heap-size'), curEl=document.getElementById('002-cur');
  var resCard=document.getElementById('002-result-card'), resVal=document.getElementById('002-result-value');
  var stepsCard=document.getElementById('002-steps-card'), stepsList=document.getElementById('002-steps-list');
  var presets=[
    {v:'1, 1, 1, 2, 2, 3',k:'2'},
    {v:'4, 4, 4, 4, 2, 2, 3, 3, 3, 1',k:'2'},
    {v:'5, 5, 5, 5, 5',k:'1'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('002-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; kInput.value=presets[idx].k; clearErr(); hideAll();
    document.querySelectorAll('#002-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    freqViz.innerHTML=''; heapViz.innerHTML=''; stepsList.innerHTML='';
    heapSizeEl.textContent='0'; curEl.textContent='-'; clearPseudo('002-pseudo');
    if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function renderFreq(freq,heap,curKey){
    freqViz.innerHTML='';
    var maxCnt=0; freq.forEach(function(v){ if(v.cnt>maxCnt) maxCnt=v.cnt; });
    freq.forEach(function(entry){
      var d=document.createElement('div'); d.className='freq-item';
      if(entry.key===curKey) d.classList.add('freq-current');
      var inHeap=heap.some(function(h){return h.key===entry.key;});
      if(inHeap) d.classList.add('freq-in-heap');
      var num=document.createElement('div'); num.className='freq-num'; num.textContent=entry.key;
      var cnt=document.createElement('div'); cnt.className='freq-count'; cnt.textContent='×'+entry.cnt;
      var bar=document.createElement('div'); bar.className='freq-bar-mini'; bar.style.width=Math.round(entry.cnt/maxCnt*100)+'%';
      d.appendChild(num); d.appendChild(cnt); d.appendChild(bar); freqViz.appendChild(d);
    });
    heapViz.innerHTML='';
    heap.slice().sort(function(a,b){return a.cnt-b.cnt;}).forEach(function(h,i){
      var el=document.createElement('div'); el.className='heap-item'; if(i===0) el.classList.add('heap-top');
      el.textContent=h.key+'('+h.cnt+')'; heapViz.appendChild(el);
    });
    heapSizeEl.textContent=heap.length;
    curEl.textContent=curKey!==null?curKey:'-';
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;}
    var kRaw=kInput.value.trim(); if(kRaw===''){showErr('Vui lòng nhập K.'); return null;}
    var k=Number(kRaw); if(!Number.isInteger(k)||k<1){showErr('K phải là số nguyên ≥1.'); return null;}
    var distinct=new Set(p.numbers).size;
    if(k>distinct){showErr('K='+k+' lớn hơn số phần tử distinct ('+distinct+').'); return null;}
    return {arr:p.numbers,k:k};
  }
  function buildState(arr,k){
    var freqMap={}; arr.forEach(function(n){ freqMap[n]=(freqMap[n]||0)+1; });
    var freqArr=[]; for(var key in freqMap){ freqArr.push({key:Number(key),cnt:freqMap[key]}); }
    freqArr.sort(function(a,b){return b.cnt-a.cnt;});
    return {arr:arr,k:k,freq:freqArr,heap:[],idx:0,done:false};
  }
  function doStep(){
    if(!state||state.done) return true;
    var entry=state.freq[state.idx];
    if(!entry){ state.done=true; return true; }
    highlightPseudo('002-pseudo','4');
    state.heap.push(entry);
    state.heap.sort(function(a,b){return a.cnt-b.cnt;});
    var msg='Xét '+entry.key+' (×'+entry.cnt+') → push heap ['+state.heap.map(function(h){return h.key+'('+h.cnt+')';}).join(', ')+']';
    if(state.heap.length>state.k){
      highlightPseudo('002-pseudo','5');
      var popped=state.heap.shift();
      msg+=' → pop '+popped.key+' (nhỏ nhất)';
    }
    var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
    renderFreq(state.freq,state.heap,entry.key);
    state.idx++;
    if(state.idx>=state.freq.length) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('002-pseudo','6');
    var topK=state.heap.slice().sort(function(a,b){return b.cnt-a.cnt;}).map(function(h){return h.key;});
    resVal.textContent='Top '+state.k+': ['+topK.join(', ')+']';
    resCard.hidden=false;
  }
  async function handleRun(){
    clearErr(); hideAll();
    var v=validate(); if(!v) return;
    state=buildState(v.arr,v.k); vizCard.hidden=false;
    highlightPseudo('002-pseudo','1');
    renderFreq(state.freq,state.heap,null);
    await sleep(300);
    while(!state.done){ doStep(); await sleep(700); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var v=validate(); if(!v) return;
      state=buildState(v.arr,v.k); vizCard.hidden=false;
      renderFreq(state.freq,state.heap,null);
      highlightPseudo('002-pseudo','1');
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,700);
    }
    autoTimer=setTimeout(tick,700);
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*6)+5;
    var a=[]; for(var i=0;i<len;i++) a.push(Math.floor(Math.random()*5)+1);
    input.value=a.join(', ');
    var distinct=new Set(a).size;
    kInput.value=Math.min(2,distinct);
    clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 003 Rotated Search
// ============================================
(function(){
  var input=document.getElementById('003-input'), targetInput=document.getElementById('003-target');
  var runBtn=document.getElementById('003-run-btn'), randomBtn=document.getElementById('003-random-btn');
  var stepBtn=document.getElementById('003-step-btn'), autoBtn=document.getElementById('003-auto-btn'), resetBtn=document.getElementById('003-reset-btn');
  var err=document.getElementById('003-error'), vizCard=document.getElementById('003-viz-card'), viz=document.getElementById('003-array-viz');
  var lEl=document.getElementById('003-l'), midEl=document.getElementById('003-mid'), rEl=document.getElementById('003-r'), cmpEl=document.getElementById('003-cmp');
  var resCard=document.getElementById('003-result-card'), resVal=document.getElementById('003-result-value');
  var stepsCard=document.getElementById('003-steps-card'), stepsList=document.getElementById('003-steps-list');
  var presets=[
    {v:'4, 5, 6, 7, 0, 1, 2',t:'0'},
    {v:'1, 2, 3, 4, 5, 6',t:'3'},
    {v:'2, 3, 4, 5, 6, 7, 0, 1',t:'5'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('003-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; targetInput.value=presets[idx].t; clearErr(); hideAll();
    document.querySelectorAll('#003-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; lEl.textContent='0'; midEl.textContent='0'; rEl.textContent='0'; cmpEl.textContent='0';
    clearPseudo('003-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(arr,l,mid,r,elim,found){
    viz.innerHTML='';
    arr.forEach(function(n,i){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=n;
      if(i===found) v.classList.add('found');
      else if(elim[i]) v.classList.add('eliminated');
      else if(i===mid) v.classList.add('mid-pointer');
      else if(i===l) v.classList.add('left-pointer');
      else if(i===r) v.classList.add('right-pointer');
      var idx=document.createElement('span'); idx.className='array-index'; idx.textContent='['+i+']';
      cell.appendChild(v); cell.appendChild(idx); viz.appendChild(cell);
    });
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;}
    var tRaw=targetInput.value.trim(); if(tRaw===''){showErr('Vui lòng nhập target.'); return null;}
    var t=Number(tRaw); if(isNaN(t)){showErr('Target không hợp lệ.'); return null;}
    return {arr:p.numbers,target:t};
  }
  function buildState(arr,target){
    return {arr:arr,target:target,l:0,r:arr.length-1,elim:{},cmp:0,done:false,found:-1};
  }
  function doStep(){
    if(!state||state.done) return true;
    var arr=state.arr, target=state.target;
    if(state.l>state.r){ state.done=true; return true; }
    var mid=Math.floor((state.l+state.r)/2);
    state.cmp++; cmpEl.textContent=state.cmp; lEl.textContent=state.l; midEl.textContent=mid; rEl.textContent=state.r;
    highlightPseudo('003-pseudo','3');
    render(arr,state.l,mid,state.r,state.elim,-1);
    var msg='';
    if(arr[mid]===target){
      highlightPseudo('003-pseudo','4');
      msg='arr['+mid+']='+arr[mid]+' == '+target+' → FOUND tại '+mid;
      state.found=mid; state.done=true;
      render(arr,state.l,mid,state.r,state.elim,mid);
    } else if(arr[state.l]<=arr[mid]){
      highlightPseudo('003-pseudo','5');
      msg='Left sorted ['+state.l+','+mid+']='+arr.slice(state.l,mid+1).join(',')+' | ';
      if(target>=arr[state.l] && target<arr[mid]){
        highlightPseudo('003-pseudo','6');
        msg+='target in left → r=mid-1='+(mid-1);
        for(var i=mid;i<=state.r;i++) state.elim[i]=true;
        state.r=mid-1;
      } else {
        msg+='target not in left → l=mid+1='+(mid+1);
        for(var i=state.l;i<=mid;i++) state.elim[i]=true;
        state.l=mid+1;
      }
    } else {
      highlightPseudo('003-pseudo','7');
      msg='Right sorted ['+mid+','+state.r+'] | ';
      if(target>arr[mid] && target<=arr[state.r]){
        highlightPseudo('003-pseudo','8');
        msg+='target in right → l=mid+1='+(mid+1);
        for(var i=state.l;i<=mid;i++) state.elim[i]=true;
        state.l=mid+1;
      } else {
        msg+='target not in right → r=mid-1='+(mid-1);
        for(var i=mid;i<=state.r;i++) state.elim[i]=true;
        state.r=mid-1;
      }
    }
    var li=document.createElement('li'); li.textContent=msg; if(state.done) li.classList.add('step-final'); stepsList.appendChild(li); stepsCard.hidden=false;
    if(state.l>state.r && !state.done){ state.done=true; }
    return state.done;
  }
  function finish(){
    if(state.found!==-1){ resVal.textContent='Tìm thấy '+state.target+' tại index '+state.found+' ('+state.cmp+' lần so sánh)'; }
    else { resVal.textContent='Không tìm thấy '+state.target+' ('+state.cmp+' lần so sánh)'; }
    resCard.hidden=false;
  }
  async function handleRun(){
    clearErr(); hideAll();
    var v=validate(); if(!v) return;
    state=buildState(v.arr,v.target); vizCard.hidden=false;
    render(state.arr,state.l,-1,state.r,{},-1);
    await sleep(400);
    while(!state.done){ doStep(); await sleep(800); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var v=validate(); if(!v) return;
      state=buildState(v.arr,v.target); vizCard.hidden=false;
      render(state.arr,state.l,-1,state.r,{},-1);
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,800);
    }
    autoTimer=setTimeout(tick,800);
  }
  function handleRandom(){
    var n=Math.floor(Math.random()*4)+5;
    var sorted=[]; var cur=Math.floor(Math.random()*10);
    for(var i=0;i<n;i++){ cur+=Math.floor(Math.random()*5)+1; sorted.push(cur); }
    var rot=Math.floor(Math.random()*n);
    var arr=sorted.slice(rot).concat(sorted.slice(0,rot));
    input.value=arr.join(', ');
    targetInput.value=arr[Math.floor(Math.random()*arr.length)];
    clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 004 QuickSort
// ============================================
(function(){
  var input=document.getElementById('004-input');
  var runBtn=document.getElementById('004-run-btn'), randomBtn=document.getElementById('004-random-btn');
  var stepBtn=document.getElementById('004-step-btn'), autoBtn=document.getElementById('004-auto-btn'), resetBtn=document.getElementById('004-reset-btn');
  var speed=document.getElementById('004-speed'), speedVal=document.getElementById('004-speed-val');
  var err=document.getElementById('004-error'), vizCard=document.getElementById('004-viz-card'), viz=document.getElementById('004-array-viz');
  var pivotEl=document.getElementById('004-pivot'), iEl=document.getElementById('004-i'), jEl=document.getElementById('004-j'), cmpEl=document.getElementById('004-cmp'), swapsEl=document.getElementById('004-swaps');
  var recEl=document.getElementById('004-recursion');
  var resCard=document.getElementById('004-result-card'), resVal=document.getElementById('004-result-value');
  var stepsCard=document.getElementById('004-steps-card'), stepsList=document.getElementById('004-steps-list');
  var presets=[
    {v:'8, 3, 5, 1, 9, 2'},
    {v:'1, 2, 3, 5, 4, 6'},
    {v:'9, 8, 7, 6, 5, 4'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  function getSpeed(){ return parseInt(speed.value,10); }
  speed.addEventListener('input',function(){ speedVal.textContent=getSpeed()+'ms'; });
  document.getElementById('004-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; clearErr(); hideAll();
    document.querySelectorAll('#004-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; recEl.textContent='';
    pivotEl.textContent='-'; iEl.textContent='0'; jEl.textContent='0'; cmpEl.textContent='0'; swapsEl.textContent='0';
    clearPseudo('004-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(arr,lo,hi,pivotIdx,i,j,swapPair,sortedSet){
    viz.innerHTML='';
    arr.forEach(function(n,idx){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=n;
      if(sortedSet && sortedSet[idx]) v.classList.add('sorted');
      else if(swapPair && (idx===swapPair[0]||idx===swapPair[1])) v.classList.add('swapping');
      else if(idx===pivotIdx) v.classList.add('pivot');
      else if(idx===i) v.classList.add('left-pointer');
      else if(idx===j) v.classList.add('comparing');
      if(idx<lo||idx>hi) v.classList.add('done');
      var id=document.createElement('span'); id.className='array-index'; id.textContent='['+idx+']';
      cell.appendChild(v); cell.appendChild(id); viz.appendChild(cell);
    });
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;} return p.numbers;
  }
  function buildState(arr){
    return {arr:arr.slice(), stack:[[0,arr.length-1]], cur:null, sorted:{}, cmp:0, swaps:0, done:false};
  }
  function nextPartition(){
    while(state.stack.length>0){
      var range=state.stack[state.stack.length-1];
      var lo=range[0], hi=range[1];
      if(lo>=hi){ state.sorted[lo]=true; if(lo===hi) state.sorted[hi]=true; state.stack.pop(); continue; }
      return range;
    }
    return null;
  }
  function doStep(){
    if(!state||state.done) return true;
    if(!state.cur){
      var range=nextPartition();
      if(!range){ state.done=true; return true; }
      var lo=range[0], hi=range[1];
      state.cur={lo:lo,hi:hi,pivot:state.arr[hi],i:lo,j:lo};
      highlightPseudo('004-pseudo','2');
      pivotEl.textContent=state.cur.pivot; iEl.textContent=state.cur.i; jEl.textContent=state.cur.j;
      recEl.textContent='Partition ['+lo+','+hi+'] pivot='+state.cur.pivot;
      render(state.arr,lo,hi,hi,state.cur.i,state.cur.j,null,state.sorted);
      var li=document.createElement('li'); li.textContent='Partition ['+lo+','+hi+'] pivot='+state.cur.pivot; stepsList.appendChild(li); stepsCard.hidden=false;
      return false;
    }
    var cur=state.cur;
    if(cur.j >= cur.hi){
      // final swap
      highlightPseudo('004-pseudo','5');
      var tmp=state.arr[cur.i]; state.arr[cur.i]=state.arr[cur.hi]; state.arr[cur.hi]=tmp;
      state.swaps++; swapsEl.textContent=state.swaps;
      var pIdx=cur.i;
      state.sorted[pIdx]=true;
      render(state.arr,cur.lo,cur.hi,pIdx,-1,-1,[cur.i,cur.hi],state.sorted);
      var li=document.createElement('li'); li.textContent='swap pivot → vị trí '+pIdx+' | arr=['+state.arr.join(', ')+']'; stepsList.appendChild(li);
      // push sub-ranges
      state.stack.pop();
      // right then left (so left processed first)
      if(pIdx+1 < cur.hi) state.stack.push([pIdx+1, cur.hi]);
      if(cur.lo < pIdx-1) state.stack.push([cur.lo, pIdx-1]);
      recEl.textContent='Pivot '+pIdx+' done | stack: '+state.stack.map(function(r){return '['+r[0]+','+r[1]+']';}).join(' ');
      state.cur=null;
      if(state.stack.length===0){ state.done=true; return true; }
      return false;
    }
    // compare arr[j] <= pivot
    highlightPseudo('004-pseudo','4');
    state.cmp++; cmpEl.textContent=state.cmp;
    jEl.textContent=cur.j; iEl.textContent=cur.i;
    var doSwap = state.arr[cur.j] <= cur.pivot;
    var msg='j='+cur.j+' arr[j]='+state.arr[cur.j]+' '+(doSwap?'≤':' >')+' pivot '+cur.pivot;
    if(doSwap){
      if(cur.i!==cur.j){
        var tmp=state.arr[cur.i]; state.arr[cur.i]=state.arr[cur.j]; state.arr[cur.j]=tmp;
        state.swaps++; swapsEl.textContent=state.swaps;
        msg+=' → swap i='+cur.i+' j='+cur.j;
        render(state.arr,cur.lo,cur.hi,cur.hi,cur.i,cur.j,[cur.i,cur.j],state.sorted);
      } else {
        msg+=' → i++ (no swap)';
        render(state.arr,cur.lo,cur.hi,cur.hi,cur.i,cur.j,null,state.sorted);
      }
      cur.i++;
    } else {
      msg+=' → skip';
      render(state.arr,cur.lo,cur.hi,cur.hi,cur.i,cur.j,null,state.sorted);
    }
    var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
    cur.j++;
    return false;
  }
  function finish(){
    highlightPseudo('004-pseudo','7');
    // mark all sorted
    for(var i=0;i<state.arr.length;i++) state.sorted[i]=true;
    render(state.arr,0,state.arr.length-1,-1,-1,-1,null,state.sorted);
    resVal.textContent='['+state.arr.join(', ')+'] — '+state.cmp+' so sánh, '+state.swaps+' swap';
    resCard.hidden=false;
  }
  async function handleRun(){
    clearErr(); hideAll();
    var arr=validate(); if(!arr) return;
    state=buildState(arr); vizCard.hidden=false;
    while(!state.done){ doStep(); await sleep(getSpeed()); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var arr=validate(); if(!arr) return;
      state=buildState(arr); vizCard.hidden=false;
      doStep(); return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,getSpeed());
    }
    autoTimer=setTimeout(tick,getSpeed());
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*4)+5;
    var a=[]; for(var i=0;i<len;i++) a.push(Math.floor(Math.random()*20)+1);
    input.value=a.join(', '); clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 005 Bounds
// ============================================
(function(){
  var input=document.getElementById('005-input'), targetInput=document.getElementById('005-target');
  var runBtn=document.getElementById('005-run-btn'), randomBtn=document.getElementById('005-random-btn');
  var stepBtn=document.getElementById('005-step-btn'), autoBtn=document.getElementById('005-auto-btn'), resetBtn=document.getElementById('005-reset-btn');
  var err=document.getElementById('005-error'), vizCard=document.getElementById('005-viz-card'), viz=document.getElementById('005-array-viz');
  var phaseEl=document.getElementById('005-phase'), lEl=document.getElementById('005-l'), midEl=document.getElementById('005-mid'), rEl=document.getElementById('005-r');
  var resCard=document.getElementById('005-result-card'), resVal=document.getElementById('005-result-value'), resDet=document.getElementById('005-result-detail');
  var stepsCard=document.getElementById('005-steps-card'), stepsList=document.getElementById('005-steps-list');
  var presets=[
    {v:'1, 2, 2, 2, 3, 4',t:'2'},
    {v:'1, 2, 3, 4, 5',t:'6'},
    {v:'2, 2, 2, 2, 2',t:'2'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('005-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; targetInput.value=presets[idx].t; clearErr(); hideAll();
    document.querySelectorAll('#005-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; phaseEl.textContent='-'; lEl.textContent='0'; midEl.textContent='0'; rEl.textContent='0';
    clearPseudo('005-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(arr,l,mid,r,foundRange){
    viz.innerHTML='';
    arr.forEach(function(n,i){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=n;
      if(foundRange && i>=foundRange[0] && i<=foundRange[1]) v.classList.add('window-best');
      else if(i===mid) v.classList.add('mid-pointer');
      else if(i===l) v.classList.add('left-pointer');
      else if(i===r) v.classList.add('right-pointer');
      var idx=document.createElement('span'); idx.className='array-index'; idx.textContent='['+i+']';
      cell.appendChild(v); cell.appendChild(idx); viz.appendChild(cell);
    });
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;}
    for(var i=1;i<p.numbers.length;i++) if(p.numbers[i]<p.numbers[i-1]){showErr('Mảng phải sorted tăng dần.'); return null;}
    var tRaw=targetInput.value.trim(); if(tRaw===''){showErr('Vui lòng nhập target.'); return null;}
    var t=Number(tRaw); if(isNaN(t)){showErr('Target không hợp lệ.'); return null;}
    return {arr:p.numbers,target:t};
  }
  function buildState(arr,target){
    return {arr:arr,target:target,phase:0,l:0,r:arr.length,mid:-1,first:-1,last:-1,done:false};
  }
  function doStep(){
    if(!state||state.done) return true;
    var arr=state.arr, target=state.target;
    if(state.phase===0){
      // lowerBound
      if(state.l>=state.r){
        state.first=state.l;
        state.phase=1; state.l=0; state.r=arr.length;
        phaseEl.textContent='upperBound';
        var li=document.createElement('li'); li.textContent='lowerBound done → first='+state.first; stepsList.appendChild(li);
        return false;
      }
      var mid=Math.floor((state.l+state.r)/2);
      state.mid=mid; lEl.textContent=state.l; midEl.textContent=mid; rEl.textContent=state.r; phaseEl.textContent='lowerBound';
      highlightPseudo('005-pseudo','3');
      render(arr,state.l,mid,state.r,null);
      var msg='lower: mid='+mid+' arr[mid]='+arr[mid]+' '+(arr[mid]<target?'<':'≥')+' '+target;
      if(arr[mid]<target){ state.l=mid+1; msg+=' → l=mid+1'; } else { state.r=mid; msg+=' → r=mid'; }
      var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
      return false;
    } else if(state.phase===1){
      if(state.l>=state.r){
        state.last=state.l-1;
        state.done=true;
        var li=document.createElement('li'); li.textContent='upperBound done → last='+state.last; li.classList.add('step-final'); stepsList.appendChild(li);
        return true;
      }
      var mid=Math.floor((state.l+state.r)/2);
      state.mid=mid; lEl.textContent=state.l; midEl.textContent=mid; rEl.textContent=state.r; phaseEl.textContent='upperBound';
      highlightPseudo('005-pseudo','6');
      render(arr,state.l,mid,state.r,null);
      var msg='upper: mid='+mid+' arr[mid]='+arr[mid]+' '+(arr[mid]<=target?'≤':' >')+' '+target;
      if(arr[mid]<=target){ state.l=mid+1; msg+=' → l=mid+1'; } else { state.r=mid; msg+=' → r=mid'; }
      var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li);
      return false;
    }
    return true;
  }
  function finish(){
    highlightPseudo('005-pseudo','7');
    var arr=state.arr, target=state.target;
    var first=state.first, last=state.last;
    var valid = first<arr.length && arr[first]===target;
    if(!valid){ resVal.textContent='[-1, -1] — không tìm thấy '+target; resDet.textContent=''; }
    else { resVal.textContent='['+first+', '+last+']'; resDet.textContent='Target '+target+' từ index '+first+' đến '+last+' ('+(last-first+1)+' lần)'; render(arr,-1,-1,-1,[first,last]); }
    resCard.hidden=false;
  }
  async function handleRun(){
    clearErr(); hideAll();
    var v=validate(); if(!v) return;
    state=buildState(v.arr,v.target); vizCard.hidden=false; phaseEl.textContent='lowerBound';
    render(state.arr,state.l,-1,state.r,null);
    await sleep(300);
    while(!state.done){ doStep(); await sleep(700); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var v=validate(); if(!v) return;
      state=buildState(v.arr,v.target); vizCard.hidden=false; phaseEl.textContent='lowerBound';
      render(state.arr,state.l,-1,state.r,null);
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,700);
    }
    autoTimer=setTimeout(tick,700);
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*4)+5;
    var base=Math.floor(Math.random()*5);
    var a=[]; for(var i=0;i<len;i++){ base+=Math.floor(Math.random()*2); a.push(base); }
    input.value=a.join(', ');
    targetInput.value=a[Math.floor(Math.random()*a.length)];
    clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 006 Container
// ============================================
(function(){
  var input=document.getElementById('006-input');
  var runBtn=document.getElementById('006-run-btn'), randomBtn=document.getElementById('006-random-btn');
  var stepBtn=document.getElementById('006-step-btn'), autoBtn=document.getElementById('006-auto-btn'), resetBtn=document.getElementById('006-reset-btn');
  var err=document.getElementById('006-error'), vizCard=document.getElementById('006-viz-card'), viz=document.getElementById('006-water-viz');
  var lEl=document.getElementById('006-l'), rEl=document.getElementById('006-r'), areaEl=document.getElementById('006-area'), bestEl=document.getElementById('006-best');
  var resCard=document.getElementById('006-result-card'), resVal=document.getElementById('006-result-value'), resDet=document.getElementById('006-result-detail');
  var stepsCard=document.getElementById('006-steps-card'), stepsList=document.getElementById('006-steps-list');
  var presets=[
    {v:'1, 8, 6, 2, 5, 4, 8, 3, 7'},
    {v:'1, 2, 3, 4, 5, 6'},
    {v:'5, 4, 3, 2, 1, 5'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('006-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; clearErr(); hideAll();
    document.querySelectorAll('#006-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; lEl.textContent='0'; rEl.textContent='0'; areaEl.textContent='0'; bestEl.textContent='0';
    clearPseudo('006-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(arr,l,r,bestPair){
    viz.innerHTML='';
    var maxH=Math.max.apply(null,arr);
    arr.forEach(function(h,i){
      var wrap=document.createElement('div'); wrap.className='water-bar-wrapper';
      var bar=document.createElement('div'); bar.className='water-bar';
      bar.style.height=Math.round(h/maxH*120)+'px';
      if(bestPair && i>=bestPair[0] && i<=bestPair[1]) bar.classList.add('water-best');
      if(i===l) bar.classList.add('water-left');
      else if(i===r) bar.classList.add('water-right');
      else if(i>l && i<r) bar.classList.add('water-current');
      // water fill for current pair
      if(i>l && i<r && bestPair){
        // no fill
      }
      var val=document.createElement('span'); val.className='water-value'; val.textContent=h;
      var lab=document.createElement('span'); lab.className='water-label'; lab.textContent='['+i+']';
      wrap.appendChild(val); wrap.appendChild(bar); wrap.appendChild(lab); viz.appendChild(wrap);
    });
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;}
    if(p.numbers.length<2){showErr('Cần ít nhất 2 cột.'); return null;}
    for(var i=0;i<p.numbers.length;i++) if(p.numbers[i]<0){showErr('Chiều cao phải ≥0.'); return null;}
    return p.numbers;
  }
  function buildState(arr){
    return {arr:arr,l:0,r:arr.length-1,best:0,bestPair:[-1,-1],done:false};
  }
  function doStep(){
    if(!state||state.done) return true;
    var arr=state.arr;
    if(state.l>=state.r){ state.done=true; return true; }
    highlightPseudo('006-pseudo','3');
    var area=Math.min(arr[state.l],arr[state.r])*(state.r-state.l);
    highlightPseudo('006-pseudo','4');
    var isBest=false;
    if(area>state.best){ state.best=area; state.bestPair=[state.l,state.r]; isBest=true; }
    lEl.textContent=state.l; rEl.textContent=state.r; areaEl.textContent=area; bestEl.textContent=state.best;
    render(arr,state.l,state.r,state.bestPair[0]!==-1?state.bestPair:null);
    var msg='l='+state.l+'('+arr[state.l]+') r='+state.r+'('+arr[state.r]+') → area=min('+arr[state.l]+','+arr[state.r]+')×'+(state.r-state.l)+'='+area+(isBest?' ★ BEST':'');
    var li=document.createElement('li'); li.textContent=msg; if(isBest) li.classList.add('step-final'); stepsList.appendChild(li); stepsCard.hidden=false;
    highlightPseudo('006-pseudo','5');
    if(arr[state.l] < arr[state.r]) state.l++; else state.r--;
    if(state.l>=state.r) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('006-pseudo','6');
    render(state.arr,state.bestPair[0],state.bestPair[1],state.bestPair);
    resVal.textContent='Max Water = '+state.best;
    resDet.textContent='Cột '+state.bestPair[0]+' ('+state.arr[state.bestPair[0]]+') và '+state.bestPair[1]+' ('+state.arr[state.bestPair[1]]+')';
    resCard.hidden=false;
  }
  async function handleRun(){
    clearErr(); hideAll();
    var arr=validate(); if(!arr) return;
    state=buildState(arr); vizCard.hidden=false;
    render(arr,state.l,state.r,null);
    await sleep(300);
    while(!state.done){ doStep(); await sleep(700); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var arr=validate(); if(!arr) return;
      state=buildState(arr); vizCard.hidden=false;
      render(arr,state.l,state.r,null);
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,700);
    }
    autoTimer=setTimeout(tick,700);
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*4)+6;
    var a=[]; for(var i=0;i<len;i++) a.push(Math.floor(Math.random()*10)+1);
    input.value=a.join(', '); clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 007 Longest Substring
// ============================================
(function(){
  var input=document.getElementById('007-input');
  var runBtn=document.getElementById('007-run-btn'), randomBtn=document.getElementById('007-random-btn');
  var stepBtn=document.getElementById('007-step-btn'), autoBtn=document.getElementById('007-auto-btn'), resetBtn=document.getElementById('007-reset-btn');
  var err=document.getElementById('007-error'), vizCard=document.getElementById('007-viz-card'), viz=document.getElementById('007-string-viz');
  var lEl=document.getElementById('007-l'), rEl=document.getElementById('007-r'), setEl=document.getElementById('007-set'), bestEl=document.getElementById('007-best');
  var resCard=document.getElementById('007-result-card'), resVal=document.getElementById('007-result-value'), resDet=document.getElementById('007-result-detail');
  var stepsCard=document.getElementById('007-steps-card'), stepsList=document.getElementById('007-steps-list');
  var presets=['abcabcbb','bbbbb','pwwkew'];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('007-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx]; clearErr(); hideAll();
    document.querySelectorAll('#007-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    viz.innerHTML=''; stepsList.innerHTML=''; lEl.textContent='0'; rEl.textContent='0'; setEl.textContent='-'; bestEl.textContent='0';
    clearPseudo('007-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(s,l,r,bestL,bestR,set){
    viz.innerHTML='';
    for(var i=0;i<s.length;i++){
      var ch=document.createElement('div'); ch.className='string-char'; ch.textContent=s[i];
      if(i>=bestL && i<=bestR && bestL!==-1) ch.classList.add('char-valid');
      if(i>=l && i<=r) ch.classList.add('window-active');
      if(i===r) ch.classList.add('char-current');
      if(i===l) ch.style.borderColor='#3b82f6';
      viz.appendChild(ch);
    }
    lEl.textContent=l; rEl.textContent=r; setEl.textContent=set.size?Array.from(set).join(', '):'-'; bestEl.textContent=(bestR-bestL+1)||0;
  }
  function validate(){
    var s=input.value; if(!s){showErr('Vui lòng nhập chuỗi.'); return null;}
    return s;
  }
  function buildState(s){
    return {s:s,l:0,r:0,set:new Set(),best:0,bestL:0,bestR:0,done:false,phase:0};
  }
  function doStep(){
    if(!state||state.done) return true;
    var s=state.s;
    if(state.r>=s.length){ state.done=true; return true; }
    var ch=s[state.r];
    highlightPseudo('007-pseudo','3');
    if(state.set.has(ch)){
      // shrink
      var removed=s[state.l];
      state.set.delete(removed);
      var msg='s[r]='+ch+' đã có trong set → remove s[l]='+removed+' l='+state.l+'→'+(state.l+1);
      state.l++;
      var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
      render(s,state.l,state.r,state.bestL,state.bestR,state.set);
      return false;
    }
    highlightPseudo('007-pseudo','4');
    state.set.add(ch);
    highlightPseudo('007-pseudo','5');
    var len=state.r-state.l+1;
    var isBest=false;
    if(len>state.best){ state.best=len; state.bestL=state.l; state.bestR=state.r; isBest=true; }
    var msg='r='+state.r+' s[r]='+ch+' → add set | window ['+state.l+','+state.r+'] len='+len+(isBest?' ★ BEST':'');
    var li=document.createElement('li'); li.textContent=msg; if(isBest) li.classList.add('step-final'); stepsList.appendChild(li); stepsCard.hidden=false;
    render(s,state.l,state.r,state.bestL,state.bestR,state.set);
    state.r++;
    if(state.r>=s.length) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('007-pseudo','6');
    var bestStr=state.s.slice(state.bestL,state.bestR+1);
    resVal.textContent='Độ dài = '+state.best;
    resDet.textContent='Chuỗi "'+bestStr+'" tại ['+state.bestL+', '+state.bestR+']';
    resCard.hidden=false;
    render(state.s,state.bestL,state.bestR,state.bestL,state.bestR,state.set);
  }
  async function handleRun(){
    clearErr(); hideAll();
    var s=validate(); if(!s) return;
    state=buildState(s); vizCard.hidden=false;
    render(s,0,0,0,0,new Set());
    await sleep(300);
    while(!state.done){ doStep(); await sleep(700); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var s=validate(); if(!s) return;
      state=buildState(s); vizCard.hidden=false;
      render(s,0,-1,0,0,new Set());
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,600);
    }
    autoTimer=setTimeout(tick,600);
  }
  function handleRandom(){
    var chars='abcdefghijklmnopqrstuvwxyz';
    var len=Math.floor(Math.random()*6)+5;
    var s=''; for(var i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
    input.value=s; clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 008 NGE
// ============================================
(function(){
  var input=document.getElementById('008-input');
  var runBtn=document.getElementById('008-run-btn'), randomBtn=document.getElementById('008-random-btn');
  var stepBtn=document.getElementById('008-step-btn'), autoBtn=document.getElementById('008-auto-btn'), resetBtn=document.getElementById('008-reset-btn');
  var err=document.getElementById('008-error'), vizCard=document.getElementById('008-viz-card');
  var arrViz=document.getElementById('008-array-viz'), stackViz=document.getElementById('008-stack-viz'), ansViz=document.getElementById('008-ans-viz');
  var iEl=document.getElementById('008-i'), stackSizeEl=document.getElementById('008-stack-size');
  var resCard=document.getElementById('008-result-card'), resVal=document.getElementById('008-result-value');
  var stepsCard=document.getElementById('008-steps-card'), stepsList=document.getElementById('008-steps-list');
  var presets=[
    {v:'2, 1, 2, 4, 3'},
    {v:'5, 4, 3, 2, 1'},
    {v:'1, 2, 3, 4, 5'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('008-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    input.value=presets[idx].v; clearErr(); hideAll();
    document.querySelectorAll('#008-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true;
    arrViz.innerHTML=''; stackViz.innerHTML='<p class="stack-empty">Stack rỗng</p>'; ansViz.innerHTML=''; stepsList.innerHTML='';
    iEl.textContent='0'; stackSizeEl.textContent='0';
    clearPseudo('008-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function render(arr,stack,ans,curIdx){
    arrViz.innerHTML='';
    arr.forEach(function(n,i){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=n;
      if(i===curIdx) v.classList.add('current');
      else if(stack.indexOf(i)!==-1) v.classList.add('window-active');
      var idx=document.createElement('span'); idx.className='array-index'; idx.textContent='['+i+']';
      cell.appendChild(v); cell.appendChild(idx); arrViz.appendChild(cell);
    });
    // stack
    stackViz.innerHTML='';
    if(stack.length===0){ stackViz.innerHTML='<p class="stack-empty">Stack rỗng</p>'; }
    else {
      for(var s=stack.length-1;s>=0;s--){
        var item=document.createElement('div'); item.className='stack-item';
        if(s===stack.length-1) item.classList.add('stack-item-top');
        item.textContent=arr[stack[s]]+' ['+stack[s]+']';
        stackViz.appendChild(item);
      }
    }
    // ans
    ansViz.innerHTML='';
    ans.forEach(function(val,i){
      var cell=document.createElement('div'); cell.className='array-cell';
      var v=document.createElement('div'); v.className='array-value'; v.textContent=val===-1?'-1':val;
      if(val!==-1) v.classList.add('found');
      var idx=document.createElement('span'); idx.className='array-index'; idx.textContent='['+i+']';
      cell.appendChild(v); cell.appendChild(idx); ansViz.appendChild(cell);
    });
    iEl.textContent=curIdx; stackSizeEl.textContent=stack.length;
  }
  function validate(){
    var p=parseNumbers(input.value); if(!p.valid){showErr(p.error); return null;} return p.numbers;
  }
  function buildState(arr){
    return {arr:arr,stack:[],ans:arr.map(function(){return -1;}),i:0,done:false};
  }
  function doStep(){
    if(!state||state.done) return true;
    var arr=state.arr;
    if(state.i>=arr.length){ state.done=true; return true; }
    highlightPseudo('008-pseudo','3');
    var curVal=arr[state.i];
    var popped=[];
    while(state.stack.length>0 && arr[state.stack[state.stack.length-1]] < curVal){
      highlightPseudo('008-pseudo','4');
      var idx=state.stack.pop();
      state.ans[idx]=curVal;
      popped.push(idx);
    }
    highlightPseudo('008-pseudo','5');
    state.stack.push(state.i);
    var msg='i='+state.i+' val='+curVal;
    if(popped.length>0) msg+=' → pop ['+popped.join(',')+'] ans['+popped.join(',')+']='+curVal;
    msg+=' → push '+state.i+' | stack ['+state.stack.join(',')+']';
    var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
    render(arr,state.stack,state.ans,state.i);
    state.i++;
    if(state.i>=arr.length) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('008-pseudo','6');
    resVal.textContent='['+state.ans.join(', ')+']';
    resCard.hidden=false;
    render(state.arr,state.stack,state.ans,state.arr.length-1);
  }
  async function handleRun(){
    clearErr(); hideAll();
    var arr=validate(); if(!arr) return;
    state=buildState(arr); vizCard.hidden=false;
    render(arr,[],state.ans,-1);
    await sleep(300);
    while(!state.done){ doStep(); await sleep(700); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var arr=validate(); if(!arr) return;
      state=buildState(arr); vizCard.hidden=false;
      render(arr,[],state.ans,-1);
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,700);
    }
    autoTimer=setTimeout(tick,700);
  }
  function handleRandom(){
    var len=Math.floor(Math.random()*4)+5;
    var a=[]; for(var i=0;i<len;i++) a.push(Math.floor(Math.random()*10)+1);
    input.value=a.join(', '); clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

// ============================================
// 009 Dijkstra
// ============================================
(function(){
  var genBtn=document.getElementById('009-generate-btn'), sizeBtn=document.getElementById('009-size-btn');
  var solveBtn=document.getElementById('009-solve-btn'), stepBtn=document.getElementById('009-step-btn'), autoBtn=document.getElementById('009-auto-btn'), resetBtn=document.getElementById('009-reset-btn');
  var gridEl=document.getElementById('009-maze-grid');
  var visitedEl=document.getElementById('009-visited'), costEl=document.getElementById('009-cost'), pqEl=document.getElementById('009-pq'), statusEl=document.getElementById('009-status');
  var resCard=document.getElementById('009-result-card'), resVal=document.getElementById('009-result-value');
  var stepsCard=document.getElementById('009-steps-card'), stepsList=document.getElementById('009-steps-list');
  var presets=[5,7,5];
  var sizeIdx=0, gridSize=5, grid=[], state=null, autoTimer=null, isAuto=false;
  document.getElementById('009-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    if(idx===0) gridSize=5;
    else if(idx===1) gridSize=7;
    else gridSize=5;
    generateGrid(idx===2?0.35:0.2);
    document.querySelectorAll('#009-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function generateGrid(wallProb){
    wallProb = wallProb==null?0.2:wallProb;
    grid=[];
    for(var r=0;r<gridSize;r++){
      var row=[];
      for(var c=0;c<gridSize;c++){
        if((r===0&&c===0)||(r===gridSize-1&&c===gridSize-1)) row.push({w:1,wall:false});
        else if(Math.random()<wallProb) row.push({w:0,wall:true});
        else row.push({w:Math.floor(Math.random()*9)+1,wall:false});
      }
      grid.push(row);
    }
    renderGrid();
    resetState();
  }
  function renderGrid(highlight){
    gridEl.innerHTML='';
    gridEl.style.gridTemplateColumns='repeat('+gridSize+', 36px)';
    for(var r=0;r<gridSize;r++){
      for(var c=0;c<gridSize;c++){
        var cell=document.createElement('div');
        cell.className='maze-cell';
        cell.setAttribute('role','gridcell');
        cell.setAttribute('data-r',r); cell.setAttribute('data-c',c);
        var g=grid[r][c];
        if(r===0&&c===0) cell.classList.add('maze-start');
        else if(r===gridSize-1&&c===gridSize-1) cell.classList.add('maze-end');
        else if(g.wall) cell.classList.add('maze-wall');
        if(highlight){
          var key=r+','+c;
          if(highlight.path && highlight.path[key]) cell.classList.add('maze-path');
          else if(highlight.visited && highlight.visited[key]) cell.classList.add('maze-visited');
          else if(highlight.current && highlight.current[0]===r && highlight.current[1]===c) cell.classList.add('maze-current');
          else if(highlight.queued && highlight.queued[key]) cell.classList.add('maze-queued');
        }
        if(g.wall) cell.textContent='█';
        else if(r===0&&c===0) cell.textContent='S';
        else if(r===gridSize-1&&c===gridSize-1) cell.textContent='E';
        else cell.textContent=g.w;
        gridEl.appendChild(cell);
      }
    }
  }
  function resetState(){
    state=null; visitedEl.textContent='0'; costEl.textContent='0'; pqEl.textContent='0'; statusEl.textContent='Sẵn sàng';
    resCard.hidden=true; stepsCard.hidden=true; stepsList.innerHTML='';
    clearPseudo('009-pseudo');
    if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động';
  }
  gridEl.addEventListener('click',function(e){
    var cell=e.target.closest('.maze-cell'); if(!cell) return;
    var r=parseInt(cell.getAttribute('data-r'),10), c=parseInt(cell.getAttribute('data-c'),10);
    if((r===0&&c===0)||(r===gridSize-1&&c===gridSize-1)) return;
    grid[r][c].wall=!grid[r][c].wall;
    if(!grid[r][c].wall) grid[r][c].w=Math.floor(Math.random()*9)+1;
    renderGrid(state?{visited:state.visited,queued:state.queued,current:state.current,path:state.path}:null);
  });
  function buildState(){
    var dist={}, parent={}, visited={}, queued={};
    for(var r=0;r<gridSize;r++) for(var c=0;c<gridSize;c++) dist[r+','+c]=Infinity;
    dist['0,0']=0;
    return {dist:dist,parent:parent,visited:visited,queued:{'0,0':true},pq:[{r:0,c:0,d:0}],current:null,path:{},done:false,visitedCount:0,found:false};
  }
  function pqPop(){
    if(!state.pq.length) return null;
    state.pq.sort(function(a,b){return a.d-b.d;});
    return state.pq.shift();
  }
  function doStep(){
    if(!state||state.done) return true;
    if(state.pq.length===0){ state.done=true; statusEl.textContent='Không tìm thấy đường'; return true; }
    highlightPseudo('009-pseudo','3');
    var cur=pqPop();
    if(!cur){ state.done=true; return true; }
    var key=cur.r+','+cur.c;
    if(state.visited[key]) return false;
    state.visited[key]=true; state.visitedCount++; state.current=[cur.r,cur.c];
    delete state.queued[key];
    visitedEl.textContent=state.visitedCount; pqEl.textContent=state.pq.length;
    if(cur.r===gridSize-1&&cur.c===gridSize-1){
      state.found=true; state.done=true;
      // trace path
      var pr=cur.r, pc=cur.c;
      while(pr!=null){
        state.path[pr+','+pc]=true;
        var par=state.parent[pr+','+pc];
        if(!par) break;
        pr=par[0]; pc=par[1];
      }
      costEl.textContent=cur.d;
      statusEl.textContent='Tìm thấy! Cost='+cur.d;
      renderGrid({visited:state.visited,path:state.path,current:state.current});
      var li=document.createElement('li'); li.textContent='Đến E ('+cur.r+','+cur.c+') cost='+cur.d+' ★'; li.classList.add('step-final'); stepsList.appendChild(li);
      return true;
    }
    highlightPseudo('009-pseudo','4');
    var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    var added=0;
    for(var i=0;i<dirs.length;i++){
      var nr=cur.r+dirs[i][0], nc=cur.c+dirs[i][1];
      if(nr<0||nr>=gridSize||nc<0||nc>=gridSize) continue;
      if(grid[nr][nc].wall) continue;
      var nkey=nr+','+nc;
      if(state.visited[nkey]) continue;
      highlightPseudo('009-pseudo','5');
      var nd=cur.d+grid[nr][nc].w;
      if(nd < state.dist[nkey]){
        state.dist[nkey]=nd; state.parent[nkey]=[cur.r,cur.c];
        state.pq.push({r:nr,c:nc,d:nd}); state.queued[nkey]=true; added++;
      }
    }
    highlightPseudo('009-pseudo','6');
    pqEl.textContent=state.pq.length;
    renderGrid({visited:state.visited,queued:state.queued,current:state.current,path:state.path});
    var li=document.createElement('li'); li.textContent='Visit ('+cur.r+','+cur.c+') d='+cur.d+' → thêm '+added+' neighbor'; stepsList.appendChild(li); stepsCard.hidden=false;
    return false;
  }
  function finish(){
    if(state.found){
      resVal.textContent='Tìm thấy đường! Cost = '+state.dist[(gridSize-1)+','+(gridSize-1)];
    } else {
      resVal.textContent='Không tìm thấy đường từ S đến E.';
    }
    resCard.hidden=false;
  }
  async function handleSolve(){
    resetState();
    state=buildState(); statusEl.textContent='Đang chạy...'; stepsCard.hidden=false;
    highlightPseudo('009-pseudo','1');
    renderGrid({visited:state.visited,queued:state.queued});
    await sleep(300);
    while(!state.done){ doStep(); await sleep(500); }
    finish();
  }
  function handleStep(){
    if(!state){
      resetState();
      state=buildState(); statusEl.textContent='Step mode'; stepsCard.hidden=false;
      highlightPseudo('009-pseudo','1');
      renderGrid({visited:state.visited,queued:state.queued});
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,500);
    }
    autoTimer=setTimeout(tick,500);
  }
  genBtn.addEventListener('click',function(){ generateGrid(0.2); });
  sizeBtn.addEventListener('click',function(){
    gridSize=gridSize===5?7:gridSize===7?10:5;
    generateGrid(0.2);
  });
  solveBtn.addEventListener('click',handleSolve);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',function(){ renderGrid(); resetState(); });
  // init
  generateGrid(0.2);
})();

// ============================================
// 010 Knapsack
// ============================================
(function(){
  var wInput=document.getElementById('010-w'), vInput=document.getElementById('010-v'), capInput=document.getElementById('010-cap');
  var runBtn=document.getElementById('010-run-btn'), randomBtn=document.getElementById('010-random-btn');
  var stepBtn=document.getElementById('010-step-btn'), autoBtn=document.getElementById('010-auto-btn'), resetBtn=document.getElementById('010-reset-btn');
  var err=document.getElementById('010-error'), vizCard=document.getElementById('010-viz-card'), tableEl=document.getElementById('010-dp-table');
  var iEl=document.getElementById('010-i'), wEl=document.getElementById('010-w-val'), dpValEl=document.getElementById('010-dp-val');
  var pickedEl=document.getElementById('010-picked'), pickedList=document.getElementById('010-picked-list');
  var resCard=document.getElementById('010-result-card'), resVal=document.getElementById('010-result-value'), resDet=document.getElementById('010-result-detail');
  var stepsCard=document.getElementById('010-steps-card'), stepsList=document.getElementById('010-steps-list');
  var presets=[
    {w:'2, 3, 4, 5',v:'3, 4, 5, 6',c:'5'},
    {w:'1, 2, 3, 4, 5',v:'1, 4, 4, 5, 7',c:'7'},
    {w:'3, 4, 5, 6',v:'10, 12, 15, 18',c:'10'}
  ];
  var state=null, autoTimer=null, isAuto=false;
  document.getElementById('010-presets').addEventListener('click',function(e){
    var b=e.target.closest('.preset-pill'); if(!b) return;
    var idx=parseInt(b.getAttribute('data-preset'),10);
    wInput.value=presets[idx].w; vInput.value=presets[idx].v; capInput.value=presets[idx].c; clearErr(); hideAll();
    document.querySelectorAll('#010-presets .preset-pill').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
  });
  function showErr(m){ err.textContent=m; }
  function clearErr(){ err.textContent=''; }
  function hideAll(){
    vizCard.hidden=true; resCard.hidden=true; stepsCard.hidden=true; pickedEl.hidden=true;
    tableEl.innerHTML=''; stepsList.innerHTML=''; pickedList.innerHTML='';
    iEl.textContent='0'; wEl.textContent='0'; dpValEl.textContent='0';
    clearPseudo('010-pseudo'); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} isAuto=false; autoBtn.textContent='▶ Tự động'; state=null;
  }
  function renderTable(dp,n,W,curI,curW){
    tableEl.innerHTML='';
    tableEl.style.gridTemplateColumns='repeat('+(W+1)+', 48px)';
    // header row
    for(var w=0;w<=W;w++){
      var h=document.createElement('div'); h.style.cssText='font-size:0.7rem;color:#64748b;text-align:center;font-weight:600;';
      h.textContent=w===0?'w\\i':w; tableEl.appendChild(h);
    }
    for(var i=0;i<=n;i++){
      for(var w=0;w<=W;w++){
        var cell=document.createElement('div');
        cell.style.cssText='width:48px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:JetBrains Mono,monospace;font-size:0.8rem;font-weight:700;border:2px solid #cbd5e1;background:#f1f5f9;color:#334155;';
        cell.textContent=dp[i][w];
        if(i===curI && w===curW){ cell.style.background='#fef3c7'; cell.style.borderColor='#f59e0b'; cell.style.color='#92400e'; cell.style.transform='scale(1.1)'; }
        else if(i<curI || (i===curI && w<curW)) { cell.style.background='#d1fae5'; cell.style.borderColor='#10b981'; cell.style.color='#065f46'; }
        tableEl.appendChild(cell);
      }
    }
  }
  function validate(){
    var wp=parseNumbers(wInput.value); if(!wp.valid){showErr('Weights: '+wp.error); return null;}
    var vp=parseNumbers(vInput.value); if(!vp.valid){showErr('Values: '+vp.error); return null;}
    if(wp.numbers.length!==vp.numbers.length){showErr('Weights và Values phải cùng độ dài.'); return null;}
    var cRaw=capInput.value.trim(); if(cRaw===''){showErr('Vui lòng nhập Capacity W.'); return null;}
    var W=Number(cRaw); if(!Number.isInteger(W)||W<1||W>30){showErr('W phải là số nguyên 1-30.'); return null;}
    for(var i=0;i<wp.numbers.length;i++) if(!Number.isInteger(wp.numbers[i])||wp.numbers[i]<1){showErr('Weight phải là số nguyên ≥1.'); return null;}
    return {w:wp.numbers,v:vp.numbers,W:W,n:wp.numbers.length};
  }
  function buildState(w,v,W,n){
    var dp=[]; for(var i=0;i<=n;i++){ dp[i]=[]; for(var ww=0;ww<=W;ww++) dp[i][ww]=0; }
    return {w:w,v:v,W:W,n:n,dp:dp,i:1,ww:0,done:false,picked:[]};
  }
  function doStep(){
    if(!state||state.done) return true;
    var w=state.w, v=state.v, W=state.W, n=state.n, dp=state.dp;
    if(state.i>n){ state.done=true; return true; }
    var i=state.i, ww=state.ww;
    highlightPseudo('010-pseudo', w[i-1]>ww?'4':'5');
    if(w[i-1] > ww){
      dp[i][ww]=dp[i-1][ww];
    } else {
      dp[i][ww]=Math.max(dp[i-1][ww], dp[i-1][ww-w[i-1]]+v[i-1]);
    }
    iEl.textContent=i; wEl.textContent=ww; dpValEl.textContent=dp[i][ww];
    renderTable(dp,n,W,i,ww);
    var msg='dp['+i+']['+ww+'] w='+w[i-1]+' v='+v[i-1]+' → '+(w[i-1]>ww?'không lấy = dp['+(i-1)+']['+ww+']='+dp[i][ww]:'max('+dp[i-1][ww]+', '+(dp[i-1][ww-w[i-1]])+'+'+v[i-1]+')='+dp[i][ww]);
    var li=document.createElement('li'); li.textContent=msg; stepsList.appendChild(li); stepsCard.hidden=false;
    state.ww++;
    if(state.ww>W){ state.ww=0; state.i++; }
    if(state.i>n) state.done=true;
    return state.done;
  }
  function finish(){
    highlightPseudo('010-pseudo','6');
    var dp=state.dp, n=state.n, W=state.W, w=state.w, v=state.v;
    var best=dp[n][W];
    // traceback
    var picked=[], ww=W;
    for(var i=n;i>=1;i--){
      if(dp[i][ww]!==dp[i-1][ww]){
        picked.push(i-1);
        ww-=w[i-1];
      }
    }
    picked.reverse();
    state.picked=picked;
    pickedList.innerHTML='';
    picked.forEach(function(idx){
      var li=document.createElement('li'); li.textContent='Vật '+idx+' (w='+w[idx]+', v='+v[idx]+')'; pickedList.appendChild(li);
    });
    if(picked.length>0) pickedEl.hidden=false;
    resVal.textContent='Max Value = '+best;
    resDet.textContent=picked.length?('Chọn '+picked.length+' vật: ['+picked.join(', ')+']'):'Không chọn vật nào';
    resCard.hidden=false;
    renderTable(dp,n,W,n,W);
  }
  async function handleRun(){
    clearErr(); hideAll();
    var val=validate(); if(!val) return;
    state=buildState(val.w,val.v,val.W,val.n); vizCard.hidden=false;
    highlightPseudo('010-pseudo','2');
    renderTable(state.dp,val.n,val.W,0,0);
    await sleep(300);
    while(!state.done){ doStep(); await sleep(300); }
    finish();
  }
  function handleStep(){
    if(!state){
      clearErr(); hideAll();
      var val=validate(); if(!val) return;
      state=buildState(val.w,val.v,val.W,val.n); vizCard.hidden=false;
      renderTable(state.dp,val.n,val.W,0,0);
      highlightPseudo('010-pseudo','2');
      return;
    }
    var done=doStep(); if(done) finish();
  }
  function handleAuto(){
    if(isAuto){clearTimeout(autoTimer);isAuto=false;autoBtn.textContent='▶ Tự động';return;}
    if(!state){handleStep(); if(!state) return;}
    isAuto=true; autoBtn.textContent='⏸ Dừng';
    function tick(){
      if(!state||state.done){isAuto=false;autoBtn.textContent='▶ Tự động'; if(state&&state.done) finish(); return;}
      var done=doStep(); if(done){isAuto=false;autoBtn.textContent='▶ Tự động'; finish(); return;}
      autoTimer=setTimeout(tick,300);
    }
    autoTimer=setTimeout(tick,300);
  }
  function handleRandom(){
    var n=Math.floor(Math.random()*3)+3;
    var w=[], v=[];
    for(var i=0;i<n;i++){ w.push(Math.floor(Math.random()*5)+1); v.push(Math.floor(Math.random()*10)+1); }
    var W=Math.floor(Math.random()*8)+5;
    wInput.value=w.join(', '); vInput.value=v.join(', '); capInput.value=W;
    clearErr(); hideAll();
  }
  runBtn.addEventListener('click',handleRun);
  stepBtn.addEventListener('click',handleStep);
  autoBtn.addEventListener('click',handleAuto);
  resetBtn.addEventListener('click',hideAll);
  randomBtn.addEventListener('click',handleRandom);
})();

})();
