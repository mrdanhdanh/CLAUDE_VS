# Design mini: N5Blazor Ladder-gated trial

## Native-first
- Không thêm dependency, không thêm component mới.
- Xóa là chính: 2 file `.razor` chết + 2 file `bootstrap/` không dùng.
- Toggle Kana: dùng pattern đã có ở Kanji/Vocab/Grammar (`Contains ? Remove + Save : Add via Mark + Save`).

## States giữ nguyên
- `KanaPage`: modal, quiz, empty, learned dot — không đổi.
- `Home`: hero, stats, roadmap, quick actions — không đổi.
- A11y: `aria-label`, ESC hint, focus-visible — không đụng.

## Verify
- `dotnet build N5Blazor` pass (cần tắt `dotnet run` trước — KN-008).
- `dotnet test N5Blazor.Tests` pass 25/25 (không sửa test).
- `get_errors` 0 cho files đổi.
- Scoreboard: LOC xóa, KB xóa, behavior giữ.
