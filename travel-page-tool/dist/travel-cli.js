#!/usr/bin/env node
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
/**
 * Travel page system CLI (process / crop / render / validate).
 * Legacy interactive creator remains available via: npm run create-trip
 */
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const process_photos_1 = require("./commands/process-photos");
const crop_1 = require("./commands/crop");
const render_trip_1 = require("./commands/render-trip");
const validate_trip_1 = require("./commands/validate-trip");
const program = new commander_1.Command();
program
    .name('travel')
    .description('Travel page automation: process photos, crop cover/hero, render, validate')
    .version('2.0.0');
function rootFromOpts(opts) {
    return opts.root || (0, config_1.getProjectRoot)();
}
program
    .command('process-photos')
    .description('Stage originals to _incoming, EXIF-sort, optimize, write trip.yaml')
    .requiredOption('--photos <path>', 'Trip photo folder (Assets Travel-Pages-Images/.../Trip)')
    .requiredOption('--slug <slug>', 'Trip folder / slug name')
    .requiredOption('--title <title>', 'Display title')
    .option('--section <section>', 'Age section', '20s')
    .option('--year <year>', 'Year', '2026')
    .option('--prefix <prefix>', 'Image filename prefix (default: slug)')
    .option('--manifest <path>', 'trip.yaml output path (default: Travel-Pages-Sub/.../trip.yaml)')
    .option('--root <path>', 'Project root')
    .option('--dry-run', 'Preview only')
    .action(async (opts) => {
    const projectRoot = rootFromOpts(opts);
    const photosDir = path.resolve(opts.photos);
    const slug = opts.slug;
    const tripPrefix = opts.prefix || slug;
    const manifestPath = opts.manifest ||
        path.join(projectRoot, 'Travel-Pages-Sub', opts.section, opts.year, slug, 'trip.yaml');
    console.log(chalk_1.default.cyan('\nprocess-photos\n'));
    await (0, process_photos_1.processPhotos)({
        projectRoot,
        photosDir,
        tripPrefix,
        slug,
        section: opts.section,
        year: opts.year,
        title: opts.title,
        manifestPath,
        dryRun: !!opts.dryRun,
    });
});
program
    .command('crop-cover')
    .description('Crop COVER source to year-page thumb (1084x930)')
    .requiredOption('--manifest <path>', 'Path to trip.yaml')
    .option('--month <month>', 'Month label for thumb filename, e.g. Mar')
    .option('--display-name <name>', 'Display name segment for thumb filename')
    .option('--root <path>', 'Project root')
    .action(async (opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk_1.default.cyan('\ncrop-cover\n'));
    await (0, crop_1.cropCover)(projectRoot, path.resolve(opts.manifest), {
        monthLabel: opts.month,
        displayName: opts.displayName,
    });
});
program
    .command('crop-hero')
    .description('Crop COVER source to trip hero HP image')
    .requiredOption('--manifest <path>', 'Path to trip.yaml')
    .option('--position <pos>', 'Sharp cover position: centre|north|south|attention|entropy (default: centre)')
    .option('--root <path>', 'Project root')
    .action(async (opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk_1.default.cyan('\ncrop-hero\n'));
    await (0, crop_1.cropHero)(projectRoot, path.resolve(opts.manifest), {
        position: opts.position,
    });
});
program
    .command('render-trip')
    .description('Generate trip HTML from trip.yaml and upsert year-page card')
    .requiredOption('--manifest <path>', 'Path to trip.yaml')
    .option('--root <path>', 'Project root')
    .action(async (opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk_1.default.cyan('\nrender-trip\n'));
    (0, render_trip_1.writeTripPage)(projectRoot, path.resolve(opts.manifest));
});
program
    .command('validate-trip')
    .description('Validate manifest, assets, HTML nesting, year link')
    .requiredOption('--manifest <path>', 'Path to trip.yaml')
    .option('--root <path>', 'Project root')
    .action((opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk_1.default.cyan('\nvalidate-trip\n'));
    const result = (0, validate_trip_1.validateTrip)(projectRoot, path.resolve(opts.manifest));
    (0, validate_trip_1.printValidation)(result);
    if (!result.ok)
        process.exitCode = 1;
});
program.parseAsync(process.argv).catch((err) => {
    console.error(chalk_1.default.red(String(err?.stack || err)));
    process.exit(1);
});
//# sourceMappingURL=travel-cli.js.map