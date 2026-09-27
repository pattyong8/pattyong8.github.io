/* Promote existing year-dropdown links into chips. Do not rewrite hrefs. */
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

    function chip(href, label, active) {
        var a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (active) a.className = 'is-active';
        return a;
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

        var host = bars[0].parentNode;
        var nav = document.createElement('nav');
        var eras = document.createElement('div');
        var years = document.createElement('div');
        var activeYears = null;
        nav.className = 'scrapbook-list-nav';
        nav.setAttribute('aria-label', 'Years');
        eras.className = 'scrapbook-chip-row scrapbook-eras';
        years.className = 'scrapbook-chip-row scrapbook-years';

        Array.prototype.forEach.call(bars, function (bar) {
            var button = bar.querySelector('.dropbtn-travelbar');
            var links = bar.querySelectorAll('.dropdown-content-travelbar a');
            var active = button && button.classList.contains('activenotnumbermenu');
            var href = active ? location.pathname : hrefFromOnclick(button && button.getAttribute('onclick'));
            var label = button ? button.textContent.replace(/\s+/g, ' ').trim() : '';
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
        if (years.childNodes.length) nav.appendChild(years);
        host.parentNode.insertBefore(nav, host);
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
})();
