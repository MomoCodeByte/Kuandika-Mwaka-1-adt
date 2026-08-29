# Batch C audit — pages 57–79

Date: 2026-08-29

## Findings and fixes

- Pages 57–79 audited for lesson text, image descriptions, dashes, songs and tables.
- Page 62 image description is now connected to its audio description ID; the page exposes the writing prompt and dashes to the reader.
- Page 70 had five picture descriptions and captions but no direct image-audio links. The shared bridge is now cache-busted and connects all five images plus the picture-grid description.
- Existing page 63 “Jieleze x6” instruction and named lines were retained for the required six repetitions and name-writing task.

## Browser proof

- Page 62: image audio ID present, writing prompt visible, controller available, overflow 0.
- Page 70: six description entries (grid + five images), all have audio IDs, controller available, overflow 0.
- No content was removed in this batch.

## Remaining checks

- Listen through Rehema audio for pages 57–79 to validate each consonant and table sentence pronunciation.
- Verify page 69 numbered words and page 79 table sentences in a full screen-reader pass.
