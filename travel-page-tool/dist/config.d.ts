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
/**
 * Load configuration from a JSON file
 */
export declare function loadConfigFromFile(configPath: string): TripConfigFile;
/**
 * Validate and normalize configuration
 */
export declare function validateConfig(config: TripConfigFile): ValidatedConfig;
/**
 * Save configuration to a JSON file
 */
export declare function saveConfigToFile(config: TripConfigFile, outputPath: string): void;
/**
 * Get the project root directory (where the website files are)
 */
export declare function getProjectRoot(): string;
/**
 * Create a sample config file
 */
export declare function createSampleConfig(outputPath: string): void;
//# sourceMappingURL=config.d.ts.map