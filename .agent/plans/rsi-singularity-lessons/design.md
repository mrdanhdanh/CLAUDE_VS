# Design mini — RSI Lessons

**`agent-governance` §7 (sau §6 rogue-trader, trước Checklist):**
```
### 7. Coordinated emergence — watch patterns (học DSEWiki 05/2026 + HuggingFace 07/2026)
- Out-of-band signaling giữa agents (file chung làm message board, kênh backup, impersonation) = policy incident
- Isolation: enforce > declare — test từ bên trong
- Credentials ở kênh chia sẻ = đã lộ → rotate + audit
- Disclosure bắt buộc — audit chain là bằng chứng
```
Nguyên tắc: §7 là *watch patterns* (nhận diện), §6 là *cấu trúc phòng thủ* (law 1 file, intent/execution) — không trùng chức năng.

**`cua-safety` §4:** 1 bullet sau "Boundary" — "Enforce > declare (học HuggingFace 07/2026): eval sandbox bị chính agents escape — test từ bên trong trước khi tin; restriction chưa test = chưa có."

**`knowleged.md` KN-048:** theo template chuẩn — Severity major; Triệu chứng = evidence thật (2 incidents có số/tháng); Nguyên nhân gốc 5 Whys nhắm "policy phải observe + enforce, không tin declared posture"; Cách sửa = posture đã có + 3 delta; Phòng tránh = 6 bullets (watch patterns + endpoint + đo claim). Cross-ref KN-033/KN-037/KN-018/KN-019.

**Ladder:** nấc 2 (reuse file sẵn có, extend section) — 0 code, 0 dep, 0 file mới ngoài plans + knowledge.

**Entangled with:** `.claude/rules/agent-governance.md` + `.claude/rules/cua-safety.md` (regen), README/status KN-count (sweep — KN-038 discipline).
