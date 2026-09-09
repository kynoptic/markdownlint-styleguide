/**
 * @fileoverview Regression tests for issues #342 and #343 — destructive SC001 autofix.
 *
 * #342: the casing exemption for code identifiers (camelCase, PascalCase,
 * snake_case) was consulted by the heading subsequent-word validator but not by
 * the leading-emoji first-word path or the bold-text subsequent-word path, so
 * those two reported an identifier, and `--fix` lowercased `useEffect` into
 * `useeffect`.
 *
 * #343: the fix builder's own placeholder mechanism (`__P_<n>__`) is mangled by
 * the sentence-case transform, so the case-sensitive restore step misses it and
 * the placeholder reaches the document.
 *
 * The fix for the two damaging outputs is withholding, not repair: a candidate
 * fix that would alter an exempt identifier or that still carries an internal
 * placeholder is discarded, and the violation is reported without a fix. A falsy
 * `fixInfo` beside a reported violation is therefore the expected result here.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import { buildBoldTextFix } from '../../src/rules/sentence-case/fix-builder.js';

/** Pattern matching the fix builder's internal placeholder in any casing. */
const PLACEHOLDER_PATTERN = /__p_\d+__/i;

/**
 * Lint one line with SC001 and return its violations.
 * @param {string} content - Markdown line to lint.
 * @param {object|boolean} [ruleConfig=true] - SC001 configuration.
 * @returns {Promise<Array<object>>} Violations reported for the line.
 */
async function violations(content, ruleConfig = true) {
  const result = await lint({
    strings: { t: `${content}\n` },
    customRules: [sentenceRule],
    config: { default: false, 'sentence-case-heading': ruleConfig },
    resultVersion: 3
  });
  return result.t || [];
}

/**
 * Lint one line with SC001 in fix mode and return the autofixed text.
 * @param {string} content - Markdown line to lint and fix.
 * @param {object|boolean} [ruleConfig=true] - SC001 configuration.
 * @returns {Promise<string>} The line after applying SC001 fixes.
 */
async function autofix(content, ruleConfig = true) {
  const source = `${content}\n`;
  const result = await lint({
    strings: { t: source },
    customRules: [sentenceRule],
    config: { default: false, 'sentence-case-heading': ruleConfig },
    resultVersion: 3,
    fix: true
  });
  return applyFixes(source, result.t || []).trimEnd();
}

describe('issue #342 — SC001 must not report or rewrite a code identifier', () => {
  test('GIVEN a heading whose first word after a leading emoji is camelCase WHEN linted THEN the identifier is neither reported nor rewritten', async () => {
    const input = '## 🚀 useEffect setup';
    const found = await violations(input);
    expect(found).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN bold text with a camelCase word after the first WHEN linted THEN the identifier is neither reported nor rewritten', async () => {
    const input = '- **Configure useEffect**';
    const found = await violations(input);
    expect(found).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN a bold camelCase identifier alone WHEN linted THEN no violation is reported', async () => {
    const input = '- **useEffect**';
    expect(await violations(input)).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN a genuine casing violation beside a camelCase word WHEN linted THEN it is reported with no fix rather than fixed destructively', async () => {
    const input = '## Configure useEffect Support';
    const found = await violations(input);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe('Word "Support" in heading should be lowercase.');
    expect(found[0].fixInfo).toBeFalsy();
    expect(await autofix(input)).toBe(input);
  });

  // A fix is offered only where the casing pass happens to leave the identifier
  // alone — "max_retries" is already lowercase and carries no emphasis pair for
  // the markup regex to split. Everywhere else the candidate fix would damage
  // the identifier and is withheld, leaving the line untouched.
  test.each([
    ['## Configure HttpClient Support', '## Configure HttpClient Support'],
    ['## Configure max_retries Support', '## Configure max_retries support'],
    ['## Configure user_name_id Support', '## Configure user_name_id Support'],
    ['## useEffect Setup', '## useEffect Setup'],
    ['- **useEffect Setup**', '- **useEffect Setup**'],
    ['## Set user_name_id Value', '## Set user_name_id Value']
  ])('GIVEN %s WHEN autofixed THEN the identifier survives verbatim', async (input, expected) => {
    expect(await autofix(input)).toBe(expected);
  });

  test('GIVEN every SC001 fix builder entry point WHEN a fix is produced THEN it never alters an exempt identifier', async () => {
    const inputs = [
      '## 🚀 useEffect setup',
      '## Configure useEffect Support',
      '## useEffect Setup',
      '- **Configure useEffect**',
      '- **useEffect Setup**',
      '## Configure HttpClient Support',
      '## Set user_name_id Value'
    ];
    for (const input of inputs) {
      const output = await autofix(input);
      for (const identifier of ['useEffect', 'HttpClient', 'user_name_id']) {
        if (input.includes(identifier)) {
          expect(output).toContain(identifier);
        }
      }
    }
  });
});

describe('issue #343 — SC001 must not offer a fix carrying its own placeholder', () => {
  const placeholderInputs = [
    '## This_sentence Thing',
    '## This_is_sentence Thing',
    '## This_is_a_sentence Thing',
    '## A_b_c_d_e Thing',
    '## (**Bold**) Thing',
    '## (*em*) Thing',
    '## (_em_) Thing',
    '- **This_is_a_sentence Thing**'
  ];

  test('GIVEN a heading with internal underscores WHEN linted THEN the violation is reported without a corrupting fix', async () => {
    const input = '## This_is_a_sentence';
    const found = await violations(input);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe("Heading's first word should be capitalized.");
    expect(found[0].fixInfo).toBeFalsy();
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN the placeholder corpus WHEN linted THEN every line reports a violation, so the assertions below have inputs', async () => {
    const counts = [];
    for (const input of placeholderInputs) {
      counts.push((await violations(input)).length);
    }
    expect(counts.filter((count) => count > 0)).toHaveLength(placeholderInputs.length);
  });

  test.each(placeholderInputs)('GIVEN %s WHEN linted THEN no reported fixInfo carries a placeholder', async (input) => {
    for (const violation of await violations(input)) {
      if (violation.fixInfo?.insertText) {
        expect(violation.fixInfo.insertText).not.toMatch(PLACEHOLDER_PATTERN);
      }
    }
    expect(await autofix(input)).not.toMatch(PLACEHOLDER_PATTERN);
  });
});

describe('the corrupting-fix guard', () => {
  const line = '- **Configure useEffect Now** and more';
  const original = 'Configure useEffect Now';

  test('GIVEN a candidate fix that leaves the exempt token in place WHEN guarded THEN the fix is offered', () => {
    const result = buildBoldTextFix(line, original, 'Configure useEffect now', {});
    expect(result).not.toBeUndefined();
    expect(result.insertText).toBe('Configure useEffect now');
  });

  test('GIVEN a candidate fix that rewrites the exempt token WHEN guarded THEN the fix is withheld', () => {
    expect(buildBoldTextFix(line, original, 'Configure useeffect now', {})).toBeUndefined();
  });

  test('GIVEN a candidate fix that moves the exempt token WHEN guarded THEN the fix is withheld', () => {
    expect(buildBoldTextFix(line, original, 'useEffect configure now', {})).toBeUndefined();
  });

  test('GIVEN a candidate fix that duplicates the exempt token WHEN guarded THEN the fix is withheld', () => {
    expect(buildBoldTextFix(line, original, 'Configure useEffect useEffect now', {})).toBeUndefined();
  });

  test('GIVEN a candidate fix that absorbs the exempt token into its neighbour WHEN guarded THEN the fix is withheld', () => {
    expect(buildBoldTextFix(line, original, 'ConfigureuseEffect now', {})).toBeUndefined();
  });

  test('GIVEN a candidate fix carrying a lowercased placeholder WHEN guarded THEN the fix is withheld', () => {
    expect(buildBoldTextFix(line, original, 'Configure__p_0__now useEffect', {})).toBeUndefined();
  });

  test('GIVEN a token whose casing the configuration forces WHEN linted THEN the fix applying that casing is still offered', async () => {
    const input = '## Configure myComponent support';
    const config = { acronyms: ['MYCOMPONENT'] };
    const found = await violations(input, config);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe('Word "myComponent" should be "MYCOMPONENT".');
    expect(found[0].fixInfo.insertText).toBe('Configure MYCOMPONENT support');
    expect(await autofix(input, config)).toBe('## Configure MYCOMPONENT support');
  });

  test('GIVEN a snake_case token whose casing the configuration forces WHEN linted THEN the fix resolves the violation in one pass', async () => {
    const input = '## Configure open_api Support';
    const config = { acronyms: ['OPEN_API'] };
    expect(await autofix(input, config)).toBe('## Configure OPEN_API support');
    expect(await violations('## Configure OPEN_API support', config)).toEqual([]);
  });
});

describe('the guard reads the fixer\'s dictionary lookup, not the reporters\'', () => {
  // The reporting paths' expectedWordCasing lookup has a fallback key that
  // strips every non-alphanumeric character, so with properNouns: ['Username']
  // it answers "configured" for the token `user_name`. The fix builder keys on
  // the token's core with internal characters intact, finds no `user_name`
  // entry, and generically sentence-cases the identifier to `User_name`.
  // Excluding a token from the protected list on the reporters' answer left the
  // guard nothing to check and let that rewrite through, reopening #342 under
  // ordinary configuration. exemptCodeTokens now reads fixerConfiguredCasing.
  const collide = { properNouns: ['Username'] };

  test.each([
    ['## user_name Is wrong', '## user_name Is wrong'],
    ['- **user_name Is wrong**', '- **user_name Is wrong**']
  ])('GIVEN %s under a colliding properNoun WHEN autofixed THEN the identifier is not rewritten',
    async (input, expected) => {
      expect(await autofix(input, collide)).toBe(expected);
    });

  // Withholding is per candidate fix, not per line: where the casing pass
  // happens to leave the identifier alone the fix is still offered, so the
  // collision guard above is not simply switching autofix off for these lines.
  test('GIVEN a colliding properNoun beside a fixable word WHEN autofixed THEN only that word changes', async () => {
    expect(await autofix('## Set user_name Now', collide)).toBe('## Set user_name now');
  });

  // Pins the choice of lookup directly. The allowed-replacement list already
  // withholds the generic `User_name` rewrite whichever lookup is used, so only
  // this case distinguishes them: reading the reporters' lookup would put
  // `Username` on the allowed list for `user_name` and permit that rewrite,
  // even though the configuration never named `user_name` and the fix builder
  // never produces it.
  test('GIVEN a fix rewriting the identifier to the colliding term WHEN guarded THEN it is withheld', () => {
    const line = '- **user_name Is wrong** and more';
    const terms = { username: 'Username' };
    expect(buildBoldTextFix(line, 'user_name Is wrong', 'Username is wrong', {}, 0, terms)).toBeUndefined();
    expect(buildBoldTextFix(line, 'user_name Is wrong', 'User_name is wrong', {}, 0, terms)).toBeUndefined();
    // The identifier surviving verbatim is still fixable around it.
    expect(buildBoldTextFix(line, 'user_name Is wrong', 'user_name is wrong', {}, 0, terms)).not.toBeUndefined();
  });

  test('GIVEN a colliding properNoun WHEN linted THEN the violation is still reported, only its fix withheld', async () => {
    const found = await violations('## user_name Is wrong', collide);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe('Word "Is" in heading should be lowercase.');
    expect(found[0].fixInfo).toBeFalsy();
  });

  // A configured multi-word phrase is substituted before the word-by-word loop
  // runs, so no per-token lookup can see it: neither `mycomponent` nor `api` is
  // a key on its own. Reading only the single-token lookup made the guard
  // withhold a legitimate configured fix that the previous release offered —
  // a regression rather than a corruption, found by independent review.
  test.each([
    ['## Working with myComponent api', '## Working with MYCOMPONENT API'],
    ['- **Working with myComponent api**', '- **Working with MYCOMPONENT API**'],
    ['## Working with myComponent api.', '## Working with MYCOMPONENT API.']
  ])('GIVEN %s under a configured multi-word phrase WHEN autofixed THEN the phrase casing is applied',
    async (input, expected) => {
      expect(await autofix(input, { acronyms: ['MYCOMPONENT API'] })).toBe(expected);
    });

  // The allowed-replacement list is what keeps the guard active on a configured
  // token: it may become its configured casing and nothing else. Dropping such a
  // token from the protected list instead would have permitted any rewrite.
  test('GIVEN a configured token WHEN a fix rewrites it to something other than the configured casing THEN the fix is withheld', () => {
    const line = '- **Configure myComponent now** and more';
    const config = { mycomponent: 'MYCOMPONENT' };
    expect(buildBoldTextFix(line, 'Configure myComponent now', 'Configure MYCOMPONENT now', {}, 0, config))
      .not.toBeUndefined();
    expect(buildBoldTextFix(line, 'Configure myComponent now', 'Configure mycomponent now', {}, 0, config))
      .toBeUndefined();
  });

  // The other half of the same decision: a token the configuration really does
  // name must stay fixable, or the guard would withhold the fix that carries
  // the configuration out. Both spellings the fixer's lookup can reach.
  test.each([
    ['## Configure myComponent support', { acronyms: ['MYCOMPONENT'] }, '## Configure MYCOMPONENT support'],
    ['## Configure open_api Support', { acronyms: ['OPEN_API'] }, '## Configure OPEN_API support']
  ])('GIVEN %s WHEN autofixed THEN the configured casing is still applied',
    async (input, config, expected) => {
      expect(await autofix(input, config)).toBe(expected);
    });
});

describe('the limits this change does not reach', () => {
  // Enumerated rather than described in a comment, so a later change that widens
  // the exemption or reworks emphasis preservation fails here and has to say so.
  test.each([
    ['a dotted member expression', '## Configure React.useEffect Support', '## Configure react.useeffect support'],
    ['a call expression', '## Configure obj.useEffect() Support', '## Configure obj.useeffect() support'],
    ['a generic type parameter', '## Configure MyComponent<T> Support', '## Configure mycomponent<t> support']
  ])('GIVEN %s WHEN autofixed THEN it is still lowercased, because the exemption reads a bare token only',
    async (_label, input, expected) => {
      expect(await autofix(input)).toBe(expected);
    });

  // The false-positive half of #343, with the mechanism the issue misattributes.
  // #343 blames its emphasis-preservation pass. When this file was written the
  // real barrier was the pattern set, whose snake_case branch is
  // /^_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/ — an underscore is allowed only in an
  // all-lowercase token, so any capital beside an underscore matched none of the
  // three patterns. Dropping the emphasis pass left these rows green, which is
  // how the misattribution was caught.
  //
  // #340 has since added a fourth check for uppercase-leading underscore
  // identifiers, so these tokens are now recognized and protected. They are
  // still reported, because the first-word capitalization check runs
  // independently of the identifier exemption, but what withholds their fix has
  // changed: it is now the guard's protection half, not its internal-marker
  // half. Measured by disabling the marker check — all three rows stay withheld.
  test.each([
    ['## HTTP_Client_V2', "Heading's first word should be capitalized."],
    ['## EasyAntiCheat_EOS_Build', "Heading's first word should be capitalized."],
    ['## Configure HTTP_CLIENT Now', 'Word "Now" in heading should be lowercase.']
  ])('GIVEN %s WHEN linted THEN it is still reported, with the fix withheld by the guard',
    async (input, detail) => {
      const found = await violations(input);
      expect(found).toHaveLength(1);
      expect(found[0].errorDetail).toBe(detail);
      expect(await autofix(input)).toBe(input);
    });

  // The one shape the exemption still misses: an all-caps compound with no
  // recognized-acronym segment. #340 exempts HTTP_CLIENT because HTTP is a
  // configured acronym; MAX_RETRIES has no such segment, so nothing protects it,
  // nothing withholds the fix, and the identifier is still flattened.
  test.each([
    ['## MAX_RETRIES Setup', '## Max_retries setup']
  ])('GIVEN %s WHEN autofixed THEN the uppercase-underscore identifier is still flattened',
    async (input, expected) => {
      expect(await autofix(input)).toBe(expected);
    });

  // A limit this file used to record that #340 has since lifted: HTTP_CLIENT was
  // reported and flattened to Http_client. It is now clean outright. Pinned here
  // so the guard cannot quietly reintroduce either a report or a rewrite on it.
  test('GIVEN ## HTTP_CLIENT WHEN linted THEN it is clean and left untouched', async () => {
    expect(await violations('## HTTP_CLIENT')).toHaveLength(0);
    expect(await autofix('## HTTP_CLIENT')).toBe('## HTTP_CLIENT');
  });

  test('GIVEN a heading whose identifier the emphasis pass mangles WHEN linted THEN the message still quotes the mangled token', async () => {
    const found = await violations('## \u{1F680} user_name_id setup');
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe('First word "user__PRESERVED_0__id" should be "User__preserved_0__id".');
    expect(await autofix('## \u{1F680} user_name_id setup')).toBe('## \u{1F680} user_name_id setup');
  });
});
