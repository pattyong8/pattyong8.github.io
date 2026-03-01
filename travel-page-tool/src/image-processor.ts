import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { PhotoMetadata, extractExifData, sortPhotosByDate, scanDirectoryForImages } from './utils/exif-reader';
import { buildImageFileName, buildHeroImageFileName } from './utils/path-calculator';

export interface ImageProcessingOptions {
  maxWidth: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  responsive: boolean;
  responsiveSizes: { name: string; width: number }[];
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
  webp: { small: string; large: string };
  jpeg: { small: string; large: string };
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1500,
  quality: 85,
  format: 'jpeg',
  responsive: true,
  responsiveSizes: [
    { name: 'small', width: 600 },   // Mobile
    { name: 'large', width: 1500 },  // Desktop
  ],
};

/**
 * Process a single image: resize, optimize, and save
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  options: ImageProcessingOptions = DEFAULT_OPTIONS
): Promise<void> {
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process with sharp
  let pipeline = sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({
      width: options.maxWidth,
      withoutEnlargement: true, // Don't upscale smaller images
      fit: 'inside',
    });

  // Apply format-specific optimizations
  if (options.format === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality: options.quality,
      mozjpeg: true, // Better compression
    });
  } else if (options.format === 'png') {
    pipeline = pipeline.png({
      quality: options.quality,
      compressionLevel: 9,
    });
  } else if (options.format === 'webp') {
    pipeline = pipeline.webp({
      quality: options.quality,
    });
  }

  await pipeline.toFile(outputPath);
}

/**
 * Process a single image into responsive sizes (WebP + JPEG fallback)
 */
export async function processResponsiveImage(
  inputPath: string,
  outputDir: string,
  baseName: string,
  options: ImageProcessingOptions = DEFAULT_OPTIONS
): Promise<ResponsiveImageSet> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const responsiveFiles: ResponsiveImageSet = {
    webp: { small: '', large: '' },
    jpeg: { small: '', large: '' },
  };

  // Generate each size in both formats
  for (const size of options.responsiveSizes) {
    const webpFileName = `${baseName}-${size.width}.webp`;
    const jpegFileName = `${baseName}-${size.width}.jpeg`;
    
    const webpPath = path.join(outputDir, webpFileName);
    const jpegPath = path.join(outputDir, jpegFileName);

    // Create base pipeline with resize
    const resizedBuffer = await sharp(inputPath)
      .rotate()
      .resize({
        width: size.width,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .toBuffer();

    // Save as WebP
    await sharp(resizedBuffer)
      .webp({ quality: options.quality })
      .toFile(webpPath);

    // Save as JPEG (fallback)
    await sharp(resizedBuffer)
      .jpeg({ quality: options.quality, mozjpeg: true })
      .toFile(jpegPath);

    // Store file names
    if (size.name === 'small') {
      responsiveFiles.webp.small = webpFileName;
      responsiveFiles.jpeg.small = jpegFileName;
    } else {
      responsiveFiles.webp.large = webpFileName;
      responsiveFiles.jpeg.large = jpegFileName;
    }
  }

  return responsiveFiles;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Calculate image quality score for hero selection
 * Higher is better - based on resolution and aspect ratio
 */
export async function calculateImageScore(imagePath: string): Promise<number> {
  try {
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    // Resolution score (prefer larger images)
    const resolution = width * height;
    const resolutionScore = Math.min(resolution / 1000000, 20); // Cap at 20MP
    
    // Aspect ratio score (prefer landscape or near-square for hero images)
    const aspectRatio = width / height;
    let aspectScore = 0;
    if (aspectRatio >= 1.2 && aspectRatio <= 2.0) {
      // Landscape - ideal for hero images
      aspectScore = 10;
    } else if (aspectRatio >= 0.8 && aspectRatio < 1.2) {
      // Near-square - good
      aspectScore = 7;
    } else if (aspectRatio >= 0.5 && aspectRatio < 0.8) {
      // Portrait - less ideal for hero
      aspectScore = 3;
    }
    
    return resolutionScore + aspectScore;
  } catch {
    return 0;
  }
}

/**
 * Select the best photo for hero image
 */
export async function selectHeroImage(photos: PhotoMetadata[]): Promise<PhotoMetadata | null> {
  if (photos.length === 0) return null;
  
  let bestPhoto = photos[0];
  let bestScore = 0;
  
  for (const photo of photos) {
    const score = await calculateImageScore(photo.filePath);
    if (score > bestScore) {
      bestScore = score;
      bestPhoto = photo;
    }
  }
  
  return bestPhoto;
}

/**
 * Process all images in a directory
 */
export async function processAllImages(
  inputDir: string,
  outputDir: string,
  tripName: string,
  options: ImageProcessingOptions = DEFAULT_OPTIONS,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ProcessedImage[]> {
  // Scan for images
  const imagePaths = scanDirectoryForImages(inputDir);
  
  if (imagePaths.length === 0) {
    throw new Error(`No images found in: ${inputDir}`);
  }

  // Extract EXIF data from all images
  const metadataPromises = imagePaths.map(p => extractExifData(p));
  const allMetadata = await Promise.all(metadataPromises);
  
  // Sort by date taken
  const sortedPhotos = sortPhotosByDate(allMetadata);
  
  // Select hero image
  const heroPhoto = await selectHeroImage(sortedPhotos);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const processedImages: ProcessedImage[] = [];
  const total = sortedPhotos.length;
  
  // Process each image
  for (let i = 0; i < sortedPhotos.length; i++) {
    const photo = sortedPhotos[i];
    const index = i + 1; // 1-based indexing
    const baseName = `${tripName}-${index}`;
    
    if (onProgress) {
      onProgress(i + 1, total, photo.fileName);
    }
    
    let responsiveFiles: ResponsiveImageSet | undefined;
    
    if (options.responsive) {
      // Generate responsive images (WebP + JPEG at multiple sizes)
      responsiveFiles = await processResponsiveImage(
        photo.filePath,
        outputDir,
        baseName,
        options
      );
    } else {
      // Legacy: single image processing
      const newFileName = buildImageFileName(tripName, index);
      const outputPath = path.join(outputDir, newFileName);
      await processImage(photo.filePath, outputPath, options);
    }
    
    processedImages.push({
      originalPath: photo.filePath,
      outputPath: outputDir,
      newFileName: baseName,
      metadata: photo,
      index,
      isHero: heroPhoto?.filePath === photo.filePath,
      responsiveFiles,
    });
  }
  
  // Process hero image
  if (heroPhoto) {
    const heroBaseName = `${tripName}-HP`;
    
    if (options.responsive) {
      await processResponsiveImage(
        heroPhoto.filePath,
        outputDir,
        heroBaseName,
        options
      );
    } else {
      const heroFileName = buildHeroImageFileName(tripName);
      const heroOutputPath = path.join(outputDir, heroFileName);
      await processImage(heroPhoto.filePath, heroOutputPath, options);
    }
  }
  
  return processedImages;
}

/**
 * Create backup of original images
 */
export function backupOriginalImages(inputDir: string, backupDir: string): void {
  const imagePaths = scanDirectoryForImages(inputDir);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  for (const imagePath of imagePaths) {
    const fileName = path.basename(imagePath);
    const backupPath = path.join(backupDir, fileName);
    fs.copyFileSync(imagePath, backupPath);
  }
}
