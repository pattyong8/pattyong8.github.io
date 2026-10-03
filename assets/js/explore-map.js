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
        sheet: 'peek'
    };

    function placeMatchesType(place) {
        if (!state.typeFilter) return true;
        return place.trips.some(function (trip) { return trip.type === state.typeFilter; });
    }

    function tripsForPlace(place) {
        if (!state.typeFilter) return place.trips;
        return place.trips.filter(function (trip) { return trip.type === state.typeFilter; });
    }

    function visiblePlaces() {
        return state.data.places.filter(function (place) {
            if (state.countryFilter && place.iso !== state.countryFilter) return false;
            if (state.regionFilter && place.region !== state.regionFilter) return false;
            return placeMatchesType(place);
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
    function sheetHeights() {
        var shellH = panelEl().parentNode.getBoundingClientRect().height;
        var dock = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-height')) || 76;
        return { peek: 132 + dock, half: Math.round(shellH * 0.52), full: Math.round(shellH - 8) };
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
        return { paddingTopLeft: [440, 80], paddingBottomRight: [48, 48] };
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
        var places = state.data.places;
        var trips = {};
        var countries = {};
        places.forEach(function (place) {
            countries[place.iso] = true;
            place.trips.forEach(function (trip) { trips[trip.href + "|" + trip.title + "|" + trip.dateRange] = true; });
        });
        document.getElementById('explore-stats').textContent =
            Object.keys(countries).length + ' countries · ' +
            places.length + ' places · ' +
            Object.keys(trips).length + ' memories';
    }

    function renderDestinationSelect() {
        var select = document.getElementById('explore-destination');
        var groups = {};
        var html = '<option value="">All places</option>';
        var current = '';

        if (!select.getAttribute('data-built')) {
            state.data.places.forEach(function (place) {
                if (!groups[place.iso]) {
                    groups[place.iso] = { name: place.country, places: [] };
                }
                groups[place.iso].places.push(place);
            });

            Object.keys(groups).sort(function (a, b) {
                return groups[a].name.localeCompare(groups[b].name);
            }).forEach(function (iso) {
                var group = groups[iso];
                var regions = [];
                var seenRegion = {};
                html += '<optgroup label="' + escapeHtml(group.name) + '">';
                html += '<option value="country:' + iso + '">All of ' + escapeHtml(group.name) + '</option>';
                if (ADMIN1[iso]) {
                    group.places.forEach(function (place) {
                        if (place.region && !seenRegion[place.region]) {
                            seenRegion[place.region] = true;
                            regions.push(place.region);
                        }
                    });
                    regions.sort(function (a, b) { return a.localeCompare(b); }).forEach(function (region) {
                        html += '<option value="region:' + iso + ':' + region + '">' + escapeHtml(region) + '</option>';
                    });
                }
                group.places.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                }).forEach(function (place) {
                    html += '<option value="place:' + place.id + '">' + escapeHtml(place.name) + '</option>';
                });
                html += '</optgroup>';
            });
            select.innerHTML = html;
            select.setAttribute('data-built', 'true');
        }

        if (state.activeId) current = 'place:' + state.activeId;
        else if (state.regionFilter) current = 'region:' + state.countryFilter + ':' + state.regionFilter;
        else if (state.countryFilter) current = 'country:' + state.countryFilter;
        select.value = current;
    }

    function typeListLabel() {
        if (state.typeFilter === 'family') return 'Family destinations';
        if (state.typeFilter === 'friends') return 'Friends destinations';
        if (state.typeFilter === 'work') return 'Work destinations';
        return 'Destinations';
    }

    function renderTypeChips() {
        Array.prototype.forEach.call(document.querySelectorAll('.explore-type-row [data-type]'), function (button) {
            var on = button.getAttribute('data-type') === state.typeFilter;
            button.classList.toggle('is-active', on);
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function setTypeFilter(type) {
        state.typeFilter = type || '';
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

    function renderList() {
        var list = document.getElementById('explore-place-list');
        var label = document.getElementById('explore-list-label');
        var places = visiblePlaces();
        if (label) label.textContent = typeListLabel();
        if (!places.length) {
            list.innerHTML = '<p class="explore-lede">No destinations in that group yet.</p>';
            return;
        }
        list.innerHTML = places.map(function (place) {
            var thumb = coverFor(place);
            var count = tripsForPlace(place).length;
            return '<button class="explore-place-row" data-place="' + place.id + '">' +
                (thumb ? '<img class="explore-thumb" src="' + thumb + '" alt="">' : '<span class="explore-thumb"></span>') +
                '<span class="explore-place-copy"><strong>' + escapeHtml(place.name) + '</strong>' +
                '<span>' + tripCountLabel(count) + ' · ' + escapeHtml(place.country) + '</span></span></button>';
        }).join('');
        Array.prototype.forEach.call(list.querySelectorAll('[data-place]'), function (row) {
            row.addEventListener('click', function () {
                selectPlace(row.getAttribute('data-place'), true);
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

    var TYPE_ICONS = {
        family: '<path fill="currentColor" d="M12 3 2.5 11.4h2.8V20.5h4.9v-6.1h3.6v6.1h4.9v-9.1h2.8L12 3z"/>',
        friends: '<circle cx="6" cy="7.4" r="3.5" fill="currentColor"/>' +
            '<path fill="currentColor" d="M0.8 20.6c0-3.9 2.3-6.5 5.2-6.5s5.2 2.6 5.2 6.5z"/>' +
            '<circle cx="18" cy="7.4" r="3.5" fill="currentColor"/>' +
            '<path fill="currentColor" d="M12.8 20.6c0-3.9 2.3-6.5 5.2-6.5s5.2 2.6 5.2 6.5z"/>',
        work: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8.6 7V5.2c0-.9.7-1.7 1.7-1.7h3.4c1 0 1.7.8 1.7 1.7V7"/>' +
            '<path fill="currentColor" fill-rule="evenodd" d="M4.9 6.5h14.2c1.3 0 2.4 1.1 2.4 2.4v9.2c0 1.3-1.1 2.4-2.4 2.4H4.9c-1.3 0-2.4-1.1-2.4-2.4V8.9c0-1.3 1.1-2.4 2.4-2.4zM2.5 11.5v1.5h19v-1.5z"/>' +
            '<rect x="10.2" y="10.4" width="3.6" height="4.2" rx="0.9" fill="currentColor"/>',
        solo: '<circle cx="12" cy="7" r="4.2" fill="currentColor"/><path fill="currentColor" d="M3.8 21c0-4.6 3.6-7.4 8.2-7.4s8.2 2.8 8.2 7.4z"/>',
        other: '<circle cx="12" cy="12" r="4" fill="currentColor"/>'
    };

    function iconSvg(type, size) {
        return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' + TYPE_ICONS[type] + '</svg>';
    }

    var TYPE_PRIORITY = ['family', 'friends', 'work', 'solo'];

    function markerType(place) {
        var counts = { family: 0, friends: 0, work: 0, solo: 0 };
        var best = '';
        if (state.typeFilter) return state.typeFilter;
        place.trips.forEach(function (trip) {
            if (counts.hasOwnProperty(trip.type)) counts[trip.type] += 1;
        });
        TYPE_PRIORITY.forEach(function (type) {
            if (counts[type] && (!best || counts[type] > counts[best])) best = type;
        });
        return best || 'other';
    }

    function markerIcon(place, active) {
        var type = markerType(place);
        var size = active ? 40 : 30;
        return L.divIcon({
            className: 'explore-marker-wrap',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: '<div class="explore-marker is-' + type + (active ? ' is-active' : '') + '">' +
                iconSvg(type, active ? 22 : 16) +
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
            var sig = markerType(placeById(id)) + (active ? '!' : '');
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
        if (!places.length) return;
        if (places.length === 1) {
            flyToPlace(places[0]);
            return;
        }
        var bounds = L.latLngBounds(places.map(function (place) {
            return [place.lat, place.lng];
        }));
        state.map.flyToBounds(bounds, Object.assign({ maxZoom: 5, duration: 0.55 }, mapPadding()));
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
        renderTypeChips();
        renderDestinationSelect();
        renderList();
        refreshMarkers();
        restyleRegions();
        panelEl().setAttribute('data-has-place', state.activeId ? 'true' : 'false');
    }

    function layerBoundsForSelection() {
        var bounds = null;
        if (!state.regionLayer || !state.countryFilter || ADMIN1[state.countryFilter]) return bounds;
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
        return L.latLngBounds(visiblePlaces().map(function (place) { return [place.lat, place.lng]; }));
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
        var bounds = layerBoundsForSelection() || (state.countryFilter ? placeBounds() : worldFitBounds());
        state.map.fitBounds(bounds, Object.assign({ maxZoom: state.countryFilter ? 5 : 2, animate: !!animate, duration: 0.6 }, mapPadding()));
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
            minZoom: 1,
            maxZoom: 8,
            worldCopyJump: false,
            zoomControl: false,
            attributionControl: true
        }).setView([20, -20], 2);
        state.map.attributionControl.setPrefix('');
        if (isMobile()) state.map.attributionControl.setPosition('topleft');
        state.map.attributionControl.addAttribution('Boundaries &copy; Natural Earth');

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
            marker._sig = markerType(place);
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

        fitToVisible();
        setTimeout(function () { fitToVisible(); }, 300);
    }

    function cycleSheet() {
        setSheet(state.sheet === 'peek' ? 'half' : (state.sheet === 'full' ? 'half' : 'peek'));
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
            if (!isMobile()) {
                panel.style.height = '';
                panel.removeAttribute('data-sheet');
            } else if (!panel.getAttribute('data-sheet')) {
                setSheet(state.sheet);
            }
        });
    }

    function bindUi() {
        Array.prototype.forEach.call(document.querySelectorAll('.explore-type-row [data-type]'), function (button) {
            var type = button.getAttribute('data-type');
            var old = button.querySelector('svg');
            if (!type || !TYPE_ICONS[type]) return;
            if (old) old.outerHTML = '<span class="explore-chip-dot is-' + type + '">' + iconSvg(type, 13) + '</span>';
        });
        document.getElementById('explore-destination').addEventListener('change', function (event) {
            var value = event.target.value;
            if (!value) {
                clearPlace();
                fitToVisible();
                return;
            }
            if (value.indexOf('place:') === 0) {
                selectPlace(value.slice(6), true);
                return;
            }
            if (value.indexOf('region:') === 0) {
                var parts = value.split(':');
                selectRegion(parts[1], parts.slice(2).join(':'), true);
                return;
            }
            if (value.indexOf('country:') === 0) {
                selectCountry(value.slice(8), true);
            }
        });
        bindSheet();
        Array.prototype.forEach.call(document.querySelectorAll('.explore-type-row [data-type]'), function (button) {
            button.addEventListener('click', function () {
                var type = button.getAttribute('data-type') || '';
                if (type && type === state.typeFilter) type = '';
                setTypeFilter(type);
            });
        });
    }

    Promise.all([
        fetch('assets/data/explore-places.json?v=15').then(function (res) { return res.json(); }),
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
