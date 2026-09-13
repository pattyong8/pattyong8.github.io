import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  extractExifData,
  sortPhotosByDate,
  scanDirectoryForImages,
  isSupportedImage,
  PhotoMetadata,
} from '../utils/exif-reader';
import { processImage, ImageProcessingOptions } from '../image-processor';
import {
  TripManifest,
  TripPhoto,
  PhotoFlag,
  photoIdFromSeq,
  saveManifest,
  loadManifest,
  toRepoRelative,
} from '../manifest';

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']);
const DEFAULT_OPTS: ImageProcessingOptions = {
  maxWidth: 1500,
  quality: 85,
  format: 'jpeg',
  responsive: false,
  responsiveSizes: [],
};
const OVERSIZE_BYTES = 1.5 * 1024 * 1024;
const DUPE_FLAG_CAP = 15;

export function isCoverFileName(fileName: string): boolean {
  return /^cover\./i.test(fileName);
}

export function findCoverFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => isCoverFileName(f));
  return hit ? path.join(dir, hit) : null;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listVideos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(dir, f));
}

/**
 * Move loose images from photosDir into _incoming (except already-named web derivatives).
 * Idempotent: files already in _incoming stay put.
 */
export function stageIncoming(photosDir: string, tripPrefix: string): { incomingDir: string; moved: number } {
  const incomingDir = path.join(photosDir, '_incoming');
  ensureDir(incomingDir);

  const webName = new RegExp(`^${escapeRegex(tripPrefix)}-(\\d+|HP)\\.jpe?g$`, 'i');
  let moved = 0;

  for (const file of fs.readdirSync(photosDir)) {
    const full = path.join(photosDir, file);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    if (file === '.DS_Store') continue;
    if (webName.test(file)) continue;
    if (!isSupportedImage(full) && !VIDEO_EXTS.has(path.extname(file).toLowerCase())) continue;

    const dest = path.join(incomingDir, file);
    if (fs.existsSync(dest)) {
      // Keep existing incoming; remove duplicate loose copy if identical name
      if (full !== dest) fs.unlinkSync(full);
      continue;
    }
    fs.renameSync(full, dest);
    moved++;
  }

  return { incomingDir, moved };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flagDuplicates(sorted: PhotoMetadata[]): Map<string, PhotoFlag[]> {
  const flags = new Map<string, PhotoFlag[]>();
  const add = (p: string, f: PhotoFlag) => {
    const arr = flags.get(p) || [];
    if (!arr.includes(f)) arr.push(f);
    flags.set(p, arr);
  };

  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].hasExifDate) add(sorted[i].filePath, 'missing_exif');
    if (!sorted[i].hasExifDate) add(sorted[i].filePath, 'needs_placement');
  }

  let dupeCount = 0;
  for (let i = 1; i < sorted.length && dupeCount < DUPE_FLAG_CAP; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    const sa = fs.statSync(a.filePath).size;
    const sb = fs.statSync(b.filePath).size;
    const sizeClose = Math.abs(sa - sb) <= Math.max(2048, sa * 0.01);
    const dimClose =
      a.width &&
      b.width &&
      a.height &&
      b.height &&
      a.width === b.width &&
      a.height === b.height;
    const timeClose =
      a.dateTaken &&
      b.dateTaken &&
      Math.abs(a.dateTaken.getTime() - b.dateTaken.getTime()) < 2500;

    if ((sizeClose && dimClose) || (sizeClose && timeClose)) {
      add(b.filePath, 'possible_duplicate');
      dupeCount++;
    }
  }

  return flags;
}

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

export async function processPhotos(opts: ProcessPhotosOptions): Promise<TripManifest> {
  const { projectRoot, photosDir, tripPrefix, slug, section, year, title, manifestPath, dryRun } = opts;

  ensureDir(photosDir);
  const { incomingDir, moved } = stageIncoming(photosDir, tripPrefix);
  console.log(`Staged ${moved} file(s) into _incoming`);

  const videos = listVideos(incomingDir).map((v) => path.basename(v));
  const coverPath = findCoverFile(incomingDir) || findCoverFile(photosDir);
  if (!coverPath) {
    throw new Error(`No COVER/Cover image found in ${incomingDir} or ${photosDir}. Rename the cover/hero source to Cover.jpeg (or COVER.heic).`);
  }
  console.log(`Cover source: ${path.basename(coverPath)}`);

  const allImages = scanDirectoryForImages(incomingDir).filter((p) => !isCoverFileName(path.basename(p)));
  // Prefer a single file when both IMG_1234.JPG and IMG_1234.jpeg exist
  const dedupedByBase = new Map<string, string>();
  for (const imgPath of allImages) {
    const base = path.basename(imgPath).replace(/\.(jpe?g|png|webp|heic|heif|tiff|gif)$/i, '').toLowerCase();
    const existing = dedupedByBase.get(base);
    if (!existing) {
      dedupedByBase.set(base, imgPath);
      continue;
    }
    // Prefer .jpeg/.jpg lowercase export over .JPG if both exist
    const ext = path.extname(imgPath).toLowerCase();
    const existingExt = path.extname(existing).toLowerCase();
    if (ext === '.jpeg' && existingExt === '.jpg') dedupedByBase.set(base, imgPath);
  }
  const uniqueImages = [...dedupedByBase.values()];
  if (uniqueImages.length === 0) {
    throw new Error(`No body photos found in ${incomingDir}`);
  }
  if (uniqueImages.length < allImages.length) {
    console.log(`Skipped ${allImages.length - uniqueImages.length} same-name duplicate export(s) (.JPG/.jpeg pairs)`);
  }

  const metadata = await Promise.all(uniqueImages.map((p) => extractExifData(p)));
  const sorted = sortPhotosByDate(metadata);
  const flagMap = flagDuplicates(sorted);

  const photos: TripPhoto[] = [];
  const oversized: string[] = [];
  const needsPlacement: string[] = [];
  const possibleDuplicates: string[] = [];

  if (dryRun) {
    console.log(`Dry run: would process ${sorted.length} photos`);
  }

  for (let i = 0; i < sorted.length; i++) {
    const meta = sorted[i];
    const seq = i + 1;
    const outName = `${tripPrefix}-${seq}.jpeg`;
    const outPath = path.join(photosDir, outName);
    const flags = flagMap.get(meta.filePath) || [];

    if (!dryRun) {
      await processImage(meta.filePath, outPath, DEFAULT_OPTS);
    }

    const bytes = dryRun ? fs.statSync(meta.filePath).size : fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;
    if (bytes > OVERSIZE_BYTES) oversized.push(outName);

    if (flags.includes('needs_placement')) needsPlacement.push(outName);
    if (flags.includes('possible_duplicate')) possibleDuplicates.push(outName);

    photos.push({
      id: photoIdFromSeq(seq),
      seq,
      file: outName,
      sourceFile: path.basename(meta.filePath),
      exif: meta.dateTaken && meta.hasExifDate ? meta.dateTaken.toISOString() : null,
      flags,
      bytes,
    });
  }

  // Copy cover into photosDir as Cover.jpeg for stable reference (optimized later by crop cmds)
  const coverBasename = path.basename(coverPath);
  const coverDest = path.join(photosDir, coverBasename);
  if (!dryRun && path.dirname(coverPath) !== photosDir) {
    // keep cover only in _incoming; crops read from incoming
  }

  const htmlDir = path.dirname(manifestPath);
  ensureDir(htmlDir);

  const existing = fs.existsSync(manifestPath) ? loadManifest(manifestPath) : null;

  const manifest: TripManifest = {
    schemaVersion: 1,
    title: existing?.title || title,
    slug,
    section,
    year,
    dateRange: existing?.dateRange || '',
    startDate: existing?.startDate || '',
    location: existing?.location || '',
    people: existing?.people || '',
    introParagraph: existing?.introParagraph || '',
    tripPrefix,
    photosDir: toRepoRelative(projectRoot, photosDir),
    coverSource: path.relative(photosDir, coverPath).split(path.sep).join('/') || coverBasename,
    gallaryThumb: existing?.gallaryThumb,
    heroFile: existing?.heroFile || `${tripPrefix}-HP.jpeg`,
    photos,
    sections: existing?.sections?.length ? existing.sections : [],
    pages: existing?.pages?.length
      ? existing.pages
      : [{ file: `${slug}-1.html`, sectionIds: [] }],
    skippedVideos: videos,
    processReport: {
      processedAt: new Date().toISOString(),
      oversizedFiles: oversized,
      needsPlacement,
      possibleDuplicates,
    },
  };

  // Normalize coverSource to _incoming/Cover.jpeg style
  if (coverPath.startsWith(incomingDir)) {
    manifest.coverSource = `_incoming/${path.basename(coverPath)}`;
  } else {
    manifest.coverSource = path.basename(coverPath);
  }

  if (!dryRun) {
    saveManifest(manifestPath, manifest);
  }

  console.log(`Processed ${photos.length} photos → ${photosDir}`);
  console.log(`Manifest → ${manifestPath}`);
  if (needsPlacement.length) console.log(`needs_placement: ${needsPlacement.length}`);
  if (possibleDuplicates.length) console.log(`possible_duplicate (capped): ${possibleDuplicates.length}`);
  if (oversized.length) console.log(`oversized after optimize: ${oversized.length}`);
  if (videos.length) console.log(`skipped videos: ${videos.join(', ')}`);

  return manifest;
}

/** Quick perceptual-ish fingerprint for optional future use */
export async function tinyHash(filePath: string): Promise<string> {
  const buf = await sharp(filePath)
    .rotate()
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();
  return buf.toString('hex');
}
