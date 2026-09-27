/* Shared scrapbook chrome: year-aware List link, Map link, active view. */
(function () {
    'use strict';

    var DEFAULT_LIST = 'Travel-Pages/20s/20s-2026.html';
    var SHELL_CSS = '/assets/css/scrapbook-shell.css?v=4';

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

    function isMapPath(pathname) {
        return /\/explore\.html(?:$|\?|#)/.test(pathname);
    }

    function injectShellCss() {
        if (document.querySelector('link[data-scrapbook-shell]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = siteRoot(location.pathname) + SHELL_CSS;
        link.setAttribute('data-scrapbook-shell', 'true');
        document.head.appendChild(link);
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
                    link.classList.toggle('is-active', isListPath(location.pathname));
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
        applyNav();
        var header = document.getElementById('header');
        if (header && !header.getAttribute('data-site-nav-observed')) {
            header.setAttribute('data-site-nav-observed', 'true');
            new MutationObserver(applyNav).observe(header, {
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
