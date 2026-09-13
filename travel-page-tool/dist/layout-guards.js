"use strict";
/**
 * Permanent guard for Chile leftover reading flow.
 *
 * Bug this prevents: clear:both after only the first leftover paragraph, which
 * pushes later paragraphs below a tall photo and leaves a blank column beside it.
 * Correct: ALL section <p> tags stay inside .travel-leftover-wrap BEFORE clear:both.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEFTOVER_BLANK_COLUMN_MSG = exports.LEFTOVER_BLANK_COLUMN_RE = void 0;
exports.hasLeftoverBlankColumn = hasLeftoverBlankColumn;
exports.assertNoLeftoverBlankColumn = assertNoLeftoverBlankColumn;
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
//# sourceMappingURL=layout-guards.js.map