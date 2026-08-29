import asyncio
import json
import os
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
VOICE = "sw-TZ-RehemaNeural"

SPOKEN = {
    "pg017_s001_n0004": (
        "Katika kila neno kuna nafasi tupu iliyoonyeshwa kwa mstari. "
        "Sikiliza herufi zilizo kabla na baada ya nafasi tupu. "
        "Chagua irabu aaa, eee, iii, ooo, au uuu inayokamilisha neno. "
        "Kisha iandike kwenye nafasi tupu."
    ),
    "pg017_s001_n0005": (
        "Swali la kwanza. Kuna herufi ma, nafasi tupu, kisha herufi ma na irabu aaa. "
        "Andika irabu inayokosekana kwenye nafasi tupu."
    ),
    "pg017_s001_n0006": (
        "Swali la pili. Kuna herufi ma, irabu eee, herufi ma, kisha nafasi tupu. "
        "Andika irabu inayokosekana kwenye nafasi tupu."
    ),
    "pg017_s001_n0007": (
        "Swali la tatu. Kuna herufi ma, nafasi tupu, kisha herufi ba na irabu aaa. "
        "Andika irabu inayokosekana kwenye nafasi tupu."
    ),
    "pg017_s001_n0008": (
        "Swali la nne. Kuna herufi ba na irabu aaa, kisha nafasi tupu. "
        "Andika irabu inayokosekana kwenye nafasi tupu."
    ),
    "pg017_s001_n0009": (
        "Swali la tano. Kuna herufi ma na irabu aaa, nafasi tupu, kisha irabu aaa. "
        "Andika irabu inayokosekana kwenye nafasi tupu."
    ),
}


async def generate(item_id: str, spoken_text: str) -> tuple[str, str]:
    filename = f"{item_id}_sw_accessible_vowel_guidance_v1.mp3"
    target = AUDIO_DIR / filename
    temporary = target.with_suffix(target.suffix + ".part")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(spoken_text, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size <= 1024:
        raise RuntimeError(f"Invalid audio generated for {item_id}")
    os.replace(temporary, target)
    return item_id, filename


async def main() -> None:
    results = await asyncio.gather(*(generate(item_id, text) for item_id, text in SPOKEN.items()))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    audios.update(dict(results))
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"generated={len(results)}")


if __name__ == "__main__":
    asyncio.run(main())
