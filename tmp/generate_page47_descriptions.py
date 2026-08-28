import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T='Picha inaonyesha kiti cha mbao chenye sehemu ya kukalia, mgongo na miguu. Mwanafunzi ataje jina la picha, kiti, na kuliandika kwenye daftari.'
async def main():
 for i in (1,2,3): await edge_tts.Communicate(T,VOICE).save(str(AUDIO/f'pg047_im00{i}_audio_description.mp3')); print(i)
asyncio.run(main())
