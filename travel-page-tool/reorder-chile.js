#!/usr/bin/env node
/**
 * Reorder Mar-Chile-2026 photos per user instructions. No overwrite-in-place; uses temp copy.
 */
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const FOLDER = path.join(REPO_ROOT, 'assets/images/Travel-Pages-Images/20s/2026/Mar-Chile-2026');
const TEMP = path.join(FOLDER, '.reorder-temp');
const PREFIX = 'Mar-Chile-2026';

function moveBehind(order, item, afterItem) {
  const o = order.filter((x) => x !== item);
  const idx = o.indexOf(afterItem);
  o.splice(idx + 1, 0, item);
  return o;
}

function moveBlockBehind(order, items, afterItem) {
  let o = order.filter((x) => !items.includes(x));
  const idx = o.indexOf(afterItem);
  o.splice(idx + 1, 0, ...items);
  return o;
}

function moveBefore(order, items, beforeItem) {
  let o = order.filter((x) => !items.includes(x));
  const idx = o.indexOf(beforeItem);
  o.splice(idx, 0, ...items);
  return o;
}

let order = Array.from({ length: 180 }, (_, i) => i + 1);

order = moveBehind(order, 58, 19);
order = moveBehind(order, 80, 19);
order = moveBlockBehind(order, [61, 62, 63, 64], 39); // block 61,62,63,64 after 39
order = moveBefore(order, [67, 68, 69, 70, 71], 40);
order = moveBlockBehind(order, Array.from({ length: 19 }, (_, i) => 51 + i), 41); // 51-69 behind 41
order = moveBefore(order, [41, 42], 64); // 41,42 before 64

// order[i] = current file number that should be at new position i+1
const targetOrder = order;

if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

// Copy all 180 + HP to temp (same names)
for (let n = 1; n <= 180; n++) {
  const src = path.join(FOLDER, `${PREFIX}-${n}.jpeg`);
  const dest = path.join(TEMP, `${PREFIX}-${n}.jpeg`);
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}
const hpSrc = path.join(FOLDER, `${PREFIX}-HP.jpeg`);
const hpDest = path.join(TEMP, `${PREFIX}-HP.jpeg`);
if (fs.existsSync(hpSrc)) fs.copyFileSync(hpSrc, hpDest);

// Write from temp to main with new numbering
for (let i = 0; i < 180; i++) {
  const currentNum = targetOrder[i];
  const src = path.join(TEMP, `${PREFIX}-${currentNum}.jpeg`);
  const dest = path.join(FOLDER, `${PREFIX}-${i + 1}.jpeg`);
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}
if (fs.existsSync(hpDest)) fs.copyFileSync(hpDest, hpSrc);

// Remove temp
for (let n = 1; n <= 180; n++) fs.unlinkSync(path.join(TEMP, `${PREFIX}-${n}.jpeg`));
fs.unlinkSync(hpDest);
fs.rmdirSync(TEMP);

console.log('Reorder complete. New order: 58,80 after 19; 61-64 after 39; 67-71 before 40; 51-69 after 41; 41,42 before 64.');
console.log('HP unchanged.');
console.log('Total: 180 numbered + 1 HP.');
console.log('Temp folder removed.');
process.exit(0);
