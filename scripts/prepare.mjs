#!/usr/bin/env node
/**
 * Prepare script for markdownlint-trap.
 * Sets up husky hooks and enforces quality gates during development.
 *
 * Note: Build step removed - native ESM distribution (see ADR-001)
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
}

function runQuiet(cmd) {
  return execSync(cmd, { stdio: 'pipe', cwd: projectRoot, encoding: 'utf8' });
}

function safeRun(cmd, label) {
  try {
    run(cmd);
  } catch (err) {
    console.warn(`[markdownlint-trap] Skipped ${label}:`, err?.message || err);
  }
}

function enforceQualityGates() {
  const isGitRepo = existsSync(resolve(projectRoot, '.git'));
  if (!isGitRepo) {
    return; // Skip quality checks for npm installations
  }

  console.log('🔍 Enforcing quality gates...');

  try {
    // Ensure linting passes
    runQuiet('npm run lint');
    console.log('✅ Linting passed');
  } catch (err) {
    console.error('❌ Linting failed - fix errors before continuing');
    console.error('   Run "npm run lint" to see details');
    process.exit(1);
  }
}

// Only set up husky and enforce quality gates when working in the source repo
const isGitRepo = existsSync(resolve(projectRoot, '.git'));
if (isGitRepo) {
  safeRun('npx --yes husky', 'husky');
  enforceQualityGates();
}

