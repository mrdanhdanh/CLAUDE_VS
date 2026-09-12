/* Agentic Academy — app.js (trang chủ)
 * Render: sys-tree diagram · lesson grid · progress (ring/bar/mini) · continue/reset · sync khi quay lại tab.
 */
(function () {
  'use strict';
  var A = window.Academy;
  var DATA = window.ACADEMY || { lessons: [] };
  var LESSONS = DATA.lessons || [];
  var TOTAL = LESSONS.length || 7;

  A.fixRelLinks();

  /* sys-tree diagram */
  var sysTree = document.getElementById('sysTree');
  if (sysTree) sysTree.innerHTML = window.ACADEMY_DIAGRAMS.build('file-tree');

  /* lesson grid */
  var grid = document.getElementById('lessonGrid');
  function cardHTML(l, i) {
    return '' +
      '<article class="lesson-card" data-lesson="' + l.id + '" style="--lc:' + l.accent + ';--d:' + (0.06 * i) + 's" tabindex="0" role="link" aria-label="Bài ' + l.num + ': ' + A.esc(l.title) + ' — mở bài học">' +
        '<div class="lc-top">' +
          '<span class="lc-num">' + String(l.num).padStart(2, '0') + '</span>' +
          '<span class="lc-ico" aria-hidden="true">' + l.icon + '</span>' +
          '<span class="lc-dur">' + A.esc(l.duration) + '</span>' +
        '</div>' +
        '<h3>' + A.esc(l.title) + '</h3>' +
        '<p>' + A.esc(l.desc) + '</p>' +
        '<div class="lc-foot">' +
          '<button class="status-chip" type="button" data-status="chua-hoc" aria-pressed="false" data-toggle="' + l.id + '" aria-label="Đánh dấu đã học: ' + A.esc(l.title) + '">Chưa học</button>' +
          l.tags.map(function (t) { return '<span class="tag">' + A.esc(t) + '</span>'; }).join('') +
        '</div>' +
      '</article>';
  }
  if (grid) {
    grid.innerHTML = LESSONS.map(cardHTML).join('');
    grid.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-toggle]');
      if (chip) {
        e.preventDefault();
        var idc = chip.getAttribute('data-toggle');
        var now = A.toggle(idc);
        A.toast(now ? '✓ Đã đánh dấu: ' + titleOf(idc) : '↩ Đã bỏ đánh dấu: ' + titleOf(idc));
        renderProgress();
        return;
      }
      var card = e.target.closest('.lesson-card');
      if (card) location.href = A.dirBase(location.pathname) + 'slides.html?lesson=' + card.getAttribute('data-lesson');
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.lesson-card');
      if (card && e.target === card) {
        e.preventDefault();
        location.href = A.dirBase(location.pathname) + 'slides.html?lesson=' + card.getAttribute('data-lesson');
      }
    });
  }

  function titleOf(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i].title;
    return id;
  }
  function doneCount() {
    return LESSONS.reduce(function (n, l) { return n + (A.isDone(l.id) ? 1 : 0); }, 0);
  }
  function firstIncomplete() {
    for (var i = 0; i < LESSONS.length; i++) if (!A.isDone(LESSONS[i].id)) return LESSONS[i];
    return LESSONS[0];
  }

  /* progress render — ring + bar + mini + list + continue */
  var ring = document.getElementById('ring');
  var ringNum = document.getElementById('ringNum');
  var barFill = document.getElementById('barFill');
  var bar = document.getElementById('progressBar');
  var progressText = document.getElementById('progressText');
  var miniBar = document.getElementById('miniBar');
  var miniText = document.getElementById('miniText');
  var continueBtn = document.getElementById('continueBtn');
  var continueBtn2 = document.getElementById('continueBtn2');
  var progList = document.getElementById('progList');

  function renderProgress() {
    var n = doneCount();
    var pct = Math.round((n / TOTAL) * 100);

    if (bar) bar.setAttribute('aria-valuenow', String(n));
    if (barFill) barFill.style.width = pct + '%';
    if (ring) ring.style.setProperty('--p', String(pct));
    if (ringNum) ringNum.textContent = n + '/' + TOTAL;
    if (progressText) progressText.innerHTML = n === TOTAL
      ? 'Đã học <b>' + n + '/' + TOTAL + '</b> bài — tốt nghiệp! 🎓'
      : 'Đã học <b>' + n + '/' + TOTAL + '</b> bài · còn ' + (TOTAL - n) + ' bài';
    if (miniBar) miniBar.style.width = pct + '%';
    if (miniText) miniText.textContent = n + '/' + TOTAL;

    LESSONS.forEach(function (l) {
      var chip = document.querySelector('[data-toggle="' + l.id + '"]');
      if (chip) {
        var d = A.isDone(l.id);
        chip.setAttribute('data-status', d ? 'da-hoc' : 'chua-hoc');
        chip.setAttribute('aria-pressed', String(d));
        chip.textContent = d ? '✓ Đã học' : 'Chưa học';
      }
    });

    var next = firstIncomplete();
    var href = A.dirBase(location.pathname) + 'slides.html?lesson=' + next.id;
    if (continueBtn) {
      continueBtn.href = href;
      continueBtn.innerHTML = n === 0 ? 'Bắt đầu học →' : (n === TOTAL ? 'Ôn lại bài 1 →' : 'Học tiếp: Bài ' + next.num + ' →');
    }
    if (continueBtn2) continueBtn2.href = href;

    if (progList) {
      progList.innerHTML = LESSONS.map(function (l) {
        var d = A.isDone(l.id);
        return '<li data-done="' + (d ? '1' : '0') + '"><span class="tick" aria-hidden="true">✓</span>' +
          'Bài ' + l.num + ' · ' + A.esc(l.title) + '</li>';
      }).join('');
    }
  }

  /* reset */
  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!window.confirm('Đặt lại toàn bộ tiến độ học? Không thể hoàn tác.')) return;
      A.reset();
      renderProgress();
      A.toast('↺ Đã đặt lại tiến độ — bắt đầu lại từ Bài 1');
    });
  }

  /* sync khi quay lại tab (học ở tab khác → progress cập nhật) */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) renderProgress();
  });

  renderProgress();
})();
