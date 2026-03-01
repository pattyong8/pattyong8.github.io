import * as fs from 'fs';
import * as path from 'path';
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

const DEFAULT_OPTIONS: ValidationOptions = {
  checkExifData: true,
  checkDuplicates: true,
  checkPermissions: true,
  minPhotos: 1,
  maxPhotos: 500,
};

/**
 * Validate a photos folder
 */
export function validatePhotosFolder(folderPath: string, options: Partial<ValidationOptions> = {}): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check folder exists
  if (!fs.existsSync(folderPath)) {
    errors.push(`Folder does not exist: ${folderPath}`);
    return { isValid: false, errors, warnings };
  }
  
  // Check folder is readable
  if (opts.checkPermissions) {
    try {
      fs.accessSync(folderPath, fs.constants.R_OK);
    } catch {
      errors.push(`Cannot read folder: ${folderPath}`);
      return { isValid: false, errors, warnings };
    }
  }
  
  // Check for images
  const files = fs.readdirSync(folderPath);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.heic', '.heif'];
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return imageExtensions.includes(ext);
  });
  
  if (imageFiles.length === 0) {
    errors.push(`No images found in folder: ${folderPath}`);
    return { isValid: false, errors, warnings };
  }
  
  if (imageFiles.length < opts.minPhotos) {
    errors.push(`Too few photos: found ${imageFiles.length}, minimum is ${opts.minPhotos}`);
  }
  
  if (imageFiles.length > opts.maxPhotos) {
    warnings.push(`Large number of photos: ${imageFiles.length}. Consider splitting into multiple trips.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate photo metadata
 */
export function validatePhotoMetadata(photos: PhotoMetadata[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for missing EXIF dates
  const photosWithoutDate = photos.filter(p => !p.dateTaken);
  if (photosWithoutDate.length > 0) {
    warnings.push(`${photosWithoutDate.length} photo(s) missing EXIF date - using file modification time instead`);
  }
  
  // Check for duplicate timestamps
  const timestamps = new Map<string, string[]>();
  for (const photo of photos) {
    if (photo.dateTaken) {
      const key = photo.dateTaken.toISOString();
      if (!timestamps.has(key)) {
        timestamps.set(key, []);
      }
      timestamps.get(key)!.push(photo.fileName);
    }
  }
  
  for (const [timestamp, files] of timestamps) {
    if (files.length > 1) {
      warnings.push(`Duplicate timestamp ${timestamp}: ${files.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate output directory
 */
export function validateOutputDirectory(dirPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if directory exists
  if (fs.existsSync(dirPath)) {
    // Check if it's writable
    try {
      fs.accessSync(dirPath, fs.constants.W_OK);
    } catch {
      errors.push(`Cannot write to directory: ${dirPath}`);
    }
    
    // Check if it's not empty
    const files = fs.readdirSync(dirPath);
    if (files.length > 0) {
      warnings.push(`Output directory is not empty: ${dirPath}. Existing files may be overwritten.`);
    }
  } else {
    // Check if parent directory is writable
    const parentDir = path.dirname(dirPath);
    if (fs.existsSync(parentDir)) {
      try {
        fs.accessSync(parentDir, fs.constants.W_OK);
      } catch {
        errors.push(`Cannot create directory in: ${parentDir}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate trip configuration
 */
export function validateTripConfig(config: {
  tripName: string;
  category: string;
  year: string;
  title: string;
  location: string;
  withPeople: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!config.tripName || config.tripName.trim() === '') {
    errors.push('Trip name is required');
  } else if (!/^[a-zA-Z0-9-]+$/.test(config.tripName)) {
    errors.push('Trip name must only contain letters, numbers, and hyphens');
  }
  
  if (!config.category) {
    errors.push('Category is required');
  } else {
    const validCategories = ['20s', 'College-J&S', 'College-F&S', 'HighSchool', 'MiddleSchool'];
    if (!validCategories.includes(config.category)) {
      errors.push(`Invalid category: ${config.category}. Must be one of: ${validCategories.join(', ')}`);
    }
  }
  
  if (!config.year) {
    errors.push('Year is required');
  } else if (!/^\d{4}$/.test(config.year)) {
    errors.push('Year must be a 4-digit number');
  } else {
    const yearNum = parseInt(config.year);
    const currentYear = new Date().getFullYear();
    if (yearNum < 2000 || yearNum > currentYear + 1) {
      warnings.push(`Year ${config.year} seems unusual`);
    }
  }
  
  if (!config.title || config.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!config.location || config.location.trim() === '') {
    errors.push('Location is required');
  }
  
  if (!config.withPeople || config.withPeople.trim() === '') {
    warnings.push('No "with" field provided - will be empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print validation results
 */
export function printValidationResults(result: ValidationResult, label: string = 'Validation'): void {
  if (result.isValid && result.warnings.length === 0) {
    console.log(`✓ ${label}: All checks passed`);
    return;
  }
  
  if (result.errors.length > 0) {
    console.log(`✗ ${label}: ${result.errors.length} error(s)`);
    for (const error of result.errors) {
      console.log(`  - Error: ${error}`);
    }
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠ ${label}: ${result.warnings.length} warning(s)`);
    for (const warning of result.warnings) {
      console.log(`  - Warning: ${warning}`);
    }
  }
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
