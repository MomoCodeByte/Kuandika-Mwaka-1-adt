import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "content/i18n/sw-TZ/audio/pg041_s001_n0003_supervisor_v4.mp3"
VOICE = "sw-TZ-RehemaNeural"
SPEECH = "za, ze, zi, zu, na, fi."


async def main() -> None:
    temporary = TARGET.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(SPEECH, VOICE).save(str(temporary))
    if temporary.stat().st_size < 1024:
        raise RuntimeError("Sauti haikutengenezwa")
    temporary.replace(TARGET)
    duration = float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(TARGET),
            ],
            text=True,
        ).strip()
    )
    syllables = ["za", "ze", "zi", "zu", "na", "fi"]
    usable_start = min(0.18, duration * 0.08)
    usable_end = max(usable_start, duration - min(0.2, duration * 0.08))
    step = (usable_end - usable_start) / len(syllables)
    words = [
        {
            "word": word,
            "start": round(usable_start + index * step, 4),
            "end": round(usable_start + (index + 1) * step, 4),
        }
        for index, word in enumerate(syllables)
    ]
    print(json.dumps(words, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
