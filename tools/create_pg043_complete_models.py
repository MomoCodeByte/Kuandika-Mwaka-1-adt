from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"


def save_crop(source_name: str, box: tuple[int, int, int, int], output_stem: str) -> None:
    source = Image.open(IMAGES / source_name).convert("RGB")
    crop = source.crop(box)
    crop.save(IMAGES / f"{output_stem}_source_model.png", optimize=True)
    crop.save(IMAGES / f"{output_stem}_source_model_clean.png", optimize=True)


def make_clean_notebook(source_name: str, output_stem: str, first_sample_right: int) -> None:
    source = Image.open(IMAGES / source_name).convert("RGB")
    model = source.crop((0, 10, source.width, 93))
    draw = ImageDraw.Draw(model)
    draw.line((0, 0, model.width - 1, 0), fill=(39, 36, 37), width=2)
    draw.line((0, model.height - 2, model.width - 1, model.height - 2), fill=(39, 36, 37), width=2)
    model.save(IMAGES / f"{output_stem}_source_model.png", optimize=True)
    model.save(IMAGES / f"{output_stem}_source_model_clean.png", optimize=True)

    guide = Image.new("RGBA", model.size, (255, 255, 255, 0))
    src = model.convert("L")
    pixels = guide.load()
    outer_rule_rows = {0, 1, 81, 82}
    inner_rule_bands = {31: 32, 32: 32, 33: 32, 50: 51, 51: 51, 52: 51}
    for y in range(model.height):
        for x in range(15, min(first_sample_right, model.width)):
            darkness = 255 - src.getpixel((x, y))
            if darkness < 70:
                continue
            if y in outer_rule_rows:
                continue
            if y in inner_rule_bands:
                center = inner_rule_bands[y]
                above = 255 - src.getpixel((x, center - 3))
                below = 255 - src.getpixel((x, center + 3))
                if min(above, below) < 70:
                    continue
            pixels[x, y] = (35, 35, 35, min(255, darkness))
    guide.save(IMAGES / f"{output_stem}_guide.png", optimize=True)


if __name__ == "__main__":
    # Page 43's original extraction combined the syllable and word exercises.
    # Split them into faithful independent models so each can have its own
    # handwriting area without repeating content.
    save_crop(
        "pg043_im002_source_model_clean.png",
        (0, 0, 640, 104),
        "pg043_im002_syllables",
    )
    save_crop(
        "pg043_im002_source_model_clean.png",
        (0, 163, 640, 267),
        "pg043_im003_words",
    )
    make_clean_notebook(
        "pg043_im002_syllables_source_model_clean.png",
        "pg043_syllables_notebook",
        155,
    )
    make_clean_notebook(
        "pg043_im003_words_source_model_clean.png",
        "pg043_words_notebook",
        175,
    )
