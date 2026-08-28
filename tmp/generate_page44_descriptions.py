import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={'pg044_im001_audio_description':'Picha inaonyesha noti ya shilingi elfu moja ya Tanzania yenye rangi za bluu na zambarau, ikiwa na picha ya mtu katikati. Mwanafunzi ataje jina la picha, noti, na kuliandika kwenye daftari.','pg044_im002_audio_description':'Picha inaonyesha sarafu ya Tanzania ya mviringo yenye uso wa mtu katikati. Mwanafunzi ataje jina la picha, sarafu, na kuliandika kwenye daftari.','pg044_im003_audio_description':'Picha inaonyesha hema la kijani lililofunguliwa mbele na kusimama juu ya ardhi. Mwanafunzi ataje jina la picha, hema, na kuliandika kwenye daftari.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
