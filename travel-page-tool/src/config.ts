import * as fs from 'fs';
import * as path from 'path';
import { ImageProcessingOptions } from './image-processor';

export interface TripConfigFile {
  tripName: string;
  category: string;
  year: string;
  title: string;
  dateRange?: string;
  location: string;
  withPeople: string;
  introParagraph: string;
  photosFolder: string;
  sectionDescriptions?: Record<string, string>;
  imageSettings?: Partial<ImageProcessingOptions>;
}

export interface ValidatedConfig extends TripConfigFile {
  photosFolder: string;
  imageSettings: ImageProcessingOptions;
}

const DEFAULT_IMAGE_SETTINGS: ImageProcessingOptions = {
  maxWidth: 1500,
  quality: 85,
  format: 'jpeg',
  responsive: true,
  responsiveSizes: [
    { name: 'small', width: 600 },
    { name: 'large', width: 1500 },
  ],
};

/**
 * Load configuration from a JSON file
 */
export function loadConfigFromFile(configPath: string): TripConfigFile {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  try {
    const config = JSON.parse(content) as TripConfigFile;
    return config;
  } catch (error) {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }
}

/**
 * Validate and normalize configuration
 */
export function validateConfig(config: TripConfigFile): ValidatedConfig {
  const errors: string[] = [];
  
  // Required fields
  if (!config.tripName) errors.push('tripName is required');
  if (!config.category) errors.push('category is required');
  if (!config.year) errors.push('year is required');
  if (!config.title) errors.push('title is required');
  if (!config.location) errors.push('location is required');
  if (!config.withPeople) errors.push('withPeople is required');
  if (!config.photosFolder) errors.push('photosFolder is required');
  
  // Validate photos folder exists
  if (config.photosFolder && !fs.existsSync(config.photosFolder)) {
    errors.push(`Photos folder does not exist: ${config.photosFolder}`);
  }
  
  // Validate category
  const validCategories = ['20s', 'College-J&S', 'College-F&S', 'HighSchool', 'MiddleSchool'];
  if (config.category && !validCategories.includes(config.category)) {
    errors.push(`Invalid category: ${config.category}. Must be one of: ${validCategories.join(', ')}`);
  }
  
  // Validate year format
  if (config.year && !/^\d{4}$/.test(config.year)) {
    errors.push(`Invalid year format: ${config.year}. Must be a 4-digit year.`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  // Merge with defaults
  return {
    ...config,
    introParagraph: config.introParagraph || '',
    dateRange: config.dateRange || '',
    sectionDescriptions: config.sectionDescriptions || {},
    imageSettings: {
      ...DEFAULT_IMAGE_SETTINGS,
      ...config.imageSettings,
    },
  };
}

/**
 * Save configuration to a JSON file
 */
export function saveConfigToFile(config: TripConfigFile, outputPath: string): void {
  const content = JSON.stringify(config, null, 2);
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * Get the project root directory (where the website files are)
 */
export function getProjectRoot(): string {
  // Check if we're in the travel-page-tool directory
  const cwd = process.cwd();
  
  if (cwd.endsWith('travel-page-tool')) {
    return path.dirname(cwd);
  }
  
  // Check if Travel-Pages-Sub exists in current directory
  if (fs.existsSync(path.join(cwd, 'Travel-Pages-Sub'))) {
    return cwd;
  }
  
  // Check parent directory
  const parent = path.dirname(cwd);
  if (fs.existsSync(path.join(parent, 'Travel-Pages-Sub'))) {
    return parent;
  }
  
  throw new Error('Could not find project root. Please run from the website directory or travel-page-tool directory.');
}

/**
 * Create a sample config file
 */
export function createSampleConfig(outputPath: string): void {
  const sampleConfig: TripConfigFile = {
    tripName: 'Paris-2024',
    category: '20s',
    year: '2024',
    title: 'Paris Olympics 2024',
    dateRange: 'Jul 20th-Aug 1st 2024',
    location: 'Paris, France',
    withPeople: 'Friends',
    introParagraph: 'My amazing trip to Paris for the 2024 Olympics...',
    photosFolder: './my-raw-photos',
    sectionDescriptions: {
      'day-1': 'Description for day 1...',
      'day-2': 'Description for day 2...',
    },
    imageSettings: {
      maxWidth: 1500,
      quality: 85,
      format: 'jpeg',
      responsive: true,
      responsiveSizes: [
        { name: 'small', width: 600 },
        { name: 'large', width: 1500 },
      ],
    },
  };
  
  saveConfigToFile(sampleConfig, outputPath);
}
