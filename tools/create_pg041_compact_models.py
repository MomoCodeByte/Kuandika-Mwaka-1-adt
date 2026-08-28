from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"


def resize_band(source: Image.Image, top: int, bottom: int, out_top: int, out_bottom: int) -> Image.Image:
    band = source.crop((0, top, source.width, bottom + 1))
    return band.resize((source.width, out_bottom - out_top + 1), Image.Resampling.LANCZOS)


def compact_letter_model() -> None:
    source = Image.open(IMAGES / "pg041_batch_letter_model.png").convert("RGB")
    output = Image.new("RGB", source.size, "white")

    # Preserve the wide outer zones and tighten the lowercase writing zone.
    output.paste(resize_band(source, 0, 31, 0, 40), (0, 0))
    output.paste(resize_band(source, 31, 62, 40, 55), (0, 40))
    output.paste(resize_band(source, 62, 94, 55, 94), (0, 55))
    output.save(IMAGES / "pg041_batch_letter_model_compact.png", optimize=True)


def compact_syllable_model() -> None:
    source = Image.open(IMAGES / "pg041_batch_syllables_model.png").convert("RGB")
    output = Image.new("RGB", source.size, "white")

    # Add the outer top rule and place the two light guides close together.
    output.paste(resize_band(source, 0, 21, 0, 40), (0, 0))
    output.paste(resize_band(source, 21, 40, 40, 55), (0, 40))
    output.paste(resize_band(source, 40, 70, 55, 94), (0, 55))
    ImageDraw.Draw(output).line((0, 0, source.width - 1, 0), fill=(25, 25, 25), width=2)
    output.save(IMAGES / "pg041_batch_syllables_model_compact.png", optimize=True)


if __name__ == "__main__":
    compact_letter_model()
    compact_syllable_model()
