/* Shared scrapbook chrome: year-aware List link, Map link, active view. */
(function () {
    'use strict';

    var DEFAULT_LIST = 'Travel-Pages/20s/20s-2026.html';
    var SHELL_CSS = '/assets/css/scrapbook-shell.css?v=32';
    var LIST_CSS = '/assets/css/scrapbook-list.css?v=13';
    var LIST_JS = '/assets/js/scrapbook-list.js?v=6';
    var TRIP_CSS = '/assets/css/travel-trip.css?v=7';

    var SECTION_PAGES = {
        'College-J&S': 'Travel-Pages/college/college-J-Sen.html',
        'College-F&S': 'Travel-Pages/college/college-F-Soph.html',
        'HighSchool': 'Travel-Pages/High-School/highschool-f-s.html'
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

    function injectShellCss() {
        var href = siteRoot(location.pathname) + SHELL_CSS;
        var existing = document.querySelectorAll('link[href*="scrapbook-shell.css"]');
        var i;
        var hasCurrent = false;
        var linkHref;
        var link;
        for (i = 0; i < existing.length; i++) {
            linkHref = existing[i].getAttribute('href') || '';
            if (linkHref.indexOf('scrapbook-shell.css?v=32') !== -1) {
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
        injectScript(root + LIST_JS, 'scrapbook-list.js?v=6');
    }

    function injectTripCss() {
        if (!/\/Travel-Pages-Sub\//.test(location.pathname)) return;
        injectLink(siteRoot(location.pathname) + TRIP_CSS, 'travel-trip.css?v=7');
    }

    function isHomePath(pathname) {
        return /\/(?:index\.html)?$/.test(pathname) || pathname === '/' || pathname === '';
    }

    function paintHeader() {
        var header = document.getElementById('header');
        var root;
        var overlay;
        var shell;
        if (!header) return;
        shell = header.querySelector('header.scrapbook-shell');
        if (shell && !header.querySelector('.header-area, .logo')) {
            shell.classList.toggle('scrapbook-shell-overlay', document.body.classList.contains('scrapbook-home'));
            return;
        }
        root = siteRoot(location.pathname);
        overlay = document.body.classList.contains('scrapbook-home') || isHomePath(location.pathname);
        header.innerHTML =
            '<header class="scrapbook-shell' + (overlay ? ' scrapbook-shell-overlay' : '') + '" role="banner">' +
                '<div class="scrapbook-shell-inner">' +
                    '<a class="scrapbook-logo" href="' + root + '/index.html">ONG<span>theroad</span></a>' +
                    '<nav class="scrapbook-toggle" aria-label="Ways to browse">' +
                        '<a data-nav="list" href="' + root + '/' + DEFAULT_LIST + '">List</a>' +
                        '<a data-nav="map" href="' + root + '/explore.html">Map</a>' +
                    '</nav>' +
                '</div>' +
            '</header>';
    }

    function applyNav() {
        var root = siteRoot(location.pathname);
        var listHref = root + '/' + listRel(location.pathname);
        var mapHref = root + '/explore.html';
        var links = document.querySelectorAll('a[data-nav="list"], a[data-nav="memories"], a[data-nav="map"]');
        var i;
        var link;
        var nav;
        var label;

        for (i = 0; i < links.length; i++) {
            link = links[i];
            nav = link.getAttribute('data-nav');
            label = link.textContent.replace(/\s+/g, ' ').trim();
            if (nav === 'list' || nav === 'memories' || label === 'List' || label === 'Memories') {
                link.setAttribute('href', listHref);
                if (link.closest('.scrapbook-toggle')) {
                    link.classList.toggle('is-active', isListPath(location.pathname) || isHomePath(location.pathname));
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
        injectShellCss();
        injectListAssets();
        injectTripCss();
        paintHeader();
        applyNav();
        var header = document.getElementById('header');
        if (header && !header.getAttribute('data-site-nav-observed')) {
            header.setAttribute('data-site-nav-observed', 'true');
            new MutationObserver(function () {
                injectShellCss();
                injectListAssets();
                injectTripCss();
                paintHeader();
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
