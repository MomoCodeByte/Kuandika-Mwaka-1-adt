import asyncio
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
asyncio.run(edge_tts.Communicate('Picha inaonyesha jiko la mkaa, jiko dogo la kupikia linalotumia mkaa. Mwanafunzi ataje jina la picha, jiko la mkaa, na kuliandika kwenye daftari.','sw-TZ-RehemaNeural').save(str(ROOT/'content/i18n/sw-TZ/audio/pg034_im001_audio_description.mp3')))
