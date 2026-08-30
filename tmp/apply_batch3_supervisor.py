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

# Visible descriptions remain concise. The spoken variant gives Rehema the
# approved Tanzanian pronunciation without changing the printed book.
DESCRIPTIONS = {
    "pg014_im001": ("Mchoro wa silabi ba.", "Mchoro wa silabi ba."),
    "pg014_im002": ("Fuatisha herufi b.", "Fuatisha herufi ba."),
    "pg015_im001": ("Bibi.", "Bibi."),
    "pg015_im002": ("Babu.", "Babu."),
    "pg015_im003": ("Bao.", "Bao."),
    "pg016_im001": ("Mchoro wa herufi m.", "Mchoro wa herufi ma."),
    "pg016_im002": ("Silabi ma, me, mi, mo na mu.", "Silabi ma. me. mi. mo. mu."),
    "pg016_im003": ("Maneno mama, mimi, memo, mia na mea.", "Maneno mama. mimi. memo. mia. mea."),
    "pg017_im001": ("Muwa.", "Muwa."),
    "pg017_im002": ("Uma.", "Uma."),
    "pg017_im003": ("Maua.", "Maua."),
    "pg018_im001": ("Mchoro wa silabi da.", "Mchoro wa silabi da."),
    "pg018_im002": ("Fuatisha herufi d.", "Fuatisha herufi da."),
    "pg019_im001": ("Dawati.", "Dawati."),
    "pg019_im002": ("Dumu.", "Dumu."),
    "pg019_im003": ("Dodoki.", "Dodoki."),
    "pg020_im001": ("Mchoro wa herufi k.", "Mchoro wa herufi ka."),
    "pg020_im002": ("Fuatisha herufi k.", "Fuatisha herufi ka."),
    "pg021_im001": ("Kobe.", "Kobe."),
    "pg021_im002": ("Kaa.", "Kaa."),
    "pg021_im003": ("Kuku.", "Kuku."),
    "pg021_im004": ("Kiko.", "Kiko."),
    "pg023_im001": ("Mchoro wa herufi l.", "Mchoro wa herufi la."),
    "pg023_im005": ("Fuatisha herufi l.", "Fuatisha herufi la."),
    "pg024_im001": ("Lulu anapalilia mazao shambani.", "Lulu anapalilia mazao shambani."),
    "pg024_im002": ("Leo analia.", "Leo analia."),
    "pg024_im003": ("Silabi la, le, li, lo na lu.", "Silabi la. le. li. lo. lu."),
    "pg024_im004": ("Maneno lami, lala, lea, lini na loa.", "Maneno lami. lala. lea. lini. loa."),
    "pg025_im001": ("Mchoro wa herufi t.", "Mchoro wa herufi ta."),
    "pg025_im005": ("Fuatisha herufi t.", "Fuatisha herufi ta."),
    "pg025_im006": ("Silabi ta, te, ti, to na tu.", "Silabi ta. te. ti. to. tu."),
    "pg025_im007": ("Maneno tatu, tete, teka na takataka.", "Maneno tatu. tete. teka. takataka."),
    "pg026_im001": ("Kiti.", "Kiti."),
    "pg026_im002": ("Bata.", "Bata."),
    "pg026_im003": ("Moto.", "Moto."),
    "pg026_im004": ("Tai.", "Tai."),
    "pg026_im005": ("Taa.", "Taa."),
    "pg026_im006": ("Mti.", "Mti."),
    "pg027_im001": ("Mchoro wa herufi p.", "Mchoro wa herufi pa."),
    "pg027_im002": ("Fuatisha herufi p.", "Fuatisha herufi pa."),
    "pg028_im001": ("Pipa.", "Pipa."),
    "pg028_im002": ("Popo.", "Popo."),
    "pg028_im003": ("Papai.", "Papai."),
    "pg028_im004": ("Pua.", "Pua."),
    "pg029_im001": ("Mchoro wa herufi s.", "Mchoro wa herufi sa."),
    "pg029_im002": ("Fuatisha herufi s.", "Fuatisha herufi sa."),
    "pg029_im003": ("Silabi sa, se, si, so na su.", "Silabi sa. se. si. so. su."),
    "pg029_im004": ("Maneno sasa, sauti, sikia, sisi na suka.", "Maneno sasa. sauti. sikia. sisi. suka."),
    "pg030_im001": ("Soksi.", "Soksi."),
    "pg030_im002": ("Samaki.", "Samaki."),
    "pg030_im003": ("Saa.", "Saa."),
    "pg030_im004": ("Sabuni.", "Sabuni."),
    "pg031_im001": ("Fuatisha herufi f.", "Fuatisha herufi fa."),
    "pg031_im002": ("Silabi fa, fe, fi, fo na fu.", "Silabi fa. fe. fi. fo. fu."),
    "pg031_im003": ("Maneno fua, fulana, futa, faida na fito.", "Maneno fua. fulana. futa. faida. fito."),
    "pg032_im001": ("Fisi.", "Fisi."),
    "pg032_im002": ("Ufagio.", "Ufagio."),
    "pg032_im003": ("Feni.", "Feni."),
    "pg033_im001": ("Fuatisha herufi j.", "Fuatisha herufi ja."),
    "pg033_im002": ("Maneno jua, jino, jioni, jipu na joto.", "Maneno jua. jino. jioni. jipu. joto."),
    "pg034_im001": ("Jiko la mkaa.", "Jiko la mkaa."),
}

DECORATIVE = {
    "pg023_im002", "pg023_im003", "pg023_im004",
    "pg025_im002", "pg025_im003", "pg025_im004",
}

EXTRA_AUDIO = {
    "pg015_s001_n0002": "baba. babu. bua. bibo. beba.",
    "pg018_s001_n0005": "da. de. di. do. du.",
    "pg018_s001_n0007": "dada. dudu. doa.",
    "pg020_s001_n0005": "ka. ke. ki. ko. ku.",
    "pg020_s001_n0007": "kaba. koma. kua. keki. komeo.",
    "pg022_s001_n0004": "na. ne. ni. no. nu.",
    "pg022_s001_n0006": "nuna. nene. neno. nini. nane.",
    "pg022_s001_n0009": "Namba moja. dashi, ene.",
    "pg022_s001_n0010": "Namba mbili. nu, dashi, ua.",
    "pg022_s001_n0011": "Namba tatu. no, dashi, a.",
    "pg022_s001_n0012": "Namba nne. dashi, oa.",
    "pg022_s001_n0013": "Namba tano. ku, dashi, i.",
    "pg024_s001_n0005": "Leo, dashi. Lulu, dashi.",
    "pg027_s001_n0009": "pa. pe. pi. po. pu.",
    "pg027_s001_n0011": "pona. popo. pipi. punda. polepole.",
}

CHART_WORDS_ID = "pg034_chart_words_accessible"
CHART_WORDS_VISIBLE = (
    "Maneno yanayoweza kuandikwa kutoka kwenye chati ni: bata, tatu, tabu, "
    "kobe, baba, bado, nani, nipe, babu, bua, dobi, bibi, kumi, timu, muda, "
    "lala, mia, kaa, suka, kata, dada, Musa, pipi, pasi na simu."
)


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

    source, image_count = image_pattern.subn(replace_image, source)
    caption_id = f"{image_id}_audio_description"
    caption_pattern = re.compile(
        rf'(<figcaption\b[^>]*\bdata-id="{re.escape(caption_id)}"[^>]*>)(.*?)(</figcaption>)',
        re.DOTALL,
    )
    source, caption_count = caption_pattern.subn(
        lambda match: match.group(1) + html.escape(visible or "") + match.group(3), source
    )
    if image_count == 0 or caption_count == 0:
        raise RuntimeError(f"Expected image and caption for {image_id}; image={image_count}, caption={caption_count}")
    return source


def replace_text_node(source: str, item_id: str, visible: str) -> str:
    pattern = re.compile(
        rf'(<[^>]+\bdata-id="{re.escape(item_id)}"[^>]*>)(.*?)(</[^>]+>)', re.DOTALL
    )
    updated, count = pattern.subn(lambda m: m.group(1) + html.escape(visible) + m.group(3), source)
    if count != 1:
        raise RuntimeError(f"Expected one text node {item_id}; found {count}")
    return updated


def add_chart_words(source: str) -> str:
    if f'data-id="{CHART_WORDS_ID}"' in source:
        return source
    marker = re.compile(r'(<p\b[^>]*\bdata-id="pg034_s001_n0014"[^>]*>.*?</p>)', re.DOTALL)
    paragraph = f'<p class="sr-only" data-id="{CHART_WORDS_ID}">{html.escape(CHART_WORDS_VISIBLE)}</p>'
    updated, count = marker.subn(lambda m: m.group(1) + paragraph, source)
    if count != 1:
        raise RuntimeError(f"Expected page 34 chart marker; found {count}")
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


async def generate_all(audio_work: dict[str, str]) -> None:
    semaphore = asyncio.Semaphore(4)

    async def limited(filename: str, spoken: str) -> None:
        async with semaphore:
            await generate(filename, spoken)

    await asyncio.gather(*(limited(filename, spoken) for filename, spoken in audio_work.items()))


async def main() -> None:
    texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
    audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))
    pages: dict[Path, str] = {}
    audio_work: dict[str, str] = {}

    for image_id, (visible, spoken) in DESCRIPTIONS.items():
        page_number = image_id[2:5]
        found = 0
        for page in sorted(ROOT.glob(f"pg{page_number}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{image_id}"' not in source:
                continue
            pages[page] = update_image(source, image_id, visible)
            found += 1
        if not found:
            raise RuntimeError(f"No page found for {image_id}")
        texts[image_id] = visible
        audio_id = f"{image_id}_audio_description"
        texts[audio_id] = visible
        filename = f"{audio_id}_supervisor_v2.mp3"
        audios[audio_id] = filename
        audio_work[filename] = spoken

    for image_id in DECORATIVE:
        page_number = image_id[2:5]
        for page in sorted(ROOT.glob(f"pg{page_number}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{image_id}"' in source:
                pages[page] = update_image(source, image_id, None)
        texts[image_id] = ""
        texts[f"{image_id}_audio_description"] = ""
        audios.pop(f"{image_id}_audio_description", None)

    page15 = ROOT / "pg015_sec001.html"
    pages[page15] = replace_text_node(
        pages.get(page15, page15.read_text(encoding="utf-8")),
        "pg015_s001_n0002",
        "baba babu bua bibo beba",
    )
    texts["pg015_s001_n0002"] = "baba babu bua bibo beba"

    page34 = ROOT / "pg034_sec001.html"
    pages[page34] = add_chart_words(pages.get(page34, page34.read_text(encoding="utf-8")))
    texts[CHART_WORDS_ID] = CHART_WORDS_VISIBLE
    filename = f"{CHART_WORDS_ID}_supervisor_v1.mp3"
    audios[CHART_WORDS_ID] = filename
    audio_work[filename] = CHART_WORDS_VISIBLE

    for item_id, spoken in EXTRA_AUDIO.items():
        filename = f"{item_id}_supervisor_v2.mp3"
        audios[item_id] = filename
        audio_work[filename] = spoken

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for page, source in pages.items():
        page.write_text(source, encoding="utf-8")

    await generate_all(audio_work)
    print(f"batch3 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
