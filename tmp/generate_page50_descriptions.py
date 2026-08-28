import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T={'pg050_im001_audio_description':'Picha inaonyesha meza ya mbao yenye matunda juu yake: nanasi, machungwa, maembe na ndizi. Mwanafunzi ataje vitu anavyovisikia na kujifunza majina yake.','pg050_im002_audio_description':'Picha inaonyesha mazingira ya savana yenye chui amelala juu ya tawi la mti, tembo wawili chini, na wanyama wengine kama pundamilia na swala kwenye nyasi. Mwanafunzi ataje wanyama anaowaona kwenye picha.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
