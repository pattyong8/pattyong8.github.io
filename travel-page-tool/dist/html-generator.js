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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlPage = generateHtmlPage;
exports.splitSectionsForPages = splitSectionsForPages;
exports.generateAllPages = generateAllPages;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const template_loader_1 = require("./utils/template-loader");
const path_calculator_1 = require("./utils/path-calculator");
const DEFAULT_OPTIONS = {
    photosPerPage: 150, // Default to 150 photos per page
    responsive: true, // Use responsive images by default
};
/**
 * Generate the JavaScript code for an image grid section (legacy non-responsive)
 */
function generateImageGridScriptLegacy(containerId, imagePrefix, startIndex, endIndex) {
    // The script generates 3 images at a time (col-md-4 = 3 columns)
    // The loop increments by 3 and displays i, i+1, i+2
    const scriptEndIndex = endIndex + 1; // The loop uses < not <=
    return `
											<div id="${containerId}"/>
											<script>

											function appendImage(prefix, index){
												const div = document.createElement('div');
												const number2 = i + 1;
												const number3 = i + 2;
												const url1 = \`\${prefix}\${i}.jpeg\`;
												const url2 = \`\${prefix}\${i+1}.jpeg\`;
												const url3 = \`\${prefix}\${i+2}.jpeg\`;
												div.className = 'col-md-4';
												div.style = "display:flex; align-items:flex-start;justify-content:center;width:100%"
												div.innerHTML = \`
												<div style="margin:5px; position:relative">
													<img src=\` + url1 + \` alt="portfolio image"/>
													<div class="text-block">
														<p-box> Picture #\` + index + \` </p-box>
													</div>
												</div>
												<div style="margin:5px; position:relative">
													<img src=\` + url2 + \` alt="portfolio image"/>
													<div class="text-block">
														<p-box> Picture #\` + number2 + \` </p-box>
													</div>
												</div>
												<div style="margin:5px; position:relative">
													<img src=\` + url3 + \` alt="portfolio image"/>
													<div class="text-block">
														<p-box> Picture #\` + number3 + \` </p-box>
													</div>
												</div>
												\`;

												document.getElementById('${containerId}').appendChild(div);
											}
											const prefix = "${imagePrefix}";
											for (var i = ${startIndex}; i < ${scriptEndIndex}; i+=3) {
												// const url = prefix + i + ".jpg"
												appendImage(prefix, i);
											}
											</script>
`;
}
/**
 * Generate the JavaScript code for a responsive image grid section
 * Uses <picture> elements with WebP + JPEG fallback and srcset
 */
function generateResponsiveImageGridScript(containerId, imagePrefix, startIndex, endIndex) {
    const scriptEndIndex = endIndex + 1;
    return `
											<div id="${containerId}"/>
											<script>
											(function() {
												function createResponsiveImage(prefix, index) {
													return \`
														<picture>
															<source 
																srcset="\${prefix}\${index}-600.webp 600w, \${prefix}\${index}-1500.webp 1500w"
																sizes="(max-width: 768px) 100vw, 33vw"
																type="image/webp">
															<source 
																srcset="\${prefix}\${index}-600.jpeg 600w, \${prefix}\${index}-1500.jpeg 1500w"
																sizes="(max-width: 768px) 100vw, 33vw"
																type="image/jpeg">
															<img 
																src="\${prefix}\${index}-1500.jpeg" 
																alt="Picture #\${index}"
																loading="lazy"
																style="width:100%; height:auto;">
														</picture>
													\`;
												}

												function appendResponsiveImages(prefix, index) {
													const div = document.createElement('div');
													const idx1 = index;
													const idx2 = index + 1;
													const idx3 = index + 2;
													
													div.className = 'col-md-4';
													div.style = "display:flex; align-items:flex-start;justify-content:center;width:100%";
													div.innerHTML = \`
														<div style="margin:5px; position:relative">
															\${createResponsiveImage(prefix, idx1)}
															<div class="text-block">
																<p-box> Picture #\${idx1} </p-box>
															</div>
														</div>
														<div style="margin:5px; position:relative">
															\${createResponsiveImage(prefix, idx2)}
															<div class="text-block">
																<p-box> Picture #\${idx2} </p-box>
															</div>
														</div>
														<div style="margin:5px; position:relative">
															\${createResponsiveImage(prefix, idx3)}
															<div class="text-block">
																<p-box> Picture #\${idx3} </p-box>
															</div>
														</div>
													\`;

													document.getElementById('${containerId}').appendChild(div);
												}

												const prefix = "${imagePrefix}";
												for (let i = ${startIndex}; i < ${scriptEndIndex}; i += 3) {
													appendResponsiveImages(prefix, i);
												}
											})();
											</script>
`;
}
/**
 * Generate the image grid script (chooses responsive or legacy based on options)
 */
function generateImageGridScript(containerId, imagePrefix, startIndex, endIndex, responsive = true) {
    if (responsive) {
        return generateResponsiveImageGridScript(containerId, imagePrefix, startIndex, endIndex);
    }
    return generateImageGridScriptLegacy(containerId, imagePrefix, startIndex, endIndex);
}
/**
 * Generate HTML for a single section
 */
function generateSectionHtml(section, imagePrefix, sectionIndex, responsive = true) {
    const containerId = `image-container-${sectionIndex}`;
    // Generate the image grid script
    const imageGridScript = generateImageGridScript(containerId, imagePrefix, section.startIndex, section.endIndex, responsive);
    // Build the section HTML
    let sectionHtml = `
									<div class="entry__related">
									<h2>${section.heading}</h2>

									<!-- Responsive image grid with WebP + JPEG fallback -->
${imageGridScript}
									<!-- END image grid -->
`;
    // Add description if provided
    if (section.description) {
        sectionHtml += `
											<p style="text-indent: 50px; font-size: 1.6rem; line-height: 1.5">
												${section.description}
											 </p>
`;
    }
    sectionHtml += `
									</div>
`;
    return sectionHtml;
}
/**
 * Generate all sections HTML
 */
function generateAllSectionsHtml(sections, imagePrefix, responsive = true) {
    let html = '';
    for (let i = 0; i < sections.length; i++) {
        html += generateSectionHtml(sections[i], imagePrefix, i, responsive);
    }
    return html;
}
/**
 * Generate responsive hero image HTML
 */
function generateResponsiveHeroHtml(imagePrefix, tripName) {
    const basePath = `${imagePrefix}${tripName}-HP`;
    return `
						<picture>
							<source 
								srcset="${basePath}-600.webp 600w, ${basePath}-1500.webp 1500w"
								sizes="100vw"
								type="image/webp">
							<source 
								srcset="${basePath}-600.jpeg 600w, ${basePath}-1500.jpeg 1500w"
								sizes="100vw"
								type="image/jpeg">
							<img src="${basePath}-1500.jpeg" alt="${tripName}" style="width:100%; height:auto;">
						</picture>`;
}
/**
 * Generate a complete HTML page
 */
function generateHtmlPage(config, sections, pageNumber = 1, totalPages = 1, options = DEFAULT_OPTIONS) {
    const rootPath = (0, path_calculator_1.getRelativePathToRoot)();
    const imageBasePath = (0, path_calculator_1.buildRelativeImagePath)(config.category, config.year, config.tripName);
    const imagePrefix = imageBasePath + config.tripName + '-';
    // Hero image - responsive or legacy
    let heroImageHtml;
    if (options.responsive) {
        heroImageHtml = generateResponsiveHeroHtml(imageBasePath, config.tripName);
    }
    else {
        heroImageHtml = `<img src="${imagePrefix.replace(/-$/, '-HP.jpeg')}">`;
    }
    // Generate sections HTML
    const sectionsHtml = generateAllSectionsHtml(sections, imagePrefix, options.responsive);
    // Add page navigation if multiple pages
    let navigationHtml = '';
    if (totalPages > 1) {
        navigationHtml = generatePageNavigation(config.tripName, pageNumber, totalPages);
    }
    // Render the template
    const html = (0, template_loader_1.renderTemplate)('travel-page.html', {
        title: config.title,
        rootPath,
        heroImageHtml,
        withPeople: config.withPeople,
        dateRange: config.dateRange,
        location: config.location,
        introParagraph: config.introParagraph,
        sectionsHtml: sectionsHtml + navigationHtml,
    });
    return html;
}
/**
 * Generate page navigation HTML
 */
function generatePageNavigation(tripName, currentPage, totalPages) {
    let html = `
									<div class="journal-days" id="myDIV">
`;
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        const activeClass = isActive ? ' activenotnumbermenu' : '';
        const fileName = (0, path_calculator_1.buildHtmlFileName)(tripName, i);
        if (isActive) {
            html += `										<button class="notnumbermenu${activeClass}">Page ${i}</button>\n`;
        }
        else {
            html += `										<button class="notnumbermenu" onclick="window.location.href = '${fileName}'">Page ${i}</button>\n`;
        }
    }
    html += `									</div>
`;
    return html;
}
/**
 * Split sections across multiple pages if needed
 */
function splitSectionsForPages(sections, photos, options = DEFAULT_OPTIONS) {
    const totalPhotos = photos.length;
    // If under the limit, return single page
    if (totalPhotos <= options.photosPerPage) {
        return [sections];
    }
    // Split sections across pages
    const pages = [];
    let currentPage = [];
    let currentPagePhotoCount = 0;
    for (const section of sections) {
        // If adding this section would exceed the limit, start a new page
        if (currentPagePhotoCount + section.photoCount > options.photosPerPage && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentPagePhotoCount = 0;
        }
        currentPage.push(section);
        currentPagePhotoCount += section.photoCount;
    }
    // Don't forget the last page
    if (currentPage.length > 0) {
        pages.push(currentPage);
    }
    return pages;
}
/**
 * Generate all HTML pages for a trip
 */
function generateAllPages(config, sections, photos, outputDir, options = DEFAULT_OPTIONS) {
    // Split sections across pages if needed
    const sectionPages = splitSectionsForPages(sections, photos, options);
    const totalPages = sectionPages.length;
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const generatedFiles = [];
    // Generate each page
    for (let i = 0; i < sectionPages.length; i++) {
        const pageNumber = i + 1;
        const pageSections = sectionPages[i];
        const html = generateHtmlPage(config, pageSections, pageNumber, totalPages, options);
        const fileName = (0, path_calculator_1.buildHtmlFileName)(config.tripName, pageNumber);
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, html, 'utf-8');
        generatedFiles.push(filePath);
    }
    return generatedFiles;
}
//# sourceMappingURL=html-generator.js.map