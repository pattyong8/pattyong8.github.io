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
exports.defaultManifestPath = defaultManifestPath;
exports.loadManifest = loadManifest;
exports.saveManifest = saveManifest;
exports.photoIdFromSeq = photoIdFromSeq;
exports.resolveRepoPath = resolveRepoPath;
exports.toRepoRelative = toRepoRelative;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function defaultManifestPath(htmlDir) {
    return path.join(htmlDir, 'trip.yaml');
}
function loadManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest not found: ${manifestPath}`);
    }
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const data = js_yaml_1.default.load(raw);
    if (!data || data.schemaVersion !== 1) {
        throw new Error(`Invalid or unsupported manifest: ${manifestPath}`);
    }
    return data;
}
function saveManifest(manifestPath, manifest) {
    const dir = path.dirname(manifestPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const dumped = js_yaml_1.default.dump(manifest, {
        lineWidth: 100,
        noRefs: true,
        sortKeys: false,
    });
    fs.writeFileSync(manifestPath, dumped, 'utf-8');
}
function photoIdFromSeq(seq) {
    return `p${String(seq).padStart(3, '0')}`;
}
function resolveRepoPath(projectRoot, maybeRelative) {
    if (path.isAbsolute(maybeRelative))
        return maybeRelative;
    return path.join(projectRoot, maybeRelative);
}
function toRepoRelative(projectRoot, absolutePath) {
    const rel = path.relative(projectRoot, absolutePath);
    return rel.split(path.sep).join('/');
}
//# sourceMappingURL=manifest.js.map