// @ts-check

/**
 * Cache store for incremental linting.
 * Persists lint results keyed by file path with content, rule, and config hashes
 * for invalidation. Supports cross-file dependency tracking.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/** Current cache format version. Bump when format changes incompatibly. */
const CACHE_VERSION = 1;

/** Default cache file name within the cache directory. */
const CACHE_FILENAME = 'cache.json';

/**
 * Compute SHA-256 hash of a string.
 * @param {string} content - Content to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashContent(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Compute SHA-256 hash of a file's contents.
 * @param {string} filePath - Absolute path to file
 * @returns {string | null} Hex-encoded hash, or null if file cannot be read
 */
export function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return hashContent(content);
  } catch {
    return null;
  }
}

/**
 * Compute a deterministic hash of a configuration object.
 * Keys are sorted to ensure order-independent hashing.
 * @param {Object} config - Configuration object
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashConfig(config) {
  return hashContent(JSON.stringify(config, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
    }
    return value;
  }));
}

/**
 * @typedef {Object} CacheEntry
 * @property {string} contentHash - SHA-256 of the file content
 * @property {string} ruleVersionHash - SHA-256 of the rule source files
 * @property {string} configHash - SHA-256 of the relevant config
 * @property {Array} results - Cached lint results (violations)
 * @property {string[]} dependencies - Absolute paths of files this file links to
 * @property {number} timestamp - Unix timestamp when entry was created
 */

/**
 * Persistent cache store for lint results.
 * Stores entries in a JSON file within a cache directory.
 */
export class CacheStore {
  /**
   * @param {string} cacheDir - Directory to store cache files
   */
  constructor(cacheDir) {
    /** @type {string} */
    this._cacheDir = cacheDir;
    /** @type {string} */
    this._cacheFilePath = path.join(cacheDir, CACHE_FILENAME);
    /** @type {Map<string, CacheEntry>} */
    this._entries = new Map();
  }

  /** Number of cached entries. */
  get size() {
    return this._entries.size;
  }

  /**
   * Load cache from disk. Creates cache directory if it does not exist.
   * Falls back to empty cache on any error (corrupt file, wrong version, etc.).
   */
  load() {
    fs.mkdirSync(this._cacheDir, { recursive: true });

    try {
      const raw = fs.readFileSync(this._cacheFilePath, 'utf8');
      const data = JSON.parse(raw);

      if (data.version !== CACHE_VERSION) {
        this._entries = new Map();
        return;
      }

      this._entries = new Map(Object.entries(data.entries || {}));
    } catch {
      this._entries = new Map();
    }
  }

  /**
   * Save cache to disk. Creates directories as needed.
   */
  save() {
    fs.mkdirSync(this._cacheDir, { recursive: true });

    const data = {
      version: CACHE_VERSION,
      entries: Object.fromEntries(this._entries)
    };

    fs.writeFileSync(this._cacheFilePath, JSON.stringify(data, null, 2));
  }

  /**
   * Get a cache entry by file path.
   * @param {string} filePath
   * @returns {CacheEntry | undefined}
   */
  get(filePath) {
    return this._entries.get(filePath);
  }

  /**
   * Store a cache entry for a file.
   * @param {string} filePath
   * @param {CacheEntry} entry
   */
  set(filePath, entry) {
    this._entries.set(filePath, entry);
  }

  /**
   * Check if an entry exists for a file.
   * @param {string} filePath
   * @returns {boolean}
   */
  has(filePath) {
    return this._entries.has(filePath);
  }

  /**
   * Remove a cache entry.
   * @param {string} filePath
   */
  delete(filePath) {
    this._entries.delete(filePath);
  }

  /** Remove all cache entries. */
  clear() {
    this._entries.clear();
  }

  /**
   * Iterate over all cache entries.
   * @returns {IterableIterator<[string, CacheEntry]>}
   */
  entries() {
    return this._entries.entries();
  }

  /**
   * Check if a cache entry is still valid given current hashes.
   * @param {string} filePath - File path to check
   * @param {string} contentHash - Current content hash
   * @param {string} ruleVersionHash - Current rule version hash
   * @param {string} configHash - Current config hash
   * @returns {boolean} True if cache entry is valid (all hashes match)
   */
  isValid(filePath, contentHash, ruleVersionHash, configHash) {
    const entry = this._entries.get(filePath);
    if (!entry) {
      return false;
    }

    return (
      entry.contentHash === contentHash &&
      entry.ruleVersionHash === ruleVersionHash &&
      entry.configHash === configHash
    );
  }

  /**
   * Invalidate all files that depend on a changed file.
   * Handles transitive dependencies and circular references.
   * @param {string} changedFile - The file that changed
   * @returns {string[]} List of invalidated file paths
   */
  invalidateDependents(changedFile) {
    const invalidated = [];
    const visited = new Set();
    const queue = [changedFile];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Find all entries that list `current` in their dependencies
      for (const [filePath, entry] of this._entries) {
        if (filePath === current) {
          continue;
        }
        if (entry.dependencies && entry.dependencies.includes(current)) {
          if (!visited.has(filePath)) {
            invalidated.push(filePath);
            this._entries.delete(filePath);
            // Also check transitive dependents
            queue.push(filePath);
          }
        }
      }
    }

    return invalidated;
  }
}
