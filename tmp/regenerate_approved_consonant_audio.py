import asyncio
import json
import os
import re
import shutil
import sys
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
AUDIT_PATH = ROOT / "reports" / "consonant-pronunciation-audit-2026-08-29.json"
MANIFEST_PATH = ROOT / "reports" / "consonant-regeneration-manifest-2026-08-29.json"
BACKUP_PATH = ROOT / "tmp" / "audios-before-consonant-regeneration.json"
VOICE = "sw-TZ-RehemaNeural"
CONCURRENCY = 6
MAX_ATTEMPTS = 4


SPOKEN = {
    "b": "ba",
    "m": "ma",
    "d": "da",
    "k": "ka",
    "n": "na",
    "l": "la",
    "t": "ta",
    "p": "pa",
    "s": "sa",
    "f": "fa",
    "j": "ja",
    "g": "ga",
    "y": "ya",
    "z": "za",
    "r": "ra",
    "h": "ha",
    "w": "wa",
    "v": "va",
    "ch": "cha",
    "njw": "njwa",
    "ngw": "ngwa",
    "ndw": "ndwa",
    "ng'": "ng'a",
    "ng’": "ng'a",
    "sh": "sha",
    "ny": "nya",
    "ng": "nga",
    "nd": "nda",
    "th": "tha",
    "mb": "mba",
    "kw": "kwa",
    "gw": "gwa",
    "sw": "swa",
    "vy": "vya",
    "nj": "nja",
    "pw": "pwa",
    "fy": "fya",
    "a": "aaa",
    "e": "eee",
    "i": "iii",
    "o": "ooo",
    "u": "uuu",
}

TOKENS = sorted(SPOKEN, key=len, reverse=True)
TOKEN_RE = re.compile(
    rf"(?<![A-Za-zÀ-ÿ])({'|'.join(map(re.escape, TOKENS))})(?![A-Za-zÀ-ÿ])",
    re.IGNORECASE,
)
ADJACENT_MARKERS_RE = re.compile(r"⟦([^⟧]+)⟧\s+⟦([^⟧]+)⟧")


def prepare_spoken_text(text: str) -> str:
    """Expand isolated letters and add audible pauses to adjacent letter runs."""

    marked = TOKEN_RE.sub(lambda match: f"⟦{SPOKEN[match.group(1).lower()]}⟧", text)
    while ADJACENT_MARKERS_RE.search(marked):
        marked = ADJACENT_MARKERS_RE.sub(r"⟦\1⟧, ⟦\2⟧", marked)
    return marked.replace("⟦", "").replace("⟧", "")


def output_name(item_id: str) -> str:
    return f"{item_id}_sw_consonant_v1.mp3"


async def generate_one(row: dict, semaphore: asyncio.Semaphore, index: int, total: int) -> dict:
    item_id = row["id"]
    spoken_text = prepare_spoken_text(row["current_text"])
    filename = output_name(item_id)
    destination = AUDIO_DIR / filename
    temporary = AUDIO_DIR / f"{filename}.part"

    if destination.exists() and destination.stat().st_size > 1024:
        print(f"[{index}/{total}] resume {item_id}", flush=True)
        return {**row, "spoken_text": spoken_text, "new_audio_file": filename, "result": "reused"}

    async with semaphore:
        error = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                temporary.unlink(missing_ok=True)
                await edge_tts.Communicate(spoken_text, VOICE).save(str(temporary))
                if not temporary.exists() or temporary.stat().st_size <= 1024:
                    raise RuntimeError("TTS returned an empty or incomplete MP3")
                os.replace(temporary, destination)
                print(f"[{index}/{total}] generated {item_id}", flush=True)
                return {
                    **row,
                    "spoken_text": spoken_text,
                    "new_audio_file": filename,
                    "result": "generated",
                }
            except Exception as exc:  # edge-tts exposes several transient network exceptions
                error = exc
                temporary.unlink(missing_ok=True)
                if attempt < MAX_ATTEMPTS:
                    await asyncio.sleep(min(2**attempt, 8))
        raise RuntimeError(f"{item_id}: {error}")


async def main() -> None:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    rows = [row for row in audit["rows"] if row["status"] == "Inasubiri idhini"]
    if len(rows) != 210:
        raise RuntimeError(f"Expected 210 approved rows, found {len(rows)}")

    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = [generate_one(row, semaphore, index, len(rows)) for index, row in enumerate(rows, 1)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    failures = [result for result in results if isinstance(result, Exception)]
    if failures:
        for failure in failures:
            print(f"ERROR {failure}", file=sys.stderr, flush=True)
        raise RuntimeError(f"Generation failed for {len(failures)} audio files; rerun to resume")

    completed = [result for result in results if isinstance(result, dict)]
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    shutil.copyfile(AUDIOS_PATH, BACKUP_PATH)
    for result in completed:
        audios[result["id"]] = result["new_audio_file"]

    AUDIOS_PATH.write_text(
        json.dumps(audios, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "generated_on": "2026-08-29",
                "voice": VOICE,
                "count": len(completed),
                "items": completed,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"COMPLETE generated={len(completed)} manifest={MANIFEST_PATH}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
