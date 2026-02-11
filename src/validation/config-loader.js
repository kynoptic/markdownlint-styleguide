/**
 * Configuration loader for external validation.
 * Loads and validates .markdownlint-trap-validation.jsonc config files.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parse } from 'jsonc-parser';

/**
 * Default configuration structure.
 */
const DEFAULT_CONFIG = {
  sources: {
    local: [],
    github: []
  },
  filters: {
    include: ['**/*.md'],
    exclude: ['**/node_modules/**', '**/vendor/**']
  },
  reporting: {
    format: ['json'],
    detailLevel: 'detailed',
    outputDir: 'validation-reports'
  }
};

/**
 * Expand tilde (~) in file paths to home directory.
 * @param {string} filePath - Path potentially containing tilde
 * @returns {string} Expanded path
 */
function expandTildePath(filePath) {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Load configuration from file.
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig(configPath) {
  try {
    const content = await fs.promises.readFile(configPath, 'utf8');
    const config = parse(content);

    // Expand tilde paths in local sources (guard against non-array inputs)
    const localSources = config.sources?.local || DEFAULT_CONFIG.sources.local;
    const expandedLocalSources = Array.isArray(localSources)
      ? localSources.map(expandTildePath)
      : DEFAULT_CONFIG.sources.local;

    // Deep merge to preserve nested defaults
    return {
      sources: {
        ...DEFAULT_CONFIG.sources,
        ...config.sources,
        local: expandedLocalSources
      },
      filters: {
        ...DEFAULT_CONFIG.filters,
        ...config.filters
      },
      reporting: {
        ...DEFAULT_CONFIG.reporting,
        ...config.reporting
      }
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

/**
 * Validate configuration structure.
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateConfig(config) {
  const errors = [];

  // Validate sources
  if (!config.sources) {
    errors.push('Configuration must include "sources" field');
  } else {
    // Validate local sources type
    if (config.sources.local !== undefined && !Array.isArray(config.sources.local)) {
      errors.push('sources.local must be an array');
    }

    // Validate github sources type
    if (config.sources.github !== undefined && !Array.isArray(config.sources.github)) {
      errors.push('sources.github must be an array');
    }

    const hasLocalSources = Array.isArray(config.sources.local) && config.sources.local.length > 0;
    const hasGithubSources = Array.isArray(config.sources.github) && config.sources.github.length > 0;

    if (!hasLocalSources && !hasGithubSources) {
      errors.push('Configuration must include at least one source (local or github with non-empty arrays)');
    }
  }

  // Validate reporting format
  if (config.reporting && config.reporting.format) {
    const validFormats = ['json', 'markdown'];
    const invalidFormats = config.reporting.format.filter(f => !validFormats.includes(f));
    if (invalidFormats.length > 0) {
      errors.push('Invalid reporting format: ' + invalidFormats.join(', ') + '. Valid formats: json, markdown');
    }
  }

  // Validate detail level
  if (config.reporting && config.reporting.detailLevel) {
    const validLevels = ['summary', 'detailed', 'full'];
    if (!validLevels.includes(config.reporting.detailLevel)) {
      errors.push('Invalid detail level: ' + config.reporting.detailLevel + '. Valid levels: summary, detailed, full');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Find configuration file in current or parent directories.
 * @param {string} startDir - Directory to start search from
 * @returns {Promise<string|null>} Path to config file or null if not found
 */
export async function findConfig(startDir = process.cwd()) {
  const configName = '.markdownlint-trap-validation.jsonc';
  let currentDir = startDir;
  let searching = true;

  while (searching) {
    const configPath = path.join(currentDir, configName);
    try {
      await fs.promises.access(configPath);
      return configPath;
    } catch {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        return null;
      }
      currentDir = parentDir;
    }
  }

  return null;
}
