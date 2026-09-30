/* Home cover: entrance motion + header solidify on scroll. */
(function () {
    'use strict';

    if (!document.body.classList.contains('scrapbook-home')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function markReady() {
        document.body.classList.add('scrapbook-home-ready');
    }

    function bindHeaderScroll() {
        var shell = document.querySelector('header.scrapbook-shell');
        if (!shell) return;

        function onScroll() {
            var solid = window.scrollY > Math.max(48, window.innerHeight * 0.18);
            shell.classList.toggle('is-solid', solid);
            document.body.classList.toggle('scrapbook-home-scrolled', solid);
        }

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    function revealRecent() {
        var cards = document.querySelectorAll('.scrapbook-recent-grid a');
        if (!cards.length) return;
        if (reduce || !('IntersectionObserver' in window)) return;
        document.body.classList.add('scrapbook-home-animate');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-inview');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
        Array.prototype.forEach.call(cards, function (card, i) {
            card.style.transitionDelay = (i % 3) * 0.08 + 's';
            io.observe(card);
        });
    }

    function start() {
        bindHeaderScroll();
        revealRecent();
        if (reduce) {
            markReady();
            return;
        }
        requestAnimationFrame(function () {
            requestAnimationFrame(markReady);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // Header is injected async via jQuery .load — rebind when it appears
    var headerHost = document.getElementById('header');
    if (headerHost) {
        new MutationObserver(function () {
            bindHeaderScroll();
        }).observe(headerHost, { childList: true, subtree: true });
    }
})();
