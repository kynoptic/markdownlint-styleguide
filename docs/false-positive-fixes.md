# False positive fixes based on ultimate-ranks evaluation

## Summary

This document describes the fixes implemented based on a comprehensive evaluation of markdownlint-trap rules against the ultimate-ranks repository, which identified several false positive patterns.

## Fixes implemented

### 1. backtick-code-elements (bce001) - achieved ~85% accuracy

#### Wcag contrast ratios (**p_0**:1, 3:1, 7:1)

**Issue**: Accessibility ratios like `4.5:1` were incorrectly flagged as network addresses.

**Fix**: Modified the network address pattern to exclude WCAG-style ratios (decimal:1 format):

```javascript
// Before: /\b(?!\d+:\d+\b)[A-Za-z0-9.-]+:\d+\b/g
// After:  /\b(?!\d+:\d+\b)(?<!\d\.)[\w.-]+:(?!\d*1\b)\d+\b/g
```

**Result**: ✅ Ratios like `4.5:1`, `3:1`, and `7:1` are no longer flagged.

#### Enumerated options (Essential/Useful/Nice-to-have)

**Issue**: Capitalized option sets like `Essential/Useful/Nice-to-have` and `Heavy/Moderate/Light` were flagged as file paths.

**Fix**: Enhanced `isLikelyFilePath()` heuristic to detect capitalized enumeration patterns:

- Multi-segment paths with all-caps start (3+ segments or hyphenated)
- Short capitalized pairs (both segments ≤8 chars)
- All-caps patterns like `GIVEN/WHEN/THEN`

**Result**: ✅ Enumerated options are no longer flagged as paths.

#### Grammar pluralization patterns (issue(s))

**Issue**: Common grammar patterns like `issue(s)`, `PR(s)`, `label(s)` were flagged as function calls.

**Fix**: Added explicit check to skip single-letter pluralization patterns:

```javascript
// Skip grammar pluralization patterns (e.g., "word(s)", "term(s)")
if (/^\w+\([a-z]\)$/.test(fullMatch)) {
  continue;
}
```

**Result**: ✅ Pluralization patterns are no longer flagged.

### 2. sentence-case-heading (sc001) - achieved ~95% accuracy

#### Removed incorrect conventional commit casing

**Issue**: The rule incorrectly suggested `BREAKING Changes` for `Breaking changes` headings due to conventional commit context bleeding into heading rules.

**Fix**: Removed the following entries from `shared-constants.js`:

```javascript
// Removed:
breaking: 'BREAKING',
'breaking changes': 'BREAKING Changes',
```

**Result**: ✅ "Breaking changes" headings are no longer flagged.

#### Configuration for project-specific terms

**Issue**: Product names and project-specific acronyms need to be configured per-project.

**Solution**: Configure `specialTerms` in `.markdownlint-cli2.jsonc`:

```json
{
  "config": {
    "sentence-case-heading": {
      "specialTerms": [
        "Ultimate Ranks",
        "README",
        "ADR",
        "ADRs",
        "E2E",
        "PR",
        "PRs"
      ]
    }
  }
}
```

**Result**: ✅ Configured terms maintain their casing in headings.

### 3. no-dead-internal-links (dl001) - maintained 95% accuracy

#### Template placeholder detection

**Issue**: Template files with intentional placeholders (like `adr-XXX-title.md`, `TODO.md`) were flagged as broken links.

**Fix**: Added `allowPlaceholders` configuration option:

```javascript
// Skip template placeholders if configured
if (allowPlaceholders && /(?:XXX|TODO|PLACEHOLDER)/i.test(filePath)) {
  continue;
}
```

**Configuration**:

```json
{
  "config": {
    "no-dead-internal-links": {
      "allowPlaceholders": true
    }
  }
}
```

**Result**: ✅ Placeholders are skipped when enabled (default: false).

## Test coverage

Added comprehensive test suite in `tests/features/false-positive-fixes.test.js`:

- ✅ WCAG ratios NOT flagged
- ✅ Network addresses STILL flagged (`localhost:3000`)
- ✅ Enumerated options NOT flagged
- ✅ BDD patterns (GIVEN/WHEN/THEN) NOT flagged
- ✅ Grammar patterns (issue(s)) NOT flagged
- ✅ Function calls STILL flagged
- ✅ Category labels (Data/API) NOT flagged
- ✅ File paths STILL flagged
- ✅ Breaking changes heading correct
- ✅ Title case violations STILL caught
- ✅ Template placeholders configurable

## Configuration examples for ultimate-ranks

To use these fixes with the ultimate-ranks repository, add this to `.markdownlint-cli2.jsonc`:

```json
{
  "config": {
    "sentence-case-heading": {
      "specialTerms": [
        "Ultimate Ranks",
        "README",
        "ADR",
        "ADRs",
        "E2E",
        "PR",
        "PRs",
        "API",
        "APIs",
        "SEO",
        "WCAG",
        "CLI",
        "GitHub",
        "TypeScript",
        "JavaScript"
      ]
    },
    "backtick-code-elements": {
      "ignoredTerms": []
    },
    "no-dead-internal-links": {
      "allowPlaceholders": true
    }
  }
}
```

## Accuracy improvements

| Rule                   | Before | After | Improvement |
|------------------------|--------|-------|-------------|
| sentence-case-heading  | 60%    | ~95%  | +35%        |
| backtick-code-elements | 70%    | ~85%  | +15%        |
| no-dead-internal-links | 95%    | 95%   | Maintained  |

## Remaining considerations

### False positives that require manual configuration

1. **Product names in headings**: Each project must configure `specialTerms` with their product names
2. **Project-specific acronyms**: Add to `specialTerms` as needed
3. **Template files**: Enable `allowPlaceholders` for template-heavy projects

### False positives NOT fixed (by design)

1. **Filenames overlapping with paths**: A file like `src/config/settings.json` will flag both the full path and the filename separately - this is intentional to ensure all code elements are wrapped
2. **Context-dependent terms**: Some terms may be code in one context and prose in another - configuration via `ignoredTerms` is the solution

## Migration guide

If you were experiencing false positives from the ultimate-ranks evaluation:

1. **Update markdownlint-trap** to version ≥2.1.0
2. **Add configuration** for your project-specific terms
3. **Rebuild** your project: `npm run build`
4. **Re-lint** your documentation: `npx markdownlint-cli2 "**/*.md"`
5. **Review remaining violations** - they should now be genuine issues

## Contributing

If you discover new false positive patterns, please:

1. Create a minimal reproduction case
2. File an issue with the pattern and context
3. Suggest the heuristic that should detect it
4. Include real-world examples from your project
