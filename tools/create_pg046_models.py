from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
PDF_PAGE = ROOT / "tmp" / "pdfs" / "page46" / "source-046.png"


def trim_existing(source: str, target: str, box: tuple[int, int, int, int]) -> None:
    image = Image.open(OUT / source).convert("RGB")
    image.crop(box).save(OUT / target, optimize=True)


# Existing extractor assets are already exact PDF crops; remove only surplus
# whitespace so every model has the same clean four-rule footprint.
trim_existing("pg046_im001_source_model_clean.png", "pg046_pattern_model.png", (22, 0, 636, 96))
trim_existing("pg046_im002_source_model_clean.png", "pg046_trace_v_model.png", (18, 0, 636, 98))
trim_existing("pg046_im003_source_model_clean.png", "pg046_syllables_v_model.png", (22, 0, 636, 88))
trim_existing("pg046_im004_source_model_clean.png", "pg046_words_v_model.png", (22, 0, 636, 88))

# The individual-letter row was represented as OCR text in the conversion.
# Keep the authentic handwriting by cropping that exact row from PDF page 46.
page = Image.open(PDF_PAGE).convert("RGB")
page.crop((118, 708, 914, 808)).save(OUT / "pg046_letter_v_model.png", optimize=True)
