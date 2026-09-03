# Plan v2: 10 Bài Thuật Toán — Nâng Cấp

## Context
- PRD: `.agent/plans/web-thuat-toan-v2/prd.md`
- Design: `.agent/plans/web-thuat-toan-v2/design.md`
- Stack: Vanilla HTML/CSS/JS (no build), single-page app
- Current: `www/web-thuat-toan/index.html` + `app.js` + `styles.css`

## Requirements
- Functional: 10 bài mới khó hơn, mỗi bài có đề bài + ví dụ + pseudocode + viz + controls + comparison
- Non-functional: Responsive 375/768/1280, a11y, animation 150-300ms, no deps

## Architecture
- Giữ shell: sidebar nav + main sections (10 sections, 1 active)
- Mỗi bài: IIFE module `initBaiXXX()` với DOM refs, state, render, handlers
- Shared utils: `parseNumbers`, `sleep`, `showError/clearError`, `switchBai`
- New shared: `createPresets`, `highlightPseudocode`, `renderComparison`

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `www/web-thuat-toan/index.html` | rewrite | 10 sections mới: header + đề bài + pseudocode + input + viz + stats + result + steps + comparison |
| `www/web-thuat-toan/styles.css` | rewrite | Design system v2 + pseudocode block + preset pills + DP table + water bars + heap/stack viz |
| `www/web-thuat-toan/app.js` | rewrite | 10 modules mới: Kadane, TopK, Rotated BS, QuickSort, Bounds, Container, Substring, NGE, Dijkstra, Knapsack |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| File quá lớn (app.js ~4000 dòng) | Chia IIFE rõ ràng, shared utils đầu file |
| Animation giật | Dùng transform/opacity, sleep 300-500ms |
| Responsive vỡ | Test 375/768/1280, flex-wrap, grid |

## Verification Steps
- [ ] `get_errors` pass
- [ ] Manual test 10 bài với preset + random + step + auto
- [ ] Visual check 375/768/1280
- [ ] Keyboard nav + aria

## Todos (for manage_todo_list)
1. Implement shell + shared utils + styles v2
2. Bài 001 Kadane + 002 TopK + 003 Rotated BS
3. Bài 004 QuickSort + 005 Bounds + 006 Container
4. Bài 007 Substring + 008 NGE + 009 Dijkstra + 010 Knapsack
5. Polish + Verify

---
*Plan v2 — Web Thuật Toán Nâng Cấp*
