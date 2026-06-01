/**
 * Guards against residual references to the pre-v4.0.0 package name in tracked
 * filenames or file contents. The package was renamed to
 * `markdownlint-styleguide`; only the changelog files may record the old name
 * in their history and migration notes. Regression coverage for issue #278.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Assembled from parts so this guard file does not contain the literal it
// forbids — otherwise the content check below would flag itself.
const OLD_NAME = ['markdownlint', 'trap'].join('-');

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const trackedFiles = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// The changelog files legitimately record the old name in historical entries
// and the v4.0.0 migration notes; the lockfile is generated.
const CONTENT_EXEMPT = new Set(['CHANGELOG.md', 'DEVLOG.md', 'package-lock.json']);

describe('no residual old package-name references', () => {
  it('should not retain the old name in any tracked filename', () => {
    const offenders = trackedFiles.filter((file) => file.includes(OLD_NAME));
    expect(offenders).toEqual([]);
  });

  it('should not retain the old name in tracked file contents', () => {
    const offenders = [];
    for (const file of trackedFiles) {
      if (CONTENT_EXEMPT.has(file)) continue;
      let content;
      try {
        content = readFileSync(join(repoRoot, file), 'utf8');
      } catch {
        continue; // unreadable entry — skip
      }
      if (content.includes(OLD_NAME)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
