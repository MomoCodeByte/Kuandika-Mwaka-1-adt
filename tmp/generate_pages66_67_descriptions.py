import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'
items={
'pg066_im001_audio_description':'Mchoro unaonyesha herufi kubwa P na mifano yake iliyochorwa kwa nukta kwenye mistari ya mwandiko. Fuatisha kila P kutoka kushoto kwenda kulia, kisha andika P mwenyewe.',
'pg066_im002_audio_description':'Mchoro unaonyesha majina ya mfano kwenye mistari ya daftari. Soma kila jina moja baada ya jingine, kisha yanakili.',
'pg066_im003_audio_description':'Mchoro unaonyesha sentensi za mfano kwenye mistari ya mwandiko. Soma sentensi moja baada ya nyingine, kisha ziandike kwenye daftari.',
'pg067_im001_audio_description':'Mchoro unaonyesha herufi kubwa S pamoja na mifano ya S yenye nukta kwenye mistari ya mwandiko. Fuatisha umbo la S, kisha liandike mwenyewe.',
'pg067_im002_audio_description':'Mchoro unaonyesha majina ya mfano yaliyoandikwa kwenye mistari ya mwandiko wa kuunga. Soma na nakili kila jina.',
'pg067_im003_audio_description':'Mchoro unaonyesha sentensi za mfano kwenye mistari ya mwandiko wa kuunga. Soma na nakili sentensi moja baada ya nyingine.'}
async def main():
    for key,text in items.items(): await edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{key}.mp3'))
asyncio.run(main())
