import asyncio
import json
import os
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content/i18n/sw-TZ/texts.json"
AUDIOS_PATH = ROOT / "content/i18n/sw-TZ/audios.json"
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
MAP_PATH = ROOT / "content/accessibility/braille-letter-map.json"
REVIEW_PATH = ROOT / "content/accessibility/braille-educator-review.json"
VOICE = "sw-TZ-RehemaNeural"

LOWER = {
    "a": (9, [1]), "e": (10, [1, 5]), "i": (11, [2, 4]),
    "o": (12, [1, 3, 5]), "u": (13, [1, 3, 6]),
    "b": (14, [1, 2]), "m": (16, [1, 3, 4]), "d": (17, [1, 4, 5]),
    "k": (19, [1, 3]), "n": (21, [1, 3, 4, 5]), "l": (23, [1, 2, 3]),
    "t": (25, [2, 3, 4, 5]), "p": (27, [1, 2, 3, 4]), "s": (29, [2, 3, 4]),
    "f": (31, [1, 2, 4]), "j": (33, [2, 4, 5]), "g": (35, [1, 2, 4, 5]),
    "y": (37, [1, 3, 4, 5, 6]), "z": (39, [1, 3, 5, 6]),
    "r": (41, [1, 2, 3, 5]), "h": (43, [1, 2, 5]), "w": (45, [2, 4, 5, 6]),
    "v": (46, [1, 2, 3, 6]),
}

UPPER = {
    "A": (52, [1]), "E": (53, [1, 5]), "I": (54, [2, 4]),
    "O": (55, [1, 3, 5]), "U": (56, [1, 3, 6]), "B": (57, [1, 2]),
    "M": (58, [1, 3, 4]), "D": (59, [1, 4, 5]), "K": (60, [1, 3]),
    "N": (61, [1, 3, 4, 5]), "L": (64, [1, 2, 3]), "T": (65, [2, 3, 4, 5]),
    "P": (66, [1, 2, 3, 4]), "S": (67, [2, 3, 4]), "F": (68, [1, 2, 4]),
    "J": (69, [2, 4, 5]), "G": (71, [1, 2, 4, 5]), "Y": (72, [1, 3, 4, 5, 6]),
    "Z": (73, [1, 3, 5, 6]), "R": (74, [1, 2, 3, 5]), "H": (75, [1, 2, 5]),
    "W": (76, [2, 4, 5, 6]), "V": (77, [1, 2, 3, 6]),
}

INTRO = (
    "Alfabeti za Breli. Seli ya Breli ina doti sita. Wakati wa kusoma, doti ya kwanza, ya pili na ya tatu "
    "ziko upande wa kushoto, kutoka juu kwenda chini. Doti ya nne, ya tano na ya sita ziko upande wa kulia, "
    "kutoka juu kwenda chini. Wakati wa kuandika kwa kibao na kalamu ya Breli, seli hutazamwa kinyume: "
    "doti ya kwanza, ya pili na ya tatu huwa upande wa kulia, na doti ya nne, ya tano na ya sita huwa upande wa kushoto."
)


def dots_phrase(dots: list[int]) -> str:
    if len(dots) == 1:
        return f"doti {dots[0]}"
    return "doti " + ", ".join(str(x) for x in dots[:-1]) + " na " + str(dots[-1])


def add_note(page_number: int, item_id: str, text: str) -> None:
    matches = sorted(ROOT.glob(f"pg{page_number:03}_sec*.html"))
    target = next((p for p in matches if "sec001" in p.name), matches[0] if matches else None)
    if target is None:
        raise RuntimeError(f"Page {page_number} missing")
    source = target.read_text(encoding="utf-8")
    if f'data-id="{item_id}"' in source:
        return
    note = f'<p class="sr-only braille-letter-note" data-id="{item_id}">{text}</p>'
    marker = "</main>"
    if marker not in source:
        raise RuntimeError(f"Main closing tag missing on {target}")
    source = source.replace(marker, note + marker, 1)
    target.write_text(source, encoding="utf-8")


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


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    audio_work: dict[str, str] = {}
    entries = []

    intro_id = "pg009_braille_cell_orientation"
    add_note(9, intro_id, INTRO)
    texts[intro_id] = INTRO
    intro_file = f"{intro_id}_supervisor_v1.mp3"
    audios[intro_id] = intro_file
    audio_work[intro_file] = INTRO

    for letter, (page, dots) in LOWER.items():
        item_id = f"pg{page:03}_braille_lower_{letter}"
        text = f"Katika Breli, herufi ndogo {letter} huandikwa kwa {dots_phrase(dots)}."
        add_note(page, item_id, text)
        texts[item_id] = text
        filename = f"{item_id}_supervisor_v1.mp3"
        audios[item_id] = filename
        audio_work[filename] = text
        entries.append({"letter": letter, "case": "lower", "page": page, "cells": [dots]})

    ch_id = "pg048_braille_lower_ch"
    ch_text = "Katika Breli, herufi ambatani ch ina seli mbili. Herufi c ni doti 1 na 4. Herufi h ni doti 1, 2 na 5."
    add_note(48, ch_id, ch_text)
    texts[ch_id] = ch_text
    ch_file = f"{ch_id}_supervisor_v1.mp3"
    audios[ch_id] = ch_file
    audio_work[ch_file] = ch_text
    entries.append({"letter": "ch", "case": "lower", "page": 48, "cells": [[1, 4], [1, 2, 5]]})

    for letter, (page, dots) in UPPER.items():
        item_id = f"pg{page:03}_braille_upper_{letter.lower()}"
        text = f"Katika Breli, herufi kubwa {letter} ina seli ya alama ya herufi kubwa, doti 6, kisha seli ya herufi yenye {dots_phrase(dots)}."
        add_note(page, item_id, text)
        texts[item_id] = text
        filename = f"{item_id}_supervisor_v1.mp3"
        audios[item_id] = filename
        audio_work[filename] = text
        entries.append({"letter": letter, "case": "upper", "page": page, "cells": [[6], dots]})

    ch_upper_id = "pg078_braille_upper_ch"
    ch_upper_text = "Katika Breli, herufi kubwa CH huanza na seli ya alama ya herufi kubwa, doti 6. Kisha herufi c ni doti 1 na 4, na herufi h ni doti 1, 2 na 5."
    add_note(78, ch_upper_id, ch_upper_text)
    texts[ch_upper_id] = ch_upper_text
    ch_upper_file = f"{ch_upper_id}_supervisor_v1.mp3"
    audios[ch_upper_id] = ch_upper_file
    audio_work[ch_upper_file] = ch_upper_text
    entries.append({"letter": "CH", "case": "upper", "page": 78, "cells": [[6], [1, 4], [1, 2, 5]]})

    MAP_PATH.write_text(json.dumps({
        "book": "Kuandika: Kitabu cha Mwanafunzi, Mwaka wa Kwanza",
        "status": "supervisor mappings incorporated; tactile interaction remains pending qualified educator review",
        "readingCellOrientation": {"left": [1, 2, 3], "right": [4, 5, 6]},
        "slateAndStylusWritingOrientation": {"right": [1, 2, 3], "left": [4, 5, 6]},
        "sources": [
            "https://www.brailleauthority.org/sites/default/files/2024-01/BANA%20Guidelines%20for%20the%20Creation%20of%20Braille%20Signage%20Approved%2010-2023.pdf",
            "https://www.aph.org/blog/learning-to-braille-with-a-slate-and-stylus-pop-it-braille-basics/"
        ],
        "entries": entries,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    review = json.loads(REVIEW_PATH.read_text(encoding="utf-8"))
    review["status"] = "supervisor letter mappings incorporated; pending qualified local braille educator review for tactile input"
    review["sixKeyBrailleEnabled"] = False
    review["letterMap"] = "braille-letter-map.json"
    review["orientationNote"] = "Reading orientation and mirrored slate-and-stylus writing orientation are both documented."
    REVIEW_PATH.write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sem = asyncio.Semaphore(4)
    async def limited(name: str, speech: str) -> None:
        async with sem:
            await generate(name, speech)
    await asyncio.gather(*(limited(name, speech) for name, speech in audio_work.items()))
    print(f"braille_entries={len(entries)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
