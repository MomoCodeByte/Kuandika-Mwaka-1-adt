from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "pg053_im003_source_model_clean.png"
OUTPUT = ROOT / "images" / "pg053_im003_source_model_compact.png"


with Image.open(SOURCE) as image:
    image.crop((0, 0, image.width, 180)).save(OUTPUT)
