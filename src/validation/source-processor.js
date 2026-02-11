/**
 * Source processor for external validation.
 * Processes local files, directories, and GitHub repositories.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { lint } from 'markdownlint/promise';
import { glob } from 'glob';
import MarkdownIt from 'markdown-it';

/**
 * Process a single local markdown file.
 * @param {string} filePath - Path to markdown file
 * @param {Object} options - Linting options including custom rules
 * @returns {Promise<Object>} Processing result with violations
 */
export async function processLocalFile(filePath, options) {
  // Check if file exists
  await fs.promises.access(filePath);

  const lintResults = await lint({
    ...options,
    files: [filePath],
    resultVersion: 3,
    markdownItFactory: () => new MarkdownIt({ linkify: true })
  });

  const violations = lintResults[filePath] || [];

  return {
    type: 'local',
    path: filePath,
    violations: violations.map(v => ({
      line: v.lineNumber,
      rule: v.ruleNames[0],
      detail: v.errorDetail || v.ruleDescription,
      context: v.errorContext,
      fixInfo: v.fixInfo,
      autofixSafety: v.autofixSafety
    }))
  };
}

/**
 * Process all markdown files in a local directory.
 * @param {string} dirPath - Path to directory
 * @param {Object} options - Linting options including custom rules and filters
 * @returns {Promise<Array>} Array of processing results
 */
export async function processLocalDirectory(dirPath, options) {
  const { filters = {} } = options;
  const { include = ['**/*.md'], exclude = ['**/node_modules/**'] } = filters;

  // Find all markdown files matching filters
  const files = await glob(include, {
    cwd: dirPath,
    absolute: true,
    ignore: exclude
  });

  // Process each file
  const results = [];
  for (const file of files) {
    try {
      const result = await processLocalFile(file, options);
      results.push(result);
    } catch (error) {
      results.push({
        type: 'local',
        path: file,
        error: error.message,
        violations: []
      });
    }
  }

  return results;
}

/**
 * Process a GitHub repository.
 * @param {string} repoName - Repository name in format "owner/repo"
 * @param {Object} options - Linting options including custom rules and filters
 * @returns {Promise<Array>} Array of processing results
 */
export async function processGitHubRepo(repoName, options) {
  // Validate repo name format and prevent shell injection
  // GitHub repo names can only contain alphanumeric characters, hyphens, underscores, and periods
  const repoNamePattern = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
  if (!repoNamePattern.test(repoName)) {
    throw new Error('Invalid repository name. Expected format: owner/repo (alphanumeric characters, hyphens, underscores, and periods only)');
  }

  const [owner, repo] = repoName.split('/');
  const tempDir = path.join(process.cwd(), '.tmp', 'validation-repos', owner, repo);

  // Clone or update repository
  try {
    if (fs.existsSync(tempDir)) {
      // Update existing clone
      execSync('git pull', { cwd: tempDir, stdio: 'pipe' });
    } else {
      // Fresh clone using gh CLI
      fs.mkdirSync(path.dirname(tempDir), { recursive: true });
      execSync('gh repo clone ' + repoName + ' ' + tempDir, { stdio: 'pipe' });
    }
  } catch (error) {
    throw new Error('Failed to clone repository ' + repoName + ': ' + error.message, { cause: error });
  }

  // Process directory
  const results = await processLocalDirectory(tempDir, options);

  // Mark results as GitHub sources
  return results.map(r => ({
    ...r,
    type: 'github',
    repository: repoName
  }));
}
