# Batch 1 test report — pages 3–24

Date: 2026-08-28

## Automated DOM audit

- Pages found: 22 (`pg003` through `pg024`)
- Images found: 56
- Instructional images with `data-adt-description`: 52
- Decorative chapter headers without descriptions: 4 (pages 7, 9, 14 and 23)
- Decorative headers are marked `aria-hidden="true"`, so screen readers do not announce them as missing content.
- Audio-description attributes currently present: 35
- Audio catalogue entries available in `content/i18n/sw-TZ/audios.json`: 1,730

## Items requiring the next fix pass

The audit flagged 17 instructional images whose description exists but whose HTML image tag does not yet carry a direct `data-adt-audio-description-id`. These are pages 5, 7, 9, 16, 21, 22, 23 and 24. They remain readable through the shared description layer, but they need explicit audio wiring and playback verification for the blind-learner workflow.

## Test gate for this batch

Before accepting the batch, verify each representative page at desktop and 390px mobile width:

1. No horizontal overflow (`scrollWidth` must not exceed `clientWidth`).
2. Every instructional image has non-empty accessible description text.
3. Every image-description control has an accessible name and can be activated.
4. Audio starts once per activation and does not duplicate the sentence.
5. Decorative headers remain hidden from the accessibility tree.

This report is intentionally a baseline: fixes are accepted only after the same checks are rerun and the result is appended below.

## Initial runtime check

- Local preview server response: HTTP 200 for pg009_sec001.html.
- Browser automation attachment was unavailable in this run, so viewport interaction is still an open test item; it will be rerun after fixes.
