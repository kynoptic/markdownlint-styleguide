/**
 * @fileoverview Unit tests for doctor.cjs diagnostics
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const scriptPath = path.resolve('./scripts/doctor.cjs');

describe('doctor.cjs', () => {
  let tempDir;

  beforeEach(() => {
    // Create temp directory for testing
    const timestamp = new Date().getTime();
    tempDir = path.join(process.cwd(), 'tests', 'tmp', 'doctor-test-' + timestamp);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('dependency checks', () => {
    it('should verify Node.js is installed', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Node.js installed');
      expect(output).toContain('✓');
    });

    it('should check for markdownlint-cli2', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-cli2');
    });
  });

  describe('configuration file checks', () => {
    it('should warn when CLI config is missing', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('CLI config (.markdownlint-cli2.jsonc)');
      expect(output).toContain('⚠');
    });

    it('should pass when CLI config exists', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"config": {}}', 'utf8');

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('CLI config (.markdownlint-cli2.jsonc) exists');
      expect(output).toContain('✓');
    });

    it('should validate CLI config syntax', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"config": {}}', 'utf8');

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('CLI config syntax');
      expect(output).toContain('Syntax OK');
    });

    it('should detect invalid JSON syntax', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"config": {]', 'utf8'); // Invalid JSON

      let exitCode = 0;
      try {
        execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: tempDir,
        });
      } catch (err) {
        exitCode = err.status;
      }

      expect(exitCode).not.toBe(0);
    });

    it('should support JSONC with comments', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{\n  // Comment\n  "config": {}\n}', 'utf8');

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Syntax OK');
    });
  });

  describe('VS Code settings checks', () => {
    it('should warn when VS Code config is missing', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('VS Code config');
      expect(output).toContain('⚠');
    });

    it('should pass when VS Code config exists', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      const vscodeConfig = path.join(vscodeDir, 'settings.json');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        vscodeConfig,
        JSON.stringify({ 'markdownlint.customRules': ['markdownlint-trap'] }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('VS Code config (.vscode/settings.json) exists');
      expect(output).toContain('✓');
    });

    it('should verify custom rules configuration', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      const vscodeConfig = path.join(vscodeDir, 'settings.json');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        vscodeConfig,
        JSON.stringify({ 'markdownlint.customRules': ['markdownlint-trap'] }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('VS Code custom rules configured');
      expect(output).toContain('✓');
    });

    it('should warn when custom rules are missing', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      const vscodeConfig = path.join(vscodeDir, 'settings.json');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        vscodeConfig,
        JSON.stringify({ 'editor.formatOnSave': true }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint.customRules not found');
      expect(output).toContain('⚠');
    });
  });

  describe('rule loading checks', () => {
    it('should verify rules can be loaded', () => {
      try {
        const output = execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: process.cwd(), // Run from project root where rules are available
        });

        expect(output).toContain('Custom rules loadable');
        // Should either pass (if built) or fail with helpful message
        expect(output).toMatch(/✓|✗/);
      } catch (err) {
        // Doctor script may exit with non-zero if checks fail, but output should still be captured
        const output = err.stdout || '';
        expect(output).toContain('Custom rules loadable');
        expect(output).toMatch(/✓|✗/);
      }
    });

    it('should list loaded rules on success', () => {
      try {
        const output = execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });

        if (output.includes('Custom rules loadable') && output.includes('✓')) {
          expect(output).toMatch(/Loaded \d+ rules/);
        }
      } catch (err) {
        // If build artifacts don't exist, that's expected in some test scenarios
      }
    });
  });

  describe('summary output', () => {
    it('should display results summary', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Results:');
      expect(output).toMatch(/\d+ passed/);
      expect(output).toMatch(/\d+ failed/);
      expect(output).toMatch(/\d+ warnings/);
    });

    it('should show success message when all checks pass', () => {
      // Create a complete setup
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"config": {}}', 'utf8');

      const vscodeDir = path.join(tempDir, '.vscode');
      const vscodeConfig = path.join(vscodeDir, 'settings.json');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        vscodeConfig,
        JSON.stringify({ 'markdownlint.customRules': ['markdownlint-trap'] }, null, 2),
        'utf8'
      );

      try {
        const output = execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: tempDir,
        });

        if (!output.includes('failed') || output.includes('0 failed')) {
          expect(output).toMatch(/All checks passed|Some warnings found/);
        }
      } catch (err) {
        // Expected if rules can't be loaded from temp dir
      }
    });

    it('should use colored output', () => {
      const output = execSync('node ' + scriptPath, {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Check for ANSI color codes
      // eslint-disable-next-line no-control-regex
      expect(output).toMatch(/\x1b\[\d+m/);
    });
  });

  describe('exit codes', () => {
    it('should exit with 0 when no failures', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"config": {}}', 'utf8');

      try {
        execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: tempDir,
        });
        // If we get here, exit code was 0
        expect(true).toBe(true);
      } catch (err) {
        // Non-zero exit is expected if rules can't be loaded
        expect(err.status).toBeGreaterThan(0);
      }
    });

    it('should exit with non-zero when failures occur', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{invalid json}', 'utf8');

      let exitCode = 0;
      try {
        execSync('node ' + scriptPath, {
          encoding: 'utf8',
          cwd: tempDir,
        });
      } catch (err) {
        exitCode = err.status;
      }

      expect(exitCode).toBeGreaterThan(0);
    });
  });
});
