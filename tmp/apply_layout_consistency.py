from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LINK = '<link rel="stylesheet" href="./assets/layout-consistency.css?v=book-layout-v1-20260830">'

updated = []
for page in sorted(ROOT.glob("*.html")):
    source = page.read_text(encoding="utf-8")
    if "./assets/layout-consistency.css" in source:
        continue
    if "</head>" not in source:
        raise RuntimeError(f"Closing head tag not found in {page.name}")
    source = source.replace("</head>", f"{LINK}\n</head>", 1)
    page.write_text(source, encoding="utf-8")
    updated.append(page.name)

print(f"layout stylesheet added to {len(updated)} HTML pages")
