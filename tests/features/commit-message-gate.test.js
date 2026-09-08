/**
 * @fileoverview Behavioural tests for the commit-msg gate script.
 *
 * `build-tools/quality-checks/check-commit-body.sh` decides whether every
 * commit in this repository is allowed to exist, and nothing else in the suite
 * touches it. These tests pin the two decisions that are easiest to get wrong
 * in a way no reader would notice: which subjects the type-prefix check accepts,
 * and which body lines the grammar check accepts.
 *
 * The subjects and body lines below are not invented. Each git-generated one was
 * captured from a real git operation in a throwaway repository with a logging
 * `commit-msg` hook installed, so the strings are what git actually writes
 * rather than what the script's comments claim it writes.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../../build-tools/quality-checks/check-commit-body.sh', import.meta.url));

let workDir;

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'commit-gate-'));
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

/**
 * Run the gate over a commit message and report whether it accepted it.
 * @param {string} message - The full commit message, as git would leave it on disk.
 * @returns {{accepted: boolean, output: string}} The gate's verdict and its output.
 */
function gate(message) {
  const file = join(workDir, `msg-${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(file, message.endsWith('\n') ? message : `${message}\n`);
  try {
    const output = execFileSync('bash', [SCRIPT, file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { accepted: true, output };
  } catch (error) {
    return { accepted: false, output: `${error.stdout || ''}${error.stderr || ''}` };
  }
}

describe('the gate can reach both verdicts', () => {
  // Without this pair, every assertion below could be passing because the
  // script exits 0 unconditionally, or failing because it exits 1 unconditionally.
  test('GIVEN a conventional subject WHEN gated THEN it is accepted', () => {
    expect(gate('fix: resolve the crash').accepted).toBe(true);
  });

  test('GIVEN an unrecognized type WHEN gated THEN it is rejected with the allowed types named', () => {
    const result = gate('banana: do a thing');
    expect(result.accepted).toBe(false);
    expect(result.output).toContain('Allowed types');
  });
});

describe('the subject type-prefix check', () => {
  test.each([
    'feat: add a flag',
    'fix: resolve the crash',
    'docs: revise the readme',
    'style: reflow the block',
    'refactor: extract the helper',
    'test: cover the empty case',
    'chore: bump the pin',
    'perf: cache the lookup',
    'ci: add the lint job',
    'build: switch the bundler',
    'revert: undo the pin bump',
    'feat(init): add a flag',
    'feat!: drop v1',
    'feat(api)!: drop v1'
  ])('GIVEN %s WHEN gated THEN it is accepted', (subject) => {
    expect(gate(subject).accepted).toBe(true);
  });

  test.each([
    ['no type at all', 'resolve the crash'],
    ['a type this convention does not define', 'cleanup: remove the dead file'],
    ['another undefined type', 'config: expand the rules'],
    ['a version-only subject', '0.2.0'],
    ['a superstring of a real type', 'feature: add a flag'],
    ['no space after the colon', 'fix:resolve the crash'],
    ['two spaces after the colon', 'fix:  resolve the crash'],
    ['a tab after the colon', 'fix:\tresolve the crash'],
    ['nothing after the colon', 'fix: '],
    ['an unclosed scope', 'feat(init: add a flag'],
    ['an uppercase type', 'FIX: resolve the crash']
  ])('GIVEN %s WHEN gated THEN it is rejected', (_label, subject) => {
    expect(gate(subject).accepted).toBe(false);
  });

  // Every one of these is a subject git writes itself. A rejection here blocks a
  // routine operation for every contributor, so each is captured from a real run.
  test.each([
    ['git merge --no-ff, conflicted or not', "Merge branch 'side'"],
    ['git merge --squash then commit', 'Squashed commit of the following:'],
    ['git revert --continue', 'Revert "feat: add the g helper"'],
    ['git revert --continue on a revert', 'Reapply "feat: add the g helper"'],
    ['git commit --fixup', 'fixup! feat: add the g helper'],
    ['git commit --squash', 'squash! feat: add the g helper'],
    ['git commit --fixup=amend:', 'amend! feat: add the g helper'],
    ["this repository's first commit", 'initial commit']
  ])('GIVEN the subject git writes for %s WHEN gated THEN it is accepted', (_label, subject) => {
    expect(gate(subject).accepted).toBe(true);
  });
});

describe('the body grammar check', () => {
  const withBody = (line) => `feat: add a thing\n\n${line}`;

  test.each([
    ['a bullet', '- Add the helper behind a flag'],
    ['a git trailer', 'Signed-off-by: A Name <a@example.com>'],
    ['a colon-qualified reference with free text', 'Refs: #1234 see the design doc'],
    ['a bare reference', 'Closes #12'],
    ['several bare references', 'Closes #12, #13'],
    ['a breaking-change footer', 'BREAKING CHANGE: the v1 flag is gone']
  ])('GIVEN %s WHEN gated THEN it is accepted', (_label, line) => {
    expect(gate(withBody(line)).accepted).toBe(true);
  });

  test.each([
    ['prose', 'This body line is ordinary prose'],
    ['a reference with trailing prose and no colon', 'Reverted #42 because the migration was wrong'],
    ['a trailer with no space after the colon', 'Closes:#12'],
    ['a breaking-change footer with no value', 'BREAKING CHANGE:']
  ])('GIVEN %s WHEN gated THEN it is rejected', (_label, line) => {
    expect(gate(withBody(line)).accepted).toBe(false);
  });

  // The provenance line `git cherry-pick -x` writes. A clean cherry-pick never
  // reaches a commit-msg hook, but `--continue` after a conflict does, and the
  // line has no colon to mark it as a trailer — so before it was exempted, the
  // grammar check rejected it as prose and blocked every conflicted `-x`
  // cherry-pick, including one whose subject was perfectly conventional.
  test.each([
    'Reapply "feat: add the g helper"',
    'feat: add the g helper'
  ])('GIVEN a cherry-pick provenance line under the subject %s WHEN gated THEN it is accepted', (subject) => {
    const message = `${subject}\n\n(cherry picked from commit 8bb35aebf791307e365c0ac35a224dde8ca6c1c9)`;
    expect(gate(message).accepted).toBe(true);
  });

  test('GIVEN a short object name in the provenance line WHEN gated THEN it is accepted', () => {
    expect(gate(withBody('(cherry picked from commit 8bb35ae)')).accepted).toBe(true);
  });

  // The exemption is anchored at both ends on git's exact wording and a hex
  // object name, so it cannot become a way to smuggle prose past the check.
  test.each([
    ['trailing prose', '(cherry picked from commit 8bb35aebf791307e365c0ac35a224dde8ca6c1c9) and reworked'],
    ['a non-hex object name', '(cherry picked from commit zzzzzzz)'],
    ['an object name shorter than seven characters', '(cherry picked from commit 8bb35)'],
    ['an unclosed parenthesis', '(cherry picked from commit 8bb35aebf791307e365c0ac35a224dde8ca6c1c9'],
    ['a different noun', '(cherry picked from branch 8bb35ae)'],
    ['different capitalization and no parentheses', 'Cherry picked from commit 8bb35aebf791307e365c0ac35a224dde8ca6c1c9']
  ])('GIVEN a provenance line with %s WHEN gated THEN it is rejected', (_label, line) => {
    expect(gate(withBody(line)).accepted).toBe(false);
  });
});

describe('the subject length check runs alongside the format check', () => {
  test('GIVEN a subject that is both malformed and too long WHEN gated THEN both problems are reported', () => {
    const result = gate('banana: a subject long enough to break the fifty character cap');
    expect(result.accepted).toBe(false);
    expect(result.output).toContain('Allowed types');
    expect(result.output).toContain('Subject line too long');
  });

  test('GIVEN a conventional subject over the cap WHEN gated THEN only the length is reported', () => {
    const result = gate('feat: a subject long enough to break the fifty character cap');
    expect(result.accepted).toBe(false);
    expect(result.output).toContain('Subject line too long');
    expect(result.output).not.toContain('Allowed types');
  });
});

describe('the gate normalizes before it checks', () => {
  test('GIVEN a subject preceded by a UTF-8 byte order mark WHEN gated THEN it is accepted', () => {
    expect(gate('﻿fix: resolve the crash').accepted).toBe(true);
  });

  test('GIVEN CRLF line endings WHEN gated THEN the carriage return is not counted or matched', () => {
    expect(gate('fix: resolve the crash\r\n\r\n- Add the guard\r\n').accepted).toBe(true);
  });

  test('GIVEN a verbose diff below the scissors line WHEN gated THEN the diff is not read as body prose', () => {
    const message = [
      'fix: resolve the crash',
      '',
      '- Add the guard',
      '',
      '# ------------------------ >8 ------------------------',
      '# Do not modify or remove the line above.',
      'diff --git a/f.txt b/f.txt',
      'index 1234567..89abcde 100644',
      '--- a/f.txt',
      '+++ b/f.txt',
      '@@ -1 +1 @@',
      '-old prose that is not a bullet',
      '+new prose that is not a bullet'
    ].join('\n');
    expect(gate(message).accepted).toBe(true);
  });

  test('GIVEN a malformed subject above a verbose diff WHEN gated THEN only the subject is reported', () => {
    const message = [
      'banana: do a thing',
      '',
      '# ------------------------ >8 ------------------------',
      'diff --git a/f.txt b/f.txt',
      '-old prose that is not a bullet'
    ].join('\n');
    const result = gate(message);
    expect(result.accepted).toBe(false);
    expect(result.output).toContain('Allowed types');
    expect(result.output).not.toContain('not a bullet or a Git trailer');
  });

  test('GIVEN a comment-prefixed template line WHEN gated THEN it is dropped rather than read as prose', () => {
    expect(gate('fix: resolve the crash\n\n- Add the guard\n# Please enter the commit message\n').accepted).toBe(true);
  });

  test('GIVEN a body line that only looks like a comment WHEN gated THEN it is still checked', () => {
    // "#277" and "## Changes" are content, not git's comment prefix, so the
    // filter must not skip them and let prose through unchecked.
    expect(gate('fix: resolve the crash\n\n## Changes to the parser\n').accepted).toBe(false);
  });

  test('GIVEN an empty message WHEN gated THEN it is rejected by name rather than passing silently', () => {
    const result = gate('\n');
    expect(result.accepted).toBe(false);
    expect(result.output.toLowerCase()).toContain('empty');
  });
});
