/**
 * Permanent guard for Chile leftover reading flow.
 *
 * Bug this prevents: clear:both after only the first leftover paragraph, which
 * pushes later paragraphs below a tall photo and leaves a blank column beside it.
 * Correct: ALL section <p> tags stay inside .travel-leftover-wrap BEFORE clear:both.
 */

/** clear closes leftover wrap, then a sibling <p> sits outside (blank column). */
export const LEFTOVER_BLANK_COLUMN_RE = /clear:both"><\/div>\s*<\/div>\s*<p\s/i;

export const LEFTOVER_BLANK_COLUMN_MSG =
  'Leftover wrap clears before following paragraphs (blank column beside tall leftovers). ' +
  'All section paragraphs must stay inside .travel-leftover-wrap before clear:both. Re-run render-trip.';

export function hasLeftoverBlankColumn(html: string): boolean {
  return LEFTOVER_BLANK_COLUMN_RE.test(html);
}

/** Throws if HTML has the blank-column leftover bug. */
export function assertNoLeftoverBlankColumn(html: string): void {
  if (hasLeftoverBlankColumn(html)) {
    throw new Error(LEFTOVER_BLANK_COLUMN_MSG);
  }
}

/**
 * Year-page memory-bar nav must only link to other year gallery pages
 * (`Travel-Pages/{section}/{section}-{label}.html`), never to trip subpages.
 * A prior batch rewrite used a loose `<a href>…<img>` regex that spanned from
 * the year dropdown into a gallery card and corrupted the 2025 link.
 */
export const YEAR_NAV_TRIP_LINK_MSG =
  'Year-page memory-bar nav links a trip subpage (Travel-Pages-Sub). ' +
  'Year dropdown links must stay on Travel-Pages/{section}/… year galleries only. ' +
  'Never rewrite hrefs outside .filtr-container.';

/** Slice of year HTML that is the 20s/College memory-bar dropdown area (before gallery). */
export function yearPageNavRegion(html: string): string {
  const memories = html.indexOf('memories-home');
  const filtr = html.indexOf('filtr-container');
  if (memories === -1) return '';
  if (filtr === -1 || filtr < memories) return html.slice(memories);
  return html.slice(memories, filtr);
}

/** Gallery card region only — the only place trip cards may be inserted/updated. */
export function yearPageGalleryRegion(html: string): string {
  const filtr = html.indexOf('filtr-container');
  if (filtr === -1) return '';
  return html.slice(filtr);
}

export function hasYearNavTripLinks(html: string): boolean {
  const nav = yearPageNavRegion(html);
  return /href\s*=\s*["'][^"']*Travel-Pages-Sub\//i.test(nav);
}

export function assertYearNavIntact(html: string): void {
  if (hasYearNavTripLinks(html)) {
    throw new Error(YEAR_NAV_TRIP_LINK_MSG);
  }
}
