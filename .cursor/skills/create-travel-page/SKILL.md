---
name: create-travel-page
description: >-
  Orchestrates new travel-memory pages: intake, process-photos, COVER crops,
  trip.yaml narrative, Chile-style render, year card, three approval gates.
  Use when the user says "Create travel page", "Add a new trip", or similar.
---

# Create Travel Page

Follow [docs/travel-page-system.md](../../../docs/travel-page-system.md). Chile look + always-on Picture # badges. **`trip.yaml` is source of truth.** Agent runs CLI; user never needs Terminal. **Never auto-commit/push.**

## Trigger phrases

- “Create travel page”
- “Add a new trip”
- “Start a travel page for …”

## Intake (ask only what’s missing, in order)

1. Section (e.g. `20s`)
2. Trip name / title
3. Year
4. Confirm photo folder under `assets/images/Travel-Pages-Images/{section}/{year}/{TripFolder}/`
5. Confirm cover/hero file renamed to **`Cover` / `COVER`** (any image extension)
6. Date range, location, people (and `startDate` YYYY-MM-DD for year-card sort)
7. Messy narrative/dictation (may wait until after Gate 1)

Do **not** ask multipage at intake — ask at Gate 2.

Prefer folder slugs without `&` or typos when creating new folders.

## Tooling (from `travel-page-tool/`)

```bash
npm run build   # if src changed
npm run travel -- process-photos --photos <dir> --slug <slug> --title "<title>" --section 20s --year YYYY
npm run travel -- crop-cover --manifest <trip.yaml> --month Mon --display-name Name
npm run travel -- crop-hero --manifest <trip.yaml>
npm run travel -- render-trip --manifest <trip.yaml>
npm run travel -- validate-trip --manifest <trip.yaml>
```

`process-photos` stages loose files into `_incoming/`, EXIF-sorts, writes `{prefix}-N.jpeg`, writes `Travel-Pages-Sub/.../trip.yaml`. Does **not** auto-remove duplicates (flags only).

## Gates

### Gate 1 — Order
Show chronology summary, `needs_placement`, capped `possible_duplicate`. Apply overrides into yaml `photos[]` order/`seq`. **Re-show numbered list** after changes.

### Gate 2 — Story + crops
- Outline sections + photo id/seq ranges
- **Always** show cover thumb + hero crop previews
- Ask: one page or split after which section?
- Write full-section prose into yaml (user voice; preserve specific memories; tweak loops OK)
- Prefer section photo counts multiple of 3 when story allows; leftovers use Chile reading flow via generator (**all** paragraphs inside `.travel-leftover-wrap` before `clear:both` — never clear after only the first paragraph)

### Gate 3 — Page
`render-trip` + `validate-trip` + local preview. **`validate-trip` must not report the leftover blank-column error.** Fix issues. Remind user to commit **optimized** assets (warn if `_incoming` is huge). User publishes.

## Layout / content rules

- Shared CSS: `assets/css/travel-trip.css`
- Badges always on
- Leftover blank column is a hard fail: enforced by `render-trip` (`assertNoLeftoverBlankColumn`), `validate-trip`, and `npm test` in `travel-page-tool/`
- Comments/chrome come from generator (include `</article>` after comments)
- Year card newest-first by `startDate`
- Cover and hero from same `COVER` file unless user overrides
- **Year memory-bar nav is sacred:** never change year-dropdown links (`Travel-Pages/{section}/{section}-YYYY.html`) unless the user explicitly asks. Only insert/update trip cards **inside** `.filtr-container`. Never use a loose regex from `<a href>` across to a gallery `<img>` — that previously rewrote the 2025 nav link to a trip page.

## Partial updates

Prose/order fixes → edit `trip.yaml` → `render-trip` only (no full re-process).

## Reference

See [reference.md](reference.md).
