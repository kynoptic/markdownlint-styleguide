#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function checkmark(passed) {
  return passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

class DoctorCheck {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  addCheck(name, status, message = '', fix = '') {
    this.checks.push({ name, status, message, fix });
    if (status === 'pass') this.passed++;
    else if (status === 'fail') this.failed++;
    else if (status === 'warn') this.warnings++;
  }

  checkDependency(name, cmd, installCmd) {
    try {
      execSync(cmd, { stdio: 'ignore' });
      this.addCheck(`${name} installed`, 'pass');
      return true;
    } catch {
      this.addCheck(
        `${name} installed`,
        'fail',
        `${name} is not installed`,
        `Install with: ${installCmd}`
      );
      return false;
    }
  }

  checkFile(name, filePath, required = true) {
    if (fs.existsSync(filePath)) {
      this.addCheck(`${name} exists`, 'pass', filePath);
      return true;
    } else {
      this.addCheck(
        `${name} exists`,
        required ? 'fail' : 'warn',
        `File not found: ${filePath}`,
        required ? `Run: npx markdownlint-trap init` : 'Optional file'
      );
      return false;
    }
  }

  checkJsonFile(name, filePath) {
    if (!fs.existsSync(filePath)) {
      this.addCheck(`${name} valid`, 'warn', 'File not found');
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Remove comments for JSON parsing (JSONC support)
      const stripped = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      JSON.parse(stripped);
      this.addCheck(`${name} valid`, 'pass', 'Syntax OK');
      return true;
    } catch (err) {
      this.addCheck(
        `${name} valid`,
        'fail',
        `Syntax error: ${err.message}`,
        'Check file syntax and fix JSON errors'
      );
      return false;
    }
  }

  checkRuleLoading() {
    try {
      // Try to load from the package
      let rules;
      try {
        rules = require('markdownlint-trap');
      } catch (err) {
        // If running from within the package itself, try loading from built output
        const localPath = path.join(__dirname, '..', '.markdownlint-rules', 'index.cjs');
        if (fs.existsSync(localPath)) {
          try {
            rules = require(localPath);
          } catch (localErr) {
            // Report actual syntax or loading errors, not just missing module
            this.addCheck(
              'Custom rules loadable',
              'fail',
              `Error loading rules: ${localErr.message}`,
              localErr.code === 'MODULE_NOT_FOUND'
                ? 'Run: npm run build'
                : 'Check syntax errors in rule files'
            );
            return false;
          }
        } else if (err.code === 'MODULE_NOT_FOUND') {
          this.addCheck(
            'Custom rules loadable',
            'fail',
            'Package not found in node_modules and built output not available',
            'Run: npm install markdownlint-trap (or npm run build if developing locally)'
          );
          return false;
        } else {
          // Re-throw non-MODULE_NOT_FOUND errors
          throw err;
        }
      }

      if (Array.isArray(rules) && rules.length > 0) {
        this.addCheck(
          'Custom rules loadable',
          'pass',
          `Loaded ${rules.length} rules: ${rules.map(r => r.names[0]).join(', ')}`
        );
        return true;
      } else {
        this.addCheck(
          'Custom rules loadable',
          'fail',
          'Rules export is not an array or empty',
          'Check package installation'
        );
        return false;
      }
    } catch (err) {
      this.addCheck(
        'Custom rules loadable',
        'fail',
        `Cannot load rules: ${err.message}`,
        'Ensure markdownlint-trap is properly installed'
      );
      return false;
    }
  }

  checkVSCodeSettings(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const customRules = content['markdownlint.customRules'];
      
      if (!customRules) {
        this.addCheck(
          'VS Code custom rules configured',
          'warn',
          'markdownlint.customRules not found',
          'Add "markdownlint.customRules": ["markdownlint-trap"]'
        );
        return;
      }

      if (Array.isArray(customRules) && customRules.includes('markdownlint-trap')) {
        this.addCheck('VS Code custom rules configured', 'pass', 'Package reference found');
      } else if (Array.isArray(customRules) && customRules.some(r => r.includes('.markdownlint-rules'))) {
        this.addCheck(
          'VS Code custom rules configured',
          'warn',
          'Using relative paths instead of package reference',
          'Consider using "markdownlint-trap" for better portability'
        );
      } else {
        this.addCheck(
          'VS Code custom rules configured',
          'warn',
          'Custom rules configured but markdownlint-trap not found',
          'Add "markdownlint-trap" to customRules array'
        );
      }
    } catch {
      // Already handled by checkJsonFile
    }
  }

  report() {
    log('\n╔═══════════════════════════════════════╗', 'cyan');
    log('║  markdownlint-trap diagnostics       ║', 'cyan');
    log('╚═══════════════════════════════════════╝\n', 'cyan');

    for (const check of this.checks) {
      const icon = check.status === 'pass' ? checkmark(true) : 
                   check.status === 'fail' ? checkmark(false) : 
                   `${colors.yellow}⚠${colors.reset}`;
      
      log(`${icon} ${check.name}`);
      
      if (check.message) {
        const color = check.status === 'pass' ? 'green' : 
                     check.status === 'fail' ? 'red' : 'yellow';
        log(`  ${check.message}`, color);
      }
      
      if (check.fix) {
        log(`  Fix: ${check.fix}`, 'blue');
      }
      
      console.log('');
    }

    log('─'.repeat(40), 'cyan');
    log(`Results: ${this.passed} passed, ${this.failed} failed, ${this.warnings} warnings\n`, 
        this.failed > 0 ? 'red' : this.warnings > 0 ? 'yellow' : 'green');

    if (this.failed === 0 && this.warnings === 0) {
      log('✨ All checks passed! Your setup looks good.\n', 'green');
    } else if (this.failed === 0) {
      log('⚠️  Some warnings found, but setup should work.\n', 'yellow');
    } else {
      log('❌ Some checks failed. Follow the suggestions above to fix issues.\n', 'red');
    }

    return this.failed === 0 ? 0 : 1;
  }
}

function runDiagnostics() {
  const doctor = new DoctorCheck();
  const projectRoot = process.cwd();

  log('\n🔍 Running diagnostics...\n', 'cyan');

  // Check dependencies
  log('Checking dependencies...', 'blue');
  doctor.checkDependency('Node.js', 'node --version', 'Install from https://nodejs.org');
  doctor.checkDependency('markdownlint-cli2', 'npx markdownlint-cli2 --version', 'npm install -D markdownlint-cli2');
  
  // Check configuration files
  log('\nChecking configuration files...', 'blue');
  const cliConfigPath = path.join(projectRoot, '.markdownlint-cli2.jsonc');
  const vscodeConfigPath = path.join(projectRoot, '.vscode', 'settings.json');
  
  if (doctor.checkFile('CLI config (.markdownlint-cli2.jsonc)', cliConfigPath, false)) {
    doctor.checkJsonFile('CLI config syntax', cliConfigPath);
  }
  
  if (doctor.checkFile('VS Code config (.vscode/settings.json)', vscodeConfigPath, false)) {
    doctor.checkJsonFile('VS Code config syntax', vscodeConfigPath);
    doctor.checkVSCodeSettings(vscodeConfigPath);
  }

  // Check rule loading
  log('\nChecking rules...', 'blue');
  doctor.checkRuleLoading();

  // Report results
  return doctor.report();
}

// Run diagnostics
const exitCode = runDiagnostics();
process.exit(exitCode);
