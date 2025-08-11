#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
}

function safeRun(cmd, label) {
  try {
    run(cmd);
  } catch (err) {
    console.warn(`[markdownlint-trap] Skipped ${label}:`, err?.message || err);
  }
}

// Always try to build so git installs have compiled artifacts available.
safeRun('npm run build', 'build');

// Only set up husky when working in the source repo (not inside node_modules).
const isGitRepo = existsSync(resolve(projectRoot, '.git'));
if (isGitRepo) {
  safeRun('npx --yes husky', 'husky');
}

