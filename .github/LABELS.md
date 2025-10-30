# Repository labels

This document describes the semantic label system used in markdownlint-trap. Labels help categorize issues and pull requests for efficient triage, prioritization, and tracking.

## Label categories

### Issue nature

Labels that describe the fundamental nature of the issue:

| Label | Color | Description | When to use |
|-------|-------|-------------|-------------|
| `bug` | 🔴 `FF3B30` | Something isn't working | Broken functionality, errors, unexpected behavior |
| `enhancement` | 🟢 `30D158` | New feature or request | New functionality, feature additions |
| `refactor` | 🟣 `AF52DE` | Code refactoring and restructuring | Code improvements without behavior changes |
| `question` | ⚪ `8E8E93` | Further information is requested | Clarifications, support requests |

### Project areas

Labels that indicate which part of the project is affected:

| Label | Color | Description | When to use |
|-------|-------|-------------|-------------|
| `rules` | 🔵 `0A84FF` | Custom markdownlint rule implementation | Work on individual rule logic |
| `autofix` | 🔵 `007AFF` | Autofix functionality and safety | Autofix system, safety heuristics |
| `build` | 🟣 `5856D6` | Build system and transpilation | Babel configuration, build scripts |
| `test` | 🟢 `34C759` | Test improvements and additions | Test suite, fixtures, coverage |
| `documentation` | ⚪ `8E8E93` | Improvements or additions to documentation | README, guides, API docs |
| `architecture` | 🟣 `5E5CE6` | Architectural decisions and patterns | System design, ADRs, module structure |

### Quality attributes

Labels for quality-related concerns:

| Label | Color | Description | When to use |
|-------|-------|-------------|-------------|
| `performance` | 🟠 `FF9500` | Performance improvements and optimization | Speed improvements, benchmarks |
| `security` | 🔴 `FF3B30` | Security improvements and vulnerability fixes | Security issues, CVE fixes |
| `internationalization` | 🔵 `0A84FF` | Internationalization and multilingual support | Unicode, emoji, non-Latin scripts |

### Infrastructure

Labels for tooling and infrastructure:

| Label | Color | Description | When to use |
|-------|-------|-------------|-------------|
| `ci` | 🔵 `00C7BE` | Continuous integration and automation | GitHub Actions, workflows |
| `dependencies` | 🔵 `007AFF` | Dependency updates and management | `npm` dependencies, upgrades |
| `automation` | 🔵 `00C7BE` | Automation tooling and workflows | Scripts, automation tools |
| `configuration` | 🟣 `5856D6` | Configuration and setup | Config files, presets |
| `observability` | 🔵 `00C7BE` | Telemetry, logging, and monitoring | Telemetry, confidence scores |

## Using labels

### Single vs multiple labels

Issues typically have **multiple labels** to fully describe them:

**Examples:**

- `bug` + `rules` + `security` = Critical security bug in rule implementation
- `enhancement` + `autofix` + `performance` = Performance improvement to autofix system
- `refactor` + `test` = Test suite refactoring
- `security` + `dependencies` = Dependency vulnerability

### Labeling workflow

1. **Issue nature** - Always apply one: `bug`, `enhancement`, `refactor`, or `question`
2. **Project area** - Apply 1-2 relevant area labels: `rules`, `autofix`, `test`, etc.
3. **`Quality/Infrastructure`** - Add if applicable: `performance`, `security`, `ci`, etc.

### Common combinations

| Combination | Meaning |
|-------------|---------|
| `bug` + `security` | Security vulnerability |
| `enhancement` + `rules` | New custom rule |
| `refactor` + `architecture` | Architectural refactoring |
| `test` + `performance` | Performance test suite |
| `documentation` + `architecture` | ADR or architecture docs |
| `ci` + `automation` | CI/CD improvements |

## Color philosophy

Labels follow a semantic color scheme for visual consistency:

- **Red (`FF3B30`)** - Critical issues (bug, security)
- **Orange (`FF9500`)** - High priority (performance)
- **Green (`34C759`, `30D158`)** - `Quality/positive` (test, enhancement)
- **Blue family (`007AFF`, `0A84FF`)** - Technical areas (dependencies, rules, autofix)
- **Cyan (`00C7BE`)** - Infrastructure (ci, automation, observability)
- **Purple (`AF52DE`, `5856D6`, `5E5CE6`)** - Refinement (refactor, build, architecture)
- **Gray (`8E8E93`)** - `Routine/meta` (documentation, question)

## Integration with project management

Labels complement GitHub Projects custom fields:

- **Status field** (`Backlog/Todo/Doing/Done`) tracks workflow state
- **Value field** (`Essential/Useful/Nice-to-have`) tracks business value
- **Effort field** (`Light/Moderate/Heavy`) tracks complexity
- **Labels** categorize the type and area of work

Use labels for **categorization** and project fields for **prioritization and planning**.

## Maintenance

### Regular review

- Review label system every 6-12 months
- Add new labels as project scope expands
- Consolidate redundant labels
- Update this document when changes are made

### Label hygiene

- Label new issues during triage
- Update labels as issues evolve
- Remove labels that no longer apply
- Keep label descriptions clear and actionable

## Migration history

### 2025-10-30: Initial semantic label system

**Reason:** Establish comprehensive semantic label system aligned with project structure and roadmap.

**Changes made:**

- Created semantic color scheme based on label categories
- Added missing labels: `rules`, `autofix`, `performance`, `internationalization`, `configuration`, `observability`
- Updated existing label colors to follow semantic philosophy
- Deleted `obsolete/unused` labels: `codex`, `duplicate`, `good first issue`, `help wanted`, `invalid`, `wontfix`
- Removed priority labels (`priority:now`, `priority:next`, `priority:later`) in favor of GitHub Projects `Status/Value/Effort` fields
- Documented complete label system with usage guidelines

**Issues affected:** 81 total issues, 18 newly created roadmap issues

**Next review:** 2026-04-30 (6 months)

---

*For questions about label usage, refer to this document or open a `question` issue.*
