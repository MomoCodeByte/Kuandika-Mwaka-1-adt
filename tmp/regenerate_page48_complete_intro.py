import asyncio
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"
TRACKS = {
    "pg048_s001_n0002_supervisor_v4.mp3": "Kuandika herufi ya konsonanti cha.",
    "pg048_s001_n0003_supervisor_v4.mp3": "Katika somo hili utajifunza kuandika herufi ya konsonanti cha.",
}


async def save_track(filename: str, speech: str) -> None:
    target = AUDIO_DIR / filename
    temporary = target.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(speech, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError(f"Sauti kamili haikutengenezwa: {filename}")
    temporary.replace(target)
    print(filename)


async def main() -> None:
    for filename, speech in TRACKS.items():
        await save_track(filename, speech)


if __name__ == "__main__":
    asyncio.run(main())
