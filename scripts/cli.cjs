#!/usr/bin/env node
'use strict';

/**
 * @fileoverview CLI router for markdownlint-styleguide commands
 * Routes to init (default) or doctor subcommands
 */

const path = require('path');
const { spawn } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function showHelp() {
  console.log(`
${colors.cyan}markdownlint-styleguide${colors.reset} - Custom markdownlint rules CLI

${colors.yellow}Usage:${colors.reset}
  npx mdsg [command] [options]

${colors.yellow}Commands:${colors.reset}
  init     Setup markdownlint-styleguide in your project (default)
  doctor   Run diagnostics to check your setup

${colors.yellow}Examples:${colors.reset}
  npx mdsg                     # Run init wizard
  npx mdsg init --preset basic # Init with basic preset
  npx mdsg doctor              # Check setup

${colors.yellow}Options:${colors.reset}
  --help, -h    Show this help message

Run 'npx mdsg init --help' for init-specific options.
`);
}

function runScript(scriptName, args) {
  const scriptPath = path.join(__dirname, scriptName);
  const child = spawn(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`Failed to run ${scriptName}: ${err.message}`);
    process.exit(1);
  });
}

function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0];

  // Check for help flag at any position
  if (args.includes('--help') || args.includes('-h')) {
    // If help is with a subcommand, pass it through
    if (firstArg === 'init') {
      runScript('init.cjs', args.slice(1));
      return;
    }
    if (firstArg === 'doctor') {
      showHelp();
      return;
    }
    showHelp();
    return;
  }

  // Route to appropriate command
  if (!firstArg || firstArg.startsWith('-')) {
    // No subcommand or starts with option: run init with all args
    runScript('init.cjs', args);
  } else if (firstArg === 'init') {
    // Explicit init: pass remaining args
    runScript('init.cjs', args.slice(1));
  } else if (firstArg === 'doctor') {
    // Doctor command
    runScript('doctor.cjs', args.slice(1));
  } else {
    // Unknown command: treat as init args
    runScript('init.cjs', args);
  }
}

main();
