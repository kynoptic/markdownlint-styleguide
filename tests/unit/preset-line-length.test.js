/**
 * @unit
 * Guards that line-length enforcement (MD013) stays disabled in every shipped
 * preset. Hard-wrapping prose at a fixed column produces noisy diffs and merge
 * conflicts under version control, and on first adoption MD013 drowned out the
 * styleguide's high-signal custom rules (see issue #299). The presets disable
 * it universally; this test prevents a regression that re-enables it.
 */
import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as jsonc from 'jsonc-parser';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PRESETS = ['basic-config.jsonc', 'recommended-config.jsonc', 'strict-config.jsonc'];

describe('Preset line-length (MD013) policy', () => {
  test.each(PRESETS)('%s disables MD013', (preset) => {
    const text = readFileSync(join(repoRoot, preset), 'utf8');
    const parsed = jsonc.parse(text, undefined, { allowTrailingComma: true });
    expect(parsed.config.MD013).toBe(false);
  });
});
