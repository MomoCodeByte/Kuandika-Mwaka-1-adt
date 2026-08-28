from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "pg042_im004_source_model_clean.png"
OUTPUT = ROOT / "images" / "pg042_raba_guide.png"


image = Image.open(SOURCE).convert("RGBA")
# Exact first-word region from the original PDF model.
crop = image.crop((20, 12, 108, 82))
pixels = crop.load()
width, height = crop.size

# The PDF notebook rules are the six full-width dark rows below. Remove only
# their horizontal runs; retain pixels that continue vertically through a
# letter stroke so the original glyph shape is preserved.
source_rule_rows = (20, 21, 52, 71)
rule_rows = tuple(row - 12 for row in source_rule_rows)
gray = crop.convert("L")

for y in rule_rows:
    for x in range(width):
        vertical_above = sum(gray.getpixel((x, yy)) < 180 for yy in range(max(0, y - 4), y))
        vertical_below = sum(gray.getpixel((x, yy)) < 180 for yy in range(y + 1, min(height, y + 5)))
        if vertical_above < 2 or vertical_below < 2:
            pixels[x, y] = (255, 255, 255, 0)

# Convert the white paper to transparency while retaining the source
# antialiasing and exact handwriting strokes.
for y in range(height):
    for x in range(width):
        red, green, blue, alpha = pixels[x, y]
        if alpha == 0:
            continue
        luminance = round((red + green + blue) / 3)
        pixels[x, y] = (35, 35, 35, max(0, 255 - luminance))

alpha = crop.getchannel("A")
bounds = alpha.getbbox()
if bounds:
    crop = crop.crop(bounds)

crop.save(OUTPUT)
print(f"created {OUTPUT} {crop.size}")
