import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T={'pg046_im001_audio_description':'Mchoro unaonyesha herufi ndogo v zikirudiwa kwenye mstari wa mwandiko kutoka kushoto kwenda kulia, kati ya mistari ya kuongoza. Mwanafunzi afuate mwendo wa kila herufi v.','pg046_im002_audio_description':'Mchoro unaonyesha herufi kubwa V upande wa kushoto na mifano mitano ya herufi V iliyochorwa kwa nukta upande wa kulia. Mwanafunzi afuate nukta kutoka juu hadi chini, kisha aandike V kwenye mstari wa chini.','pg046_im003_audio_description':'Mchoro unaonyesha silabi va, ve, vi, vo na vu kwenye mstari wa mwandiko kutoka kushoto kwenda kulia. Mwanafunzi azisome na kuziandika kwenye daftari.','pg046_im004_audio_description':'Mchoro unaonyesha maneno vada, vuna, vivo, vamia na vuma kwenye mstari wa mwandiko. Mwanafunzi ayasome na kuyaandika kwenye daftari.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
