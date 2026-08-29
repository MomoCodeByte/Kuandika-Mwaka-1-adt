import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRELOADER_PATH = ROOT / "assets" / "offline-preloader.js"
SOURCE = PRELOADER_PATH.read_text(encoding="utf-8")


def replace_object_value(source: str, key: str, value: object) -> str:
    """Replace one JSON-shaped object value without parsing embedded HTML.

    The generated preloader contains JavaScript-only escapes such as ``\x27``
    inside embedded HTML, so the complete INLINE object is not strict JSON.
    The config and audios entries themselves are strict JSON objects and can be
    replaced safely with a small balanced-brace scanner.
    """

    needle = json.dumps(key, ensure_ascii=False) + ":"
    key_start = source.index(needle)
    value_start = key_start + len(needle)
    if source[value_start] != "{":
        raise RuntimeError(f"Expected object value for {key}")

    depth = 0
    in_string = False
    escaped = False
    value_end = None
    for index in range(value_start, len(source)):
        char = source[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                value_end = index + 1
                break
    if value_end is None:
        raise RuntimeError(f"Could not find end of object value for {key}")

    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return source[:value_start] + encoded + source[value_end:]


config = json.loads((ROOT / "assets" / "config.json").read_text(encoding="utf-8"))
audios = json.loads(
    (ROOT / "content" / "i18n" / "sw-TZ" / "audios.json").read_text(encoding="utf-8")
)
updated = replace_object_value(SOURCE, "./assets/config.json", config)
updated = replace_object_value(updated, "./content/i18n/sw-TZ/audios.json", audios)
PRELOADER_PATH.write_text(updated, encoding="utf-8")
print("offline consonant cache synchronized")
