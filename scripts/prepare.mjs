#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
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

function checkBuildArtifacts() {
  const artifactsDir = resolve(projectRoot, '.markdownlint-rules');
  const srcDir = resolve(projectRoot, 'src');

  if (!existsSync(artifactsDir)) {
    console.log('🏗️  Build artifacts missing, building...');
    return false;
  }

  try {
    // Check if any source file is newer than build artifacts
    const srcStat = statSync(srcDir);
    const artifactsStat = statSync(artifactsDir);

    if (srcStat.mtime > artifactsStat.mtime) {
      console.log('🔄 Source files are newer than build artifacts, rebuilding...');
      return false;
    }
  } catch (err) {
    console.log('⚠️  Could not check file timestamps, rebuilding to be safe...');
    return false;
  }

  return true;
}

function enforceQualityGates() {
  const isGitRepo = existsSync(resolve(projectRoot, '.git'));
  if (!isGitRepo) {
    return; // Skip quality checks for npm installations
  }

  console.log('🔍 Enforcing quality gates...');

  try {
    // Check if there are uncommitted changes to build artifacts after build
    const status = runQuiet('git status --porcelain .markdownlint-rules/');
    if (status.trim()) {
      console.error('❌ Build artifacts are out of sync with source code');
      console.error('   Run "npm run build" and commit the changes');
      process.exit(1);
    }
  } catch (err) {
    console.warn('⚠️  Could not check git status for build artifacts');
  }

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

// Check if build is needed
const needsBuild = !checkBuildArtifacts();

if (needsBuild) {
  try {
    run('npm run build');
    console.log('✅ Build completed successfully');
  } catch (err) {
    console.error('❌ Build failed:', err?.message || err);
    process.exit(1);
  }
}

// Only set up husky and enforce quality gates when working in the source repo
const isGitRepo = existsSync(resolve(projectRoot, '.git'));
if (isGitRepo) {
  safeRun('npx --yes husky', 'husky');
  enforceQualityGates();
}

