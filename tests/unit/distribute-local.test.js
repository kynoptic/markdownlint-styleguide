/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';
import * as jsonc from 'jsonc-parser';
import { mergeJsonSettings, usesPnpm } from '../../scripts/distribute-local.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('distribute-local script', () => {
  const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'distribute-local.cjs');
  const testDir = path.join(__dirname, '..', '..', '.test-dist');
  const configPath = path.join(testDir, 'test-distribution.yml');
  const srcFile = path.join(testDir, 'source.txt');
  const destDir = path.join(testDir, 'destinations');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(destDir, { recursive: true });

    // Create source file
    fs.writeFileSync(srcFile, 'test content', 'utf8');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle missing config gracefully', () => {
    expect(() => {
      execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8' });
    }).toThrow();
  });

  it('should handle no enabled targets', () => {
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: false\n    type: local\n    src: ' + srcFile + '\n    dest: ' + path.join(destDir, 'dest.txt');
    fs.writeFileSync(configPath, config, 'utf8');

    const output = execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8' });
    expect(output).toContain('No enabled targets');
  });

  it('should copy file in dry-run mode without modification', () => {
    const destFile = path.join(destDir, 'dest.txt');
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: true\n    type: local\n    src: ' + srcFile + '\n    dest: ' + destFile;
    fs.writeFileSync(configPath, config, 'utf8');

    const output = execSync('node "' + scriptPath + '" --config "' + configPath + '" --dry-run', { encoding: 'utf8' });
    
    expect(output).toContain('DRY RUN MODE');
    expect(output).toContain('Would copy file');
    expect(fs.existsSync(destFile)).toBe(false);
  });

  it('should copy file when enabled', () => {
    const destFile = path.join(destDir, 'dest.txt');
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: true\n    type: local\n    src: ' + srcFile + '\n    dest: ' + destFile;
    fs.writeFileSync(configPath, config, 'utf8');

    execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8' });
    
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('test content');
  });

  it('should handle missing source file', () => {
    const missingSource = path.join(testDir, 'missing.txt');
    const destFile = path.join(destDir, 'dest.txt');
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: true\n    type: local\n    src: ' + missingSource + '\n    dest: ' + destFile;
    fs.writeFileSync(configPath, config, 'utf8');

    expect(() => {
      execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });

  it('should expand wildcards correctly', () => {
    // Create multiple destination directories
    fs.mkdirSync(path.join(destDir, 'project1'), { recursive: true });
    fs.mkdirSync(path.join(destDir, 'project2'), { recursive: true });
    
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: true\n    type: local\n    src: ' + srcFile + '\n    dest: ' + path.join(destDir, '*', 'dest.txt');
    fs.writeFileSync(configPath, config, 'utf8');

    const output = execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8' });
    
    expect(output).toContain('Expanded');
    expect(fs.existsSync(path.join(destDir, 'project1', 'dest.txt'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'project2', 'dest.txt'))).toBe(true);
  });

  it('should skip distribution when parent directory does not exist', () => {
    const nonExistentParent = path.join(testDir, 'nonexistent', 'dest.txt');
    const config = 'version: 1\ntargets:\n  - name: test\n    enabled: true\n    type: local\n    src: ' + srcFile + '\n    dest: ' + nonExistentParent;
    fs.writeFileSync(configPath, config, 'utf8');

    const output = execSync('node "' + scriptPath + '" --config "' + configPath + '"', { encoding: 'utf8' });
    
    expect(output).toContain('Parent directory does not exist');
  });
});

describe('mergeJsonSettings', () => {
  let tmpDir;
  const template = [
    '{',
    '  // Load the custom rules package',
    '  "markdownlint.customRules": ["markdownlint-styleguide"],',
    '',
    '  "markdownlint.config": {',
    '    "sentence-case-heading": true',
    '  }',
    '}',
    '',
  ].join('\n');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdsg-merge-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function parseErrors(text) {
    const errors = [];
    jsonc.parse(text, errors, { allowTrailingComma: true });
    return errors;
  }

  it('should return template unchanged when no existing file is present', () => {
    const result = mergeJsonSettings(path.join(tmpDir, 'absent.json'), template);
    expect(result).toBe(template);
  });

  it('should produce valid JSON when existing file has a key after the merged block', () => {
    const existing = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(
      existing,
      '{\n  "markdownlint.config": { "MD013": false },\n  "explorer.excludeGitIgnore": false\n}\n',
      'utf8'
    );

    const result = mergeJsonSettings(existing, template);

    expect(parseErrors(result)).toEqual([]);
    const parsed = jsonc.parse(result);
    expect(parsed['explorer.excludeGitIgnore']).toBe(false);
    // Preserved key lands after the template block, not before it
    expect(result.indexOf('explorer.excludeGitIgnore')).toBeGreaterThan(
      result.indexOf('markdownlint.config')
    );
  });

  it('should fall back to the template when the existing file is unparseable', () => {
    const existing = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(existing, '', 'utf8');

    const result = mergeJsonSettings(existing, template);

    expect(result).toBe(template);
  });

  it('should keep template values for keys present in both files', () => {
    const existing = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(
      existing,
      '{\n  "markdownlint.config": { "MD013": false }\n}\n',
      'utf8'
    );

    const result = mergeJsonSettings(existing, template);
    const parsed = jsonc.parse(result);

    expect(parsed['markdownlint.config']).toEqual({ 'sentence-case-heading': true });
  });

  it('should preserve template comments after merging', () => {
    const existing = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(existing, '{\n  "editor.formatOnSave": true\n}\n', 'utf8');

    const result = mergeJsonSettings(existing, template);

    expect(result).toContain('// Load the custom rules package');
    expect(parseErrors(result)).toEqual([]);
  });
});

describe('usesPnpm', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdsg-pnpm-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return true when a pnpm lockfile is present', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n', 'utf8');
    expect(usesPnpm(tmpDir)).toBe(true);
  });

  it('should return true when a pnpm workspace file is present', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n', 'utf8');
    expect(usesPnpm(tmpDir)).toBe(true);
  });

  it('should return false for a plain npm project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}', 'utf8');
    expect(usesPnpm(tmpDir)).toBe(false);
  });

  it('should prefer pnpm when both npm and pnpm lockfiles are present', () => {
    fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n', 'utf8');
    expect(usesPnpm(tmpDir)).toBe(true);
  });
});
