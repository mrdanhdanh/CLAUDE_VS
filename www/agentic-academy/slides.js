/* Agentic Academy — slides.js (deck engine)
 * ?lesson=kX + hash #slide-N · keyboard · fullscreen (immersive fallback) · swipe · mark · dots.
 * KN-032-safe: mọi call fullscreen bọc try/catch, không throw trong handler.
 */
(function () {
  'use strict';
  var A = window.Academy;
  var DATA = window.ACADEMY || { meta: {}, lessons: [] };
  var LESSONS = DATA.lessons || [];

  A.fixRelLinks();

  /* ---- chọn bài ---- */
  var params = new URLSearchParams(location.search);
  var lessonId = params.get('lesson') || (LESSONS[0] && LESSONS[0].id);
  var lesson = null, lessonIndex = -1;
  for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === lessonId) { lesson = LESSONS[i]; lessonIndex = i; }

  var stage = document.getElementById('stage');
  var deckTitle = document.getElementById('deckTitle');
  var deckKicker = document.getElementById('deckKicker');
  var counter = document.getElementById('slideCounter');
  var markBtn = document.getElementById('markBtn');
  var markTxt = document.getElementById('markTxt');
  var fsBtn = document.getElementById('fsBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var dotsWrap = document.getElementById('dots');
  var deckProgress = document.getElementById('deckProgress');
  var deckFill = document.getElementById('deckFill');

  var TYPE_LABEL = {
    cover: 'Bài học', bullets: 'Nội dung', diagram: 'Sơ đồ động',
    steps: 'Thực hành', code: 'Mẫu file', compare: 'So sánh',
    outcome: 'Kết quả', sources: 'Nguồn'
  };

  if (!lesson) {
    deckTitle.textContent = 'Không tìm thấy bài';
    stage.innerHTML = '<div class="slide active"><div class="notfound">' +
      '<div><div class="big">🧭</div><h2>Không tìm thấy bài học</h2>' +
      '<p>Bài "' + A.esc(lessonId || '?') + '" không tồn tại trong Academy.</p>' +
      '<a class="btn btn-primary" href="' + A.dirBase(location.pathname) + 'index.html">← Về trang chủ</a></div></div></div>';
    counter.textContent = '0 / 0';
    markBtn.disabled = true; fsBtn.disabled = true; prevBtn.disabled = true; nextBtn.disabled = true;
    return;
  }

  /* ---- render slides ---- */
  document.documentElement.style.setProperty('--acc', lesson.accent);
  document.title = lesson.num + '. ' + lesson.title + ' — Agentic Academy';
  deckKicker.textContent = 'BÀI ' + lesson.num + ' / ' + LESSONS.length;
  deckTitle.textContent = lesson.num + '. ' + lesson.title;

  function codeHTML(content) {
    return content.split('\n').map(function (line) {
      var t = A.esc(line);
      var isCm = /^\s*(#|\/\/|<!--)/.test(line);
      return isCm ? '<span class="cm">' + t + '</span>' : t;
    }).join('\n');
  }

  function slideHTML(s, n) {
    var eyebrow = TYPE_LABEL[s.type] || 'Nội dung';
    var inner = '';
    if (s.type === 'cover') {
      inner = '<span class="cover-num" aria-hidden="true">' + String(lesson.num).padStart(2, '0') + '</span>' +
        '<span class="eyebrow cin" style="--d:.05s">Bài ' + lesson.num + ' / ' + LESSONS.length + ' · ' + A.esc(lesson.tags.join(' · ')) + '</span>' +
        '<h1 class="cin" style="--d:.14s">' + A.esc(lesson.title) + '</h1>' +
        '<p class="cover-sub cin" style="--d:.24s">' + A.esc(lesson.sub) + '</p>' +
        '<div class="goal-chips">' + s.goals.map(function (g, gi) {
          return '<span class="goal-chip cin" style="--d:' + (0.34 + gi * 0.09) + 's">' + A.esc(g) + '</span>';
        }).join('') + '</div>' +
        '<div class="cover-meta cin" style="--d:.66s">' +
          (lesson.need ? '<span class="stat-chip">🧩 Cần trước: ' + A.esc(lesson.need) + '</span>' : '') +
          '<span class="stat-chip">⏱ ' + A.esc(lesson.duration) + '</span>' +
          '<span class="stat-chip">🧩 ' + lesson.slides.length + ' slide</span>' +
          '<span class="stat-chip">⌨ ← → để di chuyển · F fullscreen</span>' +
        '</div>';
      return '<section class="slide cover-c" id="s' + n + '" data-n="' + n + '" aria-label="' + n + ' trên ' + '{TOTAL}' + '"><div class="slide-inner">' + inner + '</div></section>';
    }
    if (s.type === 'bullets') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">' + (s.icon ? '<span aria-hidden="true">' + s.icon + '</span> ' : '') + A.esc(s.title) + '</h2>' +
        '<ul class="blist">' + s.items.map(function (it, ii) {
          return '<li class="cin" style="--d:' + (0.18 + ii * 0.08) + 's" data-i="' + (ii + 1) + '">' + A.md(it) + '</li>';
        }).join('') + '</ul>';
    } else if (s.type === 'diagram') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">' + A.esc(s.title) + '</h2>' +
        '<div class="dg-wrap cin" style="--d:.18s">' + window.ACADEMY_DIAGRAMS.build(s.svg, s.svgMode) + '</div>' +
        '<p class="dg-cap cin" style="--d:.3s">' + A.esc(s.caption || '') + '</p>';
    } else if (s.type === 'steps') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">' + A.esc(s.title) + '</h2>' +
        '<div class="step-grid">' + s.steps.map(function (st, si) {
          return '<div class="step-card cin" style="--d:' + (0.18 + si * 0.09) + 's">' +
            '<span class="step-n">' + (si + 1) + '</span>' +
            '<div><b>' + A.esc(st.t) + '</b><p>' + A.md(st.d) + '</p></div></div>';
        }).join('') + '</div>';
    } else if (s.type === 'code') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">' + A.esc(s.title) + '</h2>' +
        '<div class="code-wrap cin" style="--d:.18s">' +
          '<div class="code-head"><span class="code-dot"></span><span class="code-dot"></span><span class="code-dot"></span><span class="code-file">' + A.esc(s.file) + '</span></div>' +
          '<pre>' + codeHTML(s.content) + '</pre>' +
        '</div>';
    } else if (s.type === 'compare') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">' + A.esc(s.title) + '</h2>' +
        '<div class="cmp-wrap cin" style="--d:.18s"><table class="cmp"><thead><tr>' +
          s.cols.map(function (c) { return '<th scope="col">' + A.esc(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + s.rows.map(function (r) {
          return '<tr>' + r.map(function (cell, ci) {
            return '<td data-label="' + A.esc(s.cols[ci] || '') + '">' + A.md(cell) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    } else if (s.type === 'outcome') {
      var nextLesson = LESSONS[lessonIndex + 1];
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">Kết quả mong muốn sau bài này</h2>' +
        '<div class="outcome cin" style="--d:.16s" data-outcome>' +
          '<h3><span aria-hidden="true">📦</span> Files được tạo ra</h3>' +
          '<table class="file-table"><thead><tr><th>File</th><th>Nội dung</th></tr></thead><tbody>' +
            lesson.outcome.files.map(function (f) {
              return '<tr><td>' + A.esc(f.p) + '</td><td>' + A.md(f.why) + '</td></tr>';
            }).join('') +
          '</tbody></table>' +
          '<h3><span aria-hidden="true">🎯</span> Tiêu chí hoàn thành</h3>' +
          '<ul class="crit">' + lesson.outcome.criteria.map(function (c) { return '<li>' + A.md(c) + '</li>'; }).join('') + '</ul>' +
          '<div class="outcome-cta">' +
            '<button class="btn btn-primary" type="button" id="markBtn2" data-mark><span aria-hidden="true">✓</span> Đánh dấu đã học</button>' +
            (nextLesson
              ? '<a class="btn btn-ghost" href="' + A.dirBase(location.pathname) + 'slides.html?lesson=' + nextLesson.id + '">Bài tiếp: ' + nextLesson.num + '. ' + A.esc(nextLesson.title) + ' →</a>'
              : '<a class="btn btn-ghost" href="' + A.dirBase(location.pathname) + 'index.html">🎓 Về trang chủ — xem checklist tốt nghiệp</a>') +
            '<span class="outcome-hint">Tiến độ lưu trên trình duyệt này (localStorage)</span>' +
          '</div>' +
        '</div>';
    } else if (s.type === 'sources') {
      inner = '<span class="eyebrow cin" style="--d:.04s">' + eyebrow + '</span>' +
        '<h2 class="st cin" style="--d:.1s">Nguồn — học sâu hơn</h2>' +
        '<ul class="src-list">' + lesson.sources.map(function (src, si) {
          var title = src.u
            ? '<a href="' + A.esc(src.u) + '" target="_blank" rel="noopener">' + A.esc(src.n) + '</a>'
            : '<b>' + A.esc(src.n) + '</b>';
          return '<li class="cin" style="--d:' + (0.16 + si * 0.08) + 's">' + title +
            (src.u ? '<span class="u">' + A.esc(src.u) + '</span>' : '') +
            '<span class="n">' + A.esc(src.note || '') + '</span></li>';
        }).join('') + '</ul>' +
        '<p class="src-note">Facts về IDE được verify trực tiếp từ docs chính chủ ngày ' + A.esc(DATA.meta.factsVerifiedAt || '—') + '. IDE cập nhật phiên bản → kiểm tra lại docs bản bạn dùng.</p>';
    }
    return '<section class="slide" id="s' + n + '" data-n="' + n + '" aria-label="' + n + ' trên ' + '{TOTAL}' + '"><div class="slide-inner">' + inner + '</div></section>';
  }

  /* outcome luôn đứng cuối deck (CTA tốt nghiệp) */
  var ordered = lesson.slides.filter(function (s) { return s.type !== 'outcome'; })
    .concat(lesson.slides.filter(function (s) { return s.type === 'outcome'; }));
  var total = ordered.length;

  stage.innerHTML = ordered.map(function (s, i) { return slideHTML(s, i + 1); }).join('');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  slides.forEach(function (el) {
    el.setAttribute('aria-label', el.getAttribute('aria-label').replace('{TOTAL}', String(total)));
  });

  /* dots */
  dotsWrap.innerHTML = slides.map(function (_, i) {
    return '<button type="button" data-go="' + i + '" role="tab" aria-label="Slide ' + (i + 1) + '" aria-selected="false"></button>';
  }).join('');
  var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('button'));

  counter.setAttribute('aria-label', 'Slide 1 trên ' + total);
  deckProgress.setAttribute('aria-valuemax', String(total));

  /* ---- navigation ---- */
  var cur = 0;
  (function initFromHash() {
    var m = location.hash.match(/slide-(\d+)/);
    if (m) {
      var n = parseInt(m[1], 10) - 1;
      if (n >= 0 && n < total) cur = n;
    }
  })();

  function render() {
    slides.forEach(function (el, i) {
      var on = i === cur;
      el.classList.toggle('active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) el.scrollTop = 0;
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('on', i === cur);
      d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
    });
    counter.textContent = (cur + 1) + ' / ' + total;
    counter.setAttribute('aria-label', 'Slide ' + (cur + 1) + ' trên ' + total);
    deckProgress.setAttribute('aria-valuenow', String(cur + 1));
    deckProgress.setAttribute('aria-valuetext', 'Slide ' + (cur + 1) + ' trên ' + total);
    deckFill.style.width = ((cur + 1) / total * 100) + '%';
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === total - 1;
    var h = '#slide-' + (cur + 1);
    if (location.hash !== h) {
      try { history.replaceState(null, '', h); } catch (e) { location.hash = h; }
    }
  }
  function go(n) {
    if (typeof n !== 'number' || isNaN(n)) return;
    n = Math.max(0, Math.min(total - 1, n));
    if (n === cur) return;
    cur = n;
    render();
  }
  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  dotsWrap.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b) go(parseInt(b.getAttribute('data-go'), 10));
  });
  deckProgress.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  });

  /* keyboard */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFs(); }
    else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMark(); }
  });

  /* hash change (back/forward) */
  window.addEventListener('hashchange', function () {
    var m = location.hash.match(/slide-(\d+)/);
    if (m) {
      var n = parseInt(m[1], 10) - 1;
      if (n >= 0 && n < total && n !== cur) { cur = n; render(); }
    }
  });

  /* swipe */
  var sx = 0, sy = 0, swiping = false;
  stage.addEventListener('touchstart', function (e) {
    var t = e.touches[0]; sx = t.clientX; sy = t.clientY; swiping = true;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else prev(); }
  });

  /* fullscreen — native + immersive fallback (KN-032: không throw)
   * Fullscreen documentElement (không phải stage) để thanh công cụ vẫn bấm được khi đang fullscreen
   * — thoát bằng nút hoặc Esc đều được. */
  function toggleFs() {
    var on = document.body.classList.toggle('immersive');
    try {
      if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        var p = document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(function () { A.toast('⛶ Chế độ tập trung — trình duyệt chặn fullscreen'); });
      } else if (!on && document.fullscreenElement) {
        var q = document.exitFullscreen();
        if (q && q.catch) q.catch(function () {});
      }
    } catch (err) {
      A.toast('⛶ Chế độ tập trung — fullscreen không khả dụng');
    }
  }
  fsBtn.addEventListener('click', toggleFs);
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) document.body.classList.remove('immersive');
  });

  /* mark */
  function paintMark() {
    var d = A.isDone(lesson.id);
    markBtn.setAttribute('aria-pressed', d ? 'true' : 'false');
    if (markTxt) markTxt.textContent = d ? 'Đã học ✓' : 'Đánh dấu đã học';
    var mb2 = document.getElementById('markBtn2');
    if (mb2) mb2.innerHTML = d ? '<span aria-hidden="true">↩</span> Bỏ đánh dấu đã học' : '<span aria-hidden="true">✓</span> Đánh dấu đã học';
  }
  function toggleMark() {
    var now = A.toggle(lesson.id);
    paintMark();
    A.toast(now
      ? '✓ Đã học bài ' + lesson.num + ' — tiến độ cập nhật ở trang chủ'
      : '↩ Đã bỏ đánh dấu bài ' + lesson.num);
  }
  markBtn.addEventListener('click', toggleMark);
  stage.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mark]');
    if (b) { e.preventDefault(); toggleMark(); }
  });

  paintMark();
  render();
})();
