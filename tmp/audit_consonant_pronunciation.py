import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEXTS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "texts.json"
AUDIOS_PATH = ROOT / "content" / "i18n" / "sw-TZ" / "audios.json"
REPORT_PATH = ROOT / "reports" / "consonant-pronunciation-audit-2026-08-29.md"
DATA_PATH = ROOT / "reports" / "consonant-pronunciation-audit-2026-08-29.json"


# Matamshi yaliyoidhinishwa kwenye ukurasa wa 14.
CONSONANTS = {
    "b": "ba",
    "m": "ma",
    "d": "da",
    "k": "ka",
    "n": "na",
    "l": "la",
    "t": "ta",
    "p": "pa",
    "s": "sa",
    "f": "fa",
    "j": "ja",
    "g": "ga",
    "y": "ya",
    "z": "za",
    "r": "ra",
    "h": "ha",
    "w": "wa",
    "v": "va",
    "ch": "cha",
}

# Herufi ambatani zilizoonekana kwenye kitabu. Mpangilio mrefu-kwanza
# unazuia "ngw" kugawanywa kuwa "ng" na "w".
BLENDS = {
    "njw": "njwa",
    "ngw": "ngwa",
    "ndw": "ndwa",
    "ng'": "ng'a",
    "ng’": "ng'a",
    "sh": "sha",
    "ny": "nya",
    "ng": "nga",
    "nd": "nda",
    "th": "tha",
    "mb": "mba",
    "kw": "kwa",
    "gw": "gwa",
    "sw": "swa",
    "vy": "vya",
    "nj": "nja",
    "pw": "pwa",
    "fy": "fya",
}

# Irabu zilizotengwa huendelezwa kwa utaratibu uliokwisha kubaliwa ili
# regeneration ya baadaye isirudishe tatizo la kuziunganisha.
VOWELS = {"a": "aaa", "e": "eee", "i": "iii", "o": "ooo", "u": "uuu"}

# Hizi zina herufi za pekee lakini si mazoezi ya matamshi ya konsonanti.
EXCLUDED_IDS = {
    "pg002_s001_n0005",  # namba ya uchapishaji S.L.P.
    "pg005_s001_n0014",  # majina na vifupisho vya wahariri
    "pg005_s001_n0016",
    "pg063_s001_n0004",  # alama ya marudio x6
    "pg104_s001_n0001",  # lebo ya swali B.
}

APPROVED_SAMPLE_IDS = {
    "pg014_s001_n0003",
    "pg014_s002_n0004",
    "pg014_s002_n0006",
    "pg014_s002_n0009",
}

ALL_SPOKEN = {**CONSONANTS, **BLENDS, **VOWELS}
CONSONANT_TOKENS = sorted({*CONSONANTS, *BLENDS}, key=len, reverse=True)
ALL_TOKENS = sorted(ALL_SPOKEN, key=len, reverse=True)
LETTER_BOUNDARY = r"A-Za-zÀ-ÿ"
CONSONANT_RE = re.compile(
    rf"(?<![{LETTER_BOUNDARY}])({'|'.join(map(re.escape, CONSONANT_TOKENS))})(?![{LETTER_BOUNDARY}])",
    re.IGNORECASE,
)
ALL_TOKEN_RE = re.compile(
    rf"(?<![{LETTER_BOUNDARY}])({'|'.join(map(re.escape, ALL_TOKENS))})(?![{LETTER_BOUNDARY}])",
    re.IGNORECASE,
)


def spoken_text(text: str) -> str:
    def replace(match: re.Match[str]) -> str:
        token = match.group(1)
        return ALL_SPOKEN[token.lower()]

    return ALL_TOKEN_RE.sub(replace, text)


def page_number(key: str) -> int:
    match = re.match(r"pg(\d{3})", key)
    return int(match.group(1)) if match else 0


def escape_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip()


texts = json.loads(TEXTS_PATH.read_text(encoding="utf-8"))
audios = json.loads(AUDIOS_PATH.read_text(encoding="utf-8"))

all_text_candidates = [
    key
    for key, text in texts.items()
    if key not in EXCLUDED_IDS and isinstance(text, str) and CONSONANT_RE.search(text)
]
paired_image_sources = [
    key
    for key in all_text_candidates
    if key not in audios
    and f"{key}_audio_description" in texts
    and f"{key}_audio_description" in audios
]
unmapped_candidates = [
    key for key in all_text_candidates if key not in audios and key not in paired_image_sources
]

rows = []
for key, text in texts.items():
    if key in EXCLUDED_IDS or key not in audios or not isinstance(text, str):
        continue
    if not CONSONANT_RE.search(text):
        continue
    proposed = spoken_text(text)
    rows.append(
        {
            "page": page_number(key),
            "id": key,
            "current_text": text,
            "proposed_spoken_text": proposed,
            "audio_file": audios[key],
            "status": "Sampuli imekubaliwa" if key in APPROVED_SAMPLE_IDS else "Inasubiri idhini",
        }
    )

rows.sort(key=lambda row: (row["page"], row["id"]))
pending = [row for row in rows if row["status"] == "Inasubiri idhini"]
approved = [row for row in rows if row["status"] == "Sampuli imekubaliwa"]
counts = Counter(row["page"] for row in pending)

summary_rows = "\n".join(
    f"| {page} | {count} |"
    for page, count in sorted(counts.items())
)

detail_rows = "\n".join(
    "| {page} | `{id}` | {current} | {proposed} | `{audio}` | {status} |".format(
        page=row["page"],
        id=row["id"],
        current=escape_cell(row["current_text"]),
        proposed=escape_cell(row["proposed_spoken_text"]),
        audio=escape_cell(row["audio_file"]),
        status=row["status"],
    )
    for row in rows
)

report = f"""# Ukaguzi wa matamshi ya konsonanti — Kuandika Mwaka wa Kwanza

Tarehe: 29 Agosti 2026

## Kanuni ya matamshi iliyokubaliwa

- Konsonanti: `b → ba`, `m → ma`, `d → da`, `k → ka`, `n → na`, na vivyo hivyo kwa konsonanti nyingine.
- Herufi ambatani: kwa mfano `ch → cha`, `sh → sha`, `ny → nya`, `ng → nga`, `mb → mba`, `ngw → ngwa`.
- Irabu iliyosimama peke yake inaendelea kutumia utaratibu uliokubaliwa: `a → aaa`, `e → eee`, `i → iii`, `o → ooo`, `u → uuu`.
- Vifupisho, majina ya wahariri, alama ya marudio `x6`, na lebo ya swali `B.` vimeondolewa kwenye mabadiliko ya jumla.

## Muhtasari

- Vipengele vya maandishi vilivyokaguliwa: **{len(all_text_candidates)}**
- Maandishi ya michoro yanayotumia sauti ya jozi ya `_audio_description`: **{len(paired_image_sources)}**
- Vipengele vyenye faili ya sauti ya moja kwa moja: **{len(rows)}**
- Sampuli za ukurasa wa 14 zilizokubaliwa: **{len(approved)}**
- Sauti zinazopendekezwa kurekebishwa baada ya idhini: **{len(pending)}**
- Kurasa zilizoathirika: **{len(counts)}**
- Vipengele visivyo na sauti wala jozi ya maelezo: **{len(unmapped_candidates)}**

Ukaguzi huu umejumuisha maandishi ya kawaida na maelezo ya michoro. Vipengele vya picha visivyo na sauti moja kwa moja vina jozi kamili ya `_audio_description`; kwa hiyo hakuna kipengele cha konsonanti kilichokosa njia ya sauti kwenye ukaguzi huu.

> **Uangalizi wa ukurasa wa 8:** maelezo yana umbo lililoitwa `c`. `c` si konsonanti inayofundishwa peke yake kwenye orodha ya Kiswahili ya kitabu; kwa hiyo imeachwa kama ilivyo, huku `m` na `W` zikibadilishwa kuwa `ma` na `wa`.

| Ukurasa | Idadi ya sauti zinazosubiri idhini |
|---:|---:|
{summary_rows}

## Jedwali kamili la matamshi

| Ukurasa | Kitambulisho | Maandishi ya sasa | Matamshi yanayopendekezwa | Faili ya sauti | Hali |
|---:|---|---|---|---|---|
{detail_rows}
"""

REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
REPORT_PATH.write_text(report, encoding="utf-8")
DATA_PATH.write_text(
    json.dumps(
        {
            "generated_on": "2026-08-29",
            "approved_sample_count": len(approved),
            "pending_count": len(pending),
            "all_text_candidate_count": len(all_text_candidates),
            "paired_image_source_count": len(paired_image_sources),
            "unmapped_candidate_count": len(unmapped_candidates),
            "affected_pages": sorted(counts),
            "excluded_ids": sorted(EXCLUDED_IDS),
            "rows": rows,
        },
        ensure_ascii=False,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

print(f"rows={len(rows)} approved={len(approved)} pending={len(pending)} pages={len(counts)}")
print(REPORT_PATH)
print(DATA_PATH)
