#!/usr/bin/env node
/**
 * Undo photo reordering: restore Mar-Chile-2026 to canonical order 1, 2, ..., 180.
 * Uses same temp-copy strategy; applies inverse of the current permutation.
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

// Same permutation as reorder-chile.js (current state)
let order = Array.from({ length: 180 }, (_, i) => i + 1);
order = moveBehind(order, 58, 19);
order = moveBehind(order, 80, 19);
order = moveBlockBehind(order, [61, 62, 63, 64], 39);
order = moveBefore(order, [67, 68, 69, 70, 71], 40);
order = moveBlockBehind(order, Array.from({ length: 19 }, (_, i) => 51 + i), 41);
order = moveBefore(order, [41, 42], 64);
// order[i] = original number at position i+1 in current state
const targetOrder = order;

// Inverse: currentFileNum[k] = which current file (1..180) contains original k
const currentFileNum = [];
for (let k = 1; k <= 180; k++) {
  const pos = targetOrder.indexOf(k);
  currentFileNum[k] = pos + 1; // 1-based
}

if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

for (let n = 1; n <= 180; n++) {
  fs.copyFileSync(path.join(FOLDER, `${PREFIX}-${n}.jpeg`), path.join(TEMP, `${PREFIX}-${n}.jpeg`));
}
fs.copyFileSync(path.join(FOLDER, `${PREFIX}-HP.jpeg`), path.join(TEMP, `${PREFIX}-HP.jpeg`));

// Restore canonical order: new file k gets content from current file currentFileNum[k]
for (let k = 1; k <= 180; k++) {
  const j = currentFileNum[k];
  fs.copyFileSync(path.join(TEMP, `${PREFIX}-${j}.jpeg`), path.join(FOLDER, `${PREFIX}-${k}.jpeg`));
}
fs.copyFileSync(path.join(TEMP, `${PREFIX}-HP.jpeg`), path.join(FOLDER, `${PREFIX}-HP.jpeg`));

for (let n = 1; n <= 180; n++) fs.unlinkSync(path.join(TEMP, `${PREFIX}-${n}.jpeg`));
fs.unlinkSync(path.join(TEMP, `${PREFIX}-HP.jpeg`));
fs.rmdirSync(TEMP);

console.log('Undo complete. Photos restored to order 1, 2, 3, ..., 180.');
process.exit(0);
