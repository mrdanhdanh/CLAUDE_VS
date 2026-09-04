export const manifest = {
  id: 'game-lab',
  name: 'Game Lab',
  version: '1.0.0',
  category: 'game',
  description: 'Mini game engine — Snake, Pong, Particle sandbox.',
  dependencies: [],
  permissions: [],
  lazy: true,
  icon: '🎮',
};

let els = {};
let ctxRef = null;
let rafId = null;
let game = 'snake';
let state = 'idle'; // idle/playing/paused/gameover
let score = 0;
let highScore = 0;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let tickInterval = 120;
let lastTick = 0;
let pong = { ball: { x: 200, y: 200, vx: 3, vy: 2 }, paddleL: 150, paddleR: 150, scoreL: 0, scoreR: 0 };
let particles = [];
let keys = {};

const GRID = 20;
const CANVAS_SIZE = 400;

function randFood() {
  return { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) };
}
function resetSnake() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
  food = randFood();
  score = 0;
}
function resetPong() {
  pong = { ball: { x: 200, y: 200, vx: 3, vy: 2 }, paddleL: 150, paddleR: 150, scoreL: 0, scoreR: 0 };
  score = 0;
}
function resetParticles() {
  particles = [];
  score = 0;
}

function drawSnake(ctx) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
  // grid
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  for(let i=0;i<=GRID;i++) {
    ctx.beginPath(); ctx.moveTo(i*20,0); ctx.lineTo(i*20,CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*20); ctx.lineTo(CANVAS_SIZE,i*20); ctx.stroke();
  }
  // food
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(food.x*20+10, food.y*20+10, 8, 0, Math.PI*2); ctx.fill();
  // snake
  snake.forEach((seg,i) => {
    ctx.fillStyle = i===0 ? '#6366f1' : '#818cf8';
    ctx.fillRect(seg.x*20+1, seg.y*20+1, 18, 18);
    if(i===0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(seg.x*20+7, seg.y*20+7, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(seg.x*20+13, seg.y*20+7, 2, 0, Math.PI*2); ctx.fill();
    }
  });
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  if(state==='paused') {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    ctx.fillStyle = '#fff'; ctx.font = '700 20px Inter'; ctx.textAlign='center';
    ctx.fillText('PAUSED', CANVAS_SIZE/2, CANVAS_SIZE/2); ctx.textAlign='left';
  }
  if(state==='gameover') {
    ctx.fillStyle = 'rgba(239,68,68,.85)'; ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    ctx.fillStyle = '#fff'; ctx.font = '700 20px Inter'; ctx.textAlign='center';
    ctx.fillText('GAME OVER', CANVAS_SIZE/2, CANVAS_SIZE/2 -10);
    ctx.font = '500 13px Inter'; ctx.fillText(`Score: ${score} — Press Restart`, CANVAS_SIZE/2, CANVAS_SIZE/2+16); ctx.textAlign='left';
  }
}
function updateSnake() {
  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  // wall collision
  if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID) { state='gameover'; highScore=Math.max(highScore,score); return; }
  // self collision
  if(snake.some(s=>s.x===head.x&&s.y===head.y)) { state='gameover'; highScore=Math.max(highScore,score); return; }
  snake.unshift(head);
  if(head.x===food.x&&head.y===food.y) {
    score+=10;
    food=randFood();
    // avoid spawn on snake
    while(snake.some(s=>s.x===food.x&&s.y===food.y)) food=randFood();
  } else {
    snake.pop();
  }
}

function drawPong(ctx) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
  // center line
  ctx.strokeStyle = 'rgba(255,255,255,.15)';
  ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(CANVAS_SIZE/2,0); ctx.lineTo(CANVAS_SIZE/2,CANVAS_SIZE); ctx.stroke(); ctx.setLineDash([]);
  // paddles
  ctx.fillStyle = '#fff';
  ctx.fillRect(10, pong.paddleL, 10, 80);
  ctx.fillRect(CANVAS_SIZE-20, pong.paddleR, 10, 80);
  // ball
  ctx.fillStyle = '#6366f1';
  ctx.beginPath(); ctx.arc(pong.ball.x, pong.ball.y, 8, 0, Math.PI*2); ctx.fill();
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '700 24px Inter'; ctx.textAlign='center';
  ctx.fillText(`${pong.scoreL}  ${pong.scoreR}`, CANVAS_SIZE/2, 30); ctx.textAlign='left';
  ctx.font = '500 12px Inter'; ctx.fillText(`Score: ${score}`, 10, 20);
  if(state==='paused') {
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    ctx.fillStyle='#fff'; ctx.font='700 20px Inter'; ctx.textAlign='center'; ctx.fillText('PAUSED',CANVAS_SIZE/2,CANVAS_SIZE/2); ctx.textAlign='left';
  }
}
function updatePong() {
  const b = pong.ball;
  b.x += b.vx; b.y += b.vy;
  if(b.y<8||b.y>CANVAS_SIZE-8) b.vy*=-1;
  // paddle collision
  if(b.x<20 && b.y>pong.paddleL && b.y<pong.paddleL+80) { b.vx=Math.abs(b.vx); b.vx+=0.2; }
  if(b.x>CANVAS_SIZE-20 && b.y>pong.paddleR && b.y<pong.paddleR+80) { b.vx=-Math.abs(b.vx); b.vx-=0.2; }
  // score
  if(b.x<0) { pong.scoreR++; score=Math.max(score,pong.scoreR); b.x=CANVAS_SIZE/2; b.y=CANVAS_SIZE/2; b.vx=3; }
  if(b.x>CANVAS_SIZE) { pong.scoreL++; score=Math.max(score,pong.scoreL); b.x=CANVAS_SIZE/2; b.y=CANVAS_SIZE/2; b.vx=-3; }
  // AI for right paddle
  const target = b.y -40;
  pong.paddleR += (target - pong.paddleR)*0.08;
  pong.paddleR = Math.max(0, Math.min(CANVAS_SIZE-80, pong.paddleR));
  // left paddle follows keys
  if(keys['w']||keys['arrowup']) pong.paddleL = Math.max(0, pong.paddleL-6);
  if(keys['s']||keys['arrowdown']) pong.paddleL = Math.min(CANVAS_SIZE-80, pong.paddleL+6);
}

function drawParticles(ctx) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
  particles.forEach(p=>{
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.fillStyle='#fff'; ctx.font='500 12px Inter'; ctx.fillText(`Particles: ${particles.length} — Click to emit`,10,20);
}
function updateParticles() {
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.008; p.r*=0.99;
  });
  particles = particles.filter(p=>p.life>0&&p.r>0.5);
}

function loop(ts) {
  if(state!=='playing') {
    // still draw paused/gameover
    const ctx = els.canvas?.getContext('2d');
    if(ctx) {
      if(game==='snake') drawSnake(ctx);
      else if(game==='pong') drawPong(ctx);
      else drawParticles(ctx);
    }
    rafId = requestAnimationFrame(loop);
    return;
  }
  const ctx = els.canvas?.getContext('2d');
  if(!ctx) { rafId=requestAnimationFrame(loop); return; }
  if(game==='snake') {
    if(ts - lastTick > tickInterval) {
      updateSnake();
      lastTick = ts;
      if(els.score) els.score.textContent = score;
    }
    drawSnake(ctx);
  } else if(game==='pong') {
    updatePong();
    drawPong(ctx);
    if(els.score) els.score.textContent = score;
  } else {
    updateParticles();
    drawParticles(ctx);
  }
  rafId = requestAnimationFrame(loop);
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  try { const raw=localStorage.getItem('web-universe:game-lab'); if(raw){ const p=JSON.parse(raw); highScore=p.highScore||0; }}catch{}
  resetSnake();
  container.innerHTML = `
    <div class="game-toolbar">
      <div class="game-tabs" role="tablist" aria-label="Games">
        <button class="game-tab ${game==='snake'?'active':''}" data-game="snake">🐍 Snake</button>
        <button class="game-tab ${game==='pong'?'active':''}" data-game="pong">🏓 Pong</button>
        <button class="game-tab ${game==='particles'?'active':''}" data-game="particles">✨ Particles</button>
      </div>
      <div class="game-stats">
        <span>Score: <b id="gameScore">0</b></span>
        <span>High: <b id="gameHigh">${highScore}</b></span>
        <button class="btn btn-primary btn-xs" data-action="start">Start</button>
        <button class="btn btn-ghost btn-xs" data-action="pause">Pause</button>
        <button class="btn btn-ghost btn-xs" data-action="restart">Restart</button>
      </div>
    </div>
    <div style="display:flex;justify-content:center;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px">
      <canvas id="gameCanvas" width="400" height="400" style="width:400px;height:400px;max-width:100%;background:#0f172a;border-radius:8px;display:block" tabindex="0" aria-label="Game canvas"></canvas>
    </div>
    <div class="muted small" style="margin-top:8px;text-align:center">
      <span id="gameHint">Snake: Arrow/WASD to move · Pong: W/S or ↑/↓ · Particles: Click canvas</span>
    </div>
  `;
  els = {
    canvas: container.querySelector('#gameCanvas'),
    score: container.querySelector('#gameScore'),
    high: container.querySelector('#gameHigh'),
    hint: container.querySelector('#gameHint'),
  };
  // Tabs
  container.querySelectorAll('.game-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      game=btn.dataset.game;
      container.querySelectorAll('.game-tab').forEach(b=>b.classList.toggle('active',b.dataset.game===game));
      if(game==='snake') { resetSnake(); els.hint.textContent='Snake: Arrow/WASD to move'; }
      else if(game==='pong') { resetPong(); els.hint.textContent='Pong: W/S or ↑/↓ to move left paddle'; }
      else { resetParticles(); els.hint.textContent='Particles: Click canvas to emit'; }
      state='idle'; els.score.textContent='0';
      try{ localStorage.setItem('web-universe:game-lab', JSON.stringify({highScore})); }catch{}
    });
  });
  container.querySelector('[data-action="start"]')?.addEventListener('click',()=>{
    if(state==='gameover') { if(game==='snake') resetSnake(); else if(game==='pong') resetPong(); else resetParticles(); }
    state='playing'; lastTick=performance.now();
    els.canvas.focus();
  });
  container.querySelector('[data-action="pause"]')?.addEventListener('click',()=>{
    if(state==='playing') state='paused';
    else if(state==='paused') { state='playing'; lastTick=performance.now(); }
  });
  container.querySelector('[data-action="restart"]')?.addEventListener('click',()=>{
    if(game==='snake') resetSnake();
    else if(game==='pong') resetPong();
    else resetParticles();
    state='idle'; els.score.textContent='0';
  });
  // Input
  const keyHandler = (e)=>{
    const k=e.key.toLowerCase();
    keys[k]=true;
    if(game==='snake'&&state==='playing') {
      if(k==='arrowup'||k==='w') { if(dir.y===0) nextDir={x:0,y:-1}; e.preventDefault(); }
      if(k==='arrowdown'||k==='s') { if(dir.y===0) nextDir={x:0,y:1}; e.preventDefault(); }
      if(k==='arrowleft'||k==='a') { if(dir.x===0) nextDir={x:-1,y:0}; e.preventDefault(); }
      if(k==='arrowright'||k==='d') { if(dir.x===0) nextDir={x:1,y:0}; e.preventDefault(); }
    }
    if(k===' '){ e.preventDefault(); if(state==='playing') state='paused'; else if(state==='paused') { state='playing'; lastTick=performance.now(); } }
  };
  const keyUpHandler=(e)=>{ keys[e.key.toLowerCase()]=false; };
  window.addEventListener('keydown',keyHandler);
  window.addEventListener('keyup',keyUpHandler);
  els._keyHandler=keyHandler; els._keyUpHandler=keyUpHandler;
  // Particles click
  els.canvas.addEventListener('pointerdown',(e)=>{
    if(game!=='particles') return;
    const rect=els.canvas.getBoundingClientRect();
    const scaleX=400/rect.width, scaleY=400/rect.height;
    const x=(e.clientX-rect.left)*scaleX, y=(e.clientY-rect.top)*scaleY;
    for(let i=0;i<20;i++){
      const angle=Math.random()*Math.PI*2, speed=Math.random()*4+1;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-2,r:Math.random()*4+2,life:1,color:`hsl(${200+Math.random()*60},80%,60%)`});
    }
    if(state!=='playing') state='playing';
  });
  // Start loop
  state='idle';
  loop(performance.now());
  ctxRef?.logger?.info('game-lab: mounted', {game});
}

export async function pause() {
  if(state==='playing') state='paused';
  if(rafId) cancelAnimationFrame(rafId);
  rafId=null;
}
export async function resume() {
  if(state==='paused') state='playing';
  if(!rafId) loop(performance.now());
}
export async function unmount() {
  if(rafId) cancelAnimationFrame(rafId);
  rafId=null;
  if(els._keyHandler) window.removeEventListener('keydown',els._keyHandler);
  if(els._keyUpHandler) window.removeEventListener('keyup',els._keyUpHandler);
  try{ localStorage.setItem('web-universe:game-lab', JSON.stringify({highScore:Math.max(highScore,score)})); }catch{}
  els={}; ctxRef=null; state='idle';
}
export async function destroy(){ await unmount(); }
