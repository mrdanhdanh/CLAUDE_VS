# Plan — cosmos-p0-upgrade

- [ ] Gộp cosmos.html + index.html (Ladder nấc 2: reuse canonical, Entangled with: www/index.html, www/status.json, www/cosmos/slides.html)
- [ ] Nối Black Hole lab scale.json (Ladder nấc 4: native fetch, Entangled with: www/cosmos/scale.json, www/cosmos/scale.html)
- [ ] Thống nhất System Map 15 (Ladder nấc 1: YAGNI — chỉ sửa 1 dòng, Entangled with: .github/instructions/cosmic-quantum.instructions.md)
- [ ] Lịch sử S + Verify (Ladder nấc 3: stdlib node, Entangled with: .github/harness/scripts/cosmic-scale.mjs, www/cosmos/scale.html)

## Risks
- Redirect làm vỡ link cũ → giữ fallback link + test cả 2 URL
- fetch file:// fail → fallback S local, không block lab
- scale.json shape đổi → dashboard + lab đều guard `?.` + default
