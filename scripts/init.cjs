#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const jsonc = require('jsonc-parser');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    preset: null,
    vscode: false,
    cli: false,
    force: false,
    dryRun: false,
    help: false,
    githubAction: false,
    scripts: false,
    hooks: false,
    all: false,
    upgrade: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--preset' && i + 1 < args.length) {
      opts.preset = args[++i];
    } else if (arg === '--vscode') {
      opts.vscode = true;
    } else if (arg === '--cli') {
      opts.cli = true;
    } else if (arg === '--force') {
      opts.force = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--github-action') {
      opts.githubAction = true;
    } else if (arg === '--scripts') {
      opts.scripts = true;
    } else if (arg === '--hooks') {
      opts.hooks = true;
    } else if (arg === '--all') {
      opts.all = true;
    } else if (arg === '--upgrade') {
      opts.upgrade = true;
    }
  }

  // --all enables all optional features
  if (opts.all) {
    opts.githubAction = true;
    opts.scripts = true;
    opts.hooks = true;
  }

  // If neither specified, enable both
  if (!opts.vscode && !opts.cli) {
    opts.vscode = true;
    opts.cli = true;
  }

  return opts;
}

function showHelp() {
  console.log(`
${colors.cyan}markdownlint-trap init${colors.reset} - Setup markdownlint-trap in your project

${colors.yellow}Usage:${colors.reset}
  npx markdownlint-trap init [options]

${colors.yellow}Options:${colors.reset}
  --preset <level>    Preset level: basic, recommended, or strict (default: interactive)
  --vscode           Only configure VS Code settings
  --cli              Only configure markdownlint-cli2
  --github-action    Add GitHub Actions workflow for CI
  --scripts          Add npm scripts (lint:md, lint:md:fix) to package.json
  --hooks            Configure lint-staged for pre-commit hooks
  --all              Enable all optional features (github-action, scripts, hooks)
  --upgrade          Merge new config options while preserving customizations
  --force            Overwrite existing configuration files
  --dry-run          Show what would be generated without writing files
  -h, --help         Show this help message

${colors.yellow}Examples:${colors.reset}
  npx markdownlint-trap init
  npx markdownlint-trap init --preset recommended
  npx markdownlint-trap init --preset recommended --all
  npx markdownlint-trap init --vscode --preset strict
  npx markdownlint-trap init --dry-run

${colors.yellow}Presets:${colors.reset}
  ${colors.green}basic${colors.reset}        - Core rules only (sentence-case, backticks)
  ${colors.green}recommended${colors.reset}  - All custom rules enabled (balanced strictness)
  ${colors.green}strict${colors.reset}       - All custom + standard markdownlint rules
`);
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectPreset(currentPreset) {
  if (currentPreset && ['basic', 'recommended', 'strict'].includes(currentPreset)) {
    return currentPreset;
  }
  
  log('\nSelect a preset level:', 'cyan');
  log('  1) basic        - Core rules only (sentence-case, backticks)');
  log('  2) recommended  - All custom rules (balanced strictness) [default]');
  log('  3) strict       - All custom + standard markdownlint rules');
  
  const answer = await prompt('\nEnter your choice (1-3) or press Enter for recommended: ');
  
  if (answer === '1') return 'basic';
  if (answer === '3') return 'strict';
  return 'recommended'; // Default
}

function detectExistingConfig(targetPath) {
  return fs.existsSync(targetPath);
}

function loadTemplate(preset, type) {
  // All templates now use .jsonc extension to support comments
  const templatePath = path.join(__dirname, '..', 'templates', `${type}-${preset}.jsonc`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf8');
}

function mergeVSCodeSettings(existingPath, newContent) {
  if (!fs.existsSync(existingPath)) {
    return { content: newContent, preserved: [] };
  }

  try {
    const existingText = fs.readFileSync(existingPath, 'utf8');

    // Parse both files with JSONC to handle comments
    const existing = jsonc.parse(existingText);
    const newData = jsonc.parse(newContent);

    // Use strip-json-comments approach: keep template structure with comments,
    // then manually insert existing-only keys at the end
    const lines = newContent.split('\n');
    const lastBrace = lines.lastIndexOf('}');

    if (lastBrace === -1) {
      // Malformed JSON, fall back to overwrite
      return { content: newContent, preserved: [] };
    }

    // Collect keys that only exist in existing file
    const existingOnlyKeys = Object.keys(existing).filter(key => !(key in newData));

    if (existingOnlyKeys.length === 0) {
      // No extra keys to add, return template as-is
      return { content: newContent, preserved: [] };
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

    return { content: result, preserved: existingOnlyKeys };
  } catch (e) {
    log(`  Warning: Could not merge existing VS Code settings: ${e.message}`, 'yellow');
    return { content: newContent, preserved: [] };
  }
}

function deepMerge(target, source, path = '') {
  const result = { ...target };
  const added = [];

  for (const key of Object.keys(source)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!(key in target)) {
      // New key - add it
      result[key] = source[key];
      added.push(currentPath);
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      // Both are objects - recurse
      const merged = deepMerge(target[key], source[key], currentPath);
      result[key] = merged.result;
      added.push(...merged.added);
    }
    // Otherwise keep existing value (don't overwrite)
  }

  return { result, added };
}

function upgradeConfig(existingPath, templateContent) {
  if (!fs.existsSync(existingPath)) {
    return { content: templateContent, added: [], isNew: true };
  }

  try {
    const existingText = fs.readFileSync(existingPath, 'utf8');
    const existing = jsonc.parse(existingText);
    const template = jsonc.parse(templateContent);

    const { result, added } = deepMerge(existing, template);

    // Format the output
    const content = JSON.stringify(result, null, 2);

    return { content, added, isNew: false };
  } catch (e) {
    log(`  Warning: Could not parse existing config: ${e.message}`, 'yellow');
    return { content: templateContent, added: [], isNew: true };
  }
}

function mergeExtensionsJson(existingPath, newRecommendations) {
  let existing = { recommendations: [] };

  if (fs.existsSync(existingPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      if (!Array.isArray(existing.recommendations)) {
        existing.recommendations = [];
      }
    } catch {
      existing = { recommendations: [] };
    }
  }

  // Add new recommendations without duplicates
  for (const rec of newRecommendations) {
    if (!existing.recommendations.includes(rec)) {
      existing.recommendations.push(rec);
    }
  }

  return JSON.stringify(existing, null, 2) + '\n';
}

function configureExtensions(projectRoot, dryRun) {
  const extensionsPath = path.join(projectRoot, '.vscode', 'extensions.json');
  const recommendations = ['DavidAnson.vscode-markdownlint'];

  const content = mergeExtensionsJson(extensionsPath, recommendations);

  if (dryRun) {
    log(`  [DRY RUN] Would write: ${extensionsPath}`, 'blue');
    return true;
  }

  const dir = path.dirname(extensionsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(extensionsPath, content, 'utf8');
  log(`  Created: ${extensionsPath}`, 'green');
  return true;
}

function getGitHubActionsWorkflow() {
  return `name: Markdown Lint

on:
  push:
    branches: [main]
    paths:
      - '**/*.md'
  pull_request:
    branches: [main]
    paths:
      - '**/*.md'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint Markdown
        run: npx markdownlint-cli2 "**/*.md"
`;
}

function configureGitHubAction(projectRoot, force, dryRun) {
  const workflowPath = path.join(projectRoot, '.github', 'workflows', 'markdown-lint.yml');

  if (fs.existsSync(workflowPath) && !force) {
    log(`  File exists, skipping (use --force to overwrite): ${workflowPath}`, 'yellow');
    return false;
  }

  if (dryRun) {
    log(`  [DRY RUN] Would write: ${workflowPath}`, 'blue');
    return true;
  }

  const dir = path.dirname(workflowPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(workflowPath, getGitHubActionsWorkflow(), 'utf8');
  log(`  Created: ${workflowPath}`, 'green');
  return true;
}

function configureNpmScripts(projectRoot, force, dryRun) {
  const pkgPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    log('  ⚠ package.json not found, skipping npm scripts', 'yellow');
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  const scriptsToAdd = {
    'lint:md': 'markdownlint-cli2 "**/*.md"',
    'lint:md:fix': 'markdownlint-cli2 --fix "**/*.md"',
  };

  let added = 0;
  let skipped = 0;

  for (const [name, cmd] of Object.entries(scriptsToAdd)) {
    if (pkg.scripts[name] && !force) {
      log(`  ⚠ Script "${name}" already exists, skipping`, 'yellow');
      skipped++;
    } else {
      pkg.scripts[name] = cmd;
      added++;
    }
  }

  if (added === 0) {
    return false;
  }

  if (dryRun) {
    log(`  [DRY RUN] Would add ${added} script(s) to package.json`, 'blue');
    return true;
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  log(`  Added ${added} script(s) to package.json`, 'green');
  return true;
}

function configureLintStaged(projectRoot, dryRun) {
  const pkgPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    log('  ⚠ package.json not found, skipping lint-staged config', 'yellow');
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg['lint-staged']) {
    pkg['lint-staged'] = {};
  }

  // Add markdown linting to lint-staged
  if (!pkg['lint-staged']['*.md']) {
    pkg['lint-staged']['*.md'] = ['markdownlint-cli2 --fix'];
  }

  if (dryRun) {
    log('  [DRY RUN] Would add lint-staged config to package.json', 'blue');
    return true;
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  log('  Added lint-staged config to package.json', 'green');
  log('  💡 Make sure husky is installed: npx husky init', 'blue');
  return true;
}

function validateConfig(projectRoot, dryRun) {
  if (dryRun) {
    return true;
  }

  log('\n✅ Validating configuration...', 'cyan');

  const cliConfig = path.join(projectRoot, '.markdownlint-cli2.jsonc');
  if (fs.existsSync(cliConfig)) {
    try {
      const content = fs.readFileSync(cliConfig, 'utf8');
      jsonc.parse(content);
      log('  ✓ CLI config is valid', 'green');
    } catch (err) {
      log(`  ✗ CLI config has errors: ${err.message}`, 'red');
      return false;
    }
  }

  const vscodeConfig = path.join(projectRoot, '.vscode', 'settings.json');
  if (fs.existsSync(vscodeConfig)) {
    try {
      const content = fs.readFileSync(vscodeConfig, 'utf8');
      jsonc.parse(content);
      log('  ✓ VS Code settings are valid', 'green');
    } catch (err) {
      log(`  ✗ VS Code settings have errors: ${err.message}`, 'red');
      return false;
    }
  }

  return true;
}

function checkDependency(name, cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'cyan');

  const cli2Installed = checkDependency('markdownlint-cli2', 'npx markdownlint-cli2 --version');

  if (cli2Installed) {
    log('  ✓ markdownlint-cli2 is installed', 'green');
  } else {
    log('  ⚠ markdownlint-cli2 not found', 'yellow');
    log('    Install with: npm install -D markdownlint-cli2', 'yellow');
  }

  return { cli2Installed };
}

function writeConfig(targetPath, content, force, dryRun, merge = false) {
  const exists = fs.existsSync(targetPath);
  let preserved = [];

  if (exists && !force) {
    if (merge && targetPath.endsWith('.json')) {
      const result = mergeVSCodeSettings(targetPath, content);
      content = result.content;
      preserved = result.preserved;
      log(`  Merging with existing file: ${targetPath}`, 'yellow');
    } else {
      log(`  File exists, skipping (use --force to overwrite): ${targetPath}`, 'yellow');
      return { success: false, preserved: [] };
    }
  }

  if (dryRun) {
    log(`  [DRY RUN] Would write: ${targetPath}`, 'blue');
    return { success: true, preserved };
  }

  // Ensure directory exists
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  log(`  Created: ${targetPath}`, 'green');

  // Show preserved settings
  if (preserved.length > 0) {
    log(`  Preserved ${preserved.length} existing setting(s): ${preserved.join(', ')}`, 'blue');
  }

  return { success: true, preserved };
}

async function init() {
  const opts = parseArgs();
  
  if (opts.help) {
    showHelp();
    return;
  }
  
  log('\n╔═══════════════════════════════════════╗', 'cyan');
  log('║  markdownlint-trap setup wizard      ║', 'cyan');
  log('╚═══════════════════════════════════════╝', 'cyan');
  
  if (opts.dryRun) {
    log('\n[DRY RUN MODE - No files will be modified]', 'yellow');
  }
  
  // Select preset
  const preset = await selectPreset(opts.preset);
  log(`\nUsing preset: ${preset}`, 'green');
  
  // Detect project root
  const projectRoot = process.cwd();
  log(`\nProject root: ${projectRoot}`, 'blue');
  
  let filesCreated = 0;
  let filesSkipped = 0;
  
  // Configure markdownlint-cli2
  if (opts.cli) {
    const cliConfig = path.join(projectRoot, '.markdownlint-cli2.jsonc');
    const cliTemplate = loadTemplate(preset, 'markdownlint-cli2');

    if (opts.upgrade && fs.existsSync(cliConfig)) {
      log('\n⬆️  Upgrading markdownlint-cli2 config...', 'cyan');
      const upgrade = upgradeConfig(cliConfig, cliTemplate);

      if (upgrade.added.length > 0) {
        if (opts.dryRun) {
          log(`  [DRY RUN] Would add ${upgrade.added.length} new option(s)`, 'blue');
          log(`  New options: ${upgrade.added.join(', ')}`, 'blue');
        } else {
          fs.writeFileSync(cliConfig, upgrade.content, 'utf8');
          log(`  Upgraded: ${cliConfig}`, 'green');
          log(`  Added ${upgrade.added.length} new option(s): ${upgrade.added.join(', ')}`, 'green');
        }
        filesCreated++;
      } else {
        log('  Config is already up to date', 'green');
      }
    } else {
      log('\n📝 Configuring markdownlint-cli2...', 'cyan');
      const result = writeConfig(cliConfig, cliTemplate, opts.force, opts.dryRun, false);
      if (result.success) {
        filesCreated++;
      } else {
        filesSkipped++;
      }
    }
  }

  // Configure VS Code
  if (opts.vscode) {
    log('\n🔧 Configuring VS Code...', 'cyan');
    const vscodeDir = path.join(projectRoot, '.vscode');
    const vscodeConfig = path.join(vscodeDir, 'settings.json');
    const vscodeTemplate = loadTemplate(preset, 'vscode-settings');

    // Always try to merge VS Code settings
    const result = writeConfig(vscodeConfig, vscodeTemplate, opts.force, opts.dryRun, true);
    if (result.success) {
      filesCreated++;
    } else {
      filesSkipped++;
    }

    // Also create extensions.json for extension recommendations
    configureExtensions(projectRoot, opts.dryRun);
    filesCreated++;
  }

  // Configure GitHub Actions workflow
  if (opts.githubAction) {
    log('\n🚀 Configuring GitHub Actions...', 'cyan');
    if (configureGitHubAction(projectRoot, opts.force, opts.dryRun)) {
      filesCreated++;
    } else {
      filesSkipped++;
    }
  }

  // Configure npm scripts
  if (opts.scripts) {
    log('\n📦 Configuring npm scripts...', 'cyan');
    if (configureNpmScripts(projectRoot, opts.force, opts.dryRun)) {
      filesCreated++;
    }
  }

  // Configure pre-commit hooks
  if (opts.hooks) {
    log('\n🪝 Configuring pre-commit hooks...', 'cyan');
    if (configureLintStaged(projectRoot, opts.dryRun)) {
      filesCreated++;
    }
  }

  // Validate configuration
  validateConfig(projectRoot, opts.dryRun);
  
  // Check dependencies
  const deps = checkDependencies();

  // Summary
  log('\n' + '─'.repeat(40), 'blue');
  log('Setup complete!', 'green');
  log(`Files created: ${filesCreated}`, 'green');
  if (filesSkipped > 0) {
    log(`Files skipped: ${filesSkipped}`, 'yellow');
  }

  if (!opts.dryRun) {
    log('\n📚 Next steps:', 'cyan');

    let step = 1;
    if (!deps.cli2Installed) {
      log(`  ${step}. Install dependencies:`);
      log('     npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2');
      step++;
    }
    log(`  ${step}. Lint your markdown: npx markdownlint-cli2 "**/*.md"`);
    step++;
    log(`  ${step}. Enable auto-fix: npx markdownlint-cli2 --fix "**/*.md"`);
    step++;

    if (opts.vscode) {
      log(`  ${step}. Install VS Code markdownlint extension for real-time linting`);
      log('     https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint');
      step++;
    }

    log('\n💡 Troubleshooting:', 'cyan');
    log('  Run diagnostics: npx markdownlint-trap doctor');

    log('\n📖 Documentation:', 'cyan');
    log('  https://github.com/kynoptic/markdownlint-trap#readme');
  } else {
    log('\nRun without --dry-run to apply changes', 'yellow');
  }

  log('');
}

// Run
init().catch((err) => {
  log(`\nError: ${err.message}`, 'red');
  process.exit(1);
});
