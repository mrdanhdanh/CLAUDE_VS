# PRD: WEB 011 Part 4 — MEDIA + FILE + STORAGE + NETWORK

> Part 4 của THE ULTIMATE WEB UNIVERSE — hoàn thiện Media Lab + File System Lab + Storage Lab + Network Lab.

## 1. Vision
- **One-liner:** Media + File + Storage + Network đầy đủ — audio/video/camera/mic/recorder, file picker/drag-drop/preview, storage explorer, fetch/websocket/streaming — tất cả capability-aware, permission-gated, không giả lập.
- **Problem:** Part 1-3 mới có Text + Graphics; thiếu Media (§7), File (§8), Storage (§9), Network (§10) — chưa đủ Web Platform coverage.
- **Target User:** Dev / người chấm — mở từng lab, thấy player/preview/storage/network hoạt động thật, permission được hỏi, offline handling đúng.
- **Persistence:** `localStorage: web-universe:audio-lab, web-universe:file-lab, web-universe:storage-lab, web-universe:network-lab` + IndexedDB `web-universe-db` · **F5: giữ** · **Scope: per-browser**.

## 2. User Stories
| ID | As a ... | I want ... | So that ... | Priority |
|----|----------|------------|-------------|----------|
| US-01 | User | Mở Media Lab → tab Audio: playlist, volume, seek, playbackRate, waveform | Nghe audio + visualizer | P0 |
| US-02 | User | Tab Video: video player với subtitle, speed, fullscreen, PiP | Xem video | P0 |
| US-03 | User | Tab Camera: preview, capture frame, switch camera | Dùng camera | P0 |
| US-04 | User | Tab Microphone: level meter, record, playback | Dùng mic | P0 |
| US-05 | User | Tab Recorder: screen capture + audio, start/pause/stop, preview, export | Ghi màn hình | P0 |
| US-06 | User | Mở File Lab → picker, drag&drop, folder picker, preview (image/audio/video/text/json/csv), metadata, save | Quản lý file | P0 |
| US-07 | User | Mở Storage Lab → LocalStorage/SessionStorage CRUD + IndexedDB explorer (DB/stores/CRUD/search/import/export) | Quản lý storage | P0 |
| US-08 | User | Mở Network Lab → Fetch (GET/POST/PUT/PATCH/DELETE, headers/body/query, abort/timeout/retry) + Request Inspector + WebSocket + Streaming | Test network | P0 |
| US-09 | User | Thấy permission status + capability detection (✓/⚠/✗) cho mỗi API | Biết browser hỗ trợ gì | P0 |
| US-10 | User | F5 vẫn giữ storage data + network history | Không mất việc | P1 |

## 3. Scope

### In Scope (P0 — phải có)
- [x] **Media Lab (audio-lab):** 5 tabs — Audio (player, playlist, volume, seek, rate, waveform via Web Audio Analyser), Video (player, subtitle, speed, fullscreen, PiP), Camera (getUserMedia video, capture canvas, switch device), Microphone (getUserMedia audio, level meter via Analyser, record via MediaRecorder, playback), Recorder (getDisplayMedia, start/pause/resume/stop, preview, export webm)
- [x] **File Lab:** file picker, multiple, drag&drop, folder picker (webkitdirectory), preview (image/audio/video/text/json/csv), metadata (name/size/type/lastModified), rename/delete UI (in-memory), save via File System Access API if supported
- [x] **Storage Lab:** LocalStorage (set/get/update/delete/clear, table), SessionStorage (same), IndexedDB (DB explorer: create DB, object stores, CRUD, index, search, import/export JSON)
- [x] **Network Lab:** Fetch (method, URL, headers, body, query params, abort, timeout, retry) + Request Inspector (request/response, status/time/size) + WebSocket (connect/disconnect/send/receive/history/state) + Streaming (fetch stream, read chunks, progress)
- [x] Capability detection + permission handling (không giả lập)
- [x] Catalog: 4 stubs → real (audio-lab, file-lab, storage-lab, network-lab), lazy-load
- [x] Persist + responsive + a11y + theme

### Nice to Have (P1)
- [x] Media: audio visualizer canvas, video PiP button
- [x] File: CSV table preview, JSON tree
- [x] Storage: storage usage estimate
- [x] Network: curl export, history

### Non-Goals (Out of Scope — để Part 5+)
- Không làm Concurrency/Worker/PWA/Device/Audio Engine/Game/Data/Viz (Part 5-6)
- Không làm full File System Access write without permission — chỉ khi browser hỗ trợ
- Không làm WebSocket server — chỉ client (echo server wss://echo.websocket.org hoặc wss://ws.postman-echo.com)

## 4. Success Metrics
- M1: Media Audio → play/pause/seek/volume/rate hoạt động, waveform hiện
- M2: Media Camera → preview hiện, capture lưu frame, switch camera nếu có 2+
- M3: Media Mic → level meter nhảy, record → playback được
- M4: Media Recorder → screen capture hoạt động (nếu browser hỗ trợ), export webm
- M5: File Lab → drag file → preview + metadata đúng, folder picker nếu hỗ trợ
- M6: Storage Lab → LocalStorage CRUD hoạt động, IndexedDB create/store/CRUD/search
- M7: Network Lab → Fetch GET/POST hoạt động, WebSocket connect/send/receive, Streaming chunks
- M8: Capability: API không hỗ trợ hiện ✗, permission hiện đúng, không fake
- M9: F5 persist, Network lazy-load

## 5. Edge Cases & Constraints
- EC1: Camera/Mic permission denied → hiện lỗi + hướng dẫn, không crash
- EC2: getDisplayMedia không hỗ trợ → hiện NOT SUPPORTED
- EC3: File quá lớn (>50MB) → cảnh báo, không đọc hết vào memory
- EC4: IndexedDB blocked → fallback message
- EC5: Fetch CORS fail → hiện error status, không fake success
- EC6: WebSocket URL invalid → error state
- EC7: Offline → Network Lab hiện 🔴, Media/File/Storage vẫn chạy
- Constraint: Vanilla JS, capability detection `in` checks, permission via Permissions API, cleanup streams/tracks on unmount

## 6. Dependencies
- Không thêm npm dep — vanilla + Web APIs
- Dùng Core Runtime Part 1

## 7. Open Questions → Assumptions
- Q: Media files? A: Dùng sample URLs (public) + user file picker, không bundle media
- Q: WebSocket echo? A: `wss://echo.websocket.org` hoặc `wss://ws.postman-echo.com/raw` — fallback to manual URL input
- Q: File save? A: `showSaveFilePicker` nếu hỗ trợ, else download via Blob URL

---
*Generated by YUNIE — Harness v2 PRD Phase — Part 4 Media/File/Storage/Network*
