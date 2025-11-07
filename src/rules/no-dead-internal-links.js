// @ts-check

/**
 * Rule that detects broken internal links in Markdown files.
 * Validates that linked files exist and that heading anchors are valid.
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - This rule performs synchronous file I/O operations which can become bottlenecks
 * - File existence checks and content reading scale O(n) with number of unique links
 * - Caching is implemented to minimize redundant file system operations within a lint run
 * - Cache is per-lint-run only (not persistent) due to markdownlint's design constraints
 */

import fs from 'fs';
import path from 'path';
import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors,
  createMarkdownlintLogger 
} from './config-validation.js';

// Performance optimization: Cache for file existence and heading extraction
// These caches are shared across all rule invocations within a single lint run
const fileExistenceCache = new Map(); // filepath -> boolean
const headingCache = new Map(); // filepath -> string[] (anchors)
const contentCache = new Map(); // filepath -> string (file content)

/**
 * Convert a heading text to an anchor format used in GitHub-flavored markdown.
 * This follows GitHub's algorithm for converting headings to anchors.
 * @param {string} heading - The heading text
 * @returns {string} The anchor-formatted heading
 */
function headingToAnchor(heading) {
  return heading
    .toLowerCase()
    .trim()
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove markdown formatting
    .replace(/[*_`[\]]/g, '')
    // Replace spaces and special chars with hyphens
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract headings from a markdown file content.
 * Supports both ATX headings (# Heading) and Setext headings (underlined).
 * PERFORMANCE: This function is lightweight but called frequently.
 * Headings extraction results are cached at the file level.
 * @param {string} content - The markdown content
 * @returns {string[]} Array of heading anchors
 */
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match ATX headings (# Heading)
    const atxMatch = line.match(/^#{1,6}\s+(.+)/);
    if (atxMatch) {
      const headingText = atxMatch[1].trim();
      headings.push(headingToAnchor(headingText));
      continue;
    }

    // Match Setext headings (underlined with = or -)
    // Check if next line exists and is a setext underline
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const currentLineText = line.trim();

      // Setext H1: underlined with = (at least 3 characters)
      if (currentLineText && /^=+$/.test(nextLine.trim()) && nextLine.trim().length >= 3) {
        headings.push(headingToAnchor(currentLineText));
        continue;
      }

      // Setext H2: underlined with - (at least 3 characters)
      if (currentLineText && /^-+$/.test(nextLine.trim()) && nextLine.trim().length >= 3) {
        headings.push(headingToAnchor(currentLineText));
        continue;
      }
    }
  }

  return headings;
}

/**
 * Resolve a relative path from the current file.
 * @param {string} currentFile - Path to the current markdown file
 * @param {string} linkPath - The relative link path
 * @returns {string} Resolved absolute path
 */
function resolvePath(currentFile, linkPath) {
  const dir = path.dirname(currentFile);
  return path.resolve(dir, linkPath);
}

/**
 * Check if a file exists with caching for performance.
 * PERFORMANCE: Caches results to avoid redundant fs.statSync() calls.
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  // Check cache first to avoid redundant file system calls
  if (fileExistenceCache.has(filePath)) {
    return fileExistenceCache.get(filePath);
  }
  
  let exists;
  try {
    const stats = fs.statSync(filePath);
    exists = stats.isFile() || stats.isDirectory();
  } catch {
    exists = false;
  }
  
  // Cache the result for future checks within this lint run
  fileExistenceCache.set(filePath, exists);
  return exists;
}

/**
 * Get file content with caching for performance.
 * PERFORMANCE: Caches file content to avoid redundant fs.readFileSync() calls.
 * @param {string} filePath - Path to the file
 * @returns {string|null} File content or null if not readable
 */
function getFileContent(filePath) {
  // Check cache first to avoid redundant file reads
  if (contentCache.has(filePath)) {
    return contentCache.get(filePath);
  }
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    content = null;
  }
  
  // Cache the content for future reads within this lint run
  contentCache.set(filePath, content);
  return content;
}

/**
 * Get headings from a file with caching for performance.
 * PERFORMANCE: Caches extracted headings to avoid redundant parsing.
 * @param {string} filePath - Path to the markdown file
 * @returns {string[]|null} Array of heading anchors or null if file not readable
 */
function getFileHeadings(filePath) {
  // Check cache first to avoid redundant extraction
  if (headingCache.has(filePath)) {
    return headingCache.get(filePath);
  }
  
  const content = getFileContent(filePath);
  if (content === null) {
    headingCache.set(filePath, null);
    return null;
  }
  
  const headings = extractHeadings(content);
  
  // Cache the headings for future checks within this lint run
  headingCache.set(filePath, headings);
  return headings;
}

/**
 * Check if a heading anchor exists in a file.
 * PERFORMANCE: Uses cached file content and heading extraction.
 * @param {string} filePath - Path to the markdown file
 * @param {string} anchor - The heading anchor to find
 * @returns {boolean} True if anchor exists
 */
function anchorExists(filePath, anchor) {
  const headings = getFileHeadings(filePath);
  return headings ? headings.includes(anchor) : false;
}

/**
 * Check if a link target matches common placeholder patterns.
 * Used to avoid false positives for intentional placeholders in documentation templates.
 *
 * Matching strategy:
 * 1. Exact match (case-insensitive): "URL" matches "url", "URL", "Url"
 * 2. Path prefix match: "path/to/" matches "path/to/file.md"
 * 3. Word-boundary substring match: "TODO" matches "TODO.md", "project-TODO.md" but NOT "PHOTODOC.md"
 *
 * @param {string} target - Link target to check
 * @param {string[]} patterns - Array of placeholder patterns to match
 * @returns {boolean} True if target matches a placeholder pattern
 */
function isPlaceholder(target, patterns) {
  if (!target || !Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }

  // Check each pattern
  for (const pattern of patterns) {
    // Skip non-string patterns (defensive programming - validation should catch this at config level)
    if (typeof pattern !== 'string') {
      continue;
    }

    // Exact match (case-insensitive for common keywords)
    if (target.toLowerCase() === pattern.toLowerCase()) {
      return true;
    }

    // Check if target starts with the pattern (for path patterns like "path/to/")
    if (pattern.endsWith('/') && target.startsWith(pattern)) {
      return true;
    }

    // Word-boundary substring match: check if pattern appears as a complete word/segment
    // This prevents "link" from matching "unlinked.md" or "TODO" from matching "PHOTODOC.md"
    // Uses word boundaries defined by: start/end of string, hyphens, underscores, dots, slashes
    const wordBoundaryPattern = new RegExp(
      `(^|[-_./])${escapeRegExp(pattern)}([-_./]|$)`,
      'i'
    );
    if (wordBoundaryPattern.test(target)) {
      return true;
    }
  }

  return false;
}

/**
 * Escape special regex characters in a string for use in RegExp constructor.
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for use in regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params - Parsed Markdown input
 * @param {import("markdownlint").RuleOnError} onError - Callback to report violations
 */
function noDeadInternalLinks(params, onError) {
  if (!params || !params.lines || typeof onError !== 'function') {
    return;
  }

  // Support both nested config (from .markdownlint-cli2.jsonc) and direct config (from lint API)
  const config = params.config?.['no-dead-internal-links'] || params.config?.DL001 || params.config || {};

  // Validate configuration
  const configSchema = {
    ignoredPaths: validateStringArray,
    checkAnchors: validateBoolean,
    allowedExtensions: validateStringArray,
    allowPlaceholders: validateBoolean,
    placeholderPatterns: validateStringArray
  };

  const validationResult = validateConfig(config, configSchema, 'no-dead-internal-links');
  if (!validationResult.isValid) {
    const logger = createMarkdownlintLogger(onError, 'no-dead-internal-links');
    logValidationErrors('no-dead-internal-links', validationResult.errors, logger);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const ignoredPaths = Array.isArray(config.ignoredPaths) ? config.ignoredPaths : [];
  const checkAnchors = typeof config.checkAnchors === 'boolean' ? config.checkAnchors : true;
  const allowedExtensions = Array.isArray(config.allowedExtensions) ? config.allowedExtensions : ['.md', '.markdown'];
  const allowPlaceholders = typeof config.allowPlaceholders === 'boolean' ? config.allowPlaceholders : false;
  const placeholderPatterns = Array.isArray(config.placeholderPatterns)
    ? config.placeholderPatterns
    : ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com'];

  const lines = params.lines;
  const currentFile = params.name || '';
  
  // Skip if we don't have a valid file path
  if (!currentFile || currentFile.includes('<stdin>')) {
    return;
  }

  // PERFORMANCE: Pre-extract current file headings once for same-page anchor validation
  // This avoids re-parsing the current file content for every same-page anchor check
  const currentFileContent = params.lines.join('\n');
  const currentFileHeadings = extractHeadings(currentFileContent);

  // Parse tokens for links if available (future enhancement)
  // const tokens = params.parsers?.micromark?.tokens || [];
  
  // Pattern to match markdown links: [text](url)
  // PERFORMANCE: Regex compilation is cached by V8, so this is not a bottleneck
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      // const linkText = match[1]; // unused for now
      const linkUrl = match[2];
      const columnStart = match.index + 1;
      
      // Skip external links (http://, https://, mailto:, etc.)
      if (/^[a-z]+:/.test(linkUrl)) {
        continue;
      }
      
      // Skip links that start with # (same-page anchors)
      if (linkUrl.startsWith('#')) {
        // Validate these against current file's headings if configured
        // PERFORMANCE: Uses pre-extracted currentFileHeadings to avoid repeated parsing
        if (checkAnchors) {
          const anchor = linkUrl.substring(1);
          if (anchor && currentFile) {
            if (!currentFileHeadings.includes(anchor)) {
              onError({
                lineNumber,
                detail: `Heading anchor "#${anchor}" not found in current file`,
                context: match[0],
                range: [columnStart, match[0].length]
              });
            }
          }
        }
        continue;
      }
      
      // Parse the link URL to separate file path and anchor
      const [filePath, anchor] = linkUrl.split('#');

      if (filePath) {
        // Check if this path should be ignored
        if (ignoredPaths.some(ignored => filePath.includes(ignored))) {
          continue;
        }

        // Skip placeholder patterns if configured
        if (allowPlaceholders && isPlaceholder(filePath, placeholderPatterns)) {
          continue;
        }

        // Resolve the relative path
        const resolvedPath = resolvePath(currentFile, filePath);
        
        // Check if it's a directory link (ends with /)
        const isDirectory = filePath.endsWith('/');
        
        // PERFORMANCE: File existence checks are now cached to avoid redundant fs.statSync calls
        // For directories, check if the directory exists
        // For files, check if the file exists (try with and without .md extension)
        let exists = false;
        
        if (isDirectory) {
          exists = fileExists(resolvedPath);
        } else {
          exists = fileExists(resolvedPath);
          
          // If not found and doesn't have extension, try with allowed extensions
          // PERFORMANCE: Extension checking uses cached fileExists results
          if (!exists && !path.extname(filePath)) {
            for (const ext of allowedExtensions) {
              if (fileExists(resolvedPath + ext)) {
                exists = true;
                break;
              }
            }
          }
        }
        
        if (!exists) {
          onError({
            lineNumber,
            detail: `Link target "${filePath}" does not exist`,
            context: match[0],
            range: [columnStart, match[0].length]
          });
        } else if (anchor && checkAnchors) {
          // If file exists and there's an anchor, validate the anchor
          // PERFORMANCE: Anchor validation uses cached file content and heading extraction
          let targetFile = resolvedPath;
          if (!path.extname(filePath)) {
            // Try to find the file with an allowed extension
            for (const ext of allowedExtensions) {
              if (fileExists(resolvedPath + ext)) {
                targetFile = resolvedPath + ext;
                break;
              }
            }
          }
          
          if (!anchorExists(targetFile, anchor)) {
            onError({
              lineNumber,
              detail: `Heading anchor "#${anchor}" not found in "${filePath}"`,
              context: match[0],
              range: [columnStart, match[0].length]
            });
          }
        }
      }
    }
  }
}

/**
 * Clear performance caches. Useful for testing or manual cache management.
 * PERFORMANCE: Cache clearing is not typically needed in normal usage since
 * markdownlint runs are typically short-lived and caches are beneficial.
 * @private
 */
function clearCaches() {
  fileExistenceCache.clear();
  headingCache.clear();
  contentCache.clear();
}

/**
 * Get cache statistics for performance monitoring.
 * @returns {Object} Cache size information
 * @private
 */
function getCacheStats() {
  return {
    fileExistenceCache: fileExistenceCache.size,
    headingCache: headingCache.size,
    contentCache: contentCache.size
  };
}

// Export the rule
export default {
  names: ['no-dead-internal-links', 'DL001'],
  description: 'Detects broken internal links to files or headings. Uses caching for performance with large projects.',
  tags: ['links', 'validation', 'performance'],
  parser: 'micromark',
  function: noDeadInternalLinks,
  fixable: false
};

// Test-only exports for internal cache management and monitoring
export const _forTesting = {
  clearCaches,
  getCacheStats
};