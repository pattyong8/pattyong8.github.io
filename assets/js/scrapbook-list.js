/* Promote existing year-dropdown links into chapter / year nav. Do not rewrite hrefs. */
(function () {
    'use strict';

    function hrefFromOnclick(onclick) {
        var match = String(onclick || '').match(/href\s*=\s*['"]([^'"]+)['"]/i);
        return match ? match[1] : '';
    }

    function samePage(href) {
        if (!href) return false;
        try {
            var url = new URL(href, location.href);
            return url.pathname === location.pathname;
        } catch (err) {
            return false;
        }
    }

    function chapterLabel(raw) {
        var label = String(raw || '').replace(/\s+/g, ' ').trim();
        if (label === '20s') return 'My 20s';
        return label;
    }

    function chip(href, label, active) {
        var a = document.createElement('a');
        a.href = href || '#';
        a.textContent = label;
        if (active) a.className = 'is-active';
        return a;
    }

    function eraRangeLabel() {
        var heading = document.querySelector('.gallary-header .memories-home h1, .gallary-header h1');
        var raw = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
        var match = raw.match(/(\d{4})\s*[-–]\s*(\d{2,4})/);
        var end;
        if (!match) return '';
        end = match[2].length === 2 ? match[1].slice(0, 2) + match[2] : match[2];
        return match[1] + ' to ' + end;
    }

    function hasChipNav() {
        return !!document.querySelector('.scrapbook-chip-row, .scrapbook-list-nav .scrapbook-chip-row');
    }

    function hasTextNav() {
        var nav = document.querySelector('.scrapbook-list-nav');
        return !!(nav && nav.querySelector('.journal-chapters, .scrapbook-eras') && !nav.querySelector('.scrapbook-chip-row'));
    }

    function removeNavs() {
        Array.prototype.forEach.call(document.querySelectorAll('.scrapbook-list-nav'), function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }

    function enhanceCards() {
        Array.prototype.forEach.call(document.querySelectorAll('.filtr-item'), function (item) {
            var imageLink = item.querySelector('a[href]');
            var titleLink = item.querySelector('.item-title a');
            if (imageLink && titleLink && !titleLink.getAttribute('href')) {
                titleLink.setAttribute('href', imageLink.getAttribute('href'));
            }
        });
    }

    function enhanceNav() {
        var bars = document.querySelectorAll('.dropdown-travelbar');
        if (!bars.length) return;
        if (hasTextNav() && !hasChipNav()) return;

        removeNavs();

        var host = bars[0].parentNode;
        var nav = document.createElement('nav');
        var eras = document.createElement('div');
        var years = document.createElement('div');
        var activeYears = null;
        var range;
        var rangeEl;
        nav.className = 'scrapbook-list-nav';
        nav.setAttribute('aria-label', 'Browse memories');
        eras.className = 'journal-chapters scrapbook-eras';
        eras.setAttribute('aria-label', 'Life chapters');
        years.className = 'journal-years scrapbook-years';
        years.setAttribute('aria-label', 'Years');

        Array.prototype.forEach.call(bars, function (bar) {
            var button = bar.querySelector('.dropbtn-travelbar');
            var links = bar.querySelectorAll('.dropdown-content-travelbar a');
            var active = button && button.classList.contains('activenotnumbermenu');
            var href = active ? location.pathname : hrefFromOnclick(button && button.getAttribute('onclick'));
            var label = chapterLabel(button && button.textContent);
            if (!href && links.length) href = links[0].getAttribute('href');
            if (href && label) eras.appendChild(chip(href, label, active));
            if (active && links.length) activeYears = links;
            bar.classList.add('scrapbook-legacy-nav');
        });

        if (activeYears) {
            Array.prototype.forEach.call(activeYears, function (link) {
                var href = link.getAttribute('href');
                years.appendChild(chip(href, link.textContent.replace(/\s+/g, ' ').trim(), samePage(href) || link.classList.contains('activenotnumbermenu')));
            });
        }

        if (eras.childNodes.length) nav.appendChild(eras);
        if (years.childNodes.length) {
            nav.appendChild(years);
        } else {
            range = eraRangeLabel();
            rangeEl = document.createElement('p');
            rangeEl.className = 'scrapbook-era-range';
            rangeEl.textContent = range || 'All memories in this chapter';
            nav.appendChild(rangeEl);
        }
        if (host.parentNode && host.parentNode.classList && host.parentNode.classList.contains('text-center') && host.classList.contains('memories-home')) {
            host.parentNode.parentNode.insertBefore(nav, host.parentNode);
            host.parentNode.classList.add('scrapbook-legacy-nav');
        } else {
            host.parentNode.insertBefore(nav, host);
        }
        host.classList.add('scrapbook-legacy-nav');
    }

    function start() {
        if (!document.querySelector('.dropdown-travelbar')) return;
        document.body.classList.add('scrapbook-list');
        enhanceNav();
        enhanceCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
    window.addEventListener('load', start);
    setTimeout(start, 0);
    setTimeout(start, 300);
})();
