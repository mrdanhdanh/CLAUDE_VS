# WEB 011 — THE ULTIMATE WEB UNIVERSE

> **Mục tiêu:** Xây dựng một siêu ứng dụng web dạng modular, mô phỏng một “hệ điều hành trong trình duyệt”, dùng để trình diễn và thực hành càng nhiều khả năng của Web Platform càng tốt.
>
> **Nguyên tắc cốt lõi:** Có thể bật rất nhiều tính năng, nhưng không được để tất cả tính năng chạy cùng lúc. Module phải được lazy-load, có lifecycle, có khả năng ngủ/tạm dừng và giải phóng tài nguyên khi không sử dụng.

---

## 1. Tổng quan

### 1.1. Tên bài

**WEB 011 — THE ULTIMATE WEB UNIVERSE**

### 1.2. Loại bài

- Project tổng hợp cấp độ Hard / Final Project.
- Không phải một trang landing page.
- Không phải một dashboard CRUD đơn giản.
- Là một **modular web application / browser playground**.
- Mỗi nhóm tính năng phải được đóng gói thành module độc lập.

### 1.3. Mục tiêu học tập

Sau khi hoàn thành, người học phải hiểu và thực hành được:

- Kiến trúc ứng dụng web lớn.
- Module hóa JavaScript.
- Dynamic `import()`.
- Lazy loading / code splitting.
- Web Components hoặc cơ chế component tương đương.
- Quản lý lifecycle.
- Quản lý state.
- Event management.
- Canvas / SVG / WebGL.
- Audio / Video APIs.
- File APIs.
- Storage APIs.
- IndexedDB.
- Network APIs.
- Web Workers.
- Service Workers.
- PWA / offline.
- Browser capabilities và permission.
- Performance monitoring.
- Resource management.
- Dependency management.
- Error isolation.
- Workspace persistence.
- Plugin architecture.
- Responsive UI.
- Accessibility.
- Progressive enhancement.

---

# 2. Tư tưởng thiết kế

Website phải hoạt động theo mô hình:

```text
                    WEB UNIVERSE
                         │
                 ┌───────┴───────┐
                 │  Core Runtime │
                 └───────┬───────┘
                         │
                  Module Manager
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
    Modules           Workers          Sandboxes
       │                 │                 │
       ▼                 ▼                 ▼
      DOM             CPU Tasks          iframe
```

Một module không được coi là một đoạn code rời rạc. Nó phải có:

```text
REGISTER
   ↓
LOAD
   ↓
MOUNT
   ↓
ACTIVE
   ↓
PAUSE
   ↓
SLEEP
   ↓
UNMOUNT
   ↓
DESTROY
```

---

# 3. Yêu cầu giao diện tổng thể

Giao diện phải mang cảm giác:

**Modern Developer OS / Browser Desktop / Web Laboratory**

## 3.1. Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ 🌐 WEB UNIVERSE   🔍 Search     CPU 32%  FPS 60  RAM 420MB    ⚙   │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│ 🏠 Home      │                WORKSPACE                            │
│ 📦 Modules   │                                                     │
│ ⭐ Favorites │       ┌──────────────┐  ┌──────────────┐            │
│ 🧪 Labs      │       │ Text Editor  │  │ Canvas Lab   │            │
│ 🎨 Graphics  │       │              │  │              │            │
│ 🎵 Media     │       └──────────────┘  └──────────────┘            │
│ 🌐 Network   │                                                     │
│ 💾 Storage   │       ┌──────────────┐  ┌──────────────┐            │
│ ⚡ Performance│      │ Data Lab     │  │ API Explorer │            │
│ ⚙ Settings  │       │              │  │              │            │
│              │       └──────────────┘  └──────────────┘            │
├──────────────┴─────────────────────────────────────────────────────┤
│ Modules: 12 active │ 19 loaded │ Workers: 4 │ FPS: 59.8 │ Online │
└────────────────────────────────────────────────────────────────────┘
```

## 3.2. Bắt buộc

- Sidebar.
- Top bar.
- Workspace.
- Window/card system.
- Status bar.
- Search.
- Command palette.
- Dark/light theme.
- Responsive mobile layout.
- Notification system.
- Modal/dialog.
- Context menu.
- Keyboard shortcuts.

---

# 4. CORE SYSTEM

## 4.1. App Runtime

Core chịu trách nhiệm:

- Khởi tạo ứng dụng.
- Đọc cấu hình.
- Khởi tạo Module Manager.
- Khởi tạo State Manager.
- Khởi tạo Event Bus.
- Khởi tạo Resource Manager.
- Khởi tạo Window Manager.
- Khởi tạo Permission Manager.
- Khởi tạo Error Manager.

## 4.2. Module Manager

Module Manager phải hỗ trợ:

```js
register(module)
load(name)
enable(name)
disable(name)
pause(name)
resume(name)
sleep(name)
unload(name)
restart(name)
get(name)
list()
```

Ví dụ:

```js
await moduleManager.enable("canvas-lab");
```

## 4.3. Module metadata

Mỗi module nên có metadata tương tự:

```js
{
  id: "canvas-lab",
  name: "Canvas Lab",
  version: "1.0.0",
  category: "graphics",
  description: "Canvas experimentation environment",
  dependencies: [],
  permissions: [],
  lazy: true
}
```

## 4.4. Lifecycle

Module tối thiểu phải có:

```js
export async function load() {}
export async function mount(container) {}
export async function pause() {}
export async function resume() {}
export async function unmount() {}
export async function destroy() {}
```

Không bắt buộc mọi module phải dùng đủ tất cả hook, nhưng Module Manager phải hỗ trợ lifecycle đầy đủ.

---

# 5. DANH SÁCH MODULE

Mục tiêu cuối cùng: **50–100 module hoặc mini-feature**, tùy mức hoàn thiện.

---

## 5.1. TEXT UNIVERSE

### Text Editor

- Plain text editor.
- Word counter.
- Character counter.
- Line counter.
- Autosave.
- Undo/redo.
- Find.
- Replace.
- Select all.
- Copy/paste.

### Markdown

- Markdown editor.
- Live preview.
- Heading navigation.
- Export HTML.
- Export Markdown.

### Code Playground

- HTML editor.
- CSS editor.
- JavaScript editor.
- Live preview.
- Console.
- Error display.
- Reset code.

### JSON

- JSON formatter.
- JSON minifier.
- JSON validator.
- Tree viewer.
- Search.
- Copy path.

### Diff

- Text diff.
- JSON diff.
- Side-by-side view.

---

# 6. GRAPHICS LAB

## 6.1. Canvas 2D

- Drawing.
- Shapes.
- Lines.
- Text.
- Gradients.
- Transform.
- Pixel manipulation.
- Image filters.
- Animation.
- Particle system.

## 6.2. SVG

- Circle.
- Rectangle.
- Path.
- Polygon.
- Text.
- Transform.
- Interactive SVG.
- SVG export.

## 6.3. WebGL

- Basic renderer.
- Triangle.
- Texture.
- Camera.
- 3D object.
- Lighting.
- Shader demo.

## 6.4. WebGPU

Nếu trình duyệt hỗ trợ:

- Adapter detection.
- Device detection.
- Basic compute/render demo.
- Capability display.

Nếu không hỗ trợ:

```text
WebGPU
⚠ NOT SUPPORTED
```

Không được giả lập kết quả như thể API đang chạy thật.

---

# 7. MEDIA LAB

## Audio

- Audio player.
- Playlist.
- Volume.
- Seek.
- Playback rate.
- Waveform.
- Visualizer.

## Video

- Video player.
- Subtitle support.
- Playback speed.
- Fullscreen.
- Picture-in-picture nếu hỗ trợ.

## Camera

- Camera preview.
- Capture frame.
- Camera switching nếu có nhiều camera.

## Microphone

- Microphone permission.
- Level meter.
- Recording.
- Playback.

## Screen Recorder

- Screen capture.
- Audio capture nếu browser hỗ trợ.
- Start.
- Pause.
- Resume.
- Stop.
- Preview.
- Export recording.

---

# 8. FILE SYSTEM LAB

Phải có:

- File picker.
- Multiple file picker.
- Drag & drop.
- Folder picker nếu hỗ trợ.
- File preview.
- Image preview.
- Audio preview.
- Video preview.
- Text preview.
- JSON preview.
- CSV preview.
- File metadata.
- Rename UI.
- Delete UI.
- Save file nếu hỗ trợ File System Access API.

Hiển thị:

```text
name
size
type
lastModified
```

---

# 9. STORAGE LAB

## LocalStorage

- Set.
- Get.
- Update.
- Delete.
- Clear.

## SessionStorage

- Set.
- Get.
- Delete.

## IndexedDB

Tạo giao diện database explorer:

```text
DATABASE
│
├── users
├── documents
├── settings
├── workspaces
└── snapshots
```

Hỗ trợ:

- Database creation.
- Object stores.
- CRUD.
- Index.
- Search.
- Transactions.
- Import.
- Export.

---

# 10. NETWORK LAB

## Fetch

- GET.
- POST.
- PUT.
- PATCH.
- DELETE.
- Headers.
- Body.
- Query params.
- AbortController.
- Timeout.
- Retry.

## Request Inspector

```text
REQUEST
────────────────────────
Method: GET
URL: /api/example
Headers: ...
Body: ...

[ SEND ]

RESPONSE
────────────────────────
Status: 200
Time: 132ms
Size: 4.2 KB
```

## WebSocket

- Connect.
- Disconnect.
- Send.
- Receive.
- Message history.
- Connection state.

## Streaming

- Stream response.
- Read chunks.
- Progress display.

---

# 11. CONCURRENCY LAB

Phải có:

- Web Worker.
- Worker pool.
- MessageChannel.
- BroadcastChannel.
- Shared Worker nếu hỗ trợ.
- SharedArrayBuffer nếu môi trường cho phép.
- Atomics nếu cần.

## Benchmark

So sánh:

```text
MAIN THREAD
████████████████████ 820ms

1 WORKER
██████               290ms

4 WORKERS
██                   110ms
```

Tác vụ benchmark có thể là:

- Prime numbers.
- Large array processing.
- Sorting.
- Matrix-like computation.
- Image/pixel processing.

---

# 12. SERVICE WORKER / PWA

Phải có:

- `manifest.webmanifest`.
- Service Worker.
- Cache API.
- Offline page.
- Offline asset caching.
- Online/offline indicator.
- Installable PWA.
- Update detection.

Khi offline:

```text
🔴 OFFLINE

Documents      ✓
Editor         ✓
Calculator     ✓
Saved data     ✓
Network API    ✗
```

---

# 13. DEVICE LAB

Thử nghiệm:

- Geolocation.
- Device Orientation.
- Device Motion.
- Vibration nếu hỗ trợ.
- Battery nếu hỗ trợ.
- Network Information nếu hỗ trợ.
- Screen information.
- Device pixel ratio.
- Clipboard.
- Web Share.
- Fullscreen.

Không được giả lập dữ liệu của API không được cấp quyền hoặc không được browser hỗ trợ.

---

# 14. AUDIO ENGINE

Dùng Web Audio API.

Phải có:

- Oscillator.
- Gain.
- Filter.
- Analyser.
- Frequency visualization.
- Waveform.
- Synthesizer.
- Simple drum machine.
- Sound effects.

Ví dụ:

```text
FREQUENCY ANALYZER

▂▅▇████▇▅▂▁▂▃▆████▆▃▁
```

---

# 15. GAME LAB

Tạo một mini game engine.

Engine phải tách khỏi game.

## Engine

- Input.
- Game loop.
- Collision.
- Physics cơ bản.
- Sprite.
- Animation.
- Particles.
- Audio.
- Score.
- State.

## Game mẫu

- Snake.
- Pong.
- Particle sandbox.
- Platformer đơn giản.

---

# 16. DATA LAB

Có:

- CSV parser.
- JSON parser.
- Table.
- Sorting.
- Filtering.
- Search.
- Grouping.
- Aggregation.
- Pagination.
- Virtual scrolling.
- Dataset generator.

Phải có benchmark dataset lớn.

Ví dụ:

```text
Dataset: 1,000,000 rows

Normal rendering
████████████████████ 4.8s

Virtualized
██                   0.3s
```

---

# 17. VISUALIZATION LAB

Tự xây bằng Canvas/SVG hoặc thư viện nếu bài cho phép.

Có:

- Bar chart.
- Line chart.
- Pie chart.
- Scatter plot.
- Histogram.
- Heatmap.
- Realtime chart.

Dữ liệu realtime nên có pipeline:

```text
Worker
  ↓
Data Stream
  ↓
Aggregator
  ↓
Chart
```

---

# 18. SECURITY LAB

Chỉ làm các demo giáo dục/an toàn.

Có:

- XSS concept.
- Escaping.
- Sanitization.
- CSP concept.
- CORS concept.
- iframe sandbox.
- Same-origin concept.
- Cookie flags concept.
- Storage isolation.
- Permissions.

Không xây công cụ khai thác, tấn công hoặc tự động hóa xâm nhập.

---

# 19. API EXPLORER

Tự phát hiện các Web API chính.

Ví dụ:

```text
WEB APIs
────────────────────
✓ Canvas
✓ Clipboard
✓ WebSocket
✓ IndexedDB
✓ Worker
✓ Notifications
✓ Geolocation
✗ Bluetooth
✗ WebGPU
...
```

Mỗi API có:

- Support status.
- Permission status nếu có.
- Demo.
- Description.
- Error state.

---

# 20. DEV TOOLS

Tạo các công cụ tiện ích:

- JSON formatter.
- JSON validator.
- Base64 encoder/decoder.
- URL encoder/decoder.
- Timestamp converter.
- UUID generator.
- Color converter.
- Color picker.
- Regex tester.
- Text transformer.
- Hash demo.
- Query-string parser.
- CSV converter.
- HTML entity converter.
- Number base converter.

---

# 21. UTILITIES

Có:

- Calculator.
- Stopwatch.
- Timer.
- Clock.
- Countdown.
- Random generator.
- Password generator ở mức demo.
- Unit converter.
- Text statistics.
- Color tools.

---

# 22. COMMAND PALETTE

Phím tắt:

```text
Ctrl + K
```

Mở:

```text
> Search commands...

Open Canvas Lab
Open Network Lab
Open Storage
Create Workspace
Toggle Dark Mode
Pause All Modules
Resume All Modules
Show Performance
Export Workspace
Import Workspace
Run Benchmark
Reset Workspace
```

Phải hỗ trợ:

- Search.
- Keyboard navigation.
- Enter.
- Escape.
- Shortcut display.

---

# 23. WINDOW MANAGER

Mỗi module có thể mở trong một window/card.

Phải hỗ trợ:

- Drag.
- Resize.
- Minimize.
- Maximize.
- Close.
- Bring to front.
- Z-index.
- Snap.
- Restore.
- Remember position.

---

# 24. MODULE SLEEP SYSTEM

Module có trạng thái:

```text
UNLOADED
   ↓
LOADED
   ↓
ACTIVE
   ↓
IDLE
   ↓
SLEEPING
   ↓
UNLOADED
```

Ví dụ game đang chạy:

```text
ACTIVE
```

Người dùng chuyển sang editor:

```text
SLEEPING
```

Game phải:

- Dừng render loop.
- Pause audio.
- Dừng timer không cần thiết.
- Giữ state.
- Không tiêu CPU liên tục.

Quay lại:

```text
SLEEPING → ACTIVE
```

---

# 25. RESOURCE MANAGER

Theo dõi tối thiểu:

```text
CPU estimate
FPS
DOM nodes
Workers
Timers
Canvas count
Active modules
Loaded modules
Network requests
Storage usage nếu đo được
```

Giao diện:

```text
RESOURCE MONITOR

CPU              ███████░░░ 31%
FPS              59.8
DOM Nodes        8,421
Workers          4
Timers           12
Canvas           7
Network          2 active
```

Nếu module tiêu thụ quá nhiều:

```text
⚠ HIGH RESOURCE USAGE

Module: Particle Lab
CPU estimate: HIGH

[ Pause Module ]
[ Keep Running ]
```

Lưu ý: browser không luôn cung cấp CPU/RAM chính xác cho web app. Nếu không có API phù hợp, phải ghi rõ đây là **estimate/telemetry nội bộ**, không được trình bày như số đo hệ điều hành chính xác.

---

# 26. DEPENDENCY GRAPH

Module có thể phụ thuộc module khác.

Ví dụ:

```text
Video Editor
      │
      ├── File System
      ├── Canvas
      ├── Audio
      └── Storage
```

Nếu người dùng tắt dependency:

```text
⚠ Cannot disable Storage

Required by:
• Video Editor
• Document Editor
```

Cho phép:

```text
[ Cancel ]

[ Disable dependent modules ]
```

---

# 27. WORKSPACE SYSTEM

Người dùng có thể tạo nhiều workspace:

```text
WORKSPACES

⭐ Default
🎨 Design Lab
🎮 Game Lab
📊 Data Lab
🌐 Network Lab
🧪 API Lab
```

Mỗi workspace lưu:

- Module đang bật.
- Module đang tắt.
- Window positions.
- Window sizes.
- Theme.
- Module settings.
- Data cần thiết.
- Shortcuts.
- Layout.

---

# 28. SNAPSHOT SYSTEM

Cho phép lưu trạng thái workspace:

```text
Workspace
   ↓
Snapshot
   ↓
Export JSON
```

Import lại:

```text
Import Snapshot
      ↓
Validate
      ↓
Restore
```

Snapshot ví dụ:

```json
{
  "version": 1,
  "workspace": "Data Lab",
  "modules": [
    "csv",
    "charts",
    "statistics"
  ],
  "layout": {},
  "settings": {}
}
```

Phải validate dữ liệu import, không tin tưởng dữ liệu bên ngoài.

---

# 29. THEME ENGINE

Có:

- Dark.
- Light.
- Custom theme.
- CSS variables.
- Font settings.
- Border radius.
- Spacing.
- Animation speed.
- UI density.

Cho phép:

```text
Export Theme
Import Theme
Reset Theme
```

---

# 30. ERROR ISOLATION

Nếu một module crash:

```text
❌ Module crashed

Module: Game Lab

Error isolated.
Other modules are still running.

[ Restart ]
[ Remove ]
[ Debug ]
```

Một module lỗi **không được làm toàn bộ application chết**.

Mọi module nên có:

- Error boundary ở mức kiến trúc.
- Logging.
- Restart.
- Disable.
- Error details.
- Stack trace trong chế độ debug.

---

# 31. SANDBOX

Các module có rủi ro hoặc cần môi trường cô lập có thể chạy trong:

```text
iframe sandbox
```

hoặc Worker tùy tính chất.

Kiến trúc:

```text
WEB UNIVERSE
      │
Module Manager
      │
 ┌────┼──────────────┐
 │    │              │
DOM Worker        Sandbox
 │    │              │
UI   CPU tasks      iframe
```

Không cấp quyền dư thừa cho sandbox.

---

# 32. PLUGIN ARCHITECTURE

Mức cao nhất: có thể thêm module mà không sửa `app.js`.

Ví dụ:

```text
/modules/my-module/
    ├── manifest.js
    ├── index.js
    ├── style.css
    └── assets/
```

Manifest:

```js
export default {
  id: "my-module",
  name: "My Module",
  version: "1.0.0",
  entry: "./index.js",
  dependencies: []
};
```

Application phải có khả năng:

```text
DISCOVER
   ↓
VALIDATE
   ↓
REGISTER
   ↓
LAZY LOAD
   ↓
MOUNT
   ↓
MONITOR
   ↓
SLEEP
   ↓
UNLOAD
```

---

# 33. SECURITY / TRUST MODEL CHO PLUGIN

Plugin không được mặc định có toàn quyền.

Phải có khái niệm:

```text
permissions:
- storage
- microphone
- camera
- location
- network
```

Nếu plugin yêu cầu permission:

```text
Plugin "Camera Lab" requests:

☐ Camera
☐ Microphone

[ Allow ]
[ Deny ]
```

Không tự động cấp quyền.

---

# 34. ACCESSIBILITY

Bắt buộc:

- Semantic HTML.
- Keyboard navigation.
- Visible focus.
- ARIA khi thực sự cần.
- Dialog accessible.
- Form labels.
- Không phụ thuộc duy nhất vào màu.
- Có trạng thái lỗi rõ ràng.
- Reduced motion nếu người dùng bật preference.

---

# 35. RESPONSIVE

Desktop:

```text
Sidebar + Workspace + Windows
```

Tablet:

```text
Collapsible Sidebar + Workspace
```

Mobile:

```text
Bottom navigation / Drawer
Module full-screen
```

Không được chỉ co nhỏ giao diện desktop.

---

# 36. PERFORMANCE REQUIREMENTS

Đây là phần quan trọng nhất.

## Không được

- Import toàn bộ module ngay khi app khởi động.
- Chạy tất cả animation cùng lúc.
- Để timer của module đã đóng tiếp tục chạy.
- Để worker không còn dùng vẫn hoạt động.
- Giữ event listener không cần thiết.
- Render hàng triệu DOM node.
- Re-render toàn bộ app khi một module thay đổi.

## Phải có

- Dynamic import.
- Lazy loading.
- Event delegation khi phù hợp.
- Debounce.
- Throttle.
- `requestAnimationFrame`.
- Web Worker cho task nặng.
- Virtual scrolling.
- Resource cleanup.
- Module sleeping.
- Error isolation.

---

# 37. PERFORMANCE BENCHMARK

Phải có màn hình benchmark.

Ví dụ:

```text
BENCHMARK

Startup time
────────────────────
Without lazy load: 2.8s
With lazy load:    0.7s

Memory
────────────────────
All loaded:        HIGH
Lazy loaded:       LOW

Active modules
────────────────────
10 modules:  60 FPS
30 modules:  59 FPS
50 modules:  57 FPS
```

Các con số phải là **kết quả đo thực tế**, không hard-code.

---

# 38. STATE MANAGEMENT

State nên được chia:

```text
Global State
    │
    ├── UI State
    ├── Module State
    ├── Workspace State
    ├── Permission State
    └── Runtime State
```

Không để mọi module truy cập và sửa trực tiếp mọi thứ.

---

# 39. EVENT BUS

Có thể xây:

```js
eventBus.emit("module:enabled", {
  id: "canvas-lab"
});
```

và:

```js
eventBus.on("module:enabled", handler);
```

Phải cleanup subscription khi module bị destroy.

---

# 40. LOGGING

Có logger:

```text
[INFO] Module loaded: canvas-lab
[INFO] Module mounted: canvas-lab
[WARN] WebGPU unavailable
[ERROR] Game module crashed
```

Có level:

- DEBUG
- INFO
- WARN
- ERROR

Có thể bật Developer Mode để xem log chi tiết.

---

# 41. PERMISSION CENTER

Tập trung các quyền:

```text
PERMISSIONS

Camera        Granted
Microphone    Denied
Location      Prompt
Notifications Default
Clipboard     Available
```

Không giả định permission status nếu browser không cho phép truy vấn.

---

# 42. BROWSER COMPATIBILITY

Mỗi module phải có capability detection.

Ví dụ:

```js
if ("geolocation" in navigator) {
  // supported
}
```

Không dùng:

```js
// giả định browser nào cũng hỗ trợ
```

Giao diện phải phân biệt:

```text
✓ Supported
⚠ Permission required
✗ Not supported
```

---

# 43. OFFLINE-FIRST

Những phần không cần mạng nên vẫn hoạt động khi offline:

- Text editor.
- Calculator.
- Canvas.
- Storage.
- Local data tools.
- Theme.
- Workspace.
- Snapshot.

Các tính năng phụ thuộc mạng phải hiển thị trạng thái rõ ràng.

---

# 44. EXPORT / IMPORT

Hỗ trợ export:

- Workspace.
- Theme.
- Settings.
- Snapshot.
- Text.
- JSON.
- CSV.
- Canvas image.

Import phải:

- Validate.
- Version check.
- Reject dữ liệu sai.
- Không thực thi code import một cách mù quáng.

---

# 45. DEBUG MODE

Có Developer Mode:

```text
Developer Mode

✓ Module logs
✓ Lifecycle events
✓ Performance monitor
✓ Event monitor
✓ Worker monitor
✓ Network inspector
✓ Storage inspector
✓ Error stack
```

---

# 46. TESTING

Tối thiểu phải có test cho:

## Module Manager

- Register.
- Load.
- Enable.
- Disable.
- Restart.
- Dependency.
- Lifecycle.

## Storage

- Save.
- Load.
- Delete.
- Restore.

## Workspace

- Create.
- Save.
- Load.
- Delete.
- Snapshot.

## Error handling

- Module throw error.
- Application remains alive.
- Module restart works.

---

# 47. CẤU TRÚC THƯ MỤC GỢI Ý

```text
web-universe/
│
├── index.html
├── manifest.webmanifest
├── sw.js
│
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── windows.css
│   ├── themes.css
│   └── modules.css
│
├── js/
│   ├── app.js
│   ├── router.js
│   ├── state.js
│   ├── event-bus.js
│   ├── module-manager.js
│   ├── resource-manager.js
│   ├── permission-manager.js
│   ├── window-manager.js
│   ├── workspace-manager.js
│   ├── logger.js
│   └── modules/
│       ├── text/
│       ├── markdown/
│       ├── code-playground/
│       ├── json/
│       ├── canvas/
│       ├── svg/
│       ├── webgl/
│       ├── webgpu/
│       ├── audio/
│       ├── video/
│       ├── camera/
│       ├── microphone/
│       ├── recorder/
│       ├── files/
│       ├── storage/
│       ├── indexeddb/
│       ├── fetch/
│       ├── websocket/
│       ├── streaming/
│       ├── workers/
│       ├── pwa/
│       ├── device/
│       ├── audio-engine/
│       ├── games/
│       ├── data/
│       ├── charts/
│       ├── security/
│       ├── api-explorer/
│       └── devtools/
│
├── workers/
│   ├── benchmark-worker.js
│   ├── data-worker.js
│   └── image-worker.js
│
├── sandbox/
│   └── sandbox.html
│
└── assets/
```

---

# 48. QUY TẮC CODE

## Bắt buộc

- ES Modules.
- `const` / `let`.
- Không dùng global variable bừa bãi.
- Module độc lập.
- Hàm nhỏ, có trách nhiệm rõ.
- Tách UI khỏi logic khi hợp lý.
- Cleanup event listeners.
- Cleanup timers.
- Cleanup workers.
- Không để memory leak rõ ràng.
- Không hard-code dữ liệu benchmark.
- Không giả lập browser API thành dữ liệu thật.

## Hạn chế

- Không nhét toàn bộ app vào một file.
- Không copy-paste module.
- Không dùng `setInterval` vô hạn mà không cleanup.
- Không tạo hàng nghìn DOM node không cần thiết.
- Không dùng framework chỉ để né việc hiểu kiến trúc nếu bài đang yêu cầu Web Platform thuần.

---

# 49. YÊU CẦU SẢN PHẨM CUỐI

Khi mở trang:

1. App khởi động nhanh.
2. Chỉ core được load trước.
3. Module chưa dùng chưa được tải.
4. Dashboard hiển thị module catalog.
5. Người dùng chọn module.
6. Module được lazy-load.
7. Module mount vào workspace.
8. Resource Manager bắt đầu theo dõi.
9. Khi module không hoạt động, nó có thể sleep.
10. Khi đóng, module phải cleanup.
11. Workspace được lưu.
12. Có thể khôi phục workspace sau khi reload.
13. Một module crash không được làm app chết.
14. API không hỗ trợ phải hiển thị đúng trạng thái.
15. Offline mode vẫn giữ các chức năng local.

---

# 50. THANG ĐỘ KHÓ

## Level 1 — Foundation

- 10 module.
- Sidebar.
- Module toggle.
- Basic workspace.
- Dark/light mode.

**Mục tiêu: 5/10**

## Level 2 — Modular

- 20+ module.
- Dynamic import.
- Lifecycle.
- Storage.
- Window manager.

**Mục tiêu: 6/10**

## Level 3 — Advanced

- 30+ module.
- IndexedDB.
- Worker.
- Canvas.
- Media.
- Network.
- PWA.

**Mục tiêu: 7/10**

## Level 4 — Architecture

- Dependency graph.
- Resource Manager.
- Error isolation.
- Workspace system.
- Snapshot.
- Command palette.

**Mục tiêu: 8/10**

## Level 5 — Expert

- 50+ module/feature.
- Worker pool.
- Sandbox.
- Permission Manager.
- API Explorer.
- Performance benchmark.
- Offline-first.

**Mục tiêu: 9/10**

## Level 6 — ULTIMATE

- Plugin architecture.
- Auto discovery.
- Module manifest.
- Dependency resolution.
- Module permissions.
- Module sleeping.
- Resource lifecycle.
- Error isolation.
- Workspace persistence.
- Snapshot import/export.
- Developer mode.
- Accessibility.
- Responsive.
- PWA.
- 50–100 module/mini-feature.

**Mục tiêu: 10/10**

---

# 51. BẢN ĐÁNH GIÁ RIÊNG

## A. UI / UX — 10%

- [ ] Giao diện rõ ràng.
- [ ] Responsive.
- [ ] Window system hoạt động.
- [ ] Navigation tốt.
- [ ] Command palette.
- [ ] Accessibility cơ bản.

## B. Module Architecture — 20%

- [ ] Module độc lập.
- [ ] Register.
- [ ] Dynamic import.
- [ ] Lifecycle.
- [ ] Dependency.
- [ ] Plugin system.

## C. Web Platform — 20%

- [ ] Canvas.
- [ ] SVG.
- [ ] Media.
- [ ] File API.
- [ ] Storage.
- [ ] IndexedDB.
- [ ] Network.
- [ ] Worker.
- [ ] Service Worker.
- [ ] Device APIs.

## D. Performance — 20%

- [ ] Lazy load.
- [ ] Sleep.
- [ ] Cleanup.
- [ ] Worker.
- [ ] Virtualization.
- [ ] Benchmark.
- [ ] Không có memory leak rõ ràng.

## E. Reliability — 10%

- [ ] Error isolation.
- [ ] Module restart.
- [ ] Capability detection.
- [ ] Permission handling.
- [ ] Offline handling.

## F. Data / Persistence — 10%

- [ ] IndexedDB.
- [ ] Workspace.
- [ ] Snapshot.
- [ ] Import/export.
- [ ] Versioning.

## G. Code Quality — 10%

- [ ] ES Modules.
- [ ] Naming.
- [ ] Tách trách nhiệm.
- [ ] Không global state bừa bãi.
- [ ] Cleanup.
- [ ] Documentation.
- [ ] Tests.

---

# 52. CÁC LỖI BỊ TRỪ ĐIỂM NẶNG

### -2 đến -5 điểm

Nếu:

- Tất cả code nằm trong một file.
- Tất cả module load ngay khi startup.
- Module đóng nhưng timer vẫn chạy.
- Worker không terminate.
- Event listener không cleanup.
- Một module crash làm toàn app crash.
- Giả lập API browser không được hỗ trợ.
- Hard-code benchmark.
- Dùng dữ liệu giả nhưng hiển thị như dữ liệu thật.
- Không xử lý permission.
- Không có capability detection.

### Không đạt Level 10 nếu:

- Không có lazy loading.
- Không có lifecycle.
- Không có dependency management.
- Không có resource management.
- Không có error isolation.
- Không có plugin/module discovery.
- Không có workspace persistence.

---

# 53. FINAL BOSS TEST

Người chấm phải thử:

### Test 1 — Startup

Mở trang và kiểm tra module chưa dùng có được load không.

### Test 2 — Lazy loading

Mở Canvas Lab và kiểm tra module chỉ được tải lúc cần.

### Test 3 — Disable

Bật module → tắt module → kiểm tra timer/listener/worker có được cleanup không.

### Test 4 — Stress

Bật nhiều module và quan sát FPS/resource usage.

### Test 5 — Crash

Cố tình làm một module throw error.

Kết quả mong muốn:

```text
Module crashed.
Application still works.
```

### Test 6 — Dependency

Tắt một dependency đang được module khác sử dụng.

### Test 7 — Offline

Tắt mạng và kiểm tra các module local.

### Test 8 — Reload

Tạo workspace → reload → workspace phải được khôi phục.

### Test 9 — Snapshot

Export → reset → import → trạng thái phải phục hồi.

### Test 10 — Plugin

Thêm module mới vào thư mục plugin mà không sửa core application.

---

# 54. MỤC TIÊU CUỐI CÙNG

Sản phẩm hoàn thành phải cho người dùng cảm giác:

> “Đây không phải một website có nhiều tính năng. Đây là một nền tảng web nhỏ, trong đó mỗi khả năng của trình duyệt được đóng gói thành một module.”

Kiến trúc cuối:

```text
                         WEB UNIVERSE
                              │
                     ┌────────┴────────┐
                     │   CORE RUNTIME  │
                     └────────┬────────┘
                              │
                    ┌─────────┴─────────┐
                    │  MODULE MANAGER   │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       UI Modules         API Modules        Lab Modules
          │                   │                   │
     ┌────┼────┐         ┌────┼────┐         ┌────┼────┐
     │    │    │         │    │    │         │    │    │
   Text Canvas Media    Fetch WS Storage    Game Data Audio
     │    │    │         │    │    │         │    │    │
     └────┴────┴─────────┴────┴────┴─────────┴────┴────┘
                              │
                     RESOURCE MANAGER
                              │
                ┌─────────────┼─────────────┐
                │             │             │
             Workers       Sandbox       Service Worker
                │             │             │
                └─────────────┼─────────────┘
                              │
                       WORKSPACE STATE
                              │
                         IndexedDB
```

**Đây là bài tổng hợp cấp độ cao nhất của series Web. Không đặt mục tiêu “làm xong nhanh”; đặt mục tiêu xây được kiến trúc đủ tốt để có thể tiếp tục thêm module mà core không phải viết lại.**
