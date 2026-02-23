// @ts-check

/**
 * Cross-file dependency tracking for incremental linting.
 * Extracts internal link targets from markdown content and builds
 * a reverse dependency graph for cache invalidation.
 */

import path from 'path';

/**
 * Extract file dependencies from markdown content.
 * Parses internal links ([text](target)) and returns resolved absolute paths
 * of the link targets. Skips external URLs, same-page anchors, and links
 * inside code blocks or inline code.
 *
 * @param {string} content - Raw markdown content
 * @param {string} filePath - Absolute path of the source file
 * @returns {string[]} Deduplicated array of resolved absolute dependency paths
 */
export function extractDependencies(content, filePath) {
  if (!content || !filePath) {
    return [];
  }

  const dir = path.dirname(filePath);
  const deps = new Set();
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks
    const trimmed = line.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // Remove inline code spans before extracting links
    const cleaned = line.replace(/`[^`]*`/g, '');

    // Match markdown links: [text](url)
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(cleaned)) !== null) {
      const linkUrl = match[2];

      // Skip external links (protocol-prefixed)
      if (/^[a-z]+:/i.test(linkUrl)) {
        continue;
      }

      // Skip same-page anchors
      if (linkUrl.startsWith('#')) {
        continue;
      }

      // Strip anchor from link target
      const targetPath = linkUrl.split('#')[0];
      if (!targetPath) {
        continue;
      }

      // Resolve to absolute path
      const resolved = path.resolve(dir, targetPath);
      deps.add(resolved);
    }
  }

  return [...deps];
}

/**
 * Build a reverse dependency graph from per-file dependency lists.
 * Maps each dependency target to the set of files that depend on it.
 * Self-references are excluded.
 *
 * @param {Map<string, string[]>} fileDeps - Map of filePath -> dependency paths
 * @returns {Map<string, string[]>} Reverse map: dependency -> dependents
 */
export function buildDependencyGraph(fileDeps) {
  /** @type {Map<string, Set<string>>} */
  const reverse = new Map();

  for (const [filePath, deps] of fileDeps) {
    for (const dep of deps) {
      // Skip self-references
      if (dep === filePath) {
        continue;
      }

      if (!reverse.has(dep)) {
        reverse.set(dep, new Set());
      }
      reverse.get(dep).add(filePath);
    }
  }

  // Convert Sets to Arrays
  /** @type {Map<string, string[]>} */
  const result = new Map();
  for (const [dep, dependents] of reverse) {
    result.set(dep, [...dependents]);
  }

  return result;
}
