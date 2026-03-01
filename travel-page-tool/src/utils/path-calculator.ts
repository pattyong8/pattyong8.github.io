import * as path from 'path';

/**
 * Calculate the relative path depth from Travel-Pages-Sub to project root
 * Standard structure: Travel-Pages-Sub/{category}/{year}/{trip-name}/{trip-name}-1.html
 * This is always 4 levels deep: ../../../../
 */
export function getRelativePathToRoot(): string {
  return '../../../../';
}

/**
 * Build the image directory path for a trip
 */
export function buildImageDirectoryPath(category: string, year: string, tripName: string): string {
  return path.join('assets', 'images', 'Travel-Pages-Images', category, year, tripName);
}

/**
 * Build the HTML directory path for a trip
 */
export function buildHtmlDirectoryPath(category: string, year: string, tripName: string): string {
  return path.join('Travel-Pages-Sub', category, year, tripName);
}

/**
 * Build the relative path from HTML file to images
 */
export function buildRelativeImagePath(category: string, year: string, tripName: string): string {
  const rootPath = getRelativePathToRoot();
  return `${rootPath}assets/images/Travel-Pages-Images/${category}/${year}/${tripName}/`;
}

/**
 * Build the image filename following the naming convention
 */
export function buildImageFileName(tripName: string, index: number): string {
  return `${tripName}-${index}.jpeg`;
}

/**
 * Build the hero image filename
 */
export function buildHeroImageFileName(tripName: string): string {
  return `${tripName}-HP.jpeg`;
}

/**
 * Build the HTML filename for a trip page
 */
export function buildHtmlFileName(tripName: string, pageNumber: number = 1): string {
  return `${tripName}-${pageNumber}.html`;
}

/**
 * Convert a string to kebab-case (e.g., "Paris 2024" -> "Paris-2024")
 */
export function toKebabCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Get category options
 */
export function getCategoryOptions(): { value: string; name: string }[] {
  return [
    { value: '20s', name: '20s (2019-present)' },
    { value: 'College-J&S', name: 'College Junior & Senior' },
    { value: 'College-F&S', name: 'College Freshman & Sophomore' },
    { value: 'HighSchool', name: 'High School' },
    { value: 'MiddleSchool', name: 'Middle School' },
  ];
}

/**
 * Validate category is one of the allowed values
 */
export function isValidCategory(category: string): boolean {
  const validCategories = getCategoryOptions().map(c => c.value);
  return validCategories.includes(category);
}
