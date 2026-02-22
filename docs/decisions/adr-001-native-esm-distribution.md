# ADR 001: Native ESM distribution without Babel transpilation

## Status

Accepted

## Context

The project originally used Babel to transpile ES modules from `src/` to CommonJS in `.markdownlint-rules/`. This transpilation step was introduced when markdownlint's ecosystem had limited ESM support.

However, the build pipeline introduced several maintenance challenges:

- Extra build step complexity and potential for transpilation bugs
- Source and distribution code divergence, complicating debugging
- Build artifacts requiring regeneration and separate distribution
- Additional tooling overhead (Babel dependencies and configuration)
- Developer experience friction from mandatory build steps

Since Node.js 18+ and modern markdownlint versions (0.38.0+) now fully support native ESM, the transpilation layer became unnecessary technical debt.

## Decision

We will eliminate the Babel transpilation step and ship native ES modules directly from the `src/` directory.

**Changes implemented:**

1. Updated `package.json` to point `main` entry to `./src/index.js` (ESM source)
2. Added `exports` field for modern module resolution
3. Removed Babel dependencies (`@babel/cli`, `@babel/core`, `@babel/preset-env`, and plugins)
4. Removed `babel.config.json`
5. Removed build scripts (`prebuild`, `build`, `postinstall`)
6. Updated `files` array to include `src/` instead of `.markdownlint-rules/`
7. Updated `scripts/doctor.cjs` to load ESM rules via dynamic import
8. Updated documentation (`CLAUDE.md`, `README.md`) to reflect removal of build step

**Compatibility approach:**

- Package uses `"type": "module"` in `package.json`
- Modern consumers `import ESM` directly
- Legacy CommonJS consumers can use `require()` which Node.js wraps automatically
- Tests validate both ESM import and markdownlint-cli2 integration

## Alternatives considered

**Option A: Keep minimal transpilation with dual CJS/ESM**

- Rejected: Adds complexity without benefit since markdownlint-cli2 handles both formats

**Option B: Gradual migration with deprecation warnings**

- Rejected: Current markdownlint versions already support ESM; no migration period needed

**Option C: Use conditional exports for dual-mode**

- Rejected: Node.js automatic ESM wrapper for `require()` provides sufficient backward compatibility

## Consequences

**Positive:**

- Simplified development workflow (no build step)
- Reduced dependencies (removed 6 Babel packages)
- Faster contributor onboarding (less tooling to understand)
- Source and distributed code are identical (easier debugging)
- Smaller package size (no build artifacts)
- Aligned with modern Node.js and markdownlint ecosystem

**Negative:**

- Potential compatibility issues with very old Node.js versions (pre-18)
  - Mitigation: `package.json` already enforces `"engines": { "node": ">=18" }`
- Consumers on legacy systems may need to upgrade
  - Mitigation: Node.js 18 is already LTS; 14 and 16 are EOL

**Testing:**

- New integration test suite (`tests/integration/esm-compatibility.test.js`) validates:
  - Direct ESM imports work
  - markdownlint-cli2 can load rules
  - Programmatic API usage works
  - Backward compatibility maintained

**Migration notes for consumers:**

- No action required for most users (markdownlint-cli2 handles loading)
- Programmatic API users may need to use dynamic `import()` instead of `require()` for best experience
- Old installations referencing `.markdownlint-rules/` will automatically use `src/` via `package.json`

## References

- Issue #77: Babel transpilation step complicates build and maintenance
- Node.js ESM documentation: `https://nodejs.org/api/esm.html`
- markdownlint `v0.38.0` changelog (ESM support)
- markdownlint-cli2 `v0.18.1` (native ESM, fallback to require)
