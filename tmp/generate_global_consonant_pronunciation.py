import asyncio, json, re
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
TEXTS = json.loads((ROOT/'content/i18n/sw-TZ/texts.json').read_text(encoding='utf-8'))
AUDIOS = json.loads((ROOT/'content/i18n/sw-TZ/audios.json').read_text(encoding='utf-8'))
OUT = ROOT/'content/i18n/sw-TZ/audio'
NAMES = {'b':'bee','c':'see','d':'dee','f':'fee','g':'gee','h':'haa','j':'jee','k':'kaa','l':'lee','m':'mee','n':'nee','p':'pee','r':'ree','s':'see','t':'tee','v':'vee','w':'wee','y':'yee','z':'zee'}
VOWELS = {'a':'aaa','e':'eee','i':'iii','o':'ooo','u':'uuu'}

def spoken(text):
    # Expand isolated letters and leave ordinary words untouched.
    def repl(m):
        token=m.group(0); low=token.lower()
        if low in NAMES: return NAMES[low]
        if low in VOWELS: return VOWELS[low]
        return token
    text = re.sub(r'(?<![A-Za-z])[A-Za-z](?![A-Za-z])', repl, text)
    # Make listed consonants clearly sequential for Rehema.
    text = re.sub(r'(?i)(konsonanti\s+)(?=(?:[a-z]+(?:\s+|[.,])){2,})', r'\\1', text)
    text = text.replace(' ngw ', ' en-gee-wee ').replace(' ndu ', ' en-dee-uu ').replace(' mb ', ' em-bee ')
    return text

items=[]
for key,text in TEXTS.items():
    if key not in AUDIOS or key.endswith('_audio_description'):
        continue
    if re.search(r'(?i)(herufi|konsonanti|irabu|[\s])(?<![A-Za-z])[b-df-hj-np-tv-z](?![A-Za-z])', text):
        items.append((key, spoken(text)))

async def one(key, text, sem):
    async with sem:
        await edge_tts.Communicate(text, 'sw-TZ-RehemaNeural').save(str(OUT/f'{key}.mp3'))

async def main():
    sem=asyncio.Semaphore(8)
    await asyncio.gather(*(one(k,t,sem) for k,t in items))
    print(f'generated {len(items)} consonant-aware audio files')

asyncio.run(main())
