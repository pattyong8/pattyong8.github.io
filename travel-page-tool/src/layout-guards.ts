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
