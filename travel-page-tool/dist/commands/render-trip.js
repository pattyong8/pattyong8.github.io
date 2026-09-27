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
exports.renderIntroHtml = renderIntroHtml;
exports.renderSectionHtml = renderSectionHtml;
exports.renderTripHtml = renderTripHtml;
exports.upsertYearCard = upsertYearCard;
exports.writeTripPage = writeTripPage;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const manifest_1 = require("../manifest");
const layout_guards_1 = require("../layout-guards");
const P_STYLE = 'text-indent: 50px; font-size: 1.6rem; line-height: 1.5; margin-top: 0';
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function proseToParagraphs(prose) {
    return prose
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
}
function renderIntroHtml(introParagraph) {
    if (!introParagraph.trim()) {
        return `				<p class="lead drop-cap">\n					[INTRO_PARAGRAPH]\n				</p>\n`;
    }
    const paras = proseToParagraphs(introParagraph);
    return paras
        .map((para, i) => {
        const cls = i === 0 ? 'lead drop-cap' : 'lead';
        return `				<p class="${cls}">\n					${escapeHtml(para)}\n				</p>\n`;
    })
        .join('\n');
}
function photoById(manifest, id) {
    return manifest.photos.find((p) => p.id === id);
}
/**
 * Chile reading flow for leftover 1–2 photos:
 * float photos left, put ALL section paragraphs inside the wrap before clear:both
 * so short first paragraphs don't leave a blank column beside tall leftovers.
 */
function renderSectionHtml(section, manifest, imagePrefixUrl) {
    const photos = section.photoIds
        .map((id) => photoById(manifest, id))
        .filter((p) => !!p);
    const paragraphs = proseToParagraphs(section.prose);
    const n = photos.length;
    const fullCount = Math.floor(n / 3) * 3;
    const leftovers = photos.slice(fullCount);
    const fullRows = photos.slice(0, fullCount);
    const cacheBust = manifest.cacheBust || '';
    let html = `			<div class="entry__related">\n`;
    if (section.title) {
        html += `			<h2>${escapeHtml(section.title)}</h2>\n`;
    }
    for (let i = 0; i < fullRows.length; i += 3) {
        const row = fullRows.slice(i, i + 3);
        html += `			<div class="travel-photo-row">\n`;
        for (const ph of row) {
            html += photoCard(imagePrefixUrl, ph.seq, false, 1, cacheBust);
        }
        html += `			</div>\n`;
    }
    if (leftovers.length > 0) {
        const rem = leftovers.length;
        html += `			<div class="travel-leftover-wrap">\n`;
        html += `				<div class="travel-leftover-photos" style="width:calc(${rem} * 33.333% - 8px)">\n`;
        for (const ph of leftovers) {
            html += photoCard(imagePrefixUrl, ph.seq, true, rem, cacheBust);
        }
        html += `				</div>\n`;
        // All prose must stay inside the wrap, before clear — matches Chile pullFollowingParagraphs.
        for (const para of paragraphs) {
            html += `				<p style="${P_STYLE}">${escapeHtml(para)}</p>\n`;
        }
        html += `				<div style="clear:both"></div>\n`;
        html += `			</div>\n`;
    }
    else {
        for (const para of paragraphs) {
            html += `			<p style="${P_STYLE}">${escapeHtml(para)}</p>\n`;
        }
    }
    html += `			</div>\n\n`;
    return html;
}
function photoCard(prefix, seq, leftover = false, remCount = 1, cacheBust = '') {
    const flex = leftover
        ? `flex:0 0 calc(100% / ${remCount} - 10px); max-width:calc(100% / ${remCount} - 10px); width:calc(100% / ${remCount} - 10px)`
        : `flex:0 0 calc(33.333% - 10px); max-width:calc(33.333% - 10px); width:calc(33.333% - 10px)`;
    const bust = cacheBust ? `?v=${cacheBust}` : '';
    return `				<div class="travel-photo-card" style="${flex}">
					<img src="${prefix}${seq}.jpeg${bust}" alt="portfolio image" loading="lazy"/>
					<div class="text-block"><p-box> Picture #${seq} </p-box></div>
				</div>\n`;
}
function assetDepthPrefix(section) {
    // Travel-Pages-Sub/{section}/{year}/{slug}/ → 4 levels for 20s
    if (section === '20s')
        return '../../../../';
    return '../../../../';
}
function renderTripHtml(manifest) {
    const depth = assetDepthPrefix(manifest.section);
    const encodedSlug = encodeURIComponent(manifest.slug).replace(/%2F/gi, '/');
    const heroFile = manifest.heroFile || manifest.tripPrefix + '-HP.jpeg';
    const cacheBust = manifest.cacheBust || '';
    const bustQ = cacheBust ? `?v=${cacheBust}` : '';
    const heroRel = `${depth}assets/images/Travel-Pages-Images/${manifest.section}/${manifest.year}/${encodedSlug}/${heroFile}${bustQ}`;
    const imagePrefixUrl = `${depth}assets/images/Travel-Pages-Images/${manifest.section}/${manifest.year}/${encodedSlug}/${manifest.tripPrefix}-`;
    const sections = manifest.sections.length > 0
        ? manifest.sections
        : manifest.photos.length > 0
            ? [
                {
                    id: 'photos',
                    title: 'Photos',
                    photoIds: manifest.photos.map((p) => p.id),
                    prose: '',
                },
            ]
            : [];
    const intro = renderIntroHtml(manifest.introParagraph);
    let body = '';
    for (const sec of sections) {
        body += renderSectionHtml(sec, manifest, imagePrefixUrl);
    }
    return `<!doctype html>
<html class="no-js" lang="en">

<head>
	<meta charset="utf-8">
	<title>${escapeHtml(manifest.title)}</title>
	<meta name="description" content="">
	<meta name="author" content="">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<link rel="stylesheet" href="${depth}assets/css/base.css">
	<link rel="stylesheet" href="${depth}assets/css/vendor.css">
	<link rel="stylesheet" href="${depth}assets/css/main.css">

	<script src="${depth}assets/js/modernizr.js"></script>
	<script src="${depth}assets/js/main.js"></script>

	<link rel="shortcut icon" type="image/icon" href="${depth}assets/logo/favicon.png"/>
	<link rel="stylesheet" href="${depth}assets/css/font-awesome.min.css" />
	<link rel="stylesheet" href="${depth}assets/css/animate.css" />
	<link rel="stylesheet" href="${depth}assets/css/hover-min.css">
	<link rel="stylesheet" href="${depth}assets/css/bootstrap.min.css" />
	<link rel="stylesheet" href="${depth}assets/css/bootsnav.css"/>
	<link rel="stylesheet" href="${depth}assets/css/style.css?v=header-spacing" />
	<link rel="stylesheet" href="${depth}assets/css/responsive.css" />
	<link rel="stylesheet" href="${depth}assets/css/travel-trip.css" />
	<link href="https://fonts.googleapis.com/css?family=Rufina:400,700" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css?family=Poppins:100,200,300,400,500,600,700,800,900" rel="stylesheet" />
</head>

<body id="top">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script>
$(function(){
  $("#header").load("${depth}header-M.html");
  $("#footer").load("${depth}footer-M.html");
});
</script>

<div id="header"></div>

<section>
	<div class="s-content content">
		<main class="row content__page">

			<article class="column large-full entry format-standard">

				<div class="media-wrap entry__media">
					<div class="entry__post-thumb">
						<img src="${heroRel}" alt="">
					</div>
				</div>

				<div class="content__page-header entry__header">
					<h1 class="display-1 entry__title">
					${escapeHtml(manifest.title)}
					</h1>
					<ul class="entry__header-meta">
						<li class="author">With <a>${escapeHtml(manifest.people || '[PEOPLE]')}</a></li>
						<li class="date">${escapeHtml(manifest.dateRange || '[DATE_RANGE]')}</li>
						<li class="cat-links">
							<a>${escapeHtml(manifest.location || '[LOCATION]')}</a>
						</li>
					</ul>
				</div>

				<div class="entry__content">

${intro}
${body}
				</div> <!-- end entry content -->

${commentsPartial()}

			</article>

		</main>

	</div> <!-- end s-content -->

</section>

<div id="footer"></div>

</body>

</html>
`;
}
function commentsPartial() {
    return `			<div class="comments-wrap">

				<div id="comments" class="column large-12">

					<h3 class="h2">Comments</h3>

					<ol class="commentlist">
						<li class="thread-alt depth-1 comment">
							<div class="comment__content">
								<div class="comment__info">
									<div class="comment__author">Nothing yet!</div>
									<div class="comment__meta">
										<div class="comment__time">:)</div>
									</div>
								</div>
								<div class="comment__text">
								<p>Coming Soon</p>
								</div>
							</div>
						</li>
					</ol>

				</div>

				<div class="column large-12 comment-respond">
					<div id="respond">
						<h3 class="h2">Add Comment <span>Help me create memories from your perspective!</span></h3>
						<form name="submit-to-google-sheet" id="contactForm" method="post" action="" autocomplete="off" onSubmit="alert('Thank you! I will make sure to add your comment soon! :)')">
							<fieldset>
								<div class="form-field">
									<input name="cName" id="cName" class="full-width" placeholder="Your Name" value="" type="text">
								</div>
								<div class="message form-field">
									<textarea name="cMessage" id="cMessage" class="full-width" placeholder="Your Message"></textarea>
								</div>
								<input name="submit" id="submit-form" class="btn btn--primary btn-wide btn--large full-width" value="Add Comment" type="submit">
							</fieldset>
						</form>
					</div>
					<script>
					  const scriptURL = 'https://script.google.com/macros/s/AKfycbzPL6GTai2ZzBSdKywBP16xMo2ywD1mI95okaAHEv3rXfK6Zj7Txw4uCBzu7x0XPyAQ/exec'
					  const form = document.forms['submit-to-google-sheet']
					  form.addEventListener('submit', e => {
					    e.preventDefault()
					    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
					      .then(response => console.log('Success!', response))
					      .catch(error => console.error('Error!', error.message))
					  })
					</script>
				</div>

			</div> <!-- end comments-wrap -->
`;
}
function upsertYearCard(projectRoot, manifest) {
    const yearPage = path.join(projectRoot, 'Travel-Pages', manifest.section, `${manifest.section}-${manifest.year}.html`);
    if (!fs.existsSync(yearPage)) {
        throw new Error(`Year page not found: ${yearPage}`);
    }
    let html = fs.readFileSync(yearPage, 'utf-8');
    (0, layout_guards_1.assertYearNavIntact)(html);
    // Only look inside the gallery — never treat memory-bar year links as trip cards.
    const gallery = (0, layout_guards_1.yearPageGalleryRegion)(html);
    if (!gallery)
        throw new Error('filtr-container not found in year page');
    const encodedSlug = encodeURIComponent(manifest.slug).replace(/%2F/gi, '/');
    const href = `../../Travel-Pages-Sub/${manifest.section}/${manifest.year}/${encodedSlug}/${encodedSlug}-1.html`;
    if (gallery.includes(`${manifest.slug}-1.html`) ||
        gallery.includes(`${encodedSlug}-1.html`)) {
        console.log('Year card already present; skipping insert');
        return;
    }
    const thumb = manifest.gallaryThumb ||
        `assets/images/gallary/${manifest.section}/${manifest.year}/${manifest.slug}.jpeg`;
    const thumbSrc = thumb.startsWith('assets/')
        ? `../../${thumb}`
        : `../../${thumb}`;
    // Reuse an existing placeholder card (same thumb or title) instead of inserting a duplicate.
    const filtrIdxForUpdate = html.indexOf('filtr-container');
    const thumbName = path.basename(thumb).replace(/\?.*$/, '');
    let matchAt = -1;
    if (thumbName)
        matchAt = html.indexOf(thumbName, filtrIdxForUpdate);
    if (matchAt === -1 && manifest.title) {
        matchAt = html.indexOf(manifest.title, filtrIdxForUpdate);
    }
    if (matchAt > filtrIdxForUpdate) {
        const tagAt = html.lastIndexOf('<a href="', matchAt);
        if (tagAt > filtrIdxForUpdate) {
            const hrefStart = tagAt + '<a href="'.length;
            const hrefEnd = html.indexOf('"', hrefStart);
            if (hrefEnd > hrefStart) {
                html = html.slice(0, hrefStart) + href + html.slice(hrefEnd);
                (0, layout_guards_1.assertYearNavIntact)(html);
                fs.writeFileSync(yearPage, html, 'utf-8');
                console.log(`Year card href updated (placeholder → trip) → ${yearPage}`);
                return;
            }
        }
    }
    const shortDate = manifest.dateRange ||
        (manifest.startDate
            ? new Date(manifest.startDate + 'T12:00:00').toLocaleString('en-US', {
                month: 'short',
                year: 'numeric',
            })
            : manifest.year);
    const card = `
								<div class="col-md-4">
										<div class="filtr-item">
											<a href="${href}">
												<img src="${thumbSrc}" alt="portfolio image"/>
											</a>
										<div class="item-title">
											<a>
												${escapeHtml(manifest.title)}
											</a>
											<p>${escapeHtml(shortDate)}</p>
										</div> <!-- /.item-title-->
									</div><!-- /.filtr-item -->
									</div><!-- /.col -->
`;
    // Insert after opening filtr-container row — newest first
    const filtrIdx = html.indexOf('filtr-container');
    if (filtrIdx === -1)
        throw new Error('filtr-container not found in year page');
    const rowIdx = html.indexOf('<div class="row">', filtrIdx);
    if (rowIdx === -1)
        throw new Error('gallery row not found');
    const insertAt = rowIdx + '<div class="row">'.length;
    html = html.slice(0, insertAt) + '\n' + card + html.slice(insertAt);
    (0, layout_guards_1.assertYearNavIntact)(html);
    fs.writeFileSync(yearPage, html, 'utf-8');
    console.log(`Year card inserted (newest first) → ${yearPage}`);
}
function writeTripPage(projectRoot, manifestPath) {
    const manifest = (0, manifest_1.loadManifest)(manifestPath);
    const htmlDir = path.join(projectRoot, 'Travel-Pages-Sub', manifest.section, manifest.year, manifest.slug);
    if (!fs.existsSync(htmlDir))
        fs.mkdirSync(htmlDir, { recursive: true });
    const pageFile = manifest.pages[0]?.file || `${manifest.slug}-1.html`;
    const outPath = path.join(htmlDir, pageFile);
    const html = renderTripHtml(manifest);
    (0, layout_guards_1.assertNoLeftoverBlankColumn)(html);
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`Wrote ${outPath}`);
    upsertYearCard(projectRoot, manifest);
    return outPath;
}
//# sourceMappingURL=render-trip.js.map