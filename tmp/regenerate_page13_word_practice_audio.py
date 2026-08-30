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
    / "pg013_im002_audio_description_supervisor_v4.mp3"
)
VOICE = "sw-TZ-RehemaNeural"
TEXT = (
    "Andika maneno haya kwenye daftari. Zoezi lina sehemu tatu. "
    "Sehemu ya kwanza. Mstari wa mfano unasomeka: ua, ua, ua, ua, ua. "
    "Kwenye mstari unaofuata, fuatilia neno ua lenye rangi hafifu. "
    "Kisha andika neno ua mwenyewe kwenye mistari iliyo wazi chini. "
    "Sehemu ya pili. Mstari wa mfano unasomeka: oa, oa, oa, oa, oa. "
    "Kwenye mstari unaofuata, fuatilia neno oa lenye rangi hafifu. "
    "Kisha andika neno oa mwenyewe kwenye mistari iliyo wazi chini. "
    "Sehemu ya tatu. Mstari wa mfano unasomeka: au, au, au, au, au. "
    "Kwenye mstari unaofuata, fuatilia neno au lenye rangi hafifu. "
    "Kisha andika neno au mwenyewe kwenye mistari iliyo wazi chini."
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
