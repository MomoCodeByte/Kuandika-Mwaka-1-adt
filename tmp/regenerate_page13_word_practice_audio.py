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
    / "pg013_im002_audio_description_supervisor_v3.mp3"
)
VOICE = "sw-TZ-RehemaNeural"
TEXT = (
    "Andika maneno haya kwenye daftari. Zoezi lina sehemu tatu. "
    "Sehemu ya kwanza ni neno ua. Kwenye mstari wa juu, neno ua limeandikwa mara tano kama mfano. "
    "Kwenye mstari unaofuata, fuatilia neno ua lenye rangi hafifu. "
    "Baada ya hapo, andika neno ua mwenyewe kwenye mistari iliyo wazi chini. "
    "Sehemu ya pili ni neno oa. Kwenye mstari wa juu, neno oa limeandikwa mara tano kama mfano. "
    "Kwenye mstari unaofuata, fuatilia neno oa lenye rangi hafifu. "
    "Baada ya hapo, andika neno oa mwenyewe kwenye mistari iliyo wazi chini. "
    "Sehemu ya tatu ni neno au. Kwenye mstari wa juu, neno au limeandikwa mara tano kama mfano. "
    "Kwenye mstari unaofuata, fuatilia neno au lenye rangi hafifu. "
    "Baada ya hapo, andika neno au mwenyewe kwenye mistari iliyo wazi chini."
)


async def main() -> None:
    temporary = TARGET.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(TEXT, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError("Sauti ya maelekezo ya ukurasa wa 13 haikutengenezwa.")
    temporary.replace(TARGET)
    print(TARGET.name)


if __name__ == "__main__":
    asyncio.run(main())
