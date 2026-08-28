from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"


def clean(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGB")
    width, height = image.size
    pixels = image.load()

    # The three source crops overlap their neighbours by only a few pixels.
    # Clear those overlap strips before removing tiny isolated OCR specks.
    for y in range(height):
        for x in list(range(0, 3)) + list(range(width - 6, width)):
            pixels[x, y] = (255, 255, 255)
    for y in range(0, 3):
        for x in range(width):
            pixels[x, y] = (255, 255, 255)

    ink = [[min(pixels[x, y]) < 245 for x in range(width)] for y in range(height)]
    seen = [[False] * width for _ in range(height)]

    for start_y in range(height):
        for start_x in range(width):
            if not ink[start_y][start_x] or seen[start_y][start_x]:
                continue
            queue = deque([(start_x, start_y)])
            seen[start_y][start_x] = True
            component: list[tuple[int, int]] = []
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for ny in range(max(0, y - 1), min(height, y + 2)):
                    for nx in range(max(0, x - 1), min(width, x + 2)):
                        if ink[ny][nx] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            queue.append((nx, ny))

            # OCR extraction left narrow fragments on the image edges plus a
            # few isolated specks. The chair itself is the large inner object.
            if len(component) < 18:
                for x, y in component:
                    pixels[x, y] = (255, 255, 255)

    image.save(target, optimize=True)


for number in range(1, 4):
    clean(
        IMAGES / f"pg047_im{number:03d}.png",
        IMAGES / f"pg047_im{number:03d}_clean.png",
    )

# The PDF itself provides the cleanest single composition of all three chairs.
# Use it as one grouped illustration so no overlap seams can appear between
# separately extracted crops.
pdf_page = Image.open(ROOT / "tmp" / "pdfs" / "page47" / "source-047.png").convert("RGB")
raw_group = IMAGES / "pg047_chairs_group_raw.png"
pdf_page.crop((130, 285, 625, 555)).save(raw_group, optimize=True)
clean(raw_group, IMAGES / "pg047_chairs_group_clean.png")
