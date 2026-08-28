import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"
TEXTS = {
    "pg013_s001_n0001": "Andika herufi ya irabu u kwenye daftari.",
    "pg013_im001_audio_description": "Picha inaonyesha ua lenye petali nyingi za rangi ya zambarau, likiwa na shina na majani ya kijani. Mwanafunzi ataje jina la picha, ua, kisha aliandike kwenye daftari.",
    "pg013_im002_audio_description": "Mchoro unaonyesha mistari ya mwandiko yenye vikundi vitatu vya silabi: ua, oa na au. Kila kikundi kimerudiwa mara tano kutoka kushoto kwenda kulia. Mwanafunzi aandike silabi hizo kwenye daftari.",
}

async def main():
    for name, text in TEXTS.items():
        await edge_tts.Communicate(text, VOICE).save(str(AUDIO / f"{name}.mp3"))
        print(name)

asyncio.run(main())
