"use strict";
/**
 * Permanent guard for Chile leftover reading flow.
 *
 * Bug this prevents: clear:both after only the first leftover paragraph, which
 * pushes later paragraphs below a tall photo and leaves a blank column beside it.
 * Correct: ALL section <p> tags stay inside .travel-leftover-wrap BEFORE clear:both.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.YEAR_NAV_TRIP_LINK_MSG = exports.LEFTOVER_BLANK_COLUMN_MSG = exports.LEFTOVER_BLANK_COLUMN_RE = void 0;
exports.hasLeftoverBlankColumn = hasLeftoverBlankColumn;
exports.assertNoLeftoverBlankColumn = assertNoLeftoverBlankColumn;
exports.yearPageNavRegion = yearPageNavRegion;
exports.yearPageGalleryRegion = yearPageGalleryRegion;
exports.hasYearNavTripLinks = hasYearNavTripLinks;
exports.assertYearNavIntact = assertYearNavIntact;
/** clear closes leftover wrap, then a sibling <p> sits outside (blank column). */
exports.LEFTOVER_BLANK_COLUMN_RE = /clear:both"><\/div>\s*<\/div>\s*<p\s/i;
exports.LEFTOVER_BLANK_COLUMN_MSG = 'Leftover wrap clears before following paragraphs (blank column beside tall leftovers). ' +
    'All section paragraphs must stay inside .travel-leftover-wrap before clear:both. Re-run render-trip.';
function hasLeftoverBlankColumn(html) {
    return exports.LEFTOVER_BLANK_COLUMN_RE.test(html);
}
/** Throws if HTML has the blank-column leftover bug. */
function assertNoLeftoverBlankColumn(html) {
    if (hasLeftoverBlankColumn(html)) {
        throw new Error(exports.LEFTOVER_BLANK_COLUMN_MSG);
    }
}
/**
 * Year-page memory-bar nav must only link to other year gallery pages
 * (`Travel-Pages/{section}/{section}-{label}.html`), never to trip subpages.
 * A prior batch rewrite used a loose `<a href>…<img>` regex that spanned from
 * the year dropdown into a gallery card and corrupted the 2025 link.
 */
exports.YEAR_NAV_TRIP_LINK_MSG = 'Year-page memory-bar nav links a trip subpage (Travel-Pages-Sub). ' +
    'Year dropdown links must stay on Travel-Pages/{section}/… year galleries only. ' +
    'Never rewrite hrefs outside .filtr-container.';
/** Slice of year HTML that is the 20s/College memory-bar dropdown area (before gallery). */
function yearPageNavRegion(html) {
    const memories = html.indexOf('memories-home');
    const filtr = html.indexOf('filtr-container');
    if (memories === -1)
        return '';
    if (filtr === -1 || filtr < memories)
        return html.slice(memories);
    return html.slice(memories, filtr);
}
/** Gallery card region only — the only place trip cards may be inserted/updated. */
function yearPageGalleryRegion(html) {
    const filtr = html.indexOf('filtr-container');
    if (filtr === -1)
        return '';
    return html.slice(filtr);
}
function hasYearNavTripLinks(html) {
    const nav = yearPageNavRegion(html);
    return /href\s*=\s*["'][^"']*Travel-Pages-Sub\//i.test(nav);
}
function assertYearNavIntact(html) {
    if (hasYearNavTripLinks(html)) {
        throw new Error(exports.YEAR_NAV_TRIP_LINK_MSG);
    }
}
//# sourceMappingURL=layout-guards.js.map