# Create Travel Page — Reference

Full system doc: [docs/travel-page-system.md](../../../docs/travel-page-system.md)

## Paths

| Item | Path |
|------|------|
| Photos | `assets/images/Travel-Pages-Images/{section}/{year}/{TripFolder}/` |
| Incoming originals | `.../_incoming/` |
| Cover source | `COVER.*` / `Cover.*` in folder or `_incoming` |
| Gallary thumb | `assets/images/gallary/{section}/{year}/{Mon}-{Name}-{year}.jpeg` |
| HTML + yaml | `Travel-Pages-Sub/{section}/{year}/{TripFolder}/` |
| Year page | `Travel-Pages/{section}/{section}-{year}.html` |

## Checklist

- [ ] Intake complete; `Cover` renamed
- [ ] `process-photos` → yaml
- [ ] Gate 1 order confirmed; numbers refreshed
- [ ] `crop-cover` + `crop-hero`; previews shown
- [ ] Gate 2 outline + prose in yaml; multipage decided
- [ ] `render-trip` + year card (render aborts if leftover blank-column bug)
- [ ] `validate-trip` clean enough; must not report leftover blank-column error; local preview
- [ ] User commits/pushes (not agent); avoid committing huge `_incoming`

## Leftover rows (permanent — do not regress)

Generator emits float leftover wrap (Chile reading flow): **all** section paragraphs go inside `.travel-leftover-wrap` before `clear:both`. Prefer multiples of 3 when grouping. Never dump all section text into a permanent narrow column, and never clear after only the first paragraph.

Guards (all required on new trips):
1. `renderSectionHtml` puts every paragraph inside the wrap before clear
2. `assertNoLeftoverBlankColumn` runs before writing HTML
3. `validate-trip` fails on the blank-column pattern
4. `npm test` in `travel-page-tool/` has a regression test for this
