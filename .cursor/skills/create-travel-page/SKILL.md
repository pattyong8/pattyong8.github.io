---
name: create-travel-page
description: Guides the user through creating a new trip page: travel subpage (Travel-Pages-Sub), year-page entry (Travel-Pages), hero and thumbnail (different images), photo rename/optimize, thumbnail crop (people-focused), hero crop, and leftover photo rows (1–2 photos) with side text wrap like Chile 2026. Use when the user says "Create travel page" or wants to add a new trip entry to the site.
---

# Create Travel Page

When the user says **"Create travel page"** (or equivalent), run this workflow. Ask for info in order; then perform all image and page steps; **last step** is asking the user for placeholder replacement text.

## 1. Ask the user (in order)

1. **Which section?** — 20s, 30s, 40s, … (age-based). Determines all paths.
2. **Trip name** — e.g. "Whistler 2026". Used for folder names, titles, image prefixes.
3. **Year** — e.g. 2026.
4. **Is this a multi-page trip?** — Yes/No. If yes, create `-1.html`, `-2.html`, … with Next/Previous links.
5. **Thumbnail (year page only)** — User places **one** image in `assets/images/gallary/{section}/{year}/`. This is **only** for the year-page gallery. Skill will **crop** it to match other year-page thumbnails (focus on **people** in the photo), **optimize** for web, and save as `{Month}-{Trip-Display-Name}-{year}.jpeg` in that same gallary folder.
6. **Hero + subpage photos** — User places the **hero** image (top of subpage) and **all other** subpage photos in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. Hero and thumbnail must be **different** images: hero lives in Travel-Pages-Images, thumbnail lives in gallary. Skill will: **rename** all images in that folder by date/time metadata to `{TripPrefix}-1.jpeg`, `{TripPrefix}-2.jpeg`, … and `{TripPrefix}-HP.jpeg` for the hero; **optimize** all for web (use **travel-page-tool** for rename + optimize); **crop** the hero so it doesn’t dominate the page (prioritize people, then landscape), save as `{TripPrefix}-HP.jpeg` in that folder.

Do **not** ask for metadata or intro yet — that comes after all automated steps.

## 2. Do all image and page steps (before asking for placeholders)

Perform these in one go after the user has confirmed thumbnail is in gallary and hero + photos are in Travel-Pages-Images:

### 2a. Year-page thumbnail (gallary)

- **Crop** the image in `assets/images/gallary/{section}/{year}/` to match other year-page thumbnails (check existing thumbs in that year for aspect ratio/size). **Focus the crop on people** in the photo.
- **Optimize** for web (resize, compress). **Preserve date/time metadata (EXIF)** — do not strip it.
- Save as `{Month}-{Trip-Display-Name}-{year}.jpeg` in that gallary folder (overwrite or replace the file the user dropped if needed).

### 2b. Subpage photos (Travel-Pages-Images)

- **Rename** all images in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/` by date/time metadata to `{TripPrefix}-1.jpeg`, `{TripPrefix}-2.jpeg`, … in **chronological order**. Designate one as hero and save it also as `{TripPrefix}-HP.jpeg` (or use the image the user intended as hero).
- **Optimize** all for web. Use **travel-page-tool** (`npm run create-trip` or `node dist/cli.js` from `travel-page-tool/`) with `--photos` pointing to that folder; ensure output writes to the same folder and trip name matches `{TripPrefix}`. Do not duplicate image logic outside the tool. **When optimizing or processing images, do not remove date/time metadata (EXIF)** — preserve it so photos can be re-sorted by capture time later.
- **Hero crop:** Crop the hero image so it does **not** take up the entire webpage; prioritize **people** first, then landscape. Save as `{TripPrefix}-HP.jpeg` in the trip folder. Use existing subpage hero images in the repo as reference for aspect ratio/framing.

### 2c. Create travel subpage (Travel-Pages-Sub)

- Create `Travel-Pages-Sub/{section}/{year}/{Trip-Folder}/` and `{Trip-Folder}-1.html` (and `-2.html` if multi-page).
- Copy HTML from `Travel-Pages-Sub/20s/2024/Vincents-Wedding-2024/Vincents-Wedding-2024-1.html` for overall page chrome. For the **photo grid helper**, copy `buildGrid` / `photoCard` / `pStyle` from `Travel-Pages-Sub/20s/2026/Mar-Chile-2026/Mar-Chile-2026-1.html` (canonical leftover-row layout). Adjust paths for section and depth. Set title and hero `src` to `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/{TripPrefix}-HP.jpeg`. Insert placeholders: `[INTRO_PARAGRAPH]`, `[DATE_RANGE]`, `[LOCATION]`, `[PEOPLE]`, `[EXACT_LOCATION]`. Use `buildGrid` for body images (`{TripPrefix}-1.jpeg`, …).

### 2c-layout. Photo grids and leftover rows (required)

Photos are laid out **3 across**. Every future travel page must handle leftover 1–2 photo rows the same way as Chile 2026:

1. **Prefer multiples of 3** when grouping photos into sections (merge adjacent story beats if needed) so most rows are full.
2. When a group still ends with **1 or 2 leftover photos**, do **not** stretch them full-width and do **not** leave a blank gap.
3. Use the Chile `buildGrid(containerId, prefix, start, end, sideTextHtml)` helper:
   - Full rows of 3: normal 1/3-width cards.
   - Leftover row: float leftover photos at ~1/3 width each; put the section’s first narrative paragraph(s) in `sideTextHtml` beside them.
   - The helper pulls following `<p>` tags into the float wrap so text continues under the side text beside tall leftovers, then goes full-width once past the photo.
   - **Do not** use a flex photo | text-column layout that dumps all paragraphs into a permanently narrow right column.
4. On leftover sections, call `buildGrid` with `sideTextHtml` using `pStyle`. On full multiples of 3, call `buildGrid` without side text and keep paragraphs as normal `<p>` tags underneath.
5. Section headers (`h2` inside `.entry__related`) get spacing from `style.css` / `main.css` (`.entry__related > h2 { margin-bottom: 3.2rem }`). Do not zero that out; keep heading-to-content breathing room. Note: `style.css` resets all heading margins to 0, so the travel-page rule must come after that reset (or use `!important`).

### 2d. Update year page (Travel-Pages)

- Ensure `Travel-Pages/{section}/{section}-{year}.html` exists (create from existing year page if not).
- Add a new `col-md-4` entry: `href` → `../../Travel-Pages-Sub/{section}/{year}/{Trip-Folder}/{Trip-Folder}-1.html`, thumbnail `src` → `../../assets/images/gallary/{section}/{year}/{Month}-{Trip-Display-Name}-{year}.jpeg`, title and date in `item-title`.

## 3. Last step: Ask for placeholder replacements

**After** all of the above are done, ask the user for:

- **Trip date range** — e.g. "Mar 5–15, 2026" (to replace `[DATE_RANGE]`).
- **Location** — e.g. "Chile" or "Santiago & Atacama, Chile" (to replace `[LOCATION]`).
- **People** — e.g. "With Family & Friends" (to replace `[PEOPLE]`).
- **Exact location** — if different (to replace `[EXACT_LOCATION]`).
- **Intro paragraph** — text for the top of the subpage (to replace `[INTRO_PARAGRAPH]`).
- **Section description(s)** — optional (to replace `[SECTION_1_DESCRIPTION]`, etc.).

Insert the user’s answers into the subpage HTML, or tell them exactly where to paste in Cursor.

## 4. Preserve EXIF (date/time metadata)

When cropping, resizing, or optimizing any photo (thumbnail, hero, or subpage body), **do not remove date/time metadata (EXIF)**. Keep DateTimeOriginal / CreateDate / ModifyDate and other EXIF so that photos can be re-sorted by capture time later (e.g. when adding more photos). In code: use sharp’s `.withMetadata()` (or equivalent) when writing JPEG/PNG.

## 5. Image locations (do not mix)

- **Thumbnail (year page):** lives only in `assets/images/gallary/{section}/{year}/`. Cropped (people-focused), optimized, named `{Month}-{Trip-Display-Name}-{year}.jpeg`.
- **Hero + body photos:** live only in `assets/images/Travel-Pages-Images/{section}/{year}/{Trip-Folder}/`. Hero = `{TripPrefix}-HP.jpeg`; body = `{TripPrefix}-1.jpeg`, … Renamed by EXIF, optimized. Hero and thumbnail are **different** images.

## 6. Placeholders to insert (user supplies in step 3)

- `[INTRO_PARAGRAPH]` — intro at top of entry  
- `[DATE_RANGE]` — e.g. "Jan 6–8, 2026"  
- `[LOCATION]` — e.g. "Whistler, BC"  
- `[PEOPLE]` — e.g. "With Family & Friends"  
- `[EXACT_LOCATION]` — if different from location  
- Optional: `[SECTION_1_DESCRIPTION]`, `[SECTION_2_DESCRIPTION]` for multi-section trips  

## 7. Reference

- Path table and checklist: [reference.md](reference.md). Full plan: `docs/PLAN-new-trip-page-skill.md`.
