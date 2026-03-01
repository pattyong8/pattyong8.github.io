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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = processImage;
exports.processResponsiveImage = processResponsiveImage;
exports.getImageDimensions = getImageDimensions;
exports.calculateImageScore = calculateImageScore;
exports.selectHeroImage = selectHeroImage;
exports.processAllImages = processAllImages;
exports.backupOriginalImages = backupOriginalImages;
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const exif_reader_1 = require("./utils/exif-reader");
const path_calculator_1 = require("./utils/path-calculator");
const DEFAULT_OPTIONS = {
    maxWidth: 1500,
    quality: 85,
    format: 'jpeg',
    responsive: true,
    responsiveSizes: [
        { name: 'small', width: 600 }, // Mobile
        { name: 'large', width: 1500 }, // Desktop
    ],
};
/**
 * Process a single image: resize, optimize, and save
 */
async function processImage(inputPath, outputPath, options = DEFAULT_OPTIONS) {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // Process with sharp
    let pipeline = (0, sharp_1.default)(inputPath)
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
    }
    else if (options.format === 'png') {
        pipeline = pipeline.png({
            quality: options.quality,
            compressionLevel: 9,
        });
    }
    else if (options.format === 'webp') {
        pipeline = pipeline.webp({
            quality: options.quality,
        });
    }
    await pipeline.toFile(outputPath);
}
/**
 * Process a single image into responsive sizes (WebP + JPEG fallback)
 */
async function processResponsiveImage(inputPath, outputDir, baseName, options = DEFAULT_OPTIONS) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const responsiveFiles = {
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
        const resizedBuffer = await (0, sharp_1.default)(inputPath)
            .rotate()
            .resize({
            width: size.width,
            withoutEnlargement: true,
            fit: 'inside',
        })
            .toBuffer();
        // Save as WebP
        await (0, sharp_1.default)(resizedBuffer)
            .webp({ quality: options.quality })
            .toFile(webpPath);
        // Save as JPEG (fallback)
        await (0, sharp_1.default)(resizedBuffer)
            .jpeg({ quality: options.quality, mozjpeg: true })
            .toFile(jpegPath);
        // Store file names
        if (size.name === 'small') {
            responsiveFiles.webp.small = webpFileName;
            responsiveFiles.jpeg.small = jpegFileName;
        }
        else {
            responsiveFiles.webp.large = webpFileName;
            responsiveFiles.jpeg.large = jpegFileName;
        }
    }
    return responsiveFiles;
}
/**
 * Get image dimensions
 */
async function getImageDimensions(imagePath) {
    const metadata = await (0, sharp_1.default)(imagePath).metadata();
    return {
        width: metadata.width || 0,
        height: metadata.height || 0,
    };
}
/**
 * Calculate image quality score for hero selection
 * Higher is better - based on resolution and aspect ratio
 */
async function calculateImageScore(imagePath) {
    try {
        const metadata = await (0, sharp_1.default)(imagePath).metadata();
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
        }
        else if (aspectRatio >= 0.8 && aspectRatio < 1.2) {
            // Near-square - good
            aspectScore = 7;
        }
        else if (aspectRatio >= 0.5 && aspectRatio < 0.8) {
            // Portrait - less ideal for hero
            aspectScore = 3;
        }
        return resolutionScore + aspectScore;
    }
    catch {
        return 0;
    }
}
/**
 * Select the best photo for hero image
 */
async function selectHeroImage(photos) {
    if (photos.length === 0)
        return null;
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
async function processAllImages(inputDir, outputDir, tripName, options = DEFAULT_OPTIONS, onProgress) {
    // Scan for images
    const imagePaths = (0, exif_reader_1.scanDirectoryForImages)(inputDir);
    if (imagePaths.length === 0) {
        throw new Error(`No images found in: ${inputDir}`);
    }
    // Extract EXIF data from all images
    const metadataPromises = imagePaths.map(p => (0, exif_reader_1.extractExifData)(p));
    const allMetadata = await Promise.all(metadataPromises);
    // Sort by date taken
    const sortedPhotos = (0, exif_reader_1.sortPhotosByDate)(allMetadata);
    // Select hero image
    const heroPhoto = await selectHeroImage(sortedPhotos);
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const processedImages = [];
    const total = sortedPhotos.length;
    // Process each image
    for (let i = 0; i < sortedPhotos.length; i++) {
        const photo = sortedPhotos[i];
        const index = i + 1; // 1-based indexing
        const baseName = `${tripName}-${index}`;
        if (onProgress) {
            onProgress(i + 1, total, photo.fileName);
        }
        let responsiveFiles;
        if (options.responsive) {
            // Generate responsive images (WebP + JPEG at multiple sizes)
            responsiveFiles = await processResponsiveImage(photo.filePath, outputDir, baseName, options);
        }
        else {
            // Legacy: single image processing
            const newFileName = (0, path_calculator_1.buildImageFileName)(tripName, index);
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
            await processResponsiveImage(heroPhoto.filePath, outputDir, heroBaseName, options);
        }
        else {
            const heroFileName = (0, path_calculator_1.buildHeroImageFileName)(tripName);
            const heroOutputPath = path.join(outputDir, heroFileName);
            await processImage(heroPhoto.filePath, heroOutputPath, options);
        }
    }
    return processedImages;
}
/**
 * Create backup of original images
 */
function backupOriginalImages(inputDir, backupDir) {
    const imagePaths = (0, exif_reader_1.scanDirectoryForImages)(inputDir);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    for (const imagePath of imagePaths) {
        const fileName = path.basename(imagePath);
        const backupPath = path.join(backupDir, fileName);
        fs.copyFileSync(imagePath, backupPath);
    }
}
//# sourceMappingURL=image-processor.js.map