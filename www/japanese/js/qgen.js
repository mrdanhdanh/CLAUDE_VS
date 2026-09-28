/* =============================================================
   Nihongo N5 — Question Generator (skill in-site, deterministic)
   Sinh câu hỏi từ từ vựng: kanji→nghĩa, nghĩa→kanji, kana→kanji, điền mẫu câu.
   ID tất định: gen-<lessonId>-<wordId>-<type> → sinh lại = cập nhật, không nhân đôi.
   ============================================================= */
(() => {
  'use strict';
  const { hashStr, mulberry32, shuffle, t } = window.JPCore;

  const TYPES = ['kanji-meaning', 'meaning-kanji', 'reading', 'cloze'];
  const MAX_OPTIONS = 4;

  function surface(w) { return (w.kanji || w.kana || '').trim(); }

  function eligible(w, type) {
    if (!w) return false;
    if (type === 'kanji-meaning' || type === 'meaning-kanji') return !!(surface(w) && w.vi);
    if (type === 'reading') return !!(w.kanji && w.kana);
    if (type === 'cloze') {
      return !!((w.kanji || w.kana) && (w.examples || []).some(ex => ex.jp && ex.jp.includes(w.kanji || w.kana)));
    }
    return false;
  }

  function pickDistractors(correct, values, rnd, n) {
    const uniq = [...new Set(values.filter(v => v && v !== correct))];
    return shuffle(uniq, rnd).slice(0, n);
  }

  function makeQuestion(base, correct, opts, rnd, prompt, question, explanation) {
    if (opts.length < 2) return null; // không đủ để tạo MCQ
    const shuffled = shuffle(opts, rnd);
    return {
      ...base, type: 'mcq', prompt, question,
      options: shuffled, answer: shuffled.indexOf(correct), explanation,
    };
  }

  function build(type, item, poolWords) {
    const w = item.word;
    const rnd = mulberry32(hashStr(`${item.lessonId}:${w.id}:${type}`));
    const base = {
      id: `gen-${item.lessonId}-${w.id}-${type}`,
      source: 'generated', kind: type, level: 'N5', year: '', section: 'Tự sinh',
      lessonId: item.lessonId, wordId: w.id,
    };
    const n = MAX_OPTIONS - 1;

    if (type === 'kanji-meaning') {
      const correct = w.vi;
      const opts = [correct, ...pickDistractors(correct, poolWords.map(x => x.vi), rnd, n)];
      return makeQuestion(base, correct, opts, rnd, t('gen.instrMeaning'), surface(w), `${surface(w)}（${w.kana}）: ${w.vi}`);
    }
    if (type === 'meaning-kanji') {
      const correct = surface(w);
      const opts = [correct, ...pickDistractors(correct, poolWords.map(surface), rnd, n)];
      return makeQuestion(base, correct, opts, rnd, t('gen.instrReverse'), w.vi, `${w.vi} → ${surface(w)}（${w.kana}）`);
    }
    if (type === 'reading') {
      const correct = w.kanji;
      const opts = [correct, ...pickDistractors(correct, poolWords.map(x => x.kanji), rnd, n)];
      return makeQuestion(base, correct, opts, rnd, t('gen.instrReading'), w.kana, `${w.kana} → ${w.kanji}: ${w.vi}`);
    }
    if (type === 'cloze') {
      const s = w.kanji || w.kana;
      const ex = (w.examples || []).find(e => e.jp && e.jp.includes(s));
      if (!ex) return null;
      const target = (w.kanji && ex.jp.includes(w.kanji)) ? w.kanji : w.kana;
      const question = ex.jp.replace(target, t('gen.blanks'));
      const correct = target;
      const opts = [correct, ...pickDistractors(correct, poolWords.map(x => x.kanji || x.kana), rnd, n)];
      const explanation = `${ex.jp}${ex.vi ? ' — ' + ex.vi : ''}`;
      return makeQuestion(base, correct, opts, rnd, t('gen.instrCloze'), question, explanation);
    }
    return null;
  }

  // items: [{ word, lessonId }] · types: subset of TYPES · perType: số câu tối đa mỗi loại
  function generate(items, opts = {}) {
    const types = Array.isArray(opts.types) ? opts.types : TYPES;
    const perType = Math.max(1, Math.min(50, Number(opts.perType) || 5));
    const poolWords = items.map(i => i.word);
    const out = [];
    for (const type of TYPES) {
      if (!types.includes(type)) continue;
      const candidates = items.filter(i => eligible(i.word, type));
      const rnd = mulberry32(hashStr('order:' + type));
      const picked = shuffle(candidates, rnd).slice(0, perType);
      for (const item of picked) {
        const q = build(type, item, poolWords);
        if (q) out.push(q);
      }
    }
    return out;
  }

  // Dùng chung cho import (tab Ngân hàng) — rule: id, question, 2-4 options không trùng, answer trong range
  function validateQuestion(q) {
    const errors = [];
    if (!q || typeof q !== 'object') return { ok: false, errors: ['not-object'] };
    if (!q.id) errors.push('missing-id');
    if (!q.question) errors.push('missing-question');
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) errors.push('options-2-4');
    else {
      if (new Set(q.options.map(String)).size !== q.options.length) errors.push('duplicate-options');
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)) errors.push('answer-out-of-range');
    }
    return { ok: errors.length === 0, errors };
  }

  window.JPGen = { TYPES, generate, validateQuestion, eligible, surface };
})();
