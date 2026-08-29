# Batch B audit — pages 26–51

Date: 2026-08-29

## Baseline findings

- Pages audited: 26–51 (26 pages).
- All instructional images in this range already have non-empty descriptions.
- The review item for page 26 is confirmed in the source text/audio pair: the current phrase is “Bata bukini mwenye manyoya meupe na meusi”; the requested spoken answer is “Bata”.
- Page 50 prompt was missing the word “chunguza”.
- Page 35/41 contain response dashes that require a later audio/order test.

## Completed in this pass

- Page 50 now reads: “Tazama na chunguza picha hizi kisha jibu maswali yanayofuata kwa kila picha.”

## Pending before Batch B acceptance

- Regenerate the page-26 Rehema audio asset with the approved short wording “Bata.” The local environment does not currently provide the TTS package required to regenerate that MP3, so the source text was intentionally left unchanged to avoid a text/audio mismatch.
- Verify page 35/41 dashes and page 44/45–46 prompts with the browser audio controller.
- Run the full no-duplicate and mobile overflow test gate, then produce the Batch B preview and commit proof.
