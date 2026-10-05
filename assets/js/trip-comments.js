/* Trip comments: keep the familiar form, send to the existing Google Sheet,
 * and render published comments for this trip when they are available. */
(function () {
    'use strict';

    var SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbzPL6GTai2ZzBSdKywBP16xMo2ywD1mI95okaAHEv3rXfK6Zj7Txw4uCBzu7x0XPyAQ/exec';

    function tripSlug() {
        var parts = location.pathname.split('/').filter(Boolean);
        var file = parts[parts.length - 1] || '';
        var folder = parts[parts.length - 2] || '';
        if (/\.html$/i.test(file) && folder && folder !== 'Travel-Pages-Sub') {
            return decodeURIComponent(folder);
        }
        return decodeURIComponent(file.replace(/\.html$/i, ''));
    }

    function siteRoot() {
        var path = location.pathname;
        var idx = path.indexOf('/Travel-Pages-Sub/');
        if (idx === -1) return '';
        return path.slice(0, idx);
    }

    function ensureHidden(form, name, value) {
        var input = form.querySelector('[name="' + name + '"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
        }
        input.value = value;
    }

    function formatDate(value) {
        if (!value) return '';
        var date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function commentItem(comment) {
        var li = document.createElement('li');
        li.className = 'thread-alt depth-1 comment';
        li.innerHTML =
            '<div class="comment__content">' +
            '<div class="comment__info">' +
            '<div class="comment__author"></div>' +
            '<div class="comment__meta"><div class="comment__time"></div></div>' +
            '</div>' +
            '<div class="comment__text"><p></p></div>' +
            '</div>';
        li.querySelector('.comment__author').textContent = comment.name || 'Guest';
        li.querySelector('.comment__time').textContent = formatDate(comment.date) || '';
        li.querySelector('.comment__text p').textContent = comment.text || '';
        return li;
    }

    function isPlaceholderList(list) {
        var author = list.querySelector('.comment__author');
        return !author || /nothing yet/i.test(author.textContent || '');
    }

    function existingKeys(list) {
        var keys = {};
        [].forEach.call(list.querySelectorAll('.comment'), function (item) {
            var name = (item.querySelector('.comment__author') || {}).textContent || '';
            var text = (item.querySelector('.comment__text') || {}).textContent || '';
            keys[name.trim().toLowerCase() + '|' + text.trim().toLowerCase()] = true;
        });
        return keys;
    }

    function renderComments(comments) {
        var list = document.querySelector('.comments-wrap .commentlist');
        if (!list || !comments || !comments.length) return;
        var keys = existingKeys(list);
        var fresh = comments.filter(function (comment) {
            var key =
                String(comment.name || '').trim().toLowerCase() +
                '|' +
                String(comment.text || '').trim().toLowerCase();
            return comment.text && !keys[key];
        });
        if (!fresh.length) return;
        if (isPlaceholderList(list)) list.innerHTML = '';
        fresh.forEach(function (comment) {
            list.appendChild(commentItem(comment));
        });
    }

    function commentsForTrip(payload, slug) {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.comments)) {
            return payload.comments.filter(function (comment) {
                return !comment.trip || comment.trip === slug;
            });
        }
        if (payload[slug] && Array.isArray(payload[slug])) return payload[slug];
        return [];
    }

    function loadPublishedComments() {
        var slug = tripSlug();
        var jsonUrl = siteRoot() + '/assets/data/trip-comments.json';
        fetch(jsonUrl, { cache: 'no-store' })
            .then(function (res) {
                return res.ok ? res.json() : {};
            })
            .then(function (data) {
                renderComments(commentsForTrip(data, slug));
            })
            .catch(function () {});

        fetch(SCRIPT_URL + '?trip=' + encodeURIComponent(slug), { cache: 'no-store' })
            .then(function (res) {
                return res.ok ? res.json() : null;
            })
            .then(function (data) {
                renderComments(commentsForTrip(data, slug));
            })
            .catch(function () {});
    }

    function setStatus(form, message, ok) {
        var status = form.parentNode.querySelector('.trip-comment-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'trip-comment-status';
            form.parentNode.appendChild(status);
        }
        status.textContent = message;
        status.style.color = ok ? 'var(--sea-deep, #1f3d44)' : 'var(--muted, #7a8688)';
    }

    function enhanceForm() {
        var form =
            document.forms['submit-to-google-sheet'] ||
            document.querySelector('.comment-respond form');
        if (!form || form.getAttribute('data-trip-comments')) return;
        var clean = form.cloneNode(true);
        form.parentNode.replaceChild(clean, form);
        form = clean;
        form.setAttribute('data-trip-comments', '1');
        form.removeAttribute('onsubmit');
        form.removeAttribute('onSubmit');

        ensureHidden(form, 'cTrip', tripSlug());
        ensureHidden(form, 'cPage', location.pathname);

        var name = form.querySelector('[name="cName"]');
        var message = form.querySelector('[name="cMessage"]');
        if (name) name.required = true;
        if (message) message.required = true;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var who = name ? name.value.trim() : '';
            var text = message ? message.value.trim() : '';
            if (!who || !text) {
                setStatus(form, 'Add your name and a note first.', false);
                return;
            }
            var submit = form.querySelector('[type="submit"]');
            if (submit) submit.disabled = true;
            setStatus(form, 'Sending…', true);
            fetch(SCRIPT_URL, { method: 'POST', body: new FormData(form) })
                .then(function () {
                    renderComments([
                        { name: who, date: new Date().toISOString(), text: text },
                    ]);
                    form.reset();
                    ensureHidden(form, 'cTrip', tripSlug());
                    ensureHidden(form, 'cPage', location.pathname);
                    setStatus(form, 'Thank you. Your note is on its way.', true);
                })
                .catch(function () {
                    setStatus(form, 'That did not send. Please try again in a moment.', false);
                })
                .then(function () {
                    if (submit) submit.disabled = false;
                });
        });
    }

    function start() {
        if (!/\/Travel-Pages-Sub\//.test(location.pathname)) return;
        if (!document.querySelector('.comments-wrap')) return;
        enhanceForm();
        loadPublishedComments();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
