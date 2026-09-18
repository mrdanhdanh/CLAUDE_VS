// anchors-check.mjs — verify exact substrings tồn tại trong knowleged.md trước khi edit (tạm, review session)
import fs from 'node:fs';
const t = fs.readFileSync('docs/knowleged.md', 'utf8');
const anchors = [
  ['L53 row grace', 'grace 600ms'],
  ['L701 cách sửa', 'grace period 600ms cho click-anywhere'],
  ['L705 bullet', '- Skip kiểu click-anywhere phải có **grace period (~600ms)** chống click nhầm khi vừa mở.'],
  ['KN-004 row', 'Wrapper `.grid-2` tự mang `margin:24px 0`, con `.section` đặt `margin:0`;'],
  ['KN-004 cách sửa', '`.grid-2{margin:24px 0}` + `.grid-2 > .section{margin:0}` (nhịp 24px đồng nhất);'],
  ['KN-004 tags', '- **Tags:** `ui` `css` `animation` `spacing`'],
  ['KN-052 why3', 'timeline "6–12 tháng botnet" là dự đoán không verify được'],
  ['KN-009 cách sửa end', '`Program.cs` chỉ đọc config, không chứa giá trị máy dev.'],
  ['KN-009 bullet', '- CI check cấm `localhost|http://` trong `appsettings*`.'],
  ['KN-012 end', '(3) governance instruction thêm §5 verifier integrity.'],
  ['KN-021 last bullet', '- Take the Wheel (human takeover) vẫn là fallback cuối — governance không thay human judgment.'],
  ['KN-048 end', "' .AGENT/POLICY.JSON'"],
  ['KN-048 end2', '.AGENT/POLICY.JSON\' đều REFUSED.'],
  ['KN-051 end bullet', 'không phải lock-bathroom "Ayyyy Eyyyy".'],
  ['KN-064 dẫn chứng', '**Dẫn chứng (local-first):** local: severity regex 0/55'],
  ['KN-065 dẫn chứng', '**Dẫn chứng (ngoài model — KN-023; local-first KN-052):**'],
  ['KN-003 cách sửa', 'Verify bằng Playwright (chromium/firefox/webkit, cả native + fallback mode) → `--angle` thay đổi rõ ràng.'],
  ['KN-003 bullet4', '- Verify animation bằng headless browser đo `--angle` trước/sau, không chỉ mắt thường.'],
  ['KN-011 tags', '- **Tags:** `ui` `state` `ux` `button`'],
  ['KN-039 bullet', '- Sinh lệnh PowerShell: chỉ cú pháp 5.1 —'],
  ['KN-039 a1', '- **Tags:** `process` `dx` `windows` `powershell` `scripts` `hooks` Cài pwsh **7.6.6**'],
  ['KN-039 a2', 'Contract 5.1 vẫn giữ cho artifact commit repo (portability floor).'],
  ['KN-039 dup tags', '- **Tags:** `process` `dx` `windows` `powershell` `scripts`\n- **Người ghi:** YUNIE / /fixbug'],
  ['UpdatedAt', '*UpdatedAt: 2026-09-18T13:37:30Z'],
];
for (const [name, s] of anchors) {
  const i = t.indexOf(s);
  console.log(`${i >= 0 ? 'OK  ' : 'MISS'} ${name}`);
  if (i >= 0 && name === 'L53 row grace') console.log('     ctx: ' + JSON.stringify(t.slice(i - 40, i + 60)));
}
