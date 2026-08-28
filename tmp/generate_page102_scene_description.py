import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
text='Mchoro unaonyesha wanaume wawili na mwanamke wakizungumza. Mwanamume aliye kushoto anauliza kwa nini hawakuonana kwenye sherehe; mwanamume aliye kulia amebeba fimbo begani na anaeleza kuwa alizuiwa na majukumu. Chini, wanaendelea kuzungumza kuhusu mambo yaliyotokea. Soma mazungumzo na tambua alama za uandishi kwenye sentensi.'
asyncio.run(edge_tts.Communicate(text,'sw-TZ-RehemaNeural').save(str(ROOT/'content/i18n/sw-TZ/audio/pg102_original_layout_audio_description.mp3')))
