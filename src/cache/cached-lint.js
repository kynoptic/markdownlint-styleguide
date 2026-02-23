// @ts-check

/**
 * Cached lint wrapper for markdownlint.
 * Wraps the markdownlint lint() API with file-level caching to skip
 * unchanged files on subsequent runs.
 */

import fs from 'fs';
import { lint } from 'markdownlint/promise';
import { CacheStore, hashContent, hashFile, hashConfig } from './lint-cache.js';
import { extractDependencies } from './dependency-tracker.js';

/**
 * Compute a combined hash of all rule source files.
 * Uses the rule objects' source file locations when available,
 * otherwise falls back to hashing the rule names/descriptions.
 * @param {Array} customRules - Array of markdownlint rule objects
 * @returns {string} Combined hash of rule sources
 */
function computeRuleVersionHash(customRules) {
  if (!customRules || customRules.length === 0) {
    return hashContent('no-rules');
  }

  // Build a fingerprint from rule metadata
  // For custom rules loaded from files, we could hash the source,
  // but rules are typically loaded as objects. Use names + descriptions
  // as a stable identifier, and hash the function source as a proxy
  // for detecting code changes.
  const parts = customRules.map(rule => {
    const names = Array.isArray(rule.names) ? rule.names.join(',') : String(rule.names || '');
    const desc = rule.description || '';
    const fn = typeof rule.function === 'function' ? rule.function.toString() : '';
    return `${names}:${desc}:${fn}`;
  });

  return hashContent(parts.join('|'));
}

/**
 * @typedef {Object} CacheOptions
 * @property {boolean} enabled - Whether caching is enabled
 * @property {string} [location] - Cache directory path (default: .markdownlint-cache/)
 */

/**
 * @typedef {Object} CachedLintOptions
 * @property {string[]} files - Array of file paths to lint
 * @property {Array} [customRules] - Custom markdownlint rules
 * @property {Object} [config] - Markdownlint configuration
 * @property {CacheOptions} cache - Cache configuration
 * @property {number} [resultVersion] - Markdownlint result version (default: 3)
 * @property {Function} [markdownItFactory] - Factory for markdown-it instances (required when rules use markdown-it parser)
 */

/**
 * Lint markdown files with file-level caching.
 * On first run, performs full lint and stores results.
 * On subsequent runs, skips files whose content, rules, and config are unchanged.
 * Falls back to full lint on any cache error.
 *
 * @param {CachedLintOptions} options
 * @returns {Promise<Object>} Lint results keyed by file path
 */
export async function cachedLint(options) {
  const { files, customRules = [], config = {}, cache, resultVersion = 3, markdownItFactory } = options;

  /** Build base lint options (shared between cached and uncached paths) */
  const baseLintOpts = { customRules, config, resultVersion };
  if (markdownItFactory) {
    baseLintOpts.markdownItFactory = markdownItFactory;
  }

  // If caching is disabled, do a straight-through lint
  if (!cache || !cache.enabled) {
    return lint({ ...baseLintOpts, files });
  }

  const cacheLocation = cache.location || '.markdownlint-cache';
  const store = new CacheStore(cacheLocation);

  // Load cache — falls back to empty on error
  try {
    store.load();
  } catch {
    // Corrupt cache — proceed with empty store
  }

  const ruleVersionHash = computeRuleVersionHash(customRules);
  const configHashValue = hashConfig(config);

  // Separate files into cached (hit) and uncached (miss)
  const cachedResults = {};
  const filesToLint = [];
  const changedFiles = [];

  for (const filePath of files) {
    const contentHashValue = hashFile(filePath);
    if (contentHashValue === null) {
      // File cannot be read — let markdownlint handle the error
      filesToLint.push(filePath);
      continue;
    }

    if (store.isValid(filePath, contentHashValue, ruleVersionHash, configHashValue)) {
      // Cache hit — use stored results
      cachedResults[filePath] = store.get(filePath).results;
    } else {
      // Cache miss — needs linting
      filesToLint.push(filePath);
      changedFiles.push(filePath);
    }
  }

  // Invalidate dependents of changed files
  for (const changedFile of changedFiles) {
    const invalidated = store.invalidateDependents(changedFile);
    for (const inv of invalidated) {
      // If the invalidated file was in our cached results, move it to lint queue
      if (cachedResults[inv] !== undefined) {
        delete cachedResults[inv];
        if (!filesToLint.includes(inv)) {
          filesToLint.push(inv);
        }
      }
    }
  }

  // Lint uncached files
  let freshResults = {};
  if (filesToLint.length > 0) {
    try {
      freshResults = await lint({ ...baseLintOpts, files: filesToLint });
    } catch (error) {
      // If lint fails, fall back to full lint without cache
      return lint({ ...baseLintOpts, files });
    }
  }

  // Update cache with fresh results
  for (const filePath of filesToLint) {
    const contentHashValue = hashFile(filePath);
    if (contentHashValue === null) {
      continue;
    }

    // Extract dependencies for cross-file invalidation
    let dependencies = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      dependencies = extractDependencies(content, filePath);
    } catch {
      // Can't read file for dependency extraction — skip
    }

    store.set(filePath, {
      contentHash: contentHashValue,
      ruleVersionHash,
      configHash: configHashValue,
      results: freshResults[filePath] || [],
      dependencies,
      timestamp: Date.now()
    });
  }

  // Persist cache to disk
  try {
    store.save();
  } catch {
    // Cache write failure is non-fatal
  }

  // Merge cached and fresh results
  const allResults = { ...cachedResults };
  for (const filePath of filesToLint) {
    allResults[filePath] = freshResults[filePath] || [];
  }

  return allResults;
}
