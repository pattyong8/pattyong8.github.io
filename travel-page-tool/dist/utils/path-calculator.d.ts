/**
 * Calculate the relative path depth from Travel-Pages-Sub to project root
 * Standard structure: Travel-Pages-Sub/{category}/{year}/{trip-name}/{trip-name}-1.html
 * This is always 4 levels deep: ../../../../
 */
export declare function getRelativePathToRoot(): string;
/**
 * Build the image directory path for a trip
 */
export declare function buildImageDirectoryPath(category: string, year: string, tripName: string): string;
/**
 * Build the HTML directory path for a trip
 */
export declare function buildHtmlDirectoryPath(category: string, year: string, tripName: string): string;
/**
 * Build the relative path from HTML file to images
 */
export declare function buildRelativeImagePath(category: string, year: string, tripName: string): string;
/**
 * Build the image filename following the naming convention
 */
export declare function buildImageFileName(tripName: string, index: number): string;
/**
 * Build the hero image filename
 */
export declare function buildHeroImageFileName(tripName: string): string;
/**
 * Build the HTML filename for a trip page
 */
export declare function buildHtmlFileName(tripName: string, pageNumber?: number): string;
/**
 * Convert a string to kebab-case (e.g., "Paris 2024" -> "Paris-2024")
 */
export declare function toKebabCase(str: string): string;
/**
 * Get category options
 */
export declare function getCategoryOptions(): {
    value: string;
    name: string;
}[];
/**
 * Validate category is one of the allowed values
 */
export declare function isValidCategory(category: string): boolean;
//# sourceMappingURL=path-calculator.d.ts.map