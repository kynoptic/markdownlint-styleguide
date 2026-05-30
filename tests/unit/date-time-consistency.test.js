/**
 * Unit coverage for the date-time-consistency rule (DTC001).
 *
 * Exercises the pure date/time helpers and the rule end-to-end through
 * markdownlint, validating weekday/abbreviation/offset checks, DST edge
 * detection, code-context skipping, and autofix behavior.
 */
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import dateTimeConsistency from '../../src/rules/date-time-consistency.js';
import {
  actualWeekday,
  dstAbbreviation,
  zoneOffsetHours,
  classifyDstEdge,
} from '../../src/rules/date-time-consistency.js';

const TZ = 'America/New_York';

/**
 * Lint a markdown string with the rule enabled.
 *
 * @param {string} content - Markdown source.
 * @param {object} [config] - Rule configuration overrides.
 * @returns {Promise<import('markdownlint').LintError[]>} Errors for the rule.
 */
async function run(content, config = {}) {
  const results = await lint({
    strings: { doc: content },
    customRules: [dateTimeConsistency],
    config: { default: false, 'date-time-consistency': { timezone: TZ, ...config } },
  });
  return results.doc;
}

/**
 * Apply the rule's autofixes to a markdown string.
 *
 * @param {string} content - Markdown source.
 * @param {object} [config] - Rule configuration overrides.
 * @returns {Promise<string>} Fixed markdown.
 */
async function fix(content, config = {}) {
  const errors = await run(content, config);
  return applyFixes(content, errors);
}

describe('date helpers', () => {
  it('should compute the actual weekday in the configured zone', () => {
    expect(actualWeekday(TZ, 2025, 11, 15)).toBe('Saturday');
    expect(actualWeekday(TZ, 2025, 1, 1)).toBe('Wednesday');
  });

  it('should report EST for a November date and EDT for a July date', () => {
    expect(dstAbbreviation(TZ, 2025, 11, 15, 15, 0)).toBe('EST');
    expect(dstAbbreviation(TZ, 2025, 7, 15, 15, 0)).toBe('EDT');
  });

  it('should map abbreviations to their UTC offsets via the zone', () => {
    expect(zoneOffsetHours(TZ, 2025, 11, 15, 15, 0)).toBe(-5);
    expect(zoneOffsetHours(TZ, 2025, 7, 15, 15, 0)).toBe(-4);
  });

  it('should flag the spring-forward skipped hour as a gap', () => {
    expect(classifyDstEdge(TZ, 2025, 3, 9, 2, 30)).toBe('gap');
  });

  it('should flag the fall-back repeated hour as ambiguous', () => {
    expect(classifyDstEdge(TZ, 2025, 11, 2, 1, 30)).toBe('ambiguous');
  });

  it('should report no edge for an ordinary hour', () => {
    expect(classifyDstEdge(TZ, 2025, 11, 15, 15, 0)).toBe(null);
  });
});

describe('weekday validation', () => {
  it('should flag a wrong weekday and name the actual one', async () => {
    const errors = await run('Thursday, November 15, 2025 is the date.\n');
    expect(errors).toHaveLength(1);
    expect(errors[0].errorDetail).toMatch(/Saturday/);
  });

  it('should report no findings for correct content', async () => {
    const errors = await run(
      'Wednesday, January 1, 2025, at 3:30 PM EST (UTC-5) works.\n',
    );
    expect(errors).toHaveLength(0);
  });

  it('should autofix a wrong weekday to the correct one', async () => {
    const fixed = await fix('Thursday, November 15, 2025 is the date.\n');
    expect(fixed).toContain('Saturday, November 15, 2025');
  });
});

describe('abbreviation and offset validation', () => {
  it('should fix EDT to EST and the offset on a November date', async () => {
    const fixed = await fix(
      'Saturday, November 15, 2025, at 3:00 PM EDT (UTC-4).\n',
    );
    expect(fixed).toContain('3:00 PM EST (UTC-5)');
  });

  it('should fix a mismatched offset to match the date', async () => {
    const fixed = await fix(
      'Saturday, November 15, 2025, at 3:00 PM EDT (UTC-5).\n',
    );
    expect(fixed).toContain('3:00 PM EST (UTC-5)');
  });
});

describe('DST transition edge hours', () => {
  it('should flag the skipped hour without offering a fix', async () => {
    const content = 'Sunday, March 9, 2025, at 2:30 AM EDT.\n';
    const errors = await run(content);
    const edge = errors.find((e) => /does not exist|skipped/i.test(e.errorDetail));
    expect(edge).toBeDefined();
    expect(edge.fixInfo == null).toBe(true);
  });

  it('should flag the ambiguous hour without offering a fix', async () => {
    const content = 'Sunday, November 2, 2025, at 1:30 AM EDT.\n';
    const errors = await run(content);
    const edge = errors.find((e) => /ambiguous|occurs twice/i.test(e.errorDetail));
    expect(edge).toBeDefined();
    expect(edge.fixInfo == null).toBe(true);
  });
});

describe('code context', () => {
  it('should not flag a date inside a fenced code block', async () => {
    const content = '```\nThursday, November 15, 2025\n```\n';
    const errors = await run(content);
    expect(errors).toHaveLength(0);
  });

  it('should not flag a date inside inline code', async () => {
    const content = 'See `Thursday, November 15, 2025` in the log.\n';
    const errors = await run(content);
    expect(errors).toHaveLength(0);
  });
});

describe('default year', () => {
  it('should assume the current year and note it when the year is omitted', async () => {
    const year = new Date().getFullYear();
    const actual = actualWeekday(TZ, year, 11, 15);
    const wrong = actual === 'Monday' ? 'Tuesday' : 'Monday';
    const errors = await run(`${wrong}, November 15 is the date.\n`);
    expect(errors).toHaveLength(1);
    expect(errors[0].errorDetail).toMatch(new RegExp(String(year)));
  });
});

describe('abbreviated and ordinal forms', () => {
  it('should handle abbreviated month and weekday names', async () => {
    const errors = await run('Thu, Nov 15, 2025 is the date.\n');
    expect(errors).toHaveLength(1);
    expect(errors[0].errorDetail).toMatch(/Sat/);
  });

  it('should handle ordinal day suffixes', async () => {
    const errors = await run('Thursday, November 15th, 2025 is the date.\n');
    expect(errors).toHaveLength(1);
    expect(errors[0].errorDetail).toMatch(/Saturday/);
  });
});

describe('invalid calendar dates', () => {
  it('should not crash on February 29 in a non-leap year', async () => {
    const errors = await run('February 29, 2025 is not real.\n');
    expect(Array.isArray(errors)).toBe(true);
  });
});
