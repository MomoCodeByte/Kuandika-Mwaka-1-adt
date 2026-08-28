import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]; AUDIO=ROOT/'content/i18n/sw-TZ/audio'
items={'pg068_im002_audio_description':'Mchoro unaonyesha sehemu tatu za mazoezi: herufi F ya kunakili, majina ya mfano, na sentensi za mfano. Vyote vimepangwa kwenye mistari ya mwandiko wa kuunga; soma kutoka juu kwenda chini kisha nakili.','pg068_im003_audio_description':'Mchoro unaonyesha majina ya mfano kwenye mistari ya mwandiko wa kuunga. Soma jina moja baada ya jingine, kisha yanakili.','pg068_im004_audio_description':'Mchoro unaonyesha sentensi za mfano kwenye mistari ya mwandiko wa kuunga. Soma sentensi moja baada ya nyingine, kisha ziandike.'}
async def main():
    for key,text in items.items(): await edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{key}.mp3'))
asyncio.run(main())
