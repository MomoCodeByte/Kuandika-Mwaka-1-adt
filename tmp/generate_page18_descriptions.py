import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={'pg018_im001_audio_description':'Mchoro unaonyesha silabi da zikirudiwa mara nne kwenye mstari wa mwandiko, kati ya mistari ya kuongoza. Mwanafunzi afuate kila silabi kutoka kushoto kwenda kulia.','pg018_im002_audio_description':'Mchoro unaonyesha herufi ndogo d upande wa kushoto na mifano mitano ya herufi d iliyochorwa kwa nukta upande wa kulia. Mwanafunzi afuate nukta za kila d kutoka juu kwenda chini, kisha aandike d kwenye mstari wa chini.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
