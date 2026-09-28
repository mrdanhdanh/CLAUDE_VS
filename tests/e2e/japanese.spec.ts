import { test, expect, type Page } from '@playwright/test';

/**
 * 日本語 N5 Trainer (www/japanese/) — Guard (KN-056)
 * - Stub speechSynthesis (ghi lại {text, lang, rate}) — test logic player, không mock logic app.
 * - window.__NIHONGO_TEST__ rút ngắn wait (leadMs/gapMs) để test nhanh, prod vẫn 1000ms.
 * - window.__JPQuizState() — trạng thái câu hỏi hiện tại (test seam khai báo trong quiz.js).
 */

// Chạy trong browser trước page scripts — phải self-contained.
const TTS_STUB = () => {
  const w = window as any;
  w.__NIHONGO_TEST__ = { leadMs: 40, gapMs: 40 };
  w.__spoken = [] as Array<{ text: string; lang: string; rate: number }>;
  w.__cancelled = 0;
  const pending = new Set<any>();
  const synth = {
    speak(u: any) {
      w.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate });
      pending.add(u);
      setTimeout(() => {
        if (pending.has(u)) { pending.delete(u); u.onend && u.onend({}); }
      }, 30);
    },
    cancel() {
      w.__cancelled++;
      for (const u of Array.from(pending)) { pending.delete(u); u.onerror && u.onerror({ error: 'canceled' }); }
    },
    pause() {}, resume() {},
    getVoices() { return [{ name: 'Fake JA', lang: 'ja-JP' }, { name: 'Fake VI', lang: 'vi-VN' }]; },
    addEventListener() {}, removeEventListener() {},
  };
  try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); }
  catch { w.speechSynthesis = synth; }
  w.SpeechSynthesisUtterance = class {
    text: string; lang = ''; rate = 1; voice: any = null; onend: any = null; onerror: any = null;
    constructor(text: string) { this.text = text; }
  };
};

const spoken = (page: Page) => page.evaluate(() => (window as any).__spoken as Array<{ text: string; lang: string; rate: number }>);

// Nút tĩnh trong HTML có thể bị click trước khi init() gắn listener (race dưới tải cao).
// Chờ marker render TỪ init() trước khi tương tác.
const waitReady = (page: Page, kind: 'learn' | 'quiz') =>
  expect(page.locator(kind === 'learn' ? '#lessonChips .chip-check' : '#genLessons .chip-check')).toHaveCount(3);

test.describe('japanese — trang Học', () => {
  test('play đúng trình tự (thường → chậm → nghĩa VI), pause ẩn/hiện đúng, stop reset', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');

    await expect(page.locator('#lessonChips .chip-check')).toHaveCount(3);
    await page.locator('#lessonChips input[value="L-bai-01"]').check();
    await expect(page.locator('#progressLabel')).toHaveText('1/13');
    // thứ tự ngẫu nhiên — từ đang hiển thị phải là từ đầu queue hiện tại
    const idle = await page.evaluate(() => (window as any).__JPLearn.queue()[0]);
    await expect(page.locator('#wordKanji')).toHaveText(idle.kanji || idle.kana);

    await page.click('#btnPlay');
    const session = await page.evaluate(() => (window as any).__JPLearn.queue());
    await expect(page.locator('#btnPause')).toBeVisible();
    await expect(page.locator('#btnPlay')).toBeHidden();

    await page.waitForFunction(() => (window as any).__spoken.length >= 3);
    const calls = await spoken(page);
    expect(calls[0]).toMatchObject({ text: session[0].kana || session[0].kanji, lang: 'ja-JP' });
    expect(calls[0].rate).toBeCloseTo(0.95, 2);
    expect(calls[1].rate).toBeCloseTo(0.6, 2); // tốc độ chậm
    expect(calls[2]).toMatchObject({ text: session[0].vi, lang: 'vi-VN' }); // nghĩa tiếng Việt

    // Pause: không đọc thêm, nút đổi trạng thái
    await page.click('#btnPause');
    await expect(page.locator('#btnPlay')).toBeVisible();
    await expect(page.locator('#btnPause')).toBeHidden();
    const n1 = (await spoken(page)).length;
    await page.waitForTimeout(260);
    const n2 = (await spoken(page)).length;
    expect(n2).toBe(n1);

    // Resume: đọc tiếp
    await page.click('#btnPlay');
    await page.waitForFunction(k => (window as any).__spoken.length > k, n2);

    // Stop: đặt lại về từ đầu (giữ nguyên thứ tự phiên hiện tại)
    await page.click('#btnStop');
    await expect(page.locator('#progressLabel')).toHaveText('1/13');
    await expect(page.locator('#wordKanji')).toHaveText(session[0].kanji || session[0].kana);
    await expect(page.locator('#btnPause')).toBeHidden();
    await expect(page.locator('#btnPlay')).toBeVisible();
  });

  test('toggle Mẫu câu hiển thị câu mẫu + đọc thêm khi bật', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');
    await page.locator('#lessonChips input[value="L-bai-01"]').check();
    const idle = await page.evaluate(() => (window as any).__JPLearn.queue()[0]);
    expect(idle.examples.length).toBeGreaterThan(0);

    await expect(page.locator('#wordSentences')).toBeHidden();
    await page.click('#btnSentences');
    await expect(page.locator('#btnSentences')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#wordSentences')).toBeVisible();
    await expect(page.locator('#wordSentences .ex-jp').first()).toContainText(idle.examples[0].jp);

    // Bật mẫu câu → playback có bước đọc mẫu câu (JP + VI) — theo từ đầu của phiên mới
    await page.click('#btnPlay');
    const session = await page.evaluate(() => (window as any).__JPLearn.queue());
    const ex = session[0].examples[0];
    await page.waitForFunction(() => (window as any).__spoken.length >= 5);
    const calls = await spoken(page);
    expect(calls[3]).toMatchObject({ text: ex.jp, lang: 'ja-JP' });
    expect(calls[4]).toMatchObject({ text: ex.vi, lang: 'vi-VN' });
    await page.click('#btnStop');
  });

  test('Phát = xáo trộn mới mỗi phiên + không lặp từ trong phiên', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');

    // Chèn 1 từ trùng với Bài 1 vào Bài 2 (mô phỏng từ lặp giữa các bài)
    await page.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('nihongo:db:v1') || '{}');
      db.words['L-bai-02'].push({ id: 'dup-1', kanji: '学生', kana: 'がくせい', vi: 'học sinh (trùng)', examples: [] });
      localStorage.setItem('nihongo:db:v1', JSON.stringify(db));
    });
    await page.reload();
    await waitReady(page, 'learn');
    await page.locator('#lessonChips input[value="L-bai-01"]').check();
    await page.locator('#lessonChips input[value="L-bai-02"]').check();

    // 26 từ thô (13+13) nhưng từ trùng chỉ còn 1 → 25
    await expect(page.locator('#progressLabel')).toHaveText('1/25');
    const keys = () => page.evaluate(() =>
      (window as any).__JPLearn.queue().map((w: any) => String(w.kanji || w.kana).trim()));
    const q = await keys();
    expect(q.length).toBe(25);
    expect(new Set(q).size).toBe(25);

    // Mỗi lần Phát → thứ tự mới (8 phiên phải ra ≥2 thứ tự khác nhau — không random thì bất khả thi)
    const orders = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await page.click('#btnPlay');
      orders.add((await keys()).join('|'));
      await page.click('#btnStop');
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  test('không chọn bài → Phát nhắc nhở, không phát', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');
    await page.click('#btnPlay');
    await expect(page.locator('.toast')).toContainText('Chọn ít nhất 1 bài học');
    expect((await spoken(page)).length).toBe(0);
  });

  test('badge giọng đọc → dialog liệt kê danh sách + Kiểm tra lại', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');

    await expect(page.locator('#voiceBadge')).toContainText('JA ✓');
    await page.click('#voiceBadge');
    await expect(page.locator('#voiceDlg')).toBeVisible();
    await expect(page.locator('#voiceSummary')).toContainText('2 giọng đọc');
    await expect(page.locator('.voice-item')).toHaveCount(2);
    await expect(page.locator('.voice-item').first()).toContainText('Fake JA');
    await expect(page.locator('#voiceHowto')).toBeHidden(); // stub có đủ ja + vi → không hiện hướng dẫn

    await page.click('#voiceRetry');
    await expect(page.locator('.toast')).toContainText('Đã kiểm tra lại');
    await expect(page.locator('.voice-item')).toHaveCount(2);
  });

  test('giọng nạp trễ (async) — không cảnh báo oan; thiếu thật mới cảnh báo', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as any;
      w.__NIHONGO_TEST__ = { leadMs: 40, gapMs: 40, warnMs: 150 };
      let loaded = false, cb: any = null;
      const synth = {
        speak(u: any) { u.onend && u.onend({}); },
        cancel() {}, pause() {}, resume() {},
        getVoices() { return loaded ? [{ name: 'Late JA', lang: 'ja-JP' }, { name: 'Late VI', lang: 'vi-VN' }] : []; },
        addEventListener(type: string, fn: any) { if (type === 'voiceschanged') cb = fn; },
        removeEventListener() {},
        dispatchEvent() { if (cb) cb(); return true; },
      };
      try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); }
      catch { w.speechSynthesis = synth; }
      w.SpeechSynthesisUtterance = class { text = ''; lang = ''; rate = 1; onend: any = null; onerror: any = null; constructor(t: string) { this.text = t; } };
      w.__releaseVoices = () => { loaded = true; synth.dispatchEvent(new Event('voiceschanged')); };
    });

    // 1) Nạp trễ rồi có đủ giọng → badge tự cập nhật, KHÔNG toast cảnh báo
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');
    await expect(page.locator('#voiceBadge')).toContainText('JA ✗'); // chưa nạp
    await page.evaluate(() => (window as any).__releaseVoices());
    await expect(page.locator('#voiceBadge')).toContainText('JA ✓');
    await page.waitForTimeout(400); // > warnMs 150 → timer phải đã bị hủy
    await expect(page.locator('.toast')).toHaveCount(0);

    // 2) Thiếu thật (không bao giờ có giọng) → sau warnMs mới cảnh báo
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');
    await expect(page.locator('#voiceBadge')).toContainText('JA ✗');
    await expect(page.locator('.toast').first()).toContainText('Máy chưa có giọng tiếng Nhật');
  });

  test('ẩn/hiện danh sách bài học — toggle đúng + nhớ trạng thái qua F5', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');

    await expect(page.locator('#lessonPanel')).toBeVisible();
    await expect(page.locator('#btnToggleLessons')).toHaveAttribute('aria-expanded', 'true');
    await page.click('#btnToggleLessons');
    await expect(page.locator('#lessonPanel')).toBeHidden();
    await expect(page.locator('#btnToggleLessons')).toHaveAttribute('aria-expanded', 'false');

    // F5 → vẫn ẩn (persist localStorage)
    await page.reload();
    await waitReady(page, 'learn');
    await expect(page.locator('#lessonPanel')).toBeHidden();

    await page.click('#btnToggleLessons');
    await expect(page.locator('#lessonPanel')).toBeVisible();
    await expect(page.locator('#btnToggleLessons')).toHaveAttribute('aria-expanded', 'true');
  });

  test('chữ từ vựng đủ lớn (kanji ≥96px, nghĩa ≥28px); ẩn sidebar → chữ to thêm', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/japanese/index.html');
    await waitReady(page, 'learn');
    await page.locator('#lessonChips input[value="L-bai-01"]').check();

    const fontSize = (sel: string) =>
      page.evaluate(s => parseFloat(getComputedStyle(document.querySelector(s) as Element).fontSize), sel);
    const kanjiOpen = await fontSize('#wordKanji');
    expect(kanjiOpen).toBeGreaterThanOrEqual(96);
    expect(await fontSize('#wordVi')).toBeGreaterThanOrEqual(28);

    await page.click('#btnToggleLessons');
    const kanjiHidden = await fontSize('#wordKanji');
    const hasCq = await page.evaluate(() => CSS.supports('container-type: inline-size'));
    if (hasCq) expect(kanjiHidden).toBeGreaterThan(kanjiOpen); // container query: rộng hơn → chữ lớn hơn
    else expect(kanjiHidden).toBeGreaterThanOrEqual(kanjiOpen);
  });
});

test.describe('japanese — Từ điển', () => {
  test('CRUD dòng + search không dấu + sort + delete confirm + export + F5 giữ dữ liệu', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('/japanese/dictionary.html');

    await expect(page.locator('.lesson-row')).toHaveCount(3);
    await page.locator('.lesson-row[data-id="L-bai-01"] .pick').click();
    await expect(page.locator('#tbody tr')).toHaveCount(13);
    await expect(page.locator('#tableMeta')).toContainText('13/13');

    // search không phân biệt dấu
    await page.fill('#searchInput', 'hoc sinh');
    await expect(page.locator('#tbody tr').first()).toContainText('学生');
    await page.fill('#searchInput', '');
    await expect(page.locator('#tbody tr')).toHaveCount(13);

    // thêm dòng
    await page.click('#btnAddRow');
    await expect(page.locator('#wordDlg')).toBeVisible();
    await page.fill('#wKanji', '猫');
    await page.fill('#wKana', 'ねこ');
    await page.fill('#wVi', 'con mèo');
    await page.click('#wordSave');
    await expect(page.locator('#tbody tr')).toHaveCount(14);

    // sửa dòng
    await page.locator('#tbody tr', { hasText: '猫' }).locator('button[data-act="edit"]').click();
    await page.fill('#wVi', 'con mèo (đã sửa)');
    await page.click('#wordSave');
    await expect(page.locator('#tbody tr', { hasText: 'đã sửa' })).toHaveCount(1);

    // sort theo kana
    await page.click('#thKana .sort-btn');
    await expect(page.locator('#thKana')).toHaveAttribute('aria-sort', 'ascending');

    // xóa dòng (confirm) — không hồi lại
    page.on('dialog', d => d.accept());
    await page.locator('#tbody tr').first().locator('button[data-act="del"]').click();
    await expect(page.locator('#tbody tr')).toHaveCount(13);

    // export bài → có download
    const dl = page.waitForEvent('download');
    await page.click('#btnExportLesson');
    const download = await dl;
    expect(download.suggestedFilename()).toMatch(/^nihongo-.*\.json$/);

    // F5 → dữ liệu localStorage còn nguyên (bản sửa + xóa)
    await page.reload();
    await expect(page.locator('#tbody tr')).toHaveCount(13);
    await expect(page.locator('#tbody tr', { hasText: 'đã sửa' })).toHaveCount(1);

    expect(errors).toEqual([]);
  });
});

test.describe('japanese — Kiểm tra', () => {
  test('quiz: options xáo trộn (giữ nguyên tập đáp án), chấm đúng, tổng kết điểm', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/quiz.html');
    await waitReady(page, 'quiz');
    await page.selectOption('#fCount', '5');
    await page.click('#btnStart');
    await expect(page.locator('#quizCard')).toBeVisible();

    for (let i = 0; i < 5; i++) {
      const st = await page.evaluate(() => {
        const s = (window as any).__JPQuizState();
        const db = JSON.parse(localStorage.getItem('nihongo:db:v1') || '{}');
        const orig = (db.questions || []).find((q: any) => q.id === s.id);
        return { ...s, originalOptions: orig ? orig.options : [] };
      });
      expect(st.options).toHaveLength(4);
      expect([...st.options].sort()).toEqual([...st.originalOptions].sort()); // permutation — mapping đúng
      expect(st.options).toContain(st.answerText);

      // click đúng option theo index hiển thị (tránh substring: "でした" ⊂ "でしたか")
      await page.locator('#optWrap .option-btn').nth(st.options.indexOf(st.answerText)).click();
      await expect(page.locator('#qFeedback')).toHaveClass(/ok/);
      await page.click('#btnNext');
    }

    await expect(page.locator('.result-big')).toHaveText('5/5');
    await expect(page.locator('#btnAgain')).toBeVisible();
  });

  test('generator: sinh câu từ từ vựng — idempotent, thống kê đúng, xóa được', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.goto('/japanese/quiz.html');
    await waitReady(page, 'quiz');
    await page.click('#tabbtn-bank');

    await page.locator('#genLessons input[data-lesson="L-bai-02"]').uncheck();
    await page.locator('#genLessons input[data-lesson="L-bai-03"]').uncheck();
    await page.fill('#genPerType', '5');
    await page.click('#btnGen');
    await expect(page.locator('.toast-success')).toContainText('Đã sinh');

    const countGen = () => page.evaluate(() =>
      JSON.parse(localStorage.getItem('nihongo:db:v1') || '{}').questions.filter((q: any) => q.source === 'generated').length);
    const n1 = await countGen();
    expect(n1).toBeGreaterThan(0);
    await expect(page.locator('#statGenerated')).toHaveText(String(n1));

    // sinh lại — ID tất định → upsert, không nhân đôi
    await page.click('#btnGen');
    const n2 = await countGen();
    expect(n2).toBe(n1);

    // câu sinh đủ schema tối thiểu
    const bad = await page.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('nihongo:db:v1') || '{}');
      return db.questions.filter((q: any) => q.source === 'generated')
        .filter((q: any) => !q.id || !q.question || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 || new Set(q.options).size !== q.options.length || !(q.answer >= 0 && q.answer < q.options.length)).length;
    });
    expect(bad).toBe(0);

    await page.click('#btnGenClear');
    const n3 = await countGen();
    expect(n3).toBe(0);
  });
});

test.describe('japanese — tổng thể', () => {
  test('2 panel thẳng hàng dọc (Học + Từ điển) — không lệch', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    await page.setViewportSize({ width: 950, height: 657 });

    await page.goto('/japanese/index.html');
    await expect(page.locator('#lessonChips .chip-check')).toHaveCount(3);
    const gapLearn = await page.evaluate(() => {
      const a = (document.querySelector('#lessonPanel') as Element).getBoundingClientRect().top;
      const b = (document.querySelector('.panel-stage') as Element).getBoundingClientRect().top;
      return Math.abs(a - b);
    });
    expect(gapLearn, 'panel trang Học lệch nhau').toBeLessThanOrEqual(1);

    await page.goto('/japanese/dictionary.html');
    await expect(page.locator('.lesson-row')).toHaveCount(3);
    const gapDict = await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('.dict-layout > .panel')).slice(0, 2);
      return Math.abs(ps[0].getBoundingClientRect().top - ps[1].getBoundingClientRect().top);
    });
    expect(gapDict, 'panel trang Từ điển lệch nhau').toBeLessThanOrEqual(1);
  });

  test('375px không tràn ngang + không pageerror + không 404 trên 3 trang', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    const errors: string[] = [];
    const bad: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });

    await page.setViewportSize({ width: 375, height: 720 });
    for (const p of ['/japanese/index.html', '/japanese/quiz.html', '/japanese/dictionary.html']) {
      await page.goto(p);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `overflow ở ${p}`).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
    expect(bad).toEqual([]);
  });

  test('URL không có index.html (dirBase) vẫn fetch seed OK', async ({ page }) => {
    await page.addInitScript(TTS_STUB);
    // KN-030: dirBase phải xử lý cả pathname không có '/' cuối
    await page.goto('/japanese/index.html');
    const base = await page.evaluate(() => (window as any).JPCore.dirBase('/japanese'));
    expect(base).toBe('/japanese/');
    expect(await page.evaluate(() => (window as any).JPCore.dirBase('/japanese/index.html'))).toBe('/japanese/');
    // điều hướng qua URL thư mục (rewrite trong serve.json — parity với GitHub Pages)
    await page.goto('/japanese');
    await expect(page.locator('#lessonChips .chip-check')).toHaveCount(3);
  });
});
