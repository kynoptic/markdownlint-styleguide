// @ts-check

/**
 * Rule that detects broken internal links in Markdown files.
 * Validates that linked files exist and that heading anchors are valid.
 */

import fs from 'fs';
import path from 'path';
import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors 
} from './config-validation.js';

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
 * @param {string} content - The markdown content
 * @returns {string[]} Array of heading anchors
 */
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match ATX headings (# Heading)
    const atxMatch = line.match(/^#{1,6}\s+(.+)/);
    if (atxMatch) {
      const headingText = atxMatch[1].trim();
      headings.push(headingToAnchor(headingText));
    }
    
    // Could also match Setext headings (underlined with = or -) if needed
    // But ATX headings are more common in modern markdown
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
 * Check if a file exists.
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() || stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a heading anchor exists in a file.
 * @param {string} filePath - Path to the markdown file
 * @param {string} anchor - The heading anchor to find
 * @returns {boolean} True if anchor exists
 */
function anchorExists(filePath, anchor) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const headings = extractHeadings(content);
    return headings.includes(anchor);
  } catch {
    return false;
  }
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

  const config = params.config?.['no-dead-internal-links'] || params.config?.DL001 || {};

  // Validate configuration
  const configSchema = {
    ignoredPaths: validateStringArray,
    checkAnchors: validateBoolean,
    allowedExtensions: validateStringArray
  };

  const validationResult = validateConfig(config, configSchema, 'no-dead-internal-links');
  if (!validationResult.isValid) {
    logValidationErrors('no-dead-internal-links', validationResult.errors);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const ignoredPaths = Array.isArray(config.ignoredPaths) ? config.ignoredPaths : [];
  const checkAnchors = typeof config.checkAnchors === 'boolean' ? config.checkAnchors : true;
  const allowedExtensions = Array.isArray(config.allowedExtensions) ? config.allowedExtensions : ['.md', '.markdown'];

  const lines = params.lines;
  const currentFile = params.name || '';
  
  // Skip if we don't have a valid file path
  if (!currentFile || currentFile.includes('<stdin>')) {
    return;
  }

  // Parse tokens for links if available (future enhancement)
  // const tokens = params.parsers?.micromark?.tokens || [];
  
  // Pattern to match markdown links: [text](url)
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
        if (checkAnchors) {
          const anchor = linkUrl.substring(1);
          if (anchor && currentFile) {
            const currentFileHeadings = extractHeadings(params.lines.join('\n'));
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
        
        // Resolve the relative path
        const resolvedPath = resolvePath(currentFile, filePath);
        
        // Check if it's a directory link (ends with /)
        const isDirectory = filePath.endsWith('/');
        
        // For directories, check if the directory exists
        // For files, check if the file exists (try with and without .md extension)
        let exists = false;
        
        if (isDirectory) {
          exists = fileExists(resolvedPath);
        } else {
          exists = fileExists(resolvedPath);
          
          // If not found and doesn't have extension, try with allowed extensions
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

// Export the rule
export default {
  names: ['no-dead-internal-links', 'DL001'],
  description: 'Detects broken internal links to files or headings',
  tags: ['links', 'validation'],
  parser: 'micromark',
  function: noDeadInternalLinks,
  fixable: false
};