#!/usr/bin/env node
/**
 * Travel page system CLI (process / crop / render / validate).
 * Legacy interactive creator remains available via: npm run create-trip
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { getProjectRoot } from './config';
import { processPhotos } from './commands/process-photos';
import { cropCover, cropHero } from './commands/crop';
import { writeTripPage } from './commands/render-trip';
import { validateTrip, printValidation } from './commands/validate-trip';

const program = new Command();

program
  .name('travel')
  .description('Travel page automation: process photos, crop cover/hero, render, validate')
  .version('2.0.0');

function rootFromOpts(opts: { root?: string }): string {
  return opts.root || getProjectRoot();
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
    const manifestPath =
      opts.manifest ||
      path.join(projectRoot, 'Travel-Pages-Sub', opts.section, opts.year, slug, 'trip.yaml');

    console.log(chalk.cyan('\nprocess-photos\n'));
    await processPhotos({
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
    console.log(chalk.cyan('\ncrop-cover\n'));
    await cropCover(projectRoot, path.resolve(opts.manifest), {
      monthLabel: opts.month,
      displayName: opts.displayName,
    });
  });

program
  .command('crop-hero')
  .description('Crop COVER source to trip hero HP image')
  .requiredOption('--manifest <path>', 'Path to trip.yaml')
  .option(
    '--position <pos>',
    'Sharp cover position: centre|north|south|attention|entropy (default: centre)'
  )
  .option('--root <path>', 'Project root')
  .action(async (opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk.cyan('\ncrop-hero\n'));
    await cropHero(projectRoot, path.resolve(opts.manifest), {
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
    console.log(chalk.cyan('\nrender-trip\n'));
    writeTripPage(projectRoot, path.resolve(opts.manifest));
  });

program
  .command('validate-trip')
  .description('Validate manifest, assets, HTML nesting, year link')
  .requiredOption('--manifest <path>', 'Path to trip.yaml')
  .option('--root <path>', 'Project root')
  .action((opts) => {
    const projectRoot = rootFromOpts(opts);
    console.log(chalk.cyan('\nvalidate-trip\n'));
    const result = validateTrip(projectRoot, path.resolve(opts.manifest));
    printValidation(result);
    if (!result.ok) process.exitCode = 1;
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(String(err?.stack || err)));
  process.exit(1);
});
