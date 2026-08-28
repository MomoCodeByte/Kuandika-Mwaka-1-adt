import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"
TEXTS = {
    "pg012_im001_audio_description": "Mchoro unaonyesha mstari wa mazoezi wenye herufi ndogo u zinazorudiwa kutoka kushoto kwenda kulia, kati ya mistari ya kuongoza. Mwanafunzi afuate mwendo wa kila herufi u kwenye mstari huo.",
    "pg012_im002_audio_description": "Mchoro unaonyesha herufi kubwa o upande wa kushoto na mifano mitano ya herufi ndogo o zilizochorwa kwa alama za nukta upande wa kulia. Mwanafunzi aanzie juu ya kila mfano, afuate mzunguko wa herufi o kutoka kushoto kwenda kulia, kisha aandike herufi o kwenye mstari wa chini.",
    "pg012_im003_audio_description": "Mchoro unaonyesha herufi kubwa u upande wa kushoto na mifano mitano ya herufi ndogo u zilizochorwa kwa alama za nukta upande wa kulia. Mwanafunzi aanzie kwenye nukta ya juu, afuate umbo la kila herufi u kutoka kushoto kwenda kulia, kisha aandike herufi u kwenye mstari wa chini.",
}

async def main():
    for name, text in TEXTS.items():
        await edge_tts.Communicate(text, VOICE).save(str(AUDIO / f"{name}.mp3"))
        print(name)

asyncio.run(main())
