import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={
 'pg095_im001_audio_description':'Picha ya kwanza: Wanafunzi wawili wenye mabegi wamesimama kando ya barabara wakisubiri basi linalokaribia.',
 'pg095_im002_audio_description':'Picha ya pili: Basi limefika kituoni. Dereva yuko mbele, abiria wanasubiri ndani na mtu anashuka; askari wa usalama anaangalia basi.',
 'pg095_im003_audio_description':'Picha ya tatu: Basi limesimama karibu na jengo lenye maandishi KITUO CHA POLISI. Askari na wanaume wawili wanatembea kuelekea kituoni.'}
async def main():
 for n,t in T.items():
  await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
asyncio.run(main())
