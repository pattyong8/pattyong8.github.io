#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';

import { processAllImages, ImageProcessingOptions } from './image-processor';
import { organizeByDate, Section, getSectionsSummary, updateSectionDescriptions } from './section-organizer';
import { generateAllPages, TripConfig } from './html-generator';
import { loadConfigFromFile, validateConfig, getProjectRoot, createSampleConfig } from './config';
import { getCategoryOptions, buildImageDirectoryPath, buildHtmlDirectoryPath, toKebabCase } from './utils/path-calculator';
import { scanDirectoryForImages } from './utils/exif-reader';

const program = new Command();

program
  .name('create-trip')
  .description('Automate travel page creation: process photos, optimize images, generate HTML pages')
  .version('1.0.0');

program
  .option('-p, --photos <path>', 'Path to folder containing raw photos')
  .option('-c, --config <path>', 'Path to JSON config file')
  .option('-o, --output <path>', 'Output directory (default: auto-detect project root)')
  .option('--init', 'Create a sample config file')
  .option('--dry-run', 'Preview what would be created without making changes');

program.parse();

const options = program.opts();

async function main() {
  console.log(chalk.cyan('\n🌍 Travel Page Creator\n'));
  
  // Handle --init flag
  if (options.init) {
    const configPath = path.join(process.cwd(), 'trip-config.sample.json');
    createSampleConfig(configPath);
    console.log(chalk.green(`✓ Sample config created: ${configPath}`));
    console.log(chalk.gray('Edit this file and run: npm run create-trip -- --config trip-config.sample.json'));
    return;
  }
  
  try {
    // Determine project root
    const projectRoot = options.output || getProjectRoot();
    console.log(chalk.gray(`Project root: ${projectRoot}\n`));
    
    let tripConfig: TripConfig;
    let photosFolder: string;
    let imageSettings: ImageProcessingOptions;
    let sectionDescriptions: Map<string, string> = new Map();
    
    // Load from config file or interactive mode
    if (options.config) {
      // Config file mode
      console.log(chalk.blue('Loading configuration from file...'));
      const fileConfig = loadConfigFromFile(options.config);
      const validated = validateConfig(fileConfig);
      
      tripConfig = {
        tripName: validated.tripName,
        category: validated.category,
        year: validated.year,
        title: validated.title,
        dateRange: validated.dateRange || '',
        location: validated.location,
        withPeople: validated.withPeople,
        introParagraph: validated.introParagraph,
      };
      
      photosFolder = validated.photosFolder;
      imageSettings = validated.imageSettings;
      
      // Load section descriptions if provided
      if (validated.sectionDescriptions) {
        for (const [key, value] of Object.entries(validated.sectionDescriptions)) {
          sectionDescriptions.set(key, value);
        }
      }
      
      console.log(chalk.green('✓ Configuration loaded\n'));
    } else {
      // Interactive mode
      console.log(chalk.blue('Interactive mode - answer the following questions:\n'));
      
      // Get photos folder
      photosFolder = options.photos;
      if (!photosFolder) {
        const folderAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'photosFolder',
            message: 'Path to folder containing raw photos:',
            validate: (input: string) => {
              if (!input) return 'Please provide a path';
              if (!fs.existsSync(input)) return `Folder does not exist: ${input}`;
              const images = scanDirectoryForImages(input);
              if (images.length === 0) return `No images found in: ${input}`;
              return true;
            },
          },
        ]);
        photosFolder = folderAnswer.photosFolder;
      }
      
      // Validate photos folder
      if (!fs.existsSync(photosFolder)) {
        throw new Error(`Photos folder does not exist: ${photosFolder}`);
      }
      
      const imageCount = scanDirectoryForImages(photosFolder).length;
      console.log(chalk.gray(`Found ${imageCount} images in folder\n`));
      
      // Get trip details
      const tripAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'tripName',
          message: 'Trip name (kebab-case, e.g., "Paris-2024"):',
          filter: (input: string) => toKebabCase(input),
          validate: (input: string) => input.length > 0 || 'Trip name is required',
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: getCategoryOptions(),
        },
        {
          type: 'input',
          name: 'year',
          message: 'Year (e.g., "2024"):',
          validate: (input: string) => /^\d{4}$/.test(input) || 'Please enter a valid 4-digit year',
        },
        {
          type: 'input',
          name: 'title',
          message: 'Display title (e.g., "Paris Olympics 2024"):',
          validate: (input: string) => input.length > 0 || 'Title is required',
        },
        {
          type: 'input',
          name: 'location',
          message: 'Location (e.g., "Paris, France"):',
          validate: (input: string) => input.length > 0 || 'Location is required',
        },
        {
          type: 'input',
          name: 'withPeople',
          message: 'Who did you go with? (e.g., "Friends", "Family", "Parth, Quinn, & Jake"):',
          default: 'Friends',
        },
        {
          type: 'editor',
          name: 'introParagraph',
          message: 'Intro paragraph (opens editor - write your intro, save and close):',
          default: 'Write your intro paragraph here...',
        },
      ]);
      
      tripConfig = {
        tripName: tripAnswers.tripName,
        category: tripAnswers.category,
        year: tripAnswers.year,
        title: tripAnswers.title,
        dateRange: '', // Will be auto-calculated from photos
        location: tripAnswers.location,
        withPeople: tripAnswers.withPeople,
        introParagraph: tripAnswers.introParagraph.trim(),
      };
      
      imageSettings = {
        maxWidth: 1500,
        quality: 85,
        format: 'jpeg',
        responsive: true,
        responsiveSizes: [
          { name: 'small', width: 600 },
          { name: 'large', width: 1500 },
        ],
      };
    }
    
    // Dry run check
    if (options.dryRun) {
      console.log(chalk.yellow('\n--- DRY RUN ---\n'));
      console.log(chalk.white('Would create:'));
      console.log(chalk.gray(`  Images: ${path.join(projectRoot, buildImageDirectoryPath(tripConfig.category, tripConfig.year, tripConfig.tripName))}`));
      console.log(chalk.gray(`  HTML: ${path.join(projectRoot, buildHtmlDirectoryPath(tripConfig.category, tripConfig.year, tripConfig.tripName))}`));
      console.log(chalk.yellow('\nNo files were created (dry run mode)'));
      return;
    }
    
    // Step 1: Process images
    console.log(chalk.blue('\nStep 1: Processing images...\n'));
    
    const imageOutputDir = path.join(projectRoot, buildImageDirectoryPath(tripConfig.category, tripConfig.year, tripConfig.tripName));
    
    const spinner = ora('Processing images...').start();
    
    const processedImages = await processAllImages(
      photosFolder,
      imageOutputDir,
      tripConfig.tripName,
      imageSettings,
      (current, total, fileName) => {
        spinner.text = `Processing image ${current}/${total}: ${fileName}`;
      }
    );
    
    spinner.succeed(`Processed ${processedImages.length} images`);
    
    // Step 2: Organize into sections
    console.log(chalk.blue('\nStep 2: Organizing photos by date...\n'));
    
    const { sections, dateRange } = organizeByDate(processedImages);
    tripConfig.dateRange = dateRange;
    
    console.log(chalk.gray(getSectionsSummary(sections)));
    console.log(chalk.gray(`Date range: ${dateRange}\n`));
    
    // Step 3: Get section descriptions (interactive mode only)
    if (!options.config) {
      console.log(chalk.blue('Step 3: Add descriptions for each section\n'));
      console.log(chalk.gray('(You can skip sections by pressing Enter, or type your description)\n'));
      
      for (const section of sections) {
        const descAnswer = await inquirer.prompt([
          {
            type: 'editor',
            name: 'description',
            message: `Description for "${section.heading}" (${section.photoCount} photos, ${section.dateString}):`,
            default: `Write description for ${section.heading}...`,
          },
        ]);
        
        const desc = descAnswer.description.trim();
        if (desc && desc !== `Write description for ${section.heading}...`) {
          sectionDescriptions.set(section.id, desc);
        }
      }
    }
    
    // Update sections with descriptions
    const updatedSections = updateSectionDescriptions(sections, sectionDescriptions);
    
    // Step 4: Generate HTML
    console.log(chalk.blue('\nStep 4: Generating HTML pages...\n'));
    
    const htmlOutputDir = path.join(projectRoot, buildHtmlDirectoryPath(tripConfig.category, tripConfig.year, tripConfig.tripName));
    
    const generatedFiles = generateAllPages(
      tripConfig,
      updatedSections,
      processedImages,
      htmlOutputDir,
      { photosPerPage: 150, responsive: imageSettings.responsive }
    );
    
    console.log(chalk.green(`✓ Generated ${generatedFiles.length} HTML page(s)`));
    
    // Summary
    console.log(chalk.cyan('\n========================================'));
    console.log(chalk.cyan('           CREATION COMPLETE!           '));
    console.log(chalk.cyan('========================================\n'));
    
    console.log(chalk.white('Summary:'));
    console.log(chalk.gray(`  Trip: ${tripConfig.title}`));
    console.log(chalk.gray(`  Photos processed: ${processedImages.length}`));
    console.log(chalk.gray(`  Sections created: ${updatedSections.length}`));
    console.log(chalk.gray(`  Date range: ${tripConfig.dateRange}`));
    
    console.log(chalk.white('\nFiles created:'));
    console.log(chalk.gray(`  Images: ${imageOutputDir}`));
    for (const file of generatedFiles) {
      console.log(chalk.gray(`  HTML: ${file}`));
    }
    
    console.log(chalk.green('\n✓ Done! Your travel page is ready.\n'));
    
  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
