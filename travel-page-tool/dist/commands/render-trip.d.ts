import { TripManifest, TripSection } from '../manifest';
/**
 * Chile reading flow for leftover 1–2 photos:
 * float photos left, put ALL section paragraphs inside the wrap before clear:both
 * so short first paragraphs don't leave a blank column beside tall leftovers.
 */
export declare function renderSectionHtml(section: TripSection, manifest: TripManifest, imagePrefixUrl: string): string;
export declare function renderTripHtml(manifest: TripManifest): string;
export declare function upsertYearCard(projectRoot: string, manifest: TripManifest): void;
export declare function writeTripPage(projectRoot: string, manifestPath: string): string;
//# sourceMappingURL=render-trip.d.ts.map