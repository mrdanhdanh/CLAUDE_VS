/**
 * 10 Bài Thuật Toán — Visualizer
 * Single-page app với navigation, animation, và từng bài thuật toán
 */

(function () {
  'use strict';

  // ============================================
  // Navigation
  // ============================================

  var nav = document.getElementById('nav');
  var sections = document.querySelectorAll('.bai-section');

  function switchBai(baiId) {
    // Update nav buttons
    var buttons = nav.querySelectorAll('.nav-item');
    buttons.forEach(function (btn) {
      if (btn.getAttribute('data-bai') === baiId) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });

    // Show/hide sections
    sections.forEach(function (section) {
      if (section.id === 'bai-' + baiId) {
        section.hidden = false;
      } else {
        section.hidden = true;
      }
    });
  }

  nav.addEventListener('click', function (e) {
    var btn = e.target.closest('.nav-item');
    if (!btn || btn.disabled) return;
    var baiId = btn.getAttribute('data-bai');
    switchBai(baiId);
  });

  // ============================================
  // Shared utilities
  // ============================================

  /**
   * Parse chuỗi input thành mảng số
   * @param {string} raw - Chuỗi input thô
   * @returns {{ valid: boolean, numbers: number[], error: string }}
   */
  function parseNumbers(raw) {
    if (!raw || !raw.trim()) {
      return { valid: false, numbers: [], error: 'Vui lòng nhập dãy số.' };
    }

    var parts = raw.split(',').map(function (s) { return s.trim(); });
    var numbers = [];

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '') {
        return { valid: false, numbers: [], error: 'Có ô trống giữa các số — kiểm tra lại dấu phẩy.' };
      }
      var num = Number(part);
      if (isNaN(num) || !isFinite(num)) {
        return { valid: false, numbers: [], error: '"' + part + '" không phải số hợp lệ.' };
      }
      numbers.push(num);
    }

    if (numbers.length < 2) {
      return { valid: false, numbers: [], error: 'Phải nhập ít nhất 2 số.' };
    }

    return { valid: true, numbers: numbers, error: '' };
  }

  /**
   * Generate random test data
   * @returns {string} Chuỗi số phân cách dấu phẩy
   */
  function generateRandomData() {
    var length = Math.floor(Math.random() * 6) + 5; // 5-10 số
    var numbers = [];
    for (var i = 0; i < length; i++) {
      var num = Math.floor(Math.random() * 200) - 100; // -100 đến 99
      numbers.push(num);
    }
    return numbers.join(', ');
  }

  /**
   * Sleep helper for animation
   * @param {number} ms
   * @returns {Promise}
   */
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // ============================================
  // Bài 001 — Tìm số lớn nhất (Linear Scan)
  // ============================================

  (function initBai001() {
    var input = document.getElementById('001-input');
    var findBtn = document.getElementById('001-find-btn');
    var randomBtn = document.getElementById('001-random-btn');
    var errorEl = document.getElementById('001-error');
    var vizCard = document.getElementById('001-viz-card');
    var arrayViz = document.getElementById('001-array-viz');
    var resultCard = document.getElementById('001-result-card');
    var resultValue = document.getElementById('001-result-value');
    var stepsCard = document.getElementById('001-steps-card');
    var stepsList = document.getElementById('001-steps-list');

    var isAnimating = false;

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
    }

    function renderArray(arr, currentIndex, maxIndex) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        if (i === currentIndex) {
          value.classList.add('current');
        } else if (i === maxIndex && i <= currentIndex) {
          value.classList.add('max');
        } else if (i < currentIndex) {
          value.classList.add('done');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    async function handleFind() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return;
      }

      isAnimating = true;
      findBtn.disabled = true;
      randomBtn.disabled = true;

      var arr = parsed.numbers;
      var max = arr[0];
      var maxIndex = 0;
      var steps = [];

      steps.push('Bắt đầu: max = ' + max);

      // Show initial array
      vizCard.hidden = false;
      renderArray(arr, 0, 0);
      await sleep(600);

      for (var i = 1; i < arr.length; i++) {
        renderArray(arr, i, maxIndex);
        await sleep(500);

        if (arr[i] > max) {
          steps.push('So sánh ' + arr[i] + ' với ' + max + ' → max = ' + arr[i]);
          max = arr[i];
          maxIndex = i;
          renderArray(arr, i, maxIndex);
        } else {
          steps.push('So sánh ' + arr[i] + ' với ' + max + ' → ' + max + ' lớn hơn');
          renderArray(arr, i, maxIndex);
        }

        await sleep(400);
      }

      steps.push('Kết quả: ' + max);

      // Final render
      arr.forEach(function (_, i) {
        var cells = arrayViz.querySelectorAll('.array-value');
        if (cells[i]) {
          cells[i].className = 'array-value done';
        }
      });

      // Show result
      resultValue.textContent = 'Số lớn nhất: ' + max;
      resultCard.hidden = false;

      // Show steps
      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      findBtn.disabled = false;
      randomBtn.disabled = false;
    }

    function handleRandom() {
      var data = generateRandomData();
      input.value = data;
      clearError();
      hideAll();
    }

    findBtn.addEventListener('click', handleFind);
    randomBtn.addEventListener('click', handleRandom);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleFind();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 002 — Đếm số lần xuất hiện (Counting)
  // ============================================

  (function initBai002() {
    var input = document.getElementById('002-input');
    var targetInput = document.getElementById('002-target');
    var countBtn = document.getElementById('002-count-btn');
    var randomBtn = document.getElementById('002-random-btn');
    var errorEl = document.getElementById('002-error');
    var vizCard = document.getElementById('002-viz-card');
    var arrayViz = document.getElementById('002-array-viz');
    var targetDisplay = document.getElementById('002-target-display');
    var resultCard = document.getElementById('002-result-card');
    var resultValue = document.getElementById('002-result-value');
    var stepsCard = document.getElementById('002-steps-card');
    var stepsList = document.getElementById('002-steps-list');

    var isAnimating = false;

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
    }

    function renderArray(arr, currentIndex, foundIndices, skipIndices) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        if (i === currentIndex) {
          value.classList.add('current');
        } else if (foundIndices.indexOf(i) !== -1) {
          value.classList.add('found');
        } else if (skipIndices.indexOf(i) !== -1) {
          value.classList.add('skip');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    async function handleCount() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return;
      }

      var targetRaw = targetInput.value.trim();
      if (targetRaw === '') {
        showError('Vui lòng nhập số cần tìm.');
        targetInput.focus();
        return;
      }

      var target = Number(targetRaw);
      if (isNaN(target)) {
        showError('Số cần tìm không hợp lệ.');
        targetInput.focus();
        return;
      }

      isAnimating = true;
      countBtn.disabled = true;
      randomBtn.disabled = true;

      var arr = parsed.numbers;
      var count = 0;
      var steps = [];
      var foundIndices = [];
      var skipIndices = [];

      targetDisplay.textContent = target;
      vizCard.hidden = false;

      renderArray(arr, 0, foundIndices, skipIndices);
      await sleep(600);

      for (var i = 0; i < arr.length; i++) {
        renderArray(arr, i, foundIndices, skipIndices);
        await sleep(500);

        if (arr[i] === target) {
          count++;
          foundIndices.push(i);
          steps.push(arr[i] + ' → tìm thấy → count = ' + count);
          renderArray(arr, i, foundIndices, skipIndices);
        } else {
          skipIndices.push(i);
          steps.push(arr[i] + ' → bỏ qua');
          renderArray(arr, i, foundIndices, skipIndices);
        }

        await sleep(300);
      }

      steps.push('Kết quả: ' + target + ' xuất hiện ' + count + ' lần');

      // Highlight all found positions
      if (foundIndices.length > 0) {
        steps.push('Highlight tất cả vị trí tìm thấy...');
        // Clear and re-render with highlight-all
        arrayViz.innerHTML = '';
        arr.forEach(function (num, i) {
          var cell = document.createElement('div');
          cell.className = 'array-cell';

          var value = document.createElement('div');
          value.className = 'array-value';
          value.textContent = num;

          if (foundIndices.indexOf(i) !== -1) {
            value.classList.add('highlight-all');
          } else {
            value.classList.add('skip');
          }

          var index = document.createElement('span');
          index.className = 'array-index';
          index.textContent = '[' + i + ']';

          cell.appendChild(value);
          cell.appendChild(index);
          arrayViz.appendChild(cell);
        });
        await sleep(800);
      }

      // Show result
      resultValue.textContent = target + ' xuất hiện ' + count + ' lần';
      resultCard.hidden = false;

      // Show steps
      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      countBtn.disabled = false;
      randomBtn.disabled = false;
    }

    function handleRandom() {
      var data = generateRandomData();
      input.value = data;
      // Pick a random element from the array as target
      var nums = data.split(',').map(function (s) { return Number(s.trim()); });
      var randomTarget = nums[Math.floor(Math.random() * nums.length)];
      targetInput.value = randomTarget;
      clearError();
      hideAll();
    }

    countBtn.addEventListener('click', handleCount);
    randomBtn.addEventListener('click', handleRandom);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleCount();
      }
    });

    targetInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleCount();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 003 — Linear Search
  // ============================================

  (function initBai003() {
    var input = document.getElementById('003-input');
    var targetInput = document.getElementById('003-target');
    var searchBtn = document.getElementById('003-search-btn');
    var randomBtn = document.getElementById('003-random-btn');
    var stepBtn = document.getElementById('003-step-btn');
    var resetBtn = document.getElementById('003-reset-btn');
    var errorEl = document.getElementById('003-error');
    var vizCard = document.getElementById('003-viz-card');
    var arrayViz = document.getElementById('003-array-viz');
    var targetDisplay = document.getElementById('003-target-display');
    var checkCountEl = document.getElementById('003-check-count');
    var resultCard = document.getElementById('003-result-card');
    var resultValue = document.getElementById('003-result-value');
    var stepsCard = document.getElementById('003-steps-card');
    var stepsList = document.getElementById('003-steps-list');

    var isAnimating = false;
    var searchState = null; // For step-by-step mode

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
      checkCountEl.textContent = '0';
      stepBtn.disabled = true;
      searchState = null;
    }

    function renderArray(arr, currentIndex, foundIndex, checkedIndices) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        if (i === currentIndex) {
          value.classList.add('current');
        } else if (i === foundIndex) {
          value.classList.add('found');
        } else if (checkedIndices.indexOf(i) !== -1) {
          value.classList.add('skip');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    function validateInput() {
      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return null;
      }

      var targetRaw = targetInput.value.trim();
      if (targetRaw === '') {
        showError('Vui lòng nhập số cần tìm.');
        targetInput.focus();
        return null;
      }

      var target = Number(targetRaw);
      if (isNaN(target)) {
        showError('Số cần tìm không hợp lệ.');
        targetInput.focus();
        return null;
      }

      return { numbers: parsed.numbers, target: target };
    }

    async function handleSearch() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      isAnimating = true;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      var arr = validated.numbers;
      var target = validated.target;
      var steps = [];
      var checkedIndices = [];
      var checkCount = 0;
      var result = -1;

      targetDisplay.textContent = target;
      vizCard.hidden = false;

      renderArray(arr, 0, -1, checkedIndices);
      await sleep(600);

      for (var i = 0; i < arr.length; i++) {
        renderArray(arr, i, -1, checkedIndices);
        checkCount++;
        checkCountEl.textContent = checkCount;
        await sleep(500);

        if (arr[i] === target) {
          result = i;
          steps.push(arr[i] + ' = ' + target + ' → TÌM THẤY tại vị trí ' + i);
          renderArray(arr, i, i, checkedIndices);
          break;
        } else {
          checkedIndices.push(i);
          steps.push(arr[i] + ' ≠ ' + target + ' → tiếp tục');
          renderArray(arr, i, -1, checkedIndices);
        }

        await sleep(300);
      }

      if (result === -1) {
        steps.push('Không tìm thấy ' + target);
        resultValue.textContent = 'Không tìm thấy';
      } else {
        resultValue.textContent = 'Tìm thấy ' + target + ' tại vị trí ' + result + '\nSố lần kiểm tra: ' + checkCount;
      }

      resultCard.hidden = false;

      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      searchState = {
        arr: validated.numbers,
        target: validated.target,
        currentIndex: 0,
        checkedIndices: [],
        checkCount: 0,
        result: -1,
        done: false
      };

      targetDisplay.textContent = validated.target;
      vizCard.hidden = false;
      renderArray(searchState.arr, 0, -1, []);
      stepBtn.disabled = false;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
    }

    function handleStep() {
      if (!searchState || searchState.done) return;

      var arr = searchState.arr;
      var target = searchState.target;
      var i = searchState.currentIndex;

      if (i >= arr.length) {
        // Not found
        searchState.done = true;
        stepBtn.disabled = true;

        var steps = [];
        if (searchState.result === -1) {
          steps.push('Không tìm thấy ' + target);
          resultValue.textContent = 'Không tìm thấy';
        }

        resultCard.hidden = false;

        if (steps.length > 0) {
          stepsList.innerHTML = '';
          steps.forEach(function (step) {
            var li = document.createElement('li');
            li.textContent = step;
            li.classList.add('step-final');
            stepsList.appendChild(li);
          });
          stepsCard.hidden = false;
        }

        searchBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      // Check current element
      searchState.checkCount++;
      checkCountEl.textContent = searchState.checkCount;

      if (arr[i] === target) {
        searchState.result = i;
        searchState.done = true;
        stepBtn.disabled = true;

        renderArray(arr, i, i, searchState.checkedIndices);

        var step = arr[i] + ' = ' + target + ' → TÌM THẤY tại vị trí ' + i;
        var li = document.createElement('li');
        li.textContent = step;
        li.classList.add('step-final');
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        resultValue.textContent = 'Tìm thấy ' + target + ' tại vị trí ' + i + '\nSố lần kiểm tra: ' + searchState.checkCount;
        resultCard.hidden = false;

        searchBtn.disabled = false;
        randomBtn.disabled = false;
      } else {
        searchState.checkedIndices.push(i);
        renderArray(arr, i, -1, searchState.checkedIndices);

        var step = arr[i] + ' ≠ ' + target + ' → tiếp tục';
        var li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        searchState.currentIndex++;
      }
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
    }

    function handleRandom() {
      var data = generateRandomData();
      input.value = data;
      var nums = data.split(',').map(function (s) { return Number(s.trim()); });
      var randomTarget = nums[Math.floor(Math.random() * nums.length)];
      targetInput.value = randomTarget;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    searchBtn.addEventListener('click', handleSearch);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!searchState) {
        initStepMode();
      } else if (!searchState.done) {
        handleStep();
      }
    });
    resetBtn.addEventListener('click', handleReset);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    targetInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 004 — Bubble Sort Visualizer
  // ============================================

  (function initBai004() {
    var input = document.getElementById('004-input');
    var startBtn = document.getElementById('004-start-btn');
    var randomBtn = document.getElementById('004-random-btn');
    var stepBtn = document.getElementById('004-step-btn');
    var resetBtn = document.getElementById('004-reset-btn');
    var speedSlider = document.getElementById('004-speed');
    var speedVal = document.getElementById('004-speed-val');
    var errorEl = document.getElementById('004-error');
    var vizCard = document.getElementById('004-viz-card');
    var arrayViz = document.getElementById('004-array-viz');
    var outerLoopEl = document.getElementById('004-outer-loop');
    var posEl = document.getElementById('004-pos');
    var comparisonsEl = document.getElementById('004-comparisons');
    var swapsEl = document.getElementById('004-swaps');
    var resultCard = document.getElementById('004-result-card');
    var resultValue = document.getElementById('004-result-value');
    var stepsCard = document.getElementById('004-steps-card');
    var stepsList = document.getElementById('004-steps-list');

    var isAnimating = false;
    var sortState = null;
    var autoRunTimer = null;
    var stepMode = false; // Track if user switched to step mode

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
      outerLoopEl.textContent = '0';
      posEl.textContent = '0';
      comparisonsEl.textContent = '0';
      swapsEl.textContent = '0';
      stepBtn.disabled = true;
      sortState = null;
      stopAutoRun();
    }

    function getSpeed() {
      return parseInt(speedSlider.value, 10);
    }

    function updateSpeedDisplay() {
      speedVal.textContent = getSpeed() + 'ms';
    }

    function renderArray(arr, comparingIdx, sortedIdx, swapIdx) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        if (swapIdx !== -1 && (i === swapIdx || i === swapIdx + 1)) {
          value.classList.add('swapping');
        } else if (comparingIdx !== -1 && (i === comparingIdx || i === comparingIdx + 1)) {
          value.classList.add('comparing');
        } else if (sortedIdx !== -1 && i >= sortedIdx) {
          value.classList.add('sorted');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    function validateInput() {
      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return null;
      }

      return parsed.numbers;
    }

    function initSortState(arr) {
      return {
        arr: arr.slice(), // Copy array
        n: arr.length,
        outerI: 0,
        innerJ: 0,
        comparisons: 0,
        swaps: 0,
        done: false,
        sortedFrom: arr.length, // Index from which array is sorted
        swappedThisPass: false
      };
    }

    function handleStart() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var arr = validateInput();
      if (!arr) return;

      sortState = initSortState(arr);
      vizCard.hidden = false;
      startBtn.disabled = true;
      stepBtn.disabled = false;
      renderArray(sortState.arr, -1, sortState.sortedFrom, -1);
    }

    function initStepMode() {
      clearError();
      hideAll();

      var arr = validateInput();
      if (!arr) return;

      sortState = initSortState(arr);
      vizCard.hidden = false;
      stepBtn.disabled = false;
      renderArray(sortState.arr, -1, sortState.sortedFrom, -1);
    }

    function handleStep() {
      if (!sortState || sortState.done || isAnimating) return;

      performSingleStep();
    }

    function performSingleStep() {
      var arr = sortState.arr;
      var n = sortState.n;

      if (sortState.outerI >= n - 1) {
        // Sorting complete
        sortState.done = true;
        stepBtn.disabled = true;
        stopAutoRun();

        // Mark all as sorted
        renderArray(arr, -1, 0, -1);

        var steps = [];
        steps.push('Hoàn thành! Mảng đã được sắp xếp.');
        steps.push('Tổng số lần so sánh: ' + sortState.comparisons);
        steps.push('Tổng số lần hoán đổi: ' + sortState.swaps);

        resultValue.textContent = arr.join(', ');
        resultCard.hidden = false;

        stepsList.innerHTML = '';
        steps.forEach(function (step, index) {
          var li = document.createElement('li');
          li.textContent = step;
          if (index === steps.length - 1) {
            li.classList.add('step-final');
          }
          stepsList.appendChild(li);
        });
        stepsCard.hidden = false;

        startBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      // Perform one comparison
      var j = sortState.innerJ;
      var comparingIdx = j;
      sortState.comparisons++;
      comparisonsEl.textContent = sortState.comparisons;
      outerLoopEl.textContent = sortState.outerI + 1;
      posEl.textContent = j;

      renderArray(arr, comparingIdx, sortState.sortedFrom, -1);

      var step = 'Vòng ' + (sortState.outerI + 1) + ': So sánh arr[' + j + ']=' + arr[j] + ' với arr[' + (j + 1) + ']=' + arr[j + 1];

      if (arr[j] > arr[j + 1]) {
        // Swap
        step += ' → ' + arr[j] + ' > ' + arr[j + 1] + ' → Hoán đổi';
        var temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        sortState.swaps++;
        swapsEl.textContent = sortState.swaps;
        sortState.swappedThisPass = true;

        renderArray(arr, -1, sortState.sortedFrom, j);
      } else {
        step += ' → ' + arr[j] + ' ≤ ' + arr[j + 1] + ' → Giữ nguyên';
      }

      var li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
      stepsCard.hidden = false;

      // Move to next position
      sortState.innerJ++;

      // Check if inner loop is complete
      if (sortState.innerJ >= n - sortState.outerI - 1) {
        sortState.sortedFrom = n - sortState.outerI - 1;
        sortState.outerI++;
        sortState.innerJ = 0;

        // Check if no swaps were made in this pass
        if (!sortState.swappedThisPass) {
          sortState.done = true;
          stepBtn.disabled = true;
          stopAutoRun();

          // Mark all as sorted
          renderArray(arr, -1, 0, -1);

          var steps = [];
          steps.push('Mảng đã được sắp xếp sớm tại vòng ' + sortState.outerI + '!');
          steps.push('Tổng số lần so sánh: ' + sortState.comparisons);
          steps.push('Tổng số lần hoán đổi: ' + sortState.swaps);

          resultValue.textContent = arr.join(', ');
          resultCard.hidden = false;

          stepsList.innerHTML = '';
          steps.forEach(function (step, index) {
            var li = document.createElement('li');
            li.textContent = step;
            if (index === steps.length - 1) {
              li.classList.add('step-final');
            }
            stepsList.appendChild(li);
          });
          stepsCard.hidden = false;

          startBtn.disabled = false;
          randomBtn.disabled = false;
          return;
        }

        sortState.swappedThisPass = false;
      }

      renderArray(arr, -1, sortState.sortedFrom, -1);
    }

    function startAutoRun() {
      if (isAnimating) return;
      isAnimating = true;
      startBtn.disabled = true;
      randomBtn.disabled = true;
      // Keep stepBtn enabled so user can switch to step mode

      function tick() {
        if (!sortState || sortState.done) {
          isAnimating = false;
          startBtn.disabled = false;
          randomBtn.disabled = false;
          return;
        }

        performSingleStep();
        autoRunTimer = setTimeout(tick, getSpeed());
      }

      tick();
    }

    function stopAutoRun() {
      if (autoRunTimer) {
        clearTimeout(autoRunTimer);
        autoRunTimer = null;
      }
      isAnimating = false;
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      startBtn.disabled = false;
      randomBtn.disabled = false;
      stepMode = false;
    }

    function handleRandom() {
      var data = generateRandomData();
      input.value = data;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    startBtn.addEventListener('click', function () {
      if (stepMode) return; // Don't auto-run if in step mode
      if (sortState && !sortState.done) {
        startAutoRun();
      } else {
        handleStart();
        startAutoRun();
      }
    });

    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!sortState) {
        initStepMode();
        stepMode = true;
      } else if (isAnimating) {
        stopAutoRun();
        stepMode = true;
        stepBtn.disabled = false;
        startBtn.disabled = false;
        randomBtn.disabled = false;
      } else if (!sortState.done) {
        handleStep();
      }
    });
    resetBtn.addEventListener('click', handleReset);
    speedSlider.addEventListener('input', updateSpeedDisplay);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleStart();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });

    // Initialize speed display
    updateSpeedDisplay();
  })();

  // ============================================
  // Bài 005 — Binary Search
  // ============================================

  (function initBai005() {
    var input = document.getElementById('005-input');
    var targetInput = document.getElementById('005-target');
    var searchBtn = document.getElementById('005-search-btn');
    var randomBtn = document.getElementById('005-random-btn');
    var stepBtn = document.getElementById('005-step-btn');
    var resetBtn = document.getElementById('005-reset-btn');
    var errorEl = document.getElementById('005-error');
    var vizCard = document.getElementById('005-viz-card');
    var arrayViz = document.getElementById('005-array-viz');
    var leftValEl = document.getElementById('005-left-val');
    var midValEl = document.getElementById('005-mid-val');
    var rightValEl = document.getElementById('005-right-val');
    var comparisonsEl = document.getElementById('005-comparisons');
    var resultCard = document.getElementById('005-result-card');
    var resultValue = document.getElementById('005-result-value');
    var stepsCard = document.getElementById('005-steps-card');
    var stepsList = document.getElementById('005-steps-list');
    var comparisonCard = document.getElementById('005-comparison-card');
    var arraySizeSelect = document.getElementById('005-array-size');
    var compareBtn = document.getElementById('005-compare-btn');
    var comparisonResult = document.getElementById('005-comparison-result');
    var linearBar = document.getElementById('005-linear-bar');
    var binaryBar = document.getElementById('005-binary-bar');
    var linearCount = document.getElementById('005-linear-count');
    var binaryCount = document.getElementById('005-binary-count');
    var comparisonWinner = document.getElementById('005-comparison-winner');

    var isAnimating = false;
    var searchState = null;

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
      leftValEl.textContent = '0';
      midValEl.textContent = '0';
      rightValEl.textContent = '0';
      comparisonsEl.textContent = '0';
      stepBtn.disabled = true;
      searchState = null;
    }

    function renderArray(arr, left, mid, right, eliminatedSet, foundIndex) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        if (i === foundIndex) {
          value.classList.add('found');
        } else if (eliminatedSet[i]) {
          value.classList.add('eliminated');
        } else if (i === mid) {
          value.classList.add('mid-pointer');
        } else if (i === left) {
          value.classList.add('left-pointer');
        } else if (i === right) {
          value.classList.add('right-pointer');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    function validateInput() {
      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return null;
      }

      // Check if array is sorted ascending
      for (var i = 1; i < parsed.numbers.length; i++) {
        if (parsed.numbers[i] < parsed.numbers[i - 1]) {
          showError('Mảng phải được sắp xếp tăng dần. Phần tử ' + parsed.numbers[i] + ' nhỏ hơn ' + parsed.numbers[i - 1] + '.');
          input.focus();
          return null;
        }
      }

      var targetRaw = targetInput.value.trim();
      if (targetRaw === '') {
        showError('Vui lòng nhập số cần tìm.');
        targetInput.focus();
        return null;
      }

      var target = Number(targetRaw);
      if (isNaN(target) || !isFinite(target)) {
        showError('Số cần tìm không hợp lệ.');
        targetInput.focus();
        return null;
      }

      return { numbers: parsed.numbers, target: target };
    }

    async function handleSearch() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      isAnimating = true;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      var arr = validated.numbers;
      var target = validated.target;
      var steps = [];
      var eliminatedSet = {};
      var comparisons = 0;
      var result = -1;

      var left = 0;
      var right = arr.length - 1;

      vizCard.hidden = false;
      comparisonCard.hidden = false;

      renderArray(arr, left, -1, right, eliminatedSet, -1);
      await sleep(600);

      while (left <= right) {
        var mid = Math.floor((left + right) / 2);
        comparisons++;
        comparisonsEl.textContent = comparisons;
        leftValEl.textContent = left;
        midValEl.textContent = mid;
        rightValEl.textContent = right;

        renderArray(arr, left, mid, right, eliminatedSet, -1);
        await sleep(500);

        if (arr[mid] === target) {
          result = mid;
          steps.push('arr[' + mid + '] = ' + arr[mid] + ' = ' + target + ' → TÌM THẤY tại vị trí ' + mid);
          renderArray(arr, left, mid, right, eliminatedSet, mid);
          break;
        } else if (arr[mid] < target) {
          steps.push('arr[' + mid + '] = ' + arr[mid] + ' < ' + target + ' → Bỏ nửa bên trái, left = ' + (mid + 1));
          // Eliminate left half
          for (var i = left; i <= mid; i++) {
            eliminatedSet[i] = true;
          }
          left = mid + 1;
        } else {
          steps.push('arr[' + mid + '] = ' + arr[mid] + ' > ' + target + ' → Bỏ nửa bên phải, right = ' + (mid - 1));
          // Eliminate right half
          for (var i = mid; i <= right; i++) {
            eliminatedSet[i] = true;
          }
          right = mid - 1;
        }

        renderArray(arr, left, -1, right, eliminatedSet, -1);
        await sleep(400);
      }

      if (result === -1) {
        steps.push('Không tìm thấy ' + target);
        resultValue.textContent = 'Không tìm thấy';
      } else {
        resultValue.textContent = 'Tìm thấy ' + target + ' tại vị trí ' + result + '\nSố lần kiểm tra: ' + comparisons;
      }

      resultCard.hidden = false;

      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      searchState = {
        arr: validated.numbers,
        target: validated.target,
        left: 0,
        right: validated.numbers.length - 1,
        eliminatedSet: {},
        comparisons: 0,
        done: false
      };

      vizCard.hidden = false;
      comparisonCard.hidden = false;
      renderArray(searchState.arr, searchState.left, -1, searchState.right, searchState.eliminatedSet, -1);
      stepBtn.disabled = false;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
    }

    function handleStep() {
      if (!searchState || searchState.done) return;

      var arr = searchState.arr;
      var target = searchState.target;
      var left = searchState.left;
      var right = searchState.right;

      if (left > right) {
        // Not found
        searchState.done = true;
        stepBtn.disabled = true;

        var step = 'left (' + left + ') > right (' + right + ') → Không tìm thấy ' + target;
        var li = document.createElement('li');
        li.textContent = step;
        li.classList.add('step-final');
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        resultValue.textContent = 'Không tìm thấy';
        resultCard.hidden = false;

        searchBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      // Perform one step of binary search
      var mid = Math.floor((left + right) / 2);
      searchState.comparisons++;
      searchState.mid = mid;

      leftValEl.textContent = left;
      midValEl.textContent = mid;
      rightValEl.textContent = right;
      comparisonsEl.textContent = searchState.comparisons;

      renderArray(arr, left, mid, right, searchState.eliminatedSet, -1);

      var step;
      if (arr[mid] === target) {
        searchState.done = true;
        stepBtn.disabled = true;

        step = 'arr[' + mid + '] = ' + arr[mid] + ' = ' + target + ' → TÌM THẤY tại vị trí ' + mid;
        var li = document.createElement('li');
        li.textContent = step;
        li.classList.add('step-final');
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        renderArray(arr, left, mid, right, searchState.eliminatedSet, mid);

        resultValue.textContent = 'Tìm thấy ' + target + ' tại vị trí ' + mid + '\nSố lần kiểm tra: ' + searchState.comparisons;
        resultCard.hidden = false;

        searchBtn.disabled = false;
        randomBtn.disabled = false;
      } else if (arr[mid] < target) {
        step = 'arr[' + mid + '] = ' + arr[mid] + ' < ' + target + ' → Bỏ nửa bên trái, left = ' + (mid + 1);
        // Eliminate left half
        for (var i = left; i <= mid; i++) {
          searchState.eliminatedSet[i] = true;
        }
        searchState.left = mid + 1;

        var li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        renderArray(arr, searchState.left, -1, right, searchState.eliminatedSet, -1);
      } else {
        step = 'arr[' + mid + '] = ' + arr[mid] + ' > ' + target + ' → Bỏ nửa bên phải, right = ' + (mid - 1);
        // Eliminate right half
        for (var i = mid; i <= right; i++) {
          searchState.eliminatedSet[i] = true;
        }
        searchState.right = mid - 1;

        var li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
        stepsCard.hidden = false;

        renderArray(arr, left, -1, searchState.right, searchState.eliminatedSet, -1);
      }
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
      comparisonCard.hidden = true;
      comparisonResult.hidden = true;
    }

    function handleRandom() {
      // Generate sorted array
      var length = Math.floor(Math.random() * 8) + 5; // 5-12 elements
      var numbers = [];
      var current = Math.floor(Math.random() * 20) - 10;
      for (var i = 0; i < length; i++) {
        current += Math.floor(Math.random() * 10) + 1;
        numbers.push(current);
      }
      input.value = numbers.join(', ');
      // Pick random target from array
      var randomTarget = numbers[Math.floor(Math.random() * numbers.length)];
      targetInput.value = randomTarget;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    // Comparison: Linear Search vs Binary Search
    function runComparison() {
      var size = parseInt(arraySizeSelect.value, 10);

      // Generate sorted array of given size
      var arr = [];
      var current = Math.floor(Math.random() * 20) - 10;
      for (var i = 0; i < size; i++) {
        current += Math.floor(Math.random() * 10) + 1;
        arr.push(current);
      }

      // Pick a random target (worst case: not in array, or last element)
      var target = arr[Math.floor(Math.random() * arr.length)];

      // Linear Search
      var linearComparisons = 0;
      for (var i = 0; i < arr.length; i++) {
        linearComparisons++;
        if (arr[i] === target) {
          break;
        }
      }

      // Binary Search
      var binaryComparisons = 0;
      var left = 0;
      var right = arr.length - 1;
      while (left <= right) {
        binaryComparisons++;
        var mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
          break;
        } else if (arr[mid] < target) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      // Display results
      comparisonResult.hidden = false;

      // Calculate bar widths (logarithmic scale for better visualization)
      var maxComparisons = Math.max(linearComparisons, binaryComparisons);
      var linearBarWidth = Math.max(5, Math.round((linearComparisons / maxComparisons) * 100));
      var binaryBarWidth = Math.max(5, Math.round((binaryComparisons / maxComparisons) * 100));

      linearBar.style.width = linearBarWidth + '%';
      binaryBar.style.width = binaryBarWidth + '%';
      linearCount.textContent = linearComparisons + ' lần';
      binaryCount.textContent = binaryComparisons + ' lần';

      var winnerText = '';
      if (binaryComparisons < linearComparisons) {
        var ratio = (linearComparisons / binaryComparisons).toFixed(1);
        winnerText = '🏆 Binary Search nhanh hơn ' + ratio + ' lần! (O(log n) vs O(n))';
      } else if (binaryComparisons === linearComparisons) {
        winnerText = '🤝 Hai thuật toán có số lần kiểm tra bằng nhau';
      } else {
        winnerText = 'Linear Search nhanh hơn (trường hợp đặc biệt)';
      }
      comparisonWinner.textContent = winnerText;
    }

    searchBtn.addEventListener('click', handleSearch);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!searchState) {
        initStepMode();
      } else if (!searchState.done) {
        handleStep();
      }
    });
    resetBtn.addEventListener('click', handleReset);
    compareBtn.addEventListener('click', runComparison);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    targetInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 006 — Two Pointers
  // ============================================

  (function initBai006() {
    var input = document.getElementById('006-input');
    var targetInput = document.getElementById('006-target');
    var searchBtn = document.getElementById('006-search-btn');
    var randomBtn = document.getElementById('006-random-btn');
    var stepBtn = document.getElementById('006-step-btn');
    var autoBtn = document.getElementById('006-auto-btn');
    var resetBtn = document.getElementById('006-reset-btn');
    var errorEl = document.getElementById('006-error');
    var vizCard = document.getElementById('006-viz-card');
    var arrayViz = document.getElementById('006-array-viz');
    var leftValEl = document.getElementById('006-left-val');
    var rightValEl = document.getElementById('006-right-val');
    var sumValEl = document.getElementById('006-sum-val');
    var comparisonsEl = document.getElementById('006-comparisons');
    var pairsFoundEl = document.getElementById('006-pairs-found');
    var pairsListEl = document.getElementById('006-pairs-list');
    var resultCard = document.getElementById('006-result-card');
    var resultValue = document.getElementById('006-result-value');
    var stepsCard = document.getElementById('006-steps-card');
    var stepsList = document.getElementById('006-steps-list');
    var comparisonCard = document.getElementById('006-comparison-card');
    var arraySizeSelect = document.getElementById('006-array-size');
    var compareBtn = document.getElementById('006-compare-btn');
    var comparisonResult = document.getElementById('006-comparison-result');
    var bruteBar = document.getElementById('006-brute-bar');
    var twoPtrBar = document.getElementById('006-twoptr-bar');
    var bruteCount = document.getElementById('006-brute-count');
    var twoPtrCount = document.getElementById('006-twoptr-count');
    var comparisonWinner = document.getElementById('006-comparison-winner');

    var isAnimating = false;
    var autoTimer = null;
    var searchState = null;

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      stepsList.innerHTML = '';
      pairsListEl.innerHTML = '';
      pairsFoundEl.hidden = true;
      leftValEl.textContent = '0';
      rightValEl.textContent = '0';
      sumValEl.textContent = '0';
      comparisonsEl.textContent = '0';
      stepBtn.disabled = false;
      searchState = null;
      stopAuto();
    }

    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      isAnimating = false;
      autoBtn.textContent = '▶ Chạy tự động';
    }

    function renderArray(arr, left, right, foundPairs, eliminatedSet) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        // Check if this index is part of a found pair
        var isInFoundPair = false;
        for (var p = 0; p < foundPairs.length; p++) {
          if (foundPairs[p][0] === i || foundPairs[p][1] === i) {
            isInFoundPair = true;
            break;
          }
        }

        if (isInFoundPair) {
          value.classList.add('pair-found');
        } else if (eliminatedSet && eliminatedSet[i]) {
          value.classList.add('eliminated');
        } else if (i === left) {
          value.classList.add('left-pointer');
        } else if (i === right) {
          value.classList.add('right-pointer');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    function validateInput() {
      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return null;
      }

      for (var i = 1; i < parsed.numbers.length; i++) {
        if (parsed.numbers[i] < parsed.numbers[i - 1]) {
          showError('Mảng phải được sắp xếp tăng dần. Phần tử ' + parsed.numbers[i] + ' nhỏ hơn ' + parsed.numbers[i - 1] + '.');
          input.focus();
          return null;
        }
      }

      var targetRaw = targetInput.value.trim();
      if (targetRaw === '') {
        showError('Vui lòng nhập Target.');
        targetInput.focus();
        return null;
      }

      var target = Number(targetRaw);
      if (isNaN(target) || !isFinite(target)) {
        showError('Target không hợp lệ.');
        targetInput.focus();
        return null;
      }

      return { numbers: parsed.numbers, target: target };
    }

    function updatePairsList(pairs, arr) {
      pairsListEl.innerHTML = '';
      pairs.forEach(function (pair) {
        var li = document.createElement('li');
        li.textContent = arr[pair[0]] + ' + ' + arr[pair[1]] + ' = ' + (arr[pair[0]] + arr[pair[1]]);
        pairsListEl.appendChild(li);
      });
      if (pairs.length > 0) {
        pairsFoundEl.hidden = false;
      }
    }

    async function handleSearch() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      isAnimating = true;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;
      autoBtn.disabled = true;

      var arr = validated.numbers;
      var target = validated.target;
      var steps = [];
      var foundPairs = [];
      var eliminatedSet = {};
      var comparisons = 0;

      var left = 0;
      var right = arr.length - 1;

      vizCard.hidden = false;
      comparisonCard.hidden = false;

      renderArray(arr, left, right, foundPairs, eliminatedSet);
      await sleep(600);

      while (left < right) {
        var sum = arr[left] + arr[right];
        comparisons++;
        comparisonsEl.textContent = comparisons;
        leftValEl.textContent = left;
        rightValEl.textContent = right;
        sumValEl.textContent = sum;

        renderArray(arr, left, right, foundPairs, eliminatedSet);
        await sleep(500);

        if (sum === target) {
          foundPairs.push([left, right]);
          steps.push(arr[left] + ' + ' + arr[right] + ' = ' + sum + ' = ' + target + ' → Tìm thấy! (' + left + ',' + right + ')');
          updatePairsList(foundPairs, arr);
          renderArray(arr, left, right, foundPairs, eliminatedSet);
          left++;
          right--;
        } else if (sum < target) {
          steps.push(arr[left] + ' + ' + arr[right] + ' = ' + sum + ' < ' + target + ' → left++');
          left++;
        } else {
          steps.push(arr[left] + ' + ' + arr[right] + ' = ' + sum + ' > ' + target + ' → right--');
          right--;
        }

        await sleep(400);
      }

      if (foundPairs.length === 0) {
        steps.push('Không có cặp nào có tổng bằng ' + target);
        resultValue.textContent = 'Không có cặp nào';
      } else {
        var pairStrs = foundPairs.map(function (p) { return '(' + arr[p[0]] + ',' + arr[p[1]] + ')'; });
        resultValue.textContent = 'Tìm thấy ' + foundPairs.length + ' cặp: ' + pairStrs.join(', ') + '\nSố lần kiểm tra: ' + comparisons;
      }

      resultCard.hidden = false;

      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      searchState = {
        arr: validated.numbers,
        target: validated.target,
        left: 0,
        right: validated.numbers.length - 1,
        foundPairs: [],
        eliminatedSet: {},
        comparisons: 0,
        done: false
      };

      vizCard.hidden = false;
      comparisonCard.hidden = false;
      renderArray(searchState.arr, searchState.left, searchState.right, searchState.foundPairs, searchState.eliminatedSet);
      leftValEl.textContent = searchState.left;
      rightValEl.textContent = searchState.right;
      stepBtn.disabled = false;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      autoBtn.disabled = true;
    }

    function handleStep() {
      if (!searchState || searchState.done) return;

      var arr = searchState.arr;
      var target = searchState.target;
      var left = searchState.left;
      var right = searchState.right;

      if (left >= right) {
        searchState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        var step;
        if (searchState.foundPairs.length === 0) {
          step = 'left (' + left + ') >= right (' + right + ') → Không có cặp nào';
          resultValue.textContent = 'Không có cặp nào';
        } else {
          var pairStrs = searchState.foundPairs.map(function (p) { return '(' + arr[p[0]] + ',' + arr[p[1]] + ')'; });
          step = 'Hoàn thành! Tìm thấy ' + searchState.foundPairs.length + ' cặp: ' + pairStrs.join(', ');
          resultValue.textContent = 'Tìm thấy ' + searchState.foundPairs.length + ' cặp: ' + pairStrs.join(', ') + '\nSố lần kiểm tra: ' + searchState.comparisons;
        }

        var li = document.createElement('li');
        li.textContent = step;
        li.classList.add('step-final');
        stepsList.appendChild(li);
        stepsCard.hidden = false;
        resultCard.hidden = false;

        searchBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      var sum = arr[left] + arr[right];
      searchState.comparisons++;
      comparisonsEl.textContent = searchState.comparisons;
      leftValEl.textContent = left;
      rightValEl.textContent = right;
      sumValEl.textContent = sum;

      renderArray(arr, left, right, searchState.foundPairs, searchState.eliminatedSet);

      var step;
      if (sum === target) {
        searchState.foundPairs.push([left, right]);
        step = arr[left] + ' + ' + arr[right] + ' = ' + sum + ' = ' + target + ' → Tìm thấy! (' + left + ',' + right + ')';
        updatePairsList(searchState.foundPairs, arr);
        searchState.left++;
        searchState.right--;
      } else if (sum < target) {
        step = arr[left] + ' + ' + arr[right] + ' = ' + sum + ' < ' + target + ' → left++';
        searchState.left++;
      } else {
        step = arr[left] + ' + ' + arr[right] + ' = ' + sum + ' > ' + target + ' → right--';
        searchState.right--;
      }

      var li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
      stepsCard.hidden = false;

      renderArray(arr, searchState.left, searchState.right, searchState.foundPairs, searchState.eliminatedSet);
    }

    function handleAuto() {
      if (isAnimating) {
        stopAuto();
        return;
      }

      if (!searchState) {
        initStepMode();
        if (!searchState) return;
      }

      isAnimating = true;
      autoBtn.textContent = '⏸ Dừng';
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      function tick() {
        if (!searchState || searchState.done) {
          stopAuto();
          searchBtn.disabled = false;
          randomBtn.disabled = false;
          stepBtn.disabled = false;
          return;
        }
        handleStep();
        autoTimer = setTimeout(tick, 600);
      }

      tick();
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
      autoBtn.disabled = false;
      comparisonCard.hidden = true;
      comparisonResult.hidden = true;
    }

    function handleRandom() {
      var length = Math.floor(Math.random() * 6) + 5;
      var numbers = [];
      var current = Math.floor(Math.random() * 20) - 10;
      for (var i = 0; i < length; i++) {
        current += Math.floor(Math.random() * 10) + 1;
        numbers.push(current);
      }
      input.value = numbers.join(', ');
      var target = numbers[Math.floor(Math.random() * numbers.length)] + numbers[Math.floor(Math.random() * numbers.length)];
      targetInput.value = target;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    function runComparison() {
      var size = parseInt(arraySizeSelect.value, 10);

      var arr = [];
      var current = Math.floor(Math.random() * 20) - 10;
      for (var i = 0; i < size; i++) {
        current += Math.floor(Math.random() * 10) + 1;
        arr.push(current);
      }

      var target = arr[Math.floor(Math.random() * arr.length)] + arr[Math.floor(Math.random() * arr.length)];

      // Brute Force O(n²)
      var bruteComparisons = 0;
      for (var i = 0; i < arr.length; i++) {
        for (var j = i + 1; j < arr.length; j++) {
          bruteComparisons++;
          if (arr[i] + arr[j] === target) {
            // Don't break — count all
          }
        }
      }

      // Two Pointers O(n)
      var twoPtrComparisons = 0;
      var left = 0;
      var right = arr.length - 1;
      while (left < right) {
        twoPtrComparisons++;
        var sum = arr[left] + arr[right];
        if (sum === target) {
          left++;
          right--;
        } else if (sum < target) {
          left++;
        } else {
          right--;
        }
      }

      comparisonResult.hidden = false;

      var maxComparisons = Math.max(bruteComparisons, twoPtrComparisons);
      var bruteBarWidth = Math.max(5, Math.round((bruteComparisons / maxComparisons) * 100));
      var twoPtrBarWidth = Math.max(5, Math.round((twoPtrComparisons / maxComparisons) * 100));

      bruteBar.style.width = bruteBarWidth + '%';
      twoPtrBar.style.width = twoPtrBarWidth + '%';
      bruteCount.textContent = bruteComparisons + ' lần';
      twoPtrCount.textContent = twoPtrComparisons + ' lần';

      var winnerText = '';
      if (twoPtrComparisons < bruteComparisons) {
        var ratio = (bruteComparisons / twoPtrComparisons).toFixed(1);
        winnerText = '🏆 Two Pointers nhanh hơn ' + ratio + ' lần! (O(n) vs O(n²))';
      } else if (twoPtrComparisons === bruteComparisons) {
        winnerText = '🤝 Hai thuật toán có số lần kiểm tra bằng nhau';
      } else {
        winnerText = 'Brute Force nhanh hơn (trường hợp đặc biệt)';
      }
      comparisonWinner.textContent = winnerText;
    }

    searchBtn.addEventListener('click', handleSearch);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!searchState) {
        initStepMode();
      } else if (!searchState.done && !isAnimating) {
        handleStep();
      }
    });
    autoBtn.addEventListener('click', handleAuto);
    resetBtn.addEventListener('click', handleReset);
    compareBtn.addEventListener('click', runComparison);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    targetInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 007 — Sliding Window
  // ============================================

  (function initBai007() {
    var input = document.getElementById('007-input');
    var kInput = document.getElementById('007-k');
    var searchBtn = document.getElementById('007-search-btn');
    var randomBtn = document.getElementById('007-random-btn');
    var stepBtn = document.getElementById('007-step-btn');
    var autoBtn = document.getElementById('007-auto-btn');
    var resetBtn = document.getElementById('007-reset-btn');
    var errorEl = document.getElementById('007-error');
    var vizCard = document.getElementById('007-viz-card');
    var arrayViz = document.getElementById('007-array-viz');
    var leftValEl = document.getElementById('007-left-val');
    var rightValEl = document.getElementById('007-right-val');
    var sumValEl = document.getElementById('007-sum-val');
    var bestValEl = document.getElementById('007-best-val');
    var comparisonsEl = document.getElementById('007-comparisons');
    var chartCard = document.getElementById('007-chart-card');
    var chartEl = document.getElementById('007-chart');
    var resultCard = document.getElementById('007-result-card');
    var resultValue = document.getElementById('007-result-value');
    var stepsCard = document.getElementById('007-steps-card');
    var stepsList = document.getElementById('007-steps-list');

    var isAnimating = false;
    var autoTimer = null;
    var searchState = null;

    function getMode() {
      var checked = document.querySelector('input[name=\"007-mode\"]:checked');
      return checked ? checked.value : 'max';
    }

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      chartCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      arrayViz.innerHTML = '';
      chartEl.innerHTML = '';
      stepsList.innerHTML = '';
      leftValEl.textContent = '0';
      rightValEl.textContent = '0';
      sumValEl.textContent = '0';
      bestValEl.textContent = '0';
      comparisonsEl.textContent = '0';
      stepBtn.disabled = false;
      searchState = null;
      stopAuto();
    }

    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      isAnimating = false;
      autoBtn.textContent = '▶ Chạy tự động';
    }

    function renderArray(arr, windowStart, windowEnd, bestStart, bestEnd) {
      arrayViz.innerHTML = '';
      arr.forEach(function (num, i) {
        var cell = document.createElement('div');
        cell.className = 'array-cell';

        var value = document.createElement('div');
        value.className = 'array-value';
        value.textContent = num;

        var inWindow = i >= windowStart && i <= windowEnd;
        var inBest = bestStart !== -1 && i >= bestStart && i <= bestEnd;

        if (inBest && inWindow && windowStart === bestStart) {
          value.classList.add('window-best');
        } else if (inWindow) {
          value.classList.add('window-active');
        } else if (inBest) {
          value.classList.add('window-best');
        } else {
          value.classList.add('window-outside');
        }

        var index = document.createElement('span');
        index.className = 'array-index';
        index.textContent = '[' + i + ']';

        cell.appendChild(value);
        cell.appendChild(index);
        arrayViz.appendChild(cell);
      });
    }

    function renderChart(windowSums, bestIndex, currentIndex) {
      chartEl.innerHTML = '';
      if (windowSums.length === 0) return;

      var maxVal = Math.max.apply(null, windowSums);
      var minVal = Math.min.apply(null, windowSums);
      var range = maxVal - minVal || 1;

      windowSums.forEach(function (val, i) {
        var wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';

        var bar = document.createElement('div');
        bar.className = 'chart-bar';
        // Normalize height: 20% to 100%
        var normalizedHeight = 20 + ((val - minVal) / range) * 80;
        bar.style.height = normalizedHeight + 'px';

        if (i === bestIndex) {
          bar.classList.add('chart-bar-best');
        } else if (i === currentIndex) {
          bar.classList.add('chart-bar-active');
        }

        var valueEl = document.createElement('span');
        valueEl.className = 'chart-value';
        valueEl.textContent = val;

        var labelEl = document.createElement('span');
        labelEl.className = 'chart-label';
        labelEl.textContent = 'W' + (i + 1);

        wrapper.appendChild(valueEl);
        wrapper.appendChild(bar);
        wrapper.appendChild(labelEl);
        chartEl.appendChild(wrapper);
      });
    }

    function validateInput() {
      var raw = input.value;
      var parsed = parseNumbers(raw);

      if (!parsed.valid) {
        showError(parsed.error);
        input.focus();
        return null;
      }

      var kRaw = kInput.value.trim();
      if (kRaw === '') {
        showError('Vui lòng nhập K.');
        kInput.focus();
        return null;
      }

      var k = Number(kRaw);
      if (!Number.isInteger(k) || k <= 0) {
        showError('K phải là số nguyên dương.');
        kInput.focus();
        return null;
      }

      if (k > parsed.numbers.length) {
        showError('K không được lớn hơn số phần tử (' + parsed.numbers.length + ').');
        kInput.focus();
        return null;
      }

      return { numbers: parsed.numbers, k: k, mode: getMode() };
    }

    function isBetter(newVal, bestVal, mode) {
      if (mode === 'max') return newVal > bestVal;
      if (mode === 'min') return newVal < bestVal;
      if (mode === 'avg') return newVal > bestVal; // avg: larger sum = larger avg (same K)
      return newVal > bestVal;
    }

    function getModeLabel(mode) {
      if (mode === 'max') return 'lớn nhất';
      if (mode === 'min') return 'nhỏ nhất';
      if (mode === 'avg') return 'trung bình lớn nhất';
      return 'lớn nhất';
    }

    async function handleSearch() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      isAnimating = true;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;
      autoBtn.disabled = true;

      var arr = validated.numbers;
      var k = validated.k;
      var mode = validated.mode;
      var steps = [];
      var windowSums = [];
      var comparisons = 0;

      // Calculate first window sum
      var windowSum = 0;
      for (var i = 0; i < k; i++) {
        windowSum += arr[i];
      }
      var bestSum = windowSum;
      var bestStart = 0;
      windowSums.push(windowSum);
      comparisons++;

      vizCard.hidden = false;
      chartCard.hidden = false;

      renderArray(arr, 0, k - 1, bestStart, bestStart + k - 1);
      renderChart(windowSums, 0, 0);
      leftValEl.textContent = 0;
      rightValEl.textContent = k - 1;
      sumValEl.textContent = windowSum;
      bestValEl.textContent = bestSum;
      comparisonsEl.textContent = comparisons;

      steps.push('Cửa sổ [0..' + (k - 1) + ']: ' + arr.slice(0, k).join(' + ') + ' = ' + windowSum + ' → best = ' + bestSum);
      await sleep(600);

      // Slide window
      for (var i = k; i < arr.length; i++) {
        // Sliding Window: remove left, add right
        var removed = arr[i - k];
        var added = arr[i];
        windowSum = windowSum - removed + added;
        windowSums.push(windowSum);
        comparisons++;

        var windowStart = i - k + 1;
        var windowEnd = i;

        leftValEl.textContent = windowStart;
        rightValEl.textContent = windowEnd;
        sumValEl.textContent = windowSum;
        comparisonsEl.textContent = comparisons;

        renderArray(arr, windowStart, windowEnd, bestStart, bestStart + k - 1);
        renderChart(windowSums, windowSums.indexOf(bestSum), windowSums.length - 1);
        await sleep(500);

        if (isBetter(windowSum, bestSum, mode)) {
          bestSum = windowSum;
          bestStart = windowStart;
          bestValEl.textContent = bestSum;
          steps.push('Cửa sổ [' + windowStart + '..' + windowEnd + ']: ' + windowSum + ' (' + removed + ' ra, ' + added + ' vào) → best = ' + bestSum + ' ★');
        } else {
          steps.push('Cửa sổ [' + windowStart + '..' + windowEnd + ']: ' + windowSum + ' (' + removed + ' ra, ' + added + ' vào) → best vẫn ' + bestSum);
        }

        renderArray(arr, windowStart, windowEnd, bestStart, bestStart + k - 1);
        renderChart(windowSums, windowSums.indexOf(bestSum), windowSums.length - 1);
        await sleep(300);
      }

      // Final highlight best window
      renderArray(arr, bestStart, bestStart + k - 1, bestStart, bestStart + k - 1);
      renderChart(windowSums, windowSums.indexOf(bestSum), -1);

      var modeLabel = getModeLabel(mode);
      if (mode === 'avg') {
        var avgVal = (bestSum / k).toFixed(2);
        resultValue.textContent = 'Tổng ' + modeLabel + ': ' + bestSum + ' (TB: ' + avgVal + ') tại cửa sổ [' + bestStart + '..' + (bestStart + k - 1) + ']\nSố lần tính: ' + comparisons;
        steps.push('Kết quả: Tổng ' + modeLabel + ' = ' + bestSum + ' (TB: ' + avgVal + ')');
      } else {
        resultValue.textContent = 'Tổng ' + modeLabel + ': ' + bestSum + ' tại cửa sổ [' + bestStart + '..' + (bestStart + k - 1) + ']\nSố lần tính: ' + comparisons;
        steps.push('Kết quả: Tổng ' + modeLabel + ' = ' + bestSum);
      }

      resultCard.hidden = false;

      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      var arr = validated.numbers;
      var k = validated.k;

      // Calculate first window
      var windowSum = 0;
      for (var i = 0; i < k; i++) {
        windowSum += arr[i];
      }

      searchState = {
        arr: arr,
        k: k,
        mode: validated.mode,
        windowSums: [windowSum],
        windowSum: windowSum,
        bestSum: windowSum,
        bestStart: 0,
        currentStart: 0,
        nextIndex: k,
        comparisons: 1,
        done: false
      };

      vizCard.hidden = false;
      chartCard.hidden = false;
      renderArray(arr, 0, k - 1, 0, k - 1);
      renderChart(searchState.windowSums, 0, 0);
      leftValEl.textContent = 0;
      rightValEl.textContent = k - 1;
      sumValEl.textContent = windowSum;
      bestValEl.textContent = windowSum;
      comparisonsEl.textContent = 1;

      var li = document.createElement('li');
      li.textContent = 'Cửa sổ [0..' + (k - 1) + ']: ' + arr.slice(0, k).join(' + ') + ' = ' + windowSum + ' → best = ' + windowSum;
      stepsList.appendChild(li);
      stepsCard.hidden = false;

      stepBtn.disabled = false;
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      autoBtn.disabled = true;
    }

    function handleStep() {
      if (!searchState || searchState.done) return;

      var arr = searchState.arr;
      var k = searchState.k;
      var mode = searchState.mode;

      if (searchState.nextIndex >= arr.length) {
        searchState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        var modeLabel = getModeLabel(mode);
        var li = document.createElement('li');
        if (mode === 'avg') {
          var avgVal = (searchState.bestSum / k).toFixed(2);
          li.textContent = 'Kết quả: Tổng ' + modeLabel + ' = ' + searchState.bestSum + ' (TB: ' + avgVal + ') tại [' + searchState.bestStart + '..' + (searchState.bestStart + k - 1) + ']';
          resultValue.textContent = 'Tổng ' + modeLabel + ': ' + searchState.bestSum + ' (TB: ' + avgVal + ') tại cửa sổ [' + searchState.bestStart + '..' + (searchState.bestStart + k - 1) + ']\nSố lần tính: ' + searchState.comparisons;
        } else {
          li.textContent = 'Kết quả: Tổng ' + modeLabel + ' = ' + searchState.bestSum + ' tại [' + searchState.bestStart + '..' + (searchState.bestStart + k - 1) + ']';
          resultValue.textContent = 'Tổng ' + modeLabel + ': ' + searchState.bestSum + ' tại cửa sổ [' + searchState.bestStart + '..' + (searchState.bestStart + k - 1) + ']\nSố lần tính: ' + searchState.comparisons;
        }
        li.classList.add('step-final');
        stepsList.appendChild(li);
        resultCard.hidden = false;

        renderArray(arr, searchState.bestStart, searchState.bestStart + k - 1, searchState.bestStart, searchState.bestStart + k - 1);
        renderChart(searchState.windowSums, searchState.windowSums.indexOf(searchState.bestSum), -1);

        searchBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      var i = searchState.nextIndex;
      var removed = arr[i - k];
      var added = arr[i];
      searchState.windowSum = searchState.windowSum - removed + added;
      searchState.windowSums.push(searchState.windowSum);
      searchState.comparisons++;

      var windowStart = i - k + 1;
      var windowEnd = i;
      searchState.currentStart = windowStart;

      leftValEl.textContent = windowStart;
      rightValEl.textContent = windowEnd;
      sumValEl.textContent = searchState.windowSum;
      comparisonsEl.textContent = searchState.comparisons;

      var step;
      if (isBetter(searchState.windowSum, searchState.bestSum, mode)) {
        searchState.bestSum = searchState.windowSum;
        searchState.bestStart = windowStart;
        bestValEl.textContent = searchState.bestSum;
        step = 'Cửa sổ [' + windowStart + '..' + windowEnd + ']: ' + searchState.windowSum + ' (' + removed + ' ra, ' + added + ' vào) → best = ' + searchState.bestSum + ' ★';
      } else {
        step = 'Cửa sổ [' + windowStart + '..' + windowEnd + ']: ' + searchState.windowSum + ' (' + removed + ' ra, ' + added + ' vào) → best vẫn ' + searchState.bestSum;
      }

      var li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);

      renderArray(arr, windowStart, windowEnd, searchState.bestStart, searchState.bestStart + k - 1);
      renderChart(searchState.windowSums, searchState.windowSums.indexOf(searchState.bestSum), searchState.windowSums.length - 1);

      searchState.nextIndex++;
    }

    function handleAuto() {
      if (isAnimating) {
        stopAuto();
        return;
      }

      if (!searchState) {
        initStepMode();
        if (!searchState) return;
      }

      isAnimating = true;
      autoBtn.textContent = '⏸ Dừng';
      searchBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      function tick() {
        if (!searchState || searchState.done) {
          stopAuto();
          searchBtn.disabled = false;
          randomBtn.disabled = false;
          stepBtn.disabled = false;
          return;
        }
        handleStep();
        autoTimer = setTimeout(tick, 600);
      }

      tick();
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      searchBtn.disabled = false;
      randomBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function handleRandom() {
      var length = Math.floor(Math.random() * 5) + 5;
      var numbers = [];
      for (var i = 0; i < length; i++) {
        numbers.push(Math.floor(Math.random() * 40) - 10);
      }
      input.value = numbers.join(', ');
      var k = Math.floor(Math.random() * (numbers.length - 1)) + 1;
      kInput.value = k;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    searchBtn.addEventListener('click', handleSearch);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!searchState) {
        initStepMode();
      } else if (!searchState.done && !isAnimating) {
        handleStep();
      }
    });
    autoBtn.addEventListener('click', handleAuto);
    resetBtn.addEventListener('click', handleReset);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    kInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 008 — Stack (Kiểm tra dấu ngoặc)
  // ============================================

  (function initBai008() {
    var input = document.getElementById('008-input');
    var checkBtn = document.getElementById('008-check-btn');
    var randomBtn = document.getElementById('008-random-btn');
    var stepBtn = document.getElementById('008-step-btn');
    var autoBtn = document.getElementById('008-auto-btn');
    var resetBtn = document.getElementById('008-reset-btn');
    var errorEl = document.getElementById('008-error');
    var vizCard = document.getElementById('008-viz-card');
    var stringViz = document.getElementById('008-string-viz');
    var stackViz = document.getElementById('008-stack-viz');
    var posEl = document.getElementById('008-pos');
    var charEl = document.getElementById('008-char');
    var stackSizeEl = document.getElementById('008-stack-size');
    var resultCard = document.getElementById('008-result-card');
    var resultValue = document.getElementById('008-result-value');
    var resultDetail = document.getElementById('008-result-detail');
    var stepsCard = document.getElementById('008-steps-card');
    var stepsList = document.getElementById('008-steps-list');

    var isAnimating = false;
    var autoTimer = null;
    var searchState = null;

    var BRACKET_MAP = {
      '(': ')',
      '[': ']',
      '{': '}'
    };
    var OPEN_SET = { '(': true, '[': true, '{': true };
    var CLOSE_SET = { ')': true, ']': true, '}': true };
    var CLOSE_TO_OPEN = { ')': '(', ']': '[', '}': '{' };

    function showError(message) {
      errorEl.textContent = message;
      input.classList.add('input-error-border');
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      input.classList.remove('input-error-border');
      input.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      stringViz.innerHTML = '';
      stackViz.innerHTML = '<p class="stack-empty">Stack rỗng</p>';
      stepsList.innerHTML = '';
      posEl.textContent = '0';
      charEl.textContent = '-';
      stackSizeEl.textContent = '0';
      stepBtn.disabled = false;
      searchState = null;
      stopAuto();
    }

    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      isAnimating = false;
      autoBtn.textContent = '▶ Chạy tự động';
    }

    function renderString(str, currentIndex, validIndices, errorIndex) {
      stringViz.innerHTML = '';
      for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        var span = document.createElement('span');
        span.className = 'string-char';
        span.textContent = ch;

        if (i === errorIndex) {
          span.classList.add('char-error');
        } else if (i === currentIndex) {
          span.classList.add('char-current');
        } else if (validIndices[i]) {
          span.classList.add('char-valid');
        } else if (!OPEN_SET[ch] && !CLOSE_SET[ch]) {
          span.classList.add('char-ignored');
        }

        stringViz.appendChild(span);
      }
    }

    function renderStack(stack) {
      stackViz.innerHTML = '';
      if (stack.length === 0) {
        stackViz.innerHTML = '<p class="stack-empty">Stack rỗng</p>';
        return;
      }
      // Render from top to bottom (reverse)
      for (var i = stack.length - 1; i >= 0; i--) {
        var item = document.createElement('div');
        item.className = 'stack-item';
        if (i === stack.length - 1) {
          item.classList.add('stack-item-top');
        }
        item.textContent = stack[i];
        stackViz.appendChild(item);
      }
    }

    function validateInput() {
      var raw = input.value;
      if (!raw || !raw.trim()) {
        showError('Vui lòng nhập chuỗi.');
        input.focus();
        return null;
      }
      // Check if contains at least one bracket
      var hasBracket = false;
      for (var i = 0; i < raw.length; i++) {
        if (OPEN_SET[raw[i]] || CLOSE_SET[raw[i]]) {
          hasBracket = true;
          break;
        }
      }
      if (!hasBracket) {
        showError('Chuỗi phải chứa ít nhất một dấu ngoặc (), [], {}.');
        input.focus();
        return null;
      }
      return raw;
    }

    async function handleCheck() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var str = validateInput();
      if (str === null) return;

      isAnimating = true;
      checkBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;
      autoBtn.disabled = true;

      var stack = [];
      var steps = [];
      var validIndices = {};
      var errorIndex = -1;
      var isValid = true;
      var errorPos = -1;

      vizCard.hidden = false;
      renderString(str, 0, validIndices, -1);
      renderStack(stack);
      await sleep(600);

      for (var i = 0; i < str.length; i++) {
        var ch = str[i];
        posEl.textContent = i;
        charEl.textContent = ch;
        stackSizeEl.textContent = stack.length;

        renderString(str, i, validIndices, -1);
        await sleep(400);

        if (OPEN_SET[ch]) {
          stack.push(ch);
          validIndices[i] = true;
          steps.push('[' + i + '] \'' + ch + '\' → push vào Stack');
          renderStack(stack);
          stackSizeEl.textContent = stack.length;
        } else if (CLOSE_SET[ch]) {
          if (stack.length === 0) {
            isValid = false;
            errorIndex = i;
            errorPos = i;
            steps.push('[' + i + '] \'' + ch + '\' → Stack rỗng → Không hợp lệ! Vị trí lỗi: ' + i);
            renderString(str, i, validIndices, errorIndex);
            break;
          }

          var open = stack.pop();
          var expected = BRACKET_MAP[open];

          if (ch !== expected) {
            isValid = false;
            errorIndex = i;
            errorPos = i;
            steps.push('[' + i + '] \'' + ch + '\' → pop \'' + open + '\' → \'' + open + '\' không khớp \'' + ch + '\' → Không hợp lệ! Vị trí lỗi: ' + i);
            renderString(str, i, validIndices, errorIndex);
            renderStack(stack);
            stackSizeEl.textContent = stack.length;
            break;
          }

          validIndices[i] = true;
          steps.push('[' + i + '] \'' + ch + '\' → pop \'' + open + '\' → Khớp ✓');
          renderStack(stack);
          stackSizeEl.textContent = stack.length;
        } else {
          steps.push('[' + i + '] \'' + ch + '\' → bỏ qua (không phải ngoặc)');
        }

        await sleep(300);
      }

      // After loop: check if stack still has elements
      if (isValid && stack.length > 0) {
        isValid = false;
        errorPos = str.length;
        steps.push('Duyệt xong nhưng Stack còn ' + stack.length + ' phần tử → Không hợp lệ!');
      }

      if (isValid) {
        steps.push('Stack rỗng → Hợp lệ ✓');
        resultValue.textContent = 'Hợp lệ ✓';
        resultValue.style.color = 'var(--color-success)';
        resultDetail.textContent = '';
        resultCard.style.borderColor = 'var(--color-success)';
        resultCard.style.background = 'var(--color-success-light)';
      } else {
        resultValue.textContent = 'Không hợp lệ ✗';
        resultValue.style.color = 'var(--color-error)';
        resultDetail.textContent = 'Vị trí lỗi: ' + errorPos;
        resultCard.style.borderColor = 'var(--color-error)';
        resultCard.style.background = 'var(--color-error-light)';
        if (errorIndex >= 0) {
          renderString(str, errorIndex, validIndices, errorIndex);
        }
      }

      resultCard.hidden = false;

      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;

      isAnimating = false;
      checkBtn.disabled = false;
      randomBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var str = validateInput();
      if (str === null) return;

      searchState = {
        str: str,
        index: 0,
        stack: [],
        validIndices: {},
        steps: [],
        errorIndex: -1,
        isValid: true,
        errorPos: -1,
        done: false
      };

      vizCard.hidden = false;
      renderString(str, 0, {}, -1);
      renderStack([]);
      posEl.textContent = 0;
      charEl.textContent = str[0] || '-';

      stepBtn.disabled = false;
      checkBtn.disabled = true;
      randomBtn.disabled = true;
      autoBtn.disabled = true;
    }

    function handleStep() {
      if (!searchState || searchState.done) return;

      var str = searchState.str;
      var i = searchState.index;

      // Check if done (past end)
      if (i >= str.length) {
        searchState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        if (searchState.isValid && searchState.stack.length > 0) {
          searchState.isValid = false;
          searchState.errorPos = str.length;
          var step = 'Duyệt xong nhưng Stack còn ' + searchState.stack.length + ' phần tử → Không hợp lệ!';
          var li = document.createElement('li');
          li.textContent = step;
          li.classList.add('step-final');
          stepsList.appendChild(li);
          stepsCard.hidden = false;

          resultValue.textContent = 'Không hợp lệ ✗';
          resultValue.style.color = 'var(--color-error)';
          resultDetail.textContent = 'Vị trí lỗi: ' + searchState.errorPos;
          resultCard.style.borderColor = 'var(--color-error)';
          resultCard.style.background = 'var(--color-error-light)';
        } else if (searchState.isValid) {
          var step = 'Stack rỗng → Hợp lệ ✓';
          var li = document.createElement('li');
          li.textContent = step;
          li.classList.add('step-final');
          stepsList.appendChild(li);
          stepsCard.hidden = false;

          resultValue.textContent = 'Hợp lệ ✓';
          resultValue.style.color = 'var(--color-success)';
          resultDetail.textContent = '';
          resultCard.style.borderColor = 'var(--color-success)';
          resultCard.style.background = 'var(--color-success-light)';
        } else {
          resultValue.textContent = 'Không hợp lệ ✗';
          resultValue.style.color = 'var(--color-error)';
          resultDetail.textContent = 'Vị trí lỗi: ' + searchState.errorPos;
          resultCard.style.borderColor = 'var(--color-error)';
          resultCard.style.background = 'var(--color-error-light)';
        }

        resultCard.hidden = false;
        checkBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      var ch = str[i];
      posEl.textContent = i;
      charEl.textContent = ch;

      renderString(str, i, searchState.validIndices, -1);

      var step;
      if (OPEN_SET[ch]) {
        searchState.stack.push(ch);
        searchState.validIndices[i] = true;
        step = '[' + i + '] \'' + ch + '\' → push vào Stack';
        renderStack(searchState.stack);
        stackSizeEl.textContent = searchState.stack.length;
      } else if (CLOSE_SET[ch]) {
        if (searchState.stack.length === 0) {
          searchState.isValid = false;
          searchState.errorIndex = i;
          searchState.errorPos = i;
          searchState.done = true;
          stepBtn.disabled = true;
          autoBtn.disabled = true;
          step = '[' + i + '] \'' + ch + '\' → Stack rỗng → Không hợp lệ! Vị trí lỗi: ' + i;
          renderString(str, i, searchState.validIndices, i);

          var li = document.createElement('li');
          li.textContent = step;
          li.classList.add('step-final');
          stepsList.appendChild(li);
          stepsCard.hidden = false;

          resultValue.textContent = 'Không hợp lệ ✗';
          resultValue.style.color = 'var(--color-error)';
          resultDetail.textContent = 'Vị trí lỗi: ' + i;
          resultCard.style.borderColor = 'var(--color-error)';
          resultCard.style.background = 'var(--color-error-light)';
          resultCard.hidden = false;

          checkBtn.disabled = false;
          randomBtn.disabled = false;
          return;
        }

        var open = searchState.stack.pop();
        var expected = BRACKET_MAP[open];

        if (ch !== expected) {
          searchState.isValid = false;
          searchState.errorIndex = i;
          searchState.errorPos = i;
          searchState.done = true;
          stepBtn.disabled = true;
          autoBtn.disabled = true;
          step = '[' + i + '] \'' + ch + '\' → pop \'' + open + '\' → \'' + open + '\' không khớp \'' + ch + '\' → Không hợp lệ! Vị trí lỗi: ' + i;
          renderString(str, i, searchState.validIndices, i);
          renderStack(searchState.stack);
          stackSizeEl.textContent = searchState.stack.length;

          var li = document.createElement('li');
          li.textContent = step;
          li.classList.add('step-final');
          stepsList.appendChild(li);
          stepsCard.hidden = false;

          resultValue.textContent = 'Không hợp lệ ✗';
          resultValue.style.color = 'var(--color-error)';
          resultDetail.textContent = 'Vị trí lỗi: ' + i;
          resultCard.style.borderColor = 'var(--color-error)';
          resultCard.style.background = 'var(--color-error-light)';
          resultCard.hidden = false;

          checkBtn.disabled = false;
          randomBtn.disabled = false;
          return;
        }

        searchState.validIndices[i] = true;
        step = '[' + i + '] \'' + ch + '\' → pop \'' + open + '\' → Khớp ✓';
        renderStack(searchState.stack);
        stackSizeEl.textContent = searchState.stack.length;
      } else {
        step = '[' + i + '] \'' + ch + '\' → bỏ qua (không phải ngoặc)';
      }

      var li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
      stepsCard.hidden = false;

      searchState.index++;
      if (searchState.index < str.length) {
        renderString(str, searchState.index, searchState.validIndices, -1);
      }
    }

    function handleAuto() {
      if (isAnimating) {
        stopAuto();
        return;
      }

      if (!searchState) {
        initStepMode();
        if (!searchState) return;
      }

      isAnimating = true;
      autoBtn.textContent = '⏸ Dừng';
      checkBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      function tick() {
        if (!searchState || searchState.done) {
          stopAuto();
          checkBtn.disabled = false;
          randomBtn.disabled = false;
          stepBtn.disabled = false;
          return;
        }
        handleStep();
        autoTimer = setTimeout(tick, 600);
      }

      tick();
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      checkBtn.disabled = false;
      randomBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function handleRandom() {
      var samples = ['()', '([]{})', '{[()]}', '{[(])}', '((()))', '([)]', '(((', '())', '{}', '{[}]', '({[]})', '[({})]', '((())', '(()))', '{[()]}()'];
      var random = samples[Math.floor(Math.random() * samples.length)];
      input.value = random;
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    checkBtn.addEventListener('click', handleCheck);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!searchState) {
        initStepMode();
      } else if (!searchState.done && !isAnimating) {
        handleStep();
      }
    });
    autoBtn.addEventListener('click', handleAuto);
    resetBtn.addEventListener('click', handleReset);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleCheck();
      }
    });

    input.addEventListener('input', function () {
      if (input.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();

  // ============================================
  // Bài 009 — Maze Solver (BFS / DFS)
  // ============================================

  (function initBai009() {
    var generateBtn = document.getElementById('009-generate-btn');
    var sizeBtn = document.getElementById('009-size-btn');
    var solveBtn = document.getElementById('009-solve-btn');
    var stepBtn = document.getElementById('009-step-btn');
    var autoBtn = document.getElementById('009-auto-btn');
    var resetBtn = document.getElementById('009-reset-btn');
    var mazeGrid = document.getElementById('009-maze-grid');
    var visitedCountEl = document.getElementById('009-visited-count');
    var pathLengthEl = document.getElementById('009-path-length');
    var stepCountEl = document.getElementById('009-step-count');
    var statusEl = document.getElementById('009-status');
    var resultCard = document.getElementById('009-result-card');
    var resultValue = document.getElementById('009-result-value');
    var stepsCard = document.getElementById('009-steps-card');
    var stepsList = document.getElementById('009-steps-list');

    var ROWS = 7;
    var COLS = 7;
    var grid = [];
    var startPos = { r: 0, c: 0 };
    var endPos = { r: 6, c: 6 };
    var isAnimating = false;
    var autoTimer = null;
    var bfsState = null;
    var isDragging = false;
    var dragMode = null;

    // Cell types: 0 = empty, 1 = wall, 2 = start, 3 = end

    function getAlgo() {
      var checked = document.querySelector('input[name=\"009-algo\"]:checked');
      return checked ? checked.value : 'bfs';
    }

    function createEmptyGrid(rows, cols) {
      var g = [];
      for (var r = 0; r < rows; r++) {
        g[r] = [];
        for (var c = 0; c < cols; c++) {
          g[r][c] = 0;
        }
      }
      return g;
    }

    function generateMaze() {
      grid = createEmptyGrid(ROWS, COLS);
      startPos = { r: 0, c: 0 };
      endPos = { r: ROWS - 1, c: COLS - 1 };
      grid[startPos.r][startPos.c] = 2;
      grid[endPos.r][endPos.c] = 3;

      // Random walls (30% density, avoid start/end)
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) continue;
          if (Math.random() < 0.3) {
            grid[r][c] = 1;
          }
        }
      }

      // Ensure at least one path exists by clearing a random path
      // Simple: clear a corridor from start
      var cr = startPos.r, cc = startPos.c;
      while (cr < ROWS - 1 || cc < COLS - 1) {
        if (cr < ROWS - 1 && cc < COLS - 1) {
          if (Math.random() < 0.5) cr++; else cc++;
        } else if (cr < ROWS - 1) {
          cr++;
        } else {
          cc++;
        }
        if (grid[cr][cc] === 1) grid[cr][cc] = 0;
      }

      renderGrid();
      resetSearch();
    }

    function renderGrid(highlights) {
      highlights = highlights || {};
      // highlights: { 'r,c': 'visited'|'current'|'path'|'queued' }

      mazeGrid.style.gridTemplateColumns = 'repeat(' + COLS + ', 36px)';
      mazeGrid.style.gridTemplateRows = 'repeat(' + ROWS + ', 36px)';
      mazeGrid.innerHTML = '';

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var cell = document.createElement('div');
          cell.className = 'maze-cell';
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('data-r', r);
          cell.setAttribute('data-c', c);
          cell.setAttribute('aria-label', 'Ô ' + r + ',' + c);

          var key = r + ',' + c;
          var hl = highlights[key];

          if (grid[r][c] === 2) {
            cell.classList.add('maze-start');
            cell.textContent = 'S';
          } else if (grid[r][c] === 3) {
            cell.classList.add('maze-end');
            cell.textContent = 'E';
          } else if (grid[r][c] === 1) {
            cell.classList.add('maze-wall');
          } else if (hl === 'path') {
            cell.classList.add('maze-path');
            cell.textContent = '●';
          } else if (hl === 'current') {
            cell.classList.add('maze-current');
          } else if (hl === 'visited') {
            cell.classList.add('maze-visited');
          } else if (hl === 'queued') {
            cell.classList.add('maze-queued');
          }

          mazeGrid.appendChild(cell);
        }
      }
    }

    function resetSearch() {
      resultCard.hidden = true;
      stepsCard.hidden = true;
      stepsList.innerHTML = '';
      visitedCountEl.textContent = '0';
      pathLengthEl.textContent = '0';
      stepCountEl.textContent = '0';
      statusEl.textContent = 'Sẵn sàng';
      bfsState = null;
      stopAuto();
      stepBtn.disabled = false;
      solveBtn.disabled = false;
      renderGrid();
    }

    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      isAnimating = false;
      autoBtn.textContent = '▶ Tự động';
    }

    function isValidCell(r, c, visited) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
      if (grid[r][c] === 1) return false;
      if (visited[r + ',' + c]) return false;
      return true;
    }

    function reconstructPath(parent, end) {
      var path = [];
      var cur = end.r + ',' + end.c;
      var startKey = startPos.r + ',' + startPos.c;
      while (cur !== startKey) {
        path.push(cur);
        cur = parent[cur];
        if (!cur) break;
      }
      path.reverse();
      return path;
    }

    // BFS / DFS core
    function createSearchState(algo) {
      return {
        algo: algo,
        queue: [startPos.r + ',' + startPos.c],
        visited: {},
        parent: {},
        highlights: {},
        visitedCount: 0,
        stepCount: 0,
        found: false,
        done: false,
        path: []
      };
    }

    function doOneStep(state) {
      if (state.done) return;

      var key = state.algo === 'bfs' ? state.queue.shift() : state.queue.pop();
      if (key === undefined) {
        state.done = true;
        state.found = false;
        return;
      }

      if (state.visited[key]) {
        // Already visited, skip (can happen with DFS duplicates)
        return doOneStep(state);
      }

      state.visited[key] = true;
      state.visitedCount++;
      state.stepCount++;
      state.highlights[key] = 'visited';

      var parts = key.split(',');
      var r = parseInt(parts[0], 10);
      var c = parseInt(parts[1], 10);

      // Check if reached end
      if (r === endPos.r && c === endPos.c) {
        state.found = true;
        state.done = true;
        state.path = reconstructPath(state.parent, endPos);
        // Mark path
        for (var i = 0; i < state.path.length; i++) {
          var pk = state.path[i];
          if (pk !== startPos.r + ',' + startPos.c && pk !== endPos.r + ',' + endPos.c) {
            state.highlights[pk] = 'path';
          }
        }
        return;
      }

      // Explore 4 directions
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var d = 0; d < dirs.length; d++) {
        var nr = r + dirs[d][0];
        var nc = c + dirs[d][1];
        var nkey = nr + ',' + nc;
        if (isValidCell(nr, nc, state.visited) && state.queue.indexOf(nkey) === -1) {
          state.parent[nkey] = key;
          state.queue.push(nkey);
          if (!state.highlights[nkey]) {
            state.highlights[nkey] = 'queued';
          }
        }
      }

      // Mark current
      state.highlights[key] = 'current';

      // Check if queue empty and not found
      if (state.queue.length === 0) {
        state.done = true;
        state.found = false;
      }
    }

    function updateStats(state) {
      visitedCountEl.textContent = state.visitedCount;
      stepCountEl.textContent = state.stepCount;
      if (state.found) {
        pathLengthEl.textContent = state.path.length + 1;
        statusEl.textContent = 'Tìm thấy!';
      } else if (state.done) {
        pathLengthEl.textContent = '0';
        statusEl.textContent = 'Không có đường';
      } else {
        statusEl.textContent = 'Đang tìm...';
      }
    }

    function logStep(state, stepNum) {
      var li = document.createElement('li');
      var queueStr = state.queue.length > 0 ? 'Queue: [' + state.queue.slice(0, 5).join(', ') + (state.queue.length > 5 ? '...' : '') + ']' : 'Queue rỗng';
      li.textContent = 'Bước ' + stepNum + ': ' + queueStr + ' | Đã duyệt: ' + state.visitedCount;
      if (state.done) {
        li.classList.add('step-final');
      }
      stepsList.appendChild(li);
      stepsCard.hidden = false;
    }

    async function handleSolve() {
      if (isAnimating) return;

      resetSearch();
      var algo = getAlgo();
      bfsState = createSearchState(algo);
      isAnimating = true;
      solveBtn.disabled = true;
      stepBtn.disabled = true;
      autoBtn.disabled = true;
      statusEl.textContent = 'Đang tìm...';

      var stepNum = 0;
      while (!bfsState.done) {
        doOneStep(bfsState);
        stepNum++;
        updateStats(bfsState);
        renderGrid(bfsState.highlights);
        logStep(bfsState, stepNum);
        await sleep(300);
      }

      // Final render with path
      renderGrid(bfsState.highlights);
      updateStats(bfsState);

      if (bfsState.found) {
        resultValue.textContent = 'Tìm thấy đường! Độ dài: ' + (bfsState.path.length + 1) + ' ô';
        resultValue.style.color = 'var(--color-success)';
        resultCard.style.borderColor = 'var(--color-success)';
        resultCard.style.background = 'var(--color-success-light)';
      } else {
        resultValue.textContent = 'Không tìm thấy đường';
        resultValue.style.color = 'var(--color-error)';
        resultCard.style.borderColor = 'var(--color-error)';
        resultCard.style.background = 'var(--color-error-light)';
      }
      resultCard.hidden = false;

      isAnimating = false;
      solveBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function initStepMode() {
      resetSearch();
      var algo = getAlgo();
      bfsState = createSearchState(algo);
      statusEl.textContent = 'Chế độ từng bước (' + algo.toUpperCase() + ')';
      renderGrid(bfsState.highlights);
      stepBtn.disabled = false;
      solveBtn.disabled = true;
      autoBtn.disabled = true;
    }

    function handleStep() {
      if (!bfsState || bfsState.done) return;

      doOneStep(bfsState);
      updateStats(bfsState);
      renderGrid(bfsState.highlights);
      logStep(bfsState, bfsState.stepCount);

      if (bfsState.done) {
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        if (bfsState.found) {
          resultValue.textContent = 'Tìm thấy đường! Độ dài: ' + (bfsState.path.length + 1) + ' ô';
          resultValue.style.color = 'var(--color-success)';
          resultCard.style.borderColor = 'var(--color-success)';
          resultCard.style.background = 'var(--color-success-light)';
        } else {
          resultValue.textContent = 'Không tìm thấy đường';
          resultValue.style.color = 'var(--color-error)';
          resultCard.style.borderColor = 'var(--color-error)';
          resultCard.style.background = 'var(--color-error-light)';
        }
        resultCard.hidden = false;
        solveBtn.disabled = false;
      }
    }

    function handleAuto() {
      if (isAnimating) {
        stopAuto();
        return;
      }

      if (!bfsState) {
        initStepMode();
        if (!bfsState) return;
      }

      isAnimating = true;
      autoBtn.textContent = '⏸ Dừng';
      solveBtn.disabled = true;
      stepBtn.disabled = true;

      function tick() {
        if (!bfsState || bfsState.done) {
          stopAuto();
          solveBtn.disabled = false;
          stepBtn.disabled = false;
          return;
        }
        handleStep();
        autoTimer = setTimeout(tick, 400);
      }

      tick();
    }

    function handleReset() {
      resetSearch();
      solveBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function cycleCell(r, c) {
      if (grid[r][c] === 0) {
        grid[r][c] = 1;
      } else if (grid[r][c] === 1) {
        // Wall -> Start (move start)
        grid[startPos.r][startPos.c] = 0;
        grid[r][c] = 2;
        startPos = { r: r, c: c };
      } else if (grid[r][c] === 2) {
        // Start -> End (move end)
        grid[r][c] = 0;
        grid[endPos.r][endPos.c] = 0;
        grid[r][c] = 3;
        endPos = { r: r, c: c };
        // Restore start
        grid[startPos.r][startPos.c] = 2;
        // Need to handle: start was at r,c, now we want end at r,c
        // Actually: grid[r][c] was 2 (start), we set it to 3 (end), and old end to 0
        // But we already set grid[r][c]=0 above, so fix:
        grid[r][c] = 3;
        endPos = { r: r, c: c };
      } else if (grid[r][c] === 3) {
        grid[r][c] = 0;
      }
      renderGrid(bfsState ? bfsState.highlights : {});
    }

    // Click handling
    mazeGrid.addEventListener('click', function (e) {
      if (isAnimating) return;
      var cell = e.target.closest('.maze-cell');
      if (!cell) return;
      var r = parseInt(cell.getAttribute('data-r'), 10);
      var c = parseInt(cell.getAttribute('data-c'), 10);

      // Simple cycle: empty -> wall -> empty (keep S/E fixed unless explicitly moved)
      if (grid[r][c] === 2 || grid[r][c] === 3) {
        // Don't allow overwriting S/E via simple click — use drag or dedicated
        return;
      }
      grid[r][c] = grid[r][c] === 0 ? 1 : 0;
      renderGrid(bfsState ? bfsState.highlights : {});
    });

    // Drag to draw walls
    mazeGrid.addEventListener('mousedown', function (e) {
      isDragging = true;
      var cell = e.target.closest('.maze-cell');
      if (cell) {
        var r = parseInt(cell.getAttribute('data-r'), 10);
        var c = parseInt(cell.getAttribute('data-c'), 10);
        if (grid[r][c] !== 2 && grid[r][c] !== 3) {
          dragMode = grid[r][c] === 0 ? 1 : 0;
          grid[r][c] = dragMode;
          renderGrid(bfsState ? bfsState.highlights : {});
        }
      }
    });

    mazeGrid.addEventListener('mouseover', function (e) {
      if (!isDragging) return;
      var cell = e.target.closest('.maze-cell');
      if (!cell) return;
      var r = parseInt(cell.getAttribute('data-r'), 10);
      var c = parseInt(cell.getAttribute('data-c'), 10);
      if (grid[r][c] !== 2 && grid[r][c] !== 3) {
        grid[r][c] = dragMode;
        renderGrid(bfsState ? bfsState.highlights : {});
      }
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      dragMode = null;
    });

    // Size toggle
    sizeBtn.addEventListener('click', function () {
      if (ROWS === 7) {
        ROWS = 10; COLS = 10;
      } else if (ROWS === 10) {
        ROWS = 5; COLS = 5;
      } else {
        ROWS = 7; COLS = 7;
      }
      sizeBtn.textContent = '📐 ' + ROWS + 'x' + COLS;
      generateMaze();
    });

    generateBtn.addEventListener('click', generateMaze);
    solveBtn.addEventListener('click', handleSolve);
    stepBtn.addEventListener('click', function () {
      if (!bfsState) {
        initStepMode();
      } else if (!bfsState.done && !isAnimating) {
        handleStep();
      }
    });
    autoBtn.addEventListener('click', handleAuto);
    resetBtn.addEventListener('click', handleReset);

    // Init
    generateMaze();
  })();

  // ============================================
  // Bài 010 — DP Leo cầu thang
  // ============================================

  (function initBai010() {
    var nInput = document.getElementById('010-n');
    var costToggle = document.getElementById('010-cost-toggle');
    var costWrapper = document.getElementById('010-cost-input-wrapper');
    var costInput = document.getElementById('010-cost');
    var calcBtn = document.getElementById('010-calc-btn');
    var randomBtn = document.getElementById('010-random-btn');
    var stepBtn = document.getElementById('010-step-btn');
    var autoBtn = document.getElementById('010-auto-btn');
    var resetBtn = document.getElementById('010-reset-btn');
    var errorEl = document.getElementById('010-error');
    var vizCard = document.getElementById('010-viz-card');
    var staircaseViz = document.getElementById('010-staircase-viz');
    var dpTable = document.getElementById('010-dp-table');
    var currentStepEl = document.getElementById('010-current-step');
    var dpValEl = document.getElementById('010-dp-val');
    var opsEl = document.getElementById('010-ops');
    var resultCard = document.getElementById('010-result-card');
    var resultValue = document.getElementById('010-result-value');
    var resultDetail = document.getElementById('010-result-detail');
    var stepsCard = document.getElementById('010-steps-card');
    var stepsList = document.getElementById('010-steps-list');

    var isAnimating = false;
    var autoTimer = null;
    var dpState = null;

    costToggle.addEventListener('change', function () {
      costWrapper.hidden = !costToggle.checked;
    });

    function showError(message) {
      errorEl.textContent = message;
      nInput.classList.add('input-error-border');
      nInput.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
      errorEl.textContent = '';
      nInput.classList.remove('input-error-border');
      nInput.removeAttribute('aria-invalid');
    }

    function hideAll() {
      vizCard.hidden = true;
      resultCard.hidden = true;
      stepsCard.hidden = true;
      staircaseViz.innerHTML = '';
      dpTable.innerHTML = '';
      stepsList.innerHTML = '';
      currentStepEl.textContent = '0';
      dpValEl.textContent = '0';
      opsEl.textContent = '0';
      stepBtn.disabled = false;
      dpState = null;
      stopAuto();
    }

    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
      isAnimating = false;
      autoBtn.textContent = '▶ Chạy tự động';
    }

    function validateInput() {
      var nRaw = nInput.value.trim();
      if (nRaw === '') {
        showError('Vui lòng nhập N.');
        nInput.focus();
        return null;
      }

      var n = Number(nRaw);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        showError('N phải là số nguyên từ 1 đến 50.');
        nInput.focus();
        return null;
      }

      if (costToggle.checked) {
        var costRaw = costInput.value.trim();
        if (costRaw === '') {
          showError('Vui lòng nhập chi phí mỗi bậc.');
          costInput.focus();
          return null;
        }
        var costParts = costRaw.split(',').map(function (s) { return s.trim(); });
        if (costParts.length !== n) {
          showError('Chi phí phải có đúng ' + n + ' số (hiện có ' + costParts.length + ').');
          costInput.focus();
          return null;
        }
        var costs = [];
        for (var i = 0; i < costParts.length; i++) {
          var c = Number(costParts[i]);
          if (isNaN(c) || !isFinite(c)) {
            showError('Chi phí \"' + costParts[i] + '\" không hợp lệ.');
            costInput.focus();
            return null;
          }
          costs.push(c);
        }
        return { n: n, costs: costs, mode: 'cost' };
      }

      return { n: n, costs: null, mode: 'ways' };
    }

    function renderStaircase(n, dp, currentI, bestI) {
      staircaseViz.innerHTML = '';
      for (var i = 0; i <= n; i++) {
        var step = document.createElement('div');
        step.className = 'stair-step';

        var block = document.createElement('div');
        block.className = 'stair-block';
        // Height proportional to step index
        block.style.height = (24 + i * 6) + 'px';
        block.textContent = i;

        if (i === currentI) {
          block.classList.add('stair-current');
        } else if (i === bestI) {
          block.classList.add('stair-best');
        } else if (dp[i] !== undefined) {
          block.classList.add('stair-done');
        }

        var label = document.createElement('span');
        label.className = 'stair-label';
        label.textContent = 'Bậc ' + i;

        var value = document.createElement('span');
        value.className = 'stair-value';
        value.textContent = dp[i] !== undefined ? dp[i] : '-';

        step.appendChild(block);
        step.appendChild(label);
        step.appendChild(value);
        staircaseViz.appendChild(step);
      }
    }

    function renderDPTable(n, dp, currentI) {
      dpTable.innerHTML = '';
      for (var i = 0; i <= n; i++) {
        var cell = document.createElement('div');
        cell.className = 'dp-cell';

        var header = document.createElement('span');
        header.className = 'dp-cell-header';
        header.textContent = 'dp[' + i + ']';

        var value = document.createElement('div');
        value.className = 'dp-cell-value';
        value.textContent = dp[i] !== undefined ? dp[i] : '-';

        if (i === currentI) {
          value.classList.add('dp-current');
        } else if (dp[i] !== undefined) {
          value.classList.add('dp-done');
        }

        cell.appendChild(header);
        cell.appendChild(value);
        dpTable.appendChild(cell);
      }
    }

    async function handleCalc() {
      if (isAnimating) return;

      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      isAnimating = true;
      calcBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;
      autoBtn.disabled = true;

      var n = validated.n;
      var costs = validated.costs;
      var mode = validated.mode;

      if (mode === 'cost') {
        await runCostDP(n, costs);
      } else {
        await runWaysDP(n);
      }

      isAnimating = false;
      calcBtn.disabled = false;
      randomBtn.disabled = false;
      stepBtn.disabled = false;
      autoBtn.disabled = false;
    }

    async function runWaysDP(n) {
      var dp = [];
      var steps = [];
      var ops = 0;

      dp[0] = 1;
      dp[1] = 1;
      ops += 0;

      vizCard.hidden = false;
      renderStaircase(n, dp, 0, -1);
      renderDPTable(n, dp, 0);
      currentStepEl.textContent = 0;
      dpValEl.textContent = dp[0];
      opsEl.textContent = ops;
      steps.push('dp[0] = 1 (1 cách đứng tại bậc 0)');
      if (n >= 1) {
        steps.push('dp[1] = 1 (1 cách lên bậc 1)');
      }
      await sleep(600);

      if (n >= 1) {
        renderStaircase(n, dp, 1, -1);
        renderDPTable(n, dp, 1);
        currentStepEl.textContent = 1;
        dpValEl.textContent = dp[1];
        await sleep(400);
      }

      for (var i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        ops++;
        currentStepEl.textContent = i;
        dpValEl.textContent = dp[i];
        opsEl.textContent = ops;

        renderStaircase(n, dp, i, -1);
        renderDPTable(n, dp, i);
        steps.push('dp[' + i + '] = dp[' + (i - 1) + '] + dp[' + (i - 2) + '] = ' + dp[i - 1] + ' + ' + dp[i - 2] + ' = ' + dp[i]);
        await sleep(500);
      }

      // Final highlight
      renderStaircase(n, dp, n, n);
      renderDPTable(n, dp, n);

      resultValue.textContent = dp[n] + ' cách';
      resultDetail.textContent = 'dp[' + n + '] = ' + dp[n] + ' | Phép tính: ' + ops;
      resultCard.hidden = false;

      steps.push('Kết quả: ' + dp[n] + ' cách leo ' + n + ' bậc');
      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;
    }

    async function runCostDP(n, costs) {
      // dp[i] = min cost to reach step i
      // dp[0] = 0, dp[1] = costs[0], dp[i] = min(dp[i-1], dp[i-2]) + costs[i-1] for i>=2
      // Actually: cost to reach top (beyond n) = min(dp[n-1], dp[n-2]) if top is beyond last step
      // Simplified: dp[i] = cost to reach step i, dp[0]=0, dp[1]=costs[0]
      var dp = [];
      var steps = [];
      var ops = 0;

      dp[0] = 0;
      if (n >= 1) dp[1] = costs[0];

      vizCard.hidden = false;
      renderStaircase(n, dp, 0, -1);
      renderDPTable(n, dp, 0);
      currentStepEl.textContent = 0;
      dpValEl.textContent = dp[0];
      opsEl.textContent = ops;
      steps.push('dp[0] = 0 (chưa leo)');
      if (n >= 1) {
        steps.push('dp[1] = costs[0] = ' + costs[0]);
      }
      await sleep(600);

      if (n >= 1) {
        renderStaircase(n, dp, 1, -1);
        renderDPTable(n, dp, 1);
        currentStepEl.textContent = 1;
        dpValEl.textContent = dp[1];
        await sleep(400);
      }

      for (var i = 2; i <= n; i++) {
        var cost = costs[i - 1];
        dp[i] = Math.min(dp[i - 1], dp[i - 2]) + cost;
        ops++;
        currentStepEl.textContent = i;
        dpValEl.textContent = dp[i];
        opsEl.textContent = ops;

        renderStaircase(n, dp, i, -1);
        renderDPTable(n, dp, i);
        steps.push('dp[' + i + '] = min(dp[' + (i - 1) + '], dp[' + (i - 2) + ']) + costs[' + (i - 1) + '] = min(' + dp[i - 1] + ', ' + dp[i - 2] + ') + ' + cost + ' = ' + dp[i]);
        await sleep(500);
      }

      renderStaircase(n, dp, n, n);
      renderDPTable(n, dp, n);

      resultValue.textContent = 'Chi phí nhỏ nhất: ' + dp[n];
      resultDetail.textContent = 'dp[' + n + '] = ' + dp[n] + ' | Phép tính: ' + ops;
      resultCard.hidden = false;

      steps.push('Kết quả: Chi phí nhỏ nhất = ' + dp[n]);
      stepsList.innerHTML = '';
      steps.forEach(function (step, index) {
        var li = document.createElement('li');
        li.textContent = step;
        if (index === steps.length - 1) {
          li.classList.add('step-final');
        }
        stepsList.appendChild(li);
      });
      stepsCard.hidden = false;
    }

    function initStepMode() {
      clearError();
      hideAll();

      var validated = validateInput();
      if (!validated) return;

      var n = validated.n;
      var costs = validated.costs;
      var mode = validated.mode;

      var dp = [];
      dp[0] = mode === 'cost' ? 0 : 1;
      if (n >= 1) dp[1] = mode === 'cost' ? costs[0] : 1;

      dpState = {
        n: n,
        costs: costs,
        mode: mode,
        dp: dp,
        currentI: n >= 1 ? 2 : 0,
        ops: 0,
        done: false,
        steps: []
      };

      if (mode === 'cost') {
        dpState.steps.push('dp[0] = 0');
        if (n >= 1) dpState.steps.push('dp[1] = ' + dp[1]);
      } else {
        dpState.steps.push('dp[0] = 1');
        if (n >= 1) dpState.steps.push('dp[1] = 1');
      }

      vizCard.hidden = false;
      renderStaircase(n, dp, 0, -1);
      renderDPTable(n, dp, 0);
      currentStepEl.textContent = 0;
      dpValEl.textContent = dp[0];

      var li = document.createElement('li');
      li.textContent = dpState.steps[0];
      stepsList.appendChild(li);
      if (n >= 1) {
        var li2 = document.createElement('li');
        li2.textContent = dpState.steps[1];
        stepsList.appendChild(li2);
      }
      stepsCard.hidden = false;

      if (n < 2) {
        dpState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;
        var resultLi = document.createElement('li');
        resultLi.textContent = 'Kết quả: ' + dp[n];
        resultLi.classList.add('step-final');
        stepsList.appendChild(resultLi);
        resultValue.textContent = dp[n] + (mode === 'cost' ? '' : ' cách');
        resultDetail.textContent = 'dp[' + n + '] = ' + dp[n];
        resultCard.hidden = false;
        return;
      }

      stepBtn.disabled = false;
      calcBtn.disabled = true;
      randomBtn.disabled = true;
      autoBtn.disabled = true;
    }

    function handleStep() {
      if (!dpState || dpState.done) return;

      var n = dpState.n;
      var costs = dpState.costs;
      var mode = dpState.mode;
      var i = dpState.currentI;

      if (i > n) {
        dpState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        var li = document.createElement('li');
        if (mode === 'cost') {
          li.textContent = 'Kết quả: Chi phí nhỏ nhất = ' + dpState.dp[n];
          resultValue.textContent = 'Chi phí nhỏ nhất: ' + dpState.dp[n];
        } else {
          li.textContent = 'Kết quả: ' + dpState.dp[n] + ' cách';
          resultValue.textContent = dpState.dp[n] + ' cách';
        }
        li.classList.add('step-final');
        stepsList.appendChild(li);
        resultDetail.textContent = 'dp[' + n + '] = ' + dpState.dp[n] + ' | Phép tính: ' + dpState.ops;
        resultCard.hidden = false;

        renderStaircase(n, dpState.dp, n, n);
        renderDPTable(n, dpState.dp, n);

        calcBtn.disabled = false;
        randomBtn.disabled = false;
        return;
      }

      var step;
      if (mode === 'cost') {
        var cost = costs[i - 1];
        dpState.dp[i] = Math.min(dpState.dp[i - 1], dpState.dp[i - 2]) + cost;
        dpState.ops++;
        step = 'dp[' + i + '] = min(dp[' + (i - 1) + '], dp[' + (i - 2) + ']) + costs[' + (i - 1) + '] = min(' + dpState.dp[i - 1] + ', ' + dpState.dp[i - 2] + ') + ' + cost + ' = ' + dpState.dp[i];
      } else {
        dpState.dp[i] = dpState.dp[i - 1] + dpState.dp[i - 2];
        dpState.ops++;
        step = 'dp[' + i + '] = dp[' + (i - 1) + '] + dp[' + (i - 2) + '] = ' + dpState.dp[i - 1] + ' + ' + dpState.dp[i - 2] + ' = ' + dpState.dp[i];
      }

      currentStepEl.textContent = i;
      dpValEl.textContent = dpState.dp[i];
      opsEl.textContent = dpState.ops;

      renderStaircase(n, dpState.dp, i, -1);
      renderDPTable(n, dpState.dp, i);

      var li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);

      dpState.currentI++;

      if (dpState.currentI > n) {
        dpState.done = true;
        stepBtn.disabled = true;
        autoBtn.disabled = true;

        var resultLi = document.createElement('li');
        if (mode === 'cost') {
          resultLi.textContent = 'Kết quả: Chi phí nhỏ nhất = ' + dpState.dp[n];
          resultValue.textContent = 'Chi phí nhỏ nhất: ' + dpState.dp[n];
        } else {
          resultLi.textContent = 'Kết quả: ' + dpState.dp[n] + ' cách';
          resultValue.textContent = dpState.dp[n] + ' cách';
        }
        resultLi.classList.add('step-final');
        stepsList.appendChild(resultLi);
        resultDetail.textContent = 'dp[' + n + '] = ' + dpState.dp[n] + ' | Phép tính: ' + dpState.ops;
        resultCard.hidden = false;

        renderStaircase(n, dpState.dp, n, n);
        renderDPTable(n, dpState.dp, n);

        calcBtn.disabled = false;
        randomBtn.disabled = false;
      }
    }

    function handleAuto() {
      if (isAnimating) {
        stopAuto();
        return;
      }

      if (!dpState) {
        initStepMode();
        if (!dpState) return;
      }

      isAnimating = true;
      autoBtn.textContent = '⏸ Dừng';
      calcBtn.disabled = true;
      randomBtn.disabled = true;
      stepBtn.disabled = true;

      function tick() {
        if (!dpState || dpState.done) {
          stopAuto();
          calcBtn.disabled = false;
          randomBtn.disabled = false;
          stepBtn.disabled = false;
          return;
        }
        handleStep();
        autoTimer = setTimeout(tick, 600);
      }

      tick();
    }

    function handleReset() {
      hideAll();
      stepBtn.disabled = false;
      calcBtn.disabled = false;
      randomBtn.disabled = false;
      autoBtn.disabled = false;
    }

    function handleRandom() {
      var n = Math.floor(Math.random() * 10) + 3;
      nInput.value = n;
      if (costToggle.checked) {
        var costs = [];
        for (var i = 0; i < n; i++) {
          costs.push(Math.floor(Math.random() * 20) + 1);
        }
        costInput.value = costs.join(', ');
      }
      clearError();
      hideAll();
      stepBtn.disabled = false;
    }

    calcBtn.addEventListener('click', handleCalc);
    randomBtn.addEventListener('click', handleRandom);
    stepBtn.addEventListener('click', function () {
      if (!dpState) {
        initStepMode();
      } else if (!dpState.done && !isAnimating) {
        handleStep();
      }
    });
    autoBtn.addEventListener('click', handleAuto);
    resetBtn.addEventListener('click', handleReset);

    nInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleCalc();
      }
    });

    costInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleCalc();
      }
    });

    nInput.addEventListener('input', function () {
      if (nInput.classList.contains('input-error-border')) {
        clearError();
      }
    });
  })();
})();
