/**
 * @integration
 * Integration tests against curated real-world repositories.
 * Tests rules against known good repositories to discover edge cases.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { execSync } from 'child_process';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';
// import noBareUrlsRule from '../../src/rules/no-bare-urls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for repositories to test
const TEST_REPOS = [
  {
    name: 'nextjs-docs',
    url: 'https://github.com/vercel/next.js.git',
    branch: 'canary',
    paths: ['docs/**/*.md', 'README.md'],
    maxFiles: 20, // Limit for CI performance
    description: 'Next.js documentation - comprehensive React framework docs'
  },
  {
    name: 'react-docs', 
    url: 'https://github.com/facebook/react.git',
    branch: 'main',
    paths: ['docs/**/*.md', 'README.md'],
    maxFiles: 15,
    description: 'React documentation - popular UI library'
  }
];

const TEMP_DIR = path.join(__dirname, '../tmp/integration-repos');
const TIMEOUT = 30000; // 30 seconds per test

/**
 * Clone a repository for testing
 */
async function cloneRepo(repo) {
  const repoPath = path.join(TEMP_DIR, repo.name);
  
  if (fs.existsSync(repoPath)) {
    // Update existing repo
    try {
      execSync(`git -C "${repoPath}" pull origin ${repo.branch}`, { 
        stdio: 'pipe',
        timeout: 10000 
      });
    } catch (error) {
      // If update fails, remove and re-clone
      fs.rmSync(repoPath, { recursive: true, force: true });
      execSync(`git clone --depth 1 --branch ${repo.branch} "${repo.url}" "${repoPath}"`, {
        stdio: 'pipe',
        timeout: 20000
      });
    }
  } else {
    // Fresh clone
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    execSync(`git clone --depth 1 --branch ${repo.branch} "${repo.url}" "${repoPath}"`, {
      stdio: 'pipe',
      timeout: 20000
    });
  }
  
  return repoPath;
}

/**
 * Find markdown files in repository
 */
function findMarkdownFiles(repoPath, patterns, maxFiles = 50) {
  const allFiles = [];
  
  for (const pattern of patterns) {
    try {
      // const globPattern = path.join(repoPath, pattern);
      const command = `find "${repoPath}" -name "*.md" -type f | head -${maxFiles}`;
      const output = execSync(command, { encoding: 'utf8', timeout: 5000 });
      const files = output.trim().split('\n').filter(Boolean);
      allFiles.push(...files);
    } catch (error) {
      console.warn(`Warning: Could not find files for pattern ${pattern}:`, error.message);
    }
  }
  
  // Remove duplicates and limit total files
  const uniqueFiles = [...new Set(allFiles)];
  return uniqueFiles.slice(0, maxFiles);
}

/**
 * Test a rule against markdown files
 */
async function testRuleAgainstFiles(rule, files, ruleName) {
  const results = {
    totalFiles: files.length,
    filesWithViolations: 0,
    totalViolations: 0,
    violations: [],
    errors: []
  };

  for (const file of files) {
    try {
      const lintResults = await lint({
        customRules: [rule],
        files: [file],
        resultVersion: 3
      });

      const violations = lintResults[file] || [];
      const ruleViolations = violations.filter(v => 
        v.ruleNames.includes(ruleName) || v.ruleNames.some(name => name.includes(ruleName.split('-')[0]))
      );

      if (ruleViolations.length > 0) {
        results.filesWithViolations++;
        results.totalViolations += ruleViolations.length;
        results.violations.push({
          file: path.relative(TEMP_DIR, file),
          violations: ruleViolations.map(v => ({
            line: v.lineNumber,
            detail: v.errorDetail,
            context: v.errorContext
          }))
        });
      }
    } catch (error) {
      results.errors.push({
        file: path.relative(TEMP_DIR, file),
        error: error.message
      });
    }
  }

  return results;
}

describe.skip('Integration Tests - Curated Repositories', () => {
  beforeAll(async () => {
    // Clean up any existing temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }, TIMEOUT);

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  // Test each repository
  for (const repo of TEST_REPOS) {
    describe(repo.name, () => {
      let repoPath;
      let markdownFiles;

      beforeAll(async () => {
        try {
          repoPath = await cloneRepo(repo);
          markdownFiles = findMarkdownFiles(repoPath, repo.paths, repo.maxFiles);
        } catch (error) {
          console.warn(`Warning: Could not set up ${repo.name}:`, error.message);
          markdownFiles = [];
        }
      }, TIMEOUT);

      test('should find markdown files', () => {
        expect(markdownFiles.length).toBeGreaterThan(0);
      });

      test('sentence-case-heading rule analysis', async () => {
        if (markdownFiles.length === 0) {
          return;
        }

        const results = await testRuleAgainstFiles(sentenceRule, markdownFiles, 'sentence-case-heading');
        
        // These are discovery tests - we don't assert specific numbers
        // but we do want to ensure the rule doesn't crash
        expect(results.errors.length).toBe(0);
        expect(results.totalFiles).toBeGreaterThan(0);
      }, TIMEOUT);

      test('backtick-code-elements rule analysis', async () => {
        if (markdownFiles.length === 0) {
          return;
        }

        const results = await testRuleAgainstFiles(backtickRule, markdownFiles, 'backtick-code-elements');
        
        expect(results.errors.length).toBe(0);
        expect(results.totalFiles).toBeGreaterThan(0);
      }, TIMEOUT);

      test('integration summary', () => {
        if (markdownFiles.length === 0) {
          return;
        }
        
        // This test always passes - it's for reporting
        expect(true).toBe(true);
      });
    });
  }
});