(function () {
    'use strict';

    var root = document.getElementById('scrapbook-next');
    if (!root) return;

    fetch('assets/data/next-trip.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var title = (data && data.title) ? String(data.title).trim() : '';
            var date = data && data.date ? new Date(data.date) : null;
            var place = (data && data.place) ? String(data.place).trim() : '';
            var label = root.querySelector('[data-next-label]');
            var valid = title && date && !isNaN(date.getTime()) && date.getTime() > Date.now();
            var days;
            var line;

            if (!valid) {
                root.classList.remove('is-visible');
                return;
            }

            days = Math.ceil((date.getTime() - Date.now()) / 86400000);
            line = title;
            if (place) line += ' · ' + place;
            if (days === 1) line += ' in 1 day';
            else if (days > 1) line += ' in ' + days + ' days';
            else line += ' today';

            if (label) label.textContent = line;
            root.classList.add('is-visible');
        })
        .catch(function () {
            root.classList.remove('is-visible');
        });
})();
