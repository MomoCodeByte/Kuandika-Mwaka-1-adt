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
    "pg052_im001": ("Fuatisha herufi kubwa A.", "Fuatisha herufi kubwa aaa."),
    "pg052_im002": ("Majina Amina, Adamu, Abedi na Azizi.", "Majina Amina. Adamu. Abedi. Azizi."),
    "pg052_im003": ("Sentensi: Adamu anasoma vizuri. Amina anapika wali.", "Sentensi. Adamu anasoma vizuri. Amina anapika wali."),
    "pg053_im001": ("Fuatisha herufi kubwa E.", "Fuatisha herufi kubwa eee."),
    "pg053_im002": ("Majina Edina, Elieza, Edeni na Edita.", "Majina Edina. Elieza. Edeni. Edita."),
    "pg053_im003": ("Sentensi: Elia ana furaha. Enea anachora vizuri.", "Sentensi. Elia ana furaha. Enea anachora vizuri."),
    "pg054_im001": ("Fuatisha herufi kubwa I.", "Fuatisha herufi kubwa iii."),
    "pg054_im002": ("Majina Isaya, Itigi, Isaka na Idodi.", "Majina Isaya. Itigi. Isaka. Idodi."),
    "pg054_im003": ("Sentensi: Ida anakaa Idodi. Imani ana miaka kumi.", "Sentensi. Ida anakaa Idodi. Imani ana miaka kumi."),
    "pg055_im001": ("Fuatisha herufi kubwa O.", "Fuatisha herufi kubwa ooo."),
    "pg055_im002": ("Majina Okumu, Obia, Olomi na Obedi.", "Majina Okumu. Obia. Olomi. Obedi."),
    "pg055_im003": ("Sentensi: Omari yupo na Oliva. Obedi anakuna sikio.", "Sentensi. Omari yupo na Oliva. Obedi anakuna sikio."),
    "pg056_im001": ("Fuatisha herufi kubwa U.", "Fuatisha herufi kubwa uuu."),
    "pg056_im002": ("Majina Ujiji, Ubena, Uledi na Uturuki.", "Majina Ujiji. Ubena. Uledi. Uturuki."),
    "pg056_im003": (
        "Sentensi: Uledi amenunua uzi dukani. Ukerewe kuna samaki watamu. Zoezi: BUIBUI, KONDOA, BEBA, MEI na UBUYU.",
        "Sentensi. Uledi amenunua uzi dukani. Ukerewe kuna samaki watamu. Zoezi. Nakili maneno haya kisha pigia mstari irabu zote. Namba moja, buibui. Namba mbili, kondoa. Namba tatu, beba. Namba nne, mei. Namba tano, ubuyu.",
    ),
    "pg057_im001": ("Fuatisha herufi kubwa B.", "Fuatisha herufi kubwa ba."),
    "pg057_im002": ("Majina Beda, Bukoba, Benedeta na Baraka.", "Majina Beda. Bukoba. Benedeta. Baraka."),
    "pg058_im001": ("Sentensi: Bakari amekaa kivulini. Boke ameona konokono.", "Sentensi. Bakari amekaa kivulini. Boke ameona konokono."),
    "pg058_im002": ("Fuatisha herufi kubwa M.", "Fuatisha herufi kubwa ma."),
    "pg058_im003": ("Majina Monika, Musa, Mikidadi na Moli.", "Majina Monika. Musa. Mikidadi. Moli."),
    "pg059_im001": ("Fuatisha herufi kubwa D.", "Fuatisha herufi kubwa da."),
    "pg059_im002": ("Majina Diana, Dina, Daudi na Dabaga.", "Majina Diana. Dina. Daudi. Dabaga."),
    "pg059_im003": ("Sentensi: Daudi anamfukuza kima.", "Sentensi. Daudi anamfukuza kima."),
    "pg060_im001": ("Fuatisha herufi kubwa K.", "Fuatisha herufi kubwa ka."),
    "pg060_im002": ("Majina Kibibi, Kimani, Kamau na Kasimu.", "Majina Kibibi. Kimani. Kamau. Kasimu."),
    "pg060_im003": ("Sentensi: Kibibi ameokota kalamu. Kamau ana duka zuri.", "Sentensi. Kibibi ameokota kalamu. Kamau ana duka zuri."),
    "pg061_im001": ("Fuatisha herufi kubwa N.", "Fuatisha herufi kubwa na."),
    "pg061_im002": ("Majina Naomi, Neema, Naima na Nora.", "Majina Naomi. Neema. Naima. Nora."),
    "pg061_im003": ("Sentensi: Naima amevaa gauni jeupe. Nuru anachota maji.", "Sentensi. Naima amevaa gauni jeupe. Nuru anachota maji."),
    "pg062_im001": ("Watoto watatu wanajitambulisha kwa majina.", "Watoto watatu wanajitambulisha kwa majina."),
}

DECORATIVE = {"pg058_im004"}

TEXT_REPLACEMENTS = {
    "pg052_s002_n0002": "Kuandika herufi ya irabu A",
    "pg053_s001_n0002": "Kuandika herufi ya irabu E",
    "pg054_s001_n0002": "Kuandika herufi ya irabu I",
    "pg054_s001_n0003": "Katika somo hili utajifunza kuandika herufi ya irabu I.",
    "pg054_s001_n0004": "Fuatisha herufi ya irabu I.",
    "pg055_s001_n0002": "Kuandika herufi ya irabu O",
    "pg056_s001_n0002": "Kuandika herufi ya irabu U",
    "pg056_s001_n0003": "Katika somo hili utajifunza kuandika herufi ya irabu U.",
    "pg056_s001_n0004": "Fuatisha herufi ya irabu U.",
    "pg057_s002_n0002": "Kuandika herufi ya konsonanti B",
    "pg058_s001_n0003": "Kuandika herufi ya konsonanti M",
    "pg059_s001_n0002": "Kuandika herufi ya konsonanti D",
    "pg060_s001_n0002": "Kuandika herufi ya konsonanti K",
    "pg061_s001_n0002": "Kuandika herufi ya konsonanti N",
}

EXTRA_AUDIO = {
    "pg052_s002_n0002": "Kuandika herufi ya irabu aaa.",
    "pg053_s001_n0002": "Kuandika herufi ya irabu eee.",
    "pg054_s001_n0002": "Kuandika herufi ya irabu iii.",
    "pg054_s001_n0003": "Katika somo hili utajifunza kuandika herufi ya irabu iii.",
    "pg054_s001_n0004": "Fuatisha herufi ya irabu iii.",
    "pg055_s001_n0002": "Kuandika herufi ya irabu ooo.",
    "pg056_s001_n0002": "Kuandika herufi ya irabu uuu.",
    "pg056_s001_n0003": "Katika somo hili utajifunza kuandika herufi ya irabu uuu.",
    "pg056_s001_n0004": "Fuatisha herufi ya irabu uuu.",
    "pg057_s002_n0002": "Kuandika herufi ya konsonanti ba.",
    "pg058_s001_n0003": "Kuandika herufi ya konsonanti ma.",
    "pg059_s001_n0002": "Kuandika herufi ya konsonanti da.",
    "pg060_s001_n0002": "Kuandika herufi ya konsonanti ka.",
    "pg061_s001_n0002": "Kuandika herufi ya konsonanti na.",
    "pg062_s001_n0005": "Mimi ninaitwa, dashi. Wewe unaitwa, dashi.",
    "pg062_s001_n0006": "Na huyu anaitwa, dashi.",
    "pg063_s001_n0004": "Jieleze. Rudia ubeti huu mara sita.",
    "pg063_s001_n0013": "Namba tatu. Andika herufi kubwa zilizotumika katika wimbo huo. Majina ni Asha, Baraka na Amina. Herufi kubwa ni A, B na A.",
    "pg063_s001_n0014": "",
}


def update_image(source: str, image_id: str, visible: str | None) -> str:
    image_pattern = re.compile(rf'(<img\b(?=[^>]*\bdata-id="{re.escape(image_id)}")[^>]*)(>)', re.DOTALL)

    def repl(match: re.Match[str]) -> str:
        attrs = match.group(1)
        encoded = html.escape(visible or "", quote=True)
        for name in ("alt", "data-adt-description"):
            if re.search(rf'\b{name}="[^"]*"', attrs):
                attrs = re.sub(rf'\b{name}="[^"]*"', f'{name}="{encoded}"', attrs)
            else:
                attrs += f' {name}="{encoded}"'
        if visible:
            aid = f"{image_id}_audio_description"
            if not re.search(r'\bdata-adt-audio-description-id="[^"]*"', attrs):
                attrs += f' data-adt-audio-description-id="{aid}"'
        else:
            attrs = re.sub(r'\s+data-adt-audio-description-id="[^"]*"', "", attrs)
            if not re.search(r'\baria-hidden="[^"]*"', attrs):
                attrs += ' aria-hidden="true"'
        return attrs + match.group(2)

    source, ic = image_pattern.subn(repl, source)
    aid = f"{image_id}_audio_description"
    cap = re.compile(rf'(<figcaption\b[^>]*\bdata-id="{re.escape(aid)}"[^>]*>)(.*?)(</figcaption>)', re.DOTALL)
    source, cc = cap.subn(lambda m: m.group(1) + html.escape(visible or "") + m.group(3), source)
    if not ic or not cc:
        raise RuntimeError(f"Missing image/caption {image_id}: {ic}/{cc}")
    return source


def replace_text(source: str, item_id: str, visible: str) -> str:
    pat = re.compile(rf'(<[^>]+\bdata-id="{re.escape(item_id)}"[^>]*>)(.*?)(</[^>]+>)', re.DOTALL)
    out, count = pat.subn(lambda m: m.group(1) + html.escape(visible) + m.group(3), source)
    if count != 1:
        raise RuntimeError(f"Expected one text node {item_id}; found {count}")
    return out


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
        filename = f"{aid}_supervisor_v4.mp3"
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
        found = 0
        for page in sorted(ROOT.glob(f"pg{item_id[2:5]}_sec*.html")):
            source = pages.get(page, page.read_text(encoding="utf-8"))
            if f'data-id="{item_id}"' in source:
                pages[page] = replace_text(source, item_id, visible)
                found += 1
        if found != 1:
            raise RuntimeError(f"Expected one page for {item_id}; found {found}")
        texts[item_id] = visible

    for item_id, spoken in EXTRA_AUDIO.items():
        if spoken:
            filename = f"{item_id}_supervisor_v4.mp3"
            audios[item_id] = filename
            audio_work[filename] = spoken
        else:
            audios.pop(item_id, None)

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for page, source in pages.items():
        page.write_text(source, encoding="utf-8")

    sem = asyncio.Semaphore(4)

    async def limited(name: str, speech: str) -> None:
        async with sem:
            await generate(name, speech)

    await asyncio.gather(*(limited(name, speech) for name, speech in audio_work.items()))
    print(f"batch5 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
