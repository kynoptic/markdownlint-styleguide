import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import noBareUrls from '../../.vscode/custom-rules/wt-no-bare-urls.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(__dirname, '../fixtures/wt-no-bare-urls.fixture.md');

describe('wt/no-bare-urls rule', () => {
  const { failingLines } = parseFixture(fixturePath);
  let violations = [];

  beforeAll(async () => {
    const options = {
      files: [fixturePath],
      customRules: [noBareUrls],
      config: {
        default: false,
        'wt/no-bare-urls': true
      },
      markdownItFactory: () => import('markdown-it')
    };
    violations = await lint(options);
  });

  test('detects bare URLs', () => {
    const errorLines = violations[fixturePath].map((v) => v.lineNumber);
    expect(errorLines).toEqual(failingLines);
  });
});