# Travel Page Automation Tool

Automate the creation of travel pages for your website. This tool processes raw photos, optimizes them for web, organizes them chronologically by date taken, and generates HTML pages matching your existing Travel-Pages-Sub structure.

## Features

- **Image Processing**: Automatically resize, optimize, and convert images to web-friendly format
- **EXIF Date Extraction**: Sort photos chronologically using date/time taken from photo metadata
- **Smart Hero Selection**: Automatically select the best photo for the hero image based on resolution and aspect ratio
- **Section Organization**: Group photos by date into sections (Day 1, Day 2, etc.)
- **HTML Generation**: Generate complete HTML pages matching your existing structure
- **Multi-page Support**: Automatically split large trips into multiple pages
- **Interactive CLI**: Easy-to-use command-line interface with prompts

## Installation

```bash
cd travel-page-tool
npm install
npm run build
```

## Quick Start

### Interactive Mode (Recommended)

Simply run the tool and answer the prompts:

```bash
npm run create-trip -- --photos /path/to/your/photos
```

The tool will:
1. Ask you for trip details (name, category, year, location, etc.)
2. Process and optimize all photos
3. Organize photos by date
4. Ask for descriptions for each section
5. Generate the HTML page(s)

### Config File Mode

For batch processing or to save your settings, use a config file:

```bash
# Create a sample config file
npm run create-trip -- --init

# Edit the config file, then run:
npm run create-trip -- --config trip-config.json
```

## Usage Examples

### Basic Usage

```bash
# Interactive mode with photos folder
npm run create-trip -- --photos ~/Desktop/paris-photos

# Using a config file
npm run create-trip -- --config my-trip.json

# Preview without creating files (dry run)
npm run create-trip -- --photos ~/Desktop/photos --dry-run
```

### Config File Format

```json
{
  "tripName": "Paris-2024",
  "category": "20s",
  "year": "2024",
  "title": "Paris Olympics 2024",
  "dateRange": "Jul 20th-Aug 1st 2024",
  "location": "Paris, France",
  "withPeople": "Parth, Quinn, & Jake",
  "introParagraph": "My amazing trip to Paris for the 2024 Olympics...",
  "photosFolder": "./my-raw-photos",
  "sectionDescriptions": {
    "day-1": "Description for day 1...",
    "day-2": "Description for day 2..."
  },
  "imageSettings": {
    "maxWidth": 2000,
    "quality": 85,
    "format": "jpeg"
  }
}
```

## Categories

The tool supports the following categories (matching your existing folder structure):

| Category | Description |
|----------|-------------|
| `20s` | Trips from 2019-present |
| `College-J&S` | College Junior & Senior years |
| `College-F&S` | College Freshman & Sophomore years |
| `HighSchool` | High School trips |
| `MiddleSchool` | Middle School trips |

## Output Structure

The tool creates files in the following locations:

```
your-website/
├── assets/images/Travel-Pages-Images/{category}/{year}/{trip-name}/
│   ├── {trip-name}-HP-600.webp    # Hero image (mobile, WebP)
│   ├── {trip-name}-HP-600.jpeg    # Hero image (mobile, JPEG fallback)
│   ├── {trip-name}-HP-1500.webp   # Hero image (desktop, WebP)
│   ├── {trip-name}-HP-1500.jpeg   # Hero image (desktop, JPEG fallback)
│   ├── {trip-name}-1-600.webp     # Photo 1 (mobile, WebP)
│   ├── {trip-name}-1-600.jpeg     # Photo 1 (mobile, JPEG fallback)
│   ├── {trip-name}-1-1500.webp    # Photo 1 (desktop, WebP)
│   ├── {trip-name}-1-1500.jpeg    # Photo 1 (desktop, JPEG fallback)
│   └── ...
└── Travel-Pages-Sub/{category}/{year}/{trip-name}/
    ├── {trip-name}-1.html         # Page 1
    └── {trip-name}-2.html         # Page 2 (if needed)
```

**Per photo, 4 files are created:**
- Mobile WebP (600px) - smallest, for phones
- Mobile JPEG (600px) - fallback for older browsers
- Desktop WebP (1500px) - for tablets/desktops
- Desktop JPEG (1500px) - fallback for older browsers

## Image Processing

Images are processed with responsive optimization for both desktop and mobile:

### Responsive Images (Default)

Each image is generated in **multiple sizes and formats**:

| Size | Width | Use Case |
|------|-------|----------|
| Small | 600px | Mobile devices |
| Large | 1500px | Desktop/tablets |

| Format | Browser Support | File Size |
|--------|-----------------|-----------|
| WebP | Chrome, Firefox, Safari 14+, Edge | 25-35% smaller |
| JPEG | All browsers (fallback) | Standard |

**Benefits:**
- 🚀 **60-70% faster** mobile loading
- 📱 **Automatic size selection** based on device
- 🌐 **Universal browser support** with JPEG fallback
- 💾 **Lazy loading** - images load as you scroll

### Processing Settings

- **Quality**: 85%
- **Auto-rotation**: Based on EXIF orientation
- **Lazy loading**: Enabled by default

## How It Works

1. **Scan Photos**: The tool scans your photos folder for supported image formats (.jpg, .jpeg, .png, .webp, .heic, etc.)

2. **Extract EXIF**: Date/time taken is extracted from each photo's EXIF metadata. If missing, file modification time is used.

3. **Sort Chronologically**: Photos are sorted by date/time taken.

4. **Create Sections**: Photos are grouped by date into sections (Day 1, Day 2, etc.)

5. **Select Hero Image**: The best photo is automatically selected based on resolution and aspect ratio.

6. **Process Images**: Each image is resized, optimized, and renamed following the pattern `{TripName}-{Number}.jpeg`.

7. **Generate HTML**: HTML pages are generated using your existing template structure, with JavaScript image grids for each section.

## Tips

- **Photo Quality**: Use original photos for best results. The tool will optimize them for web.
- **EXIF Data**: Make sure your photos have EXIF date/time data for accurate chronological sorting.
- **Descriptions**: You can skip section descriptions during creation and add them later by editing the HTML.
- **Large Trips**: For trips with 150+ photos, the tool will automatically split into multiple pages.

## Troubleshooting

### "No images found"
Make sure your photos folder contains supported image formats (.jpg, .jpeg, .png, etc.)

### "Could not find project root"
Run the tool from your website directory or the travel-page-tool directory.

### Photos not in chronological order
Check if your photos have EXIF date/time data. The tool falls back to file modification time if EXIF is missing.

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev -- --photos ./test-photos
```

## License

MIT
