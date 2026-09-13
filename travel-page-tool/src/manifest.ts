import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

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

export interface TripSection {
  id: string;
  title: string;
  photoIds: string[];
  prose: string;
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

export function defaultManifestPath(htmlDir: string): string {
  return path.join(htmlDir, 'trip.yaml');
}

export function loadManifest(manifestPath: string): TripManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const data = yaml.load(raw) as TripManifest;
  if (!data || data.schemaVersion !== 1) {
    throw new Error(`Invalid or unsupported manifest: ${manifestPath}`);
  }
  return data;
}

export function saveManifest(manifestPath: string, manifest: TripManifest): void {
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const dumped = yaml.dump(manifest, {
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  });
  fs.writeFileSync(manifestPath, dumped, 'utf-8');
}

export function photoIdFromSeq(seq: number): string {
  return `p${String(seq).padStart(3, '0')}`;
}

export function resolveRepoPath(projectRoot: string, maybeRelative: string): string {
  if (path.isAbsolute(maybeRelative)) return maybeRelative;
  return path.join(projectRoot, maybeRelative);
}

export function toRepoRelative(projectRoot: string, absolutePath: string): string {
  const rel = path.relative(projectRoot, absolutePath);
  return rel.split(path.sep).join('/');
}
