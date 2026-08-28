import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'
items={'pg052_im001_audio_description':'Mchoro unaonyesha herufi kubwa A pamoja na mifano ya A yenye nukta kwenye mistari ya mwandiko. Fuatisha kila A kutoka kushoto kwenda kulia, kisha andika A mwenyewe.','pg053_im001_audio_description':'Mchoro unaonyesha herufi kubwa E pamoja na mifano ya E yenye nukta kwenye mistari ya mwandiko. Fuatisha kila E, kisha andika E mwenyewe.','pg055_im001_audio_description':'Mchoro unaonyesha herufi kubwa O pamoja na mifano ya O yenye nukta kwenye mistari ya mwandiko. Fuatisha mzunguko wa kila O, kisha andika O.','pg056_im001_audio_description':'Mchoro unaonyesha herufi kubwa U pamoja na mifano ya U yenye nukta kwenye mistari ya mwandiko. Fuatisha kila U kutoka juu kwenda chini, kisha andika U.'}
async def main():
    for key,text in items.items(): await edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{key}.mp3'))
asyncio.run(main())
