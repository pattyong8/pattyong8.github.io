#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('../node_modules/js-yaml');

const ROOT = path.resolve(__dirname, '../..');
const SUB = path.join(ROOT, 'Travel-Pages-Sub');
const OUT = path.join(ROOT, 'assets/data/explore-places.json');

const PLACES = {
  'new-york': { id: 'new-york', name: 'New York, New York', region: 'New York', country: 'United States', iso: 'US', lat: 40.758, lng: -73.985 },
  'irvine': { id: 'irvine', name: 'Irvine, California', region: 'California', country: 'United States', iso: 'US', lat: 33.6846, lng: -117.8265 },
  'san-francisco': { id: 'san-francisco', name: 'San Francisco, California', region: 'California', country: 'United States', iso: 'US', lat: 37.7749, lng: -122.4194 },
  'san-diego': { id: 'san-diego', name: 'San Diego, California', region: 'California', country: 'United States', iso: 'US', lat: 32.7157, lng: -117.1611 },
  'los-angeles': { id: 'los-angeles', name: 'Los Angeles, California', region: 'California', country: 'United States', iso: 'US', lat: 34.0522, lng: -118.2437 },
  'santa-barbara': { id: 'santa-barbara', name: 'Santa Barbara, California', region: 'California', country: 'United States', iso: 'US', lat: 34.4208, lng: -119.6982 },
  'santa-monica': { id: 'santa-monica', name: 'Santa Monica, California', region: 'California', country: 'United States', iso: 'US', lat: 34.0195, lng: -118.4912 },
  'palm-springs': { id: 'palm-springs', name: 'Palm Springs, California', region: 'California', country: 'United States', iso: 'US', lat: 33.8303, lng: -116.5453 },
  'catalina': { id: 'catalina', name: 'Catalina Island, California', region: 'California', country: 'United States', iso: 'US', lat: 33.3879, lng: -118.4163 },
  'mammoth': { id: 'mammoth', name: 'Mammoth Lakes, California', region: 'California', country: 'United States', iso: 'US', lat: 37.6485, lng: -118.9721 },
  'tahoe': { id: 'tahoe', name: 'Lake Tahoe, California', region: 'California', country: 'United States', iso: 'US', lat: 39.0968, lng: -120.0324 },
  'napa': { id: 'napa', name: 'Napa, California', region: 'California', country: 'United States', iso: 'US', lat: 38.5025, lng: -122.2654 },
  'yosemite': { id: 'yosemite', name: 'Yosemite, California', region: 'California', country: 'United States', iso: 'US', lat: 37.8651, lng: -119.5383 },
  'joshua-tree': { id: 'joshua-tree', name: 'Joshua Tree, California', region: 'California', country: 'United States', iso: 'US', lat: 33.8734, lng: -115.901 },
  'big-bear': { id: 'big-bear', name: 'Big Bear Lake, California', region: 'California', country: 'United States', iso: 'US', lat: 34.2439, lng: -116.9114 },
  'marin': { id: 'marin', name: 'Marin County, California', region: 'California', country: 'United States', iso: 'US', lat: 37.9827, lng: -122.5556 },
  'butano': { id: 'butano', name: 'Butano, California', region: 'California', country: 'United States', iso: 'US', lat: 37.201, lng: -122.341 },
  'pinnacles': { id: 'pinnacles', name: 'Pinnacles, California', region: 'California', country: 'United States', iso: 'US', lat: 36.4906, lng: -121.1825 },
  'castle-rock': { id: 'castle-rock', name: 'Castle Rock, California', region: 'California', country: 'United States', iso: 'US', lat: 37.2286, lng: -122.0958 },
  'malibu': { id: 'malibu', name: 'Malibu, California', region: 'California', country: 'United States', iso: 'US', lat: 34.0259, lng: -118.7798 },
  'disneyland': { id: 'disneyland', name: 'Anaheim, California', region: 'California', country: 'United States', iso: 'US', lat: 33.8121, lng: -117.919 },
  'newport': { id: 'newport', name: 'Newport Beach, California', region: 'California', country: 'United States', iso: 'US', lat: 33.6189, lng: -117.9298 },
  'seattle': { id: 'seattle', name: 'Seattle, Washington', region: 'Washington', country: 'United States', iso: 'US', lat: 47.6062, lng: -122.3321 },
  'whistler': { id: 'whistler', name: 'Whistler, British Columbia', region: 'British Columbia', country: 'Canada', iso: 'CA', lat: 50.1163, lng: -122.9574 },
  'las-vegas': { id: 'las-vegas', name: 'Las Vegas, Nevada', region: 'Nevada', country: 'United States', iso: 'US', lat: 36.1699, lng: -115.1398 },
  'miami': { id: 'miami', name: 'Miami, Florida', region: 'Florida', country: 'United States', iso: 'US', lat: 25.7617, lng: -80.1918 },
  'denver': { id: 'denver', name: 'Denver, Colorado', region: 'Colorado', country: 'United States', iso: 'US', lat: 39.7392, lng: -104.9903 },
  'aspen': { id: 'aspen', name: 'Aspen, Colorado', region: 'Colorado', country: 'United States', iso: 'US', lat: 39.1911, lng: -106.8175 },
  'steamboat': { id: 'steamboat', name: 'Steamboat Springs, Colorado', region: 'Colorado', country: 'United States', iso: 'US', lat: 40.485, lng: -106.8317 },
  'a-basin': { id: 'a-basin', name: 'Arapahoe Basin, Colorado', region: 'Colorado', country: 'United States', iso: 'US', lat: 39.6425, lng: -105.8719 },
  'indianapolis': { id: 'indianapolis', name: 'Indianapolis, Indiana', region: 'Indiana', country: 'United States', iso: 'US', lat: 39.7684, lng: -86.1581 },
  'chicago': { id: 'chicago', name: 'Chicago, Illinois', region: 'Illinois', country: 'United States', iso: 'US', lat: 41.8781, lng: -87.6298 },
  'washington-dc': { id: 'washington-dc', name: 'Washington, DC', region: 'District of Columbia', country: 'United States', iso: 'US', lat: 38.9072, lng: -77.0369 },
  'boston': { id: 'boston', name: 'Boston, Massachusetts', region: 'Massachusetts', country: 'United States', iso: 'US', lat: 42.3601, lng: -71.0589 },
  'new-orleans': { id: 'new-orleans', name: 'New Orleans, Louisiana', region: 'Louisiana', country: 'United States', iso: 'US', lat: 29.9511, lng: -90.0715 },
  'hamptons': { id: 'hamptons', name: 'The Hamptons, New York', region: 'New York', country: 'United States', iso: 'US', lat: 40.9634, lng: -72.1848 },
  'hawley': { id: 'hawley', name: 'Hawley, Pennsylvania', region: 'Pennsylvania', country: 'United States', iso: 'US', lat: 41.4784, lng: -75.1802 },
  'sacramento': { id: 'sacramento', name: 'Sacramento, California', region: 'California', country: 'United States', iso: 'US', lat: 38.5816, lng: -121.4944 },
  'brian-head': { id: 'brian-head', name: 'Brian Head, Utah', region: 'Utah', country: 'United States', iso: 'US', lat: 37.6972, lng: -112.8499 },
  'davis': { id: 'davis', name: 'Davis, California', region: 'California', country: 'United States', iso: 'US', lat: 38.5449, lng: -121.7405 },
  'niseko': { id: 'niseko', name: 'Niseko, Japan', region: 'Hokkaido', country: 'Japan', iso: 'JP', lat: 42.8048, lng: 140.6874 },
  'tokyo': { id: 'tokyo', name: 'Tokyo, Japan', region: 'Kanto', country: 'Japan', iso: 'JP', lat: 35.6762, lng: 139.6503 },
  'taipei': { id: 'taipei', name: 'Taipei, Taiwan', region: 'Taiwan', country: 'Taiwan', iso: 'TW', lat: 25.033, lng: 121.5654 },
  'cebu': { id: 'cebu', name: 'Cebu, Philippines', region: 'Central Visayas', country: 'Philippines', iso: 'PH', lat: 10.3157, lng: 123.8854 },
  'bangkok': { id: 'bangkok', name: 'Bangkok, Thailand', region: 'Thailand', country: 'Thailand', iso: 'TH', lat: 13.7563, lng: 100.5018 },
  'ireland': { id: 'ireland', name: 'Ireland', region: 'Ireland', country: 'Ireland', iso: 'IE', lat: 53.3498, lng: -6.2603 },
  'paris': { id: 'paris', name: 'Paris, France', region: 'Île-de-France', country: 'France', iso: 'FR', lat: 48.8566, lng: 2.3522 },
  'santiago': { id: 'santiago', name: 'Santiago, Chile', region: 'Chile', country: 'Chile', iso: 'CL', lat: -33.4489, lng: -70.6693 },
  'atacama': { id: 'atacama', name: 'San Pedro de Atacama, Chile', region: 'Chile', country: 'Chile', iso: 'CL', lat: -22.9087, lng: -68.1997 },
  'rome': { id: 'rome', name: 'Italy', region: 'Italy', country: 'Italy', iso: 'IT', lat: 41.9028, lng: 12.4964 },
  'malta': { id: 'malta', name: 'Malta', region: 'Malta', country: 'Malta', iso: 'MT', lat: 35.8989, lng: 14.5146 },
  'split': { id: 'split', name: 'Croatia', region: 'Dalmatia', country: 'Croatia', iso: 'HR', lat: 43.5081, lng: 16.4402 },
  'copenhagen': { id: 'copenhagen', name: 'Copenhagen, Denmark', region: 'Denmark', country: 'Denmark', iso: 'DK', lat: 55.6761, lng: 12.5683 },
  'beijing': { id: 'beijing', name: 'China', region: 'China', country: 'China', iso: 'CN', lat: 39.9042, lng: 116.4074 },
  'madrid': { id: 'madrid', name: 'Madrid, Spain', region: 'Spain', country: 'Spain', iso: 'ES', lat: 40.4168, lng: -3.7038 },
  'barcelona': { id: 'barcelona', name: 'Barcelona, Spain', region: 'Spain', country: 'Spain', iso: 'ES', lat: 41.3874, lng: 2.1686 },
  'playa': { id: 'playa', name: 'Playa del Carmen, Mexico', region: 'Quintana Roo', country: 'Mexico', iso: 'MX', lat: 20.6296, lng: -87.0739 },
  'sydney': { id: 'sydney', name: 'Australia', region: 'Australia', country: 'Australia', iso: 'AU', lat: -33.8688, lng: 151.2093 },
  'auckland': { id: 'auckland', name: 'New Zealand', region: 'New Zealand', country: 'New Zealand', iso: 'NZ', lat: -36.8485, lng: 174.7633 },
  'mustique': { id: 'mustique', name: 'Mustique', region: 'Grenadines', country: 'Saint Vincent and the Grenadines', iso: 'VC', lat: 12.877, lng: -61.180 },
  'hollywood': { id: 'hollywood', name: 'Hollywood, California', region: 'California', country: 'United States', iso: 'US', lat: 34.0928, lng: -118.3287 }
};

const LOCATION_ALIASES = {
  'new york, new york': ['new-york'],
  'new york city': ['new-york'],
  'madison square garden': ['new-york'],
  'chinatown, manhattan': ['new-york'],
  'a church in brooklyn': ['new-york'],
  "pizza crawl and dave & buster's": ['new-york'],
  'us open tennis courts and chinatown': ['new-york'],
  'irvine, california': ['irvine'],
  'irvine, ca': ['irvine'],
  'california': ['irvine'],
  'san francisco, california': ['san-francisco'],
  'san francisco, ca': ['san-francisco'],
  'sf, ca': ['san-francisco'],
  'scott street, sf': ['san-francisco'],
  'curran theater': ['san-francisco'],
  'sibley volcanic regional preserve': ['san-francisco'],
  'san diego, california': ['san-diego'],
  'san diego, ca': ['san-diego'],
  'santa barbara, ca': ['santa-barbara'],
  'santa monica, ca': ['santa-monica'],
  'palm springs, ca': ['palm-springs'],
  'catalina island, california': ['catalina'],
  'catalina, ca': ['catalina'],
  'mammoth lakes, california': ['mammoth'],
  'mammoth, ca': ['mammoth'],
  'lake tahoe, california': ['tahoe'],
  'tahoe, ca': ['tahoe'],
  'napa': ['napa'],
  'yosemite, ca': ['yosemite'],
  'big bear lake, ca': ['big-bear'],
  'marin, ca': ['marin'],
  'marin county': ['marin'],
  'butano, ca': ['butano'],
  'santa ana, ca': ['disneyland'],
  'seattle, washington': ['seattle'],
  'whistler, british columbia': ['whistler'],
  'las vegas, nevada': ['las-vegas'],
  'miami, florida': ['miami'],
  'denver, co': ['denver'],
  'steamboat springs, colorado': ['steamboat'],
  'arapahoe basin, colorado': ['a-basin'],
  'indianapolis, indiana': ['indianapolis'],
  'the hamptons, new york': ['hamptons'],
  'hawley, pennsylvania': ['hawley'],
  'niseko, japan': ['niseko'],
  'taiwan': ['taipei'],
  'cebu, philippines': ['cebu'],
  'ireland': ['ireland'],
  'paris, france': ['paris'],
  'san pedro de atacama and santiago, chile': ['atacama', 'santiago']
};

const KEYWORD_PLACES = [
  { re: /italy|malta/i, ids: ['rome', 'malta'] },
  { re: /croatia|denmark/i, ids: ['split', 'copenhagen'] },
  { re: /japan.+taiwan.+thailand|japan\/taiwan\/thailand/i, ids: ['tokyo', 'taipei', 'bangkok'] },
  { re: /boston|mardi.?gras/i, ids: ['boston', 'new-orleans'] },
  { re: /madrid|barcelona/i, ids: ['madrid', 'barcelona'] },
  { re: /chile|atacama|santiago/i, ids: ['atacama', 'santiago'] },
  { re: /playa.?del.?carmen/i, ids: ['playa'] },
  { re: /washington.?dc|\bdc\b|white house/i, ids: ['washington-dc'] },
  { re: /chicago|milwaukee|st\.?charles/i, ids: ['chicago'] },
  { re: /denver.?aspen|aspen/i, ids: ['denver', 'aspen'] },
  { re: /\bdenver\b/i, ids: ['denver'] },
  { re: /whistler/i, ids: ['whistler'] },
  { re: /seattle/i, ids: ['seattle'] },
  { re: /las.?vegas|\bvegas\b/i, ids: ['las-vegas'] },
  { re: /paris/i, ids: ['paris'] },
  { re: /niseko/i, ids: ['niseko'] },
  { re: /\bchina\b/i, ids: ['beijing'] },
  { re: /australia/i, ids: ['sydney'] },
  { re: /new.?zealand/i, ids: ['auckland'] },
  { re: /mustique|caribbean/i, ids: ['mustique'] },
  { re: /joshua.?tree|\bjtree\b/i, ids: ['joshua-tree'] },
  { re: /malibu/i, ids: ['malibu'] },
  { re: /santa.?barb/i, ids: ['santa-barbara'] },
  { re: /yosemite/i, ids: ['yosemite'] },
  { re: /big.?bear/i, ids: ['big-bear'] },
  { re: /pinnacles/i, ids: ['pinnacles'] },
  { re: /butano|buteno/i, ids: ['butano'] },
  { re: /castle.?rock/i, ids: ['castle-rock'] },
  { re: /turtle.?rock|marin/i, ids: ['marin'] },
  { re: /sibley/i, ids: ['san-francisco'] },
  { re: /napa/i, ids: ['napa'] },
  { re: /tahoe/i, ids: ['tahoe'] },
  { re: /mammoth|bishop/i, ids: ['mammoth'] },
  { re: /catalina/i, ids: ['catalina'] },
  { re: /palm.?springs/i, ids: ['palm-springs'] },
  { re: /disneyland/i, ids: ['disneyland'] },
  { re: /thousand.?steps|newport/i, ids: ['newport'] },
  { re: /hollywood/i, ids: ['hollywood'] },
  { re: /brian.?head/i, ids: ['brian-head'] },
  { re: /sacramento|y&g|youth/i, ids: ['sacramento'] },
  { re: /new.?york|nyc|manhattan|brooklyn|knicks/i, ids: ['new-york'] },
  { re: /irvine|home for the|christmas break|thanksgiving break|hs |high school|harbor.?view|hvst|oc fair|college shirt/i, ids: ['irvine'] },
  { re: /\bsf\b|san.?francisco|berkeley|outside.?lands|friendsgiving.?202|santa.?con|back in berkeley|tour de virgo/i, ids: ['san-francisco'] },
  { re: /san.?diego|coronado/i, ids: ['san-diego'] },
  { re: /miami/i, ids: ['miami'] },
  { re: /indianapolis|\bindy\b/i, ids: ['indianapolis'] },
  { re: /hamptons/i, ids: ['hamptons'] },
  { re: /hawley/i, ids: ['hawley'] },
  { re: /ireland/i, ids: ['ireland'] },
  { re: /taiwan/i, ids: ['taipei'] },
  { re: /cebu|philippines/i, ids: ['cebu'] },
  { re: /niseko|japan/i, ids: ['niseko'] }
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function decode(html) {
  return String(html || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferType(trip) {
  const blob = [trip.people, trip.title, trip.slug].join(' ').toLowerCase();
  if (/\bolive tree|crefc|nmhc|eastdil|accenture|amazon internship|work reunion|analyst training|viavi|trinet|northwestern mutual|cre banquet|es analyst|o4u|guardsmen/.test(blob)) {
    return 'work';
  }
  if (/\bfamily\b|mom'?s wedding|agong|hs family|first family ski|new years family|irvine christmas/.test(blob)) {
    return 'family';
  }
  if (/\bfriends\b|seattle crew|seattle friends|new york friends|cal-ka|parth,|noah, danny/.test(blob)) {
    return 'friends';
  }
  if (/\bsolo\b/.test(blob)) return 'solo';
  return 'other';
}

const SLUG_PLACES = {
  'Graduation-Party-2020': ['san-francisco'],
  'Starting-adult-life-2019': ['san-francisco'],
  "Vincent's-bday-2019": ['san-francisco'],
  'Connor-bday-May-2021': ['san-francisco'],
  'Vincent-Visit-Work-Reunion-July-2021': ['san-francisco'],
  'Work-Reunion-May-2021': ['san-francisco'],
  'Holcomb-Valley-19': ['big-bear'],
  'Agong-USA-2017': ['irvine'],
  'Home-2016': ['irvine'],
  'Senior-Bago-2018': ['san-francisco']
};

function resolvePlaces(trip) {
  if (SLUG_PLACES[trip.slug]) return SLUG_PLACES[trip.slug].slice();
  const loc = String(trip.location || '').trim().toLowerCase();
  if (LOCATION_ALIASES[loc]) return LOCATION_ALIASES[loc].slice();

  const hay = [trip.location, trip.title, trip.slug].join(' ');
  for (const rule of KEYWORD_PLACES) {
    if (rule.re.test(hay)) return rule.ids.slice();
  }
  return [];
}

function collectTrips() {
  const files = walk(SUB);
  const yamls = files.filter((f) => f.endsWith('trip.yaml'));
  const yamlDirs = new Set();
  const trips = [];

  for (const y of yamls) {
    const data = yaml.load(fs.readFileSync(y, 'utf8')) || {};
    const dir = path.dirname(y);
    yamlDirs.add(dir);
    const page = (data.pages && data.pages[0] && data.pages[0].file)
      || fs.readdirSync(dir).find((f) => f.endsWith('-1.html'))
      || fs.readdirSync(dir).find((f) => f.endsWith('.html'));
    const intro = String(data.introParagraph || '').trim();
    trips.push({
      title: data.title || '',
      year: String(data.year || ''),
      dateRange: data.dateRange || '',
      location: data.location || '',
      people: data.people || '',
      thumb: data.gallaryThumb || '',
      href: page ? path.relative(ROOT, path.join(dir, page)).replace(/\\/g, '/') : '',
      slug: data.slug || path.basename(dir),
      intro: intro && intro !== '[INTRO_PARAGRAPH]' ? intro : ''
    });
  }

  const htmls = files.filter((f) => f.endsWith('.html') && !f.includes('Placeholder'));
  const seenDirs = new Set();
  for (const h of htmls) {
    const dir = path.dirname(h);
    if (yamlDirs.has(dir) || seenDirs.has(dir)) continue;
    const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
    const chosen = pages.find((f) => /-1\.html$/i.test(f)) || pages[0];
    if (path.basename(h) !== chosen) continue;
    seenDirs.add(dir);
    const html = fs.readFileSync(h, 'utf8');
    const title = decode((html.match(/<h1[^>]*entry__title[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '');
    const loc = decode((html.match(/cat-links[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) || [])[1] || '');
    const people = decode((html.match(/author">\s*With\s*<a[^>]*>([^<]+)<\/a>/i) || [])[1] || '');
    const date = decode((html.match(/class="date">([^<]+)</i) || [])[1] || '');
    const thumbMatch = html.match(/src="((?:\.\.\/)+assets\/images\/[^"]+)"/i);
    let thumb = '';
    if (thumbMatch) {
      thumb = thumbMatch[1].replace(/^(?:\.\.\/)+/, '');
    }
    const rel = path.relative(ROOT, path.join(dir, chosen)).replace(/\\/g, '/');
    const parts = rel.split('/');
    let year = '';
    if (parts[1] === '20s' && parts[2]) year = parts[2];
    trips.push({
      title,
      year,
      dateRange: date,
      location: loc,
      people,
      thumb,
      href: rel,
      slug: path.basename(dir),
      intro: ''
    });
  }
  return trips;
}

function yearSortValue(year) {
  const n = parseInt(String(year).slice(0, 4), 10);
  return Number.isFinite(n) ? n : 0;
}

const trips = collectTrips();
const byPlace = {};
const unmatched = [];

for (const trip of trips) {
  const ids = resolvePlaces(trip);
  if (!ids.length) {
    unmatched.push({ title: trip.title, slug: trip.slug, location: trip.location });
    continue;
  }
  const type = inferType(trip);
  const record = {
    title: trip.title,
    year: trip.year,
    dateRange: trip.dateRange,
    people: trip.people,
    type,
    href: trip.href,
    thumb: trip.thumb,
    excerpt: trip.intro ? trip.intro.replace(/\s+/g, ' ').slice(0, 180) : ''
  };
  for (const id of ids) {
    if (!PLACES[id]) continue;
    if (!byPlace[id]) byPlace[id] = { ...PLACES[id], trips: [] };
    byPlace[id].trips.push(record);
  }
}

const places = Object.values(byPlace)
  .map((place) => {
    place.trips.sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year) || String(b.dateRange).localeCompare(String(a.dateRange)));
    const types = Array.from(new Set(place.trips.map((t) => t.type)));
    return {
      id: place.id,
      name: place.name,
      region: place.region,
      country: place.country,
      iso: place.iso,
      lat: place.lat,
      lng: place.lng,
      types,
      tripCount: place.trips.length,
      years: Array.from(new Set(place.trips.map((t) => t.year).filter(Boolean))),
      trips: place.trips
    };
  })
  .sort((a, b) => b.tripCount - a.tripCount || a.name.localeCompare(b.name));

const countries = Array.from(new Set(places.map((p) => p.iso))).sort();
const uniqueTripHrefs = new Set();
places.forEach((place) => place.trips.forEach((trip) => uniqueTripHrefs.add(trip.href)));
const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    places: places.length,
    trips: uniqueTripHrefs.size,
    countries: countries.length,
    unmatched: unmatched.length
  },
  countries,
  places,
  unmatched
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log('Wrote', path.relative(ROOT, OUT));
console.log(payload.totals);
if (unmatched.length) {
  console.log('\nUnmatched:');
  unmatched.forEach((u) => console.log(' -', u.title, '|', u.slug, '|', u.location));
}
