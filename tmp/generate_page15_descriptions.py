import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={
 'pg015_im001_audio_description':'Picha inaonyesha bibi akitembea akisaidiwa na fimbo. Mwanafunzi ataje jina la picha, bibi, na kuliandika kwenye daftari.',
 'pg015_im002_audio_description':'Picha inaonyesha babu akitembea akisaidiwa na fimbo. Mwanafunzi ataje jina la picha, babu, na kuliandika kwenye daftari.',
 'pg015_im003_audio_description':'Picha inaonyesha ubao wa mchezo wa bao wenye mashimo na kete. Mwanafunzi ataje jina la picha, bao, na kuliandika kwenye daftari.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
