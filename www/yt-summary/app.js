/* YT Summary — app.js (v1)
 * 3 lane: (1) Issue prefill / PAT dispatch → CI · (2) paste .vtt → chạy ngay trong trang (+ dịch MyMemory CORS)
 * Mọi fetch nội bộ qua dirBase() — chống 404 khi URL không có '/' cuối (KN-030).
 */
import * as P from './pipeline.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const els = {
  url: $('#urlInput'), issue: $('#btnIssue'), toggleToken: $('#btnToggleToken'), tokenPanel: $('#tokenPanel'),
  pat: $('#patInput'), repo: $('#repoInput'), clearPat: $('#btnClearPat'), dispatch: $('#btnDispatch'),
  timeline: $('#timeline'), dispatchStatus: $('#dispatchStatus'),
  dropzone: $('#dropzone'), fileInput: $('#fileInput'), vttText: $('#vttText'), localTitle: $('#localTitle'),
  optTranslate: $('#optTranslate'), localRun: $('#btnLocalRun'), localCancel: $('#btnLocalCancel'),
  localProgress: $('#localProgress'), localProgressBar: $('#localProgressBar'), localStatus: $('#localStatus'),
  result: $('#result'), resThumb: $('#resThumb'), resTitle: $('#resTitle'), resChannel: $('#resChannel'),
  resLink: $('#resLink'), resChips: $('#resChips'), transNotice: $('#transNotice'),
  langVi: $('#langVi'), langSrc: $('#langSrc'),
  segBody: $('#segBody'), droppedNote: $('#droppedNote'),
  segSelect: $('#segSelect'), transcriptBody: $('#transcriptBody'), transLangHint: $('#transLangHint'),
  btnCopySeg: $('#btnCopySeg'), btnCopyAll: $('#btnCopyAll'),
  transExtra: $('#transExtra'), btnTranslateFull: $('#btnTranslateFull'), btnDownload: $('#btnDownload'),
  library: $('#libraryList'), toast: $('#toast'),
};

const state = { doc: null, lang: 'vi', index: null, localAbort: false, translating: false };

// ── helpers ──
function dirBase(p) {
  if (p.endsWith('/')) return p;
  const last = p.slice(p.lastIndexOf('/') + 1);
  return last.includes('.') ? p.slice(0, p.lastIndexOf('/') + 1) : p + '/';
}
const BASE = dirBase(location.pathname);
// test hook: verify URL-resolution logic (KN-030/KN-040) từ Playwright
window.__ytTest = { dirBase, base: BASE };

async function getJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg, ms = 2600) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), ms);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* noop */ } },
};

async function copyText(text, label) {
  try { await navigator.clipboard.writeText(text); toast(`📋 Đã copy ${label}`); }
  catch { toast('⚠️ Không copy được — hãy chọn text và Ctrl+C'); }
}

// ── LIBRARY ──
function fmtDur(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}g ${String(m).padStart(2, '0')}p` : `${m} phút`;
}

function renderLibrary() {
  const vids = state.index && state.index.videos ? state.index.videos : [];
  if (!vids.length) {
    els.library.innerHTML = '<p class="empty">Chưa có video nào — dán link ở mục 1 hoặc dán phụ đề ở mục 2 để tạo cái đầu tiên 👆</p>';
    return;
  }
  els.library.innerHTML = vids.map(v => {
    const title = v.titleVi || v.title;
    return `<button type="button" class="lib-card" data-id="${esc(v.id)}">
      <span class="lc-title">${esc(title)}</span>
      <span class="lc-sub">${esc(v.channel || '—')} · ${fmtDur(v.durationSec)} · ${v.segments} phần · lược ${v.cleanedPct}%</span>
      <span class="lc-chips">
        ${v.translated ? '<span class="chip vi">🇻🇳 vi</span>' : '<span class="chip">bản gốc</span>'}
        ${v.demo ? '<span class="chip demo">demo</span>' : ''}
      </span>
    </button>`;
  }).join('');
  $$('.lib-card', els.library).forEach(b => b.addEventListener('click', () => loadDoc(b.dataset.id, true)));
}

async function loadDoc(id, scroll) {
  try {
    const doc = await getJson(BASE + 'data/' + encodeURIComponent(id) + '.json');
    state.doc = doc;
    state.lang = doc.translation && doc.translation.applied ? 'vi' : 'src';
    renderResult();
    if (scroll) {
      els.result.hidden = false;
      els.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    try { history.replaceState(null, '', '#' + id); } catch { /* file:// */ }
  } catch (e) {
    toast('❌ Không tải được dữ liệu: ' + e.message, 3600);
  }
}

// ── RENDER RESULT ──
function segView(s, lang) {
  const vi = lang === 'vi';
  return {
    title: vi && s.title ? s.title : s.titleSrc,
    summary: vi && s.summary ? s.summary : s.summarySrc,
    bullets: vi && s.bullets && s.bullets.length ? s.bullets : s.bulletsSrc,
    keywords: vi && s.keywords && s.keywords.length ? s.keywords : s.keywordsSrc,
    transcript: vi && s.transcript ? s.transcript : s.transcriptSrc,
  };
}

function renderResult() {
  const d = state.doc;
  if (!d) { els.result.hidden = true; return; }
  els.result.hidden = false;

  const t = d.translation || { applied: false };
  const lang = state.lang;
  const title = lang === 'vi' && d.titleVi ? d.titleVi : d.title;
  els.resTitle.textContent = title;
  els.resChannel.textContent = d.channel || (d.demo ? 'Dữ liệu mẫu (fixture)' : '—');

  const vid = P.extractVideoId(d.url || '');
  if (vid && !d.demo) {
    els.resThumb.src = `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
    els.resThumb.hidden = false;
  } else { els.resThumb.hidden = true; }

  if (d.url) { els.resLink.href = d.url; els.resLink.hidden = false; } else { els.resLink.hidden = true; }

  const kwCount = d.segments.reduce((n, s) => n + (s.keywordsSrc || []).length, 0);
  const chips = [
    `<span class="chip">⏱ ${P.formatTime(d.durationSec)}</span>`,
    `<span class="chip">🧩 ${d.stats.segments} phần</span>`,
    `<span class="chip${d.stats.cleanedPct < 5 ? ' warn' : ''}">🧹 lược ${d.stats.cleanedPct}%</span>`,
    `<span class="chip">📝 ${d.stats.words.toLocaleString('vi-VN')} từ</span>`,
    `<span class="chip">🏷 ${kwCount} từ khóa</span>`,
    `<span class="chip">🌐 ${esc(d.lang)}</span>`,
  ];
  if (t.applied) chips.push(`<span class="chip vi">🇻🇳 dịch: ${esc(t.provider || '—')}${t.partial ? ' (một phần)' : ''}</span>`);
  if (d.demo) chips.push('<span class="chip demo">demo data (fixture)</span>');
  if (d.source && /browser|vtt/.test(d.source)) chips.push(`<span class="chip">⚙️ ${esc(d.source)}</span>`);
  els.resChips.innerHTML = chips.join('');

  // notice (nói thật về giới hạn)
  let notice = '';
  if (t.applied && t.partial) notice = `⚠️ Bản dịch <strong>một phần</strong>: ${t.failed}/${t.chunks} chunk lỗi (quota/rate-limit) — phần lỗi giữ nguyên bản gốc, bấm 🌐 Bản gốc để đối chiếu.`;
  else if (!t.applied && d.lang === 'vi') notice = 'ℹ️ Nguồn đã là tiếng Việt — không cần dịch.';
  else if (!t.applied) notice = `ℹ️ Chưa có bản dịch (nguồn: ${esc(d.lang)}). Dịch vi chạy ở CI/local, hoặc dùng mục 2 (dịch trong trình duyệt).`;
  els.transNotice.hidden = !notice;
  els.transNotice.innerHTML = notice;

  // toggle trạng thái
  els.langVi.setAttribute('aria-pressed', String(lang === 'vi'));
  els.langSrc.setAttribute('aria-pressed', String(lang === 'src'));

  // bảng
  els.segBody.innerHTML = d.segments.map(s => {
    const v = segView(s, lang);
    const detailId = 'seg-detail-' + s.i;
    return `<tr class="seg-row" data-detail="${detailId}">
        <td class="td-idx">${s.i}</td>
        <td class="td-time" title="Phần ${s.i}">${P.formatTime(s.start)} – ${P.formatTime(s.end)}</td>
        <td class="td-title"><button type="button" class="linklike seg-toggle" aria-expanded="false" aria-controls="${detailId}">${esc(v.title)}</button></td>
        <td class="td-summary">${esc(v.summary)}</td>
        <td class="td-kw">${(v.keywords || []).map(k => `<span class="kw">${esc(k)}</span>`).join('')}</td>
      </tr>
      <tr class="seg-detail" id="${detailId}" hidden>
        <td colspan="5">
          ${v.bullets && v.bullets.length ? `<ul class="seg-bullets">${v.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          <pre class="seg-transcript">${esc(v.transcript)}</pre>
        </td>
      </tr>`;
  }).join('');

  $$('.seg-row', els.segBody).forEach(tr => {
    const toggle = () => {
      const det = document.getElementById(tr.dataset.detail);
      const btn = $('.seg-toggle', tr);
      det.hidden = !det.hidden;
      tr.classList.toggle('open', !det.hidden);
      btn.setAttribute('aria-expanded', String(!det.hidden));
    };
    tr.addEventListener('click', (e) => { if (!e.target.closest('a')) toggle(); });
    $('.seg-toggle', tr).addEventListener('keydown', (e) => { /* button click tự nhiên */ });
  });

  // dropped note
  const ds = d.droppedSegments || [];
  els.droppedNote.textContent = ds.length
    ? `🗑 Đã lược ${ds.length} đoạn dài (quảng cáo/outro/nhạc…): ` + ds.map(x => `${P.formatTime(x.start)}–${P.formatTime(x.end)} (${x.reason})`).join(' · ')
    : (d.stats.droppedCues ? `🗑 Đã lược ${d.stats.droppedCues} dòng rác (lặp/music/boilerplate/filler) — không đoạn nào ≥ 6s.` : '');

  // transcript panel
  els.segSelect.innerHTML = `<option value="all">Tất cả (${d.segments.length} phần)</option>` +
    d.segments.map(s => { const v = segView(s, lang); return `<option value="${s.i}">Phần ${s.i} — ${esc((v.title || '').slice(0, 60))}</option>`; }).join('');
  renderTranscriptAll();
  els.transLangHint.textContent = (lang === 'vi' && d.transcriptOriginal ? '(bản dịch vi · bản gốc giữ trong dữ liệu)' : (d.transcriptOriginal ? '(bản gốc — có bản dịch vi)' : ''))
    + ' · tiêu đề & từ khóa giữ bản gốc (thuật ngữ)';

  // local extras (chỉ với doc tạo tại chỗ)
  els.transExtra.hidden = d.source !== 'browser-lane';
}

function renderTranscriptAll() {
  const d = state.doc; if (!d) return;
  const sel = els.segSelect.value || 'all';
  let text = '';
  if (sel === 'all') {
    text = state.lang === 'vi' && d.transcript ? d.transcript : (d.transcriptOriginal || d.transcript);
  } else {
    const s = d.segments.find(x => String(x.i) === sel);
    if (s) { const v = segView(s, state.lang); text = v.transcript; }
  }
  els.transcriptBody.textContent = text;
}

els.segSelect.addEventListener('change', renderTranscriptAll);
els.btnCopySeg.addEventListener('click', () => copyText(els.transcriptBody.textContent, 'transcript đang xem'));
els.btnCopyAll.addEventListener('click', () => {
  const d = state.doc; if (!d) return;
  copyText(state.lang === 'vi' && d.transcript ? d.transcript : (d.transcriptOriginal || d.transcript), 'toàn bộ transcript');
});
els.langVi.addEventListener('click', () => { state.lang = 'vi'; renderResult(); });
els.langSrc.addEventListener('click', () => { state.lang = 'src'; renderResult(); });

// ── MODE 1a: ISSUE ──
function inferRepo() {
  const host = location.hostname;
  if (!/\.github\.io$/.test(host)) return '';
  const owner = host.replace(/\.github\.io$/, '');
  const seg = location.pathname.split('/').filter(Boolean)[0];
  return seg && seg !== 'www' && !seg.includes('.') ? `${owner}/${seg}` : `${owner}/${owner}.github.io`;
}
function repoValue() { return els.repo.value.trim() || store.get('yt-summary:repo') || inferRepo(); }

els.issue.addEventListener('click', () => {
  const url = els.url.value.trim();
  const id = P.extractVideoId(url);
  if (!id) { toast('⚠️ Link YouTube không hợp lệ — kiểm tra lại nhé'); els.url.focus(); return; }
  const repo = repoValue();
  if (!repo || !repo.includes('/')) { toast('⚠️ Cần repo owner/name — điền ở phần ⚡ token panel'); els.toggleToken.click(); els.repo.focus(); return; }
  const title = encodeURIComponent('[yt-summary] ' + id);
  const body = encodeURIComponent(`${url}\n\n_Video ID: ${id}_\n\n> Bot sẽ tự build khi issue có label \`yt-summary\`.\n`);
  window.open(`https://github.com/${repo}/issues/new?title=${title}&labels=yt-summary&body=${body}`, '_blank', 'noopener');
  setStep(1, 'done');
  els.dispatchStatus.textContent = '📮 Đã mở trang tạo issue — bấm "Submit new issue" là xong. Quay lại đây sau ~2 phút, bấm "Video đã phân tích" để xem kết quả (Pages sẽ tự deploy).';
});

// ── MODE 1b: DISPATCH + POLL ──
els.toggleToken.addEventListener('click', () => {
  const open = els.tokenPanel.hidden;
  els.tokenPanel.hidden = !open;
  els.toggleToken.setAttribute('aria-expanded', String(open));
});
els.clearPat.addEventListener('click', () => { store.del('yt-summary:pat'); els.pat.value = ''; toast('🧹 Đã xoá token khỏi máy này'); });

[els.repo, els.pat].forEach(inp => {
  const key = inp === els.pat ? 'yt-summary:pat' : 'yt-summary:repo';
  inp.addEventListener('change', () => { if (inp.value.trim()) store.set(key, inp.value.trim()); });
});

function setStep(n, st) {
  const li = els.timeline.querySelector(`li[data-step="${n}"]`);
  if (li) li.dataset.state = st;
  els.timeline.hidden = false;
}

async function gh(path, token, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function dispatchAndPoll() {
  const url = els.url.value.trim();
  const id = P.extractVideoId(url);
  if (!id) { toast('⚠️ Link YouTube không hợp lệ'); els.url.focus(); return; }
  const token = (els.pat.value.trim() || store.get('yt-summary:pat') || '');
  const repo = repoValue();
  if (!token) { toast('⚠️ Cần GitHub token (fine-grained, Actions: write)'); els.pat.focus(); return; }
  if (!repo.includes('/')) { toast('⚠️ Cần repo owner/name'); els.repo.focus(); return; }
  store.set('yt-summary:pat', token); store.set('yt-summary:repo', repo);

  els.dispatch.disabled = true;
  els.timeline.hidden = false;
  [1, 2, 3, 4].forEach(n => setStep(n, undefined));
  els.dispatchStatus.textContent = 'Đang gửi yêu cầu…';
  try {
    const res = await gh(`/repos/${repo}/actions/workflows/yt-summary.yml/dispatches`, token, {
      method: 'POST', body: JSON.stringify({ ref: await defaultBranch(repo, token), inputs: { url, force: 'false' } }),
    });
    if (res.status === 401 || res.status === 403) throw new Error('Token thiếu quyền (cần Actions: read & write)');
    if (!res.ok) throw new Error('dispatch HTTP ' + res.status);
    setStep(1, 'done'); setStep(2, 'active');
    els.dispatchStatus.textContent = '✅ Đã gửi — chờ runner nhận job…';
  } catch (e) {
    setStep(1, 'error');
    els.dispatchStatus.textContent = '❌ ' + e.message;
    els.dispatch.disabled = false;
    return;
  }

  const t0 = Date.now() - 20000;
  const maxMs = 6 * 60 * 1000;
  let runId = null;
  while (Date.now() - t0 < maxMs) {
    await sleep(runId ? 8000 : 5000);
    try {
      if (!runId) {
        const r = await gh(`/repos/${repo}/actions/workflows/yt-summary.yml/runs?event=workflow_dispatch&per_page=10`, token);
        if (!r.ok) continue;
        const runs = (await r.json()).workflow_runs || [];
        const mine = runs.find(x => Date.parse(x.created_at) >= t0);
        if (mine) { runId = mine.id; setStep(2, 'done'); setStep(3, 'active'); els.dispatchStatus.textContent = '⚙️ CI đang tải phụ đề → làm sạch → tóm tắt → dịch vi…'; }
      } else {
        const r = await gh(`/repos/${repo}/actions/runs/${runId}`, token);
        if (!r.ok) continue;
        const run = await r.json();
        if (run.status === 'completed') {
          if (run.conclusion === 'success') {
            [1, 2, 3, 4].forEach(n => setStep(n, 'done'));
            els.dispatchStatus.textContent = '🎉 Xong! Đang tải kết quả…';
            await sleep(2000);
            await loadDoc(id, true);
            state.index = await getJson(BASE + 'data/index.json').catch(() => state.index);
            renderLibrary();
            els.dispatchStatus.textContent = '🎉 Xong — kết quả đã hiển thị bên dưới (Pages có thể chậm hơn raw ~1 phút).';
          } else {
            setStep(3, 'error');
            els.dispatchStatus.textContent = `❌ Job kết thúc: ${run.conclusion}. Thường là YouTube chặn IP datacenter — xem hướng dẫn ở mục "Vì sao có 2 cách?" hoặc dùng mục 2.`;
          }
          els.dispatch.disabled = false;
          return;
        }
      }
    } catch { /* network hiccup — thử lại */ }
  }
  els.dispatch.disabled = false;
  els.dispatchStatus.textContent = '⏱ Quá 6 phút chưa xong — mở tab Actions trên GitHub để xem chi tiết.';
}

async function defaultBranch(repo, token) {
  const cached = store.get('yt-summary:branch:' + repo);
  if (cached) return cached;
  try {
    const r = await gh(`/repos/${repo}`, token);
    if (r.ok) { const j = await r.json(); store.set('yt-summary:branch:' + repo, j.default_branch || 'main'); return j.default_branch || 'main'; }
  } catch { /* fallthrough */ }
  return 'main';
}

els.dispatch.addEventListener('click', dispatchAndPoll);

// ── MODE 2: BROWSER LANE ──
function showLocal(status, pct) {
  els.localProgress.hidden = false;
  if (pct != null) els.localProgressBar.style.width = Math.round(pct * 100) + '%';
  els.localStatus.textContent = status;
}

async function mymemoryVi(text, stats) {
  const chunks = P.chunkForTranslation(text, 440);
  const out = [];
  for (const ch of chunks) {
    if (state.localAbort) throw new Error('aborted');
    if (ch.trim().length < 3) { out.push(ch); continue; }
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(ch)}&langpair=en|vi`);
      const j = await res.json();
      const vi = j && j.responseData && j.responseData.translatedText;
      if (res.ok && vi && !/MYMEMORY WARNING/i.test(vi)) out.push(vi);
      else { out.push(ch); stats.failed++; }
    } catch { out.push(ch); stats.failed++; }
    stats.chunks++;
    await sleep(140);
  }
  return out.join(' ');
}

async function translateLight(doc, segs, stats) {
  const map = new Map();
  let done = 0;
  for (const s of segs) {
    if (state.localAbort) throw new Error('aborted');
    const m = {};
    m.title = await mymemoryVi(s.title, stats);
    m.summary = await mymemoryVi(s.summary, stats);
    const bul = await mymemoryVi(s.bullets.join(' | '), stats);
    const bulArr = bul.split('|').map(x => x.trim()).filter(Boolean);
    m.bullets = bulArr.length === s.bullets.length ? bulArr : s.bullets;
    const kw = await mymemoryVi(s.keywords.join(' | '), stats);
    const kwArr = kw.split('|').map(x => x.trim()).filter(Boolean);
    m.keywords = kwArr.length === s.keywords.length ? kwArr : s.keywords;
    m.transcript = ''; // transcript dịch riêng bằng nút (tốn quota)
    map.set(s.i, m);
    done++;
    showLocal(`Đang dịch bảng tóm tắt… phần ${done}/${segs.length}`, done / (segs.length + 1));
  }
  return map;
}

async function runBrowserLane() {
  const text = els.vttText.value.trim();
  if (!text) { toast('⚠️ Chưa có nội dung phụ đề — dán hoặc kéo file .vtt nhé'); els.dropzone.focus(); return; }
  els.localRun.disabled = true;
  els.localCancel.hidden = false;
  state.localAbort = false;
  try {
    showLocal('Đang phân tích phụ đề…', 0.05);
    const r = P.runPipeline(text, { name: 'paste' });
    if (!r.cleaned.cues.length) throw new Error('Không đọc được cue nào — kiểm tra định dạng .vtt/.srt/.json3');

    const meta = {
      id: 'local-' + Date.now().toString(36),
      title: els.localTitle.value.trim() || '(bản dán tại chỗ)',
      source: 'browser-lane', lang: P.detectLang(r.cleaned.cues.map(c => c.text).join(' ')),
    };
    let translation = null;
    if (els.optTranslate.checked && meta.lang !== 'vi') {
      const stats = { chunks: 0, failed: 0, chars: 0 };
      const segsLite = r.segments;
      const map = await translateLight({}, segsLite, stats);
      translation = { applied: true, provider: 'mymemory', chunks: stats.chunks, failed: stats.failed, chars: stats.chars, map, titleVi: await mymemoryVi(meta.title, stats), transcriptVi: null };
    }
    const doc = P.buildDoc({ meta, parsed: r.parsed, cleaned: r.cleaned, segments: r.segments, translation, demo: false });
    doc.source = 'browser-lane';
    state.doc = doc;
    state.lang = doc.translation && doc.translation.applied ? 'vi' : 'src';
    renderResult();
    els.result.hidden = false;
    els.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showLocal(`✅ Xong: ${doc.stats.segments} phần · lược ${doc.stats.cleanedPct}% · ${doc.stats.words} từ${doc.translation.applied ? ' · đã dịch vi' : ''}. Bấm "Tải JSON" để lưu, hoặc commit vào www/yt-summary/data/.`, 1);
  } catch (e) {
    showLocal('❌ ' + (e.message === 'aborted' ? 'Đã huỷ' : e.message), null);
  } finally {
    els.localRun.disabled = false;
    els.localCancel.hidden = true;
  }
}

els.localRun.addEventListener('click', runBrowserLane);
els.localCancel.addEventListener('click', () => { state.localAbort = true; });

// nút dịch toàn bộ transcript + tải JSON (browser lane)
els.btnTranslateFull.addEventListener('click', async () => {
  const d = state.doc;
  if (!d || d.source !== 'browser-lane' || state.translating) return;
  state.translating = true;
  state.localAbort = false;
  els.btnTranslateFull.disabled = true;
  try {
    const stats = { chunks: 0, failed: 0, chars: 0 };
    const map = new Map();
    if (!d.translation || !d.translation.map) d.translation = { applied: true, provider: 'mymemory', chunks: 0, failed: 0, chars: 0, map: new Map(), titleVi: d.titleVi, transcriptVi: null };
    for (const s of d.segments) {
      if (state.localAbort) break;
      const viText = await mymemoryVi(s.transcriptSrc, stats);
      map.set(s.i, viText);
      showLocal(`Đang dịch transcript… phần ${map.size}/${d.segments.length}`, map.size / d.segments.length);
    }
    for (const s of d.segments) {
      const t = d.translation.map.get(s.i) || {};
      t.transcript = map.get(s.i) || s.transcriptSrc;
      d.translation.map.set(s.i, t);
    }
    d.translation.transcriptVi = d.segments.map(s => (d.translation.map.get(s.i) || {}).transcript || s.transcriptSrc).join(' ');
    d.translation.chunks += stats.chunks; d.translation.failed += stats.failed; d.translation.chars += stats.chars;
    d.transcript = d.translation.transcriptVi;
    state.lang = 'vi';
    renderResult();
    showLocal(`✅ Đã dịch transcript (${stats.chunks} chunks${stats.failed ? ' · ' + stats.failed + ' lỗi quota' : ''}). Quota MyMemory: ~5000 ký tự/ngày (ẩn danh).`, 1);
  } finally {
    state.translating = false;
    els.btnTranslateFull.disabled = false;
  }
});

els.btnDownload.addEventListener('click', () => {
  const d = state.doc; if (!d) return;
  const clean = JSON.parse(JSON.stringify(d, (k, v) => (k === 'map' ? undefined : v)));
  const blob = new Blob([JSON.stringify(clean, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = d.id + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('⬇️ Đã tải ' + d.id + '.json — bỏ vào www/yt-summary/data/ rồi push là Pages deploy');
});

// dropzone
['click', 'keydown'].forEach(ev => els.dropzone.addEventListener(ev, (e) => {
  if (ev === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  els.fileInput.click();
}));
els.fileInput.addEventListener('change', async () => {
  const f = els.fileInput.files && els.fileInput.files[0];
  if (!f) return;
  els.vttText.value = await f.text();
  if (!els.localTitle.value) els.localTitle.value = f.name.replace(/\.(vtt|srt|json3|txt)$/i, '');
  toast('📄 Đã nạp ' + f.name + ' — bấm "Xử lý ngay trong trang"');
});
['dragover', 'dragenter'].forEach(ev => els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => els.dropzone.addEventListener(ev, (e) => { e.preventDefault(); els.dropzone.classList.remove('drag'); }));
els.dropzone.addEventListener('drop', async (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!f) return;
  els.vttText.value = await f.text();
  if (!els.localTitle.value) els.localTitle.value = f.name.replace(/\.(vtt|srt|json3|txt)$/i, '');
});

// ── INIT ──
(async function init() {
  els.pat.value = store.get('yt-summary:pat') || '';
  els.repo.value = store.get('yt-summary:repo') || inferRepo();
  try {
    state.index = await getJson(BASE + 'data/index.json');
  } catch { state.index = { videos: [] }; }
  renderLibrary();
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (hash) await loadDoc(hash, true);
})();
