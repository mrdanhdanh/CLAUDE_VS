"""VieNeu-TTS voiceover generator — TTS tiếng Việt local, 48 kHz, không cần mạng sau lần đầu.

Cài (đã làm):  python -m venv D:\\CLAUDE_VS\\.venv-tts
                .venv-tts\\Scripts\\pip install vieneu
Chạy:
  D:\\CLAUDE_VS\\.venv-tts\\Scripts\\python.exe www\\space-bunny-free\\tts-vieneu.py --list
  D:\\CLAUDE_VS\\.venv-tts\\Scripts\\python.exe www\\space-bunny-free\\tts-vieneu.py --voice "Hải Đăng" --text-file www\\space-bunny-free\\voiceover.txt --out www\\space-bunny-free\\voiceover.wav

Ghi chú:
- HF_HOME trỏ sang D: vì ổ C: gần đầy (model tải về nằm trên D:).
- CPU path (ONNX) là mặc định ở đây vì venv không cài torch; RTF ~0.5 → 48 s audio ≈ 24 s máy.
"""
import argparse
import json
import os
import sys
import time
import unicodedata

os.environ.setdefault('HF_HOME', r'D:\hf-cache')
os.environ.setdefault('HF_HUB_CACHE', os.path.join(os.environ['HF_HOME'], 'hub'))
os.environ.setdefault('HF_HUB_DISABLE_SYMLINKS_WARNING', '1')

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass


def slugify(name: str) -> str:
    """'Hải Đăng' -> 'hai-dang' (bỏ dấu, an toàn cho tên file)."""
    folded = unicodedata.normalize('NFD', name.replace('đ', 'd').replace('Đ', 'D'))
    ascii_only = ''.join(c for c in folded if unicodedata.category(c) != 'Mn')
    return '-'.join(ascii_only.lower().split())


def compose_segments(tts, spec: dict, out_path: str, voice_override: str | None) -> int:
    """Sinh từng đoạn lời rồi ghép vào timeline 50s, chỗ trống là im lặng.

    Cần thiết vì v3 Turbo không có tham số `speed` — không kéo dài giọng đọc được,
    nên phải cắt lời theo beat và chèn khoảng nghỉ cho khớp hình.
    """
    import numpy as np
    import soundfile as sf

    sr = int(getattr(tts, 'sample_rate', 48_000))
    total = float(spec.get('total', 50))
    voice = voice_override or spec.get('voice')
    segments = spec.get('segments') or []
    if not segments:
        print('⛔ File segments không có đoạn nào', file=sys.stderr)
        return 2

    canvas = np.zeros(int(round(total * sr)), dtype=np.float32)
    fade = int(0.008 * sr)  # 8 ms — tránh tiếng "cụp" ở đầu/cuối đoạn
    problems = []

    for i, seg in enumerate(segments, 1):
        text = (seg.get('text') or '').strip()
        if not text:
            problems.append(f'#{i} thiếu text')
            continue
        t0 = time.time()
        audio = np.asarray(tts.infer(text, voice=voice, show_progress=False), dtype=np.float32)
        gen_s = time.time() - t0
        dur = len(audio) / sr

        if fade and len(audio) > 2 * fade:
            ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
            audio[:fade] *= ramp
            audio[-fade:] *= ramp[::-1]

        start = int(round(float(seg.get('at', 0)) * sr))
        stop = start + len(audio)
        label = seg.get('beat') or f'#{i}'
        end = seg.get('end')

        if stop > len(canvas):
            problems.append(f'{label}: tràn khỏi timeline ({start / sr + dur:.2f}s > {total}s)')
            audio = audio[: max(0, len(canvas) - start)]
            stop = start + len(audio)
        if end is not None and start / sr + dur > float(end):
            problems.append(f'{label}: tràn beat ({start / sr + dur:.2f}s > {float(end)}s)')

        canvas[start:stop] += audio
        print(
            f'  {label}: at={start / sr:.2f}s dur={dur:.2f}s '
            f'gen={gen_s:.1f}s rtf={gen_s / max(dur, 1e-6):.2f}'
        )

    peak = float(np.max(np.abs(canvas))) if canvas.size else 0.0
    if peak > 0.99:
        # Model có thể xuất hơi quá ±1.0; scale xuống thay vì clip để không méo tiếng.
        gain = 0.98 / peak
        canvas *= gain
        print(f'  chuẩn hoá: peak {peak:.3f} → {peak * gain:.3f} (gain {gain:.4f})')
        peak = float(np.max(np.abs(canvas)))

    sf.write(out_path, canvas, sr, subtype='PCM_16')
    voiced = float(np.count_nonzero(np.abs(canvas) > 1e-4)) / sr
    print(f'OK segments={len(segments)} out={out_path} total={total:.1f}s voiced={voiced:.1f}s peak={peak:.3f}')

    if problems:
        for p in problems:
            print(f'⛔ {p}', file=sys.stderr)
        return 1
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description='Sinh voiceover tiếng Việt bằng VieNeu-TTS')
    ap.add_argument('--voice', default='', help='tên giọng; nhiều giọng thì ngăn bằng dấu phẩy (bỏ trống = lấy theo file segments)')
    ap.add_argument('--out', default='voiceover-vieneu.wav', help='file ra; nếu nhiều giọng thì dùng làm tiền tố')
    ap.add_argument('--text-file', help='file .txt chứa lời đọc')
    ap.add_argument('--text', help='lời đọc trực tiếp (ưu tiên hơn --text-file)')
    ap.add_argument('--segments', help='file JSON [{at, end, text}] — ghép lời theo beat, chèn khoảng nghỉ')
    ap.add_argument('--total', type=float, help='tổng độ dài timeline khi dùng --segments (ghi đè giá trị trong file)')
    ap.add_argument('--list', action='store_true', help='liệt kê giọng rồi thoát')
    ap.add_argument('--mode', default='v3turbo', help='v3turbo (48 kHz) | v3nano (24 kHz, nhẹ hơn)')
    ap.add_argument('--precision', help='fp32 (mặc định) | int8 (nhanh hơn, cần CPU VNNI)')
    args = ap.parse_args()

    from vieneu import Vieneu

    kwargs = {'mode': args.mode}
    if args.precision:
        kwargs['precision'] = args.precision

    t0 = time.time()
    tts = Vieneu(**kwargs)
    load_s = time.time() - t0

    if args.list:
        for label, voice_id in tts.list_preset_voices():
            print(f'{label}\t{voice_id}')
        print(f'\n# nạp model: {load_s:.1f}s', file=sys.stderr)
        return 0

    if args.segments:
        with open(args.segments, encoding='utf-8') as fh:
            spec = json.load(fh)
        if args.total:
            spec['total'] = args.total
        return compose_segments(tts, spec, args.out, args.voice or None)

    if args.text:
        text = args.text
    elif args.text_file:
        with open(args.text_file, encoding='utf-8') as fh:
            text = fh.read().strip()
    else:
        text = sys.stdin.read().strip()

    if not text:
        print('⛔ Không có lời đọc (dùng --text hoặc --text-file)', file=sys.stderr)
        return 2

    voices = [v.strip() for v in (args.voice or 'Hải Đăng').split(',') if v.strip()]
    for voice in voices:
        t0 = time.time()
        audio = tts.infer(text, voice=voice)
        gen_s = time.time() - t0
        if len(voices) > 1:
            base, ext = os.path.splitext(args.out)
            target = f'{base}-{slugify(voice)}{ext}'
        else:
            target = args.out
        tts.save(audio, target)
        duration = len(audio) / 48000
        print(
            f'OK voice={voice} out={target} audio={duration:.2f}s '
            f'load={load_s:.1f}s gen={gen_s:.1f}s rtf={gen_s / duration:.3f}'
        )
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
    except Exception as exc:  # fail loud, exit 1 cho pipeline
        print(f'⛔ tts-vieneu lỗi: {type(exc).__name__}: {exc}', file=sys.stderr)
        raise SystemExit(1)
