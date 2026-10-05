export type PhotoFlag = 'missing_exif' | 'possible_duplicate' | 'needs_placement';
export interface TripPhoto {
    id: string;
    seq: number;
    file: string;
    sourceFile?: string;
    exif?: string | null;
    flags: PhotoFlag[];
    bytes?: number;
}
export interface TripBlock {
    photoIds: string[];
    prose: string;
}
export interface TripSection {
    id: string;
    title: string;
    photoIds: string[];
    prose: string;
    /** Photo groups with prose after each group, so a day can read as photos then words then photos. */
    blocks?: TripBlock[];
}
export interface TripPage {
    file: string;
    sectionIds: string[];
}
export interface TripManifest {
    schemaVersion: 1;
    title: string;
    slug: string;
    section: string;
    year: string;
    dateRange: string;
    startDate: string;
    location: string;
    people: string;
    introParagraph: string;
    /** Optional clickable location map, same pattern as older trip pages. */
    map?: {
        url: string;
        image: string;
        title?: string;
        caption?: string;
    };
    /** Image filename prefix, e.g. Italy-Malta-2026 */
    tripPrefix: string;
    /** Absolute or repo-relative path to optimized photo directory */
    photosDir: string;
    /** Cover/hero source basename in photosDir or _incoming, e.g. Cover.jpeg */
    coverSource: string;
    thumbSource?: string;
    heroSource?: string;
    gallaryThumb?: string;
    heroFile?: string;
    photos: TripPhoto[];
    sections: TripSection[];
    pages: TripPage[];
    skippedVideos?: string[];
    /** Query param to bust browser cache after renumbers/swaps */
    cacheBust?: string;
    processReport?: {
        processedAt: string;
        oversizedFiles: string[];
        needsPlacement: string[];
        possibleDuplicates: string[];
    };
}
export declare function defaultManifestPath(htmlDir: string): string;
export declare function loadManifest(manifestPath: string): TripManifest;
export declare function saveManifest(manifestPath: string, manifest: TripManifest): void;
export declare function photoIdFromSeq(seq: number): string;
export declare function resolveRepoPath(projectRoot: string, maybeRelative: string): string;
export declare function toRepoRelative(projectRoot: string, absolutePath: string): string;
//# sourceMappingURL=manifest.d.ts.map