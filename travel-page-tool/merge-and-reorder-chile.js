#!/usr/bin/env node
/**
 * Merge new photos into Mar-Chile-2026, sort all by date (EXIF or proxy for existing),
 * renumber 1..N, optimize, and output back to the folder.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const exifr = require('exifr');

const REPO_ROOT = path.resolve(__dirname, '..');
const FOLDER = path.join(REPO_ROOT, 'assets/images/Travel-Pages-Images/20s/2026/Mar-Chile-2026');
const TEMP = path.join(FOLDER, '.merge-temp');
const TRIP_START = new Date('2026-03-07T00:00:00');
const TRIP_END = new Date('2026-03-14T23:59:59');

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.heic', '.heif'];

async function getDate(filePath) {
  const name = path.basename(filePath);
  const match = name.match(/^Mar-Chile-2026-(\d+)\.jpeg$/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 200) {
      const frac = (n - 1) / 166;
      return new Date(TRIP_START.getTime() + frac * (TRIP_END - TRIP_START));
    }
  }
  if (name === 'Mar-Chile-2026-HP.jpeg') {
    return new Date(TRIP_START.getTime() + 0.5 * (TRIP_END - TRIP_START));
  }
  try {
    const exif = await exifr.parse(filePath, { pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'] });
    if (exif?.DateTimeOriginal) return new Date(exif.DateTimeOriginal);
    if (exif?.CreateDate) return new Date(exif.CreateDate);
    if (exif?.ModifyDate) return new Date(exif.ModifyDate);
  } catch (_) {}
  const stat = fs.statSync(filePath);
  return stat.mtime;
}

function isImage(p) {
  return EXTENSIONS.includes(path.extname(p).toLowerCase());
}

async function processImage(inputPath, outputPath) {
  await sharp(inputPath)
    .rotate()
    .withMetadata() // preserve date/time EXIF
    .resize({ width: 1500, withoutEnlargement: true, fit: 'inside' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outputPath);
}

async function main() {
  const files = fs.readdirSync(FOLDER)
    .filter((f) => isImage(f) && !f.startsWith('.'))
    .map((f) => path.join(FOLDER, f));

  const withDates = await Promise.all(
    files.map(async (fp) => ({ path: fp, date: await getDate(fp) }))
  );
  withDates.sort((a, b) => a.date - b.date);

  const heroPath = withDates[Math.floor(withDates.length * 0.1)].path;
  const rest = withDates.filter((x) => x.path !== heroPath);

  if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

  for (let i = 0; i < rest.length; i++) {
    const out = path.join(TEMP, `Mar-Chile-2026-${i + 1}.jpeg`);
    await processImage(rest[i].path, out);
  }
  await processImage(heroPath, path.join(TEMP, 'Mar-Chile-2026-HP.jpeg'));

  for (const f of files) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
  for (const name of fs.readdirSync(TEMP)) {
    fs.renameSync(path.join(TEMP, name), path.join(FOLDER, name));
  }
  fs.rmdirSync(TEMP);
  console.log('Merged, sorted, and optimized. Total photos:', rest.length);
  console.log('Hero: Mar-Chile-2026-HP.jpeg');
  console.log('Numbered: Mar-Chile-2026-1.jpeg .. Mar-Chile-2026-' + rest.length + '.jpeg');
}

main().catch((e) => { console.error(e); process.exit(1); });
