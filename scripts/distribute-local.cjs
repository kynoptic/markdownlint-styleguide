#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const jsonc = require('jsonc-parser');
const { execSync } = require('child_process');

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
  cfg.npmInstall = cfg.npmInstall || {};
  cfg.globalInstall = cfg.globalInstall || {};
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
    const existingText = fs.readFileSync(existingPath, 'utf8');

    // Parse both files with JSONC to handle comments
    const existing = jsonc.parse(existingText);
    const newData = jsonc.parse(newContent);

    // Merge objects, with new content taking precedence
    // NOTE: This is a shallow merge. Nested objects are replaced, not merged.
    // Example: If existing has {config: {a: 1, b: 2}} and new has {config: {b: 3}},
    // result will be {config: {b: 3}}, not {config: {a: 1, b: 3}}.
    // For more complex merging needs, consider using lodash.merge or similar.
    const merged = { ...existing, ...newData };

    // Use strip-json-comments approach: keep template structure with comments,
    // then manually insert existing-only keys at the end
    const lines = newContent.split('\n');
    const lastBrace = lines.lastIndexOf('}');

    if (lastBrace === -1) {
      // Malformed JSON, fall back to overwrite
      return newContent;
    }

    // Collect keys that only exist in existing file
    const existingOnlyKeys = Object.keys(existing).filter(key => !(key in newData));

    if (existingOnlyKeys.length === 0) {
      // No extra keys to add, return template as-is
      return newContent;
    }

    // Insert existing-only keys before the closing brace
    const additionalLines = [];
    additionalLines.push(''); // Blank line before existing settings
    additionalLines.push('  // === Existing project settings ===');
    additionalLines.push('');

    for (let i = 0; i < existingOnlyKeys.length; i++) {
      const key = existingOnlyKeys[i];
      const value = JSON.stringify(existing[key], null, 2).split('\n').map((line, idx) =>
        idx === 0 ? line : '  ' + line
      ).join('\n');
      // Add comma only if not the last key overall
      const comma = i < existingOnlyKeys.length - 1 ? ',' : '';
      additionalLines.push(`  ${JSON.stringify(key)}: ${value}${comma}`);
    }

    // Insert before closing brace
    const result = [
      ...lines.slice(0, lastBrace),
      ...additionalLines,
      ...lines.slice(lastBrace)
    ].join('\n');

    return result;
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

    // Handle global installation first
    if (cfg.globalInstall && cfg.globalInstall.enabled && !dryRun) {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('GLOBAL INSTALLATION PHASE\n');

      const linkLocal = cfg.globalInstall.linkLocal !== false;

      try {
        // Check if already globally linked
        const checkCmd = 'npm list -g --depth=0 markdownlint-trap';
        let isLinked = false;
        try {
          isLinked = execSync(checkCmd, { stdio: 'pipe' }).toString().includes('markdownlint-trap');
        } catch (checkError) {
          // npm list exits non-zero if package not found, which is expected
          isLinked = false;
        }

        if (isLinked) {
          log('✓ markdownlint-trap is already globally linked');
        } else {
          if (linkLocal) {
            log('Globally linking markdownlint-trap...');
            execSync('npm link', { cwd: repoRoot, stdio: 'inherit' });
            log('✓ Globally linked markdownlint-trap');
          } else {
            log('Installing markdownlint-trap globally...');
            execSync('npm install -g markdownlint-trap', { stdio: 'inherit' });
            log('✓ Installed markdownlint-trap globally');
          }
        }
      } catch (e) {
        error(`Failed to install markdownlint-trap globally: ${e.message}`);
        throw e;
      }

      // Check if markdownlint-cli2 is installed globally
      let cli2Installed = false;
      try {
        execSync('which markdownlint-cli2', { stdio: 'pipe' });
        cli2Installed = true;
      } catch (e) {
        // Not in PATH, check npm global list
        try {
          const globalList = execSync('npm list -g --depth=0', { stdio: 'pipe' }).toString();
          cli2Installed = globalList.includes('markdownlint-cli2');
        } catch (e2) {
          // Error listing, assume not installed
        }
      }

      if (cli2Installed) {
        try {
          const version = execSync('markdownlint-cli2 --version', { stdio: 'pipe' }).toString().trim();
          log(`✓ markdownlint-cli2 is already installed globally (${version})`);
        } catch (e) {
          log('✓ markdownlint-cli2 is already installed globally');
        }
      } else {
        log('Installing markdownlint-cli2 globally...');
        execSync('npm install -g markdownlint-cli2', { stdio: 'inherit' });
        log('✓ Installed markdownlint-cli2 globally');
      }

      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
        const createDirs = t.createDirs ?? cfg.defaults.createDirs ?? false;

        log(`Target '${t.name || 'unnamed'}':`);
        log(`  Source: ${src}`);
        log(`  Destinations: ${dests.length}`);
        log(`  Merge: ${merge}`);
        log(`  Clean: ${cleanDest}`);
        log(`  Create dirs: ${createDirs}`);
        
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

          // Check if parent directory exists
          if (!fs.existsSync(destDir)) {
            if (createDirs) {
              if (dryRun) {
                log(`     [dry-run] Would create directory: ${destDir}`);
              } else {
                ensureDir(destDir);
                log(`     [created] ${destDir}`);
              }
            } else {
              log(`     [skip] Parent directory does not exist: ${destDir}`);
              continue;
            }
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
    
    // Handle npm install if configured
    if (cfg.npmInstall && cfg.npmInstall.enabled && !dryRun) {
      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('NPM INSTALL PHASE\n');

      const packages = cfg.npmInstall.packages || [];
      if (packages.length === 0) {
        log('No packages configured for installation');
      } else {
        const projectDirs = cfg.npmInstall.projectDirs || ['~/Projects/*'];
        const expandedProjects = new Set();

        // Expand wildcard project directories
        for (const projectPattern of projectDirs) {
          let expandedPath = projectPattern;
          if (expandedPath.startsWith('~/')) {
            expandedPath = path.join(require('os').homedir(), expandedPath.slice(2));
          }

          if (expandedPath.includes('*')) {
            const parts = expandedPath.split('*');
            if (parts.length === 2) {
              const [baseDir] = parts;
              if (fs.existsSync(baseDir)) {
                const entries = fs.readdirSync(baseDir, { withFileTypes: true });
                for (const entry of entries) {
                  if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    expandedProjects.add(path.join(baseDir, entry.name));
                  }
                }
              }
            }
          } else {
            if (!path.isAbsolute(expandedPath)) {
              expandedPath = path.join(repoRoot, expandedPath);
            }
            if (fs.existsSync(expandedPath)) {
              expandedProjects.add(expandedPath);
            }
          }
        }

        log(`Found ${expandedProjects.size} project(s)`);
        log(`Packages: ${packages.join(', ')}\n`);

        let installedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const projectDir of expandedProjects) {
          const projectName = path.basename(projectDir);
          const packageJsonPath = path.join(projectDir, 'package.json');

          // Skip if no package.json
          if (!fs.existsSync(packageJsonPath)) {
            log(`[skip] ${projectName} (no package.json)`);
            skippedCount++;
            continue;
          }

          // Check if already installed
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const devDeps = packageJson.devDependencies || {};
            const allInstalled = packages.every(pkg => pkg in devDeps);

            if (allInstalled) {
              log(`[skip] ${projectName} (already installed)`);
              skippedCount++;
              continue;
            }
          } catch (e) {
            log(`[skip] ${projectName} (invalid package.json)`);
            skippedCount++;
            continue;
          }

          // Install packages
          try {
            log(`[installing] ${projectName}...`);
            // Validate package names to prevent command injection
            const validPackagePattern = /^[@a-z0-9-~][a-z0-9-._~]*$/i;
            for (const pkg of packages) {
              if (!validPackagePattern.test(pkg)) {
                throw new Error(`Invalid package name: ${pkg}`);
              }
            }
            execSync(`npm install --save-dev ${packages.join(' ')}`, {
              cwd: projectDir,
              stdio: 'pipe'
            });
            log(`[done] ${projectName}`);
            installedCount++;
          } catch (e) {
            error(`[failed] ${projectName}: ${e.message}`);
            failedCount++;
            hadErrors = true;
          }
        }

        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('NPM INSTALL SUMMARY:');
        log(`  Installed: ${installedCount} projects`);
        log(`  Skipped: ${skippedCount} projects`);
        if (failedCount > 0) {
          error(`  Failed: ${failedCount} projects`);
        }
      }
    }

    if (dryRun) {
      log('\nDRY RUN COMPLETE - no files were modified');
      log('Run without --dry-run to apply changes');
    } else {
      log('\nDISTRIBUTION COMPLETE');
    }
  } catch (e) {
    hadErrors = true;
    error(e.message || String(e));
  }
  if (hadErrors) process.exitCode = 1;
}

main();
