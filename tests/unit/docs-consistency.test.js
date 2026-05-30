/**
 * Guards documentation against contradicting the authoritative source values
 * for the autofix confidence threshold and the minimum supported Node.js
 * version. Regression coverage for issue #223.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { THREE_TIER_THRESHOLDS } from '../../src/rules/autofix-safety.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (relPath) => readFileSync(join(repoRoot, relPath), 'utf8');

describe('documentation consistency', () => {
  describe('autofix confidence threshold', () => {
    const authoritative = THREE_TIER_THRESHOLDS.autoFix;

    it('should match the source default in ADR-001', () => {
      expect(authoritative).toBe(0.7);
      const adr = read('docs/adr/adr-001-autofix-safety-strategy.md');
      const thresholdLine = adr
        .split('\n')
        .find((line) => /confidence threshold is/i.test(line));
      expect(thresholdLine).toBeDefined();
      expect(thresholdLine).toContain(String(authoritative));
      expect(thresholdLine).not.toContain('0.5');
    });
  });

  describe('minimum Node.js version', () => {
    const docs = [
      'AGENTS.md',
      'docs/testing.md',
      'docs/adr/adr-002-native-esm-distribution.md',
      'docs/adr/adr-004-refactoring-2025.md',
    ];

    it('should declare a >=24 minimum in package.json engines', () => {
      const pkg = JSON.parse(read('package.json'));
      expect(pkg.engines.node).toMatch(/>=\s*24/);
    });

    it.each(docs)('should not reference an EOL >=18 minimum in %s', (relPath) => {
      const content = read(relPath);
      expect(content).not.toMatch(/>=\s*18/);
      expect(content).not.toMatch(/"node":\s*">=18"/);
    });
  });
});
