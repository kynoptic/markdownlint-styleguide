#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[distribute-local] ${msg}`);
}

function error(msg) {
  // eslint-disable-next-line no-console
  console.error(`[distribute-local] ERROR: ${msg}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { config: '.github/distribution.local.yml', dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config' && i + 1 < args.length) out.config = args[++i];
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found at ${configPath}. Create it from the template or run: npm run dist:local:init`);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = yaml.load(raw);
  if (!cfg || typeof cfg !== 'object') throw new Error('Invalid YAML config');
  cfg.defaults = cfg.defaults || {};
  cfg.targets = cfg.targets || [];
  return cfg;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === '.git') continue;
    const p = path.join(dir, name);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function validatePath(pathStr) {
  // Security: prevent directory traversal attempts
  const normalized = path.normalize(pathStr);
  if (normalized.includes('..')) {
    throw new Error(`Path contains suspicious '..' sequence: ${pathStr}`);
  }
  return normalized;
}

function expandWildcardPath(pattern, repoRoot) {
  // Security: validate pattern before processing
  validatePath(pattern);

  // Expand tilde to home directory
  if (pattern.startsWith('~/')) {
    pattern = path.join(require('os').homedir(), pattern.slice(2));
  }

  // Check if pattern contains wildcard
  if (!pattern.includes('*')) {
    return [pattern];
  }

  // Convert pattern to absolute path for processing
  const absPattern = path.isAbsolute(pattern) ? pattern : path.join(repoRoot, pattern);

  // Split into base directory and suffix
  const parts = absPattern.split('*');
  if (parts.length !== 2) {
    throw new Error(`Invalid wildcard pattern: ${pattern}. Only one * is supported.`);
  }

  const [baseDir, suffix] = parts;
  
  // Ensure base directory exists
  if (!fs.existsSync(baseDir)) {
    log(`  Warning: Base directory not found: ${baseDir}`);
    return [];
  }
  
  // Get all subdirectories in the base directory
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const expanded = [];
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.git' && !entry.name.startsWith('.')) {
      const fullPath = path.join(baseDir, entry.name, suffix || '');
      expanded.push(fullPath);
    }
  }
  
  if (expanded.length === 0) {
    log(`  Warning: No directories found matching pattern: ${pattern}`);
  } else {
    log(`  Expanded ${pattern} to ${expanded.length} destination(s)`);
  }
  
  return expanded;
}

function mergeJsonSettings(existingPath, newContent) {
  if (!fs.existsSync(existingPath)) {
    return newContent;
  }

  try {
    const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    const newData = JSON.parse(newContent);

    // Merge objects, with new content taking precedence
    // NOTE: This is a shallow merge. Nested objects are replaced, not merged.
    // Example: If existing has {config: {a: 1, b: 2}} and new has {config: {b: 3}},
    // result will be {config: {b: 3}}, not {config: {a: 1, b: 3}}.
    // For more complex merging needs, consider using lodash.merge or similar.
    const merged = { ...existing, ...newData };
    return JSON.stringify(merged, null, 2) + '\n';
  } catch (e) {
    log(`  Warning: Could not merge existing file, will overwrite: ${e.message}`);
    return newContent;
  }
}

function main() {
  let hadErrors = false;
  try {
    const { config, dryRun } = parseArgs();
    const repoRoot = process.cwd();
    const cfg = loadConfig(path.isAbsolute(config) ? config : path.join(repoRoot, config));

    if (dryRun) {
      log('DRY RUN MODE - no files will be modified\n');
    }

    const targets = (cfg.targets || []).filter(t => t && t.enabled);
    if (targets.length === 0) {
      log('No enabled targets. Edit .github/distribution.local.yml to enable targets.');
      return;
    }

    log(`Found ${targets.length} enabled target(s)\n`);

    for (const t of targets) {
      try {
        if (t.type !== 'local') throw new Error(`Unsupported target type: ${t.type}`);

        const src = path.isAbsolute(t.src) ? t.src : path.join(repoRoot, t.src);
        if (!fs.existsSync(src)) throw new Error(`Source not found: ${src}`);
        
        const srcStat = fs.statSync(src);
        if (!srcStat.isFile()) {
          throw new Error(`Source must be a file: ${src}`);
        }

        // Support both single dest (string) and multiple dests (array)
        const rawDests = Array.isArray(t.dest) ? t.dest : [t.dest];
        
        // Expand wildcards in destination paths
        const dests = [];
        for (const rawDest of rawDests) {
          const expanded = expandWildcardPath(rawDest, repoRoot);
          dests.push(...expanded);
        }
        
        if (dests.length === 0) {
          log(`Target '${t.name || 'unnamed'}': No valid destinations, skipping\n`);
          continue;
        }

        const cleanDest = t.cleanDest ?? cfg.defaults.cleanDest ?? false;
        const merge = t.merge ?? false;

        log(`Target '${t.name || 'unnamed'}':`);
        log(`  Source: ${src}`);
        log(`  Destinations: ${dests.length}`);
        log(`  Merge: ${merge}`);
        log(`  Clean: ${cleanDest}`);
        
        const srcContent = fs.readFileSync(src, 'utf8');

        for (let destPath of dests) {
          // Expand tilde to home directory
          if (destPath.startsWith('~/')) {
            destPath = path.join(require('os').homedir(), destPath.slice(2));
          }
          const dest = path.isAbsolute(destPath) ? destPath : path.join(repoRoot, destPath);
          
          log(`  -> ${dest}`);

          if (dryRun) { 
            log('     [dry-run] Would copy file');
            continue;
          }

          // Handle parent directory
          const destDir = path.dirname(dest);
          
          // Check if parent directory exists - skip if it doesn't
          if (!fs.existsSync(destDir)) {
            log(`     [skip] Parent directory does not exist: ${destDir}`);
            continue;
          }

          // Prepare content (merge if needed)
          let finalContent = srcContent;
          if (merge && dest.endsWith('.json')) {
            finalContent = mergeJsonSettings(dest, srcContent);
          }

          // Clean destination if requested
          if (cleanDest && fs.existsSync(dest)) {
            fs.rmSync(dest, { force: true });
          }

          // Write file
          fs.writeFileSync(dest, finalContent, 'utf8');
          log('     [done]');
        }
        log('');
      } catch (e) {
        hadErrors = true;
        error(`Target '${t.name || 'unnamed'}': ${e.message || String(e)}\n`);
      }
    }
    
    if (dryRun) {
      log('DRY RUN COMPLETE - no files were modified');
      log('Run without --dry-run to apply changes');
    } else {
      log('DISTRIBUTION COMPLETE');
    }
  } catch (e) {
    hadErrors = true;
    error(e.message || String(e));
  }
  if (hadErrors) process.exitCode = 1;
}

main();
