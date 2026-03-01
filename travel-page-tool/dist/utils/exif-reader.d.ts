export interface PhotoMetadata {
    filePath: string;
    fileName: string;
    dateTaken: Date | null;
    width: number | null;
    height: number | null;
    orientation: number | null;
    make: string | null;
    model: string | null;
}
/**
 * Extract EXIF metadata from a single photo
 */
export declare function extractExifData(filePath: string): Promise<PhotoMetadata>;
/**
 * Extract EXIF data from multiple photos
 */
export declare function extractExifDataBatch(filePaths: string[]): Promise<PhotoMetadata[]>;
/**
 * Sort photos by date taken (chronologically)
 */
export declare function sortPhotosByDate(photos: PhotoMetadata[]): PhotoMetadata[];
/**
 * Get supported image extensions
 */
export declare function getSupportedExtensions(): string[];
/**
 * Check if a file is a supported image
 */
export declare function isSupportedImage(filePath: string): boolean;
/**
 * Scan a directory for all supported images
 */
export declare function scanDirectoryForImages(dirPath: string): string[];
//# sourceMappingURL=exif-reader.d.ts.map