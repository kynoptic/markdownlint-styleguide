#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const jsonc = require('jsonc-parser');

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
  const opts = { preset: null, vscode: false, cli: false, force: false, dryRun: false, help: false };
  
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
    }
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
  --force            Overwrite existing configuration files
  --dry-run          Show what would be generated without writing files
  -h, --help         Show this help message

${colors.yellow}Examples:${colors.reset}
  npx markdownlint-trap init
  npx markdownlint-trap init --preset recommended
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
    return newContent;
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
    log(`  Warning: Could not merge existing VS Code settings: ${e.message}`, 'yellow');
    return newContent;
  }
}

function writeConfig(targetPath, content, force, dryRun, merge = false) {
  const exists = fs.existsSync(targetPath);
  
  if (exists && !force) {
    if (merge && targetPath.endsWith('.json')) {
      content = mergeVSCodeSettings(targetPath, content);
      log(`  Merging with existing file: ${targetPath}`, 'yellow');
    } else {
      log(`  File exists, skipping (use --force to overwrite): ${targetPath}`, 'yellow');
      return false;
    }
  }
  
  if (dryRun) {
    log(`  [DRY RUN] Would write: ${targetPath}`, 'blue');
    return true;
  }
  
  // Ensure directory exists
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(targetPath, content, 'utf8');
  log(`  Created: ${targetPath}`, 'green');
  return true;
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
    log('\n📝 Configuring markdownlint-cli2...', 'cyan');
    const cliConfig = path.join(projectRoot, '.markdownlint-cli2.jsonc');
    const cliTemplate = loadTemplate(preset, 'markdownlint-cli2');
    
    if (writeConfig(cliConfig, cliTemplate, opts.force, opts.dryRun, false)) {
      filesCreated++;
    } else {
      filesSkipped++;
    }
  }
  
  // Configure VS Code
  if (opts.vscode) {
    log('\n🔧 Configuring VS Code...', 'cyan');
    const vscodeDir = path.join(projectRoot, '.vscode');
    const vscodeConfig = path.join(vscodeDir, 'settings.json');
    const vscodeTemplate = loadTemplate(preset, 'vscode-settings');
    
    // Always try to merge VS Code settings
    if (writeConfig(vscodeConfig, vscodeTemplate, opts.force, opts.dryRun, true)) {
      filesCreated++;
    } else {
      filesSkipped++;
    }
  }
  
  // Summary
  log('\n' + '─'.repeat(40), 'blue');
  log('Setup complete!', 'green');
  log(`Files created: ${filesCreated}`, 'green');
  if (filesSkipped > 0) {
    log(`Files skipped: ${filesSkipped}`, 'yellow');
  }
  
  if (!opts.dryRun) {
    log('\n📚 Next steps:', 'cyan');
    log('  1. Install markdownlint-cli2 (if not already): npm install -D markdownlint-cli2');
    log('  2. Lint your markdown: npx markdownlint-cli2 "**/*.md"');
    log('  3. Enable auto-fix: npx markdownlint-cli2 --fix "**/*.md"');
    
    if (opts.vscode) {
      log('  4. Install VS Code markdownlint extension for real-time linting');
      log('     https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint');
    }
    
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
