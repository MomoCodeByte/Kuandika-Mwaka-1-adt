import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"
TEXTS = {
    "pg011_im001_audio_description": "Mchoro unaonyesha mstari wa mazoezi wenye herufi ndogo i zinazorudiwa kutoka kushoto kwenda kulia, kati ya mstari wa juu, wa katikati na wa chini. Mwanafunzi afuate mwendo wa kila herufi i kwenye mstari huo.",
    "pg011_im002_audio_description": "Mchoro unaonyesha mstari wa mazoezi wenye herufi ndogo o zinazorudiwa kutoka kushoto kwenda kulia, kati ya mistari ya kuongoza. Mwanafunzi afuate mzunguko wa kila herufi o kwenye mstari huo.",
    "pg011_im003_audio_description": "Mchoro unaonyesha herufi kubwa i upande wa kushoto na mifano mitano ya herufi ndogo i zilizochorwa kwa alama za nukta upande wa kulia. Mwanafunzi aanzie kwenye nukta ya juu, afuate umbo la kila herufi i kutoka juu kwenda chini, kisha aandike herufi i kwenye mstari wa chini.",
}

async def main():
    for name, text in TEXTS.items():
        await edge_tts.Communicate(text, VOICE).save(str(AUDIO / f"{name}.mp3"))
        print(name)

asyncio.run(main())
