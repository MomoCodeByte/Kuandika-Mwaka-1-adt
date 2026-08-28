import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'; VOICE='sw-TZ-RehemaNeural'
T={'pg049_im001_audio_description':'Picha inaonyesha chui mwenye mwili wenye madoa meusi. Mwanafunzi ataje jina la picha, chui, na kuliandika kwenye daftari.','pg049_im002_audio_description':'Picha inaonyesha chura mdogo mwenye miguu minne. Mwanafunzi ataje jina la picha, chura, na kuliandika kwenye daftari.','pg049_im003_audio_description':'Picha inaonyesha chupa ya kioo yenye rangi ya samawati na shingo nyembamba. Mwanafunzi ataje jina la picha, chupa, na kuliandika kwenye daftari.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3')); print(n)
asyncio.run(main())
