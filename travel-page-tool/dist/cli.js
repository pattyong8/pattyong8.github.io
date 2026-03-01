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
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const image_processor_1 = require("./image-processor");
const section_organizer_1 = require("./section-organizer");
const html_generator_1 = require("./html-generator");
const config_1 = require("./config");
const path_calculator_1 = require("./utils/path-calculator");
const exif_reader_1 = require("./utils/exif-reader");
const program = new commander_1.Command();
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
    console.log(chalk_1.default.cyan('\n🌍 Travel Page Creator\n'));
    // Handle --init flag
    if (options.init) {
        const configPath = path.join(process.cwd(), 'trip-config.sample.json');
        (0, config_1.createSampleConfig)(configPath);
        console.log(chalk_1.default.green(`✓ Sample config created: ${configPath}`));
        console.log(chalk_1.default.gray('Edit this file and run: npm run create-trip -- --config trip-config.sample.json'));
        return;
    }
    try {
        // Determine project root
        const projectRoot = options.output || (0, config_1.getProjectRoot)();
        console.log(chalk_1.default.gray(`Project root: ${projectRoot}\n`));
        let tripConfig;
        let photosFolder;
        let imageSettings;
        let sectionDescriptions = new Map();
        // Load from config file or interactive mode
        if (options.config) {
            // Config file mode
            console.log(chalk_1.default.blue('Loading configuration from file...'));
            const fileConfig = (0, config_1.loadConfigFromFile)(options.config);
            const validated = (0, config_1.validateConfig)(fileConfig);
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
            console.log(chalk_1.default.green('✓ Configuration loaded\n'));
        }
        else {
            // Interactive mode
            console.log(chalk_1.default.blue('Interactive mode - answer the following questions:\n'));
            // Get photos folder
            photosFolder = options.photos;
            if (!photosFolder) {
                const folderAnswer = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'photosFolder',
                        message: 'Path to folder containing raw photos:',
                        validate: (input) => {
                            if (!input)
                                return 'Please provide a path';
                            if (!fs.existsSync(input))
                                return `Folder does not exist: ${input}`;
                            const images = (0, exif_reader_1.scanDirectoryForImages)(input);
                            if (images.length === 0)
                                return `No images found in: ${input}`;
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
            const imageCount = (0, exif_reader_1.scanDirectoryForImages)(photosFolder).length;
            console.log(chalk_1.default.gray(`Found ${imageCount} images in folder\n`));
            // Get trip details
            const tripAnswers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'tripName',
                    message: 'Trip name (kebab-case, e.g., "Paris-2024"):',
                    filter: (input) => (0, path_calculator_1.toKebabCase)(input),
                    validate: (input) => input.length > 0 || 'Trip name is required',
                },
                {
                    type: 'list',
                    name: 'category',
                    message: 'Category:',
                    choices: (0, path_calculator_1.getCategoryOptions)(),
                },
                {
                    type: 'input',
                    name: 'year',
                    message: 'Year (e.g., "2024"):',
                    validate: (input) => /^\d{4}$/.test(input) || 'Please enter a valid 4-digit year',
                },
                {
                    type: 'input',
                    name: 'title',
                    message: 'Display title (e.g., "Paris Olympics 2024"):',
                    validate: (input) => input.length > 0 || 'Title is required',
                },
                {
                    type: 'input',
                    name: 'location',
                    message: 'Location (e.g., "Paris, France"):',
                    validate: (input) => input.length > 0 || 'Location is required',
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
            console.log(chalk_1.default.yellow('\n--- DRY RUN ---\n'));
            console.log(chalk_1.default.white('Would create:'));
            console.log(chalk_1.default.gray(`  Images: ${path.join(projectRoot, (0, path_calculator_1.buildImageDirectoryPath)(tripConfig.category, tripConfig.year, tripConfig.tripName))}`));
            console.log(chalk_1.default.gray(`  HTML: ${path.join(projectRoot, (0, path_calculator_1.buildHtmlDirectoryPath)(tripConfig.category, tripConfig.year, tripConfig.tripName))}`));
            console.log(chalk_1.default.yellow('\nNo files were created (dry run mode)'));
            return;
        }
        // Step 1: Process images
        console.log(chalk_1.default.blue('\nStep 1: Processing images...\n'));
        const imageOutputDir = path.join(projectRoot, (0, path_calculator_1.buildImageDirectoryPath)(tripConfig.category, tripConfig.year, tripConfig.tripName));
        const spinner = (0, ora_1.default)('Processing images...').start();
        const processedImages = await (0, image_processor_1.processAllImages)(photosFolder, imageOutputDir, tripConfig.tripName, imageSettings, (current, total, fileName) => {
            spinner.text = `Processing image ${current}/${total}: ${fileName}`;
        });
        spinner.succeed(`Processed ${processedImages.length} images`);
        // Step 2: Organize into sections
        console.log(chalk_1.default.blue('\nStep 2: Organizing photos by date...\n'));
        const { sections, dateRange } = (0, section_organizer_1.organizeByDate)(processedImages);
        tripConfig.dateRange = dateRange;
        console.log(chalk_1.default.gray((0, section_organizer_1.getSectionsSummary)(sections)));
        console.log(chalk_1.default.gray(`Date range: ${dateRange}\n`));
        // Step 3: Get section descriptions (interactive mode only)
        if (!options.config) {
            console.log(chalk_1.default.blue('Step 3: Add descriptions for each section\n'));
            console.log(chalk_1.default.gray('(You can skip sections by pressing Enter, or type your description)\n'));
            for (const section of sections) {
                const descAnswer = await inquirer_1.default.prompt([
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
        const updatedSections = (0, section_organizer_1.updateSectionDescriptions)(sections, sectionDescriptions);
        // Step 4: Generate HTML
        console.log(chalk_1.default.blue('\nStep 4: Generating HTML pages...\n'));
        const htmlOutputDir = path.join(projectRoot, (0, path_calculator_1.buildHtmlDirectoryPath)(tripConfig.category, tripConfig.year, tripConfig.tripName));
        const generatedFiles = (0, html_generator_1.generateAllPages)(tripConfig, updatedSections, processedImages, htmlOutputDir, { photosPerPage: 150, responsive: imageSettings.responsive });
        console.log(chalk_1.default.green(`✓ Generated ${generatedFiles.length} HTML page(s)`));
        // Summary
        console.log(chalk_1.default.cyan('\n========================================'));
        console.log(chalk_1.default.cyan('           CREATION COMPLETE!           '));
        console.log(chalk_1.default.cyan('========================================\n'));
        console.log(chalk_1.default.white('Summary:'));
        console.log(chalk_1.default.gray(`  Trip: ${tripConfig.title}`));
        console.log(chalk_1.default.gray(`  Photos processed: ${processedImages.length}`));
        console.log(chalk_1.default.gray(`  Sections created: ${updatedSections.length}`));
        console.log(chalk_1.default.gray(`  Date range: ${tripConfig.dateRange}`));
        console.log(chalk_1.default.white('\nFiles created:'));
        console.log(chalk_1.default.gray(`  Images: ${imageOutputDir}`));
        for (const file of generatedFiles) {
            console.log(chalk_1.default.gray(`  HTML: ${file}`));
        }
        console.log(chalk_1.default.green('\n✓ Done! Your travel page is ready.\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\n✗ Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map