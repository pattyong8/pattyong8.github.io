/**
 * Regression: leftover wrap must keep ALL paragraphs before clear:both.
 * Run: npm test (from travel-page-tool/)
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSectionHtml } from '../dist/commands/render-trip.js';
import {
  assertNoLeftoverBlankColumn,
  hasLeftoverBlankColumn,
} from '../dist/layout-guards.js';

const baseManifest = {
  schemaVersion: 1,
  title: 'Test',
  slug: 'Test',
  section: '20s',
  year: '2022',
  tripPrefix: 'Test',
  photosDir: 'assets/images/Travel-Pages-Images/20s/2022/Test',
  coverSource: 'Cover.jpeg',
  photos: [
    { id: 'p1', seq: 1, file: 'Test-1.jpeg' },
    { id: 'p2', seq: 2, file: 'Test-2.jpeg' },
    { id: 'p3', seq: 3, file: 'Test-3.jpeg' },
    { id: 'p4', seq: 4, file: 'Test-4.jpeg' },
  ],
  sections: [],
  pages: [{ file: 'Test-1.html', sectionIds: [] }],
};

test('leftover section puts every paragraph inside wrap before clear', () => {
  const html = renderSectionHtml(
    {
      id: 'bbq',
      title: 'Korean BBQ Night',
      photoIds: ['p1', 'p2', 'p3', 'p4'],
      prose:
        'First paragraph about the meal.\n\nSecond paragraph about flossing afterward.',
    },
    baseManifest,
    'prefix-'
  );

  assert.match(html, /travel-leftover-wrap/);
  const wrapIdx = html.indexOf('travel-leftover-wrap');
  const clearIdx = html.indexOf('clear:both', wrapIdx);
  const p1 = html.indexOf('First paragraph', wrapIdx);
  const p2 = html.indexOf('Second paragraph', wrapIdx);
  assert.ok(p1 > wrapIdx && p1 < clearIdx, 'first paragraph before clear');
  assert.ok(p2 > wrapIdx && p2 < clearIdx, 'second paragraph before clear');
  assert.equal(hasLeftoverBlankColumn(html), false);
  assert.doesNotThrow(() => assertNoLeftoverBlankColumn(html));
});

test('guard detects the old blank-column bug pattern', () => {
  const buggy = `
			<div class="travel-leftover-wrap">
				<div class="travel-leftover-photos"></div>
				<p style="x">Only first paragraph</p>
				<div style="clear:both"></div>
			</div>
			<p style="x">Second paragraph outside — blank column bug</p>
`;
  assert.equal(hasLeftoverBlankColumn(buggy), true);
  assert.throws(() => assertNoLeftoverBlankColumn(buggy));
});
