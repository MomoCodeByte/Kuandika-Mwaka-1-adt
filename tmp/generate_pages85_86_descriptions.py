import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={'pg085_im001_audio_description':'Mchoro una mistari minne ya mwandiko wa kuunga. Mstari wa kwanza una herufi ndogo a zinazorudiwa. Mstari wa pili una ch, wa tatu d, na wa nne m; herufi zinaungana kutoka kushoto kwenda kulia.','pg086_im001_audio_description':'Mchoro una mistari mitatu ya mwandiko wa kuunga. Mstari wa kwanza una me zinazorudiwa, wa pili ne, na wa tatu na. Nakili kila silabi kutoka kushoto kwenda kulia.','pg086_im002_audio_description':'Mchoro una maneno sita kwenye mistari ya mwandiko wa kuunga: tembo, bege, ondoa, kondoo, papai na kitanda. Soma neno moja baada ya jingine kutoka kushoto kwenda kulia, kisha yanakili.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
asyncio.run(main())
