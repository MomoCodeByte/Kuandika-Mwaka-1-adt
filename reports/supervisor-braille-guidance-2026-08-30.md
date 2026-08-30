# Braille guidance implementation

Status: supervisor mappings incorporated and tested on 30 August 2026. Six-key tactile input remains disabled pending review by a qualified local Braille educator.

## Corrections completed

- Added an audio and screen-reader explanation of the six-dot Braille cell on page 9.
- Clearly distinguishes reading orientation (dots 1–3 left, 4–6 right) from the mirrored slate-and-stylus writing orientation requested by the supervisor (dots 1–3 right, 4–6 left).
- Added the supplied dot patterns to every lower-case vowel and consonant lesson in the book.
- Added capital-indicator guidance (dot 6 in a preceding cell) to every uppercase letter lesson.
- Added two-cell guidance for `ch`, and capital-indicator plus two-letter guidance for uppercase `CH`.
- Added a machine-readable map at `content/accessibility/braille-letter-map.json`.

## Verification

- 48 letter entries are present in the Braille map.
- All 49 new Rehema audio files exist and are non-empty.
- Page 9 exposes both cell orientations and the dot pattern for lower-case `a`.
- Page 48 exposes the two cells for `ch`.
- Page 52 exposes the capital indicator and dot pattern for uppercase `A`.
- The reading orientation follows the Braille Authority of North America guidance; the mirrored slate-and-stylus explanation follows the American Printing House guidance.

## Reference sources

- https://www.brailleauthority.org/sites/default/files/2024-01/BANA%20Guidelines%20for%20the%20Creation%20of%20Braille%20Signage%20Approved%2010-2023.pdf
- https://www.aph.org/blog/learning-to-braille-with-a-slate-and-stylus-pop-it-braille-basics/
