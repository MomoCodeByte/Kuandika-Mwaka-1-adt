import asyncio
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TARGET = (
    ROOT
    / "content"
    / "i18n"
    / "sw-TZ"
    / "audio"
    / "pg013_im002_audio_description_supervisor_v5.mp3"
)
INTRO_TARGET = TARGET.parent / "pg013_s001_n0005_supervisor_v2.mp3"
VOICE = "sw-TZ-RehemaNeural"
TEXT = (
    "Andika maneno haya kwenye daftari. "
    "Mstari wa kwanza una maneno: ua, ua, ua, ua, ua. "
    "Neno ua lina herufi u ikifuatiwa na a. Andika neno ua mara tano kwenye daftari. "
    "Mstari wa pili una maneno: oa, oa, oa, oa, oa. "
    "Neno oa lina herufi o ikifuatiwa na a. Andika neno oa mara tano kwenye daftari. "
    "Mstari wa tatu una maneno: au, au, au, au, au. "
    "Neno au lina herufi a ikifuatiwa na u. Andika neno au mara tano kwenye daftari."
)
INTRO_TEXT = "ua, oa na au."


async def generate(text: str, target: Path) -> None:
    temporary = target.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(text, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError(f"Sauti haikutengenezwa: {target.name}")
    temporary.replace(target)
    print(target.name)


async def main() -> None:
    await generate(INTRO_TEXT, INTRO_TARGET)
    await generate(TEXT, TARGET)


if __name__ == "__main__":
    asyncio.run(main())
