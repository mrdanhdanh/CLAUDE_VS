import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Guard cho bug 2026-09-24-ai-news-lot-tin-lon-do-recency-only-ranking:
 * ranking date-desc thuần để 1 ngày "lũ" tin đè hết slot → tin lớn (718 pts) ngày trước lọt feed.
 * Fix: cap 5 tin/ngày trong fetch.mjs. Invariant dưới đây đọc artifact tĩnh — chạy được
 * không cần fetch (CI vẫn giữ lưới khi ai đó bỏ cap).
 *
 * Lưu ý: nếu feed chỉ trải < 3 ngày (nguồn mỏng), cap không đảm bảo được → skip có chủ đích.
 */
const feed = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'www', 'ai-news', 'ai-news.json'), 'utf8')
);

test.describe('AI News — feed ranking guard', () => {
  test('không ngày nào chiếm hơn 5/15 slot khi feed trải ≥3 ngày', () => {
    const byDate = {};
    for (const a of feed.articles) byDate[a.date] = (byDate[a.date] || 0) + 1;
    const distinctDates = Object.keys(byDate).length;
    test.skip(distinctDates < 3, `chỉ ${distinctDates} ngày có tin — cap không áp dụng`);
    for (const [date, count] of Object.entries(byDate)) {
      expect(count, `${date} chiếm ${count} slot (max 5)`).toBeLessThanOrEqual(5);
    }
  });

  test('feed không rỗng và mọi bài có sourceUrl hợp lệ', () => {
    expect(feed.articles.length).toBeGreaterThan(0);
    for (const a of feed.articles) {
      expect(a.id, 'thiếu id').toBeTruthy();
      expect(a.sourceUrl, `${a.id} thiếu sourceUrl`).toMatch(/^https?:\/\//);
    }
  });
});
