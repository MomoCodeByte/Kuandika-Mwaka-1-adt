import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={
 'pg080_s001_n0006':'Kuandika herufi ambatani. sh. ny. ng. nd. th. mb.',
 'pg080_s001_n0007':'kw. gw. sw. vy. ngw. ndw. njw.',
 'pg080_s002_n0007':'Mfano wa konsonanti. sh. ny. ng. nd. th. mb. kw. gw.',
 'pg080_s002_n0008':'sw. vy. ngw. na irabu. e. o. i. u. a.'}
async def main():
 for n,t in T.items():
  await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
  print(n)
asyncio.run(main())
