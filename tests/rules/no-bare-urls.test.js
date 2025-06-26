// Test suite for the no-bare-urls rule.

import markdownlint from 'markdownlint';
import { promisify } from 'util';
import { getFixture, getPassAndFail } from '../utils/fixture.js';
// The rule file does not exist yet; this is the first step in TDD.
import noBareUrls from '../../.vscode/custom-rules/no-bare-urls.js';

const lint = promisify(markdownlint);

describe('no-bare-urls rule', () => {
  // Load the fixture file and parse out the expected pass/fail lines.
  const fixture = getFixture('no-bare-urls.fixture.md');
  const { pass, fail } = getPassAndFail(fixture);

  test('validates all cases in the fixture', async () => {
    const config = {
      customRules: [noBareUrls],
      config: {
        'no-bare-urls': true
      },
      strings: {
        fixture
      }
    };

    const result = await lint(config);
    const errorLines = result.fixture.map((err) => err.lineNumber);

    expect(errorLines.sort()).toEqual(fail.sort());
  });
});