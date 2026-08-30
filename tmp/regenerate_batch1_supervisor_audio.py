import asyncio
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
VOICE = "sw-TZ-RehemaNeural"

AUDIO = {
    "pg007_im002_audio_description_supervisor_v1.mp3": (
        "Michoro inaonyesha wadudu watatu: panzi, buibui na mchwa. "
        "Mwanafunzi achore wadudu hao kwenye kibao."
    ),
    "pg008_im005_audio_description_supervisor_v1.mp3": (
        "Michoro inaonyesha meza, kiti, kikombe chenye mshikio na chupa. "
        "Mwanafunzi achore vitu hivyo kwenye kibao au daftari."
    ),
    "pg008_im001_audio_description_supervisor_v1.mp3": (
        "Mchoro wa mikufu una mistari sita. Kutoka juu kwenda chini inaonyesha "
        "ma, o, u, wa, u na cha zikiwa zimerudiwa. "
        "Mwanafunzi achore mikufu hiyo kwenye kibao."
    ),
}


async def generate(filename: str, text: str) -> None:
    target = AUDIO_DIR / filename
    temporary = target.with_suffix(target.suffix + ".part")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(text, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError(f"Invalid audio generated for {filename}")
    temporary.replace(target)


async def main() -> None:
    await asyncio.gather(*(generate(filename, text) for filename, text in AUDIO.items()))
    print(f"generated {len(AUDIO)} batch-1 audio files")


if __name__ == "__main__":
    asyncio.run(main())
