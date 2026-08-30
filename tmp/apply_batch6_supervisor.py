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

# Visible descriptions stay concise. Spoken descriptions read the exact content a
# learner is expected to copy, in a deliberate one-item-at-a-time order.
DESCRIPTIONS = {
    "pg064_im001": ("Fuatisha herufi kubwa L.", "Fuatisha herufi kubwa la."),
    "pg064_im002": ("Majina Lina, Lulu, Lazaro na Luka.", "Majina. Lina. Lulu. Lazaro. Luka."),
    "pg064_im003": ("Sentensi: Lazaro amelala. Lulu anasoma loteza.", "Sentensi. Lazaro amelala. Lulu anasoma loteza."),
    "pg065_im001": ("Fuatisha herufi kubwa T.", "Fuatisha herufi kubwa ta."),
    "pg065_im002": ("Majina Tina, Tausi, Tunu, Tamari na Tatu.", "Majina. Tina. Tausi. Tunu. Tamari. Tatu."),
    "pg065_im003": ("Sentensi: Tito anaota moto. Tunu amenunua maini.", "Sentensi. Tito anaota moto. Tunu amenunua maini."),
    "pg066_im001": ("Fuatisha herufi kubwa P.", "Fuatisha herufi kubwa pa."),
    "pg066_im002": ("Majina Paulina, Paulo, Piti na Penina.", "Majina. Paulina. Paulo. Piti. Penina."),
    "pg066_im003": ("Sentensi: Piti amechukua kikapu na bakuli. Paulina amepika pilau tamu.", "Sentensi. Piti amechukua kikapu na bakuli. Paulina amepika pilau tamu."),
    "pg067_im001": ("Fuatisha herufi kubwa S.", "Fuatisha herufi kubwa sa."),
    "pg067_im002": ("Majina Subira, Saumu, Sudi na Sakina.", "Majina. Subira. Saumu. Sudi. Sakina."),
    "pg067_im003": ("Sentensi: Saidi amenunua samaki na sukari. Salima ana kabati na kochi.", "Sentensi. Saidi amenunua samaki na sukari. Salima ana kabati na kochi."),
    "pg068_im002": ("Fuatisha herufi kubwa F. Majina Fatuma, Filipo, Fidelisi na Fina. Sentensi: Fatuma anafua taulo. Fidea amepaka mafuta usoni.", "Fuatisha herufi kubwa fa. Majina. Fatuma. Filipo. Fidelisi. Fina. Sentensi. Fatuma anafua taulo. Fidea amepaka mafuta usoni."),
    "pg068_im003": ("Majina Fatuma, Filipo, Fidelisi na Fina.", "Majina. Fatuma. Filipo. Fidelisi. Fina."),
    "pg068_im004": ("Sentensi: Fatuma anafua taulo. Fidea amepaka mafuta usoni.", "Sentensi. Fatuma anafua taulo. Fidea amepaka mafuta usoni."),
    "pg069_im001": ("Fuatisha herufi kubwa J.", "Fuatisha herufi kubwa ja."),
    "pg069_im002": ("Majina Jakaya, Jamila, Juma na Jemima.", "Majina. Jakaya. Jamila. Juma. Jemima."),
    "pg069_im003": ("Sentensi: Juma amelima bamia na mipapai. Jema anakula tikitimaji.", "Sentensi. Juma amelima bamia na mipapai. Jema anakula tikitimaji."),
    "pg071_im001": ("Fuatisha herufi kubwa G.", "Fuatisha herufi kubwa ga."),
    "pg071_im002": ("Majina Gidioni, Gatinoma, Gama na Gati.", "Majina. Gidioni. Gatinoma. Gama. Gati."),
    "pg072_im001": ("Sentensi: Gati anapiga gitaa. Gidioni anafagia uani.", "Sentensi. Gati anapiga gitaa. Gidioni anafagia uani."),
    "pg072_im002": ("Fuatisha herufi kubwa Y.", "Fuatisha herufi kubwa ya."),
    "pg072_im003": ("Majina Yahaya, Yona, Yuda na Yunusi.", "Majina. Yahaya. Yona. Yuda. Yunusi."),
    "pg072_im004": ("Sentensi: Gati anapiga gitaa. Gidioni anafagia uani. Fuatisha herufi kubwa Y. Majina Yahaya, Yona, Yuda na Yunusi. Sentensi: Yusufu na Yohana wanacheza mpira.", "Sentensi za ga. Gati anapiga gitaa. Gidioni anafagia uani. Sasa fuatisha herufi kubwa ya. Majina ya kuandika. Yahaya. Yona. Yuda. Yunusi. Sentensi. Yusufu na Yohana wanacheza mpira."),
    "pg073_im001": ("Fuatisha herufi kubwa Z.", "Fuatisha herufi kubwa za."),
    "pg073_im002": ("Majina Zena, Zainabu, Zakayo na Zaituni.", "Majina. Zena. Zainabu. Zakayo. Zaituni."),
    "pg074_im001": ("Fuatisha herufi kubwa R.", "Fuatisha herufi kubwa ra."),
    "pg074_im002": ("Majina Rehema, Remi, Razia na Rita.", "Majina. Rehema. Remi. Razia. Rita."),
    "pg074_im003": ("Sentensi: Rita na Razia ni marafiki. Rajabu anarina asali.", "Sentensi. Rita na Razia ni marafiki. Rajabu anarina asali."),
    "pg075_im002": ("Fuatisha herufi kubwa H.", "Fuatisha herufi kubwa ha."),
    "pg075_im003": ("Majina Hamisi, Hasani, Habibu na Hadija.", "Majina. Hamisi. Hasani. Habibu. Hadija."),
    "pg075_im004": ("Sentensi: Hamisi anakata hoho. Halima hufua leso kila siku.", "Sentensi. Hamisi anakata hoho. Halima hufua leso kila siku."),
    "pg076_im001": ("Fuatisha herufi kubwa W.", "Fuatisha herufi kubwa wa."),
    "pg076_im002": ("Majina Wema, Wahida, Waridi na Wami.", "Majina. Wema. Wahida. Waridi. Wami."),
    "pg076_im003": ("Sentensi: Waridi ameona wawili watatu. Wema amefurahi kuwahi darasani.", "Sentensi. Waridi ameona wawili watatu. Wema amefurahi kuwahi darasani."),
    "pg077_im001": ("Fuatisha herufi kubwa V.", "Fuatisha herufi kubwa va."),
    "pg078_im001": ("Majina Vumilia, Vanesa, Viviani na Vida.", "Majina. Vumilia. Vanesa. Viviani. Vida."),
    "pg078_im002": ("Sentensi: Vitalisi amevaa viatu vizuri. Vaileti amesoma vitabu vitatu.", "Sentensi. Vitalisi amevaa viatu vizuri. Vaileti amesoma vitabu vitatu."),
    "pg078_im003": ("Fuatisha konsonanti kubwa CH.", "Fuatisha konsonanti kubwa cha."),
    "pg079_im001": ("Sentensi: Chausiku anacheza na Chacha. Chale anachota maji.", "Sentensi. Chausiku anacheza na Chacha. Chale anachota maji."),
}

TEXT_REPLACEMENTS = {
    "pg064_s002_n0002": "Kuandika herufi ya konsonanti L",
    "pg065_s001_n0002": "Kuandika herufi ya konsonanti T",
    "pg066_s001_n0002": "Kuandika herufi ya konsonanti P",
    "pg067_s001_n0002": "Kuandika herufi ya konsonanti S",
    "pg068_s001_n0002": "Kuandika herufi ya konsonanti F",
    "pg069_s001_n0002": "Kuandika herufi ya konsonanti J",
    "pg071_s002_n0002": "Kuandika herufi ya konsonanti G",
    "pg073_s001_n0002": "Kuandika herufi ya konsonanti Z",
    "pg074_s001_n0002": "Kuandika herufi ya konsonanti R",
    "pg075_s001_n0002": "Kuandika herufi ya konsonanti H",
    "pg076_s001_n0002": "Kuandika herufi ya konsonanti W",
    "pg077_s001_n0004": "Kuandika herufi ya konsonanti V",
}

EXTRA_AUDIO = {
    "pg064_s001_n0004": "Konsonanti. la. ta. pa. sa. fa. ja.",
    "pg064_s002_n0002": "Kuandika herufi ya konsonanti la.",
    "pg065_s001_n0002": "Kuandika herufi ya konsonanti ta.",
    "pg066_s001_n0002": "Kuandika herufi ya konsonanti pa.",
    "pg067_s001_n0002": "Kuandika herufi ya konsonanti sa.",
    "pg068_s001_n0002": "Kuandika herufi ya konsonanti fa.",
    "pg069_s001_n0002": "Kuandika herufi ya konsonanti ja.",
    "pg069_s001_n0011": "Namba moja. leo. Namba mbili. tuta. Namba tatu. penseli. Namba nne. sikio. Namba tano. furaha. Namba sita. jema.",
    "pg070_s001_n0007": "Namba moja. Fano. dashi.",
    "pg070_s001_n0008": "Namba mbili. Puna anasukuma. dashi.",
    "pg070_s001_n0009": "Namba tatu. Tizo. dashi. kuni.",
    "pg070_s001_n0010": "Namba nne. Sia. dashi. picha.",
    "pg070_s001_n0011": "Namba tano. Sudi na Adila. dashi.",
    "pg071_s001_n0004": "Konsonanti. ga. ya. za. ra. ha. wa. va. cha.",
    "pg071_s002_n0002": "Kuandika herufi ya konsonanti ga.",
    "pg072_s001_n0003": "Kuandika herufi ya konsonanti ya.",
    "pg073_s001_n0002": "Kuandika herufi ya konsonanti za.",
    "pg074_s001_n0002": "Kuandika herufi ya konsonanti ra.",
    "pg075_s001_n0002": "Kuandika herufi ya konsonanti ha.",
    "pg076_s001_n0002": "Kuandika herufi ya konsonanti wa.",
    "pg077_s001_n0002": "Andika majina matano yanayoanza na herufi wa.",
    "pg077_s001_n0004": "Kuandika herufi ya konsonanti va.",
    "pg078_s002_n0002": "Kuandika konsonanti cha.",
    "pg079_s001_n0003": "Andika sentensi tatu kutoka katika jedwali hili. Jedwali lina maneno haya, kwa mpangilio. gogo. yangeyange. zeze. Chacha amebeba redio. hereni. wavu. viatu.",
}


def update_image(source: str, image_id: str, visible: str) -> str:
    image_pattern = re.compile(rf'(<img\b(?=[^>]*\bdata-id="{re.escape(image_id)}")[^>]*)(>)', re.DOTALL)
    def repl(match: re.Match[str]) -> str:
        attrs = match.group(1)
        encoded = html.escape(visible, quote=True)
        for name in ("alt", "data-adt-description"):
            if re.search(rf'\b{name}="[^"]*"', attrs):
                attrs = re.sub(rf'\b{name}="[^"]*"', f'{name}="{encoded}"', attrs)
            else:
                attrs += f' {name}="{encoded}"'
        aid = f"{image_id}_audio_description"
        if not re.search(r'\bdata-adt-audio-description-id="[^"]*"', attrs):
            attrs += f' data-adt-audio-description-id="{aid}"'
        attrs = re.sub(r'\s+aria-hidden="true"', "", attrs)
        return attrs + match.group(2)
    source, ic = image_pattern.subn(repl, source)
    aid = f"{image_id}_audio_description"
    cap = re.compile(rf'(<figcaption\b[^>]*\bdata-id="{re.escape(aid)}"[^>]*>)(.*?)(</figcaption>)', re.DOTALL)
    source, cc = cap.subn(lambda m: m.group(1) + html.escape(visible) + m.group(3), source)
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
        filename = f"{aid}_supervisor_v5.mp3"
        audios[aid] = filename
        audio_work[filename] = spoken

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
        filename = f"{item_id}_supervisor_v5.mp3"
        audios[item_id] = filename
        audio_work[filename] = spoken

    TEXTS_PATH.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIOS_PATH.write_text(json.dumps(audios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for page, source in pages.items():
        page.write_text(source, encoding="utf-8")

    sem = asyncio.Semaphore(4)
    async def limited(name: str, speech: str) -> None:
        async with sem:
            await generate(name, speech)
    await asyncio.gather(*(limited(name, speech) for name, speech in audio_work.items()))
    print(f"batch6 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
