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

DESCRIPTIONS = {
    "pg035_im001": ("Fuatisha herufi g.", "Fuatisha herufi ga."),
    "pg036_im001": ("Gari.", "Gari."),
    "pg036_im002": ("Gitaa.", "Gitaa."),
    "pg036_im003": ("Gogo.", "Gogo."),
    "pg036_im004": ("Maneno gauni, geuka, goli, gesi na geti.", "Maneno gauni. geuka. goli. gesi. geti."),
    "pg037_im001": ("Fuatisha herufi y.", "Fuatisha herufi ya."),
    "pg037_im002": ("Silabi ya, ye, yi, yo na yu.", "Silabi ya. ye. yi. yo. yu."),
    "pg038_im001": ("Yai.", "Yai."),
    "pg039_im001": ("Fuatisha herufi z.", "Fuatisha herufi za."),
    "pg039_im002": ("Silabi za, ze, zi, zo na zu.", "Silabi za. ze. zi. zo. zu."),
    "pg039_im003": ("Maneno zoezi, zizi, zaliwa, zao na zua.", "Maneno zoezi. zizi. zaliwa. zao. zua."),
    "pg040_im001": ("Zabibu.", "Zabibu."),
    "pg040_im002": ("Zeze.", "Zeze."),
    "pg041_im001": ("Fuatisha herufi r.", "Fuatisha herufi ra."),
    "pg041_im002": ("Silabi ra, re, ri, ro na ru.", "Silabi ra. re. ri. ro. ru."),
    "pg042_im001": ("Rula.", "Rula."),
    "pg042_im002": ("Reki.", "Reki."),
    "pg042_im003": ("Redio.", "Redio."),
    "pg042_im004": ("Maneno raba, ruka, radi, rahisi na rika.", "Maneno raba. ruka. radi. rahisi. rika."),
    "pg043_im001": ("Fuatisha herufi h.", "Fuatisha herufi ha."),
    "pg043_im002": ("Silabi ha, he, hi, ho na hu.", "Silabi ha. he. hi. ho. hu."),
    "pg043_im003": ("Maneno hakimu, hodi, hoho, haki na hisa.", "Maneno hakimu. hodi. hoho. haki. hisa."),
    "pg044_im001": ("Noti.", "Noti."),
    "pg044_im002": ("Sarafu.", "Sarafu."),
    "pg044_im003": ("Hema.", "Hema."),
    "pg045_im001": ("Mchoro wa herufi w.", "Mchoro wa herufi wa."),
    "pg045_im002": ("Fuatisha herufi w.", "Fuatisha herufi wa."),
    "pg045_im003": ("Silabi wa, we, wi, wo na wu.", "Silabi wa. we. wi. wo. wu."),
    "pg045_im004": ("Maneno wewe, wao, weka, wino na wema.", "Maneno wewe. wao. weka. wino. wema."),
    "pg046_im001": ("Mchoro wa herufi v.", "Mchoro wa herufi va."),
    "pg046_im002": ("Fuatisha herufi v.", "Fuatisha herufi va."),
    "pg046_im003": ("Silabi va, ve, vi, vo na vu.", "Silabi va. ve. vi. vo. vu."),
    "pg046_im004": ("Maneno vada, vuna, vivo, vamia na vuma.", "Maneno vada. vuna. vivo. vamia. vuma."),
    "pg047_im001": ("Viti.", "Viti."),
    "pg047_im004": ("Viazi.", "Viazi."),
    "pg047_im005": ("Vijiko.", "Vijiko."),
    "pg048_im001": ("Fuatisha herufi ch.", "Fuatisha herufi cha."),
    "pg048_im002": ("Maneno chai, chawa, chaki, chuna na chale.", "Maneno chai. chawa. chaki. chuna. chale."),
    "pg049_im001": ("Chui.", "Chui."),
    "pg049_im002": ("Chura.", "Chura."),
    "pg049_im003": ("Chupa.", "Chupa."),
}

DECORATIVE = {"pg047_im002", "pg047_im003"}

TEXT_REPLACEMENTS = {
    "pg041_s002_n0002": "Kuandika herufi ya konsonanti r",
    "pg041_s002_n0004": "konsonanti r.",
    "pg041_s002_n0005": "Fuatisha herufi ya konsonanti r.",
    "pg048_s001_n0008": "cha che chi cho chu",
    "pg051_s001_n0001": "1. Taja majina ya wanyama uliowaona na uliowabaini katika picha",
    "pg051_s001_n0007": "1. Andika majina ya vitu ulivyoviona na ulivyobaini.",
    "pg051_s001_n0008": "2. Andika herufi za mwanzo za vitu ulivyoviona na ulivyobaini.",
}

EXTRA_AUDIO = {
    "pg035_s002_n0009": "ga. ge. gi. go. gu.",
    "pg037_s001_n0009": "yenu. yupi. yaya. yule. yote.",
    "pg041_s001_n0003": "za. ze. zi. zu. fi. na.",
    "pg041_s001_n0004": "",
    "pg041_s001_n0005": "Namba moja. dashi, ia.",
    "pg041_s001_n0006": "Namba mbili. ze, dashi.",
    "pg041_s001_n0007": "Namba tatu. na, dashi.",
    "pg041_s001_n0008": "Namba nne. u, dashi, zi.",
    "pg041_s001_n0009": "Namba tano. dashi, ma.",
    "pg041_s002_n0002": "Kuandika herufi ya konsonanti ra.",
    "pg041_s002_n0004": "konsonanti ra.",
    "pg041_s002_n0005": "Fuatisha herufi ya konsonanti ra.",
    "pg045_s001_n0007": "Andika maneno matano yenye herufi ya konsonanti wa katika daftari.",
    "pg045_s001_n0008": "",
    "pg048_s001_n0008": "cha. che. chi. cho. chu.",
    "pg051_s001_n0001": "Namba moja. Taja majina ya wanyama uliowaona na uliowabaini katika picha hiyo.",
    "pg051_s001_n0007": "Namba moja. Andika majina ya vitu ulivyoviona na ulivyobaini.",
    "pg051_s001_n0008": "Namba mbili. Andika herufi za mwanzo za vitu ulivyoviona na ulivyobaini.",
}

HOME_ID = "pg051_home_items_accessible"
HOME_TEXT = "Vifaa vya nyumbani ni: kiti, kochi, meza, bakuli, sahani na kijiko."


def update_image(source: str, image_id: str, visible: str | None) -> str:
    image_pattern = re.compile(rf'(<img\b(?=[^>]*\bdata-id="{re.escape(image_id)}")[^>]*)(>)', re.DOTALL)

    def replace_image(match: re.Match[str]) -> str:
        attrs = match.group(1)
        encoded = html.escape(visible or "", quote=True)
        for name in ("alt", "data-adt-description"):
            if re.search(rf'\b{name}="[^"]*"', attrs):
                attrs = re.sub(rf'\b{name}="[^"]*"', f'{name}="{encoded}"', attrs)
            else:
                attrs += f' {name}="{encoded}"'
        if visible:
            audio_id = f"{image_id}_audio_description"
            if not re.search(r'\bdata-adt-audio-description-id="[^"]*"', attrs):
                attrs += f' data-adt-audio-description-id="{audio_id}"'
        else:
            attrs = re.sub(r'\s+data-adt-audio-description-id="[^"]*"', "", attrs)
            if not re.search(r'\baria-hidden="[^"]*"', attrs):
                attrs += ' aria-hidden="true"'
        return attrs + match.group(2)

    source, ic = image_pattern.subn(replace_image, source)
    caption_id = f"{image_id}_audio_description"
    caption_pattern = re.compile(rf'(<figcaption\b[^>]*\bdata-id="{re.escape(caption_id)}"[^>]*>)(.*?)(</figcaption>)', re.DOTALL)
    source, cc = caption_pattern.subn(lambda m: m.group(1) + html.escape(visible or "") + m.group(3), source)
    if not ic or not cc:
        raise RuntimeError(f"Missing image/caption {image_id}: {ic}/{cc}")
    return source


def replace_text_node(source: str, item_id: str, visible: str) -> str:
    pattern = re.compile(rf'(<[^>]+\bdata-id="{re.escape(item_id)}"[^>]*>)(.*?)(</[^>]+>)', re.DOTALL)
    updated, count = pattern.subn(lambda m: m.group(1) + html.escape(visible) + m.group(3), source)
    if count != 1:
        raise RuntimeError(f"Expected one text node {item_id}; found {count}")
    return updated


def add_home_audio(source: str) -> str:
    if f'data-id="{HOME_ID}"' in source:
        return source
    marker = re.compile(r'(<p\b[^>]*\bdata-id="pg051_s001_n0006"[^>]*>.*?</p>)', re.DOTALL)
    node = f'<p class="sr-only" data-id="{HOME_ID}">{html.escape(HOME_TEXT)}</p>'
    updated, count = marker.subn(lambda m: m.group(1) + node, source)
    if count != 1:
        raise RuntimeError("Could not add page 51 accessible home item list")
    return updated


async def generate(filename: str, spoken: str) -> None:
    target = AUDIO_DIR / filename
    if target.exists() and target.stat().st_size >= 1024:
        return
    temporary = target.with_suffix(target.suffix + ".part")
    for attempt in range(1, 4):
        temporary.unlink(missing_ok=True)
        try:
            await edge_tts.Communicate(spoken, VOICE).save(str(temporary))
            if temporary.exists() and temporary.stat().st_size >= 1024:
                os.replace(temporary, target)
                return
        except Exception:
            if attempt == 3:
                raise
            await asyncio.sleep(attempt)
    raise RuntimeError(f"Invalid audio generated for {filename}")


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    pages: dict[Path, str] = {}
    audio_work: dict[str, str] = {}

    for image_id, (visible, spoken) in DESCRIPTIONS.items():
        found = 0
        for page in sorted(ROOT.glob(f"pg{image_id[2:5]}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{image_id}"' in source:
                pages[page] = update_image(source, image_id, visible)
                found += 1
        if not found:
            raise RuntimeError(f"No page for {image_id}")
        texts[image_id] = visible
        aid = f"{image_id}_audio_description"
        texts[aid] = visible
        filename = f"{aid}_supervisor_v3.mp3"
        audios[aid] = filename
        audio_work[filename] = spoken

    for image_id in DECORATIVE:
        for page in sorted(ROOT.glob(f"pg{image_id[2:5]}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{image_id}"' in source:
                pages[page] = update_image(source, image_id, None)
        texts[image_id] = ""
        texts[f"{image_id}_audio_description"] = ""
        audios.pop(f"{image_id}_audio_description", None)

    for item_id, visible in TEXT_REPLACEMENTS.items():
        matching = []
        for page in sorted(ROOT.glob(f"pg{item_id[2:5]}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{item_id}"' in source:
                pages[page] = replace_text_node(source, item_id, visible)
                matching.append(page)
        if len(matching) != 1:
            raise RuntimeError(f"Expected one page for text node {item_id}; found {len(matching)}")
        texts[item_id] = visible

    page51 = ROOT / "pg051_sec001.html"
    pages[page51] = add_home_audio(pages.get(page51, page51.read_text(encoding="utf-8")))
    texts[HOME_ID] = HOME_TEXT
    home_file = f"{HOME_ID}_supervisor_v1.mp3"
    audios[HOME_ID] = home_file
    audio_work[home_file] = HOME_TEXT

    for item_id, spoken in EXTRA_AUDIO.items():
        if spoken:
            filename = f"{item_id}_supervisor_v3.mp3"
            audios[item_id] = filename
            audio_work[filename] = spoken
        else:
            audios.pop(item_id, None)

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for page, source in pages.items():
        page.write_text(source, encoding="utf-8")

    semaphore = asyncio.Semaphore(4)

    async def limited(name: str, speech: str) -> None:
        async with semaphore:
            await generate(name, speech)

    await asyncio.gather(*(limited(name, speech) for name, speech in audio_work.items()))
    print(f"batch4 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
