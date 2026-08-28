import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T={1:'Picha inaonyesha kiti chekundu chenye sehemu ya kukalia na mgongo. Mwanafunzi ataje jina la picha, kiti, na kuliandika kwenye daftari.',2:'Picha inaonyesha kiti cha kupumzikia cha rangi ya kijani. Mwanafunzi ataje jina la picha, kiti, na kuliandika kwenye daftari.',3:'Picha inaonyesha meza ya kutumia nyumbani. Mwanafunzi ataje jina la picha, meza, na kuliandika kwenye daftari.',4:'Picha inaonyesha bakuli lenye rangi ya zambarau. Mwanafunzi ataje jina la picha, bakuli, na kuliandika kwenye daftari.',5:'Picha inaonyesha sahani yenye rangi ya waridi. Mwanafunzi ataje jina la picha, sahani, na kuliandika kwenye daftari.',6:'Picha inaonyesha kijiko cha kula. Mwanafunzi ataje jina la picha, kijiko, na kuliandika kwenye daftari.'}
async def main():
 for i,t in T.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'pg051_im00{i}_audio_description.mp3')); print(i)
asyncio.run(main())
