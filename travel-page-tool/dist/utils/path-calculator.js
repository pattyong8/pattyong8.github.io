"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelativePathToRoot = getRelativePathToRoot;
exports.buildImageDirectoryPath = buildImageDirectoryPath;
exports.buildHtmlDirectoryPath = buildHtmlDirectoryPath;
exports.buildRelativeImagePath = buildRelativeImagePath;
exports.buildImageFileName = buildImageFileName;
exports.buildHeroImageFileName = buildHeroImageFileName;
exports.buildHtmlFileName = buildHtmlFileName;
exports.toKebabCase = toKebabCase;
exports.getCategoryOptions = getCategoryOptions;
exports.isValidCategory = isValidCategory;
const path = __importStar(require("path"));
/**
 * Calculate the relative path depth from Travel-Pages-Sub to project root
 * Standard structure: Travel-Pages-Sub/{category}/{year}/{trip-name}/{trip-name}-1.html
 * This is always 4 levels deep: ../../../../
 */
function getRelativePathToRoot() {
    return '../../../../';
}
/**
 * Build the image directory path for a trip
 */
function buildImageDirectoryPath(category, year, tripName) {
    return path.join('assets', 'images', 'Travel-Pages-Images', category, year, tripName);
}
/**
 * Build the HTML directory path for a trip
 */
function buildHtmlDirectoryPath(category, year, tripName) {
    return path.join('Travel-Pages-Sub', category, year, tripName);
}
/**
 * Build the relative path from HTML file to images
 */
function buildRelativeImagePath(category, year, tripName) {
    const rootPath = getRelativePathToRoot();
    return `${rootPath}assets/images/Travel-Pages-Images/${category}/${year}/${tripName}/`;
}
/**
 * Build the image filename following the naming convention
 */
function buildImageFileName(tripName, index) {
    return `${tripName}-${index}.jpeg`;
}
/**
 * Build the hero image filename
 */
function buildHeroImageFileName(tripName) {
    return `${tripName}-HP.jpeg`;
}
/**
 * Build the HTML filename for a trip page
 */
function buildHtmlFileName(tripName, pageNumber = 1) {
    return `${tripName}-${pageNumber}.html`;
}
/**
 * Convert a string to kebab-case (e.g., "Paris 2024" -> "Paris-2024")
 */
function toKebabCase(str) {
    return str
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-');
}
/**
 * Get category options
 */
function getCategoryOptions() {
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
function isValidCategory(category) {
    const validCategories = getCategoryOptions().map(c => c.value);
    return validCategories.includes(category);
}
//# sourceMappingURL=path-calculator.js.map