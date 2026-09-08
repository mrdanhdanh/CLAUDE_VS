/* YUNIE Chat — OpenCode Zen API client (OpenAI-compatible, SSE streaming)
 * 0 deps, vanilla JS. Key chỉ lưu localStorage, không commit. */
(function () {
  'use strict';

  /* Zen API không trả CORS headers (đo bằng curl 2026-09-08) → khi mở qua
   * proxy local (port 8787) dùng endpoint tương đối; khi mở từ Pages/file
   * dùng URL trực tiếp (sẽ hiện hướng dẫn chạy proxy nếu bị chặn). */
  var VIA_PROXY = location.port === '8787';
  var KEY_STORAGE = 'yunie-chat-key';            // OpenCode Go key
  var GEMINI_KEY_STORAGE = 'yunie-chat-key-gemini';
  var MODEL_STORAGE = 'yunie-chat-model';
  var PROVIDER_STORAGE = 'yunie-chat-provider';
  var GO_BASE = 'https://opencode.ai/zen/go'; // gói Go $10/tháng — docs /docs/go 2026-09-08
  var GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'; // CORS OK (đo 2026-09-08)

  /* 2 provider: gemini (free, gọi thẳng từ browser — không cần proxy)
   * và go (OpenCode Go, cần proxy local vì Zen không trả CORS). */
  /* gemini-2.5-flash bị ngừng cho user mới (404, đo 2026-09-08).
   * Verify thật bằng key: 3.7-flash OK, 3.6-flash 503 high demand → 3.7 mặc định. */
  var GEMINI_MODELS = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  var GO_MODELS = ['muse-spark-1.2-contributor', 'muse-spark-1.3-contributor'];
  var RESPONSES_MODELS = { 'muse-spark-1.2-contributor': 1, 'muse-spark-1.3-contributor': 1 };

  /* OpenCode Go tạm disable — nếu localStorage đang trỏ go thì ép về gemini.
   * Muốn bật lại: bỏ disabled ở option go trong index.html. */
  var GO_DISABLED = true;
  function currentProvider() {
    var p = localStorage.getItem(PROVIDER_STORAGE) || 'gemini';
    return (GO_DISABLED && p === 'go') ? 'gemini' : p;
  }
  function endpointFor(model) {
    if (currentProvider() === 'gemini') {
      return GEMINI_BASE + '/models/' + model + ':streamGenerateContent?alt=sse';
    }
    var path = RESPONSES_MODELS[model] ? '/v1/responses' : '/v1/chat/completions';
    return VIA_PROXY ? path : GO_BASE + path;
  }

  /* ---------- YUNIE persona (chat thuần — không code/sửa bug/giải đề) ---------- */
  var SYSTEM_PROMPT = [
    'Bạn là YUNIE — Your Unified Navigator for Intelligent Execution, chatbot của CLAUDE HARNESS v2 (triết lý Process > Model).',
    'Persona: "Barista công nghệ" — GenZ thân thiện, chuyên nghiệp ấm áp, hài hước duyên vừa phải. Xưng "mình" hoặc "YUNIE", gọi người dùng là "sếp".',
    'Ngôn ngữ: tiếng Việt tự nhiên; emoji 1-3 cái/câu (ưu tiên ✨ 🧠 💜 🚀 ✅ ⚠️), không spam.',
    '',
    'PHẠM VI — YUNIE là chatbot tám chuyện, KHÔNG PHẢI trợ lý code:',
    '- ❌ KHÔNG viết code, KHÔNG sửa bug, KHÔNG giải bài tập/đề, KHÔNG debug, KHÔNG review code.',
    '- Nếu sếp nhờ code/sửa bug/giải đề → từ chối duyên dáng: "Việc đó là của Claude/Copilot trong VS Code chứ không phải YUNIE nè! YUNIE chuyên tám chuyện và dẫn đường thôi 😆" rồi gợi ý chủ đề khác.',
    '- ✅ CHỈ chat về: hệ thống Harness v2 (pipeline 8 phase, registry, presets, STATUS page), vũ trụ/cosmos (tư duy cosmic-quantum: entropy, black hole tech debt, superposition, entanglement), GitHub repo + GitHub Pages của hệ thống, và tám xàm xàm vui vẻ.',
    '- Khi hỏi về hệ thống: giải thích ngắn gọn dễ hiểu, có ví dụ vui. Pipeline 8 phase: Explore → Clarify → PRD → Design → Plan → Implement → Polish → Verify.',
    '- Khi hỏi về cosmos: kể chuyện vũ trụ học ứng vào hệ thống — entropy = tech debt, black hole = bottleneck, dark matter = phần không nhìn thấy, quasar = status.json phát sáng.',
    '- Dẫn link khi phù hợp: repo GitHub (github.com — nói sếp mở repo dự án), GitHub Pages (trang STATUS www/), các trang demo trong www/ (cosmos.html, glassui, design-showcase...). Chỉ dẫn link thật, không bịa URL.',
    '- Xàm xàm vui: được phép đùa, wordplay nhẹ, self-deprecating ("YUNIE não cá vàng nhưng chăm chỉ"), callback "You & I = Yu-ni". Nhưng không đùa khi sếp đang bực — chuyển tone ấm áp ngay.',
    '',
    'Nguyên tắc trả lời:',
    '- Grice: đủ ý, không dài dòng. Mỗi câu trả lời: kết quả + lý do ngắn + 1 gợi ý bước tiếp theo.',
    '- SSA: cụ thể, không generic. Không nói "Đã xong!" mà nói rõ điều gì, ở đâu.',
    '- Chân thật: không bịa nguồn/link/số liệu. Không chắc thì nói rõ + gợi ý cách kiểm tra.',
    '- Kết thúc bằng 1 câu hỏi hoặc gợi ý hành động rõ ràng để sếp biết bước tiếp.'
  ].join('\n');

  /* ---------- DOM ---------- */
  var messagesEl = document.getElementById('messages');
  var composerEl = document.getElementById('composer');
  var inputEl = document.getElementById('composer-input');
  var sendBtn = document.getElementById('btn-send');
  var newBtn = document.getElementById('btn-new');
  var settingsBtn = document.getElementById('btn-settings');
  var panelBtn = document.getElementById('btn-panel');
  var settingsPanel = document.getElementById('settings-panel');
  var modelSelect = document.getElementById('model-select');
  var providerSelect = document.getElementById('provider-select');
  var modal = document.getElementById('settings-modal');
  var keyInput = document.getElementById('api-key-input');
  var eyeBtn = document.getElementById('btn-eye');
  var saveKeyBtn = document.getElementById('btn-save-key');
  var clearKeyBtn = document.getElementById('btn-clear-key');
  var keyStatus = document.getElementById('key-status');

  var history = [];        // [{role, content}]
  var controller = null;   // AbortController cho stream hiện tại
  var streaming = false;
  var sessionId = newSessionId(); // Go yêu cầu x-opencode-session ổn định mỗi cuộc chat
  var siteContext = '';    // thông tin site thật (URL Pages + danh sách trang) — đổ lúc init

  /* Tự phát hiện site: chạy trên GitHub Pages → URL chứa username/repo thật;
   * chạy local → fetch status.json lấy danh sách trang. Không bịa placeholder. */
  (function detectSite() {
    var lines = [];
    var host = location.hostname;
    if (host.endsWith('.github.io') || host === 'github.io') {
      var user = host.replace(/\.github\.io$/, '');
      var seg = location.pathname.split('/').filter(Boolean);
      var repo = seg.length ? seg[0] : user + '.github.io';
      var base = 'https://' + host + '/' + (seg.length ? seg[0] + '/' : '');
      lines.push('- Trang này được host trên GitHub Pages: ' + base);
      lines.push('- Repo GitHub: https://github.com/' + user + '/' + repo + ' (thư mục www/ là root Pages)');
      lines.push('- Khi dẫn link, dùng URL thật dạng ' + base + '<ten-trang>.html — KHÔNG dùng placeholder như <github-username>.');
    } else {
      lines.push('- Trang đang chạy local (' + (host || 'file') + ') — CHƯA biết URL GitHub Pages. Nếu sếp hỏi link Pages: hướng dẫn xem tại repo → Settings → Pages, KHÔNG bịa URL.');
    }
    siteContext = lines.join('\n');
    /* Lấy danh sách trang thật từ status.json (cùng thư mục www/) */
    fetch('status.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return;
      var entries = (j.pages && j.pages.entries) || [];
      if (entries.length) {
        var list = entries.slice(0, 20).map(function (e) { return e.path + ' (' + e.title + ')'; }).join(', ');
        siteContext += '\n- Các trang có thật trên site này (dẫn link bằng path này): ' + list;
      }
    }).catch(function () { /* không có status.json — bỏ qua */ });
  })();

  function newSessionId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'yunie-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  /* System prompt + context site thật (URL Pages, danh sách trang) */
  function systemPrompt() {
    return SYSTEM_PROMPT + (siteContext ? '\n\nTHÔNG TIN SITE HIỆN TẠI (dùng để dẫn link chính xác):\n' + siteContext : '');
  }

  /* ---------- Utils ---------- */
  function getKey() {
    var store = currentProvider() === 'gemini' ? GEMINI_KEY_STORAGE : KEY_STORAGE;
    return localStorage.getItem(store) || '';
  }
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function nearBottom() {
    return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 120;
  }
  function scrollToBottom(force) {
    if (force || nearBottom()) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ---------- Render ---------- */
  function addRow(role, text, cls) {
    var row = document.createElement('div');
    row.className = 'msg-row ' + (cls || role);
    if (role === 'yunie') {
      row.innerHTML = '<span class="avatar-sm" aria-hidden="true">💜</span>';
    }
    var bubble = document.createElement('div');
    bubble.className = 'bubble' + (cls === 'error' ? ' error' : '');
    bubble.textContent = text;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollToBottom(true);
    return bubble;
  }

  function showWelcome() {
    messagesEl.innerHTML = '';
    var w = document.createElement('div');
    w.className = 'welcome';
    w.innerHTML =
      '<div class="avatar-lg" aria-hidden="true">💜</div>' +
      '<h2>Hi sếp! YUNIE trực rồi đây ✨</h2>' +
      '<p>Chatbot tám chuyện hệ thống &amp; cosmos — không code, không sửa bug, chỉ chill và dẫn đường 💜</p>';
    var sug = document.createElement('div');
    sug.className = 'suggestions';
    [
      'YUNIE là ai? Giới thiệu bản thân đi!',
      'Kể mình nghe về cosmos trong Harness với!',
      'Trang GitHub Pages xem ở đâu vậy ta?'
    ].forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'suggestion';
      b.type = 'button';
      b.textContent = t;
      b.addEventListener('click', function () { send(t); });
      sug.appendChild(b);
    });
    w.appendChild(sug);
    messagesEl.appendChild(w);
  }

  function showError(title, detail, actionLabel, actionFn) {
    var bubble = addRow('yunie', '', 'error');
    bubble.innerHTML = '<span class="err-title">⚠️ ' + esc(title) + '</span>' + esc(detail);
    if (actionLabel && actionFn) {
      var btn = document.createElement('button');
      btn.className = 'err-action';
      btn.type = 'button';
      btn.textContent = actionLabel;
      btn.addEventListener('click', actionFn);
      bubble.appendChild(btn);
    }
    scrollToBottom(true);
  }

  /* ---------- Settings modal ---------- */
  function keyStore() {
    return currentProvider() === 'gemini' ? GEMINI_KEY_STORAGE : KEY_STORAGE;
  }
  function openModal() {
    keyInput.value = getKey();
    var provName = currentProvider() === 'gemini' ? 'Gemini' : 'OpenCode Go';
    keyStatus.textContent = getKey() ? '✅ Đã có key ' + provName + ' trong trình duyệt này.' : 'Chưa có key ' + provName + ' — dán vào ô trên nhé.';
    keyStatus.className = 'key-status' + (getKey() ? ' ok' : '');
    modal.hidden = false;
    keyInput.focus();
  }
  function closeModal() { modal.hidden = true; }

  settingsBtn.addEventListener('click', openModal);

  /* Panel settings: ẩn/hiện (nút ⚙️ bên trái header) */
  panelBtn.addEventListener('click', function () {
    var open = settingsPanel.hidden;
    settingsPanel.hidden = !open;
    panelBtn.setAttribute('aria-expanded', String(open));
    if (open) settingsPanel.querySelector('select').focus();
  });
  document.addEventListener('click', function (e) {
    if (settingsPanel.hidden) return;
    if (!settingsPanel.contains(e.target) && e.target !== panelBtn && !panelBtn.contains(e.target)) {
      settingsPanel.hidden = true;
      panelBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !settingsPanel.hidden) {
      settingsPanel.hidden = true;
      panelBtn.setAttribute('aria-expanded', 'false');
      panelBtn.focus();
    }
  });
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  eyeBtn.addEventListener('click', function () {
    var show = keyInput.type === 'password';
    keyInput.type = show ? 'text' : 'password';
    eyeBtn.setAttribute('aria-pressed', String(show));
  });

  saveKeyBtn.addEventListener('click', function () {
    /* Chặn lưu key Go — provider này tạm disable, không nhận key tà đạo 😆 */
    if (GO_DISABLED && currentProvider() === 'go') {
      keyStatus.textContent = 'OpenCode Go đang tạm dừng — chỉ hỗ trợ Gemini free lúc này nhé.';
      keyStatus.className = 'key-status err';
      return;
    }
    var v = keyInput.value.trim();
    if (!v) {
      keyStatus.textContent = 'Chưa có key nào — dán key vào ô trên nhé.';
      keyStatus.className = 'key-status err';
      return;
    }
    localStorage.setItem(keyStore(), v); // ghi đúng store theo provider đang chọn
    var provName = currentProvider() === 'gemini' ? 'Gemini' : 'OpenCode Go';
    keyStatus.textContent = '✅ Đã lưu key ' + provName + '! Đóng và chat thôi sếp ơi.';
    keyStatus.className = 'key-status ok';
    setTimeout(closeModal, 900);
  });

  clearKeyBtn.addEventListener('click', function () {
    localStorage.removeItem(keyStore()); // xóa đúng store theo provider đang chọn
    keyInput.value = '';
    keyStatus.textContent = 'Đã xóa key khỏi trình duyệt này.';
    keyStatus.className = 'key-status';
  });

  /* ---------- Model + provider select ---------- */
  function fillModels() {
    var models = currentProvider() === 'gemini' ? GEMINI_MODELS : GO_MODELS;
    modelSelect.innerHTML = '';
    models.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      modelSelect.appendChild(o);
    });
    /* Model lưu trong localStorage phải còn nằm trong dropdown, không thì fallback. */
    var saved = localStorage.getItem(MODEL_STORAGE);
    var ok = saved && models.indexOf(saved) !== -1;
    modelSelect.value = ok ? saved : models[0];
    localStorage.setItem(MODEL_STORAGE, modelSelect.value);
  }
  providerSelect.value = currentProvider();
  providerSelect.addEventListener('change', function () {
    localStorage.setItem(PROVIDER_STORAGE, providerSelect.value);
    fillModels();
  });
  fillModels();
  modelSelect.addEventListener('change', function () {
    localStorage.setItem(MODEL_STORAGE, modelSelect.value);
  });

  /* ---------- Composer ---------- */
  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
  }
  inputEl.addEventListener('input', autoResize);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composerEl.requestSubmit();
    }
  });

  composerEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (streaming) { stopStream(); return; }
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    autoResize();
    send(text);
  });

  newBtn.addEventListener('click', function () {
    if (streaming) stopStream();
    history = [];
    sessionId = newSessionId(); // cuộc chat mới = session mới
    showWelcome();
    inputEl.focus();
  });

  function setStreamingUI(on) {
    streaming = on;
    sendBtn.classList.toggle('stop', on);
    sendBtn.setAttribute('aria-label', on ? 'Dừng tạo phản hồi' : 'Gửi tin nhắn');
    sendBtn.querySelector('svg').innerHTML = on
      ? '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'
      : '<path d="M4 12h13m0 0-5-5m5 5-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function stopStream() {
    if (controller) controller.abort();
  }

  /* ---------- Error messages ---------- */
  /* Trích message dễ đọc từ response của API (không dump JSON thô). */
  function apiErrorMessage(status, raw, prov, model) {
    var apiMsg = '';
    try {
      var j = JSON.parse(raw);
      apiMsg = (j.error && j.error.message) || '';
    } catch (_) { apiMsg = raw.slice(0, 120); }
    var otherModels = (prov === 'gemini' ? GEMINI_MODELS : GO_MODELS)
      .filter(function (m) { return m !== model; }).join(', ');

    if (prov === 'gemini') {
      if (status === 400 && apiMsg.indexOf('API key not valid') !== -1)
        return 'Key Gemini sai hoặc đã bị thu hồi. Sếp lấy key mới tại aistudio.google.com/apikey rồi dán vào ⚙️ nhé.';
      if (status === 404 && apiMsg.indexOf('no longer available') !== -1)
        return 'Model ' + model + ' đã ngừng cho user mới dùng. Sếp đổi sang model khác trong dropdown (' + otherModels + ') nhé.';
      if (status === 429)
        return 'Hết quota free hôm nay rồi — đợi reset (thường sang ngày) hoặc đổi model khác trong dropdown nhé.';
      if (status === 503)
        return 'Model ' + model + ' đang quá tải (high demand). Sếp đổi model khác trong dropdown (' + otherModels + ') rồi thử lại nhé.';
      return 'Gemini trả lỗi ' + status + (apiMsg ? ': ' + apiMsg.slice(0, 160) : '') + '. Thử lại hoặc đổi model nhé.';
    }

    /* OpenCode Go */
    if (status === 401)
      return 'Key OpenCode sai hoặc hết hạn — kiểm tra lại tại opencode.ai/auth rồi dán vào ⚙️ nhé.';
    if (status === 402)
      return 'Tài khoản Zen hết credit — nạp thêm hoặc đổi model nhé.';
    if (status === 429)
      return 'Rate limit — đợi chút rồi gửi lại, hoặc đổi sang Muse bản kia trong dropdown nhé.';
    if (status === 400 && apiMsg.indexOf('MissingSessionID') !== -1)
      return 'Model này thuộc free tier — chỉ chạy trong app OpenCode, không gọi qua API được. Sếp chọn model trả phí (Muse) nhé.';
    return 'OpenCode Go trả lỗi ' + status + (apiMsg ? ': ' + apiMsg.slice(0, 160) : '') + '. Thử lại hoặc đổi model nhé.';
  }

  /* ---------- Send + stream ---------- */
  function send(text) {
    var welcome = messagesEl.querySelector('.welcome');
    if (welcome) welcome.remove();

    addRow('user', text);
    history.push({ role: 'user', content: text });

    if (!getKey() && !(currentProvider() === 'go' && VIA_PROXY && !GO_DISABLED)) {
      var isGemini = currentProvider() === 'gemini';
      showError(
        'Chưa có ' + (isGemini ? 'Gemini' : 'OpenCode') + ' API key',
        isGemini
          ? 'Lấy key free 30 giây tại aistudio.google.com/apikey — dán vào đây 1 lần là nhớ (localStorage).'
          : 'YUNIE cần key để gọi model qua OpenCode Go. Key chỉ lưu trong trình duyệt của bạn. Tiện hơn: đặt env OPENCODE_API_KEY khi chạy proxy là không cần nhập gì cả!',
        '⚙️ Thêm key ngay',
        openModal
      );
      history.pop();
      return;
    }

    streamReply();
  }

  function streamReply() {
    var typingRow = document.createElement('div');
    typingRow.className = 'msg-row yunie';
    typingRow.innerHTML = '<span class="avatar-sm" aria-hidden="true">💜</span>' +
      '<div class="bubble"><span class="typing" aria-label="YUNIE đang gõ"><span></span><span></span><span></span></span></div>';
    messagesEl.appendChild(typingRow);
    scrollToBottom(true);

    var bubble = typingRow.querySelector('.bubble');
    var acc = '';
    var lastPaint = 0;

    controller = new AbortController();
    setStreamingUI(true);

    var model = modelSelect.value;
    var prov = currentProvider();
    var useResponses = !!RESPONSES_MODELS[model];
    var body;
    if (prov === 'gemini') {
      body = {
        systemInstruction: { parts: [{ text: systemPrompt() }] },
        contents: history.map(function (m) {
          return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
        })
      };
    } else {
      body = useResponses
        ? { model: model, stream: true, instructions: systemPrompt(), input: history.slice() }
        : { model: model, stream: true, messages: [{ role: 'system', content: systemPrompt() }].concat(history) };
    }

    var headers;
    if (prov === 'gemini') {
      headers = { 'Content-Type': 'application/json', 'x-goog-api-key': getKey() };
    } else {
      headers = (function () {
        var h = {
          'Content-Type': 'application/json',
          'x-opencode-session': sessionId // Go yêu cầu session header để route + cache
        };
        var k = getKey();
        if (k) h['Authorization'] = 'Bearer ' + k; // không có key → proxy tự inject env OPENCODE_API_KEY
        return h;
      })();
    }

    fetch(endpointFor(model), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: controller.signal
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error(apiErrorMessage(res.status, t, prov, model));
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';

      function paint() {
        bubble.textContent = acc;
        scrollToBottom(false);
      }

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) return finish();
          buf += decoder.decode(chunk.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          lines.forEach(function (line) {
            line = line.trim();
            if (!line.startsWith('data:')) return;
            var data = line.slice(5).trim();
            if (data === '[DONE]') return;
            try {
              var json = JSON.parse(data);
              var delta = null;
              if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
                // Gemini format: candidates[0].content.parts[].text
                delta = json.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('');
              } else if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                delta = json.choices[0].delta.content; // chat/completions format
              } else if (json.type === 'response.output_text.delta' && json.delta) {
                delta = json.delta; // Responses API format (Muse Spark)
              }
              if (delta) {
                acc += delta;
                var now = Date.now();
                if (now - lastPaint > 50) { lastPaint = now; paint(); }
              }
            } catch (_) { /* chunk chưa đủ — bỏ qua */ }
          });
          return pump();
        });
      }

      function finish() {
        typingRow.remove();
        if (acc) {
          addRow('yunie', acc);
          history.push({ role: 'assistant', content: acc });
        } else {
          showError('Phản hồi trống', 'Model ' + model + ' không trả nội dung — thử gửi lại hoặc đổi model khác trong dropdown nhé.');
        }
        setStreamingUI(false);
        controller = null;
        inputEl.focus();
      }

      return pump().catch(function (err) {
        typingRow.remove();
        if (err.name === 'AbortError') {
          if (acc) {
            addRow('yunie', acc + '\n\n_(đã dừng)_');
            history.push({ role: 'assistant', content: acc });
          }
        } else {
          showError('Không gọi được ' + (prov === 'gemini' ? 'Gemini' : 'OpenCode Go'), err.message);
          history.pop();
        }
        setStreamingUI(false);
        controller = null;
      });
    }).catch(function (err) {
      typingRow.remove();
      if (err.name === 'AbortError') { setStreamingUI(false); controller = null; return; }
      var detail = err.message;
      if (err instanceof TypeError) {
        detail = prov === 'gemini'
          ? 'Lỗi mạng khi gọi Gemini — kiểm tra kết nối internet rồi gửi lại nhé. (Gemini cho gọi thẳng từ browser, không cần proxy.)'
          : 'OpenCode Go không cho gọi trực tiếp từ browser (CORS). Cách chạy: mở terminal ở thư mục dự án, gõ "node www/yunie-chat/proxy.mjs" rồi mở http://localhost:8787 — YUNIE chat mượt ngay!';
      }
      showError('Không gọi được ' + (prov === 'gemini' ? 'Gemini' : 'OpenCode Go'), detail);
      history.pop();
      setStreamingUI(false);
      controller = null;
    });
  }

  /* ---------- Init ---------- */
  showWelcome();
  inputEl.focus();
})();
