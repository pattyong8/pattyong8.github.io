# Plan: Skill for Creating New Trip Pages

**Goal:** A Cursor skill you can trigger whenever you want to create a new trip page. The skill automates structure, assets, and placeholders; you supply photos, basic info, and final wording.

---

## 1. What You Trigger

- **Trigger phrase:** e.g. "Create a new trip page" or "I want to create a new trip page" (we can tune the exact phrase in the skill description).
- **Scope:** The skill asks **which section** you're working in. Sections are age-based: **20s**, then **30s**, **40s**, etc. (increments of 10 as you age). Same pattern applies to each section (College, High School, Middle School remain as existing categories in the tool).

---

## 2. What the Skill Will Ask You (in order)

| Step | Question / input | Notes |
|------|-------------------|------|
| 1 | **Which section?** | 20s, 30s, 40s, … (age-based). Maps to `Travel-Pages-Sub/{section}/`, `Travel-Pages/{section}/`, `assets/images/gallary/{section}/`, `assets/images/Travel-Pages-Images/{section}/`. |
| 2 | **Trip name** | e.g. "Whistler 2026", "Vincent's Wedding 2024". Used for folder names, titles, and image prefixes. |
| 3 | **Year** | e.g. 2026. Determines `{section}/{year}/` and which year page to update. |
| 4 | **Is this a multi-page trip?** | Yes/No. If yes, the skill will create `-1.html`, `-2.html`, … and add Next/Previous links as needed. |
| 5 | **Thumbnail photo (for year page only)** | One image. You place it in `assets/images/gallary` (skill will tell you exact path: `gallary/{section}/{year}/`). Skill will size/optimize and use it for the **year page entry only**. |
| 6 | **Hero image (for subpage)** | The photo at the top of the trip subpage. You place it in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. Skill will **crop** it so it doesn't take up the entire webpage—prioritizing **subjects** (people first, then landscape), using other subpage hero images as reference—then optimize for web. This can be the same image as the thumbnail or a different one. |
| 7 | **Subpage photos** | Already in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. No copy/move. Skill will **rename** by date/time metadata (same pattern as other travel pages, e.g. `{TripPrefix}-1.jpeg`, `{TripPrefix}-2.jpeg`), **optimize for web**, and wire them into the subpage. |
| 8 | **Standard metadata** (skill can suggest from photo dates) | Trip date range, **location**, **people**, **exact location**. Skill pre-fills placeholders; you can edit in Cursor. |
| 9 | **Intro paragraph** | Short blurb for the top of the trip subpage. You provide the final text, or the skill leaves a clear placeholder (e.g. `[INTRO_PARAGRAPH]`) for you to replace in Cursor. |

---

## 3. What the Skill Will Do (step-by-step)

### A. Travel subpage (Travel-Pages-Sub)

1. **Paths**
   - Base: `Travel-Pages-Sub/{section}/{year}/` (e.g. `20s`, `30s`).
   - If `{year}` doesn't exist, create it.
   - Create trip folder: `{Trip-Name-YYYY}/` (e.g. `Whistler-2026/`), and place the HTML file(s) inside as `{Trip-Name-YYYY}-1.html` (and `-2.html`, … if multi-page).

2. **Hero image (subpage top)**
   - **Crop** the hero image so it does **not** take up the entire webpage. Use existing hero images in other trip folders as reference for aspect ratio and framing.
   - **Prioritize subjects:** people first, then landscape. Crop to keep the main subject(s) in frame and avoid excessive empty space.
   - Save as `{TripPrefix}-HP.jpeg` in the trip's image folder. Optimize for web (resize/compress). This is the **intro photo** at the top of the travel subpage.

3. **HTML file**
   - Copy from an existing subpage template (e.g. `Travel-Pages-Sub/20s/2024/Vincents-Wedding-2024/Vincents-Wedding-2024-1.html`).
   - Adjust all paths for the new depth (e.g. `../../../../` to repo root for assets, header-M.html, footer-M.html) and for **section** (path uses `{section}` not hardcoded `20s`).
   - Set:
     - Page title and `<title>` to the trip name.
     - Hero image `src` to the cropped hero: `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/{TripPrefix}-HP.jpeg`.
   - Insert **placeholder content**:
     - Intro: e.g. `[INTRO_PARAGRAPH]` (you replace with your intro).
     - Meta block: date range, location, people, exact location as placeholders, pre-filled with your answers or guesses from photo metadata.
   - Use the same **image grid pattern** as the template (e.g. `buildGrid` with a prefix and number range). Images in the trip folder are named `{TripPrefix}-1.jpeg`, `{TripPrefix}-2.jpeg`, … in **chronological order by photo date/time metadata**. Same naming as other travel pages (see existing folders under `Travel-Pages-Images`). Skill generates the correct number of sections and ranges. If multi-page, split content across `-1.html`, `-2.html` with Next/Previous links.

### B. Year page (Travel-Pages)

1. **Year page file**
   - Path: `Travel-Pages/{section}/{section}-{year}.html` (e.g. `Travel-Pages/20s/20s-2026.html`, or `Travel-Pages/30s/30s-2031.html` when that section exists).
   - If it doesn't exist, create it by copying the structure from an existing year page and updating section/year-specific text and dropdown links.

2. **Thumbnail photo (year page only)**
   - **You** place the thumbnail image in `assets/images/gallary/{section}/{year}/` (e.g. `assets/images/gallary/20s/2026/`). No other photos go in `gallary` for this flow—only this one thumbnail for the travel **year** page.
   - Skill will **resize** it to match existing year-page thumbnails (reference other thumbs in that year).
   - **Optimize for web** (compress). Save with naming like `{Month}-{Trip-Display-Name}-{year}.jpeg` (e.g. `Jan-Whistler-2026.jpeg`).

3. **New entry on the year page**
   - Insert a new `col-md-4` block (same structure as existing entries):
     - `href`: `../../Travel-Pages-Sub/{section}/{year}/{Trip-Folder}/{Trip-Folder}-1.html`.
     - Thumbnail `src`: `../../assets/images/gallary/{section}/{year}/{Month}-{Trip-Display-Name}-{year}.jpeg`.
     - Title and date in `item-title` from your metadata.

### C. Photos for the trip subpage

1. **Source (no copy/move)**
   - **Subpage photos** live only in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. You drop them there yourself. The skill does **not** copy or move files from `gallary` to `Travel-Pages-Images`.

2. **Processing (in place)**
   - **Rename** files in that folder by date/time from metadata, in **chronological order**, using the same convention as other travel pages: `{TripPrefix}-1.jpeg`, `{TripPrefix}-2.jpeg`, … (and `{TripPrefix}-HP.jpeg` for the hero). Reference existing trips (e.g. `Vincents-Wedding-2024` → `V%26E-2024-1.jpeg`, `V%26E-2024-HP.jpeg`) for format.
   - **Optimize for web** (resize/compress). Use the existing **travel-page-tool** (see § Existing image tool below) so we don't duplicate logic.

3. **Subpage content**
   - Hero image: the **cropped** hero (A2) at `{TripPrefix}-HP.jpeg`.
   - Body: `buildGrid` (or equivalent) so all numbered images appear in order. Multi-page: split across `-1.html`, `-2.html` with Next/Previous as needed.

---

## 4. What You Provide (no automation)

- **Thumbnail:** One image for the year page; you place it in `assets/images/gallary/{section}/{year}/`.
- **Subpage photos (including hero):** You place them in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. No copy/move by the skill.
- **General info:** Section, trip name, year, multi-page or not, date range, location, people, exact location (skill can suggest from metadata).
- **Verbiage:** Intro paragraph and any section paragraphs; you type or paste these into the placeholders in Cursor after the skill runs.

---

## 5. Paths and naming (reference)

| Item | Path / format |
|------|----------------|
| Trip subpage folder | `Travel-Pages-Sub/{section}/{year}/{Trip-Name-YYYY}/` |
| Trip subpage HTML | `{Trip-Name-YYYY}-1.html` (and `-2.html` if multi-page) |
| Year page | `Travel-Pages/{section}/{section}-{year}.html` |
| Year-page thumbnail (you drop here) | `assets/images/gallary/{section}/{year}/{Month}-{Trip-Display-Name}-{year}.jpeg` |
| Subpage photos (you drop here) | `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/` — files renamed to `{TripPrefix}-HP.jpeg`, `{TripPrefix}-1.jpeg`, … |
| Header/footer (subpage) | `../../../../header-M.html`, `../../../../footer-M.html` (depth may vary by section) |

---

## 6. Placeholders the skill will insert (you replace in Cursor)

- `[INTRO_PARAGRAPH]` — your intro at the top of the entry.
- `[DATE_RANGE]` — e.g. "Jan 6–8, 2026".
- `[LOCATION]` — e.g. "Whistler, BC".
- `[PEOPLE]` — e.g. "With Family & Friends".
- `[EXACT_LOCATION]` — if different from location (e.g. venue name).
- Optional: `[SECTION_1_DESCRIPTION]`, `[SECTION_2_DESCRIPTION]`, … for multi-section trips.

---

## 7. Existing image tool (do not duplicate)

**Yes — you already have an image optimization tool.** It lives in the repo at **`travel-page-tool/`** and was used for Vincent & Erin's wedding (`Travel-Pages-Sub/20s/2024/Vincents-Wedding-2024`).

- **What it does:** Reads photos from a folder, extracts EXIF (date/time), sorts by date, selects a hero image (by resolution + aspect ratio), renames to `{tripName}-1.jpeg`, `{tripName}-2.jpeg`, `{tripName}-HP.jpeg`, resizes/optimizes with **sharp**, organizes into date-based sections, and can generate HTML. Run via `npm run create-trip` or `node dist/cli.js` (optionally with `--config` or `--photos`).
- **What the new skill should do:** Reference and use this tool where it fits (e.g. "run the travel-page-tool for rename + optimize" when working on photos already in `Travel-Pages-Images`). **Do not create a second skill or duplicate logic** for image optimization.
- **Gap:** The tool does **not** currently **crop** the hero image so it doesn't dominate the page or prioritize subjects (people then landscape). For the subpage hero (A2), we need to add a **hero crop** step—either inside `travel-page-tool` (e.g. in `image-processor.ts`: crop hero to a fixed aspect ratio / max height, with optional "entropy" or face-aware cropping if we want to prioritize people), or as a one-off script/step the skill runs. Other subpage hero images in the repo can be used as reference for target aspect ratio and framing.

---

## 8. Skill implementation (after you approve)

- **Location:** Project skill in `.cursor/skills/` (e.g. `create-new-trip-page/`) so it's tied to this repo.
- **Content:** The skill's `SKILL.md` will:
  - Describe the trigger ("Use when the user wants to create a new trip page or add a new trip entry.").
  - Embed this workflow: ask for section, trip name, year, multi-page, thumbnail, hero + subpage photos, metadata, intro.
  - Reference the paths and naming above.
  - Point to a template file and the year-page structure.
  - List placeholder tokens so the agent inserts them and you replace in Cursor.
- **Optional:** A small `reference.md` in the skill folder with exact path tables and a checklist so the agent doesn't miss a step.

---

## 9. Summary

- You say "create a new trip page." The skill asks: **section** (20s, 30s, …), **trip name**, **year**, **multi-page?**, then thumbnail (you drop in `gallary`), hero + subpage photos (you drop in `Travel-Pages-Images`), metadata, and intro (or placeholders).
- The skill creates/updates folders and the year page if needed; **crops** the hero so it doesn't dominate the page (prioritize people, then landscape); renames subpage photos by datetime (same pattern as other trips); uses the **existing travel-page-tool** for optimization where applicable; adds the year-page entry; and leaves placeholders for you to replace in Cursor.
- You supply: one thumbnail in `gallary`, all subpage photos (including hero) in `Travel-Pages-Images`, section/trip/year/multi-page, metadata, and final wording. No new image-optimization skill—reuse `travel-page-tool`; add hero cropping there or as a single step.

---

*This plan is also kept in `.cursor/PLAN-new-trip-page-skill.md` for the agent. When you return, open `docs/PLAN-new-trip-page-skill.md` or search for "trip page plan" to continue.*
