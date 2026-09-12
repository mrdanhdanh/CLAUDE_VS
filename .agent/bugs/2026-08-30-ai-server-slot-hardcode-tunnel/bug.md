# Bug: Slot máy chủ AI không hoạt động — hardcode localhost dev tunnel trong app released

> ♻️ **Retrofit 2026-09-12** — record chuẩn hóa từ `docs/knowleged.md` KN-009 (bug dir chưa từng được tạo; KN tự ghi "cần bổ sung qua auto-learn log"). Không reproduce trực tiếp được nữa: bản N5Blazor hiện tại không còn tính năng AI-slot — verify 2026-09-12: grep `localhost|5050` trong `N5Blazor/**` (bỏ bin/obj/publish) → 0 hit.

## Meta

- **Slug:** `2026-08-30-ai-server-slot-hardcode-tunnel`
- **Ngày:** 2026-08-30
- **Severity:** `critical`
- **Reporter:** YUNIE / harness
- **Related KN:** `KN-009`
- **Tags:** `config` `api` `build` `dx`
- **Status:** `fixed`

---

## 1. Reproduce (historical)

**Steps:**
1. Publish app ra máy khác / môi trường thật rồi dùng slot máy chủ AI.
2. → App vẫn gọi `http://localhost:5050` (dev tunnel) → slot không hoạt động.
3. Dev chạy server local thì "chạy tốt" — bug chỉ lộ khi rời máy dev.

**Expected vs Actual:**
- **Expected:** Server URL đọc từ runtime config (env/user-secrets), đúng trên mọi máy.
- **Actual:** URL dev tunnel hardcode trong `appsettings.json` + `Program.cs` → build-time config gắn vào binary → publish sang máy khác là sai value vĩnh viễn.

**Evidence:**
- Nguồn chính: `docs/knowleged.md` KN-009 (symptom + root cause + fix).
- Verify hiện trạng 2026-09-12: `N5Blazor/appsettings.json` + `Program.cs` không còn `localhost|5050`; tính năng AI-slot đã được bỏ khỏi bản app hiện tại.

**Environment:**
- Branch: `main` · App: N5Blazor (bản có AI-slot, trước tái cấu trúc) · OS: Windows

---

## 2. Root Cause (5 Whys)

- **File:Line:** `N5Blazor/appsettings.json` + `N5Blazor/Program.cs` (bản cũ — không còn trong repo)
- **Why 1:** App deployed gọi `localhost:5050` → slot chết.
- **Why 2:** URL gắn cứng trong build-time config → không override được khi deploy.
- **Why 3:** Chỉ test local nên "chạy tốt" — bug chỉ lộ khi rời máy dev (fresh eyes — KN-005).
- **Why 4:** Không có quy ước 3 tầng config (code default / user-secrets + env / prod secret).
- **Why 5 (Root):** Build-time config chứa giá trị máy dev — thiếu runtime config + CI check cấm `localhost|http://` trong `appsettings*`.

---

## 3. Fix

- **Approach:** Bỏ tunnel URL khỏi repo. Server URL là **runtime config**: env `AI_SERVER_URL` / user-secrets (`dotnet user-secrets set AI_SERVER_URL http://localhost:5050`); `Program.cs` chỉ đọc config, không chứa giá trị máy dev.
- **Files Changed:** `N5Blazor/appsettings.json` + `N5Blazor/Program.cs` (bản cũ). Pattern chuẩn hóa được ghi vào skill `.github/skills/harness-build-config/` (chưng cất từ KN-009).
- **Fix Confidence:** `HIGH` (tại thời điểm fix — KN-009).

---

## 4. Prevention

- 3 tầng config: `appsettings.json` (default code, không secret) / `user-secrets` + env (máy dev) / Docker secret + CI (prod).
- CI check cấm `localhost|http://` trong `appsettings*`.
- Trước khi deploy, test bằng **release build ở máy khác** — fresh eyes (KN-005).
