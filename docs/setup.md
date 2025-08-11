# Setup and usage

This guide shows how to add `markdownlint-trap` rules to another repository and run them with `markdownlint-cli2`.

## Apply in another repo (quick start)

In the target repo (the one you want to lint):

- Option 1: install from GitHub tag or commit

  ```bash
  npm install -D markdownlint-cli2 github:kynoptic/markdownlint-trap#v1.5.0
  # or pin a commit
  npm install -D markdownlint-cli2 github:kynoptic/markdownlint-trap#<commit-sha>
  ```

  Create `.markdownlint-cli2.jsonc`:

  ```jsonc
  {
    "config": { "extends": "markdownlint-trap/recommended-config.jsonc" },
    "globs": ["**/*.md", "!node_modules/**/*", "!dist/**/*"]
  }
  ```

  Run:

  ```bash
  npx markdownlint-cli2 "**/*.md"
  npx markdownlint-cli2 --fix "**/*.md"
  ```

- Option 2: add as a submodule

  ```bash
  git submodule add https://github.com/kynoptic/markdownlint-trap tools/markdownlint-trap
  ```

  Create `.markdownlint-cli2.jsonc`:

  ```jsonc
  {
    "customRules": ["./tools/markdownlint-trap/.markdownlint-rules"],
    "config": { "extends": "./tools/markdownlint-trap/recommended-config.jsonc" },
    "globs": ["**/*.md", "!node_modules/**/*", "!dist/**/*"]
  }
  ```

  Run:

  ```bash
  npx markdownlint-cli2 "**/*.md"
  npx markdownlint-cli2 --fix "**/*.md"
  ```

## Install

If this package is published to npm, you can install it directly. Otherwise, use the Quick start options above (GitHub dependency or submodule).

```bash
npm install --save-dev markdownlint-trap markdownlint-cli2
```

## Configure

Create `.markdownlint-cli2.jsonc` in the root of your repo. Choose one of the following patterns.

### Option 1: Recommended preset (extends)

The easiest way to start. It enables all rules with sensible defaults.

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  },
  "globs": [
    "**/*.md",
    "!node_modules/**/*",
    "!dist/**/*"
  ]
}
```

You can override any setting via `config`. For example, to disable one rule:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

### Option 2: Manual setup

Load the rules and enable them explicitly. Prefer the preset; this option relies on your environment being able to import the package entry (ESM).

```jsonc
{
  "customRules": ["markdownlint-trap"],
  "config": {
    "default": true,
    "sentence-case-heading": true,
    "backtick-code-elements": true,
    "no-bare-url": true,
    "no-dead-internal-links": true,
    "no-literal-ampersand": true
  },
  "globs": [
    "**/*.md",
    "!node_modules/**/*",
    "!dist/**/*"
  ]
}
```

## Run

```bash
# Lint all markdown files
npx markdownlint-cli2 "**/*.md"

# Auto-fix where supported
npx markdownlint-cli2 --fix "**/*.md"
```

## Keeping in sync across projects

Below are step‑by‑step instructions for using these rules in another repository without publishing to npm. Choose either GitHub dependency or Git submodule.

### Option A — GitHub dependency (recommended when you can tag releases)

Steps in this repo (rules source):

1. Ensure compiled rules are up to date

- Run: `npm run build`
- Commit any changes to `.markdownlint-rules/` and `recommended-config.jsonc`

Why this matters: the preset at `recommended-config.jsonc` loads compiled rule files from `.markdownlint-rules/**/*.cjs`. Git installs run the `prepare` script, and this repo builds on `prepare`, so compiled files will be generated on install. If your tooling disables `prepare`, be sure the compiled files exist in the tag.

2. Tag a release and push it

- Pick a version: `git tag v1.5.0`
- Push tags: `git push --tags`

Steps in the target repo (where you want rules to apply):

3. Install from GitHub by tag or commit

- By tag: `npm install -D github:kynoptic/markdownlint-trap#v1.5.0`
- Or by commit: `npm install -D github:kynoptic/markdownlint-trap#<commit-sha>`

4. Configure markdownlint-cli2

Create `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  },
  "globs": ["**/*.md", "!node_modules/**/*", "!dist/**/*"]
}
```

5. Run the linter

```bash
npx markdownlint-cli2 "**/*.md"
npx markdownlint-cli2 --fix "**/*.md"
```

6. Update to a newer tag later

```bash
npm install -D github:kynoptic/markdownlint-trap#v1.5.1
```

#### Notes

- Bots like Renovate/Dependabot can track new tags; see Automated updates below.
- If you skip tagging, pin a commit SHA and update manually when needed.

### Option B — Git submodule (no tags required, direct checkout)

Steps in this repo (rules source):

1. Ensure compiled rules are present

- Run: `npm run build`
- Commit `.markdownlint-rules/` and `recommended-config.jsonc`

Steps in the target repo (where you want rules to apply):

2. Add as a submodule

    ```bash
    git submodule add https://github.com/kynoptic/markdownlint-trap tools/markdownlint-trap
    git commit -m "Add markdownlint-trap submodule"
    ```

3. Configure markdownlint-cli2 to use the submodule paths

    Create `.markdownlint-cli2.jsonc`:

    ```jsonc
    {
      "customRules": ["./tools/markdownlint-trap/.markdownlint-rules"],
      "config": {
        "extends": "./tools/markdownlint-trap/recommended-config.jsonc"
      },
      "globs": ["**/*.md", "!node_modules/**/*", "!dist/**/*"]
    }
    ```

4. Run the linter

    ```bash
    npx markdownlint-cli2 "**/*.md"
    npx markdownlint-cli2 --fix "**/*.md"
    ```

5. Pull updates from the rules repo

    ```bash
    git submodule update --remote --merge tools/markdownlint-trap
    git commit -m "Update markdownlint-trap submodule"
    ```

#### Notes

- Bots like Renovate and Dependabot can track new tags; see Automated updates below.
- If you skip tagging, pin a commit SHA and update manually when needed.

#### Monorepo tip

- Put a single `.markdownlint-cli2.jsonc` at the repo root; packages can extend it or use it as-is.

- One-off copy (not auto-synced):
  - Copy the example from this repo’s README or download a snapshot of `recommended-config.jsonc`.
  - This drifts over time; prefer extending the package when possible.

### Option C — npm link (local development)

Use this when actively developing rules locally and testing them in another repo.

Steps in this repo (rules source):

1. Ensure compiled rules are present

    - Build once so packaged files exist (optional but recommended)

      ```bash
      npm run build
      ```

2. Create a global link

    ```bash
    npm link
    ```

Steps in the target repo (where you want rules to apply):

3. Link the package

    ```bash
    npm link markdownlint-trap
    ```

4. Configure markdownlint-cli2 (same as other options)

    ```jsonc
    {
      "config": { "extends": "markdownlint-trap/recommended-config.jsonc" },
      "globs": ["**/*.md", "!node_modules/**/*", "!dist/**/*"]
    }
    ```

5. Run the linter

    ```bash
    npx markdownlint-cli2 "**/*.md"
    npx markdownlint-cli2 --fix "**/*.md"
    ```

#### Notes

- As you edit rules in this repo, rerun `npm run build` if you rely on the compiled `.markdownlint-rules` files. When loading via `customRules: ["markdownlint-trap"]`, ESM `src/` is loaded directly, so rebuild may not be necessary.
- To unlink: in the target repo run `npm unlink markdownlint-trap --no-save`; in this repo run `npm unlink` to remove the global link if desired.

### Automated updates

Use a dependency bot to keep `markdownlint-trap` current across repositories.

Renovate (`renovate.json` or `.github/renovate.json`):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchPackageNames": ["markdownlint-trap"],
      "groupName": "markdownlint rules",
      "labels": ["dependencies", "lint"],
      "automerge": false,
      "schedule": ["before 6am on Monday"]
    },
    {
      "description": "Handle GitHub-sourced dependency (unpublished)",
      "matchSourceUrl": "https://github.com/kynoptic/markdownlint-trap",
      "groupName": "markdownlint rules (git)",
      "labels": ["dependencies", "lint"],
      "dependencyDashboardApproval": false
    }
  ]
}
```

Dependabot (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    allow:
      - dependency-name: "markdownlint-trap"
    # For GitHub-sourced dependency, dependabot updates when tags change
    # Ensure you create semver tags (e.g., v1.5.0) in this repo
    groups:
      markdownlint-rules:
        patterns:
          - markdownlint-trap
    labels:
      - dependencies
      - lint
```

Notes

- Enable automerge in Renovate when confident (`automerge: true`).
- Use semver tags (`vX.Y.Z`) on this repo so bots can detect updates for GitHub installs.
- For monorepos, apply rules at the root to group updates into one PR.
- Pair with CI that runs `markdownlint-cli2` to validate updates.

## CI usage

- Cache your package manager to speed up installs.
- Run `markdownlint-cli2` as a standalone step, or with `--fix` in pre-commit.
- Example GitHub Actions step:

```yaml
- name: Lint markdown
  run: npx markdownlint-cli2 "**/*.md"
```

## Tips

- Start with the preset, then override rules as needed.
- Scope `globs` to exclude generated artifacts (e.g., `!dist/**/*`).
- Use `--fix` locally; use non-fixing lint in CI for clarity.

## Troubleshooting

- Cannot find `.markdownlint-rules` when extending the preset
  - Ensure you installed from a tag/commit that includes compiled files, or that the `prepare` script ran during install (git installs run it by default here).
  - If lifecycle scripts are blocked, build in this repo and tag the compiled output.
- Rules seem ignored
  - Confirm `.markdownlint-cli2.jsonc` extends the preset path correctly or points to the submodule paths.
  - Run a single file for faster feedback: `npx markdownlint-cli2 README.md`.
