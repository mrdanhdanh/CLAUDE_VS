# Plan — Clip Craft (skill + agent)

> Ngày: 2026-09-26 · Input: `prd.md` + `design.md` + `upgrade-ideas.md`

## Todos

1. ✅ Viết `upgrade-ideas.md` (audit + 22 ý tưởng, có nguồn) — **done**
2. ✅ PRD/Design/Plan mini — **done**
3. Viết skill staging `.agent/staging/clip-craft/`:
   - `SKILL.md` — 10 craft laws + craft order + checklist
   - `references/layout.md` — safe zone kép nguồn + lưới + type scale + motion + cover
   - `references/color.md` — role system + contrast nền động + semantic + 3 palette formula
   - `references/content.md` — hook triad + 4 template + retention benchmark + script math + CTA/publish
4. Viết agent staging `.agent/staging/clip-director.agent.md` (6 bước, output contract, constraints)
5. Install qua `harness-manager.mjs install skill|agent --local ... --force` + xoá staging + đồng bộ `skills/registry.json` v1 nếu cần
6. Cross-link `video-clip/SKILL.md` → `clip-craft` + `clip-director`; regenerate `www/status.json`
7. Verify: rubric C1–C5 + `get_errors` + báo cáo

## Acceptance checks

- [ ] `harness-manager.mjs status` hiện skill `clip-craft` + agent `clip-director` (enabled)
- [ ] Registry description = frontmatter description (không phải template)
- [ ] `grep -c "|" references/*.md` — có bảng ở cả 3 file; checklist cuối mỗi file
- [ ] Cross-link 2 chiều grep được
- [ ] Không file nào > 200 dòng (ngân sách context)
- [ ] Staging folder đã xoá (không duplicate)

## Rủi ro & đối sách

| Rủi ro | Đối sách |
|---|---|
| Số liệu nền tảng lỗi thời | Ghi ngày + link + rule re-verify trong chính reference |
| Skill mới không được load do description kém | Description keyword-rich + verify bằng `list` |
| Install local từ chính dest (tự xoá nguồn) | Dùng staging riêng, không install tại chỗ (đã đọc code: `prepareSkillDest(force)` xoá dest trước khi copy) |
