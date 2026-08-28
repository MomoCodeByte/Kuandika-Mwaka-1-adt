import argparse
import re
from pathlib import Path

from PIL import Image


PAGE_RE = re.compile(r"^pg(\d{3})_.*_source_model\.png$")


def colored_row_count(image: Image.Image, y: int) -> int:
    pixels = image.load()
    count = 0
    for x in range(image.width):
        r, g, b = pixels[x, y][:3]
        cyan = b > 125 and g > 105 and b - r > 45 and g - r > 35
        green = g > 90 and g - r > 25 and g - b > 8
        if cyan or green:
            count += 1
    return count


def first_colored_band(image: Image.Image) -> int | None:
    minimum = max(8, image.width // 80)
    start = max(12, image.height // 8)
    consecutive = 0
    first = None
    for y in range(start, image.height):
        if colored_row_count(image, y) >= minimum:
            if first is None:
                first = y
            consecutive += 1
            if consecutive >= 2:
                return first
        else:
            consecutive = 0
            first = None
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", required=True)
    args = parser.parse_args()
    folder = Path(args.images)
    cropped = []
    copied = []

    for source in sorted(folder.glob("pg*_source_model.png")):
        match = PAGE_RE.match(source.name)
        if not match:
            continue
        page = int(match.group(1))
        if page < 41 or page > 105:
            continue
        output = source.with_name(source.stem + "_clean.png")
        image = Image.open(source).convert("RGB")
        cut = first_colored_band(image)
        if cut is not None and cut > image.height * 0.14:
            bottom = max(1, cut - max(4, image.height // 100))
            cleaned = image.crop((0, 0, image.width, bottom))
            cleaned.save(output, optimize=True)
            cropped.append({"file": source.name, "height": image.height, "clean_height": bottom})
        else:
            image.save(output, optimize=True)
            copied.append(source.name)

    print(f"clean models: {len(cropped) + len(copied)}, cropped: {len(cropped)}, copied: {len(copied)}")
    for item in cropped:
        print(f"cropped {item['file']}: {item['height']} -> {item['clean_height']}")


if __name__ == "__main__":
    main()
