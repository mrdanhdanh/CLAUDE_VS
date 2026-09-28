/* =============================================================
   Nihongo N5 Trainer — core (store · tts · i18n · ui helpers)
   Plain script (no ESM) — chạy được cả file:// và GitHub Pages.
   ============================================================= */
(() => {
  'use strict';

  /* ---------------- DOM / utils ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // URL thư mục của trang — robust khi URL thiếu '/' cuối (KN-030/KN-040)
  function dirBase(p) {
    if (p.endsWith('/')) return p;
    const last = p.slice(p.lastIndexOf('/') + 1);
    return last.includes('.') ? p.slice(0, p.lastIndexOf('/') + 1) : p + '/';
  }

  async function fetchJSON(rel) {
    const res = await fetch(dirBase(location.pathname) + rel, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  function uid(prefix = 'x') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function shuffle(arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Bỏ dấu tiếng Việt để search không phân biệt dấu
  function deaccent(s) {
    return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ---------------- i18n (locale-owned copy) ---------------- */
  const STR = {
    'nav.learn': 'Học', 'nav.quiz': 'Kiểm tra', 'nav.dict': 'Từ điển',
    'nav.theme': 'Đổi giao diện sáng/tối', 'nav.status': '← STATUS',
    'app.brandSub': 'N5 Trainer',
    'footer.note': 'Dữ liệu lưu trong trình duyệt này (localStorage). Export JSON để sao lưu hoặc chia sẻ qua data/seed-*.json.',
    'footer.made': 'Static · Web Speech API · không backend',

    'ui.close': 'Đóng', 'ui.cancel': 'Hủy', 'ui.save': 'Lưu', 'ui.delete': 'Xóa', 'ui.edit': 'Sửa',
    'ui.loading': 'Đang tải…', 'ui.seedFail': 'Không tải được dữ liệu mẫu — hãy mở trang qua server/Pages (không dùng file://).',

    'learn.lessons': 'Bài học', 'learn.selectAll': 'Chọn tất cả', 'learn.clearAll': 'Bỏ chọn',
    'learn.sentences': 'Mẫu câu', 'learn.randomNote': 'Mỗi lần Phát, từ được xáo trộn ngẫu nhiên — từ trùng giữa các bài chỉ phát một lần trong phiên.',
    'learn.hideLessons': 'Ẩn bài học', 'learn.showLessons': 'Hiện bài học',
    'learn.play': 'Phát', 'learn.pause': 'Tạm dừng', 'learn.stop': 'Đặt lại',
    'learn.speedNormal': 'Thường', 'learn.speedFast': 'Nhanh',
    'learn.speedNormalTitle': 'Nghe lại từ hiện tại — tốc độ thường', 'learn.speedFastTitle': 'Nghe lại từ hiện tại — tốc độ nhanh',
    'learn.ready': 'Chọn bài rồi bấm Phát để bắt đầu.', 'learn.noLessons': 'Chọn ít nhất 1 bài học để bắt đầu.',
    'learn.empty': 'Chưa có bài học nào — vào Từ điển để tạo bài mới.',
    'learn.done': 'Đã hết danh sách từ 🎉', 'learn.words': '{n} từ',
    'learn.reading': 'Đang đọc: {text} ({kind})', 'learn.kindNormal': 'thường', 'learn.kindSlow': 'chậm',
    'learn.kindFast': 'nhanh', 'learn.kindMeaning': 'nghĩa', 'learn.kindExample': 'mẫu câu',
    'learn.noWords': 'Bài đã chọn chưa có từ vựng — thêm dòng trong Từ điển.',
    'learn.voices': 'Giọng đọc', 'learn.voiceOk': '{lang} ✓', 'learn.voiceNo': '{lang} ✗',
    'learn.voiceHint': 'Máy chưa có giọng {lang}. Cài trong Settings → Time & Language → Speech, đóng hẳn trình duyệt rồi mở lại — hoặc bấm badge “Giọng đọc” để kiểm tra.',
    'learn.ttsUnsupported': 'Trình duyệt không hỗ trợ đọc tiếng nói — chỉ hiển thị chữ.',
    'learn.playingHint': 'Đang phát — bấm Tạm dừng để nghe thủ công.',
    'learn.keyHint': 'Space: Phát/Tạm dừng · danh sách trộn theo thứ tự bài học',

    'dict.lessons': 'Bài học', 'dict.newLesson': '＋ Bài mới', 'dict.editLesson': 'Sửa bài học',
    'dict.name': 'Tên bài', 'dict.source': 'Nguồn', 'dict.desc': 'Mô tả',
    'dict.searchPh': 'Tìm kanji / kana / nghĩa (không phân biệt dấu)…',
    'dict.addRow': '＋ Thêm dòng', 'dict.import': 'Import', 'dict.exportLesson': 'Export bài',
    'dict.exportAll': 'Export tất cả', 'dict.restore': 'Khôi phục dữ liệu mẫu',
    'dict.thKanji': 'Kanji', 'dict.thKana': 'Kana', 'dict.thVi': 'Nghĩa', 'dict.thEx': 'Mẫu câu', 'dict.thActions': 'Thao tác',
    'dict.rowCount': '{x}/{y} dòng', 'dict.emptyLesson': 'Bài chưa có từ nào — thêm dòng hoặc import JSON.',
    'dict.noLessons': 'Chưa có bài học — tạo bài mới để bắt đầu.',
    'dict.selectLesson': 'Chọn một bài học trong danh sách.',
    'dict.confirmDeleteWord': 'Xóa vĩnh viễn từ “{name}”? Thao tác không hồi lại được.',
    'dict.confirmDeleteLesson': 'Xóa bài “{name}” cùng {n} từ? Thao tác không hồi lại được.',
    'dict.confirmRestore': 'Khôi phục dữ liệu mẫu? Toàn bộ bài học, từ vựng và câu hỏi hiện tại sẽ bị thay thế.',
    'dict.saved': 'Đã lưu.', 'dict.deleted': 'Đã xóa: {name}',
    'dict.importTitle': 'Import JSON vào “{name}”', 'dict.importMode': 'Chế độ',
    'dict.modeMerge': 'Gộp (upsert theo ID — dòng thiếu ID sẽ được cấp ID mới)',
    'dict.modeReplace': 'Thay thế toàn bộ nội dung bài hiện tại',
    'dict.pickFile': 'Chọn file JSON…', 'dict.runImport': 'Import',
    'dict.importStats': 'Import: +{added} mới · ~{updated} cập nhật · {skipped} bỏ qua',
    'dict.importError': 'File không hợp lệ — cần array từ vựng hoặc object {words:[…]}.',
    'dict.irreversible': 'ID dòng là duy nhất và không tái sử dụng — xóa là không hồi lại.',
    'dict.wordEditor': 'Sửa từ', 'dict.newWord': 'Thêm từ',
    'dict.errKana': 'Cần nhập ít nhất Kanji hoặc Kana.', 'dict.errVi': 'Cần nhập nghĩa tiếng Việt.',
    'dict.examples': 'Mẫu câu (JP / VI)', 'dict.addExample': '＋ Thêm câu',
    'dict.wordsCount': '{n} từ', 'dict.deletedLesson': 'Đã xóa bài: {name}',

    'quiz.tabPlay': 'Làm bài', 'quiz.tabBank': 'Ngân hàng câu hỏi', 'quiz.tabSkill': 'Skill',
    'quiz.sources': 'Nguồn câu hỏi', 'quiz.srcOfficial': 'Chính thức (đề thi)',
    'quiz.srcGenerated': 'Sinh từ từ vựng', 'quiz.srcSample': 'Mẫu (demo)',
    'quiz.year': 'Năm', 'quiz.yearAll': 'Tất cả', 'quiz.section': 'Phần', 'quiz.sectionAll': 'Tất cả',
    'quiz.count': 'Số câu', 'quiz.countAll': 'Tất cả', 'quiz.shuffleQ': 'Xáo trộn câu hỏi',
    'quiz.start': 'Bắt đầu', 'quiz.next': 'Câu tiếp', 'quiz.finish': 'Xem kết quả',
    'quiz.correct': 'Chính xác!', 'quiz.wrong': 'Chưa đúng — đáp án đúng: {ans}',
    'quiz.questionOf': 'Câu {i}/{n}', 'quiz.resultBig': '{score}/{total}',
    'quiz.resultSub': 'Đúng {pct}% · {msg}',
    'quiz.msgHigh': 'Tuyệt vời, giữ phong độ nhé! 🎉', 'quiz.msgMid': 'Khá tốt — ôn thêm phần sai là ổn 💪', 'quiz.msgLow': 'Ôn lại từ vựng rồi thử lại nhé!',
    'quiz.again': 'Làm lại', 'quiz.backCfg': 'Về cấu hình', 'quiz.wrongList': 'Câu sai cần xem lại',
    'quiz.yourAnswer': 'Bạn chọn: {ans}', 'quiz.correctAnswer': 'Đáp án đúng: {ans}',
    'quiz.noMatch': 'Không có câu hỏi khớp bộ lọc — import đề chính thức hoặc sinh câu từ từ vựng.',
    'quiz.pickSource': 'Chọn ít nhất 1 nguồn câu hỏi.',
    'quiz.emptyBank': 'Ngân hàng trống — import đề chính thức hoặc sinh câu hỏi từ bài học.',
    'quiz.bankStats': 'Tổng {total} · Chính thức {official} · Sinh {generated} · Mẫu {sample}',
    'quiz.genTitle': 'Sinh câu hỏi từ từ vựng', 'quiz.genTypes': 'Loại câu hỏi',
    'quiz.typeMeaning': 'Kanji → Nghĩa', 'quiz.typeReverse': 'Nghĩa → Kanji', 'quiz.typeReading': 'Kana → Kanji', 'quiz.typeCloze': 'Điền vào mẫu câu',
    'quiz.perType': 'Số câu mỗi loại', 'quiz.genRun': 'Sinh & lưu', 'quiz.genClear': 'Xóa câu sinh của bài đã chọn',
    'quiz.genPick': 'Chọn bài học và ít nhất 1 loại câu hỏi.',
    'quiz.genDone': 'Đã sinh & lưu {n} câu hỏi vào ngân hàng.', 'quiz.genCleared': 'Đã xóa {n} câu sinh.',
    'quiz.importBank': 'Import câu hỏi', 'quiz.exportBank': 'Export câu hỏi', 'quiz.deleteQ': 'Xóa câu hỏi',
    'quiz.confirmDeleteQ': 'Xóa câu hỏi này khỏi ngân hàng?',
    'quiz.importQStats': 'Import: +{added} mới · ~{updated} cập nhật · {skipped} bỏ qua',
    'quiz.importQError': 'File câu hỏi không hợp lệ — cần array hoặc object {questions:[…]}.',
    'quiz.showing': 'Hiển thị {n} câu (tối đa 100).', 'quiz.searchQ': 'Tìm trong ngân hàng…',
    'quiz.exported': 'Đã tải file JSON.', 'quiz.loading': 'Đang tải câu hỏi…',
    'quiz.statTotal': 'Tổng', 'quiz.statOfficial': 'Chính thức', 'quiz.statGenerated': 'Sinh từ vựng', 'quiz.statSample': 'Mẫu (demo)',
    'quiz.needSeed': 'Chưa có câu hỏi nào trong ngân hàng — import hoặc sinh câu từ từ vựng.',

    'gen.instrMeaning': 'Chọn nghĩa đúng của từ:', 'gen.instrReverse': 'Chọn từ tiếng Nhật đúng với nghĩa:',
    'gen.instrReading': 'Chọn kanji đúng của từ sau:', 'gen.instrCloze': 'Chọn từ đúng để điền vào chỗ trống:',
    'gen.blanks': '＿＿＿',

    'voice.dialogTitle': 'Giọng đọc của trình duyệt', 'voice.badgeTitle': 'Bấm để kiểm tra giọng đọc',
    'voice.detected': 'Trình duyệt đang thấy {n} giọng đọc:',
    'voice.none': '(không thấy giọng nào — thử đóng hẳn trình duyệt rồi mở lại)',
    'voice.retry': 'Kiểm tra lại', 'voice.refreshed': 'Đã kiểm tra lại danh sách giọng.',
    'voice.howto': 'Nếu badge còn JA ✗ / VI ✗ dù đã cài gói Speech:',
    'voice.step1': 'Đóng HOÀN TOÀN trình duyệt — mở Task Manager, hết cả tiến trình nền — rồi mở lại. Windows chỉ nạp giọng mới khi trình duyệt khởi động lại.',
    'voice.step2': 'Ưu tiên mở bằng Microsoft Edge — Edge đọc trọn bộ giọng hệ thống (4 giọng Nhật: Ayumi, Haruka, Ichiro, Sayaka).',
    'voice.step3': 'Gói Speech chưa cài? Settings → Time & language → Language & region → 日本語 → Language options → tải mục Speech.',

    'skill.title': 'Skill sinh câu hỏi — lưu ngay trong site',
    'skill.intro': 'Bộ skill này nằm trong chính trang web (không phụ thuộc máy thực thi). Khi cần sinh câu hỏi từ từ vựng hay import đề chính thức, AI agent đọc SKILL.md để biết nguồn lấy và cách chọn câu; người dùng có thể bấm "Sinh & lưu" tại tab Ngân hàng.',
    'skill.h1': 'Nguồn câu hỏi', 'skill.h2': 'Quy tắc chọn câu (tóm tắt từ SKILL.md)', 'skill.h3': 'Import đề chính thức',
    'skill.h4': 'Files', 'skill.rule1': 'Chỉ sinh từ từ vựng có đủ dữ liệu cho loại câu (ví dụ Kana → Kanji cần từ có kanji).',
    'skill.rule2': 'Tối đa 1 câu / từ / loại; distractor khác đáp án, ưu tiên cùng bài, cùng kiểu chữ.',
    'skill.rule3': 'Câu sinh có ID tất định (gen-<bài>-<từ>-<loại>) — sinh lại là cập nhật, không nhân đôi.',
    'skill.rule4': 'Đề chính thức: import nguyên văn (không chế biến), giữ source "official", đáp án xáo trộn khi làm bài.',
    'skill.importSteps': 'Mở tab Ngân hàng → Import câu hỏi → chọn file JSON (schema trong schema.json). Mỗi câu cần: id, question, options (2-4), answer (index).',
    'skill.src1': 'Từ vựng các bài học (tab Từ điển — nguồn chính để sinh câu).',
    'skill.src2': 'Mẫu câu trong từng từ (dùng cho loại “Điền vào mẫu câu”).',
    'skill.src3': 'Đề thi chính thức N5 các năm — import nguyên văn qua tab Ngân hàng; ghi source "official".',
    'skill.open': 'Mở file',

    'toast.seedFailTitle': 'Seed', 'toast.saved': 'Đã lưu.', 'toast.downloaded': 'Đã tải file.',
  };

  function t(key, params) {
    let s = STR[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }

  function applyI18n(root = document) {
    $$('[data-i18n]', root).forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]', root).forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $$('[data-i18n-ph]', root).forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    $$('[data-i18n-title]', root).forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  }

  /* ---------------- Store (localStorage + seed) ---------------- */
  const KEY = 'nihongo:db:v1';
  const UI_KEY = 'nihongo:ui:v1';
  const THEME_KEY = 'nihongo:theme';
  const DB_VERSION = 1;

  function normalizeExample(x) {
    if (typeof x === 'string') return { jp: x.trim(), vi: '' };
    return { jp: String(x?.jp ?? '').trim(), vi: String(x?.vi ?? '').trim() };
  }

  function normalizeWord(raw) {
    const w = {
      id: raw?.id ? String(raw.id) : '',
      kanji: String(raw?.kanji ?? '').trim(),
      kana: String(raw?.kana ?? '').trim(),
      vi: String(raw?.vi ?? '').trim(),
      examples: Array.isArray(raw?.examples) ? raw.examples.map(normalizeExample).filter(e => e.jp || e.vi) : [],
      updatedAt: new Date().toISOString(),
    };
    if (raw?.examples === undefined && (raw?.ex_jp || raw?.ex_vi)) {
      w.examples = [{ jp: String(raw.ex_jp ?? '').trim(), vi: String(raw.ex_vi ?? '').trim() }].filter(e => e.jp || e.vi);
    }
    return w;
  }

  function validateWord(raw) {
    const kana = String(raw?.kana ?? '').trim();
    const kanji = String(raw?.kanji ?? '').trim();
    const vi = String(raw?.vi ?? '').trim();
    if (!kana && !kanji) return { ok: false, reason: 'missing-kanji-kana' };
    if (!vi) return { ok: false, reason: 'missing-vi' };
    return { ok: true };
  }

  const Store = {
    db: null,
    seedFailed: false,

    async init() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch { /* private mode */ }
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d && d.version === DB_VERSION && Array.isArray(d.lessons)) { this.db = d; return true; }
        } catch { /* corrupted → reseed */ }
      }
      this.db = await this._seed();
      this.save();
      return !this.seedFailed;
    },

    async _seed() {
      const db = { version: DB_VERSION, updatedAt: new Date().toISOString(), lessons: [], words: {}, questions: [] };
      try {
        const s = await fetchJSON('data/seed-lessons.json');
        if (s && Array.isArray(s.lessons)) {
          db.lessons = s.lessons.map(l => ({
            id: String(l.id), name: String(l.name ?? ''), source: String(l.source ?? ''),
            description: String(l.description ?? ''), createdAt: l.createdAt || new Date().toISOString(),
          }));
          db.words = {};
          for (const l of db.lessons) {
            const list = Array.isArray(s.words?.[l.id]) ? s.words[l.id] : [];
            db.words[l.id] = list.filter(w => validateWord(w).ok).map(w => {
              const nw = normalizeWord(w);
              if (!nw.id) nw.id = uid('w');
              return nw;
            });
          }
        }
        const q = await fetchJSON('data/questions.json');
        if (q && Array.isArray(q.questions)) db.questions = q.questions;
      } catch (e) {
        console.warn('[nihongo] seed fetch failed:', e);
        this.seedFailed = true;
      }
      return db;
    },

    save() {
      if (!this.db) return;
      this.db.updatedAt = new Date().toISOString();
      try { localStorage.setItem(KEY, JSON.stringify(this.db)); }
      catch { toast(t('dict.irreversible'), 'error'); }
    },

    async reset() {
      this.db = await this._seed();
      this.save();
      return !this.seedFailed;
    },

    // ---- lessons ----
    lessons() { return (this.db?.lessons || []).slice(); },
    getLesson(id) { return this.lessons().find(l => l.id === id) || null; },
    addLesson(data) {
      const lesson = {
        id: uid('L'), name: String(data.name ?? '').trim(), source: String(data.source ?? '').trim(),
        description: String(data.description ?? '').trim(), createdAt: new Date().toISOString(),
      };
      this.db.lessons.push(lesson);
      this.db.words[lesson.id] = [];
      this.save();
      return lesson;
    },
    updateLesson(id, patch) {
      const l = this.getLesson(id);
      if (!l) return null;
      Object.assign(l, {
        name: String(patch.name ?? l.name).trim(), source: String(patch.source ?? l.source).trim(),
        description: String(patch.description ?? l.description).trim(),
      });
      this.save();
      return l;
    },
    deleteLesson(id) {
      this.db.lessons = this.db.lessons.filter(l => l.id !== id);
      delete this.db.words[id];
      this.db.questions = this.db.questions.filter(q => q.lessonId !== id);
      this.save();
    },

    // ---- words ----
    words(lessonId) { return (this.db?.words?.[lessonId] || []).slice(); },
    countWords(lessonId) { return (this.db?.words?.[lessonId] || []).length; },
    addWord(lessonId, raw) {
      const w = normalizeWord(raw);
      if (!w.id) w.id = uid('w');
      if (!this.db.words[lessonId]) this.db.words[lessonId] = [];
      this.db.words[lessonId].push(w);
      this.save();
      return w;
    },
    updateWord(lessonId, id, raw) {
      const list = this.db.words[lessonId] || [];
      const w = list.find(x => x.id === id);
      if (!w) return null;
      const n = normalizeWord({ ...raw, id });
      Object.assign(w, n);
      this.save();
      return w;
    },
    deleteWord(lessonId, id) {
      this.db.words[lessonId] = (this.db.words[lessonId] || []).filter(x => x.id !== id);
      this.save();
    },
    importWords(lessonId, arr, mode = 'merge') {
      const stats = { added: 0, updated: 0, skipped: 0 };
      if (!Array.isArray(arr)) return { ...stats, invalid: true };
      if (mode === 'replace') this.db.words[lessonId] = [];
      const map = new Map((this.db.words[lessonId] || []).map(w => [w.id, w]));
      for (const raw of arr) {
        if (!validateWord(raw).ok) { stats.skipped++; continue; }
        const incomingId = raw?.id ? String(raw.id) : '';
        if (incomingId && map.has(incomingId)) {
          Object.assign(map.get(incomingId), normalizeWord({ ...raw, id: incomingId }));
          stats.updated++;
        } else {
          const w = normalizeWord(raw);
          w.id = uid('w');
          map.set(w.id, w);
          stats.added++;
        }
      }
      this.db.words[lessonId] = Array.from(map.values());
      this.save();
      return stats;
    },

    // ---- questions ----
    questions() { return (this.db?.questions || []).slice(); },
    upsertQuestions(list) {
      const map = new Map(this.questions().map(q => [q.id, q]));
      let added = 0, updated = 0;
      for (const q of list) {
        const id = q.id || uid('q');
        const item = { ...q, id };
        if (map.has(id)) { map.set(id, item); updated++; } else { map.set(id, item); added++; }
      }
      this.db.questions = Array.from(map.values());
      this.save();
      return { added, updated };
    },
    removeQuestions(ids) {
      const set = new Set(ids);
      const before = this.db.questions.length;
      this.db.questions = this.db.questions.filter(q => !set.has(q.id));
      this.save();
      return before - this.db.questions.length;
    },
    removeGeneratedForLessons(lessonIds) {
      const set = new Set(lessonIds);
      const before = this.db.questions.length;
      this.db.questions = this.db.questions.filter(q => !(q.source === 'generated' && set.has(q.lessonId)));
      this.save();
      return before - this.db.questions.length;
    },

    // ---- backup ----
    exportAll() {
      return JSON.stringify({
        kind: 'nihongo-backup', version: DB_VERSION, exportedAt: new Date().toISOString(),
        lessons: this.db.lessons, words: this.db.words, questions: this.db.questions,
      }, null, 2);
    },
    importAll(obj, mode = 'replace') {
      if (!obj || !Array.isArray(obj.lessons) || typeof obj.words !== 'object') return { invalid: true };
      if (mode === 'replace') {
        this.db.lessons = []; this.db.words = {}; this.db.questions = [];
      }
      const stats = { added: 0, updated: 0, skipped: 0 };
      const lessonIds = new Set(this.db.lessons.map(l => l.id));
      for (const l of obj.lessons) {
        if (!l?.id || !l?.name) { stats.skipped++; continue; }
        if (lessonIds.has(l.id)) {
          Object.assign(this.getLesson(l.id), { name: l.name, source: l.source || '', description: l.description || '' });
          stats.updated++;
        } else {
          this.db.lessons.push({ id: String(l.id), name: String(l.name), source: String(l.source || ''), description: String(l.description || ''), createdAt: l.createdAt || new Date().toISOString() });
          lessonIds.add(l.id);
          stats.added++;
        }
        const list = Array.isArray(obj.words[l.id]) ? obj.words[l.id] : [];
        const r = this.importWords(l.id, list, 'merge');
        stats.added += r.added; stats.updated += r.updated; stats.skipped += r.skipped;
      }
      if (Array.isArray(obj.questions)) {
        const r = this.upsertQuestions(obj.questions);
        stats.added += r.added; stats.updated += r.updated;
      }
      this.save();
      return stats;
    },
  };

  /* ---------------- TTS ---------------- */
  const TTS = {
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    voices: { ja: null, vi: null },
    _onChange: null,
    init(onChange) {
      this._onChange = onChange || null;
      if (!this.supported) { this._notify(); return; }
      this.pick();
      try {
        const pick = () => this.pick();
        if (typeof speechSynthesis.addEventListener === 'function') speechSynthesis.addEventListener('voiceschanged', pick);
        else speechSynthesis.onvoiceschanged = pick;
      } catch { /* older engines */ }
    },
    // Quét lại danh sách giọng (gói Speech cài sau khi mở trang vẫn bắt được khi browser refresh list)
    pick() {
      if (!this.supported) { this._notify(); return this.voices; }
      const vs = speechSynthesis.getVoices() || [];
      this.voices.ja = vs.find(v => /^ja/i.test(v.lang)) || null;
      this.voices.vi = vs.find(v => /^vi/i.test(v.lang)) || null;
      this._notify();
      return this.voices;
    },
    _notify() { if (this._onChange) this._onChange(this.voices); },
    list() {
      if (!this.supported) return [];
      try {
        return (speechSynthesis.getVoices() || []).map(v => ({ name: v.name, lang: v.lang, local: !!v.localService }));
      } catch { return []; }
    },
    // resolve: 'end' | 'canceled' | 'error' | 'timeout' | 'unsupported' | 'empty'
    speak(text, opts = {}) {
      const lang = opts.lang === 'vi' ? 'vi' : 'ja';
      const rate = Number(opts.rate) || 1;
      return new Promise(resolve => {
        const clean = String(text ?? '').trim();
        if (!this.supported) return resolve('unsupported');
        if (!clean) return resolve('empty');
        try { speechSynthesis.cancel(); } catch { /* noop */ }
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = lang === 'vi' ? 'vi-VN' : 'ja-JP';
        const v = this.voices[lang];
        if (v) u.voice = v;
        u.rate = rate;
        let done = false, timer = 0;
        const finish = r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
        u.onend = () => finish('end');
        u.onerror = e => finish(e && e.error === 'canceled' ? 'canceled' : 'error');
        // Fail-safe: engine câm (không fire event) → ước lượng thời lượng để không treo player
        const est = Math.min(30000, Math.max(1500, clean.length * 340 / rate + 800));
        timer = setTimeout(() => finish('timeout'), est);
        try { speechSynthesis.speak(u); } catch { finish('error'); }
      });
    },
    cancelAll() { if (this.supported) { try { speechSynthesis.cancel(); } catch { /* noop */ } } },
  };

  /* ---------------- Toast ---------------- */
  function toast(msg, type = 'info', ms = 3200) {
    let wrap = $('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<span>${esc(msg)}</span><button class="toast-x" aria-label="${esc(t('ui.close'))}">✕</button>`;
    el.querySelector('.toast-x').addEventListener('click', () => el.remove());
    wrap.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  /* ---------------- Chrome: header / footer / theme ---------------- */
  const NAV = [
    { href: './index.html', key: 'nav.learn', id: 'learn' },
    { href: './quiz.html', key: 'nav.quiz', id: 'quiz' },
    { href: './dictionary.html', key: 'nav.dict', id: 'dict' },
  ];

  function updateThemeBtn() {
    const btn = $('.theme-btn');
    if (!btn) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', t('nav.theme'));
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* noop */ }
    updateThemeBtn();
  }

  function renderChrome() {
    const active = document.body.dataset.page || '';
    const header = $('.site-header');
    if (header) {
      header.innerHTML = `
        <div class="container header-inner">
          <a class="brand" href="./index.html" aria-label="Nihongo N5">
            <span class="brand-jp jp">日本語</span><span class="brand-sub">N5 Trainer</span>
          </a>
          <nav class="tabs" aria-label="Điều hướng">
            ${NAV.map(n => `<a class="tab" href="${n.href}" ${n.id === active ? 'aria-current="page"' : ''}>${esc(t(n.key))}</a>`).join('')}
          </nav>
          <button class="theme-btn" type="button">🌙</button>
        </div>`;
      $('.theme-btn', header).addEventListener('click', toggleTheme);
      updateThemeBtn();
    }
    const footer = $('.site-footer');
    if (footer) {
      footer.innerHTML = `
        <div class="container">
          <span>${esc(t('footer.note'))}</span>
          <span class="small">${esc(t('footer.made'))} · <a href="../index.html">${esc(t('nav.status'))}</a></span>
        </div>`;
    }
    applyI18n();
  }

  /* ---------------- UI state (nhớ lựa chọn) ---------------- */
  const UI = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(UI_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return key in obj ? obj[key] : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        const raw = localStorage.getItem(UI_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[key] = value;
        localStorage.setItem(UI_KEY, JSON.stringify(obj));
      } catch { /* noop */ }
    },
  };

  /* ---------------- boot ---------------- */
  function boot(fn) {
    const run = () => {
      renderChrome();
      try { fn && fn(); } catch (e) { console.error('[nihongo] boot error:', e); toast(String(e && e.message || e), 'error'); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }

  // Boot chuẩn cho mọi trang: khởi tạo store (seed) → banner nếu seed fail → init page.
  async function bootWithStore(fn) {
    boot(async () => {
      const ok = await Store.init();
      if (!ok) {
        const banner = document.createElement('p');
        banner.className = 'banner';
        banner.textContent = t('ui.seedFail');
        (document.getElementById('main') || document.body).prepend(banner);
      }
      fn();
    });
  }

  window.JPCore = {
    $, $$, dirBase, fetchJSON, uid, shuffle, hashStr, mulberry32, esc, deaccent, download, debounce,
    t, applyI18n, STR, Store, TTS, toast, renderChrome, toggleTheme, openDialog: dlg => { try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); } },
    UI, boot, bootWithStore, THEME_KEY, UI_KEY, DB_KEY: KEY,
  };
})();
