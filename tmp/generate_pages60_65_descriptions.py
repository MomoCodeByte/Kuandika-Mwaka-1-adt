import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'content/i18n/sw-TZ/audio'
items = {
 'pg060_im001_audio_description': 'Mchoro unaonyesha herufi kubwa K upande wa kushoto na mifano ya herufi K iliyochorwa kwa nukta kwenye mistari ya mwandiko upande wa kulia. Fuatisha kila mfano kutoka juu kwenda chini, kisha andika K kwenye mstari unaofuata.',
 'pg060_im002_audio_description': 'Mchoro unaonyesha majina ya mfano yaliyoandikwa kwa mwandiko wa kuunga kwenye mistari ya daftari. Soma jina moja baada ya jingine, kisha yanakili kwenye daftari.',
 'pg060_im003_audio_description': 'Mchoro unaonyesha sentensi za mfano kwenye mistari ya daftari. Soma sentensi moja baada ya nyingine kutoka kushoto kwenda kulia, kisha ziandike kwenye daftari.',
 'pg061_im001_audio_description': 'Mchoro unaonyesha herufi kubwa N na mifano yake iliyochorwa kwa nukta kwenye mistari ya mwandiko. Fuatisha mifano kutoka kushoto kwenda kulia, kisha andika N mwenyewe.',
 'pg061_im002_audio_description': 'Mchoro unaonyesha majina ya mfano kwenye mistari ya daftari. Soma kila jina, kisha nakili majina hayo kwa mwandiko wa kuunga.',
 'pg061_im003_audio_description': 'Mchoro unaonyesha sentensi za mfano kwenye mistari ya daftari. Soma sentensi moja baada ya nyingine, kisha ziandike kwa mwandiko wa kuunga.',
 'pg064_im001_audio_description': 'Mchoro unaonyesha herufi kubwa L pamoja na mifano ya L yenye nukta kwenye mistari ya mwandiko. Fuatisha umbo la L, kisha liandike kwenye mstari unaofuata.',
 'pg064_im002_audio_description': 'Mchoro unaonyesha majina ya mfano yaliyoandikwa kwenye mistari ya mwandiko wa kuunga. Soma na nakili kila jina kwenye daftari.',
 'pg064_im003_audio_description': 'Mchoro unaonyesha sentensi za mfano kwenye mistari ya mwandiko wa kuunga. Soma sentensi moja baada ya nyingine, kisha ziandike kwenye daftari.',
 'pg065_im001_audio_description': 'Mchoro unaonyesha herufi kubwa T na mifano ya T iliyochorwa kwa nukta. Fuatisha kila T kwenye mistari, kisha andika T mwenyewe.',
 'pg065_im002_audio_description': 'Mchoro unaonyesha majina ya mfano kwenye mistari ya mwandiko wa kuunga. Soma majina hayo na uyakili kwenye daftari.',
 'pg065_im003_audio_description': 'Mchoro unaonyesha mistari ya daftari iliyo wazi kwa mwanafunzi kuandika majibu ya zoezi.'
}

async def main():
    for key, text in items.items():
        await edge_tts.Communicate(text, 'sw-TZ-RehemaNeural').save(str(AUDIO / f'{key}.mp3'))

asyncio.run(main())
