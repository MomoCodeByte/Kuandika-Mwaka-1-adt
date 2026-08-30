import asyncio
import json
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "content" / "i18n" / "sw-TZ" / "audio"
TEXTS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "texts.json"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
VALIDATOR_PATH = ROOT / "assets" / "validator-simple-sample.js"
VOICE = "sw-TZ-RehemaNeural"
VALIDATOR_VERSION = "./assets/validator-simple-sample.js?v=69-visible-model-descriptions-20260830"


def load_description_map():
    source = VALIDATOR_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"const visibleModelDescriptionMap = (\{.*?\n  \});\n\n  function exposeVisibleModelDescriptions",
        source,
        re.DOTALL,
    )
    if not match:
        raise RuntimeError("Visible model description map was not found")
    return json.loads(match.group(1))


def update_catalogues(descriptions):
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    jobs = []
    for response_id, description in descriptions.items():
        description_id = response_id + "_model_audio_description"
        filename = description_id + "_visible_v1.mp3"
        texts[description_id] = description
        audios[description_id] = filename
        if not (AUDIO_DIR / filename).exists():
            jobs.append((description, AUDIO_DIR / filename))
    TEXTS_PATH.write_text(
        json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    AUDIOS_PATH.write_text(
        json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return jobs


def update_html_cache_version():
    pages = [ROOT / "index.html", *sorted(ROOT.glob("pg*_sec*.html"))]
    changed = 0
    pattern = re.compile(r"\./assets/validator-simple-sample\.js\?v=[^\"']+")
    for page in pages:
        source = page.read_text(encoding="utf-8")
        updated = pattern.sub(VALIDATOR_VERSION, source)
        if updated != source:
            page.write_text(updated, encoding="utf-8")
            changed += 1
    return changed


async def generate_audio(jobs):
    semaphore = asyncio.Semaphore(6)

    async def create_one(text, path):
        async with semaphore:
            await edge_tts.Communicate(text, VOICE).save(str(path))

    await asyncio.gather(*(create_one(text, path) for text, path in jobs))


async def main():
    descriptions = load_description_map()
    jobs = update_catalogues(descriptions)
    changed_pages = update_html_cache_version()
    await generate_audio(jobs)
    print(f"Visible model descriptions: {len(descriptions)}")
    print(f"Audio files generated: {len(jobs)}")
    print(f"HTML pages updated: {changed_pages}")


if __name__ == "__main__":
    asyncio.run(main())
