import asyncio
import html
import json
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
TEXTS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "texts.json"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
VOICE = "sw-TZ-RehemaNeural"
VERSION = "accessible_writing_v1"
WRITING_SCRIPT_VERSION = "./assets/writing-activities.js?v=accessible-model-guidance-v2-20260830"

FIGURE_RE = re.compile(
    r'(<figure[^>]*class="[^"]*practice-model[^"]*"[^>]*>)(.*?)(</figure>)',
    re.DOTALL,
)
CAPTION_RE = re.compile(
    r'(<figcaption\b[^>]*data-id="([^"]+_audio_description)"[^>]*>)(.*?)(</figcaption>)',
    re.DOTALL,
)
DESCRIPTION_RE = re.compile(r'data-adt-description="([^"]*)"')
SCRIPT_RE = re.compile(r'\./assets/writing-activities\.js\?v=[^"\']+')

SOUNDS = {
    "a": "a", "e": "e", "i": "i", "o": "o", "u": "u",
    "b": "ba", "m": "ma", "d": "da", "k": "ka", "n": "na",
    "l": "la", "t": "ta", "p": "pa", "s": "sa", "f": "fa",
    "j": "ja", "g": "ga", "y": "ya", "z": "za", "r": "ra",
    "h": "ha", "w": "wa", "v": "va", "ch": "cha",
}


def clean_markup(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", " ", value)).strip()


def enhance_description(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()

    match = re.fullmatch(r"Mchoro wa herufi\s+([A-Za-z]+)\.", value)
    if match:
        letter = match.group(1)
        sound = SOUNDS.get(letter.lower(), letter.lower())
        return (
            f"Mchoro wa herufi {letter}. Herufi {letter} hutamkwa {sound}. "
            f"Andika herufi {letter} kwenye mistari iliyo wazi."
        )

    match = re.fullmatch(r"Mchoro wa silabi\s+([A-Za-z]+)\.", value)
    if match:
        syllable = match.group(1)
        letters = " ikifuatiwa na ".join(syllable.lower())
        return (
            f"Mchoro wa silabi {syllable}. Silabi {syllable} ina herufi {letters}. "
            f"Andika silabi {syllable} kwenye mistari iliyo wazi."
        )

    match = re.fullmatch(
        r"Fuatisha\s+(?:herufi(?: ya konsonanti)?|konsonanti)\s+(kubwa\s+)?([A-Za-z]+)\.",
        value,
        re.IGNORECASE,
    )
    if match:
        large = bool(match.group(1))
        letter = match.group(2)
        sound = SOUNDS.get(letter.lower(), letter.lower())
        label = f"herufi kubwa {letter}" if large else f"herufi {letter}"
        return f"Fuatisha {label}. {label.capitalize()} hutamkwa {sound}. Andika {label} kwenye daftari."

    if value.startswith("Silabi "):
        items = value.removeprefix("Silabi ").rstrip(".")
        return f"Andika silabi hizi kwenye daftari. Silabi ni: {items}."

    if value.startswith("Maneno "):
        items = value.removeprefix("Maneno ").rstrip(".")
        return f"Andika maneno haya kwenye daftari. Maneno ni: {items}."

    if value.startswith("Majina "):
        items = value.removeprefix("Majina ").rstrip(".")
        return f"Andika majina haya kwenye daftari. Majina ni: {items}."

    if value.startswith("Sentensi:"):
        body = value.removeprefix("Sentensi:").strip()
        sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", body) if part.strip()]
        instruction = "Andika sentensi hii kwenye daftari." if len(sentences) == 1 else "Andika sentensi hizi kwenye daftari."
        return f"{instruction} {' '.join(sentences)}"

    if value.startswith("Mistari "):
        return f"Mfano wa mwandiko. {value} Andika mifano hiyo kwenye mistari iliyo wazi."

    return value


def collect_and_update_html() -> dict[str, str]:
    descriptions: dict[str, str] = {}
    pages = [ROOT / "index.html", *sorted(ROOT.glob("pg*_sec*.html"))]
    changed_pages = 0

    for page in pages:
        source = page.read_text(encoding="utf-8")

        def update_figure(figure_match: re.Match[str]) -> str:
            prefix, body, suffix = figure_match.groups()
            caption_match = CAPTION_RE.search(body)
            if not caption_match:
                return figure_match.group(0)
            caption_id = caption_match.group(2)
            current = clean_markup(caption_match.group(3))
            enhanced = enhance_description(current)
            if not current or enhanced == current:
                return figure_match.group(0)
            previous = descriptions.setdefault(caption_id, enhanced)
            if previous != enhanced:
                raise RuntimeError(f"Conflicting descriptions for {caption_id}")
            escaped_text = html.escape(enhanced, quote=False)
            updated_body = CAPTION_RE.sub(
                lambda match: match.group(1) + escaped_text + match.group(4),
                body,
                count=1,
            )
            if DESCRIPTION_RE.search(updated_body):
                escaped_attribute = html.escape(enhanced, quote=True)
                updated_body = DESCRIPTION_RE.sub(
                    f'data-adt-description="{escaped_attribute}"', updated_body, count=1
                )
            return prefix + updated_body + suffix

        updated = FIGURE_RE.sub(update_figure, source)
        updated = SCRIPT_RE.sub(WRITING_SCRIPT_VERSION, updated)
        if updated != source:
            page.write_text(updated, encoding="utf-8")
            changed_pages += 1

    print(f"HTML pages updated: {changed_pages}")
    return descriptions


async def generate_audio(descriptions: dict[str, str]) -> None:
    semaphore = asyncio.Semaphore(6)

    async def generate_one(caption_id: str, text: str) -> tuple[str, str]:
        filename = f"{caption_id}_{VERSION}.mp3"
        target = AUDIO_DIR / filename
        temporary = target.with_suffix(".part.mp3")
        async with semaphore:
            temporary.unlink(missing_ok=True)
            await edge_tts.Communicate(text, VOICE).save(str(temporary))
            if not temporary.exists() or temporary.stat().st_size < 1024:
                raise RuntimeError(f"Audio was not generated: {filename}")
            temporary.replace(target)
        return caption_id, filename

    results = await asyncio.gather(
        *(generate_one(caption_id, text) for caption_id, text in descriptions.items())
    )

    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    for caption_id, text in descriptions.items():
        texts[caption_id] = text
    for caption_id, filename in results:
        audios[caption_id] = filename
    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Audio files generated: {len(results)}")


async def main() -> None:
    descriptions = collect_and_update_html()
    await generate_audio(descriptions)


if __name__ == "__main__":
    asyncio.run(main())
