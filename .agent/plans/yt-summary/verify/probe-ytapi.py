# probe-ytapi.py — LIVE probe: youtube-transcript-api (Android innertube client, no key, no browser)
# Chạy: python .agent/plans/yt-summary/verify/probe-ytapi.py
import json
import sys

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print(json.dumps({"ok": False, "error": "package not installed"}))
    sys.exit(0)

VID = sys.argv[1] if len(sys.argv) > 1 else "dQw4w9WgXcQ"

try:
    api = YouTubeTranscriptApi()
    if hasattr(api, "fetch"):  # v1.x
        fetched = api.fetch(VID, languages=["en", "en-US", "en-GB"])
        snippets = getattr(fetched, "snippets", fetched)
        items = [{"start": round(float(s.start), 2), "dur": round(float(s.duration), 2), "text": s.text} for s in snippets]
    else:  # v0.x legacy
        items = YouTubeTranscriptApi.get_transcript(VID, languages=["en", "en-US", "en-GB"])
    print(json.dumps({"ok": True, "version_api": "fetch" if hasattr(api, "fetch") else "legacy",
                      "count": len(items), "first2": items[:2], "last": items[-1]["start"] if items else None}, ensure_ascii=False))
except Exception as e:  # noqa: BLE001
    print(json.dumps({"ok": False, "type": type(e).__name__, "error": str(e)[:400]}, ensure_ascii=False))
