import { PhotoMetadata } from './utils/exif-reader';
export interface ImageProcessingOptions {
    maxWidth: number;
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
    responsive: boolean;
    responsiveSizes: {
        name: string;
        width: number;
    }[];
}
export interface ProcessedImage {
    originalPath: string;
    outputPath: string;
    newFileName: string;
    metadata: PhotoMetadata;
    index: number;
    isHero: boolean;
    responsiveFiles?: ResponsiveImageSet;
}
export interface ResponsiveImageSet {
    webp: {
        small: string;
        large: string;
    };
    jpeg: {
        small: string;
        large: string;
    };
}
/**
 * Process a single image: resize, optimize, and save
 */
export declare function processImage(inputPath: string, outputPath: string, options?: ImageProcessingOptions): Promise<void>;
/**
 * Process a single image into responsive sizes (WebP + JPEG fallback)
 */
export declare function processResponsiveImage(inputPath: string, outputDir: string, baseName: string, options?: ImageProcessingOptions): Promise<ResponsiveImageSet>;
/**
 * Get image dimensions
 */
export declare function getImageDimensions(imagePath: string): Promise<{
    width: number;
    height: number;
}>;
/**
 * Calculate image quality score for hero selection
 * Higher is better - based on resolution and aspect ratio
 */
export declare function calculateImageScore(imagePath: string): Promise<number>;
/**
 * Select the best photo for hero image
 */
export declare function selectHeroImage(photos: PhotoMetadata[]): Promise<PhotoMetadata | null>;
/**
 * Process all images in a directory
 */
export declare function processAllImages(inputDir: string, outputDir: string, tripName: string, options?: ImageProcessingOptions, onProgress?: (current: number, total: number, fileName: string) => void): Promise<ProcessedImage[]>;
/**
 * Create backup of original images
 */
export declare function backupOriginalImages(inputDir: string, backupDir: string): void;
//# sourceMappingURL=image-processor.d.ts.map