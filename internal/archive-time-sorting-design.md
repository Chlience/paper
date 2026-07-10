# Archive Time Sorting Design

## Goal

Display the archive's `当前收录` table in reverse chronological order by each material's first public month. The Markdown source remains the display source, so source order and rendered order stay aligned.

## Ordering Contract

- Parse the existing `时间` value in the strict `YYYY年M月` format.
- Sort rows by year and month from newest to oldest.
- Treat rows from the same month as equal and preserve their current relative order.
- Keep the table header and every row's title, time, and core signal unchanged.

## Implementation

1. Reorder the existing rows in `content/utility/papers-index.md` with a stable descending month sort.
2. Extend `validateArchiveIndex` in `scripts/content/paper-workflow.mjs` to report `index-time-order` when a valid row has a newer month than the previous valid row.
3. Keep the existing `index-time-format` error for malformed months. Ordering validation compares valid month values and does not replace format validation.
4. Update `content/utility/paper-analysis-workflow.md` so future archive additions follow the same ordering contract.

The archive page continues to render the generated Markdown HTML directly. No browser-side sorting or custom table renderer is added.

## Tests

- An index ordered from newest to oldest passes.
- An older row followed by a newer row reports `index-time-order`.
- Multiple rows in the same month pass and retain source order.
- The real archive passes the workflow CLI after its rows are reordered.
- The full site build and existing content checks remain green.

## Non-Goals

- Adding day-level precision to the index.
- Sorting rows alphabetically within the same month.
- Changing `First-Archived-At`, `Updated-At`, short titles, or core signals.
- Adding interactive sorting controls to the archive page.
