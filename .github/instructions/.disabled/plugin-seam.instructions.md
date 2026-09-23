---
description: "Everything is a Plugin — capability seam (Service Definition / Provider / Consumer), ctx.effect, patch layers, events. Use when adding new capability, tool, service, extending harness, need plugin architecture, seam, Cordis."
applyTo: "**"
---

# Plugin Seam — Everything is a Plugin

> Inspired by **DeepSeek Harness (Cordis)** — *Everything is a Plugin*. Không có core đặc quyền: mọi capability đều là plugin mount bên cạnh, patch bằng layer.

## Khi nào áp dụng
- Thêm tool / service / capability mới
- Thêm provider cho seam đã có (`fs`, `llm`, `shell`, `web`, `tools`...)
- Cần isolate per-agent / per-profile / per-session
- Thay đổi `agent-loop` hoặc `session log`

## Quy tắc

1. **Seam = 3 vai đủ:** `Service Definition` (interface) + `Provider` (impl) + `Consumer` (tool/UI). Thiếu 1 vai = chưa đủ seam — không tạo seam nửa vời.
2. **Registrations are effects:** mọi `register()` qua `ctx.effect()` / `ctx.on()` và trả về `disposer` — unload phải unwind sạch, không leak.
3. **No privileged core:** không patch core trực tiếp — mount plugin bên cạnh, override bằng patch layer (`cordis.patch.yml` / `--patch`) thay thế row by `id`.
4. **Profile + Bundle layers (thứ tự):** `dsh-base` → `bundle` (web/headless/sdk) → `profile cordis.patch.yml` → `home` → `--patch`. Mỗi row có `id` để patch whole config.
5. **Events là extension points:** chọn đúng domain — `session/event` (durable, survive reload), `agent/*` (live, có `Agent`), `capability/*` (`fs/*`, `tools/*`). Waterfall phải `next()` để delegate, không short-circuit.
6. **Model-visible ⟺ logged:** cái gì lên model phải reconstruct được từ session log — thêm input mới = thêm `SessionEvent` + `deriveMessages()`.
7. **UI-visible ⟺ token:** cái gì nhìn thấy phải qua design token — không hardcode hex/px lẻ (xem `product-quality` §1).
8. **Explicit > implicit:** `resolve(request): Spec` rõ ràng, không `?? default` giấu trong `run()` (template: `dsh-shell` request/spec split).

## Ví dụ

```ts
// Service Definition
declare module 'cordis' { interface Context { myService: MyService } }
// Provider
ctx.effect(() => ctx.myService.register(myProvider))
// Consumer (tool)
ctx.tools.register({ name: 'my_tool', description: '...', handler: () => ctx.myService.doThing() })
```

```yaml
# cordis.patch.yml — override row by id
- id: myService:default
  config: { provider: 'myProvider', timeout: 5000 }
```

## Checklist (trước khi done)

- [ ] Đã định nghĩa đủ 3 vai (Definition / Provider / Consumer)?
- [ ] Đăng ký qua `ctx.effect()` có disposer?
- [ ] Có thể patch bằng `cordis.patch.yml` không (có `id`)?
- [ ] Event chọn đúng domain + waterfall có `next()`?
- [ ] Nếu model-visible → đã thêm SessionEvent?

> **Ref:** `deepseek-ai/deepseek-harness` — `docs/architecture.md` + `AGENTS.md` (Cordis, Capability seams, Session log)

---
*Harness v2 — Process > Model. Plugin seam pattern từ DeepSeek Harness.*
