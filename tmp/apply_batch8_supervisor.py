import asyncio
import html
import json
import os
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content/i18n/sw-TZ/texts.json"
AUDIOS_PATH = ROOT / "content/i18n/sw-TZ/audios.json"
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
VOICE = "sw-TZ-RehemaNeural"

MARIA_STORY = (
    "Shangazi yangu anaitwa Maria. Anafundisha katika shule ya Nyamakongo. "
    "Shangazi akitoka shuleni, anapenda kulisha kuku wake bandani. "
    "Shangazi ana kuku wengi sana. Kabla ya kuwalisha, huanza kuokota mayai. "
    "Shangazi anawapenda sana kuku wake."
)

SCENE_VISIBLE = (
    "Picha ina sehemu mbili za mazungumzo ya watu watatu. Sehemu ya kwanza: mume na mke "
    "wanakutana na rafiki yao aliyetoka shambani akiwa amebeba jembe begani. Mume anauliza, "
    "“Eh bwana! Mbona hatukukuona kwenye sherehe?” Rafiki anajibu, “Nilishindwa kuja, "
    "nilikuwa napalilia mahindi, mtama na mbaazi.” Sehemu ya pili: Mke anasema, “Loo! "
    "Ulikosa mambo mengi.” Rafiki anauliza, “Kwani kulikuwa na nini?” Mume anajibu, "
    "“Kulikuwa na ngoma, maigizo na nyimbo.”"
)

SCENE_SPOKEN = (
    "Maelezo ya picha. Picha ina sehemu mbili za mazungumzo ya watu watatu. "
    "Sehemu ya kwanza. Mume na mke wanakutana na rafiki yao aliyetoka shambani, akiwa amebeba jembe begani. "
    "Mume anauliza kwa mshangao. Eh bwana! Mbona hatukukuona kwenye sherehe? "
    "Rafiki anajibu. Nilishindwa kuja, nilikuwa napalilia mahindi, mtama na mbaazi. "
    "Sehemu ya pili. Mke anaendelea na mazungumzo. Loo! Ulikosa mambo mengi. "
    "Rafiki anauliza. Kwani kulikuwa na nini? "
    "Mume anajibu. Kulikuwa na ngoma, maigizo na nyimbo."
)

EXTRA_AUDIO = {
    "pg096_s002_n0007": MARIA_STORY,
    "pg102_original_layout_audio_description": SCENE_SPOKEN,
    "pg103_s001_n0004": "Namba moja, dashi.",
    "pg103_s001_n0005": "Namba mbili, dashi.",
    "pg103_s001_n0006": "Namba tatu, dashi.",
    "pg103_s001_n0007": "Namba nne, dashi.",
    "pg104_s001_n0001": "Zoezi la saba, sehemu B. Andika sentensi tano kisha weka alama za uandishi.",
    "pg104_s001_n0002": "Namba moja, dashi.",
    "pg104_s001_n0003": "Namba mbili, dashi.",
    "pg104_s001_n0004": "Namba tatu, dashi.",
    "pg104_s001_n0005": "Namba nne, dashi.",
    "pg104_s001_n0006": "Namba tano, dashi.",
}

REMOVE_AUDIO = {
    *(f"pg102_s001_n{i:04}" for i in range(3, 16)),
    "pg102_im001_audio_description",
    "pg102_im002_audio_description",
    "pg102_im003_audio_description",
}


async def generate(filename: str, spoken: str) -> None:
    target = AUDIO_DIR / filename
    if target.exists() and target.stat().st_size >= 1024:
        return
    part = target.with_suffix(target.suffix + ".part")
    for attempt in range(1, 4):
        part.unlink(missing_ok=True)
        try:
            await edge_tts.Communicate(spoken, VOICE).save(str(part))
            if part.exists() and part.stat().st_size >= 1024:
                os.replace(part, target)
                return
        except Exception:
            if attempt == 3:
                raise
            await asyncio.sleep(attempt)
    raise RuntimeError(filename)


def update_page96() -> None:
    page = ROOT / "pg096_sec001.html"
    source = page.read_text(encoding="utf-8")
    if 'data-id="pg096_s002_n0007"' not in source:
        marker = '<p class="source-line source-heading activity-prompt" data-id="pg096_s002_n0006">Shangazi Maria</p>'
        addition = marker + '<p class="sr-only" data-id="pg096_s002_n0007">' + html.escape(MARIA_STORY) + '</p>'
        if marker not in source:
            raise RuntimeError("Page 96 story anchor missing")
        source = source.replace(marker, addition, 1)
    source = source.replace(
        'aria-label="Mfano wa Shangazi Maria"',
        'aria-label="' + html.escape(MARIA_STORY, quote=True) + '"',
        1,
    )
    page.write_text(source, encoding="utf-8")


def update_page102() -> None:
    page = ROOT / "pg102_sec001.html"
    source = page.read_text(encoding="utf-8")
    for number in range(3, 16):
        item_id = f"pg102_s001_n{number:04}"
        source = re.sub(
            rf'(<p\b[^>]*\bdata-id="{item_id}"[^>]*)(>)',
            lambda m: m.group(1) + ("" if "aria-hidden=" in m.group(1) else ' aria-hidden="true"') + m.group(2),
            source,
        )
    if not re.search(r'<p\b[^>]*data-id="pg102_original_layout_audio_description"', source):
        marker = '<p class="source-line source-heading" data-id="pg102_s001_n0002">picha.</p>'
        addition = marker + '<p class="sr-only" data-id="pg102_original_layout_audio_description">' + html.escape(SCENE_VISIBLE) + '</p>'
        if marker not in source:
            raise RuntimeError("Page 102 instruction anchor missing")
        source = source.replace(marker, addition, 1)
    for image_id in ("pg102_im001", "pg102_im002", "pg102_im003"):
        source = re.sub(
            rf'(<figure\b(?=[^>]*class="[^"]*source-figure)[^>]*>\s*<img\b[^>]*src="images/{image_id}\.png"[^>]*)(>)',
            lambda m: re.sub(r'\s+alt="[^"]*"', "", m.group(1)) + ' alt="" aria-hidden="true">',
            source,
        )
        source = source.replace(
            f'<figure class="source-figure model-figure"><img src="images/{image_id}.png" alt="" aria-hidden="true">',
            f'<figure class="source-figure model-figure" hidden aria-hidden="true"><img src="images/{image_id}.png" alt="">',
        )
    layout = re.compile(r'(<section class="page102-original-sheet"[^>]*><img\b[^>]*)(>)', re.DOTALL)
    def layout_repl(match: re.Match[str]) -> str:
        attrs = match.group(1)
        encoded = html.escape(SCENE_VISIBLE, quote=True)
        attrs = re.sub(r'\s+(?:alt|data-adt-description|data-adt-audio-description-id)="[^"]*"', "", attrs)
        attrs += ' alt="" aria-hidden="true"'
        return attrs + match.group(2)
    source, count = layout.subn(layout_repl, source, count=1)
    if count != 1:
        raise RuntimeError("Page 102 original layout missing")
    page.write_text(source, encoding="utf-8")


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    update_page96()
    update_page102()
    texts["pg096_s002_n0007"] = MARIA_STORY
    texts["pg102_original_layout"] = SCENE_VISIBLE
    texts["pg102_original_layout_audio_description"] = SCENE_VISIBLE
    for item_id in REMOVE_AUDIO:
        audios.pop(item_id, None)

    audio_work: dict[str, str] = {}
    for item_id, spoken in EXTRA_AUDIO.items():
        filename = f"{item_id}_supervisor_v7.mp3"
        audios[item_id] = filename
        audio_work[filename] = spoken

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sem = asyncio.Semaphore(4)
    async def limited(name: str, speech: str) -> None:
        async with sem:
            await generate(name, speech)
    await asyncio.gather(*(limited(name, speech) for name, speech in audio_work.items()))
    print(f"batch8 audio={len(audio_work)} removed={len(REMOVE_AUDIO)}")


if __name__ == "__main__":
    asyncio.run(main())
