import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
TEXTS={
 'pg019_im001_audio_description':'Picha inaonyesha dawati la shule lenye sehemu ya kuandikia na sehemu ya kukalia. Mwanafunzi ataje jina la picha, dawati, na kuliandika kwenye daftari.',
 'pg019_im002_audio_description':'Picha inaonyesha dumu la plastiki lenye rangi ya manjano. Mwanafunzi ataje jina la picha, dumu, na kuliandika kwenye daftari.',
 'pg019_im003_audio_description':'Picha inaonyesha sifongo ya asili yenye umbo refu la mviringo. Mwanafunzi ataje jina la picha, sifongo, na kuliandika kwenye daftari.'}
async def main():
 for n,t in TEXTS.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
