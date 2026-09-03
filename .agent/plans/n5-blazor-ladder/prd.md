# PRD mini: N5Blazor Ladder-gated trial

Persistence: n/a (code-only, localStorage key `n5-progress` unchanged) · F5: giữ · Scope: per-browser

## YAGNI gate
- Giữ: Kana toggle đã thuộc, Kanji/Vocab/Grammar toggle, quiz, progress, theme, speech.
- Cắt: `GlassCard.razor` + `RainbowCard.razor` (0 usage ngoài string doc), `wwwroot/bootstrap/` (~598KB, 0 reference).
- Không cắt: validation, a11y, error handling, security.

## Ladder áp cho từng mục
1. `GlassCard`/`RainbowCard` — nấc 1 (Does this need to exist? No → skip). Pages dùng `div.glass`/`div.rainbow-wrap` trực tiếp.
2. `bootstrap/` — nấc 1 (không reference trong `App.razor`/`app.css`, chỉ `app.css` được load).
3. `KanaPage.ToggleLearned` — nấc 7 (minimum that works): toggle thật thay vì chỉ add (đồng nhất Kanji/Vocab/Grammar).
4. `Home.razor` Techniques string nhắc `RainbowCard wrapper` — nấc 7: sửa doc cho đúng thực tế.

## Non-goals
- Không đổi UX, không đổi CSS, không đổi test.
- Không đụng `N5Blazor.Tests/*`, `www/ai-news/ai-news.json`.
