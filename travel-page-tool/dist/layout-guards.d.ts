/**
 * Permanent guard for Chile leftover reading flow.
 *
 * Bug this prevents: clear:both after only the first leftover paragraph, which
 * pushes later paragraphs below a tall photo and leaves a blank column beside it.
 * Correct: ALL section <p> tags stay inside .travel-leftover-wrap BEFORE clear:both.
 */
/** clear closes leftover wrap, then a sibling <p> sits outside (blank column). */
export declare const LEFTOVER_BLANK_COLUMN_RE: RegExp;
export declare const LEFTOVER_BLANK_COLUMN_MSG: string;
export declare function hasLeftoverBlankColumn(html: string): boolean;
/** Throws if HTML has the blank-column leftover bug. */
export declare function assertNoLeftoverBlankColumn(html: string): void;
/**
 * Year-page memory-bar nav must only link to other year gallery pages
 * (`Travel-Pages/{section}/{section}-{label}.html`), never to trip subpages.
 * A prior batch rewrite used a loose `<a href>…<img>` regex that spanned from
 * the year dropdown into a gallery card and corrupted the 2025 link.
 */
export declare const YEAR_NAV_TRIP_LINK_MSG: string;
/** Slice of year HTML that is the 20s/College memory-bar dropdown area (before gallery). */
export declare function yearPageNavRegion(html: string): string;
/** Gallery card region only — the only place trip cards may be inserted/updated. */
export declare function yearPageGalleryRegion(html: string): string;
export declare function hasYearNavTripLinks(html: string): boolean;
export declare function assertYearNavIntact(html: string): void;
//# sourceMappingURL=layout-guards.d.ts.map