import { PhotoMetadata } from './utils/exif-reader';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ValidationOptions {
    checkExifData: boolean;
    checkDuplicates: boolean;
    checkPermissions: boolean;
    minPhotos: number;
    maxPhotos: number;
}
/**
 * Validate a photos folder
 */
export declare function validatePhotosFolder(folderPath: string, options?: Partial<ValidationOptions>): ValidationResult;
/**
 * Validate photo metadata
 */
export declare function validatePhotoMetadata(photos: PhotoMetadata[]): ValidationResult;
/**
 * Validate output directory
 */
export declare function validateOutputDirectory(dirPath: string): ValidationResult;
/**
 * Validate trip configuration
 */
export declare function validateTripConfig(config: {
    tripName: string;
    category: string;
    year: string;
    title: string;
    location: string;
    withPeople: string;
}): ValidationResult;
/**
 * Print validation results
 */
export declare function printValidationResults(result: ValidationResult, label?: string): void;
/**
 * Combine multiple validation results
 */
export declare function combineValidationResults(...results: ValidationResult[]): ValidationResult;
//# sourceMappingURL=validation.d.ts.map