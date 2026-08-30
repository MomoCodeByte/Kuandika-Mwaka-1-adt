import json
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEXTS = json.loads((ROOT / "content/i18n/sw-TZ/texts.json").read_text(encoding="utf-8"))
AUDIOS = json.loads((ROOT / "content/i18n/sw-TZ/audios.json").read_text(encoding="utf-8"))
AUDIO_DIR = ROOT / "content/i18n/sw-TZ/audio"
REPORT = ROOT / "reports/final-whole-book-audit-2026-08-30.md"


class PageAudit(HTMLParser):
    def __init__(self, page: Path):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.stack: list[dict[str, str | None]] = []
        self.images = 0
        self.canvases = 0
        self.native_audio_controls = 0
        self.missing_assets: list[str] = []
        self.image_alt_issues: list[str] = []
        self.canvas_label_issues: list[str] = []

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = dict(attrs_list)
        self.stack.append(attrs)
        if tag == "img":
            self.images += 1
            if "alt" not in attrs:
                self.image_alt_issues.append(attrs.get("src") or "image without src")
            src = (attrs.get("src") or "").split("?", 1)[0]
            if src and not re.match(r"^(?:https?:|data:|#)", src):
                target = (self.page.parent / src).resolve()
                if not target.exists():
                    self.missing_assets.append(src)
        elif tag == "canvas":
            self.canvases += 1
            if not (attrs.get("aria-label") or attrs.get("aria-labelledby") or attrs.get("title")):
                self.canvas_label_issues.append(attrs.get("data-practice-storage") or "unlabelled canvas")
        elif tag == "audio" and "controls" in attrs:
            self.native_audio_controls += 1
        elif tag in {"script", "link"}:
            src = attrs.get("src") if tag == "script" else attrs.get("href")
            src = (src or "").split("?", 1)[0]
            if src and not re.match(r"^(?:https?:|data:|#)", src):
                target = (self.page.parent / src).resolve()
                if not target.exists():
                    self.missing_assets.append(src)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if self.stack:
            self.stack.pop()


def main() -> None:
    html_pages = sorted(ROOT.glob("pg*_sec*.html"))
    missing_audio = []
    for item_id, value in AUDIOS.items():
        filename = str(value).split("?", 1)[0]
        target = AUDIO_DIR / filename
        if not target.exists() or target.stat().st_size < 1024:
            missing_audio.append(f"{item_id} -> {value}")

    description_without_audio = [
        item_id for item_id, text in TEXTS.items()
        if item_id.endswith("_audio_description") and str(text).strip() and item_id not in AUDIOS
    ]

    audits = []
    for page in html_pages:
        parser = PageAudit(page)
        parser.feed(page.read_text(encoding="utf-8"))
        audits.append(parser)

    missing_assets = [(a.page.name, x) for a in audits for x in a.missing_assets]
    image_alt_issues = [(a.page.name, x) for a in audits for x in a.image_alt_issues]
    canvas_label_issues = [(a.page.name, x) for a in audits for x in a.canvas_label_issues]
    native_controls = sum(a.native_audio_controls for a in audits)
    image_count = sum(a.images for a in audits)
    canvas_count = sum(a.canvases for a in audits)

    offline = (ROOT / "assets/offline-preloader.js").read_text(encoding="utf-8")
    cached_pages = sorted(set(re.findall(r"pg\d{3}_sec\d{3}\.html", offline)))
    bundle = json.loads((ROOT / "assets/config.json").read_text(encoding="utf-8"))["bundleVersion"]

    failures = {
        "missing_or_small_audio": missing_audio,
        "nonempty_descriptions_without_audio": description_without_audio,
        "missing_local_assets": missing_assets,
        "images_without_alt_attribute": image_alt_issues,
        "canvases_without_accessible_label": canvas_label_issues,
    }
    failure_count = sum(len(x) for x in failures.values())

    details = []
    for name, items in failures.items():
        if items:
            details.append(f"### {name}\n\n" + "\n".join(f"- `{item}`" for item in items[:100]))

    report = f"""# Final whole-book audit — Kuandika Mwaka wa Kwanza

Date: 30 August 2026

Status: **{'PASS' if failure_count == 0 else 'FAIL'}**

## Automated checks

- HTML files parsed: **{len(html_pages)}**
- Images inspected: **{image_count}**
- Handwriting canvases inspected: **{canvas_count}**
- Audio mappings inspected: **{len(AUDIOS)}**
- Missing or undersized audio files: **{len(missing_audio)}**
- Non-empty image descriptions without audio: **{len(description_without_audio)}**
- Missing local image, script or stylesheet assets: **{len(missing_assets)}**
- Images without an `alt` attribute: **{len(image_alt_issues)}**
- Canvases without an accessible label: **{len(canvas_label_issues)}**
- Native page-level audio controls in static HTML: **{native_controls}**
- Cached content pages: **{len(cached_pages)}** plus the book index
- Bundle version: `{bundle}`

## Browser checks already completed

- Default ADT controller plays on pages 92, 96 and 102.
- Page 102 plays the full dialogue through the default controller and exposes the description exactly once.
- Page 96 exposes the complete “Shangazi Maria” passage.
- Exact names and sentences were verified on pages 69, 72 and 79.
- Picture activities and dash prompts were verified on pages 70, 92, 93, 94 and 103.
- Braille guidance was verified on pages 9, 48 and 52.

{chr(10).join(details) if details else 'No automated audit failures were found.'}
"""
    REPORT.write_text(report, encoding="utf-8")
    print(json.dumps({
        "status": "PASS" if failure_count == 0 else "FAIL",
        "html": len(html_pages), "images": image_count, "canvases": canvas_count,
        "audios": len(AUDIOS), "cached_pages": len(cached_pages), "failures": failure_count,
    }))
    if failure_count:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
