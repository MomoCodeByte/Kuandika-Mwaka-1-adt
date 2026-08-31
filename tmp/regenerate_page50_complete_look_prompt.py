import asyncio
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "content/i18n/sw-TZ/audio/pg050_s001_n0002_supervisor_v4.mp3"
VOICE = "sw-TZ-RehemaNeural"
SPEECH = "Tazama na chunguza picha hizi kisha jibu maswali yanayofuata kwa kila picha."


async def main() -> None:
    temporary = TARGET.with_suffix(".part.mp3")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(SPEECH, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError("Sauti kamili ya maelekezo ya ukurasa wa 50 haikutengenezwa")
    temporary.replace(TARGET)
    print(TARGET.name)


if __name__ == "__main__":
    asyncio.run(main())
