from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "semantic" / "original-unit-pg052.png"
OUTPUT = ROOT / "images" / "semantic" / "original-unit-pg052-clean.png"
CHAPTER_OUTPUT = ROOT / "images" / "semantic" / "pg052-chapter-header.png"
PDF = ROOT.parent / "KUANDIKA MWAKA 1.pdf"


with Image.open(SOURCE) as image:
    image.crop((0, 0, image.width, 220)).save(OUTPUT)

document = pdfium.PdfDocument(str(PDF))
rendered = document[51].render(scale=2).to_pil()
rendered.crop((110, 70, 915, 380)).save(CHAPTER_OUTPUT)
