import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
preloader_path = root / "assets/offline-preloader.js"
source = preloader_path.read_text(encoding="utf-8")
marker = "  var INLINE="
start = source.index(marker) + len(marker)
end = source.index(";\n  function lookup", start)
inline = json.loads(source[start:end])

inline["./content/i18n/sw-TZ/texts.json"] = json.loads(
    (root / "content/i18n/sw-TZ/texts.json").read_text(encoding="utf-8")
)
inline["./content/i18n/sw-TZ/timecode/timecode_output.json"] = json.loads(
    (root / "content/i18n/sw-TZ/timecode/timecode_output.json").read_text(encoding="utf-8")
)
inline["./pg009_sec001.html"] = (root / "pg009_sec001.html").read_text(encoding="utf-8")

updated = source[:start] + json.dumps(inline, ensure_ascii=False, separators=(",", ":")) + source[end:]
preloader_path.write_text(updated, encoding="utf-8")
print("offline vowel cache synchronized")
