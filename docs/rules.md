# Rules

This page describes each custom rule's behavior, ID, and fixability. See `docs/configuration.md` for configuration options.

> [!NOTE]
> Since `v1.7.0`, rules share common heuristics for acronym detection, markup preservation, and code span recognition. This ensures consistent behavior across the entire rule suite and prevents edge-case handling from drifting over time.

## Summary

| Rule | ID | Fixable | Purpose |
|------|----|---------|---------|
| `sentence-case-heading` | SC001 | Yes | Enforce sentence case for headings and bold list prefixes |
| `backtick-code-elements` | BCE001 | Yes | Wrap code-like elements in backticks in prose |
| `no-bare-url` | BU001 | Yes | Replace bare URLs with autolinks `<...>` |
| `no-dead-internal-links` | DL001 | No | Validate internal file links and heading anchors |
| `no-literal-ampersand` | NLA001 | Yes | Replace standalone `&` with "and" in prose |

---

## `sentence-case-heading` (SC001)

Ensures headings (ATX: `#`) and bold text in list items follow sentence case: first word capitalized, the rest lowercase, with exceptions for proper nouns, acronyms, and the pronoun "I".

- Respects configured `specialTerms` and common technical terms (e.g., API, JSON, GitHub).
- Includes built-in support for standard all-caps terminology:
  - SemVer terms: PATCH, MINOR, MAJOR, BREAKING
  - GitHub Markdown Alerts: NOTE, TIP, IMPORTANT, WARNING, CAUTION
- Includes built-in support for multi-word product names:
  - GitHub Products: GitHub Actions, GitHub Projects, GitHub Markdown Alerts
- Includes built-in support for documentation acronyms:
  - ADR, ADRs (Architecture Decision Records)
- Recognizes emoji-prefixed headings and extended Unicode scripts (accented Latin, CJK, RTL) so internationalized documentation stays compliant.
- Supports `ignoreAfterEmoji` option to exclude status markers and metadata after emoji from validation.
- Skips code-heavy headings, `version/date-only` headings, and certain bracketed labels.
- Provides safe auto-fixes with guardrails.
- Since `v1.7.0`: improved internal architecture with modular components for better maintainability and performance.

Configuration options

```jsonc
{
  "sentence-case-heading": {
    "specialTerms": ["JavaScript", "TypeScript", "API"],  // Custom terms with specific capitalization
    "ignoreAfterEmoji": true  // Ignore text after first emoji (default: false)
  }
}
```

Examples

- Good: `# Getting started with APIs`
- Good: `# Understanding PATCH releases`
- Good: `# GitHub Projects and custom fields`
- Good: `**IMPORTANT** security update required`
- Bad: `# Getting Started With APIs`

Status markers with `ignoreAfterEmoji`

When `ignoreAfterEmoji` is enabled, text after the first emoji is excluded from validation. This is useful for roadmaps and status tracking documents where emoji serve as visual separators between heading content and metadata.

- Good with `ignoreAfterEmoji: true`: `## Task complete ✅ DONE`
- Good with `ignoreAfterEmoji: true`: `## NOW (Current Sprint) ✅ COMPLETED`
- Good with `ignoreAfterEmoji: true`: `## Infrastructure essentials ✅ HIGH PRIORITY`
- Still validated: `## WRONG Case ✅ IGNORED` (flags "WRONG Case" before emoji)

Style note: formatting terminology

When headings discuss formatting styles (bold, italic, underline), these words are treated as common nouns and should follow sentence case rules:

- Good: `## Using bold text`
- Good: `## Applying italic formatting`
- Bad: `## Using Bold text`
- Bad: `## Applying Italic formatting`

If you need to emphasize these terms, consider alternative phrasing:

- `## Bold text formatting`
- `## The Bold style`
- `## Working with the Italic font style`

This maintains consistency with sentence case principles while allowing natural expression of emphasis through word order and structure.

---

## `backtick-code-elements` (BCE001)

Wraps code-like tokens in prose with backticks to improve readability.

- Detects commands, flags, file paths, filenames, function-like calls, env vars, and common tech references.
- Avoids code spans, links, HTML comments, LaTeX math, angle bracket autolinks, and configured `ignoredTerms`.
- Provides contextual error messages and safe auto-fixes.
- Since `v1.7.0`: uses shared heuristics for consistent acronym detection (e.g., PM2-style terms with numbers).
- Since `v1.7.1`: improved path detection to reduce false positives on
  non-path text containing slashes (e.g., "Integration/E2E", "Value/Effort",
  "pass/fail").
- Since `v2.3.0`: distinguishes between domain names in prose and full URLs with protocols (issue #106).

Examples

- Good: "Run `npm install` and edit `config.json`."
- Bad: `"Run npm install and edit config.json."`

Path detection heuristics

The rule distinguishes between actual file paths and conceptual pairs or
category labels:

- ✅ Detected as paths: `src/components/Button.tsx`, `docs/api/endpoints.md`, `/etc/hosts`
- ❌ Not treated as paths: "Integration/E2E testing", "Value/Effort fields",
  "pass/fail criteria"

Domain names vs. full URLs

The rule treats domain names and full URLs differently based on context:

- ✅ **Full URLs with protocol** require backticks: `http://example.com`, `https://github.com/user/repo`
- ❌ **Domain names in prose** do NOT require backticks: "Visit GitHub.com", "Send email via Gmail.com"
- ✅ **URLs in angle brackets** are autolinks (already marked up): `<https://example.com>` - not flagged

This behavior ensures that product/service names like "Outlook.com" or "Microsoft365.com" used
in prose are not incorrectly flagged, while bare URLs with protocols are properly wrapped for
consistency and clickability.

---

## `no-bare-url` (BU001)

Flags markdown-it linkified bare URLs and suggests wrapping them in angle brackets.

- Example: `https://example.com` → `<https://example.com>`
- Respects optional `allowedDomains`.
- Auto-fix inserts `<...>` around the original text.

---

## `no-dead-internal-links` (DL001)

Detects broken internal links (relative paths and anchors).

- Validates that the target file exists; for extensionless links, tries common markdown extensions.
- Optionally validates `#anchors` against extracted headings (GitHub-style slugs).
- Supports placeholder pattern detection to avoid false positives in documentation templates.
- Uses per-run caches for file stats and heading extraction for performance.
- Not auto-fixable.

Configuration options

```jsonc
{
  "no-dead-internal-links": {
    "checkAnchors": true,              // Validate heading anchors (default: true)
    "allowedExtensions": [".md", ".markdown"],  // Extensions to try for extensionless links
    "ignoredPaths": ["node_modules"],  // Paths to skip validation
    "allowPlaceholders": false,        // Allow placeholder patterns (default: false)
    "placeholderPatterns": [           // Patterns to recognize as placeholders
      "URL",
      "link",
      "PLACEHOLDER",
      "TODO",
      "XXX",
      "path/to/",
      "example.com"
    ]
  }
}
```

Placeholder detection

When `allowPlaceholders` is enabled, the rule recognizes common placeholder patterns in documentation templates and example files, preventing false positives.

**Matching strategy:**

1. **Exact match** (case-insensitive): `URL` matches `url`, `URL`, `Url`
2. **Path prefix match**: `path/to/` matches `path/to/file.md`, `path/to/image.png`
3. **Word-boundary substring match**: Pattern must appear as a complete word segment separated by hyphens, underscores, dots, or slashes

**Examples of word-boundary matching:**

- ✅ `TODO` matches: `TODO.md`, `project-TODO.md`, `my_TODO.txt`
- ❌ `TODO` does NOT match: `PHOTODOC.md` (embedded within word)
- ✅ `link` matches: `link`, `my-link.md`, `docs/link/file.md`
- ❌ `link` does NOT match: `unlinked.md`, `linking.md` (embedded within word)

This word-boundary approach prevents false negatives where legitimate broken links are skipped because they contain placeholder keywords (e.g., `unlinked-page.md` containing "link").

**Use cases:**

- Documentation templates with intentional placeholders
- Example code and snippets showing link syntax
- ADR templates using `XXX` numbering patterns
- Newsletter and email templates using generic link text

Examples

- Good: link to a file that exists
- Good (with placeholders): link to `URL` when `allowPlaceholders: true`
- Bad: link to a file that does not exist
- Bad (without placeholders): link to `URL` when `allowPlaceholders: false`

---

## `no-literal-ampersand` (NLA001)

Replaces standalone `&` with "and" in prose for clarity.

- Skips code blocks, inline code, links, and HTML entity contexts.
- Respects configurable `exceptions` and includes common defaults (`R&D`, `Q&A`, `M&A`, `S&P`, `AT&T`).
- Auto-fix replaces `&` with `and`.

---

## See also

- `docs/extending.md` -- how to create custom rules, package plugins, and contribute
- `docs/rule-authoring.md` -- helpers contract API reference
- `docs/configuration.md` -- preset tiers and configuration options
