// @ts-check

/**
 * @feature
 * SC001 must preserve universal Apple/Microsoft brand casing in headings and
 * bold text (#288). `ios`/`macos`/`github` were already in the default casing
 * dictionary, but the Apple device/product family, `MacBook`, `Apple Photos`,
 * `Apple Music`, and `OneDrive` were missing, so headings like `## iCloud
 * Storage` were autofixed to `Icloud storage`.
 *
 * Scope is unambiguous universal brands only. Terms that collide with common
 * English (e.g. "Time Machine") stay in per-repo properNouns config.
 */
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';

/**
 * @param {string} content
 * @returns {Promise<object[]>}
 */
async function getSC001Violations(content) {
  const results = await lint({
    customRules: [sentenceRule],
    strings: { 'test.md': content },
    config: { default: false, 'sentence-case-heading': {} },
    resultVersion: 3,
  });
  return (results['test.md'] || []).filter(
    (v) =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001'),
  );
}

const brandHeadings = [
  '## iCloud sync',
  '## iPhone setup',
  '## iPad configuration',
  '## iMac teardown',
  '## iPod nano',
  '## iTunes library',
  '## iMovie export',
  '## iWork suite',
  '## iPadOS release notes',
  '## watchOS faces',
  '## tvOS remote',
  '## MacBook backup',
  '## MacBook Air backup',
  '## MacBook Pro setup',
  '## Apple Photos sync',
  '## Apple Music ratings',
  '## OneDrive migration',
];

describe('SC001 preserves Apple/Microsoft brand casing (#288)', () => {
  for (const heading of brandHeadings) {
    test(`does not flag "${heading}"`, async () => {
      const violations = await getSC001Violations(heading);
      expect(violations).toHaveLength(0);
    });
  }

  test('still flags a genuine title-case heading', async () => {
    const violations = await getSC001Violations('## Audit Protocol');
    expect(violations.length).toBeGreaterThan(0);
  });
});
