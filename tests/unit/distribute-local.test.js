/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
