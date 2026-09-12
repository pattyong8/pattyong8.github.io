# Create Travel Page — Reference

## Paths (repo root = site root)

| Item | Path / format |
|------|----------------|
| Trip subpage folder | `Travel-Pages-Sub/{section}/{year}/{Trip-Name-YYYY}/` |
| Trip subpage HTML | `{Trip-Name-YYYY}-1.html` (and `-2.html` if multi-page) |
| Year page | `Travel-Pages/{section}/{section}-{year}.html` |
| Year-page thumbnail | **Gallary only.** User drops one image in `gallary/{section}/{year}/`. Skill crops (people-focused), optimizes, saves as `{Month}-{Trip-Display-Name}-{year}.jpeg`. |
| Hero + subpage images | **Travel-Pages-Images only.** User drops hero + all photos in `Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. Skill renames to `{TripPrefix}-HP.jpeg`, `{TripPrefix}-1.jpeg`, …; optimizes; crops hero. **Hero and thumbnail are different images.** |
| Header/footer (from subpage) | `../../../../header-M.html`, `../../../../footer-M.html` (depth may vary by section) |

## Template and examples

- **Subpage template (chrome):** `Travel-Pages-Sub/20s/2024/Vincents-Wedding-2024/Vincents-Wedding-2024-1.html`
- **Photo grid / leftover-row layout (required):** `Travel-Pages-Sub/20s/2026/Mar-Chile-2026/Mar-Chile-2026-1.html` — copy `pStyle`, `photoCard`, and `buildGrid(..., sideTextHtml)` from here
- **Year page example:** `Travel-Pages/20s/20s-2026.html`
- **Image naming example:** Vincent's Wedding → `V%26E-2024-HP.jpeg`, `V%26E-2024-1.jpeg`, …

## Leftover photo rows (1–2 photos)

Photos are always **3 across**. If a section count is not a multiple of 3:

1. Prefer merging adjacent groups into multiples of 3 when the story allows.
2. Otherwise use Chile-style leftover handling:
   - Cap leftovers at ~1/3 width (never stretch to fill the row).
   - Float leftovers left; put the first narrative paragraph in `sideTextHtml`.
   - Let `buildGrid` pull following `<p>` tags into the float wrap so text fills beside tall leftovers, then continues full-width below the photo (not a flex right-column of all text).
   - Keep remaining paragraphs full-width below — never dump all section text into a permanent right column.

## Checklist (don’t skip)

- [ ] Asked: section, trip name, year, multi-page?
- [ ] Confirmed: **thumbnail** (year page only) in `gallary/{section}/{year}/`; **hero + all subpage photos** in `Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. Hero and thumbnail are **different** images.
- [ ] **Year-page thumbnail:** Cropped to match other thumbs (people-focused), optimized, saved as `{Month}-{Trip-Display-Name}-{year}.jpeg` in gallary.
- [ ] **Subpage photos:** Renamed by EXIF to `{TripPrefix}-1.jpeg`, … and `{TripPrefix}-HP.jpeg`; all optimized (use travel-page-tool). Hero cropped (prioritize people then landscape), saved as `{TripPrefix}-HP.jpeg` in Travel-Pages-Images.
- [ ] Created `Travel-Pages-Sub/{section}/{year}/{Trip-Folder}/` and HTML file(s); hero src = Travel-Pages-Images … `{TripPrefix}-HP.jpeg`; placeholders inserted; buildGrid wired to renamed images.
- [ ] **Leftover rows:** Used Chile `buildGrid` with `sideTextHtml` + float wrap of following paragraphs for any 1–2 photo leftovers; did not stretch leftovers or put all text in a permanent right column.
- [ ] Year page: new `col-md-4` entry with href to subpage and thumbnail src = gallary … `{Month}-{Trip-Display-Name}-{year}.jpeg`.
- [ ] **Preserve EXIF:** When optimizing/cropping any image, do not strip date/time metadata (use sharp `.withMetadata()` or equivalent).
- [ ] **Last step:** Ask user for placeholder replacements (date range, location, people, intro, section descriptions) and insert or tell them where to paste.

## Full plan

See `docs/PLAN-new-trip-page-skill.md` in the repo for the complete plan and rationale.
