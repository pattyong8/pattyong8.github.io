import { ProcessedImage } from './image-processor';
export interface Section {
    id: string;
    heading: string;
    description: string;
    date: Date;
    dateString: string;
    startIndex: number;
    endIndex: number;
    photoCount: number;
}
export interface SectionedPhotos {
    sections: Section[];
    photos: ProcessedImage[];
    dateRange: string;
}
/**
 * Organize photos into sections by date
 */
export declare function organizeByDate(photos: ProcessedImage[]): SectionedPhotos;
/**
 * Merge consecutive sections (if user wants fewer sections)
 */
export declare function mergeSections(sections: Section[], indicesToMerge: number[]): Section[];
/**
 * Split a section at a specific photo index
 */
export declare function splitSection(sections: Section[], sectionIndex: number, splitAtPhotoIndex: number): Section[];
/**
 * Update section descriptions
 */
export declare function updateSectionDescriptions(sections: Section[], descriptions: Map<string, string>): Section[];
/**
 * Get summary of sections for display
 */
export declare function getSectionsSummary(sections: Section[]): string;
//# sourceMappingURL=section-organizer.d.ts.map