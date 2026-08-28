import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={
 'pg017_im001_audio_description':'Picha inaonyesha kipande cha muwa, mmea mtamu wenye umbo refu. Mwanafunzi ataje jina la picha, muwa, na kuliandika kwenye daftari.',
 'pg017_im002_audio_description':'Picha inaonyesha uma wa chakula wenye mpini na meno yake. Mwanafunzi ataje jina la picha, uma, na kuliandika kwenye daftari.',
 'pg017_im003_audio_description':'Picha inaonyesha mashada ya maua mekundu yaliyokusanywa pamoja. Mwanafunzi ataje jina la picha, maua, na kuliandika kwenye daftari.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
