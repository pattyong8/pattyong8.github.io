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
 * Format a date for display
 */
function formatDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Format a date for section heading (e.g., "Day 1" or "January 15, 2024")
 */
function formatSectionHeading(date: Date, dayNumber: number): string {
  return `Day ${dayNumber}`;
}

/**
 * Get the date string without time (for grouping)
 */
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate date range string for a trip
 */
function calculateDateRange(photos: ProcessedImage[]): string {
  if (photos.length === 0) return '';
  
  const dates = photos
    .map(p => p.metadata.dateTaken)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (dates.length === 0) return '';
  
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const startMonth = months[startDate.getMonth()];
  const startDay = startDate.getDate();
  const startYear = startDate.getFullYear();
  
  const endMonth = months[endDate.getMonth()];
  const endDay = endDate.getDate();
  const endYear = endDate.getFullYear();
  
  // Same day
  if (getDateKey(startDate) === getDateKey(endDate)) {
    return `${startMonth} ${startDay}, ${startYear}`;
  }
  
  // Same month and year
  if (startDate.getMonth() === endDate.getMonth() && startYear === endYear) {
    return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
  }
  
  // Same year
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  
  // Different years
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Organize photos into sections by date
 */
export function organizeByDate(photos: ProcessedImage[]): SectionedPhotos {
  if (photos.length === 0) {
    return { sections: [], photos: [], dateRange: '' };
  }

  // Group photos by date
  const dateGroups = new Map<string, ProcessedImage[]>();
  
  for (const photo of photos) {
    const date = photo.metadata.dateTaken;
    if (date) {
      const dateKey = getDateKey(date);
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(photo);
    }
  }

  // Sort date keys chronologically
  const sortedDateKeys = Array.from(dateGroups.keys()).sort();

  // Create sections
  const sections: Section[] = [];
  let dayNumber = 1;

  for (const dateKey of sortedDateKeys) {
    const groupPhotos = dateGroups.get(dateKey)!;
    
    // Get the first photo's date for the section
    const firstPhotoDate = groupPhotos[0].metadata.dateTaken!;
    
    // Find start and end indices
    const startIndex = groupPhotos[0].index;
    const endIndex = groupPhotos[groupPhotos.length - 1].index;

    const section: Section = {
      id: `day-${dayNumber}`,
      heading: formatSectionHeading(firstPhotoDate, dayNumber),
      description: '', // Will be filled in by user
      date: firstPhotoDate,
      dateString: formatDate(firstPhotoDate),
      startIndex,
      endIndex,
      photoCount: groupPhotos.length,
    };

    sections.push(section);
    dayNumber++;
  }

  const dateRange = calculateDateRange(photos);

  return {
    sections,
    photos,
    dateRange,
  };
}

/**
 * Merge consecutive sections (if user wants fewer sections)
 */
export function mergeSections(sections: Section[], indicesToMerge: number[]): Section[] {
  if (indicesToMerge.length < 2) return sections;
  
  // Sort indices
  const sorted = [...indicesToMerge].sort((a, b) => a - b);
  const firstIndex = sorted[0];
  const lastIndex = sorted[sorted.length - 1];
  
  // Get sections to merge
  const sectionsToMerge = sorted.map(i => sections[i]);
  
  // Create merged section
  const mergedSection: Section = {
    id: sectionsToMerge[0].id,
    heading: sectionsToMerge[0].heading,
    description: sectionsToMerge.map(s => s.description).filter(d => d).join('\n\n'),
    date: sectionsToMerge[0].date,
    dateString: `${sectionsToMerge[0].dateString} - ${sectionsToMerge[sectionsToMerge.length - 1].dateString}`,
    startIndex: sectionsToMerge[0].startIndex,
    endIndex: sectionsToMerge[sectionsToMerge.length - 1].endIndex,
    photoCount: sectionsToMerge.reduce((sum, s) => sum + s.photoCount, 0),
  };
  
  // Build new sections array
  const newSections: Section[] = [];
  for (let i = 0; i < sections.length; i++) {
    if (i === firstIndex) {
      newSections.push(mergedSection);
    } else if (i > firstIndex && i <= lastIndex) {
      // Skip merged sections
      continue;
    } else {
      newSections.push(sections[i]);
    }
  }
  
  return newSections;
}

/**
 * Split a section at a specific photo index
 */
export function splitSection(sections: Section[], sectionIndex: number, splitAtPhotoIndex: number): Section[] {
  const section = sections[sectionIndex];
  
  if (splitAtPhotoIndex <= section.startIndex || splitAtPhotoIndex > section.endIndex) {
    return sections; // Invalid split point
  }
  
  const section1: Section = {
    ...section,
    id: `${section.id}-a`,
    endIndex: splitAtPhotoIndex - 1,
    photoCount: splitAtPhotoIndex - section.startIndex,
  };
  
  const section2: Section = {
    ...section,
    id: `${section.id}-b`,
    heading: `${section.heading} (continued)`,
    startIndex: splitAtPhotoIndex,
    photoCount: section.endIndex - splitAtPhotoIndex + 1,
  };
  
  const newSections = [...sections];
  newSections.splice(sectionIndex, 1, section1, section2);
  
  return newSections;
}

/**
 * Update section descriptions
 */
export function updateSectionDescriptions(sections: Section[], descriptions: Map<string, string>): Section[] {
  return sections.map(section => ({
    ...section,
    description: descriptions.get(section.id) || section.description,
  }));
}

/**
 * Get summary of sections for display
 */
export function getSectionsSummary(sections: Section[]): string {
  if (sections.length === 0) return 'No sections';
  
  const summary = sections.map(s => `${s.heading} (${s.photoCount} photos)`).join(', ');
  return `Found ${sections.length} section(s): ${summary}`;
}
