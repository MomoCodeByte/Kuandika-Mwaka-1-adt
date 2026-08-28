import asyncio
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content/i18n/sw-TZ/texts.json"
TIMECODES_PATH = ROOT / "content/i18n/sw-TZ/timecode/timecode_output.json"
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"


def pronunciation_text(text: str) -> str:
    spoken = re.sub(
        r"irabu\s+A\s+E\s+I\s+O\s+U",
        "irabu aa, ee, ii, oo, uu",
        text,
        flags=re.IGNORECASE,
    )
    for letter, replacement in zip("aeiou", ("aa", "ee", "ii", "oo", "uu")):
        spoken = re.sub(
            rf"(\birabu\s+){letter}(?=\s|[.,]|$)",
            rf"\1{replacement}",
            spoken,
            flags=re.IGNORECASE,
        )
        if re.fullmatch(rf"\s*{letter}[\s.,]*", spoken, flags=re.IGNORECASE):
            spoken = replacement + "."
    return spoken


async def generate(item_id: str, speech: str):
    audio_path = AUDIO_DIR / f"{item_id}.mp3"
    temp_path = audio_path.with_suffix(".new.mp3")
    boundaries = []
    with temp_path.open("wb") as output:
        async for chunk in edge_tts.Communicate(speech, VOICE).stream():
            if chunk["type"] == "audio":
                output.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000_000
                end = (chunk["offset"] + chunk["duration"]) / 10_000_000
                boundaries.append(
                    {"word": chunk["text"], "start": round(start, 4), "end": round(end, 4)}
                )
    temp_path.replace(audio_path)
    return boundaries


async def main():
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    timecodes = json.loads(TIMECODES_PATH.read_text(encoding="utf-8"))
    jobs = []
    for item_id, original in texts.items():
        speech = pronunciation_text(str(original))
        if speech != original and (AUDIO_DIR / f"{item_id}.mp3").exists():
            jobs.append((item_id, speech))
    for item_id, speech in jobs:
        words = await generate(item_id, speech)
        timecodes[item_id] = {"timecodes": [{"word_timestamps": words}]}
        print(f"{item_id}: {speech}")
    TIMECODES_PATH.write_text(
        json.dumps(timecodes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"updated={len(jobs)}")


asyncio.run(main())
