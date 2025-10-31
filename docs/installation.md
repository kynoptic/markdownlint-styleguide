# Installation guide

This guide covers different installation methods for markdownlint-trap depending on your use case.

## Quick start (recommended)

For local development across all your projects, use the automated distribution system:

```bash
# In the markdownlint-trap repository
npm run dist:local
```

This will:

1. **Install globally** - Makes markdownlint-trap available in ALL projects (including `non-Node.js`)
2. **Distribute configs** - Copies `.markdownlint-cli2.jsonc` and `.vscode/settings.json` to all projects
3. **Auto-detect package managers** - Works with npm, pnpm, yarn, and bun projects

## Installation methods

### Method 1: Global installation (works everywhere)

Best for: **All projects, including `non-Node.js` projects**

```bash
# Automated via distribution script
npm run dist:local

# Or manual installation
npm run install:global
```

**Benefits:**

- Works in any directory
- No `package.json` required
- VS Code extension works automatically
- Single source of truth for rules

**Usage:**

```bash
cd ~/any-project
markdownlint-cli2 "**/*.md"
```

### Method 2: Per-project linking (Node.js projects)

Best for: **Node.js projects where you want explicit dependency tracking**

```bash
# Link to all Node.js projects at once
npm run link:projects

# Or link manually to a specific project
cd ~/my-project
npm link markdownlint-trap
```

**Benefits:**

- Explicit in `package.json` dependencies
- Per-project version control
- Works with different package managers (npm, pnpm, yarn, bun)

**Usage:**

```bash
cd ~/my-project
npm install --save-dev markdownlint-cli2  # Install CLI locally
npx markdownlint-cli2 "**/*.md"
```

### Method 3: Published package (future)

Once published to npm:

```bash
npm install --save-dev markdownlint-trap markdownlint-cli2
```

## Distribution system

The distribution system provides a plug-and-play setup for all your projects.

### Configuration

Edit `.github/distribution.local.yml`:

```yaml
# Global installation (recommended)
globalInstall:
  enabled: true
  linkLocal: true  # Use npm link for local development

# VS Code settings distribution
targets:
  - name: vscode-recommended
    enabled: true
    src: templates/vscode-settings-recommended.jsonc
    dest:
      - ~/Projects/*/.vscode/settings.json

  - name: cli-recommended
    enabled: true
    src: templates/markdownlint-cli2-recommended.jsonc
    dest:
      - ~/Projects/*/.markdownlint-cli2.jsonc
```

### Available presets

- **Basic** - Minimal enforcement, good for getting started
- **Recommended** - Balanced defaults for most projects
- **Strict** - Maximum enforcement for high-quality documentation

### Commands

```bash
npm run dist:local:dry      # Preview changes
npm run dist:local          # Apply distribution

npm run link:projects:dry   # Preview project linking
npm run link:projects       # Link to all Node.js projects

npm run unlink:projects     # Unlink from all projects
```

## Package manager support

The distribution and linking scripts automatically detect your package manager:

| Lock file | Package manager | Command used |
|-----------|----------------|--------------|
| `pnpm-lock.yaml` | pnpm | `pnpm link <path>` |
| `yarn.lock` | yarn | `yarn link` |
| `bun.lockb` | bun | `bun link` |
| (default) | npm | `npm link` |

## VS Code integration

After distribution, VS Code will automatically:

- Load custom rules from `markdownlint-trap`
- Use the configured preset (`basic/recommended/strict`)
- Show inline diagnostics and suggestions
- Provide autofix capabilities

**Requirements:**

- [markdownlint VS Code extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- Global installation OR project-level installation of `markdownlint-trap`

## Verification

Check that everything is installed correctly:

```bash
# Check global installation
npm list -g markdownlint-trap
which markdownlint-cli2

# Check project linking
ls -la ~/my-project/node_modules/markdownlint-trap

# Test CLI
cd ~/any-project
markdownlint-cli2 --help
```

## Troubleshooting

### VS Code extension not loading rules

1. Ensure `markdownlint-trap` is installed (globally or locally)
2. Check `.vscode/settings.json` has `markdownlint.customRules: ["markdownlint-trap"]`
3. Reload VS Code window: `Cmd+Shift+P` → "Reload Window"

### CLI not finding rules

1. Verify global installation: `npm list -g markdownlint-trap`
2. Check `.markdownlint-cli2.jsonc` has correct `customRules` path
3. Reinstall: `npm run dist:local`

### Pnpm projects failing to link

Use the distribution script - it automatically handles `pnpm with` `pnpm link <path>`:

```bash
npm run link:projects
```

### Non-node.js projects not working

Use global installation (enabled by default):

```bash
npm run dist:local
```

This makes the rules available everywhere without requiring `package.json`.

## Updating

To update markdownlint-trap across all projects:

```bash
# Pull latest changes
git pull

# Rebuild and redistribute
npm run build
npm run dist:local
```

If globally installed, the changes take effect immediately in all projects.
