# Travel page system

How to add travel-memory trips to this site with minimal manual work.

## Quick start (you)

1. Export photos into  
   `assets/images/Travel-Pages-Images/{section}/{year}/{TripFolder}/`
2. Rename the cover/hero source to **`Cover.jpeg`** (or `COVER.heic`, etc.).
3. In Cursor say: **Create travel page** (or “Add a new trip”).
4. Answer the prompts (section, name, year, metadata, dictation).
5. Review three gates: photo order → story + crops → finished page.
6. **You** commit and push when happy.

You do not need to run Terminal commands yourself; the agent runs the tool.

## Architecture

| Piece | Role |
|-------|------|
| `trip.yaml` next to trip HTML | Source of truth (metadata, photo order, sections, prose) |
| `travel-page-tool` CLI (`npm run travel`) | Deterministic photo/crop/render/validate |
| Cursor skill `create-travel-page` | Orchestrator: intake, narrative, gates |
| Static HTML + `assets/css/travel-trip.css` | Published page (Chile look, badges on) |

```text
Photos in Assets → process-photos → trip.yaml
                 → Gate 1 (order)
                 → crop-cover + crop-hero (from COVER)
                 → Gate 2 (outline, crop previews, multipage?)
                 → prose into yaml → render-trip → year card
                 → Gate 3 (validate + preview)
                 → you commit/push
```

## Paths

| Asset | Path |
|-------|------|
| Staging originals | `.../{TripFolder}/_incoming/` (do not commit if huge) |
| Web body photos | `assets/images/Travel-Pages-Images/{section}/{year}/{TripFolder}/{Prefix}-N.jpeg` |
| Hero | `{Prefix}-HP.jpeg` in same folder |
| Year thumb | `assets/images/gallary/{section}/{year}/{Mon}-{Name}-{year}.jpeg` (1084×930) |
| Trip page | `Travel-Pages-Sub/{section}/{year}/{TripFolder}/{TripFolder}-1.html` |
| Manifest | `Travel-Pages-Sub/.../{TripFolder}/trip.yaml` |

Image defaults: max width 1500, JPEG quality 85, EXIF preserved. Flag files still over ~1.5 MB.

## CLI reference

From `travel-page-tool/` (after `npm run build`):

```bash
npm run travel -- process-photos --photos <dir> --slug <slug> --title "<title>" --section 20s --year 2026
npm run travel -- crop-cover --manifest <trip.yaml> --month Jun --display-name Italy-and-Malta
npm run travel -- crop-hero --manifest <trip.yaml>
npm run travel -- render-trip --manifest <trip.yaml>
npm run travel -- validate-trip --manifest <trip.yaml>
```

Re-render after prose-only yaml edits without re-processing photos.

## Writing voice

Personal archive, not a travel magazine. Preserve specific memories from dictation. Avoid generic / AI-sounding prose. Full section paragraphs, not captions.

## Gates

1. **Order** — chronology, needs-placement, possible duplicates (flag only). Show updated Picture # list after changes.
2. **Story + crops** — section outline + ranges; always show thumb + hero crops; ask one page vs split; then full prose.
3. **Page** — local preview + validate-trip; you publish.

## Guardrails

- Yaml is master; HTML is generated.
- Leftover layout must match Chile reading flow: float leftovers, put **all** section paragraphs inside `.travel-leftover-wrap` **before** `clear:both` (never clear after only the first paragraph — that leaves a blank column beside tall photos). Enforced by `layout-guards.ts` on every `render-trip`, by `validate-trip`, and by `npm test` in `travel-page-tool/`.
- Picture # badges always on.
- Don’t commit multi-hundred-MB `_incoming` folders.
- Agent never auto git push.
- First trips may take longer than the 15–30 minute steady-state goal.

## Folder naming tip

Avoid `&` and typos in folder slugs when possible (URL encoding gets messy). Prefer `Italy-Malta-2026` over `Italty-&-Malta-2026`.
