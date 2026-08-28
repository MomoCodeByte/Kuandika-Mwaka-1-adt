from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "pg045_im001_source_model_clean.png"
OUT = ROOT / "images"


def crop(name: str, box: tuple[int, int, int, int]) -> None:
    image = Image.open(SOURCE).convert("RGB")
    image.crop(box).save(OUT / name, optimize=True)


# Exact notebook samples from PDF page 45. Prompts are kept as live HTML,
# so every crop contains only the matching four-rule handwriting model.
crop("pg045_pattern_model.png", (22, 0, 636, 82))
crop("pg045_trace_w_model.png", (18, 132, 636, 250))
crop("pg045_letter_w_model.png", (22, 301, 636, 390))
crop("pg045_syllables_w_model.png", (22, 445, 636, 532))
crop("pg045_words_w_model.png", (22, 596, 636, 684))
