import { TripManifest } from '../manifest';
export declare function isCoverFileName(fileName: string): boolean;
export declare function findCoverFile(dir: string): string | null;
/**
 * Move loose images from photosDir into _incoming (except already-named web derivatives).
 * Idempotent: files already in _incoming stay put.
 */
export declare function stageIncoming(photosDir: string, tripPrefix: string): {
    incomingDir: string;
    moved: number;
};
export interface ProcessPhotosOptions {
    projectRoot: string;
    photosDir: string;
    tripPrefix: string;
    slug: string;
    section: string;
    year: string;
    title: string;
    /** Where to write trip.yaml */
    manifestPath: string;
    dryRun?: boolean;
}
export declare function processPhotos(opts: ProcessPhotosOptions): Promise<TripManifest>;
/** Quick perceptual-ish fingerprint for optional future use */
export declare function tinyHash(filePath: string): Promise<string>;
//# sourceMappingURL=process-photos.d.ts.map