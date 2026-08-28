import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T={'pg045_im001_audio_description':'Mchoro wa mazoezi ya konsonanti W unaonyesha mstari wa mwandiko wenye herufi ndogo w zinazorudiwa. Chini yake kuna mfano wa kufuatisha herufi kubwa W, kuandika W kwenye daftari, silabi wa, we, wi, wo, wu, na maneno wewe, wao, weka, wino na wema. Mwanafunzi afuate na kuandika kutoka kushoto kwenda kulia.','pg045_im002_audio_description':'Mchoro unaonyesha herufi kubwa W ya kufuatisha, kisha mstari wa kuandika W, silabi wa, we, wi, wo, wu, na maneno ya mfano.','pg045_im003_audio_description':'Mchoro unaonyesha silabi wa, we, wi, wo na wu, pamoja na maneno wewe, wao, weka, wino na wema. Mwanafunzi ayasome na kuyaandika kwenye daftari.','pg045_im004_audio_description':'Mchoro unaonyesha maneno wewe, wao, weka, wino na wema kwenye mstari wa mwandiko. Mwanafunzi ayasome na kuyaandika kwenye daftari.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
