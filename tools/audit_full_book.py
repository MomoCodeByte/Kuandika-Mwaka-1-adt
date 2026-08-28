import argparse
import html
import json
import re
from pathlib import Path

from pypdf import PdfReader


WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+", re.UNICODE)
TAG_RE = re.compile(r"<[^>]+>")
SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1>", re.I | re.S)
IMG_RE = re.compile(r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']", re.I)
DATA_ID_RE = re.compile(r"\bdata-id=[\"']([^\"']+)[\"']", re.I)


def words(value: str) -> set[str]:
    return {token.lower() for token in WORD_RE.findall(value) if len(token) > 1}


def html_text(value: str) -> str:
    value = SCRIPT_RE.sub(" ", value)
    return html.unescape(TAG_RE.sub(" ", value))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    root = Path(args.root)
    reader = PdfReader(args.pdf)
    records = []

    for page_number in range(41, 106):
        code = f"{page_number:03d}"
        files = sorted(root.glob(f"pg{code}_sec*.html"))
        source = "\n".join(file.read_text(encoding="utf-8") for file in files)
        pdf_text = reader.pages[page_number - 1].extract_text() or ""
        pdf_words = words(pdf_text)
        adt_words = words(html_text(source))
        shared = pdf_words & adt_words
        coverage = round(len(shared) / len(pdf_words), 3) if pdf_words else None

        missing_images = []
        for src in IMG_RE.findall(source):
            clean = src.split("?", 1)[0].split("#", 1)[0]
            if clean.startswith(("data:", "http://", "https://")):
                continue
            if not (root / clean).exists():
                missing_images.append(clean)

        data_ids = DATA_ID_RE.findall(source)
        duplicate_ids = sorted({item for item in data_ids if data_ids.count(item) > 1})
        records.append(
            {
                "page": page_number,
                "sections": [file.name for file in files],
                "section_count": len(files),
                "pdf_word_count": len(pdf_words),
                "adt_word_count": len(adt_words),
                "pdf_to_adt_word_coverage": coverage,
                "missing_images": sorted(set(missing_images)),
                "duplicate_data_ids": duplicate_ids,
                "response_count": source.count("data-response-id="),
                "image_count": len(IMG_RE.findall(source)),
            }
        )

    report = {
        "pdf_pages": len(reader.pages),
        "audited_range": [41, 105],
        "pages_audited": len(records),
        "missing_html_pages": [r["page"] for r in records if not r["sections"]],
        "pages_with_missing_images": [r["page"] for r in records if r["missing_images"]],
        "pages_with_multiple_sections": [r["page"] for r in records if r["section_count"] > 1],
        "pages_with_low_text_coverage": [
            r["page"]
            for r in records
            if r["pdf_to_adt_word_coverage"] is not None and r["pdf_to_adt_word_coverage"] < 0.65
        ],
        "records": records,
    }
    output = Path(args.report)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "records"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
