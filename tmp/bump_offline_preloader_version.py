import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NEW = "./assets/offline-preloader.js?v=adt-page-accurate-pilot20-v25-handwriting-accessibility-20260830"
PATTERN = re.compile(r"\./assets/offline-preloader\.js\?v=[^\"']+")

changed = []
for path in sorted(ROOT.glob("*.html")):
    source = path.read_text(encoding="utf-8")
    updated, replacements = PATTERN.subn(NEW, source)
    if replacements == 0 or updated == source:
        continue
    path.write_text(updated, encoding="utf-8")
    changed.append(path.name)

print(f"updated {len(changed)} HTML pages")
