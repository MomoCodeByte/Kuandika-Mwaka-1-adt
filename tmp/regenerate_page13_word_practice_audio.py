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
    / "pg013_im002_audio_description_supervisor_v2.mp3"
)
VOICE = "sw-TZ-RehemaNeural"
TEXT = (
    "Zoezi lina sehemu tatu. "
    "Sehemu ya kwanza: mstari wa juu una mfano wa neno ua uliorudiwa. "
    "Fuata mfano huo, kisha andika neno ua kwenye mstari wa chini. "
    "Sehemu ya pili: mstari wa juu una mfano wa neno oa uliorudiwa. "
    "Fuata mfano huo, kisha andika neno oa kwenye mstari wa chini. "
    "Sehemu ya tatu: mstari wa juu una mfano wa neno au uliorudiwa. "
    "Fuata mfano huo, kisha andika neno au kwenye mstari wa chini."
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
