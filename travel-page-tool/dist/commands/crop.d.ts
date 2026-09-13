import { TripManifest } from '../manifest';
export declare const THUMB_WIDTH = 1084;
export declare const THUMB_HEIGHT = 930;
export declare const HERO_WIDTH = 1500;
export declare const HERO_HEIGHT = 838;
export declare function resolveCoverPath(projectRoot: string, manifest: TripManifest): string;
export declare function cropCover(projectRoot: string, manifestPath: string, options?: {
    monthLabel?: string;
    displayName?: string;
}): Promise<string>;
export declare function cropHero(projectRoot: string, manifestPath: string, options?: {
    position?: string;
}): Promise<string>;
//# sourceMappingURL=crop.d.ts.map