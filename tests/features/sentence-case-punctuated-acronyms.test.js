// @ts-check

/**
 * @feature
 * SC001 autofix must preserve configured acronyms and proper nouns that are
 * wrapped in surrounding punctuation, e.g. `(PARA)` (#290). The per-word
 * dictionary lookup previously used the whole token, so `(PARA)` keyed on
 * `(para)` (absent) and fell through to lowercasing. Bare `PARA` worked.
 */
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import sentenceRule from '../../src/rules/sentence-case-heading.js';

/**
 * Lint with SC001 + config, then apply its fixes.
 * @param {string} content
 * @param {object} config
 * @returns {Promise<string>}
 */
async function fixSC001(content, config) {
  const results = await lint({
    customRules: [sentenceRule],
    config: { default: false, 'sentence-case-heading': config },
    strings: { 'test.md': content },
    resultVersion: 3,
  });
  return applyFixes(content, results['test.md'] || []);
}

describe('SC001 preserves acronyms/proper nouns in punctuation (#290)', () => {
  test('acronym in parentheses keeps casing while sibling word lowercases', async () => {
    const fixed = await fixSC001('## Phase 2: The Structure (PARA)\n', {
      acronyms: ['PARA'],
    });
    expect(fixed).toBe('## Phase 2: the structure (PARA)\n');
  });

  test('acronym embedded in a parenthetical phrase keeps casing', async () => {
    const fixed = await fixSC001('## iCloud Storage (PARA structure)\n', {
      acronyms: ['PARA'],
    });
    // iCloud is a default brand; Storage lowercases; PARA stays uppercase
    expect(fixed).toBe('## iCloud storage (PARA structure)\n');
  });

  test('proper noun with trailing paren keeps casing', async () => {
    const fixed = await fixSC001(
      '- **Fully protected (offsite via Storj)**\n',
      { properNouns: ['Storj'] },
    );
    expect(fixed).toContain('Storj)');
    expect(fixed).not.toContain('storj');
  });

  test('bare acronym (no punctuation) still preserved — control', async () => {
    const fixed = await fixSC001('## The Structure PARA\n', {
      acronyms: ['PARA'],
    });
    expect(fixed).toBe('## The structure PARA\n');
  });
});
