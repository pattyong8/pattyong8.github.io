/**
 * Regression: year memory-bar nav must never point at Travel-Pages-Sub trip pages.
 * Run: npm test (from travel-page-tool/)
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertYearNavIntact,
  hasYearNavTripLinks,
  yearPageGalleryRegion,
  yearPageNavRegion,
} from '../dist/layout-guards.js';

const intact = `
<div class="memories-home">
  <div class="dropdown-content-travelbar">
    <a href="../../Travel-Pages/20s/20s-2026.html">2026</a>
    <a href="../../Travel-Pages/20s/20s-2025.html">2025</a>
  </div>
</div>
<div class="filtr-container">
  <div class="row">
    <a href="../../Travel-Pages-Sub/20s/2026/May-Quinns-Bday-2026/May-Quinns-Bday-2026-1.html">
      <img src="../../assets/images/gallary/20s/2026/May-Quinns-Bday-2026.jpeg"/>
    </a>
  </div>
</div>
`;

const corrupted = intact.replace(
  'href="../../Travel-Pages/20s/20s-2025.html"',
  'href="../../Travel-Pages-Sub/20s/2026/May-Quinns-Bday-2026/May-Quinns-Bday-2026-1.html"'
);

test('intact year page: nav has no trip links; gallery may', () => {
  assert.equal(hasYearNavTripLinks(intact), false);
  assert.doesNotThrow(() => assertYearNavIntact(intact));
  assert.match(yearPageGalleryRegion(intact), /Travel-Pages-Sub/);
  assert.doesNotMatch(yearPageNavRegion(intact), /Travel-Pages-Sub/);
});

test('detects corrupted year-nav trip link (Quinn/2025 bug)', () => {
  assert.equal(hasYearNavTripLinks(corrupted), true);
  assert.throws(() => assertYearNavIntact(corrupted));
});
