import exifr from 'exifr';
import * as fs from 'fs';
import * as path from 'path';

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
export async function extractExifData(filePath: string): Promise<PhotoMetadata> {
  const fileName = path.basename(filePath);
  
  try {
    // Parse EXIF data
    const exif = await exifr.parse(filePath, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'ImageWidth', 'ImageHeight', 'Orientation', 'Make', 'Model'],
    });

    // Get date taken - try multiple EXIF fields
    let dateTaken: Date | null = null;
    if (exif?.DateTimeOriginal) {
      dateTaken = new Date(exif.DateTimeOriginal);
    } else if (exif?.CreateDate) {
      dateTaken = new Date(exif.CreateDate);
    } else if (exif?.ModifyDate) {
      dateTaken = new Date(exif.ModifyDate);
    }

    // If no EXIF date, fall back to file modification time
    if (!dateTaken || isNaN(dateTaken.getTime())) {
      const stats = fs.statSync(filePath);
      dateTaken = stats.mtime;
    }

    return {
      filePath,
      fileName,
      dateTaken,
      width: exif?.ImageWidth || null,
      height: exif?.ImageHeight || null,
      orientation: exif?.Orientation || null,
      make: exif?.Make || null,
      model: exif?.Model || null,
    };
  } catch (error) {
    // If EXIF parsing fails, use file stats
    const stats = fs.statSync(filePath);
    return {
      filePath,
      fileName,
      dateTaken: stats.mtime,
      width: null,
      height: null,
      orientation: null,
      make: null,
      model: null,
    };
  }
}

/**
 * Extract EXIF data from multiple photos
 */
export async function extractExifDataBatch(filePaths: string[]): Promise<PhotoMetadata[]> {
  const results: PhotoMetadata[] = [];
  
  for (const filePath of filePaths) {
    const metadata = await extractExifData(filePath);
    results.push(metadata);
  }
  
  return results;
}

/**
 * Sort photos by date taken (chronologically)
 */
export function sortPhotosByDate(photos: PhotoMetadata[]): PhotoMetadata[] {
  return [...photos].sort((a, b) => {
    const dateA = a.dateTaken?.getTime() || 0;
    const dateB = b.dateTaken?.getTime() || 0;
    return dateA - dateB;
  });
}

/**
 * Get supported image extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.heic', '.heif'];
}

/**
 * Check if a file is a supported image
 */
export function isSupportedImage(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return getSupportedExtensions().includes(ext);
}

/**
 * Scan a directory for all supported images
 */
export function scanDirectoryForImages(dirPath: string): string[] {
  const images: string[] = [];
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile() && isSupportedImage(fullPath)) {
      images.push(fullPath);
    }
  }
  
  return images;
}
