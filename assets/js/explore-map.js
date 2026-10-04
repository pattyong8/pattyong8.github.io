(function () {
    'use strict';

    // The US is drawn as states. Every other country, including Canada, stays one shape.
    var ADMIN1 = { US: true };

    var state = {
        data: null,
        map: null,
        cluster: null,
        regionLayer: null,
        markers: {},
        activeId: null,
        countryFilter: '',
        regionFilter: '',
        typeFilter: '',
        activityFilter: '',
        sheet: 'peek'
    };

    var ACTIVITY_TAGS = { ski: 1, scuba: 1, climb: 1, golf: 1 };
    var TYPE_TAGS = { family: 1, friends: 1, work: 1, solo: 1 };
    var FILTER_LABEL = {
        family: 'Family destinations',
        friends: 'Friends destinations',
        work: 'Work destinations',
        solo: 'Solo destinations',
        ski: 'Ski destinations',
        scuba: 'Scuba destinations',
        climb: 'Climb destinations',
        golf: 'Golf destinations'
    };

    function currentFilter() {
        return state.activityFilter || state.typeFilter || '';
    }

    function tripHasActivity(trip) {
        if (!state.activityFilter) return true;
        return (trip.activities || []).indexOf(state.activityFilter) !== -1;
    }

    function tripMatchesFilters(trip) {
        if (state.typeFilter && trip.type !== state.typeFilter) return false;
        return tripHasActivity(trip);
    }

    function placeMatchesType(place) {
        return place.trips.some(tripMatchesFilters);
    }

    function tripsForPlace(place) {
        if (!state.typeFilter && !state.activityFilter) return place.trips;
        return place.trips.filter(tripMatchesFilters);
    }

    function visiblePlaces() {
        return state.data.places.filter(function (place) {
            if (state.countryFilter && place.iso !== state.countryFilter) return false;
            if (state.regionFilter && place.region !== state.regionFilter) return false;
            return placeMatchesType(place);
        });
    }

    function placesInMapView() {
        var places = visiblePlaces();
        if (!state.map) return places;
        var bounds = state.map.getBounds();
        if (!bounds || !bounds.isValid()) return places;
        return places.filter(function (place) {
            return place.lat != null && place.lng != null && bounds.contains([place.lat, place.lng]);
        });
    }

    function tripCountLabel(n) {
        return n === 1 ? '1 memory' : n + ' memories';
    }

    function coverFor(place) {
        var trip = tripsForPlace(place).filter(function (item) { return item.thumb; })[0];
        if (!trip) trip = place.trips.filter(function (item) { return item.thumb; })[0];
        return trip ? trip.thumb : '';
    }

    function placeById(id) {
        return state.data.places.filter(function (place) { return place.id === id; })[0];
    }

    function placesForIso(iso) {
        return state.data.places.filter(function (place) {
            return place.iso === iso && placeMatchesType(place);
        });
    }

    function placesForRegion(iso, region) {
        return state.data.places.filter(function (place) {
            return place.iso === iso && place.region === region && placeMatchesType(place);
        });
    }

    function placesForFeature(props) {
        if (!props) return [];
        if (props.kind === 'admin1') return placesForRegion(props.iso, props.region);
        return placesForIso(props.iso);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function isMobile() {
        return window.innerWidth <= 767;
    }

    function panelEl() {
        return document.getElementById('explore-panel');
    }

    // Snap heights for the mobile bottom sheet, in pixels.
    // Peek is stats + one horizontal chip row above the dock.
    function sheetHeights() {
        var shellH = panelEl().parentNode.getBoundingClientRect().height;
        var dock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-height')) || 76;
        return { peek: 130 + dock, half: Math.round(shellH * 0.52), full: Math.round(shellH - 8) };
    }

    function setSheet(name) {
        var panel = panelEl();
        state.sheet = name;
        panel.style.height = '';
        panel.setAttribute('data-sheet', name);
        panel.classList.remove('is-collapsed');
    }

    function openSheet() {
        if (isMobile() && state.sheet === 'peek') setSheet('half');
    }

    function mapPadding() {
        if (isMobile()) {
            return { paddingTopLeft: [16, 64], paddingBottomRight: [16, sheetHeights()[state.sheet] + 16] };
        }
        return { paddingTopLeft: [blockedLeft() + 16, 48], paddingBottomRight: [48, 48] };
    }

    // Desktop keeps the zoom-2 Atlantic frame. Phones fit the full world into
    // the open strip above the sheet (fractional zoom; desktop stays snapped).
    var WORLD_ZOOM = 2;
    var WORLD_FOCUS = [20, 0];

    function worldZoom() {
        if (!isMobile()) return WORLD_ZOOM;
        if (!state.map) return 0.75;
        var size = state.map.getSize();
        var sheet = sheetHeights().peek;
        var availW = Math.max(200, size.x - 24);
        var availH = Math.max(160, size.y - sheet - 56);
        // World pixel size at zoom z is 256 * 2^z. Prefer width fit, then height.
        var zW = Math.log(availW / 256) / Math.LN2;
        var zH = Math.log(availH / 256) / Math.LN2;
        var z = Math.min(zW, zH);
        if (!isFinite(z)) z = 0.75;
        return Math.max(0.5, Math.min(1.25, Math.round(z * 4) / 4));
    }

    function applyMinZoom() {
        if (!state.map) return;
        if (isMobile()) {
            state.map.setMinZoom(0.5);
            state.map.options.zoomSnap = 0.25;
        } else {
            state.map.setMinZoom(WORLD_ZOOM);
            state.map.options.zoomSnap = 1;
        }
    }

    function blockedLeft() {
        if (isMobile() || !state.map) return 0;
        var panel = panelEl();
        if (!panel) return 0;
        var mapRect = state.map.getContainer().getBoundingClientRect();
        var panelRect = panel.getBoundingClientRect();
        return Math.max(0, panelRect.right - mapRect.left);
    }

    // Shift the camera so the focus sits in the open map: beside the desktop
    // list, or above the mobile sheet.
    function centerInOpenMap(latlng, zoom) {
        if (!state.map) return L.latLng(latlng);
        var pt = state.map.project(latlng, zoom);
        if (isMobile()) {
            var size = state.map.getSize();
            var sheet = sheetHeights()[state.sheet] || 0;
            var openMidY = Math.max(48, (size.y - sheet) / 2);
            var shiftY = size.y / 2 - openMidY;
            if (shiftY > 0) pt = L.point(pt.x, pt.y + shiftY);
            return state.map.unproject(pt, zoom);
        }
        var shift = blockedLeft() / 2;
        if (!shift) return L.latLng(latlng);
        return state.map.unproject(L.point(pt.x - shift, pt.y), zoom);
    }

    var tuckingVoid = false;

    function hideCanvasVoid() {
        if (!state.map || tuckingVoid) return;
        // On phones the sheet already crops the frame. Tucking the arctic
        // void would slide the world view back under the sheet.
        if (isMobile() && !state.countryFilter && state.map.getZoom() <= WORLD_ZOOM + 0.01) return;
        var top = state.map.getPixelBounds().min.y;
        if (top >= 0) return;
        tuckingVoid = true;
        state.map.panBy([0, top], { animate: false });
        tuckingVoid = false;
    }

    function showWorld(animate) {
        if (!state.map) return;
        if (isMobile()) setSheet('peek');
        applyMinZoom();
        state.map.invalidateSize();
        var zoom = worldZoom();
        var center = centerInOpenMap(WORLD_FOCUS, zoom);
        if (animate) {
            state.map.once('moveend', hideCanvasVoid);
            state.map.flyTo(center, zoom, { duration: 0.55 });
            return;
        }
        state.map.setView(center, zoom, { animate: false });
        hideCanvasVoid();
    }

    function mercatorY(lat) {
        var s = Math.sin(lat * Math.PI / 180);
        return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
    }

    // Frame every place in the open map. Wrapped groups (US + Japan)
    // use the shorter arc and flyTo, not Leaflet flyToBounds.
    function fitPlaces(places, animate) {
        if (!places.length || !state.map) return;
        if (places.length === 1) {
            flyToPlace(places[0]);
            return;
        }
        var ext = placeExtent(places);
        if (!ext) {
            showWorld(!!animate);
            return;
        }

        var south = ext.south;
        var north = Math.min(ext.north, 60);
        var west = ext.west;
        var east = ext.east;
        var lngSpan = east - west;
        if (lngSpan <= 0) lngSpan += 360;
        lngSpan = Math.max(lngSpan, 14);
        // US + Japan and similar groups need the world frame so every
        // pin stays on screen. Leaflet cannot flyToBounds across 180.
        if (east > 180 || lngSpan > 150) {
            showWorld(!!animate);
            return;
        }

        var padLng = lngSpan * 0.18;
        west -= padLng;
        east += padLng;
        lngSpan = east - west;

        var midLat = (south + north) / 2;
        var midLng = (west + east) / 2;
        while (midLng > 180) midLng -= 360;
        while (midLng < -180) midLng += 360;

        var pad = mapPadding();
        var size = state.map.getSize();
        var availW = Math.max(160, size.x - pad.paddingTopLeft[0] - pad.paddingBottomRight[0]);
        var availH = Math.max(160, size.y - pad.paddingTopLeft[1] - pad.paddingBottomRight[1]);
        var zoomLng = Math.log(availW * 360 / (lngSpan * 256)) / Math.LN2;
        var latFrac = Math.abs(mercatorY(south) - mercatorY(north));
        if (latFrac < 0.04) latFrac = 0.04;
        var zoomLat = Math.log(availH / (latFrac * 256)) / Math.LN2;
        var zoom = Math.max(worldZoom(), Math.min(5, Math.floor(Math.min(zoomLng, zoomLat))));
        if (!isFinite(zoom)) zoom = worldZoom();

        var center = centerInOpenMap([midLat, midLng], zoom);
        function settle() {
            hideCanvasVoid();
            nudgePlacesIntoView(places);
        }
        if (animate) {
            state.map.flyTo(center, zoom, { duration: 0.55 });
            setTimeout(settle, 650);
            return;
        }
        state.map.setView(center, zoom, { animate: false });
        settle();
    }

    function nudgePlacesIntoView(places) {
        if (!state.map || isMobile()) return;
        var size = state.map.getSize();
        var left = blockedLeft() + 28;
        var right = size.x - 28;
        var minX = Infinity;
        var maxX = -Infinity;
        places.forEach(function (place) {
            var pt = state.map.latLngToContainerPoint([place.lat, place.lng]);
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
        });
        if (!isFinite(maxX)) return;
        var dx = 0;
        if (maxX > right) dx -= maxX - right;
        if (minX + dx < left) dx += left - (minX + dx);
        if (Math.abs(dx) > 2) state.map.panBy([dx, 0], { animate: false });
    }

    // Keep a pin clear of the sheet after a tap on the map.
    function revealPlace(place) {
        var shellH = panelEl().parentNode.getBoundingClientRect().height;
        var occupied = sheetHeights()[state.sheet];
        var top = 70;
        var bottom = shellH - occupied - 28;
        var pt = state.map.latLngToContainerPoint([place.lat, place.lng]);
        if (pt.y > bottom || pt.y < top) {
            state.map.panBy([0, pt.y - (top + bottom) / 2], { animate: true, duration: 0.35 });
        }
    }

    function renderStats() {
        var source = currentFilter() ? visiblePlaces() : state.data.places;
        var trips = {};
        var countries = {};
        source.forEach(function (place) {
            countries[place.iso] = true;
            tripsForPlace(place).forEach(function (trip) {
                trips[trip.href + '|' + trip.title + '|' + trip.dateRange] = true;
            });
        });
        if (currentFilter()) {
            document.getElementById('explore-stats').textContent =
                source.length + ' places · ' +
                Object.keys(trips).length + ' memories';
        } else {
            document.getElementById('explore-stats').textContent =
                Object.keys(countries).length + ' countries · ' +
                source.length + ' places · ' +
                Object.keys(trips).length + ' memories';
        }
    }

    function typeListLabel() {
        return FILTER_LABEL[currentFilter()] || 'Destinations';
    }

    function renderTagChips() {
        var current = currentFilter();
        Array.prototype.forEach.call(document.querySelectorAll('.explore-tag-row [data-filter]'), function (button) {
            var on = button.getAttribute('data-filter') === current;
            button.classList.toggle('is-active', on);
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function applyFilters() {
        if (state.activeId) {
            var place = placeById(state.activeId);
            if (place && placeMatchesType(place)) {
                renderDetail(place);
                showDetail();
            } else {
                state.activeId = null;
                showList();
            }
        } else {
            showList();
        }
        if (!state.activeId && state.regionFilter && !placesForRegion(state.countryFilter, state.regionFilter).length) {
            state.regionFilter = '';
        }
        if (!state.activeId && state.countryFilter && !placesForIso(state.countryFilter).length) {
            state.countryFilter = '';
            state.regionFilter = '';
        }
        refresh();
    }

    function setFilter(value) {
        value = value || '';
        if (ACTIVITY_TAGS[value]) {
            state.activityFilter = value;
            state.typeFilter = '';
        } else if (TYPE_TAGS[value]) {
            state.typeFilter = value;
            state.activityFilter = '';
        } else {
            state.typeFilter = '';
            state.activityFilter = '';
        }
        var hadPlace = !!state.activeId || !!currentHash();
        state.activeId = null;
        state.countryFilter = '';
        state.regionFilter = '';
        applyFilters();
        if (hadPlace) setHash('', 'push');
        fitToFilter();
    }

    function fitToFilter() {
        var places = visiblePlaces();
        if (!places.length || !state.map) return;
        state.map.invalidateSize();
        if (!currentFilter()) {
            showWorld(true);
            return;
        }
        flyToGroup(places);
    }

    function tripKey(trip) {
        return (trip.href || '') + '|' + (trip.title || '');
    }

    function cityShortName(place) {
        return String(place.name || '').split(',')[0].trim() || place.name;
    }

    function majorityCountry(places) {
        var counts = {};
        var best = places[0];
        places.forEach(function (place) {
            var key = place.iso || place.country;
            if (!counts[key]) counts[key] = { place: place, n: 0 };
            counts[key].n += 1;
            if (counts[key].n > counts[best.iso || best.country].n) best = place;
        });
        return best;
    }

    // Cities that exist on the map only because they share one trip become
    // a single list row. Pins stay. Cities with more than one memory stay.
    function listEntries(places) {
        var byTrip = {};
        var used = {};
        var entries = [];

        places.forEach(function (place) {
            var trips = tripsForPlace(place);
            var key;
            if (trips.length !== 1) return;
            key = tripKey(trips[0]);
            if (!byTrip[key]) byTrip[key] = { trip: trips[0], places: [] };
            byTrip[key].places.push(place);
        });

        places.forEach(function (place) {
            var trips = tripsForPlace(place);
            var group;
            var host;
            if (used[place.id]) return;
            if (trips.length === 1) {
                group = byTrip[tripKey(trips[0])];
                if (group && group.places.length > 1) {
                    group.places.forEach(function (item) { used[item.id] = true; });
                    group.places.sort(function (a, b) {
                        return cityShortName(a).localeCompare(cityShortName(b));
                    });
                    host = majorityCountry(group.places);
                    entries.push({
                        kind: 'trip',
                        trip: group.trip,
                        places: group.places,
                        country: host.country,
                        iso: host.iso,
                        sort: 1,
                        name: group.trip.title
                    });
                    return;
                }
            }
            used[place.id] = true;
            entries.push({
                kind: 'place',
                place: place,
                country: place.country,
                iso: place.iso,
                sort: trips.length,
                name: place.name
            });
        });

        return entries;
    }

    function renderList() {
        var list = document.getElementById('explore-place-list');
        var label = document.getElementById('explore-list-label');
        var available = visiblePlaces();
        var places = placesInMapView();
        var entries = listEntries(places);
        var sig = places.map(function (place) { return place.id; }).join('|') +
            '|' + state.typeFilter + '|' + state.activityFilter + '|' + state.countryFilter + '|' + state.regionFilter;
        if (label) {
            label.textContent = typeListLabel();
            label.hidden = !currentFilter();
        }
        if (list.getAttribute('data-sig') === sig) return;
        list.setAttribute('data-sig', sig);
        if (!places.length) {
            list.innerHTML = available.length
                ? '<p class="explore-lede">No destinations in view.</p>'
                : '<p class="explore-lede">No destinations in that group yet.</p>';
            return;
        }

        var groups = {};
        entries.forEach(function (entry) {
            var key = entry.iso || entry.country;
            if (!groups[key]) groups[key] = { name: entry.country, iso: entry.iso, entries: [], trips: 0 };
            groups[key].entries.push(entry);
            groups[key].trips += entry.sort;
        });

        var order = Object.keys(groups).sort(function (a, b) {
            return groups[b].trips - groups[a].trips || groups[a].name.localeCompare(groups[b].name);
        });

        var html = '';
        if (state.countryFilter) {
            html += '<button class="explore-back" id="explore-list-back" type="button">All places</button>';
        }

        order.forEach(function (key) {
            var group = groups[key];
            group.entries.sort(function (a, b) {
                return b.sort - a.sort || a.name.localeCompare(b.name);
            });
            html += '<section class="explore-country-group">';
            html += '<button type="button" class="explore-country-label" data-iso="' + escapeHtml(group.iso) + '">' +
                escapeHtml(group.name) + '</button>';
            html += group.entries.map(function (entry) {
                var thumb;
                var cities;
                if (entry.kind === 'trip') {
                    thumb = entry.trip.thumb || coverFor(entry.places[0]);
                    cities = entry.places.map(cityShortName).join(' \u00b7 ');
                    return '<button class="explore-place-row" data-trip-href="' + escapeHtml(entry.trip.href) + '">' +
                        (thumb ? '<img class="explore-thumb" src="' + thumb + '" alt="">' : '<span class="explore-thumb"></span>') +
                        '<span class="explore-place-copy"><strong>' + escapeHtml(entry.trip.title) + '</strong>' +
                        '<span>' + escapeHtml(cities) + '</span></span></button>';
                }
                thumb = coverFor(entry.place);
                return '<button class="explore-place-row" data-place="' + entry.place.id + '">' +
                    (thumb ? '<img class="explore-thumb" src="' + thumb + '" alt="">' : '<span class="explore-thumb"></span>') +
                    '<span class="explore-place-copy"><strong>' + escapeHtml(entry.place.name) + '</strong>' +
                    '<span>' + tripCountLabel(entry.sort) + '</span></span></button>';
            }).join('');
            html += '</section>';
        });

        list.innerHTML = html;

        var back = document.getElementById('explore-list-back');
        if (back) {
            back.addEventListener('click', function () {
                clearPlace();
                fitToVisible(true);
            });
        }
        Array.prototype.forEach.call(list.querySelectorAll('.explore-country-label[data-iso]'), function (button) {
            button.addEventListener('click', function () {
                selectCountry(button.getAttribute('data-iso'), true);
            });
        });
        Array.prototype.forEach.call(list.querySelectorAll('[data-place]'), function (row) {
            row.addEventListener('click', function () {
                selectPlace(row.getAttribute('data-place'), true);
            });
        });
        Array.prototype.forEach.call(list.querySelectorAll('[data-trip-href]'), function (row) {
            row.addEventListener('click', function () {
                window.location.href = row.getAttribute('data-trip-href');
            });
        });
    }

    function renderPreview(place) {
        var el = document.getElementById('explore-preview');
        var thumb = coverFor(place);
        if (!el) return;
        el.innerHTML =
            '<button type="button" class="explore-preview-main" id="explore-preview-main">' +
            (thumb ? '<img class="explore-preview-photo" src="' + thumb + '" alt="">' : '<span class="explore-preview-photo"></span>') +
            '<span class="explore-preview-copy"><small>' + escapeHtml(place.country) + '</small>' +
            '<strong>' + escapeHtml(place.name) + '</strong>' +
            '<span>' + tripCountLabel(tripsForPlace(place).length) + ' \u00b7 swipe up to open</span></span></button>' +
            '<button type="button" class="explore-preview-close" id="explore-preview-close" aria-label="Clear selection">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg></button>';
        document.getElementById('explore-preview-main').addEventListener('click', function () {
            setSheet('half');
        });
        document.getElementById('explore-preview-close').addEventListener('click', function () {
            clearPlace();
            fitToVisible(true);
        });
    }

    function renderDetail(place) {
        var trips = tripsForPlace(place);
        var cover = coverFor(place);
        var rows = trips.map(function (trip) {
            var bits = [trip.dateRange || trip.year, trip.people].filter(Boolean);
            return '<a class="explore-trip-row" href="' + trip.href + '">' +
                (trip.thumb ? '<img class="explore-thumb" src="' + trip.thumb + '" alt="">' : '<span class="explore-thumb"></span>') +
                '<span class="explore-place-copy"><strong>' + escapeHtml(trip.title) + '</strong>' +
                '<span class="explore-trip-meta">' + escapeHtml(bits.join(' \u00b7 ')) + '</span></span></a>';
        }).join('');
        if (!rows) {
            rows = '<p class="explore-lede">No memories in that group at this place.</p>';
        }

        document.getElementById('explore-detail-view').innerHTML =
            '<button class="explore-back" id="explore-back" type="button">All places</button>' +
            '<div class="explore-detail">' +
            (cover ? '<img class="explore-cover" src="' + cover + '" alt="">' : '') +
            '<div class="explore-detail-kicker">' + escapeHtml(place.country) + '</div>' +
            '<h2>' + escapeHtml(place.name) + '</h2>' +
            '<p class="explore-lede">' + tripCountLabel(trips.length) + '</p>' +
            rows + '</div>';
        document.getElementById('explore-back').addEventListener('click', function () {
            clearPlace();
            fitToVisible(true);
        });
        renderPreview(place);
    }

    function showList() {
        document.getElementById('explore-list-view').hidden = false;
        document.getElementById('explore-detail-view').hidden = true;
    }

    function showDetail(keepSheet) {
        document.getElementById('explore-list-view').hidden = true;
        document.getElementById('explore-detail-view').hidden = false;
        if (!keepSheet) openSheet();
    }

    function markerIcon(place, active) {
        var size = active ? 40 : 28;
        return L.divIcon({
            className: 'explore-marker-wrap',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: '<div class="explore-marker' + (active ? ' is-active' : '') + '">' +
                '<span class="explore-marker-core"></span>' +
                (active ? '<span class="explore-marker-label">' + escapeHtml(place.name) + '</span>' : '') +
                '</div>'
        });
    }

    function refreshMarkers() {
        var visible = {};
        var add = [];
        var remove = [];
        visiblePlaces().forEach(function (place) { visible[place.id] = true; });
        Object.keys(state.markers).forEach(function (id) {
            var marker = state.markers[id];
            var show = !!visible[id];
            var has = state.cluster.hasLayer(marker);
            var active = id === state.activeId;
            var sig = active ? '!' : '.';
            if (show && !has) add.push(marker);
            if (!show && has) remove.push(marker);
            if (marker._sig !== sig) {
                marker._sig = sig;
                marker.setIcon(markerIcon(placeById(id), active));
            }
            marker.setZIndexOffset(active ? 1000 : 0);
        });
        if (remove.length) state.cluster.removeLayers(remove);
        if (add.length) state.cluster.addLayers(add);
    }

    // Smallest zoom at which a place stands clear of its neighbours.
    function separationZoom(place, minZoom) {
        var others = visiblePlaces().filter(function (item) { return item.id !== place.id; });
        var max = state.map.getMaxZoom();
        var z;
        var a;
        for (z = minZoom; z <= max; z++) {
            a = state.map.project([place.lat, place.lng], z);
            if (others.every(function (item) {
                return a.distanceTo(state.map.project([item.lat, item.lng], z)) > 52;
            })) return z;
        }
        return max;
    }

    function tipHtml(place) {
        var thumb = coverFor(place);
        return (thumb ? '<img src="' + thumb + '" alt="">' : '<span class="explore-tip-blank"></span>') +
            '<span><strong>' + escapeHtml(place.name) + '</strong><em>' +
            tripCountLabel(tripsForPlace(place).length) + ' \u00b7 ' + escapeHtml(place.country) + '</em></span>';
    }

    function flyToPlace(place) {
        var zoom = separationZoom(place, Math.max(state.map.getZoom(), 6));
        var marker = state.markers[place.id];
        // Once the flight lands, slide the pin clear of the panel or sheet.
        state.map.once('moveend', function () {
            var dx = isMobile() ? 0 : -204;
            var dy = isMobile() ? sheetHeights()[state.sheet] / 2 : 0;
            if (dx || dy) state.map.panBy([dx, dy], { animate: true, duration: 0.35 });
            setTimeout(function () {
                if (marker && state.cluster.getVisibleParent(marker) !== marker) state.cluster.zoomToShowLayer(marker);
            }, 450);
        });
        state.map.flyTo([place.lat, place.lng], zoom, { duration: 0.6 });
    }

    function flyToGroup(places) {
        fitPlaces(places, true);
    }

    function currentHash() {
        try {
            return decodeURIComponent((location.hash || '').slice(1));
        } catch (err) {
            return (location.hash || '').slice(1);
        }
    }

    function setHash(id, mode) {
        var next = id || '';
        var url = next ? '#' + next : location.pathname + location.search;
        if (next === currentHash() && mode !== 'replace') return;
        try {
            if (mode === 'push') history.pushState({ explore: next }, '', url);
            else history.replaceState({ explore: next }, '', url);
        } catch (err) { /* file or sandboxed context */ }
    }

    // fromMap: a marker or country was tapped, so keep the sheet low on phones.
    // fromHistory: restoring a Back/Forward entry, so do not push again.
    function selectPlace(id, pan, fromMap, fromHistory) {
        var place = placeById(id);
        if (!place) return;
        state.activeId = id;
        state.countryFilter = place.iso;
        state.regionFilter = '';
        renderDetail(place);
        showDetail(!!fromMap && isMobile());
        refresh();
        setHash(id, fromHistory ? 'replace' : 'push');
        if (pan) flyToPlace(place);
        else if (isMobile()) revealPlace(place);
    }

    function selectCountry(iso, pan, fromHistory) {
        var places = placesForIso(iso);
        state.activeId = null;
        state.countryFilter = iso;
        state.regionFilter = '';
        showList();
        openSheet();
        refresh();
        setHash('', fromHistory ? 'replace' : 'push');
        if (pan) flyToGroup(places);
    }

    function selectRegion(iso, region, pan, fromHistory) {
        var places = placesForRegion(iso, region);
        state.activeId = null;
        state.countryFilter = iso;
        state.regionFilter = region;
        showList();
        openSheet();
        refresh();
        setHash('', fromHistory ? 'replace' : 'push');
        if (pan) flyToGroup(places);
    }

    function clearPlace(fromHistory) {
        state.activeId = null;
        state.countryFilter = '';
        state.regionFilter = '';
        showList();
        refresh();
        setHash('', fromHistory ? 'replace' : 'push');
    }

    function restoreFromHash() {
        var id = currentHash();
        if (id && placeById(id)) selectPlace(id, true, true, true);
        else clearPlace(true);
    }

    function refresh() {
        renderStats();
        renderTagChips();
        renderList();
        refreshMarkers();
        restyleRegions();
        panelEl().setAttribute('data-has-place', state.activeId ? 'true' : 'false');
    }

    function layerBoundsForSelection() {
        var bounds = null;
        if (!state.regionLayer || !state.countryFilter || ADMIN1[state.countryFilter] || state.countryFilter === 'CA') return bounds;
        state.regionLayer.eachLayer(function (layer) {
            var props = layer.feature && layer.feature.properties;
            if (!props || props.iso !== state.countryFilter) return;
            if (state.regionFilter && (props.kind !== 'admin1' || props.region !== state.regionFilter)) return;
            if (!layer.getBounds) return;
            bounds = bounds ? bounds.extend(layer.getBounds()) : layer.getBounds();
        });
        return bounds;
    }

    function placeBounds() {
        return tightPlaceBounds(visiblePlaces());
    }

    // Shorter-arc box. east may be > 180 when the group crosses the
    // Pacific (US + Japan). Do not send that through Leaflet bounds.
    function placeExtent(places) {
        var south = Infinity;
        var north = -Infinity;
        var lngs = [];
        places.forEach(function (place) {
            if (place.lat == null || place.lng == null) return;
            if (place.lat < south) south = place.lat;
            if (place.lat > north) north = place.lat;
            lngs.push(place.lng);
        });
        if (!lngs.length) return null;
        lngs.sort(function (a, b) { return a - b; });
        var maxGap = (lngs[0] + 360) - lngs[lngs.length - 1];
        var gapAfter = lngs.length - 1;
        var wrapIsLargest = true;
        for (var i = 0; i < lngs.length - 1; i++) {
            var gap = lngs[i + 1] - lngs[i];
            if (gap > maxGap) {
                maxGap = gap;
                gapAfter = i;
                wrapIsLargest = false;
            }
        }
        return {
            south: south,
            north: north,
            west: wrapIsLargest ? lngs[0] : lngs[gapAfter + 1],
            east: wrapIsLargest ? lngs[lngs.length - 1] : lngs[gapAfter] + 360
        };
    }

    function tightPlaceBounds(places) {
        var ext = placeExtent(places);
        if (!ext) return null;
        return L.latLngBounds([[ext.south, ext.west], [ext.north, ext.east]]);
    }

    // Wide longitude spans take the long way around the globe and pull
    // empty Arctic canvas into frame. Those go back to the world camera.
    function overviewBounds(places) {
        var tight = tightPlaceBounds(places);
        if (!tight || !tight.isValid()) return null;
        var west = tight.getWest();
        var east = tight.getEast();
        if (east > 180 || west < -180 || Math.abs(east - west) > 180) return null;
        return tight;
    }

    // Opening view should match the old frame. Canada's arctic islands are
    // still filled, but they must not pull empty ocean into the top of the map.
    function worldFitBounds() {
        var bounds = null;
        if (state.regionLayer) {
            state.regionLayer.eachLayer(function (layer) {
                var props = layer.feature && layer.feature.properties;
                if (!props || props.iso === 'CA' || !placesForFeature(props).length || !layer.getBounds) return;
                var lb = layer.getBounds();
                bounds = bounds ? bounds.extend(lb) : L.latLngBounds(lb.getSouthWest(), lb.getNorthEast());
            });
        }
        return bounds || placeBounds();
    }

    function fitToVisible(animate) {
        var places = visiblePlaces();
        if (!places.length) return;
        if (!state.countryFilter) {
            showWorld(!!animate);
            return;
        }
        var bounds = layerBoundsForSelection() || placeBounds();
        if (!bounds || !bounds.isValid()) {
            showWorld(!!animate);
            return;
        }
        state.map.fitBounds(bounds, Object.assign({ maxZoom: 5, animate: !!animate, duration: 0.6 }, mapPadding()));
        if (state.regionLayer) state.regionLayer.bringToFront();
        state.map.invalidateSize();
    }

    var REGION_STYLE = { color: '#2f6f78', weight: 1, opacity: 0.9, fillColor: '#2f6f78', fillOpacity: 0.2 };
    var REGION_STYLE_ACTIVE = { color: '#2f6f78', weight: 1.6, opacity: 1, fillColor: '#2f6f78', fillOpacity: 0.34 };
    var REGION_STYLE_HIDDEN = { opacity: 0, fillOpacity: 0, weight: 0 };

    function regionIsSelected(props) {
        if (!props || !placesForFeature(props).length) return false;
        if (state.regionFilter) return props.kind === 'admin1' && props.iso === state.countryFilter && props.region === state.regionFilter;
        if (state.countryFilter) return props.iso === state.countryFilter;
        return false;
    }

    function styleForRegion(feature, hover) {
        if (!placesForFeature(feature.properties).length) return REGION_STYLE_HIDDEN;
        if (hover || regionIsSelected(feature.properties)) return REGION_STYLE_ACTIVE;
        return REGION_STYLE;
    }

    function restyleRegions() {
        if (!state.regionLayer) return;
        state.regionLayer.eachLayer(function (layer) {
            layer.setStyle(styleForRegion(layer.feature, false));
        });
    }

    function addRegionLayer(geo) {
        state.regionLayer = L.geoJSON(geo, {
            renderer: L.canvas({ padding: 0.5 }),
            smoothFactor: 0,
            style: function (feature) { return styleForRegion(feature, false); },
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', function () {
                    if (!placesForFeature(feature.properties).length) return;
                    layer.setStyle(styleForRegion(feature, true));
                });
                layer.on('mouseout', function () { layer.setStyle(styleForRegion(feature, false)); });
                layer.on('click', function () {
                    var match = placesForFeature(feature.properties);
                    if (match.length === 1) selectPlace(match[0].id, true, true);
                    else if (match.length > 1 && feature.properties.kind === 'admin1') selectRegion(feature.properties.iso, feature.properties.region, true);
                    else if (match.length > 1) selectCountry(feature.properties.iso, true);
                });
            }
        }).addTo(state.map);
    }

    function initMap(data, geo) {
        state.map = L.map('explore-map', {
            minZoom: isMobile() ? 0.5 : WORLD_ZOOM,
            maxZoom: 8,
            zoomSnap: isMobile() ? 0.25 : 1,
            worldCopyJump: false,
            zoomControl: false,
            attributionControl: true
        }).setView([20, -20], isMobile() ? 0.75 : WORLD_ZOOM);
        state.map.attributionControl.setPrefix('');
        if (isMobile()) state.map.attributionControl.setPosition('topleft');
        state.map.attributionControl.addAttribution('Boundaries &copy; Natural Earth');
        applyMinZoom();

        var controls = L.control({ position: 'bottomright' });
        controls.onAdd = function () {
            var div = L.DomUtil.create('div', 'explore-controls');
            var svg = function (d) {
                return '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
            };
            div.innerHTML =
                '<button type="button" class="explore-zoom" data-act="in" aria-label="Zoom in">' + svg('<path d="M12 5v14M5 12h14"/>') + '</button>' +
                '<button type="button" class="explore-zoom" data-act="out" aria-label="Zoom out">' + svg('<path d="M5 12h14"/>') + '</button>' +
                '<button type="button" class="explore-reset" data-act="reset" aria-label="Show all places">' +
                svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 4 5.3 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.3-4-8.5s1.4-6.1 4-8.5z"/>') + '</button>';
            L.DomEvent.disableClickPropagation(div);
            div.addEventListener('click', function (event) {
                var btn = event.target.closest('button');
                var act = btn && btn.getAttribute('data-act');
                if (act === 'in') state.map.zoomIn();
                if (act === 'out') state.map.zoomOut();
                if (act === 'reset') {
                    clearPlace();
                    if (isMobile()) setSheet('peek');
                    fitToVisible(true);
                }
            });
            return div;
        };
        controls.addTo(state.map);

        state.cluster = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 38,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function (cluster) {
                var n = cluster.getChildCount();
                var size = n >= 10 ? 50 : 44;
                return L.divIcon({
                    className: 'explore-cluster-wrap',
                    iconSize: [size, size],
                    html: '<div class="explore-cluster">' + n + '</div>'
                });
            }
        });
        state.map.addLayer(state.cluster);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 8
        }).addTo(state.map);

        addRegionLayer(geo);

        data.places.forEach(function (place) {
            var marker = L.marker([place.lat, place.lng], {
                icon: markerIcon(place, false),
                keyboard: true,
                title: place.name
            });
            marker._sig = '.';
            marker.on('click', function () { selectPlace(place.id, false, true); });
            if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
                marker.bindTooltip(function () { return tipHtml(place); }, {
                    direction: 'top',
                    offset: [0, -20],
                    className: 'explore-tip',
                    opacity: 1
                });
            }
            state.markers[place.id] = marker;
        });
        state.cluster.addLayers(Object.keys(state.markers).map(function (id) { return state.markers[id]; }));

        state.map.on('moveend', function () {
            hideCanvasVoid();
            if (!state.data) return;
            renderList();
        });
        state.map.on('resize', function () {
            if (!currentFilter() && !state.activeId && !state.countryFilter) showWorld(false);
        });

        fitToVisible();
        setTimeout(function () { fitToVisible(); }, 300);
    }

    function cycleSheet() {
        if (state.sheet === 'peek') setSheet('half');
        else if (state.sheet === 'half') setSheet('full');
        else setSheet('peek');
    }

    function bindSheet() {
        var handle = document.getElementById('explore-panel-toggle');
        var panel = panelEl();
        var drag = null;

        setSheet(isMobile() ? 'peek' : 'half');

        handle.addEventListener('pointerdown', function (event) {
            if (!isMobile()) return;
            drag = {
                y: event.clientY,
                startH: panel.getBoundingClientRect().height,
                snaps: sheetHeights(),
                cur: panel.getBoundingClientRect().height,
                lastY: event.clientY,
                lastT: Date.now(),
                v: 0,
                moved: false
            };
            try { handle.setPointerCapture(event.pointerId); } catch (err) { /* pointer already released */ }
            panel.classList.add('is-dragging');
        });

        handle.addEventListener('pointermove', function (event) {
            var dy;
            var now;
            var dt;
            if (!drag) return;
            dy = drag.y - event.clientY;
            if (Math.abs(dy) > 6) drag.moved = true;
            drag.cur = Math.max(drag.snaps.peek, Math.min(drag.snaps.full, drag.startH + dy));
            panel.style.height = drag.cur + 'px';
            now = Date.now();
            dt = now - drag.lastT;
            if (dt > 0) drag.v = (drag.lastY - event.clientY) / dt;
            drag.lastY = event.clientY;
            drag.lastT = now;
        });

        function finish() {
            var d = drag;
            var target;
            var best;
            if (!d) return;
            drag = null;
            panel.classList.remove('is-dragging');
            if (!d.moved) {
                cycleSheet();
                return;
            }
            target = d.cur + d.v * 220;
            best = 'peek';
            ['peek', 'half', 'full'].forEach(function (name) {
                if (Math.abs(d.snaps[name] - target) < Math.abs(d.snaps[best] - target)) best = name;
            });
            setSheet(best);
        }

        handle.addEventListener('pointerup', finish);
        handle.addEventListener('pointercancel', finish);

        // Keyboard and assistive tech activate the button without a pointer.
        handle.addEventListener('click', function (event) {
            if (event.detail === 0) cycleSheet();
        });

        window.addEventListener('resize', function () {
            applyMinZoom();
            if (!isMobile()) {
                panel.style.height = '';
                panel.removeAttribute('data-sheet');
            } else if (!panel.getAttribute('data-sheet')) {
                setSheet(state.sheet);
            }
            if (state.map && !currentFilter() && !state.activeId && !state.countryFilter) {
                showWorld(false);
            }
        });
    }

    function bindUi() {
        bindSheet();
        Array.prototype.forEach.call(document.querySelectorAll('.explore-tag-row [data-filter]'), function (button) {
            button.addEventListener('click', function () {
                var value = button.getAttribute('data-filter') || '';
                if (value && value === currentFilter()) value = '';
                setFilter(value);
            });
        });
    }

    Promise.all([
        fetch('assets/data/explore-places.json?v=18').then(function (res) { return res.json(); }),
        fetch('assets/data/map-regions.geojson?v=3').then(function (res) { return res.json(); })
    ]).then(function (results) {
        state.data = results[0];
        initMap(state.data, results[1]);
        bindUi();
        refresh();
        window.addEventListener('popstate', restoreFromHash);
        setTimeout(function () {
            var id = currentHash();
            if (id && placeById(id)) selectPlace(id, true, true, true);
        }, 420);
    });
})();
