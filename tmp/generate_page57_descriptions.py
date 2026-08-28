import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
VOICE='sw-TZ-RehemaNeural'
T={
 'pg057_im001_audio_description':'Herufi kubwa B iko upande wa kushoto. Upande wa kulia kuna herufi B sita zilizochorwa kwa nukta kati ya mistari ya mwandiko; fuatisha kila B kutoka kushoto kwenda kulia.',
 'pg057_im002_audio_description':'Mstari unaonyesha majina Beda, Bukoba, Benedeta na Baraka. Soma kila jina kutoka kushoto kwenda kulia, kisha liandike kwenye daftari.'}
async def main():
 for n,t in T.items():
  await edge_tts.Communicate(t,VOICE).save(str(AUDIO/f'{n}.mp3'))
  print(n)
asyncio.run(main())
