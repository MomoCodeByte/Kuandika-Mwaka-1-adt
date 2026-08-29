import asyncio
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'content' / 'i18n' / 'sw-TZ' / 'audio'
VOICE = 'sw-TZ-RehemaNeural'

# Cache-busted page-14 sample files.  The spellings use Swahili syllables so
# Rehema does not read isolated consonant glyphs as English letter names.
TEXTS = {
    'pg014_s001_n0003_sw_v2.mp3': 'Katika sura hii utajifunza kuandika herufi ndogo za konsonanti ba, ma, da, ka, na.',
    'pg014_s002_n0004_sw_v2.mp3': 'ba.',
    'pg014_s002_n0006_sw_v2.mp3': 'Fuatisha herufi ya konsonanti ba.',
    'pg014_s002_n0009_sw_v2.mp3': 'ba, be, bi, bo, bu.',
}


async def main():
    for name, text in TEXTS.items():
        await edge_tts.Communicate(text, VOICE).save(str(AUDIO / name))
        print(name)


asyncio.run(main())
