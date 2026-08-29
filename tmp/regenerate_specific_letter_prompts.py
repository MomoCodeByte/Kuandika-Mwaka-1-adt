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
REPORT_PATH = ROOT / "reports" / "specific-letter-prompts-2026-08-29.json"
VOICE = "sw-TZ-RehemaNeural"


PROMPTS = {
    "pg010_s001_n0001": ("irabu", "a"),
    "pg010_s001_n0007": ("irabu", "e"),
    "pg011_s001_n0006": ("irabu", "i"),
    "pg012_s001_n0003": ("irabu", "o"),
    "pg013_s001_n0001": ("irabu", "u"),
    "pg014_s002_n0007": ("konsonanti", "b"),
    "pg016_s001_n0008": ("konsonanti", "m"),
    "pg018_s001_n0003": ("konsonanti", "d"),
    "pg020_s001_n0003": ("konsonanti", "k"),
    "pg022_s001_n0002": ("konsonanti", "n"),
    "pg023_s002_n0007": ("konsonanti", "l"),
    "pg025_s001_n0007": ("konsonanti", "t"),
    "pg027_s001_n0007": ("konsonanti", "p"),
    "pg029_s001_n0007": ("konsonanti", "s"),
    "pg031_s001_n0007": ("konsonanti", "f"),
    "pg033_s001_n0004": ("konsonanti", "j"),
    "pg035_s002_n0006": ("konsonanti", "g"),
    "pg037_s001_n0006": ("konsonanti", "y"),
    "pg039_s001_n0006": ("konsonanti", "z"),
    "pg041_s002_n0006": ("konsonanti", "r"),
    "pg043_s001_n0007": ("konsonanti", "h"),
    "pg045_s001_n0003": ("konsonanti", "w"),
    "pg046_s001_n0007": ("konsonanti", "v"),
    "pg048_s001_n0006": ("konsonanti", "ch"),
    "pg052_s002_n0005": ("irabu", "A"),
    "pg053_s001_n0006": ("irabu", "E"),
    "pg054_s001_n0005": ("irabu", "I"),
    "pg055_s001_n0005": ("irabu", "O"),
    "pg056_s001_n0005": ("irabu", "U"),
    "pg057_s002_n0006": ("konsonanti", "B"),
    "pg058_s001_n0007": ("konsonanti", "M"),
    "pg059_s001_n0006": ("konsonanti", "D"),
    "pg060_s001_n0006": ("konsonanti", "K"),
    "pg061_s001_n0006": ("konsonanti", "N"),
    "pg064_s002_n0006": ("konsonanti", "L"),
    "pg065_s001_n0006": ("konsonanti", "T"),
    "pg066_s001_n0006": ("konsonanti", "P"),
    "pg067_s001_n0006": ("konsonanti", "S"),
    "pg068_s001_n0006": ("konsonanti", "F"),
    "pg069_s001_n0006": ("konsonanti", "J"),
    "pg071_s002_n0006": ("konsonanti", "G"),
    "pg072_s001_n0007": ("konsonanti", "Y"),
    "pg073_s001_n0006": ("konsonanti", "Z"),
    "pg074_s001_n0006": ("konsonanti", "R"),
    "pg075_s001_n0006": ("konsonanti", "H"),
    "pg076_s001_n0006": ("konsonanti", "W"),
    "pg077_s001_n0008": ("konsonanti", "V"),
    "pg078_s002_n0006": ("konsonanti", "CH"),
}

IMAGE_DESCRIPTIONS = {
    "pg058_im004_audio_description": ("M", "Andika herufi ya konsonanti hii kwenye daftari."),
    "pg072_im004_audio_description": ("Y", "Andika herufi ya konsonanti hii kwenye daftari."),
    "pg078_im002_audio_description": ("CH", "Andika konsonanti hii kwenye daftari."),
    "pg078_im004_audio_description": ("CH", "Andika konsonanti hii kwenye daftari."),
}

SPOKEN = {
    "a": "aaa", "e": "eee", "i": "iii", "o": "ooo", "u": "uuu",
    "b": "ba", "m": "ma", "d": "da", "k": "ka", "n": "na",
    "l": "la", "t": "ta", "p": "pa", "s": "sa", "f": "fa",
    "j": "ja", "g": "ga", "y": "ya", "z": "za", "r": "ra",
    "h": "ha", "w": "wa", "v": "va", "ch": "cha",
}


def output_name(item_id: str) -> str:
    return f"{item_id}_sw_specific_letter_v1.mp3"


def replace_element_text(source: str, item_id: str, new_text: str) -> tuple[str, int]:
    pattern = re.compile(
        rf'(<(?P<tag>[A-Za-z0-9]+)\b[^>]*\bdata-id="{re.escape(item_id)}"[^>]*>)(.*?)(</(?P=tag)>)',
        re.DOTALL,
    )
    return pattern.subn(lambda match: match.group(1) + html.escape(new_text) + match.group(4), source)


def expand_isolated_letter(text: str, display: str) -> str:
    token = re.escape(display)
    pattern = re.compile(rf"(?<![A-Za-zÀ-ÿ]){token}(?![A-Za-zÀ-ÿ])", re.IGNORECASE)
    return pattern.sub(SPOKEN[display.lower()], text)


async def generate_one(item: dict, semaphore: asyncio.Semaphore) -> dict:
    target = AUDIO_DIR / item["audio_file"]
    temporary = target.with_suffix(target.suffix + ".part")
    async with semaphore:
        temporary.unlink(missing_ok=True)
        await edge_tts.Communicate(item["spoken_text"], VOICE).save(str(temporary))
        if not temporary.exists() or temporary.stat().st_size <= 1024:
            raise RuntimeError(f"TTS returned an invalid file for {item['id']}")
        os.replace(temporary, target)
    return {**item, "bytes": target.stat().st_size}


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    html_updates: dict[Path, str] = {}
    work: list[dict] = []

    for item_id, (kind, display) in PROMPTS.items():
        if item_id not in texts:
            raise RuntimeError(f"Missing text id: {item_id}")
        visible = f"Andika herufi ya {kind} hii kwenye daftari."
        spoken = f"Andika herufi ya {kind} hii, {SPOKEN[display.lower()]}, kwenye daftari."
        page = item_id[2:5]
        candidates = sorted(ROOT.glob(f"pg{page}_sec*.html"))
        matches = 0
        for path in candidates:
            source = html_updates.get(path, path.read_text(encoding="utf-8"))
            updated, count = replace_element_text(source, item_id, visible)
            if count:
                html_updates[path] = updated
                matches += count
        if matches != 1:
            raise RuntimeError(f"Expected one HTML element for {item_id}, found {matches}")
        texts[item_id] = visible
        filename = output_name(item_id)
        audios[item_id] = filename
        work.append({
            "id": item_id,
            "kind": kind,
            "display_letter": display,
            "visible_text": visible,
            "spoken_text": spoken,
            "audio_file": filename,
            "source": "direct_prompt",
        })

    for audio_id, (display, generic_phrase) in IMAGE_DESCRIPTIONS.items():
        paired_id = audio_id.removesuffix("_audio_description")
        visible_phrase = f"Andika herufi ya konsonanti hii, {display}, kwenye daftari."
        if generic_phrase not in texts[audio_id] or generic_phrase not in texts[paired_id]:
            raise RuntimeError(f"Expected generic image phrase for {audio_id}")
        texts[audio_id] = texts[audio_id].replace(generic_phrase, visible_phrase)
        texts[paired_id] = texts[paired_id].replace(generic_phrase, visible_phrase)
        spoken = expand_isolated_letter(texts[audio_id], display)
        filename = output_name(audio_id)
        audios[audio_id] = filename
        page = audio_id[2:5]
        candidates = sorted(ROOT.glob(f"pg{page}_sec*.html"))
        replacements = 0
        for path in candidates:
            source = html_updates.get(path, path.read_text(encoding="utf-8"))
            if generic_phrase not in source:
                continue
            updated = source.replace(generic_phrase, visible_phrase)
            replacements += source.count(generic_phrase)
            html_updates[path] = updated
        page_sources = [html_updates.get(path, path.read_text(encoding="utf-8")) for path in candidates]
        if replacements == 0 and not any(visible_phrase in source for source in page_sources):
            raise RuntimeError(f"Expected image accessibility text for {audio_id}, found {replacements}")
        work.append({
            "id": audio_id,
            "kind": "konsonanti",
            "display_letter": display,
            "visible_text": texts[audio_id],
            "spoken_text": spoken,
            "audio_file": filename,
            "source": "image_description",
        })

    if len(work) != 52:
        raise RuntimeError(f"Expected 52 audio items, found {len(work)}")

    semaphore = asyncio.Semaphore(8)
    results = await asyncio.gather(*(generate_one(item, semaphore) for item in work))

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for path, source in html_updates.items():
        path.write_text(source, encoding="utf-8")
    REPORT_PATH.write_text(
        json.dumps({"generated_on": "2026-08-29", "voice": VOICE, "count": len(results), "items": results}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"COMPLETE audio={len(results)} html_pages={len(html_updates)} report={REPORT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
