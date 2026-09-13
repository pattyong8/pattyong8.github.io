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
//# sourceMappingURL=layout-guards.d.ts.map