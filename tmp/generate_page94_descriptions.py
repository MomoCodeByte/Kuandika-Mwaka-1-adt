import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/'content/i18n/sw-TZ/audio'
T={
 'pg094_im001_audio_description':'Mwanamke aliyevaa kitambaa chekundu kichwani anashika jani la mmea wa mahindi. Mwanamume aliyevaa kofia anaangalia mimea kutoka upande mwingine wa shamba.',
 'pg094_im002_audio_description':'Mwanamume na mwanamke wamesimama kwenye udongo mwekundu wakitumia majembe kulima. Nyuma yao kuna mimea ya ndizi, miti na nyumba yenye paa la rangi nyekundu.'}
async def main():
 for n,t in T.items(): await edge_tts.Communicate(t,'sw-TZ-RehemaNeural').save(str(AUDIO/f'{n}.mp3'))
asyncio.run(main())
