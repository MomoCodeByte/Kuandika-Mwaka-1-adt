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
    "pg085_im001": (
        "Mistari minne ya michoro: herufi a, ch, d na m zimerudiwa kwa mwandiko wa kuunga.",
        "Nakili kila mchoro. Mstari wa kwanza, herufi aaa zilizorudiwa. Mstari wa pili, herufi cha zilizorudiwa. Mstari wa tatu, herufi da zilizorudiwa. Mstari wa nne, herufi ma zilizorudiwa.",
    ),
    "pg086_im001": (
        "Mistari mitatu ya silabi me, ne na na zilizorudiwa kwa mwandiko wa kuunga.",
        "Nakili silabi hizi. Mstari wa kwanza, me, me, me, me, me. Mstari wa pili, ne, ne, ne, ne, ne. Mstari wa tatu, na, na, na, na, na.",
    ),
    "pg086_im002": (
        "Maneno tembo, bege, ondoa, kondoo, papai na kitanda kwa mwandiko wa kuunga.",
        "Nakili maneno haya. tembo. bege. ondoa. kondoo. papai. kitanda.",
    ),
    "pg094_im001": (
        "Picha ya pili: Mwanamke na mwanamume wakiwa shambani kuvuna mahindi mabichi.",
        "Picha ya pili. Mwanamke na mwanamume wako shambani wakivuna mahindi mabichi.",
    ),
    "pg094_im002": (
        "Picha ya tatu: Mwanamke na mwanamume wakiwa shambani wanalima.",
        "Picha ya tatu. Mwanamke na mwanamume wako shambani wakilima kwa majembe.",
    ),
}

EXTRA_AUDIO = {
    "pg080_s001_n0006": "Kuandika herufi ambatani. sha. nya. nga. nda. tha. mba.",
    "pg080_s001_n0007": "kwa. gwa. swa. vya. ngwa. ndwa. njwa.",
    "pg080_s001_n0009": "sha. nya. nga. nda. tha. mba. kwa. gwa. swa. vya. ngwa. ndwa.",
    "pg080_s001_n0010": "njwa.",
    "pg080_s002_n0007": "Mfano, konsonanti sha, nya, nga, nda, tha, mba, kwa, gwa.",
    "pg080_s002_n0008": "swa, vya, ng'a, na irabu, eee, ooo, iii, uuu, aaa.",
    "pg081_s001_n0002": "Unda silabi kwa kutumia konsonanti swa, vya, rwa, pya.",
    "pg081_s001_n0003": "nja, pwa, fya, ng'a, na irabu, uuu, eee, iii, ooo, aaa.",
    "pg081_s002_n0013": "Unda maneno yenye herufi ambatani nga, nda, kwa.",
    "pg081_s002_n0014": "na swa.",
    "pg082_s001_n0001": "Mfano wa konsonanti ngwa. ndwa. mbwa. njwa. chwa. nywa.",
    "pg082_s001_n0002": "shwa, na irabu, iii, eee, aaa, ooo, uuu.",
    "pg082_s001_n0008": "Unda silabi kwa kutumia konsonanti ngwa, ndwa, mbwa.",
    "pg082_s001_n0009": "njwa, chwa, nywa, shwa, na irabu, uuu, eee, iii, ooo, aaa.",
    "pg082_s002_n0004": "ambatani ngwa, ndwa, mbwa, njwa, chwa, nywa, shwa, na",
    "pg082_s002_n0005": "irabu, aaa, eee, iii, ooo, uuu.",
    "pg082_s002_n0012": "Unda maneno yenye konsonanti ambatani ngwa na",
    "pg082_s002_n0013": "chwa, na irabu, aaa, eee, iii, ooo, uuu.",
    "pg083_s002_n0005": "Herufi hizo ni, ba. ga. ja. ooo. pa. na ya.",
    "pg083_s002_n0004": "zinazoungwa upande wa kushoto tu. Herufi hizo ni",
    "pg084_s002_n0006": "aaa. cha. da. eee. ha. iii. ka. la. ma. na. ta. ra. uuu. va. wa.",
    "pg084_s002_n0008": "aaa. cha. da. eee. ha. iii. ka. la. ma. na. ta. ra. uuu. va. wa.",
    "pg085_s001_n0003": "kwenda kulia. eee. ha. iii. ka. ra. uuu.",
    "pg086_s001_n0004": "la. me. di. ka. ba. cha. pi. go. jo. sha. ndo.",
    "pg086_s001_n0005": "kwi. nyi. wa. thu. ha. ni. to. da. ma. mwa.",
    "pg086_s001_n0006": "nwe. dhu. ro. vi. na ta.",
    "pg088_s002_n0004": "Herufi ambazo haziungwi ni fa, sa na za.",
    "pg088_s002_n0005a": "fa. fa. fa. fa. fa. fa. fa. fa. fa. fa.",
    "pg088_s002_n0006": "sa. sa. sa. sa. sa. sa. sa. sa. sa. sa.",
    "pg088_s002_n0007": "za. za. za. za. za. za. za. za. za. za.",
    "pg089_s002_n0007": "Jedwali lina sentensi zilizochanganywa na sentensi zilizopangwa.",
    "pg089_s002_n0008": "Safu ya sentensi zilizochanganywa, namba moja, Ninakwenda shuleni. Safu ya sentensi zilizopangwa, namba moja, Ninaamka asubuhi na mapema.",
    "pg089_s002_n0010": "Sentensi zilizochanganywa, namba mbili, Ninakunywa uji. Sentensi zilizopangwa, namba mbili, Ninapiga mswaki na kuoga.",
    "pg089_s002_n0012": "Sentensi zilizochanganywa, namba tatu, Ninaamka asubuhi na mapema. Sentensi zilizopangwa, namba tatu, Ninavaa sare ya shule.",
    "pg089_s002_n0014": "Sentensi zilizochanganywa, namba nne, Ninavaa sare ya shule. Sentensi zilizopangwa, namba nne, Ninakunywa uji.",
    "pg089_s002_n0015": "Sentensi zilizochanganywa, namba tano, Ninapiga mswaki na kuoga. Sentensi zilizopangwa, namba tano, Ninakwenda shuleni.",
    "pg089_s002_n0009": "",
    "pg089_s002_n0011": "",
    "pg089_s002_n0013": "",
    "pg089_s002_n0016": "",
    "pg092_s002_n0006": "Chagua neno katika kisanduku na jaza nafasi zilizo wazi. Maneno ni jembe, viatu, mayai, kufuli na sukari.",
    "pg092_s002_n0008": "Namba moja. Kuku wa dada ametaga, dashi.",
    "pg092_s002_n0009": "Namba mbili. Dogoli amevaa, dashi, na soksi.",
    "pg092_s002_n0010": "Namba tatu. Bakari amekunywa chai yenye, dashi.",
    "pg092_s002_n0011": "Namba nne. Mama amenunua, dashi, la kulimia.",
    "pg092_s002_n0012": "Namba tano. Malima amefunga mlango kwa, dashi.",
    "pg093_s001_n0002": "Chagua neno katika kisanduku na jaza nafasi zilizo wazi.",
    "pg093_s001_n0004": "Maneno ni, amevaa, anabweka, mbuzi, wanacheza na kamba.",
    "pg093_s001_n0005": "Namba moja. Asha anaruka, dashi.",
    "pg093_s001_n0006": "Namba mbili. Mbwa, dashi.",
    "pg093_s001_n0007": "Namba tatu. Baba, dashi, kofia.",
    "pg093_s001_n0008": "Namba nne. Watoto, dashi, mpira.",
    "pg093_s001_n0009": "Namba tano. Penina atakwenda kuchunga, dashi, wa babu.",
    "pg094_s001_n0004": "Namba moja, dashi.",
    "pg094_s001_n0005": "Namba mbili, dashi.",
    "pg094_s001_n0006": "Namba tatu, dashi.",
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
        return attrs + match.group(2)
    source, ic = image_pattern.subn(repl, source)
    aid = f"{image_id}_audio_description"
    cap = re.compile(rf'(<figcaption\b[^>]*\bdata-id="{re.escape(aid)}"[^>]*>)(.*?)(</figcaption>)', re.DOTALL)
    source, cc = cap.subn(lambda m: m.group(1) + html.escape(visible) + m.group(3), source)
    if not ic or not cc:
        raise RuntimeError(f"Missing image/caption {image_id}: {ic}/{cc}")
    return source


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
            raise RuntimeError(image_id)
        texts[image_id] = visible
        aid = f"{image_id}_audio_description"
        texts[aid] = visible
        filename = f"{aid}_supervisor_v6.mp3"
        audios[aid] = filename
        audio_work[filename] = spoken

    for item_id, spoken in EXTRA_AUDIO.items():
        if spoken:
            filename = f"{item_id}_supervisor_v6.mp3"
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
    print(f"batch7 pages={len(pages)} audio={len(audio_work)}")


if __name__ == "__main__":
    asyncio.run(main())
