from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"


def remap(source: Image.Image, anchors: list[int], targets: list[int]) -> Image.Image:
    output = Image.new(source.mode, (source.width, targets[-1] + 1), (255, 255, 255, 0) if source.mode == "RGBA" else "white")
    for start, end, out_start, out_end in zip(anchors, anchors[1:], targets, targets[1:]):
        band = source.crop((0, start, source.width, end + 1))
        band = band.resize((source.width, out_end - out_start + 1), Image.Resampling.LANCZOS)
        output.paste(band, (0, out_start), band if band.mode == "RGBA" else None)
    return output


def finish_model(image: Image.Image, upper: int, lower: int) -> Image.Image:
    image = image.convert("RGB")
    draw = ImageDraw.Draw(image)
    width = image.width - 1
    bottom = image.height - 1
    draw.line((0, 0, width, 0), fill=(39, 36, 37), width=2)
    draw.line((0, upper, width, upper), fill=(92, 92, 92), width=1)
    draw.line((0, lower, width, lower), fill=(92, 92, 92), width=1)
    draw.line((0, bottom - 1, width, bottom - 1), fill=(39, 36, 37), width=2)
    return image


def save_pair(
    model_name: str,
    guide_name: str,
    crop: tuple[int, int] | None,
    anchors: list[int],
    targets: list[int],
    output_stem: str,
) -> None:
    model = Image.open(IMAGES / model_name).convert("RGB")
    guide = Image.open(IMAGES / guide_name).convert("RGBA")
    if crop:
        top, bottom = crop
        model = model.crop((0, top, model.width, bottom))
        guide = guide.crop((0, top, guide.width, bottom))
    model = finish_model(remap(model, anchors, targets), targets[1], targets[2])
    guide = remap(guide, anchors, targets)
    model.save(IMAGES / f"{output_stem}_model.png", optimize=True)
    guide.save(IMAGES / f"{output_stem}_guide.png", optimize=True)


if __name__ == "__main__":
    # Every page-39 model and pupil field now shares the exact 42% / 58%
    # inner-guide positions, with heavy outer rules.
    save_pair(
        "pg039_batch_letter_model.png",
        "pg039_batch_letter_guide.png",
        None,
        [0, 37, 59, 92],
        [0, 39, 53, 92],
        "pg039_consistent_letter",
    )
    save_pair(
        "pg039_im002_source_model.png",
        "pg039_im002_guide.png",
        (7, 92),
        [0, 33, 52, 84],
        [0, 35, 49, 84],
        "pg039_consistent_syllables",
    )
    save_pair(
        "pg039_batch_words_model.png",
        "pg039_batch_words_guide.png",
        None,
        [0, 33, 53, 91],
        [0, 38, 53, 91],
        "pg039_consistent_words",
    )
