import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={
 'pg069_im001_audio_description':'Herufi kubwa J iko upande wa kushoto na mifano ya herufi J za kufuatisha kwenye mistari ya mwandiko.',
 'pg069_im002_audio_description':'Mifano ya majina yanayoanza kwa herufi J imeandikwa kwenye mstari wa mwandiko.',
 'pg069_im003_audio_description':'Mifano ya sentensi zenye herufi J imeandikwa kwenye mistari ya mwandiko.',
 'pg071_im001_audio_description':'Herufi kubwa G iko upande wa kushoto na mifano ya herufi G za kufuatisha kwenye mistari ya mwandiko.',
 'pg071_im002_audio_description':'Mifano ya majina yanayoanza kwa herufi G imeandikwa kwenye mstari wa mwandiko.',
 'pg072_im001_audio_description':'Mifano ya sentensi zenye herufi Y imeandikwa kwenye mistari ya mwandiko.',
 'pg072_im002_audio_description':'Herufi kubwa Y iko upande wa kushoto na mifano ya herufi Y za kufuatisha kwenye mistari ya mwandiko.',
 'pg072_im003_audio_description':'Mifano ya majina yanayoanza kwa herufi Y imeandikwa kwenye mstari wa mwandiko.',
 'pg074_im001_audio_description':'Herufi kubwa R iko upande wa kushoto na mifano ya herufi R za kufuatisha kwenye mistari ya mwandiko.',
 'pg074_im002_audio_description':'Mifano ya majina yanayoanza kwa herufi R imeandikwa kwenye mstari wa mwandiko.',
 'pg074_im003_audio_description':'Mifano ya sentensi zenye herufi R imeandikwa kwenye mistari ya mwandiko.',
 'pg076_im001_audio_description':'Herufi kubwa W iko upande wa kushoto na mifano ya herufi W za kufuatisha kwenye mistari ya mwandiko.',
 'pg076_im002_audio_description':'Mifano ya majina yanayoanza kwa herufi W imeandikwa kwenye mstari wa mwandiko.',
 'pg076_im003_audio_description':'Mifano ya sentensi zenye herufi W imeandikwa kwenye mistari ya mwandiko.',
 'pg077_im001_audio_description':'Herufi kubwa V iko upande wa kushoto na mifano ya herufi V za kufuatisha kwenye mistari ya mwandiko.'}
async def main():
 for n,t in T.items():
  await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
  print(n)
asyncio.run(main())
