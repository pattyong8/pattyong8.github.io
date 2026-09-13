"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCoverFileName = isCoverFileName;
exports.findCoverFile = findCoverFile;
exports.stageIncoming = stageIncoming;
exports.processPhotos = processPhotos;
exports.tinyHash = tinyHash;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const exif_reader_1 = require("../utils/exif-reader");
const image_processor_1 = require("../image-processor");
const manifest_1 = require("../manifest");
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']);
const DEFAULT_OPTS = {
    maxWidth: 1500,
    quality: 85,
    format: 'jpeg',
    responsive: false,
    responsiveSizes: [],
};
const OVERSIZE_BYTES = 1.5 * 1024 * 1024;
const DUPE_FLAG_CAP = 15;
function isCoverFileName(fileName) {
    return /^cover\./i.test(fileName);
}
function findCoverFile(dir) {
    if (!fs.existsSync(dir))
        return null;
    const hit = fs.readdirSync(dir).find((f) => isCoverFileName(f));
    return hit ? path.join(dir, hit) : null;
}
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
function listVideos(dir) {
    if (!fs.existsSync(dir))
        return [];
    return fs
        .readdirSync(dir)
        .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
        .map((f) => path.join(dir, f));
}
/**
 * Move loose images from photosDir into _incoming (except already-named web derivatives).
 * Idempotent: files already in _incoming stay put.
 */
function stageIncoming(photosDir, tripPrefix) {
    const incomingDir = path.join(photosDir, '_incoming');
    ensureDir(incomingDir);
    const webName = new RegExp(`^${escapeRegex(tripPrefix)}-(\\d+|HP)\\.jpe?g$`, 'i');
    let moved = 0;
    for (const file of fs.readdirSync(photosDir)) {
        const full = path.join(photosDir, file);
        const stat = fs.statSync(full);
        if (!stat.isFile())
            continue;
        if (file === '.DS_Store')
            continue;
        if (webName.test(file))
            continue;
        if (!(0, exif_reader_1.isSupportedImage)(full) && !VIDEO_EXTS.has(path.extname(file).toLowerCase()))
            continue;
        const dest = path.join(incomingDir, file);
        if (fs.existsSync(dest)) {
            // Keep existing incoming; remove duplicate loose copy if identical name
            if (full !== dest)
                fs.unlinkSync(full);
            continue;
        }
        fs.renameSync(full, dest);
        moved++;
    }
    return { incomingDir, moved };
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function flagDuplicates(sorted) {
    const flags = new Map();
    const add = (p, f) => {
        const arr = flags.get(p) || [];
        if (!arr.includes(f))
            arr.push(f);
        flags.set(p, arr);
    };
    for (let i = 0; i < sorted.length; i++) {
        if (!sorted[i].hasExifDate)
            add(sorted[i].filePath, 'missing_exif');
        if (!sorted[i].hasExifDate)
            add(sorted[i].filePath, 'needs_placement');
    }
    let dupeCount = 0;
    for (let i = 1; i < sorted.length && dupeCount < DUPE_FLAG_CAP; i++) {
        const a = sorted[i - 1];
        const b = sorted[i];
        const sa = fs.statSync(a.filePath).size;
        const sb = fs.statSync(b.filePath).size;
        const sizeClose = Math.abs(sa - sb) <= Math.max(2048, sa * 0.01);
        const dimClose = a.width &&
            b.width &&
            a.height &&
            b.height &&
            a.width === b.width &&
            a.height === b.height;
        const timeClose = a.dateTaken &&
            b.dateTaken &&
            Math.abs(a.dateTaken.getTime() - b.dateTaken.getTime()) < 2500;
        if ((sizeClose && dimClose) || (sizeClose && timeClose)) {
            add(b.filePath, 'possible_duplicate');
            dupeCount++;
        }
    }
    return flags;
}
async function processPhotos(opts) {
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
    const allImages = (0, exif_reader_1.scanDirectoryForImages)(incomingDir).filter((p) => !isCoverFileName(path.basename(p)));
    // Prefer a single file when both IMG_1234.JPG and IMG_1234.jpeg exist
    const dedupedByBase = new Map();
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
        if (ext === '.jpeg' && existingExt === '.jpg')
            dedupedByBase.set(base, imgPath);
    }
    const uniqueImages = [...dedupedByBase.values()];
    if (uniqueImages.length === 0) {
        throw new Error(`No body photos found in ${incomingDir}`);
    }
    if (uniqueImages.length < allImages.length) {
        console.log(`Skipped ${allImages.length - uniqueImages.length} same-name duplicate export(s) (.JPG/.jpeg pairs)`);
    }
    const metadata = await Promise.all(uniqueImages.map((p) => (0, exif_reader_1.extractExifData)(p)));
    const sorted = (0, exif_reader_1.sortPhotosByDate)(metadata);
    const flagMap = flagDuplicates(sorted);
    const photos = [];
    const oversized = [];
    const needsPlacement = [];
    const possibleDuplicates = [];
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
            await (0, image_processor_1.processImage)(meta.filePath, outPath, DEFAULT_OPTS);
        }
        const bytes = dryRun ? fs.statSync(meta.filePath).size : fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;
        if (bytes > OVERSIZE_BYTES)
            oversized.push(outName);
        if (flags.includes('needs_placement'))
            needsPlacement.push(outName);
        if (flags.includes('possible_duplicate'))
            possibleDuplicates.push(outName);
        photos.push({
            id: (0, manifest_1.photoIdFromSeq)(seq),
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
    const existing = fs.existsSync(manifestPath) ? (0, manifest_1.loadManifest)(manifestPath) : null;
    const manifest = {
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
        photosDir: (0, manifest_1.toRepoRelative)(projectRoot, photosDir),
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
    }
    else {
        manifest.coverSource = path.basename(coverPath);
    }
    if (!dryRun) {
        (0, manifest_1.saveManifest)(manifestPath, manifest);
    }
    console.log(`Processed ${photos.length} photos → ${photosDir}`);
    console.log(`Manifest → ${manifestPath}`);
    if (needsPlacement.length)
        console.log(`needs_placement: ${needsPlacement.length}`);
    if (possibleDuplicates.length)
        console.log(`possible_duplicate (capped): ${possibleDuplicates.length}`);
    if (oversized.length)
        console.log(`oversized after optimize: ${oversized.length}`);
    if (videos.length)
        console.log(`skipped videos: ${videos.join(', ')}`);
    return manifest;
}
/** Quick perceptual-ish fingerprint for optional future use */
async function tinyHash(filePath) {
    const buf = await (0, sharp_1.default)(filePath)
        .rotate()
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();
    return buf.toString('hex');
}
//# sourceMappingURL=process-photos.js.map