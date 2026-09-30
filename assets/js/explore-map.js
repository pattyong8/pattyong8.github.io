(function () {
    'use strict';

    var GEO_NAMES = {
        US: 'USA',
        CA: 'Canada',
        JP: 'Japan',
        TW: 'Taiwan',
        PH: 'Philippines',
        IE: 'Ireland',
        FR: 'France',
        CL: 'Chile',
        IT: 'Italy',
        HR: 'Croatia',
        DK: 'Denmark',
        CN: 'China',
        ES: 'Spain',
        MX: 'Mexico',
        AU: 'Australia',
        NZ: 'New Zealand',
        TH: 'Thailand',
        GR: 'Greece',
        TR: 'Turkey',
        VN: 'Vietnam',
        GB: 'England'
    };

    var state = {
        data: null,
        map: null,
        countryLayer: null,
        markers: {},
        activeId: null,
        countryFilter: '',
        typeFilter: ''
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

    function isoForGeoName(name) {
        var iso;
        for (iso in GEO_NAMES) {
            if (GEO_NAMES[iso] === name) return iso;
        }
        return '';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function isMobileLayout() {
        return window.innerWidth <= 767;
    }

    function panelCollapsed() {
        var panel = document.getElementById('explore-panel');
        return !!(panel && panel.classList.contains('is-collapsed'));
    }

    function mapPadding() {
        if (isMobileLayout()) {
            return {
                paddingTopLeft: [16, 96],
                paddingBottomRight: [16, panelCollapsed() ? 100 : 280]
            };
        }
        return { paddingTopLeft: [400, 80], paddingBottomRight: [40, 40] };
    }

    function refreshMapSize() {
        if (!state.map) return;
        state.map.invalidateSize({ animate: false });
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
                html += '<optgroup label="' + escapeHtml(group.name) + '">';
                html += '<option value="country:' + iso + '">All of ' + escapeHtml(group.name) + '</option>';
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
        if (!state.activeId && state.countryFilter && !placesForIso(state.countryFilter).length) {
            state.countryFilter = '';
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

    function renderDetail(place) {
        var trips = tripsForPlace(place);
        var rows = trips.map(function (trip) {
            var bits = [trip.dateRange || trip.year, trip.people].filter(Boolean);
            return '<a class="explore-trip-row" href="' + trip.href + '">' +
                (trip.thumb ? '<img class="explore-thumb" src="' + trip.thumb + '" alt="">' : '<span class="explore-thumb"></span>') +
                '<span class="explore-place-copy"><strong>' + escapeHtml(trip.title) + '</strong>' +
                '<span class="explore-trip-meta">' + escapeHtml(bits.join(' · ')) + '</span></span></a>';
        }).join('');
        if (!rows) {
            rows = '<p class="explore-lede">No memories in that group at this place.</p>';
        }

        document.getElementById('explore-detail-view').innerHTML =
            '<button class="explore-back" id="explore-back" type="button">All destinations</button>' +
            '<div class="explore-detail">' +
            '<div class="explore-detail-kicker">' + escapeHtml(place.country) + '</div>' +
            '<h2>' + escapeHtml(place.name) + '</h2>' +
            '<p class="explore-lede">' + tripCountLabel(trips.length) + '</p>' +
            rows + '</div>';
        document.getElementById('explore-back').addEventListener('click', function () {
            clearPlace();
            fitToVisible();
        });
    }

    function showList() {
        document.getElementById('explore-list-view').hidden = false;
        document.getElementById('explore-detail-view').hidden = true;
    }

    function showDetail() {
        document.getElementById('explore-list-view').hidden = true;
        document.getElementById('explore-detail-view').hidden = false;
        document.getElementById('explore-panel').classList.remove('is-collapsed');
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
        var mobile = isMobileLayout();
        var size = active ? (mobile ? 40 : 34) : (mobile ? 34 : 28);
        var icon = active ? (mobile ? 24 : 21) : (mobile ? 20 : 17);
        return L.divIcon({
            className: 'explore-marker-wrap',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: '<div class="explore-marker is-' + type + (active ? ' is-active' : '') + '">' +
                iconSvg(type, icon) + '</div>'
        });
    }

    function refreshMarkers() {
        var visible = {};
        visiblePlaces().forEach(function (place) { visible[place.id] = true; });
        Object.keys(state.markers).forEach(function (id) {
            var marker = state.markers[id];
            var show = !!visible[id];
            if (show && !state.map.hasLayer(marker)) marker.addTo(state.map);
            if (!show && state.map.hasLayer(marker)) state.map.removeLayer(marker);
            marker.setIcon(markerIcon(placeById(id), id === state.activeId));
        });
    }

    function flyToPlace(place) {
        state.map.flyTo([place.lat, place.lng], Math.max(state.map.getZoom(), 5), { duration: 0.55 });
        setTimeout(function () {
            var zoom = state.map.getZoom();
            var pt = state.map.project([place.lat, place.lng], zoom);
            if (!isMobileLayout()) pt.x -= 180;
            else pt.y -= panelCollapsed() ? 40 : 90;
            state.map.panTo(state.map.unproject(pt, zoom), { animate: true, duration: 0.35 });
        }, 560);
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

    function selectPlace(id, pan) {
        var place = placeById(id);
        if (!place) return;
        state.activeId = id;
        state.countryFilter = place.iso;
        renderDetail(place);
        showDetail();
        refresh();
        if (pan) flyToPlace(place);
    }

    function selectCountry(iso, pan) {
        var places = placesForIso(iso);
        state.activeId = null;
        state.countryFilter = iso;
        showList();
        refresh();
        document.getElementById('explore-panel').classList.remove('is-collapsed');
        if (pan) flyToGroup(places);
    }

    function clearPlace() {
        state.activeId = null;
        state.countryFilter = '';
        showList();
        refresh();
    }

    function refresh() {
        renderStats();
        renderTypeChips();
        renderDestinationSelect();
        renderList();
        refreshMarkers();
    }

    function fitToVisible() {
        var places = visiblePlaces();
        if (!places.length) return;
        var bounds = state.countryFilter
            ? L.latLngBounds(places.map(function (place) { return [place.lat, place.lng]; }))
            : (state.countryLayer ? state.countryLayer.getBounds() : L.latLngBounds(places.map(function (place) { return [place.lat, place.lng]; })));
        state.map.fitBounds(bounds, Object.assign({ maxZoom: state.countryFilter ? 5 : 2, animate: false }, mapPadding()));
        if (state.countryLayer) state.countryLayer.bringToFront();
        state.map.invalidateSize();
    }

    function addCountryLayer(geo, visitedIso) {
        var names = {};
        Object.keys(GEO_NAMES).forEach(function (iso) {
            if (visitedIso[iso]) names[GEO_NAMES[iso]] = true;
        });
        var visitedGeo = {
            type: 'FeatureCollection',
            features: geo.features.filter(function (feature) {
                return names[feature.properties.name];
            })
        };
        state.countryLayer = L.geoJSON(visitedGeo, {
            renderer: L.canvas({ padding: 0.8 }),
            style: {
                color: '#4d6e68',
                weight: 0.8,
                fillColor: '#8eaea6',
                fillOpacity: 0.42
            },
            onEachFeature: function (feature, layer) {
                layer.on('click', function () {
                    var iso = isoForGeoName(feature.properties.name);
                    var match = placesForIso(iso);
                    if (match.length === 1) selectPlace(match[0].id, true);
                    else if (match.length > 1) selectCountry(iso, true);
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
        state.map.attributionControl.addAttribution('Natural Earth');

        L.control.zoom({ position: 'bottomright' }).addTo(state.map);

        var legend = L.control({ position: 'topright' });
        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'explore-legend');
            div.innerHTML = [['family', 'Family'], ['friends', 'Friends'], ['work', 'Work'], ['solo', 'Solo']].map(function (item) {
                return '<span class="explore-legend-item"><span class="explore-marker is-' + item[0] + '">' + iconSvg(item[0], 18) + '</span>' + item[1] + '</span>';
            }).join('');
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        legend.addTo(state.map);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 8
        }).addTo(state.map);

        var visitedIso = {};
        data.places.forEach(function (place) { visitedIso[place.iso] = true; });
        addCountryLayer(geo, visitedIso);

        data.places.forEach(function (place) {
            var marker = L.marker([place.lat, place.lng], {
                icon: markerIcon(place, false),
                keyboard: true,
                title: place.name
            });
            marker.on('click', function () { selectPlace(place.id, false); });
            marker.addTo(state.map);
            state.markers[place.id] = marker;
        });

        fitToVisible();
        setTimeout(function () { fitToVisible(); }, 300);
    }

    function bindUi() {
        Array.prototype.forEach.call(document.querySelectorAll('.explore-type-row [data-type]'), function (button) {
            var type = button.getAttribute('data-type');
            var old = button.querySelector('svg');
            if (!type || !TYPE_ICONS[type]) return;
            if (old) old.outerHTML = iconSvg(type, 18);
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
            if (value.indexOf('country:') === 0) {
                selectCountry(value.slice(8), true);
            }
        });
        document.getElementById('explore-panel-toggle').addEventListener('click', function () {
            document.getElementById('explore-panel').classList.toggle('is-collapsed');
            setTimeout(function () {
                refreshMapSize();
                if (state.activeId) {
                    var place = placeById(state.activeId);
                    if (place) flyToPlace(place);
                } else {
                    fitToVisible();
                }
            }, 220);
        });
        Array.prototype.forEach.call(document.querySelectorAll('.explore-type-row [data-type]'), function (button) {
            button.addEventListener('click', function () {
                var type = button.getAttribute('data-type') || '';
                if (type && type === state.typeFilter) type = '';
                setTypeFilter(type);
            });
        });
        window.addEventListener('resize', function () {
            refreshMapSize();
            refreshMarkers();
        });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () {
                refreshMapSize();
                fitToVisible();
            }, 280);
        });
    }

    Promise.all([
        fetch('assets/data/explore-places.json?v=9').then(function (res) { return res.json(); }),
        fetch('assets/data/world.geojson').then(function (res) { return res.json(); })
    ]).then(function (results) {
        state.data = results[0];
        initMap(state.data, results[1]);
        bindUi();
        refresh();
        requestAnimationFrame(function () {
            document.body.classList.add('explore-ready');
            refreshMapSize();
        });
    });
})();
