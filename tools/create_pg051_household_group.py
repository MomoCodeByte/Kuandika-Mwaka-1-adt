from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
page = Image.open(ROOT / "tmp" / "pdfs" / "page51" / "source-051.png").convert("RGB")
page.crop((150, 370, 865, 690)).save(
    ROOT / "images" / "pg051_household_group.png",
    optimize=True,
)
