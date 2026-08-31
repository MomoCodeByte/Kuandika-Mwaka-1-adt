import asyncio
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"
TRACKS = {
    "pg044_s002_n0003_supervisor_v4.mp3": (
        "Katika somo hili utajifunza kuandika herufi ya konsonanti wa."
    ),
    "pg044_currency_group_audio_description_supervisor_v4.mp3": (
        "Picha ya kwanza inaonyesha fedha: noti ya shilingi elfu moja na sarafu. "
        "Andika neno fedha kwenye kisanduku cha kwanza."
    ),
    "pg044_tent_audio_description_supervisor_v4.mp3": (
        "Picha ya pili inaonyesha hema. Andika neno hema kwenye kisanduku cha pili."
    ),
}


async def generate(filename: str, speech: str) -> None:
    target = AUDIO_DIR / filename
    temporary = target.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(speech, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError(f"Sauti haikutengenezwa: {filename}")
    temporary.replace(target)
    print(filename)


async def main() -> None:
    for filename, speech in TRACKS.items():
        await generate(filename, speech)


if __name__ == "__main__":
    asyncio.run(main())
