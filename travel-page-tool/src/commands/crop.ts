import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  TripManifest,
  loadManifest,
  saveManifest,
  resolveRepoPath,
} from '../manifest';

export const THUMB_WIDTH = 1084;
export const THUMB_HEIGHT = 930;
export const HERO_WIDTH = 1500;
export const HERO_HEIGHT = 838;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function resolveCoverPath(projectRoot: string, manifest: TripManifest): string {
  const photosDir = resolveRepoPath(projectRoot, manifest.photosDir);
  const candidate = path.join(photosDir, manifest.coverSource);
  if (fs.existsSync(candidate)) return candidate;
  // Try basename in _incoming
  const incoming = path.join(photosDir, '_incoming', path.basename(manifest.coverSource));
  if (fs.existsSync(incoming)) return incoming;
  throw new Error(`Cover source not found: ${candidate}`);
}

export async function cropCover(
  projectRoot: string,
  manifestPath: string,
  options?: { monthLabel?: string; displayName?: string }
): Promise<string> {
  const manifest = loadManifest(manifestPath);
  const source = resolveCoverPath(projectRoot, manifest);
  const month = options?.monthLabel || guessMonth(manifest);
  const display = options?.displayName || slugToDisplay(manifest.slug);
  const thumbName = `${month}-${display}-${manifest.year}.jpeg`.replace(/\s+/g, '-');
  const gallaryDir = path.join(
    projectRoot,
    'assets/images/gallary',
    manifest.section,
    manifest.year
  );
  ensureDir(gallaryDir);
  const outPath = path.join(gallaryDir, thumbName);

  const tmp = outPath + '.tmp';
  await sharp(source)
    .rotate()
    .withMetadata()
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, outPath);

  manifest.gallaryThumb = path
    .relative(projectRoot, outPath)
    .split(path.sep)
    .join('/');
  saveManifest(manifestPath, manifest);
  console.log(`Cover thumb → ${outPath}`);
  return outPath;
}

export async function cropHero(
  projectRoot: string,
  manifestPath: string,
  options?: { position?: string }
): Promise<string> {
  const manifest = loadManifest(manifestPath);
  const source = resolveCoverPath(projectRoot, manifest);
  const photosDir = resolveRepoPath(projectRoot, manifest.photosDir);
  const heroName = manifest.heroFile || `${manifest.tripPrefix}-HP.jpeg`;
  const outPath = path.join(photosDir, heroName);
  // Default centre: attention often pulls tall covers toward textured foreground and chops heads.
  const position = options?.position || 'centre';

  const tmp = outPath + '.tmp';
  await sharp(source)
    .rotate()
    .withMetadata()
    .resize(HERO_WIDTH, HERO_HEIGHT, { fit: 'cover', position })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, outPath);

  manifest.heroFile = heroName;
  saveManifest(manifestPath, manifest);
  console.log(`Hero → ${outPath} (position=${position})`);
  return outPath;
}

function guessMonth(manifest: TripManifest): string {
  if (manifest.startDate && /^\d{4}-\d{2}/.test(manifest.startDate)) {
    const m = Number(manifest.startDate.slice(5, 7));
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || 'Jan';
  }
  const fromSlug = manifest.slug.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (fromSlug) return fromSlug[1].slice(0, 1).toUpperCase() + fromSlug[1].slice(1, 3).toLowerCase();
  return 'Mar';
}

function slugToDisplay(slug: string): string {
  return slug
    .replace(/^\w{3}-/, '')
    .replace(/-\d{4}$/, '')
    .replace(/&/g, 'and')
    .replace(/-/g, '-');
}
