import { Section } from './section-organizer';
import { ProcessedImage } from './image-processor';
export interface TripConfig {
    tripName: string;
    category: string;
    year: string;
    title: string;
    dateRange: string;
    location: string;
    withPeople: string;
    introParagraph: string;
    responsive?: boolean;
}
export interface HtmlGeneratorOptions {
    photosPerPage: number;
    responsive: boolean;
}
/**
 * Generate a complete HTML page
 */
export declare function generateHtmlPage(config: TripConfig, sections: Section[], pageNumber?: number, totalPages?: number, options?: HtmlGeneratorOptions): string;
/**
 * Split sections across multiple pages if needed
 */
export declare function splitSectionsForPages(sections: Section[], photos: ProcessedImage[], options?: HtmlGeneratorOptions): Section[][];
/**
 * Generate all HTML pages for a trip
 */
export declare function generateAllPages(config: TripConfig, sections: Section[], photos: ProcessedImage[], outputDir: string, options?: HtmlGeneratorOptions): string[];
//# sourceMappingURL=html-generator.d.ts.map