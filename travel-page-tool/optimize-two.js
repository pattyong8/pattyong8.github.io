#!/usr/bin/env node
const path = require('path');
const sharp = require('sharp');
const REPO = path.resolve(__dirname, '..');
const DIR = path.join(REPO, 'assets/images/Travel-Pages-Images/20s/2026/Mar-Chile-2026');
const PREFIX = 'Mar-Chile-2026';

async function optimize(n) {
  const src = path.join(DIR, `${PREFIX}-${n}.jpeg`);
  const tmp = path.join(DIR, `${PREFIX}-${n}.jpeg.tmp`);
  await sharp(src)
    .rotate()
    .withMetadata()
    .resize({ width: 1500, withoutEnlargement: true, fit: 'inside' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(tmp);
  require('fs').renameSync(tmp, src);
  console.log('Optimized', n);
}

(async () => {
  await optimize(20);
  await optimize(21);
  console.log('Done. EXIF preserved.');
})();
