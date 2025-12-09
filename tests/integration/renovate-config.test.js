/**
 * Integration tests for Renovate configuration
 * 
 * Validates the automated dependency update configuration including:
 * - JSON schema validity
 * - Package grouping rules
 * - Auto-merge policies
 * - Security update prioritization
 * - Lockfile maintenance settings
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

describe('Renovate configuration', () => {
  let config;

  beforeAll(() => {
    const configPath = join(projectRoot, '.github', 'renovate.json');
    const configContent = readFileSync(configPath, 'utf8');
    config = JSON.parse(configContent);
  });

  describe('configuration structure', () => {
    test('should_have_valid_json_schema_reference', () => {
      expect(config.$schema).toBe('https://docs.renovatebot.com/renovate-schema.json');
    });

    test('should_have_description', () => {
      expect(config.description).toBeDefined();
      expect(config.description).toContain('markdownlint-trap');
    });

    test('should_extend_recommended_presets', () => {
      expect(config.extends).toContain('config:recommended');
    });

    test('should_enable_semantic_commits', () => {
      expect(config.extends).toContain(':semanticCommits');
      expect(config.semanticCommits).toBe('enabled');
    });

    test('should_maintain_lockfiles_weekly', () => {
      expect(config.extends).toContain(':maintainLockFilesWeekly');
    });

    test('should_separate_major_releases', () => {
      expect(config.extends).toContain(':separateMajorReleases');
    });
  });

  describe('scheduling', () => {
    test('should_have_weekly_schedule', () => {
      expect(config.schedule).toEqual(['before 6am on Monday']);
    });

    test('should_have_timezone_configured', () => {
      expect(config.timezone).toBe('America/New_York');
    });

    test('should_create_prs_immediately', () => {
      expect(config.prCreation).toBe('immediate');
    });

    test('should_have_pr_concurrent_limit', () => {
      expect(config.prConcurrentLimit).toBe(5);
    });

    test('should_have_no_hourly_limit', () => {
      expect(config.prHourlyLimit).toBe(0);
    });
  });

  describe('package grouping', () => {
    test('should_group_eslint_packages', () => {
      const eslintRule = config.packageRules.find(
        rule => rule.groupName === 'ESLint and plugins'
      );
      expect(eslintRule).toBeDefined();
      expect(eslintRule.matchPackageNames).toContain('eslint');
      expect(eslintRule.matchPackagePatterns).toContain('^eslint-');
    });

    test('should_group_jest_packages', () => {
      const jestRule = config.packageRules.find(
        rule => rule.groupName === 'Jest and ecosystem'
      );
      expect(jestRule).toBeDefined();
      expect(jestRule.matchPackageNames).toContain('jest');
      expect(jestRule.matchPackagePatterns).toContain('^@jest/');
    });

    test('should_group_markdownlint_packages', () => {
      const markdownlintRule = config.packageRules.find(
        rule => rule.groupName === 'markdownlint ecosystem'
      );
      expect(markdownlintRule).toBeDefined();
      expect(markdownlintRule.matchPackagePatterns).toContain('^markdownlint');
    });

    test('should_group_commit_hook_packages', () => {
      const hooksRule = config.packageRules.find(
        rule => rule.groupName === 'Commit hooks'
      );
      expect(hooksRule).toBeDefined();
      expect(hooksRule.matchPackageNames).toContain('husky');
      expect(hooksRule.matchPackageNames).toContain('lint-staged');
    });
  });

  describe('auto-merge policy', () => {
    test('should_automerge_dev_dependency_patches', () => {
      const patchRule = config.packageRules.find(
        rule =>
          rule.matchDepTypes?.includes('devDependencies') &&
          rule.matchUpdateTypes?.includes('patch')
      );
      expect(patchRule).toBeDefined();
      expect(patchRule.automerge).toBe(true);
      expect(patchRule.automergeType).toBe('pr');
      expect(patchRule.automergeStrategy).toBe('squash');
      expect(patchRule.platformAutomerge).toBe(true);
    });

    test('should_automerge_dev_dependency_minors', () => {
      const minorRule = config.packageRules.find(
        rule =>
          rule.matchDepTypes?.includes('devDependencies') &&
          rule.matchUpdateTypes?.includes('minor')
      );
      expect(minorRule).toBeDefined();
      expect(minorRule.automerge).toBe(true);
    });

    test('should_not_automerge_production_dependencies', () => {
      const prodRule = config.packageRules.find(
        rule =>
          rule.matchDepTypes?.includes('dependencies') &&
          rule.description?.includes('production')
      );
      expect(prodRule).toBeDefined();
      expect(prodRule.automerge).toBe(false);
      expect(prodRule.labels).toContain('production');
    });

    test('should_not_automerge_major_versions', () => {
      const majorRule = config.packageRules.find(
        rule => rule.matchUpdateTypes?.includes('major')
      );
      expect(majorRule).toBeDefined();
      expect(majorRule.automerge).toBe(false);
      expect(majorRule.labels).toContain('major-version');
    });
  });

  describe('security updates', () => {
    test('should_enable_vulnerability_alerts', () => {
      expect(config.vulnerabilityAlerts).toBeDefined();
      expect(config.vulnerabilityAlerts.enabled).toBe(true);
    });

    test('should_create_security_prs_immediately', () => {
      expect(config.vulnerabilityAlerts.schedule).toEqual(['at any time']);
      expect(config.vulnerabilityAlerts.prCreation).toBe('immediate');
    });

    test('should_label_security_updates', () => {
      expect(config.vulnerabilityAlerts.labels).toContain('security');
      expect(config.vulnerabilityAlerts.labels).toContain('dependencies');
    });

    test('should_not_automerge_security_updates', () => {
      // Security updates require manual review even for dev dependencies
      expect(config.vulnerabilityAlerts.automerge).toBe(false);
    });

    test('should_use_update_lockfile_strategy', () => {
      expect(config.vulnerabilityAlerts.rangeStrategy).toBe('update-lockfile');
    });
  });

  describe('lockfile maintenance', () => {
    test('should_enable_lockfile_maintenance', () => {
      expect(config.lockFileMaintenance).toBeDefined();
      expect(config.lockFileMaintenance.enabled).toBe(true);
    });

    test('should_run_weekly', () => {
      expect(config.lockFileMaintenance.schedule).toEqual([
        'before 6am on Monday',
      ]);
    });

    test('should_automerge_lockfile_updates', () => {
      expect(config.lockFileMaintenance.automerge).toBe(true);
      expect(config.lockFileMaintenance.automergeType).toBe('pr');
      expect(config.lockFileMaintenance.platformAutomerge).toBe(true);
    });
  });

  describe('dependency dashboard', () => {
    test('should_enable_dependency_dashboard', () => {
      expect(config.dependencyDashboard).toBe(true);
    });

    test('should_have_custom_title', () => {
      expect(config.dependencyDashboardTitle).toBe(
        'Dependency updates dashboard'
      );
    });

    test('should_have_header_and_footer', () => {
      expect(config.dependencyDashboardHeader).toBeDefined();
      expect(config.dependencyDashboardHeader).toContain('.github/renovate.json');
      expect(config.dependencyDashboardFooter).toBeDefined();
    });
  });

  describe('npm configuration', () => {
    test('should_enable_npm_manager', () => {
      expect(config.enabledManagers).toContain('npm');
    });

    test('should_use_bump_range_strategy', () => {
      expect(config.rangeStrategy).toBe('bump');
      expect(config.npm.rangeStrategy).toBe('bump');
    });

    test('should_dedupe_after_updates', () => {
      expect(config.postUpdateOptions).toContain('npmDedupe');
    });
  });

  describe('pr formatting', () => {
    test('should_have_custom_pr_body_template', () => {
      expect(config.prBodyTemplate).toBeDefined();
      expect(config.prBodyTemplate).toContain('{{{header}}}');
      expect(config.prBodyTemplate).toContain('{{{changelogs}}}');
    });

    test('should_define_pr_body_columns', () => {
      expect(config.prBodyColumns).toContain('Package');
      expect(config.prBodyColumns).toContain('Update');
      expect(config.prBodyColumns).toContain('Change');
    });

    test('should_have_pr_body_notes', () => {
      expect(config.prBodyNotes).toBeDefined();
      expect(config.prBodyNotes.length).toBeGreaterThan(0);
      expect(config.prBodyNotes.some(note => note.includes('Renovate'))).toBe(
        true
      );
    });
  });

  describe('labels and assignees', () => {
    test('should_apply_dependencies_label', () => {
      expect(config.labels).toContain('dependencies');
    });

    test('should_have_empty_assignees_by_default', () => {
      expect(config.assignees).toEqual([]);
    });

    test('should_have_empty_reviewers_by_default', () => {
      expect(config.reviewers).toEqual([]);
    });
  });

  describe('ignore configuration', () => {
    test('should_ignore_test_directories', () => {
      expect(config.ignorePaths).toContain('**/test/**');
      expect(config.ignorePaths).toContain('**/tests/**');
      expect(config.ignorePaths).toContain('**/node_modules/**');
    });

    test('should_have_empty_ignore_deps_by_default', () => {
      expect(config.ignoreDeps).toEqual([]);
    });
  });

  describe('acceptance criteria validation', () => {
    test('GIVEN_patch_version_available_WHEN_automation_runs_THEN_pr_created_with_lockfile', () => {
      // Validates AC 1: PR creation with lockfile updates
      expect(config.prCreation).toBe('immediate');
      expect(config.lockFileMaintenance.enabled).toBe(true);
      expect(config.rangeStrategy).toBe('bump');
    });

    test('GIVEN_security_advisory_WHEN_detected_THEN_high_priority_pr_created', () => {
      // Validates AC 2: Security PRs created immediately
      expect(config.vulnerabilityAlerts.enabled).toBe(true);
      expect(config.vulnerabilityAlerts.schedule).toEqual(['at any time']);
      expect(config.vulnerabilityAlerts.prCreation).toBe('immediate');
      expect(config.vulnerabilityAlerts.labels).toContain('security');
    });

    test('GIVEN_update_pr_passes_ci_WHEN_dev_dependency_patch_THEN_automerges', () => {
      // Validates AC 3: Auto-merge dev dependency patches
      const patchRule = config.packageRules.find(
        rule =>
          rule.matchDepTypes?.includes('devDependencies') &&
          rule.matchUpdateTypes?.includes('patch')
      );
      expect(patchRule.automerge).toBe(true);
      expect(patchRule.platformAutomerge).toBe(true);
    });

    test('GIVEN_major_version_bump_WHEN_pr_created_THEN_requires_manual_review', () => {
      // Validates AC 4: Manual review for major versions
      const majorRule = config.packageRules.find(
        rule => rule.matchUpdateTypes?.includes('major')
      );
      expect(majorRule.automerge).toBe(false);
      expect(majorRule.labels).toContain('major-version');
    });

    test('GIVEN_related_packages_update_WHEN_creating_prs_THEN_grouped_together', () => {
      // Validates AC 5: Package grouping
      const groupedRules = config.packageRules.filter(rule => rule.groupName);
      expect(groupedRules.length).toBeGreaterThan(0);

      const groupNames = groupedRules.map(rule => rule.groupName);
      expect(groupNames).toContain('ESLint and plugins');
      expect(groupNames).toContain('Jest and ecosystem');
      expect(groupNames).toContain('markdownlint ecosystem');
    });

    test('GIVEN_renovate_configuration_THEN_documentation_exists', () => {
      // Validates AC 6: Documentation presence (checked via file existence in separate test)
      const docsPath = join(projectRoot, 'docs', 'dependency-management.md');
      const adrPath = join(
        projectRoot,
        'docs',
        'decisions',
        'adr-002-automated-dependency-updates.md'
      );

      expect(existsSync(docsPath)).toBe(true);
      expect(existsSync(adrPath)).toBe(true);
    });
  });
});
