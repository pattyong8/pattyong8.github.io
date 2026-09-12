#!/usr/bin/env node
/**
 * Crop and optimize year-page thumbnail to match other thumbs (1084x930).
 * Uses fit: 'cover' and position: 'attention' to focus on people/subject.
 */
const path = require('path');
const sharp = require('sharp');

const REPO_ROOT = path.resolve(__dirname, '..');
const THUMB_PATH = path.join(REPO_ROOT, 'assets/images/gallary/20s/2026/Mar-Chile-2026.jpeg');
const TARGET_WIDTH = 1084;
const TARGET_HEIGHT = 930;

async function main() {
  await sharp(THUMB_PATH)
    .rotate()
    .withMetadata() // preserve date/time EXIF
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: 'cover',
      position: 'attention', // prioritize subject/people
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(THUMB_PATH + '.tmp');
  const fs = require('fs');
  fs.renameSync(THUMB_PATH + '.tmp', THUMB_PATH);
  console.log('Thumbnail cropped and optimized:', THUMB_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
