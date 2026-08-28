import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={
 'pg016_im001_audio_description':'Mchoro unaonyesha herufi ndogo m zikirudiwa kwenye mstari wa mwandiko kutoka kushoto kwenda kulia, kati ya mistari ya kuongoza. Mwanafunzi afuate mwendo wa kila herufi m.',
 'pg016_im002_audio_description':'Mchoro unaonyesha silabi ma, me, mi, mo na mu zikiwa kwenye mstari wa mwandiko kutoka kushoto kwenda kulia. Mwanafunzi azisome na kuziandika kwenye daftari.',
 'pg016_im003_audio_description':'Mchoro unaonyesha maneno mama, mimi, memo, mia na mea kwenye mstari wa mwandiko kutoka kushoto kwenda kulia. Mwanafunzi ayasome na kuyaandika kwenye daftari.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
