export const manifest = {
  id: 'audio-lab',
  name: 'Media Lab',
  version: '1.0.0',
  category: 'media',
  description: 'Audio/Video/Camera/Microphone/Screen Recorder — capability-aware.',
  dependencies: [],
  permissions: ['camera', 'microphone'],
  lazy: true,
  icon: '🎵',
};

let els = {};
let ctxRef = null;
let activeTab = 'audio';
let audioEl = null;
let videoEl = null;
let cameraStream = null;
let micStream = null;
let micRecorder = null;
let micChunks = [];
let recorderStream = null;
let recorder = null;
let recorderChunks = [];
let audioCtx = null;
let analyser = null;
let rafId = null;
let micAnalyser = null;
let micRaf = null;

const STORAGE_KEY = 'web-universe:audio-lab';

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function saveState(extra={}) {
  try {
    const data = { activeTab, audioVolume: audioEl?.volume ?? 1, videoSpeed: videoEl?.playbackRate ?? 1, ...extra };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
function hasAPI(name) {
  const checks = {
    audio: () => !!window.AudioContext || !!window.webkitAudioContext,
    video: () => !!document.createElement('video').canPlayType,
    camera: () => !!navigator.mediaDevices?.getUserMedia,
    mic: () => !!navigator.mediaDevices?.getUserMedia,
    recorder: () => !!navigator.mediaDevices?.getDisplayMedia && !!window.MediaRecorder,
    pip: () => !!document.pictureInPictureEnabled && !!HTMLVideoElement.prototype.requestPictureInPicture,
    fullscreen: () => !!document.documentElement.requestFullscreen,
  };
  try { return checks[name] ? checks[name]() : false; } catch { return false; }
}

function stopTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach(t => t.stop());
}

function drawWaveform(canvas, analyserNode) {
  if (!canvas || !analyserNode) return;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  function draw() {
    rafId = requestAnimationFrame(draw);
    analyserNode.getByteFrequencyData(dataArray);
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0,0,w,h);
    const barWidth = (w / bufferLength) * 2.5;
    let x = 0;
    for (let i=0;i<bufferLength;i++) {
      const barHeight = (dataArray[i] / 255) * h * 0.9;
      const hue = 240 + (dataArray[i]/255)*40;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);
      x += barWidth + 1;
      if (x > w) break;
    }
  }
  draw();
}
function drawMicLevel(canvas, analyserNode) {
  if (!canvas || !analyserNode) return;
  const ctx = canvas.getContext('2d');
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  function draw() {
    micRaf = requestAnimationFrame(draw);
    analyserNode.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i=0;i<dataArray.length;i++) { const v = (dataArray[i]-128)/128; sum += v*v; }
    const rms = Math.sqrt(sum / dataArray.length);
    const level = Math.min(1, rms * 3);
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = level > 0.6 ? '#ef4444' : level > 0.3 ? '#f59e0b' : '#10b981';
    ctx.fillRect(0,0, w * level, h);
    // ticks
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    for (let i=1;i<4;i++) ctx.fillRect((w/4)*i, 0, 1, h);
  }
  draw();
}

export async function mount(container, ctx) {
  ctxRef = ctx;
  let saved = {};
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) saved = JSON.parse(raw); } catch {}
  activeTab = saved.activeTab || 'audio';

  container.innerHTML = `
    <div class="media-tabs" role="tablist" aria-label="Media tabs">
      <button class="media-tab ${activeTab==='audio'?'active':''}" data-tab="audio" role="tab" aria-selected="${activeTab==='audio'}">🎵 Audio</button>
      <button class="media-tab ${activeTab==='video'?'active':''}" data-tab="video" role="tab" aria-selected="${activeTab==='video'}">🎬 Video</button>
      <button class="media-tab ${activeTab==='camera'?'active':''}" data-tab="camera" role="tab" aria-selected="${activeTab==='camera'}">📷 Camera</button>
      <button class="media-tab ${activeTab==='mic'?'active':''}" data-tab="mic" role="tab" aria-selected="${activeTab==='mic'}">🎙 Mic</button>
      <button class="media-tab ${activeTab==='recorder'?'active':''}" data-tab="recorder" role="tab" aria-selected="${activeTab==='recorder'}">⏺ Recorder</button>
    </div>

    <div class="media-pane ${activeTab==='audio'?'active':''}" data-pane="audio">
      <div class="media-capability">${hasAPI('audio') ? '✓ Web Audio API supported' : '✗ Web Audio not supported'}</div>
      <audio id="mediaAudio" controls preload="metadata" style="width:100%;margin-top:8px" crossorigin="anonymous"></audio>
      <div class="media-controls">
        <button class="btn btn-primary btn-sm" data-action="audio-play">▶ Play</button>
        <button class="btn btn-ghost btn-sm" data-action="audio-pause">⏸ Pause</button>
        <label class="small" style="display:flex;align-items:center;gap:6px">Vol <input type="range" id="audioVol" min="0" max="100" value="${Math.round((saved.audioVolume??1)*100)}" style="width:90px" /></label>
        <label class="small" style="display:flex;align-items:center;gap:6px">Speed <select id="audioRate"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>
        <input type="file" id="audioFile" accept="audio/*" style="display:none" />
        <button class="btn btn-ghost btn-sm" data-action="audio-pick">Pick File</button>
        <button class="btn btn-ghost btn-sm" data-action="audio-sample">Sample</button>
      </div>
      <div class="media-playlist" id="audioPlaylist"></div>
      <canvas id="audioWave" width="640" height="80" style="width:100%;height:80px;background:#0f172a;border-radius:8px;margin-top:8px;display:block"></canvas>
      <div class="muted small" style="margin-top:6px">Waveform via Web Audio Analyser — requires play</div>
    </div>

    <div class="media-pane ${activeTab==='video'?'active':''}" data-pane="video">
      <div class="media-capability">${hasAPI('video') ? '✓ Video supported' : '✗ Video not supported'} · ${hasAPI('pip') ? '✓ PiP' : '✗ PiP not supported'} · ${hasAPI('fullscreen') ? '✓ Fullscreen' : '✗ Fullscreen not supported'}</div>
      <video id="mediaVideo" controls preload="metadata" style="width:100%;max-height:300px;background:#000;border-radius:10px;margin-top:8px" crossorigin="anonymous"></video>
      <div class="media-controls">
        <label class="small" style="display:flex;align-items:center;gap:6px">Speed <select id="videoRate"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>
        <button class="btn btn-ghost btn-sm" data-action="video-pip">PiP</button>
        <button class="btn btn-ghost btn-sm" data-action="video-fs">Fullscreen</button>
        <input type="file" id="videoFile" accept="video/*" style="display:none" />
        <button class="btn btn-ghost btn-sm" data-action="video-pick">Pick File</button>
        <button class="btn btn-ghost btn-sm" data-action="video-sample">Sample</button>
      </div>
      <div class="muted small" style="margin-top:6px">Subtitle: <code>track</code> support via &lt;track&gt; — add .vtt via file picker (future)</div>
    </div>

    <div class="media-pane ${activeTab==='camera'?'active':''}" data-pane="camera">
      <div class="media-capability">${hasAPI('camera') ? '✓ Camera API supported' : '✗ Camera not supported'}</div>
      <video id="cameraPreview" autoplay playsinline muted style="width:100%;max-height:300px;background:#000;border-radius:10px;margin-top:8px"></video>
      <canvas id="cameraCanvas" width="640" height="360" style="display:none"></canvas>
      <div class="media-controls">
        <button class="btn btn-primary btn-sm" data-action="cam-start">Start Camera</button>
        <button class="btn btn-ghost btn-sm" data-action="cam-capture">Capture</button>
        <button class="btn btn-ghost btn-sm" data-action="cam-switch">Switch</button>
        <button class="btn btn-ghost btn-sm" data-action="cam-stop">Stop</button>
      </div>
      <div id="cameraGallery" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>
      <div class="muted small" id="cameraInfo" style="margin-top:6px"></div>
    </div>

    <div class="media-pane ${activeTab==='mic'?'active':''}" data-pane="mic">
      <div class="media-capability">${hasAPI('mic') ? '✓ Microphone API supported' : '✗ Mic not supported'}</div>
      <canvas id="micLevel" width="640" height="24" style="width:100%;height:24px;background:#1e293b;border-radius:6px;margin-top:8px;display:block"></canvas>
      <div class="media-controls">
        <button class="btn btn-primary btn-sm" data-action="mic-start">Start Mic</button>
        <button class="btn btn-ghost btn-sm" data-action="mic-record">● Record</button>
        <button class="btn btn-ghost btn-sm" data-action="mic-stop" disabled>■ Stop</button>
        <button class="btn btn-ghost btn-sm" data-action="mic-play" disabled>▶ Playback</button>
      </div>
      <audio id="micPlayback" controls style="width:100%;margin-top:8px;display:none"></audio>
      <div class="muted small" id="micInfo" style="margin-top:6px"></div>
    </div>

    <div class="media-pane ${activeTab==='recorder'?'active':''}" data-pane="recorder">
      <div class="media-capability">${hasAPI('recorder') ? '✓ Screen Capture + MediaRecorder supported' : '⚠ Screen Capture or MediaRecorder not supported'}</div>
      <video id="recorderPreview" autoplay playsinline muted style="width:100%;max-height:300px;background:#000;border-radius:10px;margin-top:8px"></video>
      <div class="media-controls">
        <button class="btn btn-primary btn-sm" data-action="rec-start">Start Capture</button>
        <button class="btn btn-ghost btn-sm" data-action="rec-pause" disabled>Pause</button>
        <button class="btn btn-ghost btn-sm" data-action="rec-resume" disabled>Resume</button>
        <button class="btn btn-ghost btn-sm" data-action="rec-stop" disabled>Stop</button>
        <button class="btn btn-ghost btn-sm" data-action="rec-export" disabled>Export webm</button>
      </div>
      <video id="recorderPlayback" controls style="width:100%;max-height:300px;background:#000;border-radius:10px;margin-top:8px;display:none"></video>
      <div class="muted small" id="recorderInfo" style="margin-top:6px"></div>
    </div>
  `;

  els = {
    audio: container.querySelector('#mediaAudio'),
    audioWave: container.querySelector('#audioWave'),
    audioVol: container.querySelector('#audioVol'),
    audioRate: container.querySelector('#audioRate'),
    audioFile: container.querySelector('#audioFile'),
    video: container.querySelector('#mediaVideo'),
    videoRate: container.querySelector('#videoRate'),
    videoFile: container.querySelector('#videoFile'),
    cameraPreview: container.querySelector('#cameraPreview'),
    cameraCanvas: container.querySelector('#cameraCanvas'),
    cameraGallery: container.querySelector('#cameraGallery'),
    cameraInfo: container.querySelector('#cameraInfo'),
    micLevel: container.querySelector('#micLevel'),
    micPlayback: container.querySelector('#micPlayback'),
    micInfo: container.querySelector('#micInfo'),
    recorderPreview: container.querySelector('#recorderPreview'),
    recorderPlayback: container.querySelector('#recorderPlayback'),
    recorderInfo: container.querySelector('#recorderInfo'),
  };
  audioEl = els.audio;
  videoEl = els.video;

  // Tabs
  container.querySelectorAll('.media-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.media-tab').forEach(b => {
        const active = b.dataset.tab===activeTab;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      container.querySelectorAll('.media-pane').forEach(p => p.classList.toggle('active', p.dataset.pane===activeTab));
      saveState();
    });
  });

  // Audio
  const sampleAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const sampleVideo = 'https://www.w3schools.com/html/mov_bbb.mp4';
  // Playlist
  const playlist = [
    { name: 'Sample 1 — SoundHelix', url: sampleAudio },
    { name: 'Sample 2 — BBB Video (audio)', url: sampleVideo },
  ];
  const playlistEl = container.querySelector('#audioPlaylist');
  if (playlistEl) {
    playlistEl.innerHTML = playlist.map((p,i)=> `<button class="btn btn-ghost btn-xs" data-audio-idx="${i}">${escapeHtml(p.name)}</button>`).join(' ');
    playlistEl.querySelectorAll('[data-audio-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.audioIdx,10);
        audioEl.src = playlist[idx].url;
        audioEl.play().catch(()=>{});
        setupAudioAnalyser();
      });
    });
  }
  function setupAudioAnalyser() {
    try {
      if (!hasAPI('audio')) return;
      if (audioCtx) { try{ audioCtx.close(); }catch{} }
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaElementSource(audioEl);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      if (rafId) cancelAnimationFrame(rafId);
      drawWaveform(els.audioWave, analyser);
    } catch (e) { console.warn('audio analyser', e.message); }
  }
  container.querySelector('[data-action="audio-play"]')?.addEventListener('click', () => {
    if (!audioEl.src) audioEl.src = sampleAudio;
    audioEl.play().catch(e=> { els.audioWave.nextElementSibling.textContent = 'Play failed: ' + e.message; });
    if (audioCtx?.state==='suspended') audioCtx.resume();
    setupAudioAnalyser();
  });
  container.querySelector('[data-action="audio-pause"]')?.addEventListener('click', () => audioEl.pause());
  els.audioVol?.addEventListener('input', () => { audioEl.volume = parseInt(els.audioVol.value,10)/100; saveState(); });
  els.audioRate?.addEventListener('change', () => { audioEl.playbackRate = parseFloat(els.audioRate.value); });
  container.querySelector('[data-action="audio-pick"]')?.addEventListener('click', () => els.audioFile.click());
  els.audioFile?.addEventListener('change', () => {
    const file = els.audioFile.files?.[0];
    if (!file) return;
    audioEl.src = URL.createObjectURL(file);
    audioEl.play().catch(()=>{});
    setupAudioAnalyser();
  });
  container.querySelector('[data-action="audio-sample"]')?.addEventListener('click', () => {
    audioEl.src = sampleAudio;
    audioEl.play().catch(()=>{});
    setupAudioAnalyser();
  });

  // Video
  container.querySelector('[data-action="video-sample"]')?.addEventListener('click', () => {
    videoEl.src = sampleVideo;
    videoEl.play().catch(()=>{});
  });
  container.querySelector('[data-action="video-pick"]')?.addEventListener('click', () => els.videoFile.click());
  els.videoFile?.addEventListener('change', () => {
    const file = els.videoFile.files?.[0];
    if (!file) return;
    videoEl.src = URL.createObjectURL(file);
    videoEl.play().catch(()=>{});
  });
  els.videoRate?.addEventListener('change', () => { videoEl.playbackRate = parseFloat(els.videoRate.value); saveState(); });
  container.querySelector('[data-action="video-pip"]')?.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoEl.requestPictureInPicture();
    } catch (e) { alert('PiP failed: ' + e.message); }
  });
  container.querySelector('[data-action="video-fs"]')?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await videoEl.requestFullscreen();
    } catch (e) { alert('Fullscreen failed: ' + e.message); }
  });
  // Default video sample
  videoEl.src = sampleVideo;

  // Camera
  let cameraFacing = 'user';
  let cameraDevices = [];
  async function listCameraDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameraDevices = devices.filter(d=>d.kind==='videoinput');
      els.cameraInfo.textContent = `${cameraDevices.length} camera(s) found`;
    } catch {}
  }
  listCameraDevices();
  container.querySelector('[data-action="cam-start"]')?.addEventListener('click', async () => {
    try {
      if (cameraStream) stopTracks(cameraStream);
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing }, audio: false });
      els.cameraPreview.srcObject = cameraStream;
      els.cameraInfo.textContent = 'Camera started — ' + cameraStream.getVideoTracks()[0]?.label;
      await listCameraDevices();
    } catch (e) {
      els.cameraInfo.textContent = 'Camera failed: ' + e.message;
      els.cameraInfo.style.color = 'var(--danger)';
    }
  });
  container.querySelector('[data-action="cam-capture"]')?.addEventListener('click', () => {
    if (!cameraStream) { els.cameraInfo.textContent = 'Start camera first'; return; }
    const canvas = els.cameraCanvas;
    const video = els.cameraPreview;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = url; img.style.width='120px'; img.style.height='auto'; img.style.borderRadius='8px'; img.style.border='1px solid var(--border)';
    img.title = 'Click to download';
    img.style.cursor='pointer';
    img.addEventListener('click', () => {
      const a=document.createElement('a'); a.href=url; a.download='capture.png'; a.click();
    });
    els.cameraGallery.appendChild(img);
  });
  container.querySelector('[data-action="cam-switch"]')?.addEventListener('click', async () => {
    cameraFacing = cameraFacing==='user' ? 'environment' : 'user';
    // If stream active, restart
    if (cameraStream) {
      stopTracks(cameraStream);
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } });
        els.cameraPreview.srcObject = cameraStream;
      } catch (e) { els.cameraInfo.textContent = 'Switch failed: ' + e.message; }
    } else {
      els.cameraInfo.textContent = `Facing: ${cameraFacing} — click Start`;
    }
  });
  container.querySelector('[data-action="cam-stop"]')?.addEventListener('click', () => {
    stopTracks(cameraStream); cameraStream=null;
    els.cameraPreview.srcObject=null;
    els.cameraInfo.textContent='Camera stopped';
  });

  // Mic
  container.querySelector('[data-action="mic-start"]')?.addEventListener('click', async () => {
    try {
      if (micStream) stopTracks(micStream);
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      els.micInfo.textContent = 'Mic started — ' + (micStream.getAudioTracks()[0]?.label || 'default');
      els.micInfo.style.color = 'var(--text-2)';
      // Analyser for level
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(micStream);
        micAnalyser = ctx.createAnalyser();
        micAnalyser.fftSize = 256;
        src.connect(micAnalyser);
        if (micRaf) cancelAnimationFrame(micRaf);
        drawMicLevel(els.micLevel, micAnalyser);
      } catch {}
    } catch (e) {
      els.micInfo.textContent = 'Mic failed: ' + e.message;
      els.micInfo.style.color = 'var(--danger)';
    }
  });
  container.querySelector('[data-action="mic-record"]')?.addEventListener('click', () => {
    if (!micStream) { els.micInfo.textContent='Start mic first'; return; }
    micChunks = [];
    micRecorder = new MediaRecorder(micStream);
    micRecorder.ondataavailable = e => { if (e.data.size>0) micChunks.push(e.data); };
    micRecorder.onstop = () => {
      const blob = new Blob(micChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      els.micPlayback.src = url;
      els.micPlayback.style.display='block';
      container.querySelector('[data-action="mic-play"]').disabled=false;
      els.micInfo.textContent = `Recorded ${Math.round(blob.size/1024)}KB — ready to playback`;
    };
    micRecorder.start();
    els.micInfo.textContent='Recording…';
    container.querySelector('[data-action="mic-stop"]').disabled=false;
    container.querySelector('[data-action="mic-record"]').disabled=true;
  });
  container.querySelector('[data-action="mic-stop"]')?.addEventListener('click', () => {
    if (micRecorder && micRecorder.state!=='inactive') micRecorder.stop();
    container.querySelector('[data-action="mic-stop"]').disabled=true;
    container.querySelector('[data-action="mic-record"]').disabled=false;
  });
  container.querySelector('[data-action="mic-play"]')?.addEventListener('click', () => {
    els.micPlayback.play().catch(()=>{});
  });

  // Recorder (screen)
  const recStartBtn = container.querySelector('[data-action="rec-start"]');
  const recPauseBtn = container.querySelector('[data-action="rec-pause"]');
  const recResumeBtn = container.querySelector('[data-action="rec-resume"]');
  const recStopBtn = container.querySelector('[data-action="rec-stop"]');
  const recExportBtn = container.querySelector('[data-action="rec-export"]');
  recStartBtn?.addEventListener('click', async () => {
    try {
      if (recorderStream) stopTracks(recorderStream);
      recorderStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      els.recorderPreview.srcObject = recorderStream;
      els.recorderInfo.textContent='Capture started — recording…';
      recorderChunks=[];
      recorder = new MediaRecorder(recorderStream, { mimeType: 'video/webm;codecs=vp9' });
      // Fallback mime
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        recorder = new MediaRecorder(recorderStream);
      }
      recorder.ondataavailable = e => { if(e.data.size>0) recorderChunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recorderChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        els.recorderPlayback.src = url;
        els.recorderPlayback.style.display='block';
        recExportBtn.disabled=false;
        els.recorderInfo.textContent=`Recorded ${Math.round(blob.size/1024)}KB — ready to export`;
      };
      recorder.start(100);
      recStartBtn.disabled=true; recPauseBtn.disabled=false; recStopBtn.disabled=false;
      // Stop when track ends
      recorderStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorder && recorder.state!=='inactive') recorder.stop();
        recStartBtn.disabled=false; recPauseBtn.disabled=true; recResumeBtn.disabled=true; recStopBtn.disabled=true;
      });
    } catch (e) {
      els.recorderInfo.textContent='Capture failed: ' + e.message;
      els.recorderInfo.style.color='var(--danger)';
    }
  });
  recPauseBtn?.addEventListener('click', () => {
    if (recorder && recorder.state==='recording') { recorder.pause(); recPauseBtn.disabled=true; recResumeBtn.disabled=false; els.recorderInfo.textContent='Paused'; }
  });
  recResumeBtn?.addEventListener('click', () => {
    if (recorder && recorder.state==='paused') { recorder.resume(); recPauseBtn.disabled=false; recResumeBtn.disabled=true; els.recorderInfo.textContent='Recording…'; }
  });
  recStopBtn?.addEventListener('click', () => {
    if (recorder && recorder.state!=='inactive') recorder.stop();
    stopTracks(recorderStream); recorderStream=null;
    els.recorderPreview.srcObject=null;
    recStartBtn.disabled=false; recPauseBtn.disabled=true; recResumeBtn.disabled=true; recStopBtn.disabled=true;
  });
  recExportBtn?.addEventListener('click', () => {
    if (recorderChunks.length===0) return;
    const blob = new Blob(recorderChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='recording.webm'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });

  ctxRef?.logger?.info('audio-lab: mounted', { activeTab });
}

export async function pause() {
  if (rafId) cancelAnimationFrame(rafId);
  if (micRaf) cancelAnimationFrame(micRaf);
  // Pause media
  try { audioEl?.pause(); } catch {}
  try { videoEl?.pause(); } catch {}
}
export async function resume() {
  // Resume waveform if audio playing
  if (audioEl && !audioEl.paused && analyser) drawWaveform(els.audioWave, analyser);
  if (micAnalyser) drawMicLevel(els.micLevel, micAnalyser);
}
export async function unmount() {
  if (rafId) cancelAnimationFrame(rafId);
  if (micRaf) cancelAnimationFrame(micRaf);
  rafId=null; micRaf=null;
  stopTracks(cameraStream); cameraStream=null;
  stopTracks(micStream); micStream=null;
  stopTracks(recorderStream); recorderStream=null;
  if (recorder && recorder.state!=='inactive') try{ recorder.stop(); }catch{}
  if (micRecorder && micRecorder.state!=='inactive') try{ micRecorder.stop(); }catch{}
  if (audioCtx) try{ audioCtx.close(); }catch{}
  audioCtx=null; analyser=null; micAnalyser=null;
  els={}; audioEl=null; videoEl=null; ctxRef=null;
}
export async function destroy() { await unmount(); }
