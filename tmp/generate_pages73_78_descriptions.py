import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'
items={
'pg073_im001_audio_description':'Mchoro unaonyesha herufi kubwa Z pamoja na mifano ya Z yenye nukta kwenye mistari ya mwandiko. Fuatisha kila Z kutoka kushoto kwenda kulia, kisha andika Z mwenyewe.',
'pg073_im002_audio_description':'Mchoro unaonyesha majina ya mfano kwenye mistari ya daftari. Soma kila jina, kisha yanakili kwa mwandiko wa kuunga.',
'pg075_im002_audio_description':'Mchoro unaonyesha herufi kubwa H pamoja na mifano ya H yenye nukta kwenye mistari ya mwandiko. Fuatisha mistari ya kila H, kisha andika H.',
'pg075_im003_audio_description':'Mchoro unaonyesha majina ya mfano kwenye mistari ya mwandiko wa kuunga. Soma na nakili kila jina.',
'pg075_im004_audio_description':'Mchoro unaonyesha sentensi za mfano kwenye mistari ya mwandiko wa kuunga. Soma sentensi moja baada ya nyingine, kisha ziandike.',
'pg078_im001_audio_description':'Mchoro unaonyesha majina ya mfano yanayoanza kwa sauti CH kwenye mistari ya mwandiko. Soma jina moja baada ya jingine, kisha yanakili.',
'pg078_im003_audio_description':'Mchoro unaonyesha konsonanti CH na mifano yake yenye nukta kwenye mistari ya mwandiko. Fuatisha CH kutoka kushoto kwenda kulia, kisha iandike.'}
async def main():
    for key,text in items.items(): await edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{key}.mp3'))
asyncio.run(main())
