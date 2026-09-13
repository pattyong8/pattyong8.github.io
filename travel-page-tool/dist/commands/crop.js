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
exports.HERO_HEIGHT = exports.HERO_WIDTH = exports.THUMB_HEIGHT = exports.THUMB_WIDTH = void 0;
exports.resolveCoverPath = resolveCoverPath;
exports.cropCover = cropCover;
exports.cropHero = cropHero;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const manifest_1 = require("../manifest");
exports.THUMB_WIDTH = 1084;
exports.THUMB_HEIGHT = 930;
exports.HERO_WIDTH = 1500;
exports.HERO_HEIGHT = 838;
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
function resolveCoverPath(projectRoot, manifest) {
    const photosDir = (0, manifest_1.resolveRepoPath)(projectRoot, manifest.photosDir);
    const candidate = path.join(photosDir, manifest.coverSource);
    if (fs.existsSync(candidate))
        return candidate;
    // Try basename in _incoming
    const incoming = path.join(photosDir, '_incoming', path.basename(manifest.coverSource));
    if (fs.existsSync(incoming))
        return incoming;
    throw new Error(`Cover source not found: ${candidate}`);
}
async function cropCover(projectRoot, manifestPath, options) {
    const manifest = (0, manifest_1.loadManifest)(manifestPath);
    const source = resolveCoverPath(projectRoot, manifest);
    const month = options?.monthLabel || guessMonth(manifest);
    const display = options?.displayName || slugToDisplay(manifest.slug);
    const thumbName = `${month}-${display}-${manifest.year}.jpeg`.replace(/\s+/g, '-');
    const gallaryDir = path.join(projectRoot, 'assets/images/gallary', manifest.section, manifest.year);
    ensureDir(gallaryDir);
    const outPath = path.join(gallaryDir, thumbName);
    const tmp = outPath + '.tmp';
    await (0, sharp_1.default)(source)
        .rotate()
        .withMetadata()
        .resize(exports.THUMB_WIDTH, exports.THUMB_HEIGHT, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(tmp);
    fs.renameSync(tmp, outPath);
    manifest.gallaryThumb = path
        .relative(projectRoot, outPath)
        .split(path.sep)
        .join('/');
    (0, manifest_1.saveManifest)(manifestPath, manifest);
    console.log(`Cover thumb → ${outPath}`);
    return outPath;
}
async function cropHero(projectRoot, manifestPath, options) {
    const manifest = (0, manifest_1.loadManifest)(manifestPath);
    const source = resolveCoverPath(projectRoot, manifest);
    const photosDir = (0, manifest_1.resolveRepoPath)(projectRoot, manifest.photosDir);
    const heroName = manifest.heroFile || `${manifest.tripPrefix}-HP.jpeg`;
    const outPath = path.join(photosDir, heroName);
    // Default centre: attention often pulls tall covers toward textured foreground and chops heads.
    const position = options?.position || 'centre';
    const tmp = outPath + '.tmp';
    await (0, sharp_1.default)(source)
        .rotate()
        .withMetadata()
        .resize(exports.HERO_WIDTH, exports.HERO_HEIGHT, { fit: 'cover', position })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(tmp);
    fs.renameSync(tmp, outPath);
    manifest.heroFile = heroName;
    (0, manifest_1.saveManifest)(manifestPath, manifest);
    console.log(`Hero → ${outPath} (position=${position})`);
    return outPath;
}
function guessMonth(manifest) {
    if (manifest.startDate && /^\d{4}-\d{2}/.test(manifest.startDate)) {
        const m = Number(manifest.startDate.slice(5, 7));
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || 'Jan';
    }
    const fromSlug = manifest.slug.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    if (fromSlug)
        return fromSlug[1].slice(0, 1).toUpperCase() + fromSlug[1].slice(1, 3).toLowerCase();
    return 'Mar';
}
function slugToDisplay(slug) {
    return slug
        .replace(/^\w{3}-/, '')
        .replace(/-\d{4}$/, '')
        .replace(/&/g, 'and')
        .replace(/-/g, '-');
}
//# sourceMappingURL=crop.js.map