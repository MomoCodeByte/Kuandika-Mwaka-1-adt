from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
PAGE = Image.open(ROOT / "tmp" / "pdfs" / "page48" / "source-048.png").convert("RGB")


def crop_page(name: str, box: tuple[int, int, int, int]) -> None:
    PAGE.crop(box).save(OUT / name, optimize=True)


def crop_asset(source: str, name: str, box: tuple[int, int, int, int]) -> None:
    Image.open(OUT / source).convert("RGB").crop(box).save(OUT / name, optimize=True)


crop_asset("pg048_im001_source_model_clean.png", "pg048_trace_ch_model.png", (18, 0, 636, 118))
crop_page("pg048_letter_ch_model.png", (112, 632, 914, 748))
crop_page("pg048_syllables_ch_model.png", (112, 833, 914, 950))
crop_asset("pg048_im002_source_model_clean.png", "pg048_words_ch_model.png", (22, 0, 636, 98))
