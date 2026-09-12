/* Agentic Academy — diagrams.js
 * 8 animated SVG builders (0 dep, 0 webfont). Class animation định nghĩa trong styles.css:
 * .dg .flow (dash chảy) · .dg .appear (hiện dần --d) · .dg .pulse (nhịp --i) · reduced-motion giữ fade.
 */
(function () {
  'use strict';

  function box(x, y, w, h, cls, rx) {
    return '<rect class="box ' + (cls || '') + '" x="' + x + '" y="' + y + '" width="' + w +
      '" height="' + h + '" rx="' + (rx == null ? 10 : rx) + '"/>';
  }
  function txt(x, y, s, cls, anchor) {
    return '<text class="' + (cls || 't') + '" x="' + x + '" y="' + y + '"' +
      (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + s + '</text>';
  }
  function path(d, cls) { return '<path class="' + (cls || 'flow') + '" d="' + d + '" fill="none"/>'; }
  function svg(vb, label, inner) {
    return '<svg class="dg" viewBox="' + vb + '" role="img" aria-label="' + label + '">' +
      '<title>' + label + '</title>' + inner + '</svg>';
  }
  function dot(x, y, r, dpath, dur, begin) {
    return '<circle class="packet" cx="' + x + '" cy="' + y + '" r="' + (r || 4) + '">' +
      '<animateMotion dur="' + (dur || '2.6s') + '" repeatCount="indefinite" begin="' + (begin || '0s') + '" path="' + dpath + '"/></circle>';
  }

  /* 1. agent-loop — Observe → Think → Act + feedback */
  function agentLoop() {
    var s = '';
    s += path('M550 62 C550 4 110 4 110 62', 'flow arc');
    s += txt(330, 12, 'feedback — lặp cho tới khi mục tiêu xong', 'ts', 'middle');
    s += '<g class="pulse" style="--i:0"><circle class="ring" cx="110" cy="100" r="37"/></g>';
    s += '<text class="ico" x="110" y="112" text-anchor="middle">👁</text>';
    s += txt(110, 160, 'Observe', 't', 'middle');
    s += txt(110, 180, 'đọc state · kết quả tool', 'ts', 'middle');
    s += '<g class="pulse" style="--i:1"><circle class="ring" cx="330" cy="100" r="37"/></g>';
    s += '<text class="ico" x="330" y="112" text-anchor="middle">🧠</text>';
    s += txt(330, 160, 'Think', 't', 'middle');
    s += txt(330, 180, 'chọn bước kế tiếp', 'ts', 'middle');
    s += '<g class="pulse" style="--i:2"><circle class="ring" cx="550" cy="100" r="37"/></g>';
    s += '<text class="ico" x="550" y="112" text-anchor="middle">⚡</text>';
    s += txt(550, 160, 'Act', 't', 'middle');
    s += txt(550, 180, 'gọi tool · sửa file', 'ts', 'middle');
    s += path('M152 100 L288 100', 'flow arrow');
    s += path('M372 100 L508 100', 'flow arrow');
    s += '<g class="appear" style="--d:.6s">' + box(470, 204, 50, 24, 'chip', 12) + txt(495, 220, 'web', 'tm', 'middle') + '</g>';
    s += '<g class="appear" style="--d:.75s">' + box(528, 204, 50, 24, 'chip', 12) + txt(553, 220, 'files', 'tm', 'middle') + '</g>';
    s += '<g class="appear" style="--d:.9s">' + box(586, 204, 50, 24, 'chip', 12) + txt(611, 220, 'api', 'tm', 'middle') + '</g>';
    s += txt(553, 248, 'Tool layer', 'ts', 'middle');
    return svg('0 0 660 260', 'Vòng lặp agent: Observe, Think, Act và feedback', s);
  }

  /* 2. when-agent — pipeline hay agent? */
  function whenAgent() {
    var s = '';
    s += '<g class="appear" style="--d:.1s">' + box(24, 30, 286, 66) + txt(40, 58, 'Q1 · Vẽ được flowchart', 't') + txt(40, 80, 'trước khi chạy?', 't') + '</g>';
    s += '<g class="appear" style="--d:.35s">' + box(24, 168, 286, 66) + txt(40, 196, 'Q2 · Path tự quyết +', 't') + txt(40, 218, 'outcome rẻ để verify?', 't') + '</g>';
    s += '<g class="appear" style="--d:.55s">' + box(420, 16, 214, 56, 'ok') + txt(436, 40, '✅ PIPELINE', 'tb') + txt(436, 60, 'rẻ · test được · ổn định', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.7s">' + box(420, 104, 214, 56, 'go') + txt(436, 128, '✅ AGENT tự chủ', 'tb') + txt(436, 148, 'adapt được · loop có check', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.85s">' + box(420, 192, 214, 56, 'warn') + txt(436, 216, '⚠ PIPELINE + human gate', 'tb') + txt(436, 236, 'agency đắt → chỉ khi cần', 'ts') + '</g>';
    s += path('M312 56 C380 56 370 44 414 44', 'flow arrow');
    s += path('M312 66 C390 66 370 100 414 132', 'flow arrow');
    s += path('M312 128 C380 128 370 132 414 132', 'flow arrow');
    s += path('M312 140 C390 140 370 200 414 220', 'flow arrow');
    s += txt(330, 44, 'Có', 'ts');
    s += txt(330, 152, 'Không', 'ts');
    s += txt(330, 122, 'Có', 'ts');
    s += txt(330, 200, 'Không', 'ts');
    return svg('0 0 660 266', 'Flowchart quyết định: khi nào dùng pipeline, khi nào dùng agent', s);
  }

  /* 3. ide-matrix — 1 lõi AGENTS.md ↔ 4 adapter IDE */
  function ideMatrix() {
    var s = '';
    s += box(20, 96, 178, 88, 'core');
    s += txt(109, 130, 'AGENTS.md', 'tb', 'middle');
    s += txt(109, 152, 'lõi chung · 1 file', 'ts', 'middle');
    s += txt(109, 170, 'chuẩn mở (agents.md)', 'ts', 'middle');
    var rows = [
      ['Claude Code', 'CLAUDE.md (trỏ về lõi)'],
      ['VS Code Copilot', '.github/copilot-instructions.md'],
      ['Codex (OpenAI)', 'AGENTS.md — native'],
      ['Antigravity', '.agents/rules/agentic.md']
    ];
    var ys = [12, 78, 144, 210];
    rows.forEach(function (r, i) {
      var y = ys[i];
      s += '<g class="appear" style="--d:' + (0.25 + i * 0.18) + 's">';
      s += box(412, y, 228, 56, i === 2 ? 'ok' : '');
      s += txt(428, y + 24, r[0], 'tb');
      s += txt(428, y + 44, r[1], 'ts');
      s += '</g>';
      s += path('M198 140 C300 140 320 ' + (y + 28) + ' 406 ' + (y + 28), 'flow arrow');
    });
    return svg('0 0 660 280', 'Một lõi AGENTS.md với adapter cho Claude Code, VS Code, Codex, Antigravity', s);
  }

  /* 4. file-tree — cây file hệ thống (mode build / recap) */
  function fileTree(mode) {
    var recap = mode === 'recap';
    var lines = [
      ['my-project/', 'p'],
      ['├─ AGENTS.md', 'c', 'luật chung — mọi IDE đọc'],
      ['├─ CLAUDE.md', 'a', 'adapter Claude Code'],
      ['├─ .github/', 'p'],
      ['│  ├─ copilot-instructions.md', 'a', 'adapter VS Code'],
      ['│  └─ skills/<name>/SKILL.md', 'n', 'năng lực tái dùng'],
      ['├─ .agents/rules/agentic.md', 'a', 'adapter Antigravity'],
      ['├─ .vscode/mcp.json', 'n', 'tool qua MCP'],
      ['└─ docs/', 'p'],
      ['   ├─ knowleged.md', 'n', 'bộ nhớ bài học (KN)'],
      ['   └─ evals.md', 'n', 'rubric + tiêu chí']
    ];
    var s = '';
    lines.forEach(function (l, i) {
      var y = 36 + i * 25;
      var cls = l[1] === 'p' ? 'tm dim' : l[1] === 'a' ? 'tm acc' : 'tm';
      s += '<g class="appear" style="--d:' + (0.12 + i * 0.11) + 's">' +
        txt(40, y, l[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), cls) +
        (l[2] ? txt(400, y, l[2], 'ts') : '') + '</g>';
    });
    if (recap) {
      s += '<g class="appear" style="--d:1.5s">' + box(400, 250, 236, 46, 'ok') + txt(518, 279, '= Agent Harness cá nhân ✓', 'tb', 'middle') + '</g>';
    }
    return svg('0 0 660 ' + (recap ? 312 : 306), recap ? 'Hệ thống agent harness cá nhân hoàn chỉnh' : 'Cây file hệ thống sẽ xây', s);
  }

  /* 5. progressive — progressive disclosure cho skills */
  function progressive() {
    var s = '';
    s += '<g class="appear" style="--d:.1s">' + box(24, 54, 236, 148, 'dead') + '</g>';
    s += '<g class="appear" style="--d:.25s">' + txt(142, 108, 'Toàn bộ skill body', 'tm', 'middle') + txt(142, 130, '❌ nhét vào MỌI request', 'ts', 'middle') + txt(142, 152, '→ tốn context · chậm · loãng', 'ts', 'middle') + '</g>';
    s += '<g class="appear" style="--d:.45s">' + box(410, 44, 200, 48, 'core') + txt(510, 66, 'description (metadata)', 'tb', 'middle') + txt(510, 84, 'luôn load — vài dòng', 'ts', 'middle') + '</g>';
    s += path('M510 96 L510 148', 'flow arrow');
    s += '<g class="appear" style="--d:.7s">' + txt(540, 126, 'task match?', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.85s">' + box(360, 154, 300, 100, 'ok') + txt(510, 182, 'SKILL.md body + scripts', 'tb', 'middle') + txt(510, 204, '✅ chỉ load khi cần', 'ts', 'middle') + txt(510, 226, 'progressive disclosure', 'ts', 'middle') + '</g>';
    s += txt(142, 240, 'Antigravity docs: "tool bloat, higher costs, latency, confusion"', 'ts', 'middle');
    return svg('0 0 660 256', 'Progressive disclosure: description load trước, body chỉ khi task match', s);
  }

  /* 6. mcp-flow — Agent ↔ MCP server ↔ tools */
  function mcpFlow() {
    var s = '';
    s += box(24, 92, 148, 64, 'core');
    s += txt(98, 118, '🤖 Agent / IDE', 'tb', 'middle');
    s += txt(98, 140, 'chọn tool + args', 'ts', 'middle');
    s += box(256, 92, 148, 64, 'core');
    s += txt(330, 118, '🔌 MCP Server', 'tb', 'middle');
    s += txt(330, 140, 'làm + trả kết quả', 'ts', 'middle');
    s += path('M172 110 L250 110', 'flow arrow rev');
    s += path('M250 138 L172 138', 'flow arrow');
    var tools = [
      ['🗂 Files & docs', 'đọc/ghi dự án'],
      ['🌐 Web fetch', 'trang, API ngoài'],
      ['🧠 RAG library', '190 sách agentic'],
      ['🗄 Database', 'query có kiểm soát']
    ];
    var ys = [8, 70, 132, 194];
    var s2 = '';
    tools.forEach(function (t, i) {
      var y = ys[i];
      s2 += '<g class="appear" style="--d:' + (0.2 + i * 0.15) + 's">' + box(468, y, 168, 52, i === 2 ? 'ok' : '') +
        txt(482, y + 22, t[0], 'tb') + txt(482, y + 42, t[1], 'ts') + '</g>';
      s2 += path('M404 124 C440 124 ' + (440 + i * 4) + ' ' + (y + 26) + ' 462 ' + (y + 26), 'flow arrow');
    });
    s += s2;
    s += dot(98, 124, 4, 'M172 110 L250 110', '2.8s', '0s');
    s += dot(330, 124, 4, 'M404 124 C436 124 440 ' + (132 + 26) + ' 462 158', '3.4s', '.6s');
    return svg('0 0 660 258', 'Agent gọi tool qua MCP server: files, web, RAG, database', s);
  }

  /* 7. eval-loop — Rubric → Component → E2E → Error analysis */
  function evalLoop() {
    var s = '';
    s += '<g class="appear" style="--d:.1s">' + box(40, 26, 210, 58, 'core') + txt(56, 50, '1 · Rubric trước', 'tb') + txt(56, 70, '5 tiêu chí cụ thể', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.3s">' + box(400, 26, 210, 58, 'core') + txt(416, 50, '2 · Component evals', 'tb') + txt(416, 70, 'từng bước đúng chưa?', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.5s">' + box(400, 176, 210, 58, 'core') + txt(416, 200, '3 · E2E evals', 'tb') + txt(416, 220, 'scenario thật → goal đạt?', 'ts') + '</g>';
    s += '<g class="appear" style="--d:.7s">' + box(40, 176, 210, 58, 'warn') + txt(56, 200, '4 · Error analysis', 'tb') + txt(56, 220, '≥2 lỗi cùng loại?', 'ts') + '</g>';
    s += path('M252 55 C330 55 330 55 394 55', 'flow arrow');
    s += path('M505 88 C505 140 505 140 505 170', 'flow arrow');
    s += path('M394 205 C330 205 330 205 256 205', 'flow arrow');
    s += path('M145 176 C145 140 145 140 145 90', 'flow arrow');
    s += txt(330, 138, 'fix PATTERN, không fix instance', 'tb', 'middle');
    s += txt(330, 162, 'sửa 1 lỗi lẻ = accommodation mù', 'ts', 'middle');
    return svg('0 0 660 260', 'Vòng eval: rubric, component evals, E2E evals, error analysis', s);
  }

  /* 8. learning-loop — Bug → … → Learn → sắc rules */
  function learningLoop() {
    var s = '';
    var top = [['🐞 Bug / lỗi', 40], ['🔁 Reproduce', 200], ['🎯 Root cause', 360]];
    var bot = [['📚 Learn → KN', 40], ['✅ Verify', 200], ['🔧 Fix tối thiểu', 360]];
    top.forEach(function (n, i) {
      s += '<g class="appear" style="--d:' + (0.1 + i * 0.15) + 's">' + box(n[1], 22, 140, 50, i === 0 ? 'warn' : '') + txt(n[1] + 70, 52, n[0], 'tb', 'middle') + '</g>';
    });
    bot.forEach(function (n, i) {
      s += '<g class="appear" style="--d:' + (0.55 + i * 0.15) + 's">' + box(n[1], 186, 140, 50, i === 2 ? 'ok' : '') + txt(n[1] + 70, 216, n[0], 'tb', 'middle') + '</g>';
    });
    s += path('M186 47 L194 47', 'flow arrow');
    s += path('M346 47 L354 47', 'flow arrow');
    s += path('M430 76 C430 130 430 130 430 180', 'flow arrow');
    s += path('M354 211 L346 211', 'flow arrow');
    s += path('M194 211 L186 211', 'flow arrow');
    s += path('M110 180 C110 130 110 130 110 78', 'flow arrow');
    s += box(200, 92, 260, 74, 'core');
    s += txt(330, 120, 'docs/knowleged.md', 'tb', 'middle');
    s += txt(330, 142, 'mỗi vòng lặp: luật sắc hơn', 'ts', 'middle');
    s += txt(330, 160, 'KN-XXX tăng dần', 'ts', 'middle');
    return svg('0 0 660 260', 'Vòng lặp tự học: bug, reproduce, root cause, fix, verify, learn', s);
  }

  var MAP = {
    'agent-loop': agentLoop,
    'when-agent': whenAgent,
    'ide-matrix': ideMatrix,
    'file-tree': fileTree,
    'progressive': progressive,
    'mcp-flow': mcpFlow,
    'eval-loop': evalLoop,
    'learning-loop': learningLoop
  };

  window.ACADEMY_DIAGRAMS = {
    build: function (id, mode) {
      var fn = MAP[id];
      if (!fn) return '<div class="dg-fallback">[diagram: ' + id + ']</div>';
      return fn(mode);
    },
    ids: Object.keys(MAP)
  };
})();
