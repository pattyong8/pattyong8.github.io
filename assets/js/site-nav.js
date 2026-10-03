/* Shared scrapbook chrome: year-aware List link, Map link, active view. */
(function () {
    'use strict';

    var DEFAULT_LIST = 'Travel-Pages/20s/20s-2026.html';
    var SHELL_CSS = '/assets/css/scrapbook-shell.css?v=23';
    var LIST_CSS = '/assets/css/scrapbook-list.css?v=21';
    var LIST_JS = '/assets/js/scrapbook-list.js?v=7';
    var TRIP_CSS = '/assets/css/travel-trip.css?v=24';

    var SECTION_PAGES = {
        'College-J&S': 'Travel-Pages/college/college-J-Sen.html',
        'College-F&S': 'Travel-Pages/college/college-F-Soph.html',
        'HighSchool': 'Travel-Pages/High-School/highschool-f-s.html',
        'MiddleSchool': 'Travel-Pages/High-School/highschool-f-s.html'
    };

    var ROOT_MARKERS = [
        '/Travel-Pages-Sub/',
        '/Travel-Pages/',
        '/Activities/',
        '/Reviews/',
        '/Blog/'
    ];

    function siteRoot(pathname) {
        var i, idx;
        for (i = 0; i < ROOT_MARKERS.length; i++) {
            idx = pathname.indexOf(ROOT_MARKERS[i]);
            if (idx !== -1) {
                return pathname.slice(0, idx);
            }
        }
        if (/\/index\.html$/i.test(pathname)) {
            return pathname.replace(/\/index\.html$/i, '');
        }
        if (pathname === '/' || pathname === '') {
            return '';
        }
        return '';
    }

    function listRel(pathname) {
        var decoded = decodeURIComponent(pathname);
        var yearGallery = decoded.match(/\/Travel-Pages\/(?:20s|college|High-School)\/[^/]+\.html$/);
        var sub;
        var section;
        var year;

        if (yearGallery) {
            return yearGallery[0].replace(/^\//, '');
        }

        sub = decoded.match(/\/Travel-Pages-Sub\/([^/]+)\/([^/]+)\//);
        if (sub) {
            section = sub[1];
            year = sub[2];
            if (section === '20s') {
                if (year === '2019-2020') {
                    return 'Travel-Pages/20s/20s-2019-20.html';
                }
                if (/^\d{4}$/.test(year)) {
                    return 'Travel-Pages/20s/20s-' + year + '.html';
                }
            }
            if (SECTION_PAGES[section]) {
                return SECTION_PAGES[section];
            }
        }

        return DEFAULT_LIST;
    }

    function isListPath(pathname) {
        return /\/Travel-Pages(?:-Sub)?\//.test(pathname);
    }

    function hasYearSelectors(pathname) {
        return isListPath(pathname) || /\/Activities\//.test(pathname) || /\/Blog\//.test(pathname);
    }

    function isMapPath(pathname) {
        return /\/explore\.html(?:$|\?|#)/.test(pathname);
    }

    function isHomePath(pathname) {
        return pathname === '/' || pathname === '' || /\/index\.html$/i.test(pathname);
    }

    function injectShellCss() {
        var href = siteRoot(location.pathname) + SHELL_CSS;
        var existing = document.querySelectorAll('link[href*="scrapbook-shell.css"]');
        var i;
        var hasCurrent = false;
        var linkHref;
        var link;
        for (i = 0; i < existing.length; i++) {
            linkHref = existing[i].getAttribute('href') || '';
            if (linkHref.indexOf('scrapbook-shell.css?v=23') !== -1) {
                existing[i].setAttribute('data-scrapbook-shell', 'true');
                hasCurrent = true;
            } else if (existing[i].parentNode) {
                existing[i].parentNode.removeChild(existing[i]);
            }
        }
        if (hasCurrent) return;
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-scrapbook-shell', 'true');
        document.head.appendChild(link);
    }

    function replaceStylesheet(href, fileName, currentQuery) {
        var existing = document.querySelectorAll('link[href*="' + fileName + '"]');
        var i;
        var hasCurrent = false;
        var linkHref;
        var link;
        for (i = 0; i < existing.length; i++) {
            linkHref = existing[i].getAttribute('href') || '';
            if (linkHref.indexOf(fileName + currentQuery) !== -1) {
                hasCurrent = true;
            } else if (existing[i].parentNode) {
                existing[i].parentNode.removeChild(existing[i]);
            }
        }
        if (hasCurrent) return;
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function injectLink(href, marker) {
        replaceStylesheet(href, marker.split('?')[0], '?' + (marker.split('?')[1] || ''));
    }

    function injectScript(src, marker) {
        if (document.querySelector('script[src*="' + marker + '"]')) return;
        var script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    }

    function injectListAssets() {
        if (!hasYearSelectors(location.pathname)) return;
        var root = siteRoot(location.pathname);
        replaceStylesheet(root + LIST_CSS, 'scrapbook-list.css', LIST_CSS.indexOf('?') === -1 ? '' : LIST_CSS.slice(LIST_CSS.indexOf('?')));
        injectScript(root + LIST_JS, 'scrapbook-list.js?v=7');
    }

    function injectTripCss() {
        if (!/\/Travel-Pages-Sub\//.test(location.pathname)) return;
        injectLink(siteRoot(location.pathname) + TRIP_CSS, 'travel-trip.css?v=24');
    }

    function ensureHomeLink(toggle, root) {
        var home;
        if (!toggle || toggle.querySelector('[data-nav="home"]')) return;
        home = document.createElement('a');
        home.setAttribute('data-nav', 'home');
        home.href = root + '/index.html';
        home.textContent = 'Home';
        toggle.insertBefore(home, toggle.firstChild);
    }

    function paintHeader() {
        var header = document.getElementById('header');
        var root;
        var toggle;
        if (!header) return;
        root = siteRoot(location.pathname);
        if (header.querySelector('header.scrapbook-shell') && !header.querySelector('.header-area, .logo')) {
            ensureHomeLink(header.querySelector('.scrapbook-toggle'), root);
            return;
        }
        header.innerHTML =
            '<header class="scrapbook-shell" role="banner">' +
                '<div class="scrapbook-shell-inner">' +
                    '<a class="scrapbook-logo" href="' + root + '/index.html">ONG<span>theroad</span></a>' +
                    '<nav class="scrapbook-toggle" aria-label="Ways to browse">' +
                        '<a data-nav="home" href="' + root + '/index.html">Home</a>' +
                        '<a data-nav="list" href="' + root + '/' + DEFAULT_LIST + '">List</a>' +
                        '<a data-nav="map" href="' + root + '/explore.html">Map</a>' +
                    '</nav>' +
                '</div>' +
            '</header>';
    }


    function isTripPath(pathname) {
        return /\/Travel-Pages-Sub\//.test(pathname);
    }

    function backLabel(rel) {
        var year = rel.match(/20s-(\d{4}|2019-20)\.html$/);
        if (year) return year[1];
        if (/college/i.test(rel)) return 'College';
        if (/High-School/i.test(rel)) return 'High School';
        return 'List';
    }

    function paintBack() {
        var inner = document.querySelector('#header .scrapbook-shell-inner');
        var root;
        var rel;
        var from = '';
        var label;
        var link;
        if (!inner || !isTripPath(location.pathname) || inner.querySelector('.scrapbook-back')) return;
        root = siteRoot(location.pathname);
        rel = listRel(location.pathname);
        try {
            var ref = new URL(document.referrer);
            if (ref.origin === location.origin) {
                if (isMapPath(ref.pathname)) from = 'map';
                else if (/\/Travel-Pages\/[^/]+\/[^/]+\.html$/.test(ref.pathname)) from = 'list';
            }
        } catch (e) { from = ''; }
        label = from === 'map' ? 'Map' : backLabel(rel);
        link = document.createElement('a');
        link.className = 'scrapbook-back';
        link.href = from === 'map' ? root + '/explore.html' : root + '/' + rel;
        link.setAttribute('aria-label', 'Back to ' + label);
        link.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg><span>' + label + '</span>';
        if (from && window.history.length > 1) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                window.history.back();
            });
        }
        inner.insertBefore(link, inner.querySelector('.scrapbook-toggle'));
    }

    function setDescription(text) {
        var desc = document.querySelector('meta[name="description"]');
        if (!text) return;
        if (desc && desc.getAttribute('content')) return;
        if (!desc) {
            desc = document.createElement('meta');
            desc.setAttribute('name', 'description');
            document.head.appendChild(desc);
        }
        desc.setAttribute('content', text);
    }

    function paintPageMeta() {
        var heading = document.querySelector('h1');
        var title = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
        var hero;
        var lead;
        var summary;
        if (isTripPath(location.pathname)) {
            hero = document.querySelector('.entry__post-thumb img');
            if (hero && title && !hero.getAttribute('alt')) {
                hero.setAttribute('alt', title);
            }
            Array.prototype.forEach.call(document.querySelectorAll('img[alt="portfolio image"]'), function (img) {
                img.setAttribute('alt', title ? title + ' photo' : 'Travel photo');
            });
            lead = document.querySelector('.entry__content .lead, .lead.drop-cap, .entry__content p');
            summary = lead ? lead.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
            setDescription(summary || (title ? title + ' on ONGtheroad' : ''));
            return;
        }
        if (title) setDescription(title + ' memories on ONGtheroad');
    }

    function applyNav() {
        var root = siteRoot(location.pathname);
        var listHref = root + '/' + listRel(location.pathname);
        var mapHref = root + '/explore.html';
        var links = document.querySelectorAll('a[data-nav="home"], a[data-nav="list"], a[data-nav="memories"], a[data-nav="map"]');
        var i;
        var link;
        var nav;
        var label;
        var homeHref = root + '/index.html';

        for (i = 0; i < links.length; i++) {
            link = links[i];
            nav = link.getAttribute('data-nav');
            label = link.textContent.replace(/\s+/g, ' ').trim();
            if (nav === 'home' || label === 'Home') {
                link.setAttribute('href', homeHref);
                if (link.closest('.scrapbook-toggle')) {
                    link.classList.toggle('is-active', isHomePath(location.pathname));
                }
            }
            if (nav === 'list' || nav === 'memories' || label === 'List' || label === 'Memories') {
                link.setAttribute('href', listHref);
                if (link.closest('.scrapbook-toggle')) {
                    link.classList.toggle('is-active', isListPath(location.pathname) && !isTripPath(location.pathname));
                }
            }
            if (nav === 'map' || label === 'Map') {
                link.setAttribute('href', mapHref);
                if (link.closest('.scrapbook-toggle')) {
                    link.classList.toggle('is-active', isMapPath(location.pathname));
                }
            }
        }
    }

    function start() {
        if (isTripPath(location.pathname) && document.body) {
            document.body.classList.add('scrapbook-trip');
        }
        injectShellCss();
        injectListAssets();
        injectTripCss();
        paintHeader();
        paintBack();
        applyNav();
        paintPageMeta();
        var header = document.getElementById('header');
        if (header && !header.getAttribute('data-site-nav-observed')) {
            header.setAttribute('data-site-nav-observed', 'true');
            new MutationObserver(function () {
                injectShellCss();
                injectListAssets();
                injectTripCss();
                paintHeader();
                paintBack();
                applyNav();
            }).observe(header, {
                childList: true,
                subtree: true
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
