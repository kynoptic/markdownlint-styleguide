// @ts-check

/**
 * Rule that validates written weekdays, timezone abbreviations, and UTC offsets
 * against the numbered calendar date they accompany.
 *
 * The numbered date (`<Month> <Day>[, <Year>]`) is treated as the single
 * authoritative source when a timezone is pinned. Weekday names, `EST`/`EDT`
 * style abbreviations, and `(UTC[+-]n)` offsets are checked and auto-fixed from
 * that date. Hours that fall on a daylight-saving transition (the skipped hour
 * on spring-forward, the repeated hour on fall-back) are flagged lint-only
 * because the intended adjacent time is author-dependent.
 *
 * Zone resolution uses `Intl.DateTimeFormat` with the configured IANA zone, so
 * no runtime timezone-data dependency is required and any zone is supported.
 */

import {
  validateString,
  validateConfig,
  logValidationErrors,
  createMarkdownlintLogger,
} from './config-validation.js';
import { buildLineContext } from './shared-context.js';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Map both full and three-letter month names to a 1-based month number. */
const MONTH_INDEX = (() => {
  const map = new Map();
  MONTHS.forEach((name, i) => {
    map.set(name.toLowerCase(), i + 1);
    map.set(name.slice(0, 3).toLowerCase(), i + 1);
  });
  return map;
})();

const WEEKDAY_FULL = WEEKDAYS.join('|');
const WEEKDAY_ABBR = WEEKDAYS.map((d) => d.slice(0, 3)).join('|');
const MONTH_FULL = MONTHS.join('|');
const MONTH_ABBR = MONTHS.map((m) => m.slice(0, 3)).join('|');

/**
 * Match a date phrase: optional weekday, month, day (with optional ordinal),
 * and optional year.
 *
 * Groups: 1 weekday, 2 month, 3 day, 4 year.
 */
const DATE_RE = new RegExp(
  `\\b(?:(${WEEKDAY_FULL}|${WEEKDAY_ABBR})\\.?,?\\s+)?` +
    `(${MONTH_FULL}|${MONTH_ABBR})\\.?\\s+` +
    '(\\d{1,2})(?:st|nd|rd|th)?' +
    '(?:,?\\s+(\\d{4}))?',
  'gi',
);

/**
 * Match a time phrase: hour, optional minute, meridiem, abbreviation, and an
 * optional `(UTC±n)` offset.
 *
 * Groups: 1 hour, 2 minute, 3 meridiem, 4 abbreviation, 5 offset sign, 6 offset
 * magnitude.
 */
const TIME_RE =
  /\b(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])\s+([A-Z]{2,5}T)(?:\s*\(UTC([+-])(\d{1,2})\))?/g;

/**
 * Extract numeric date/time parts for the configured zone from an instant.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {Date} instant - Absolute instant to render.
 * @returns {{year:number,month:number,day:number,hour:number,minute:number,second:number}}
 */
function zoneParts(timezone, instant) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== 'literal') {
      out[part.type] = Number(part.value);
    }
  }
  // Intl renders midnight as hour 24 in some engines; normalize to 0.
  if (out.hour === 24) out.hour = 0;
  return out;
}

/**
 * Offset in milliseconds (zone-local minus UTC) at a given instant.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {Date} instant - Absolute instant.
 * @returns {number} Offset in milliseconds.
 */
function offsetMs(timezone, instant) {
  const p = zoneParts(timezone, instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant.getTime();
}

/**
 * Resolve the absolute instant for a wall-clock time in a zone.
 *
 * Two refinement passes converge on the correct offset across DST boundaries.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @param {number} [hour=12] - Hour (0-23).
 * @param {number} [minute=0] - Minute.
 * @returns {Date} The resolved instant.
 */
function instantFromWall(timezone, year, month, day, hour = 12, minute = 0) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  let ts = naive - offsetMs(timezone, new Date(naive));
  ts = naive - offsetMs(timezone, new Date(ts));
  return new Date(ts);
}

/**
 * Weekday name for a calendar date in the configured zone.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @returns {string} Full weekday name (e.g. `Saturday`).
 */
export function actualWeekday(timezone, year, month, day) {
  const instant = instantFromWall(timezone, year, month, day, 12, 0);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(instant);
}

/**
 * Timezone abbreviation (e.g. `EST`/`EDT`) for a wall-clock date/time.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @param {number} hour - Hour (0-23).
 * @param {number} minute - Minute.
 * @returns {string} Short timezone name.
 */
export function dstAbbreviation(timezone, year, month, day, hour, minute) {
  const instant = instantFromWall(timezone, year, month, day, hour, minute);
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  })
    .formatToParts(instant)
    .find((p) => p.type === 'timeZoneName');
  return part ? part.value : '';
}

/**
 * UTC offset in whole hours for a wall-clock date/time in the zone.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @param {number} hour - Hour (0-23).
 * @param {number} minute - Minute.
 * @returns {number} Offset in hours (e.g. -5 for EST).
 */
export function zoneOffsetHours(timezone, year, month, day, hour, minute) {
  const instant = instantFromWall(timezone, year, month, day, hour, minute);
  return offsetMs(timezone, instant) / 3600000;
}

/**
 * Classify a wall-clock time against the zone's DST transitions.
 *
 * @param {string} timezone - IANA timezone identifier.
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @param {number} hour - Hour (0-23).
 * @param {number} minute - Minute.
 * @returns {'gap'|'ambiguous'|null} `gap` for a skipped hour, `ambiguous` for a
 *   repeated hour, `null` otherwise.
 */
export function classifyDstEdge(timezone, year, month, day, hour, minute) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offBefore = offsetMs(timezone, new Date(naive - 6 * 3600000));
  const offAfter = offsetMs(timezone, new Date(naive + 6 * 3600000));
  if (offBefore === offAfter) {
    return null;
  }

  const wall = [year, month, day, hour, minute].join(',');
  const renders = (off) => {
    const p = zoneParts(timezone, new Date(naive - off));
    return [p.year, p.month, p.day, p.hour, p.minute].join(',');
  };
  const matchBefore = renders(offBefore) === wall;
  const matchAfter = renders(offAfter) === wall;

  if (matchBefore && matchAfter) {
    return 'ambiguous';
  }
  if (!matchBefore && !matchAfter) {
    return 'gap';
  }
  return null;
}

/**
 * Convert a 12-hour clock reading to a 24-hour hour value.
 *
 * @param {number} hour12 - Hour as written (1-12).
 * @param {string} meridiem - `AM` or `PM` (any case).
 * @returns {number} Hour in 0-23.
 */
function to24Hour(hour12, meridiem) {
  const isPm = meridiem.toLowerCase() === 'pm';
  if (hour12 === 12) {
    return isPm ? 12 : 0;
  }
  return isPm ? hour12 + 12 : hour12;
}

/**
 * Validate that a parsed calendar date is real (rejects e.g. Feb 29 non-leap).
 *
 * @param {number} year - Four-digit year.
 * @param {number} month - 1-based month.
 * @param {number} day - Day of month.
 * @returns {boolean} True when the date exists.
 */
function isValidDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Preserve the casing convention of an existing token when substituting.
 *
 * Abbreviated source (3-letter weekday) yields an abbreviated replacement.
 *
 * @param {string} original - Token as written in the source.
 * @param {string} fullReplacement - Full canonical replacement.
 * @returns {string} Replacement matching the original's length convention.
 */
function matchWeekdayForm(original, fullReplacement) {
  const stripped = original.replace(/\.$/, '');
  if (stripped.length <= 3) {
    return fullReplacement.slice(0, 3);
  }
  return fullReplacement;
}

/**
 * Build the rule configuration with defaults applied.
 *
 * @param {object} raw - Raw config object.
 * @returns {{timezone:string, defaultYear:number|null}}
 */
function resolveConfig(raw) {
  const timezone =
    typeof raw.timezone === 'string' && raw.timezone
      ? raw.timezone
      : 'America/New_York';
  const defaultYear =
    typeof raw.defaultYear === 'number' ? raw.defaultYear : null;
  return { timezone, defaultYear };
}

/**
 * Main rule implementation.
 *
 * @param {import("markdownlint").RuleParams} params - Parsed Markdown input.
 * @param {import("markdownlint").RuleOnError} onError - Violation callback.
 */
function dateTimeConsistency(params, onError) {
  if (!params || !params.lines || typeof onError !== 'function') {
    return;
  }

  const rawConfig =
    params.config?.['date-time-consistency'] || params.config?.DTC001 || {};

  const schema = {
    timezone: validateString,
  };
  const validation = validateConfig(rawConfig, schema, 'date-time-consistency');
  if (!validation.isValid) {
    const logger = createMarkdownlintLogger(onError, 'date-time-consistency');
    logValidationErrors('date-time-consistency', validation.errors, logger);
  }

  const { timezone, defaultYear } = resolveConfig(rawConfig);

  // Guard against an unusable zone so a typo cannot crash every document.
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    return;
  }

  const lines = params.lines;
  const context = buildLineContext(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (context.isInFencedCode(i) || context.isInFrontmatter(i)) {
      continue;
    }

    // Find the last date on the line; time phrases bind to the preceding date.
    let lastDate = null;
    DATE_RE.lastIndex = 0;
    let dateMatch;
    while ((dateMatch = DATE_RE.exec(line)) !== null) {
      const matchStart = dateMatch.index;
      if (context.isInInlineCode(i, matchStart)) {
        continue;
      }

      const [, weekdayRaw, monthRaw, dayRaw, yearRaw] = dateMatch;
      const month = MONTH_INDEX.get(monthRaw.replace(/\.$/, '').toLowerCase());
      const day = Number(dayRaw);
      const yearGiven = yearRaw !== undefined;
      const year = yearGiven
        ? Number(yearRaw)
        : (defaultYear ?? new Date().getFullYear());

      if (!month || !isValidDate(year, month, day)) {
        continue;
      }

      lastDate = { year, month, day, yearGiven, index: matchStart };

      if (weekdayRaw) {
        const actual = actualWeekday(timezone, year, month, day);
        const writtenFull =
          WEEKDAYS.find(
            (d) =>
              d.toLowerCase() ===
                weekdayRaw.replace(/\.$/, '').toLowerCase() ||
              d.slice(0, 3).toLowerCase() ===
                weekdayRaw.replace(/\.$/, '').toLowerCase(),
          ) || '';

        if (writtenFull && writtenFull !== actual) {
          const replacement = matchWeekdayForm(weekdayRaw, actual);
          const yearNote = yearGiven ? '' : ` (assuming year ${year})`;
          onError({
            lineNumber,
            detail:
              `Weekday does not match the date: ${monthRaw} ${day} ` +
              `${year} is a ${actual}, not ${weekdayRaw}${yearNote}`,
            range: [matchStart + 1, weekdayRaw.length],
            fixInfo: {
              editColumn: matchStart + 1,
              deleteCount: weekdayRaw.length,
              insertText: replacement,
            },
          });
        }
      }
    }

    // Time phrases bind to the most recent date at or before their position.
    TIME_RE.lastIndex = 0;
    let timeMatch;
    while ((timeMatch = TIME_RE.exec(line)) !== null) {
      const matchStart = timeMatch.index;
      if (context.isInInlineCode(i, matchStart)) {
        continue;
      }
      if (!lastDate || lastDate.index > matchStart) {
        continue;
      }

      const [, hourRaw, minRaw, meridiem, abbrRaw, offSign, offMag] = timeMatch;
      const hour12 = Number(hourRaw);
      const minute = minRaw ? Number(minRaw) : 0;
      const hour24 = to24Hour(hour12, meridiem);
      const { year, month, day } = lastDate;

      const edge = classifyDstEdge(timezone, year, month, day, hour24, minute);
      if (edge === 'gap') {
        onError({
          lineNumber,
          detail:
            `Time ${hourRaw}:${String(minute).padStart(2, '0')} ${meridiem} ` +
            'does not exist on this date (skipped during spring-forward); ' +
            'verify the intended time manually',
          range: [matchStart + 1, timeMatch[0].length],
        });
        continue;
      }
      if (edge === 'ambiguous') {
        onError({
          lineNumber,
          detail:
            `Time ${hourRaw}:${String(minute).padStart(2, '0')} ${meridiem} ` +
            'is ambiguous on this date (occurs twice during fall-back); ' +
            'verify the intended time manually',
          range: [matchStart + 1, timeMatch[0].length],
        });
        continue;
      }

      // Only validate abbreviations that the zone actually produces.
      const expectedAbbr = dstAbbreviation(
        timezone,
        year,
        month,
        day,
        hour24,
        minute,
      );
      const expectedOffset = zoneOffsetHours(
        timezone,
        year,
        month,
        day,
        hour24,
        minute,
      );

      // Compute the abbreviation column within the time match.
      const abbrIndex = timeMatch[0].indexOf(abbrRaw);
      const abbrColumn = matchStart + abbrIndex + 1;

      const abbrWrong =
        abbrRaw.toUpperCase() !== expectedAbbr.toUpperCase() &&
        // Only meaningful when the written abbreviation is one the zone uses.
        /^E[SD]T$/i.test(abbrRaw);

      const offsetGiven = offSign !== undefined;
      const writtenOffset = offsetGiven
        ? Number(`${offSign}${offMag}`)
        : null;
      const offsetWrong = offsetGiven && writtenOffset !== expectedOffset;

      if (abbrWrong || offsetWrong) {
        // Rebuild the canonical abbreviation + offset suffix.
        const expectedSign = expectedOffset < 0 ? '-' : '+';
        const canonicalOffset = `(UTC${expectedSign}${Math.abs(expectedOffset)})`;
        const tail = offsetGiven
          ? `${expectedAbbr} ${canonicalOffset}`
          : expectedAbbr;
        const replaceStart = abbrColumn;
        const replaceLen = timeMatch[0].length - abbrIndex;

        const detailParts = [];
        if (abbrWrong) {
          detailParts.push(`abbreviation should be ${expectedAbbr}, not ${abbrRaw}`);
        }
        if (offsetWrong) {
          detailParts.push(
            `offset should be UTC${expectedSign}${Math.abs(expectedOffset)}`,
          );
        }

        onError({
          lineNumber,
          detail: `Timezone ${detailParts.join(' and ')} for this date`,
          range: [replaceStart, replaceLen],
          fixInfo: {
            editColumn: replaceStart,
            deleteCount: replaceLen,
            insertText: tail,
          },
        });
      }
    }
  }
}

export default {
  names: ['date-time-consistency', 'DTC001'],
  description:
    'Validates weekdays, timezone abbreviations, and UTC offsets against the calendar date',
  tags: ['accuracy', 'date'],
  parser: 'micromark',
  function: dateTimeConsistency,
  fixable: true,
};
