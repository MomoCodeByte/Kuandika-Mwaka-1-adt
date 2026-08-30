import asyncio
import html
import json
import os
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "texts.json"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
VOICE = "sw-TZ-RehemaNeural"

DESCRIPTIONS = {
    "pg009_im002": ("Mchoro wa herufi a.", "Mchoro wa herufi aaa."),
    "pg009_im003": ("Fuatisha herufi a.", "Fuatisha herufi aaa."),
    "pg010_im001": ("Mchoro wa herufi e.", "Mchoro wa herufi eee."),
    "pg010_im003": ("Fuatisha herufi e.", "Fuatisha herufi eee."),
    "pg011_im001": ("Mchoro wa herufi i.", "Mchoro wa herufi iii."),
    "pg011_im003": ("Fuatisha herufi i.", "Fuatisha herufi iii."),
    "pg011_im002": ("Mchoro wa herufi o.", "Mchoro wa herufi ooo."),
    "pg012_im002": ("Fuatisha herufi o.", "Fuatisha herufi ooo."),
    "pg012_im001": ("Mchoro wa herufi u.", "Mchoro wa herufi uuu."),
    "pg012_im003": ("Fuatisha herufi u.", "Fuatisha herufi uuu."),
    "pg013_im002": ("Maneno ya irabu: ua, oa na au.", "Maneno ya irabu: ua, oa na au."),
    "pg013_im001": ("Ua.", "Ua."),
}

EXTRA_AUDIO = {
    "pg013_s001_n0005": "ua. oa. au.",
    "pg013_s001_n0012": "u, dashi. dashi, a. a, dashi.",
}


def update_image(source: str, image_id: str, visible: str) -> str:
    image_pattern = re.compile(
        rf'(<img\b(?=[^>]*\bdata-id="{re.escape(image_id)}")[^>]*)(>)', re.DOTALL
    )

    def replace_image(match: re.Match[str]) -> str:
        attrs = match.group(1)
        encoded = html.escape(visible, quote=True)
        for name in ("alt", "data-adt-description"):
            if re.search(rf'\b{name}="[^"]*"', attrs):
                attrs = re.sub(rf'\b{name}="[^"]*"', f'{name}="{encoded}"', attrs)
            else:
                attrs += f' {name}="{encoded}"'
        return attrs + match.group(2)

    source, image_count = image_pattern.subn(replace_image, source)
    caption_id = f"{image_id}_audio_description"
    caption_pattern = re.compile(
        rf'(<figcaption\b[^>]*\bdata-id="{re.escape(caption_id)}"[^>]*>)(.*?)(</figcaption>)',
        re.DOTALL,
    )
    source, caption_count = caption_pattern.subn(
        lambda match: match.group(1) + html.escape(visible) + match.group(3), source
    )
    if image_count == 0 or caption_count == 0:
        raise RuntimeError(
            f"Expected image and caption for {image_id}; image={image_count}, caption={caption_count}"
        )
    return source


def reorder_page13(source: str) -> str:
    pattern = re.compile(
        r'(?P<first><p\b[^>]*\bdata-id="pg013_s001_n0005"[^>]*>.*?</p>)'
        r'(?P<middle>.*?)'
        r'(?P<second><p\b[^>]*\bdata-id="pg013_s001_n0006"[^>]*>.*?</p>)',
        re.DOTALL,
    )
    updated, count = pattern.subn(
        lambda match: match.group("second") + match.group("middle") + match.group("first"), source
    )
    if count != 1:
        raise RuntimeError(f"Expected one page 13 introduction reorder; found {count}")
    return updated


async def generate(filename: str, spoken: str) -> None:
    target = AUDIO_DIR / filename
    temporary = target.with_suffix(target.suffix + ".part")
    temporary.unlink(missing_ok=True)
    await edge_tts.Communicate(spoken, VOICE).save(str(temporary))
    if not temporary.exists() or temporary.stat().st_size < 1024:
        raise RuntimeError(f"Invalid audio generated for {filename}")
    os.replace(temporary, target)


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    pages: dict[Path, str] = {}
    audio_work: dict[str, str] = {}

    for image_id, (visible, spoken) in DESCRIPTIONS.items():
        page_number = image_id[2:5]
        matched_pages = 0
        for page in sorted(ROOT.glob(f"pg{page_number}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{image_id}"' not in source:
                continue
            pages[page] = update_image(source, image_id, visible)
            matched_pages += 1
        if matched_pages == 0:
            raise RuntimeError(f"No HTML page found for {image_id}")
        texts[image_id] = visible
        audio_id = f"{image_id}_audio_description"
        texts[audio_id] = visible
        filename = f"{audio_id}_supervisor_v1.mp3"
        audios[audio_id] = filename
        audio_work[filename] = spoken

    page13 = ROOT / "pg013_sec001.html"
    pages[page13] = reorder_page13(pages.get(page13, page13.read_text(encoding="utf-8")))

    for item_id, spoken in EXTRA_AUDIO.items():
        filename = f"{item_id}_supervisor_v1.mp3"
        audios[item_id] = filename
        audio_work[filename] = spoken

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for page, source in pages.items():
        page.write_text(source, encoding="utf-8")

    await asyncio.gather(*(generate(filename, spoken) for filename, spoken in audio_work.items()))
    print(f"batch2 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
