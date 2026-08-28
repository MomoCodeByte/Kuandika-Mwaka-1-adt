import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={
 'pg082_s001_n0001':'Mfano wa konsonanti. ngw. ndw. mbw. njw. chw. nyw. shw.',
 'pg082_s001_n0004':'ngw na i zinaunda silabi ngwi.',
 'pg082_s001_n0008':'Unda silabi kwa kutumia konsonanti. ngw. ndw. mbw. njw. chw. nyw. shw. na irabu. u. e. i. o. a.',
 'pg082_s002_n0003':'Katika somo hili utaunda maneno kwa kutumia herufi ambatani. ngw. ndw. mbw. njw. chw. nyw. shw. na irabu. a. e. i. o. u.',
 'pg082_s002_n0007':'chungwa. nywesha. mbwembwe. mchwa.',
 'pg082_s002_n0008':'chu na ngwa zinaunda neno chungwa.',
 'pg082_s002_n0012':'Unda maneno yenye konsonanti ambatani ngw na chw na irabu. a. e. i. o. u.'}
async def main():
 for n,t in T.items():
  await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
  print(n)
asyncio.run(main())
