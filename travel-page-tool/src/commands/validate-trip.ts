import * as fs from 'fs';
import * as path from 'path';
import {
  TripManifest,
  loadManifest,
  resolveRepoPath,
} from '../manifest';
import {
  hasLeftoverBlankColumn,
  LEFTOVER_BLANK_COLUMN_MSG,
  hasYearNavTripLinks,
  YEAR_NAV_TRIP_LINK_MSG,
  yearPageGalleryRegion,
} from '../layout-guards';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTrip(projectRoot: string, manifestPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const manifest = loadManifest(manifestPath);

  const photosDir = resolveRepoPath(projectRoot, manifest.photosDir);
  if (!fs.existsSync(photosDir)) {
    errors.push(`photosDir missing: ${photosDir}`);
  }

  const cover = path.join(photosDir, manifest.coverSource);
  const coverAlt = path.join(photosDir, '_incoming', path.basename(manifest.coverSource));
  if (!fs.existsSync(cover) && !fs.existsSync(coverAlt)) {
    errors.push(`coverSource missing: ${manifest.coverSource}`);
  }

  if (manifest.heroFile) {
    const hero = path.join(photosDir, manifest.heroFile);
    if (!fs.existsSync(hero)) warnings.push(`Hero not cropped yet: ${manifest.heroFile}`);
  }

  if (manifest.gallaryThumb) {
    const thumb = resolveRepoPath(projectRoot, manifest.gallaryThumb);
    if (!fs.existsSync(thumb)) warnings.push(`Gallary thumb missing: ${manifest.gallaryThumb}`);
  } else {
    warnings.push('gallaryThumb not set (run crop-cover)');
  }

  const seqs = new Set<number>();
  for (const photo of manifest.photos) {
    if (seqs.has(photo.seq)) errors.push(`Duplicate seq: ${photo.seq}`);
    seqs.add(photo.seq);
    const fp = path.join(photosDir, photo.file);
    if (!fs.existsSync(fp)) {
      errors.push(`Missing photo file: ${photo.file}`);
    } else {
      const bytes = fs.statSync(fp).size;
      if (bytes > 1.5 * 1024 * 1024) {
        warnings.push(`Oversized (>1.5MB): ${photo.file} (${Math.round(bytes / 1024)}KB)`);
      }
    }
  }

  // Contiguous seq 1..n
  for (let i = 1; i <= manifest.photos.length; i++) {
    if (!seqs.has(i)) errors.push(`Missing seq ${i} in contiguous range`);
  }

  for (const section of manifest.sections) {
    const ids = [
      ...section.photoIds,
      ...(section.blocks || []).flatMap((block) => block.photoIds),
    ];
    for (const id of ids) {
      if (!manifest.photos.some((p) => p.id === id)) {
        errors.push(`Section "${section.title}" references unknown photo id ${id}`);
      }
    }
  }

  const htmlPath = path.join(
    projectRoot,
    'Travel-Pages-Sub',
    manifest.section,
    manifest.year,
    manifest.slug,
    manifest.pages[0]?.file || `${manifest.slug}-1.html`
  );
  if (!fs.existsSync(htmlPath)) {
    warnings.push(`Trip HTML not rendered yet: ${htmlPath}`);
  } else {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    if (!html.includes('comments-wrap')) errors.push('Trip HTML missing comments-wrap');
    if (!html.includes('</article>')) errors.push('Trip HTML missing </article> (nesting risk)');
    if (hasLeftoverBlankColumn(html)) {
      errors.push(LEFTOVER_BLANK_COLUMN_MSG);
    }
  }

  const yearPage = path.join(
    projectRoot,
    'Travel-Pages',
    manifest.section,
    `${manifest.section}-${manifest.year}.html`
  );
  if (fs.existsSync(yearPage)) {
    const y = fs.readFileSync(yearPage, 'utf-8');
    if (hasYearNavTripLinks(y)) {
      errors.push(YEAR_NAV_TRIP_LINK_MSG);
    }
    const gallery = yearPageGalleryRegion(y);
    if (!gallery.includes(`${manifest.slug}-1.html`)) {
      warnings.push('Year page does not link to this trip yet');
    }
  } else {
    errors.push(`Year page missing: ${yearPage}`);
  }

  const incoming = path.join(photosDir, '_incoming');
  if (fs.existsSync(incoming)) {
    let incomingBytes = 0;
    for (const f of fs.readdirSync(incoming)) {
      const st = fs.statSync(path.join(incoming, f));
      if (st.isFile()) incomingBytes += st.size;
    }
    if (incomingBytes > 50 * 1024 * 1024) {
      warnings.push(
        `_incoming is ${Math.round(incomingBytes / 1024 / 1024)}MB — prefer not committing raw dumps to git`
      );
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function printValidation(result: ValidationResult): void {
  for (const e of result.errors) console.error(`ERROR: ${e}`);
  for (const w of result.warnings) console.warn(`WARN: ${w}`);
  if (result.ok) console.log('Validation OK' + (result.warnings.length ? ' (with warnings)' : ''));
  else console.log('Validation FAILED');
}
