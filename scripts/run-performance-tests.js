#!/usr/bin/env node

/**
 * Script to run performance tests with appropriate configuration
 * Handles different CI environments gracefully
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Detect if we're in CI
const isCI = process.env.CI === 'true' || 
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.JENKINS === 'true' ||
             process.env.TRAVIS === 'true';

// Build the command arguments
const nodeArgs = [
  '--experimental-vm-modules'
];

// Only add --expose-gc if not in CI or if explicitly requested
const forceGC = process.env.PERFORMANCE_TEST_GC === 'true';
if (!isCI || forceGC) {
  nodeArgs.push('--expose-gc');
  console.log('Running performance tests with garbage collection exposed');
} else {
  console.log('Running performance tests without garbage collection (CI mode)');
}

// Add Jest executable and config
nodeArgs.push(
  'node_modules/jest/bin/jest.js',
  '--config', 'jest.config.performance.mjs'
);

// Add any additional arguments passed to this script
if (process.argv.length > 2) {
  nodeArgs.push(...process.argv.slice(2));
}

// Run the tests
const child = spawn('node', nodeArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Set environment variable to indicate performance test mode
    PERFORMANCE_TEST: 'true',
    // Ensure color output in CI
    FORCE_COLOR: '1'
  }
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start performance tests:', err);
  process.exit(1);
});