import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
asyncio.run(edge_tts.Communicate('Chora mchoro huu kwenye daftari.', 'sw-TZ-RehemaNeural').save(str(ROOT/'content/i18n/sw-TZ/audio/pg009_s002_n0006.mp3')))
