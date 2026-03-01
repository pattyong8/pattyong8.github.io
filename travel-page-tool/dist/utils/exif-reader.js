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
exports.extractExifData = extractExifData;
exports.extractExifDataBatch = extractExifDataBatch;
exports.sortPhotosByDate = sortPhotosByDate;
exports.getSupportedExtensions = getSupportedExtensions;
exports.isSupportedImage = isSupportedImage;
exports.scanDirectoryForImages = scanDirectoryForImages;
const exifr_1 = __importDefault(require("exifr"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Extract EXIF metadata from a single photo
 */
async function extractExifData(filePath) {
    const fileName = path.basename(filePath);
    try {
        // Parse EXIF data
        const exif = await exifr_1.default.parse(filePath, {
            pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'ImageWidth', 'ImageHeight', 'Orientation', 'Make', 'Model'],
        });
        // Get date taken - try multiple EXIF fields
        let dateTaken = null;
        if (exif?.DateTimeOriginal) {
            dateTaken = new Date(exif.DateTimeOriginal);
        }
        else if (exif?.CreateDate) {
            dateTaken = new Date(exif.CreateDate);
        }
        else if (exif?.ModifyDate) {
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
    }
    catch (error) {
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
async function extractExifDataBatch(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
        const metadata = await extractExifData(filePath);
        results.push(metadata);
    }
    return results;
}
/**
 * Sort photos by date taken (chronologically)
 */
function sortPhotosByDate(photos) {
    return [...photos].sort((a, b) => {
        const dateA = a.dateTaken?.getTime() || 0;
        const dateB = b.dateTaken?.getTime() || 0;
        return dateA - dateB;
    });
}
/**
 * Get supported image extensions
 */
function getSupportedExtensions() {
    return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.heic', '.heif'];
}
/**
 * Check if a file is a supported image
 */
function isSupportedImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return getSupportedExtensions().includes(ext);
}
/**
 * Scan a directory for all supported images
 */
function scanDirectoryForImages(dirPath) {
    const images = [];
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
//# sourceMappingURL=exif-reader.js.map