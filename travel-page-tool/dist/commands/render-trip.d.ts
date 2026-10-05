import { TripManifest, TripSection } from '../manifest';
export declare function renderMapHtml(manifest: TripManifest, imagePrefixUrl: string): string;
export declare function renderIntroHtml(introParagraph: string): string;
export declare function renderSectionHtml(section: TripSection, manifest: TripManifest, imagePrefixUrl: string): string;
export declare function renderTripHtml(manifest: TripManifest): string;
export declare function upsertYearCard(projectRoot: string, manifest: TripManifest): void;
export declare function writeTripPage(projectRoot: string, manifestPath: string): string;
//# sourceMappingURL=render-trip.d.ts.map