# Design: WEB 011 Part 4 — MEDIA + FILE + STORAGE + NETWORK

> Design system kế thừa Part 1-3 + wireframe cho 4 labs.

## 1. Design System (kế thừa)

### Palette / Typography / Spacing
- Dùng `css/base.css` variables: `--bg, --surface, --surface-2, --border, --text, --primary, --success, --danger, --warning`
- Typography: `Inter` + `JetBrains Mono`
- Spacing 4/8, radius 8/12/16

### Module-specific tokens
```css
--media-bg: #0f172a;
--media-accent: #6366f1;
--file-drop: rgba(99,102,241,.08);
--file-drop-active: rgba(99,102,241,.15);
--storage-ok: #10b981;
--network-method-get: #10b981;
--network-method-post: #6366f1;
--network-method-delete: #ef4444;
```

## 2. Wireframe

### Media Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Tabs: [Audio] [Video] [Camera] [Mic] [Recorder]         │
├─────────────────────────────────────────────────────────┤
│ Audio: [▶] ──●──  Vol ●  Rate 1x  [Playlist]            │
│        Waveform canvas                                  │
│ Video: <video>  [Speed] [Fullscreen] [PiP]              │
│ Camera: <video preview>  [Capture] [Switch]             │
│ Mic: Level ██████░░  [Record] [Playback]                │
│ Recorder: [Start] [Pause] [Stop]  Preview + Export      │
└─────────────────────────────────────────────────────────┘
```

### File Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ [Pick File] [Pick Multiple] [Pick Folder]  Drop zone    │
│ ┌──────────────────┐ ┌──────────────────────────────┐  │
│ │ File list        │ │ Preview (image/audio/video/  │  │
│ │ - photo.jpg 2MB  │ │ text/json/csv) + metadata    │  │
│ │ - data.csv 12KB  │ │ name/size/type/lastModified  │  │
│ └──────────────────┘ └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Storage Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Tabs: [LocalStorage] [SessionStorage] [IndexedDB]       │
│ LocalStorage: [Key] [Value] [Set]  Table + Clear        │
│ IndexedDB: DB [myDB] [Create]  Stores: [users] [Add]    │
│            CRUD table + Search + Import/Export          │
└─────────────────────────────────────────────────────────┘
```

### Network Lab — Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Tabs: [Fetch] [WebSocket] [Streaming]                   │
│ Fetch: [GET] [URL] [Headers] [Body] [Query] [Send]      │
│        Request Inspector + Response (status/time/size)  │
│ WS: [URL] [Connect] [Send]  History + State             │
│ Stream: [URL] [Start]  Chunks + Progress                │
└─────────────────────────────────────────────────────────┘
```

### Mobile 375
- Media: tabs wrap, controls stack, canvas full-width
- File: list + preview stack, drop zone full-width
- Storage: tabs wrap, table scroll, CRUD stack
- Network: inputs stack, inspector stack

## 3. Component Inventory

| Component | States | Notes |
|-----------|--------|-------|
| Media tabs | default/active | segmented, active primary |
| Audio player | play/pause/seek | range, volume, rate, waveform canvas |
| Video player | play/pause/fullscreen/PiP | native video + controls |
| Camera preview | idle/preview/captured | video + canvas capture |
| Mic meter | idle/recording | canvas level, record/playback |
| Recorder | idle/recording/paused | getDisplayMedia, preview, export |
| File drop zone | idle/dragover | dashed border, active bg |
| File list | default/selected | name/size/type, click preview |
| File preview | image/audio/video/text/json/csv | per-type renderer |
| Storage table | default/empty | key/value, edit/delete |
| IndexedDB explorer | default | DB/stores/CRUD/search |
| Fetch form | default/loading/error | method/URL/headers/body/query |
| Request inspector | — | request/response, status/time/size |
| WebSocket | disconnected/connecting/connected | state badge, history |
| Streaming | idle/streaming/done | chunks, progress |

## 4. Architecture

### Media Lab
- Audio: `<audio>` + Web Audio `AnalyserNode` for waveform (canvas), playlist array, localStorage
- Video: `<video>` + subtitle track, `requestFullscreen`, `requestPictureInPicture` if supported
- Camera: `navigator.mediaDevices.getUserMedia({video:true})`, `enumerateDevices` for switch, capture via canvas `drawImage`
- Mic: `getUserMedia({audio:true})`, Analyser for level, `MediaRecorder` for record, playback via `<audio>`
- Recorder: `navigator.mediaDevices.getDisplayMedia({video:true, audio:true})`, MediaRecorder, preview, export Blob
- Cleanup: stop tracks on unmount/pause

### File Lab
- Picker: `<input type="file">`, `multiple`, `webkitdirectory` for folder
- Drag&drop: `dragover`/`drop` + `DataTransfer.files`
- Preview: per-type — image (`<img>`), audio (`<audio>`), video (`<video>`), text (`<pre>`), json (tree), csv (table)
- Metadata: `file.name/size/type/lastModified`
- Save: `showSaveFilePicker` if available, else Blob download
- In-memory file list, no real FS write without permission

### Storage Lab
- LocalStorage: `localStorage.setItem/getItem/removeItem/clear`, table, search
- SessionStorage: same with `sessionStorage`
- IndexedDB: `indexedDB.open`, `createObjectStore`, `transaction`, `put/get/delete/getAll`, `createIndex`, search via cursor, import/export JSON
- Usage: `navigator.storage.estimate()` if available

### Network Lab
- Fetch: `fetch(url, {method, headers, body})`, `AbortController` for abort/timeout, retry loop, timing via `performance.now()`
- Inspector: show request (method/URL/headers/body) + response (status/time/size/headers/body)
- WebSocket: `new WebSocket(url)`, `onopen/onmessage/onclose/onerror`, history, state
- Streaming: `fetch(url).then(r=>r.body.getReader())`, read chunks, progress, decode via `TextDecoder`

## 5. UX States

| View | Loading | Empty | Error | Success |
|------|---------|-------|-------|---------|
| Media | — | "No media" | "Permission denied" | player/preview |
| File | — | "Drop files here" | "File too large" | list + preview |
| Storage | — | "No keys" | "IndexedDB blocked" | table |
| Network | "Sending…" | "Enter URL" | "CORS/Network error" | response |

## 6. Animation
- Waveform: rAF 60fps, pause on unmount
- File drop: 150ms border transition
- Respect `prefers-reduced-motion`

## 7. A11y
- Tabs: `role="tablist"`, `aria-selected`
- Players: `aria-label`, keyboard
- Drop zone: `role="region" aria-label`
- Tables: semantic `table/th/td`

## 8. File Map (Part 4)
```
www/web-universe/js/modules/audio-lab/index.js
www/web-universe/js/modules/file-lab/index.js
www/web-universe/js/modules/storage-lab/index.js
www/web-universe/js/modules/network-lab/index.js
www/web-universe/css/modules.css (append)
```

---
*Generated by YUNIE — Harness v2 Design Phase — Part 4 Media/File/Storage/Network*
