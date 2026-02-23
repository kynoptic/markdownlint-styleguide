# Rule catalogue

Each custom rule's behavior, ID, and fixability. See `docs/configuration.md` for configuration options.

> [!NOTE]
> Since `v1.7.0`, rules share common heuristics for acronym detection, markup preservation, and code span recognition. Shared heuristics keep behavior consistent across rules and prevent edge-case handling from drifting.

## Summary

| Rule | ID | Fixable | Purpose |
|------|----|---------|---------|
| `sentence-case-heading` | SC001 | Yes | Enforce sentence case for headings and bold list prefixes |
| `backtick-code-elements` | BCE001 | Yes | Wrap code-like elements in backticks in prose |
| `no-bare-url` | BU001 | Yes | Replace bare URLs with autolinks `<...>` |
| `no-dead-internal-links` | DL001 | No | Validate internal file links and heading anchors |
| `no-literal-ampersand` | NLA001 | Yes | Replace standalone `&` with "and" in prose |
| `no-empty-list-items` | ELI001 | Yes | Remove empty list items (Word conversion artifacts) |

---

## `sentence-case-heading` (SC001)

Enforces sentence case for headings (ATX: `#`) and bold text in list items: capitalize the first word, lowercase the rest, except proper nouns, acronyms, and "I".

- Respects configured `specialTerms` and common technical terms (e.g., API, JSON, GitHub).
- Recognizes standard all-caps terminology:
  - SemVer terms: PATCH, MINOR, MAJOR, BREAKING
  - GitHub Markdown Alerts: NOTE, TIP, IMPORTANT, WARNING, CAUTION
- Recognizes multi-word product names:
  - GitHub Products: GitHub Actions, GitHub Projects, GitHub Markdown Alerts
- Recognizes documentation acronyms:
  - ADR, ADRs (Architecture Decision Records)
- Handles emoji-prefixed headings and extended Unicode scripts (accented Latin, CJK, RTL) for internationalized documentation.
- With `ignoreAfterEmoji`, excludes status markers and metadata after emoji from validation.
- Skips code-heavy headings, `version/date-only` headings, and certain bracketed labels.
- Auto-fixes safely with guardrails.
- Since `v1.7.0`: modular internal architecture improves maintainability and performance.

Configuration options

```jsonc
{
  "sentence-case-heading": {
    "specialTerms": ["JavaScript", "TypeScript", "API"],  // Custom terms with specific capitalization
    "ignoreAfterEmoji": true  // Ignore text after first emoji (default: false)
  }
}
```

Product-specific proper nouns

Words like "Skill", "Feature", or "Workspace" that your project uses as capitalized product terms should be added to `specialTerms`. The rule cannot distinguish between the common noun "skill" and a product concept "Skill" without project-specific context. Add them to your config:

```jsonc
{
  "sentence-case-heading": {
    "specialTerms": ["Skill", "Workspace", "Pipeline"]
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

When `ignoreAfterEmoji` is enabled, the rule skips text after the first emoji. Use this for roadmaps and status tracking documents where emoji separate heading content from metadata.

- Good with `ignoreAfterEmoji: true`: `## Task complete ✅ DONE`
- Good with `ignoreAfterEmoji: true`: `## NOW (Current Sprint) ✅ COMPLETED`
- Good with `ignoreAfterEmoji: true`: `## Infrastructure essentials ✅ HIGH PRIORITY`
- Still validated: `## WRONG Case ✅ IGNORED` (flags "WRONG Case" before emoji)

Style note: formatting terminology

Formatting style names (bold, italic, underline) are common nouns and follow sentence case:

- Good: `## Using bold text`
- Good: `## Applying italic formatting`
- Bad: `## Using Bold text`
- Bad: `## Applying Italic formatting`

To emphasize these terms, use alternative phrasing:

- `## Bold text formatting`
- `## The Bold style`
- `## Working with the Italic font style`

Word order and structure convey emphasis while maintaining sentence case.

---

## `backtick-code-elements` (BCE001)

Wraps code-like tokens in prose with backticks for readability.

- Detects commands, flags, file paths, filenames, function-like calls, env vars, and common tech references.
- Skips code spans, links, HTML comments, LaTeX math, angle bracket autolinks, and configured `ignoredTerms`.
- Reports contextual error messages and auto-fixes safely.
- Since `v1.7.0`: shared heuristics for consistent acronym detection (e.g., PM2-style terms with numbers).
- Since `v1.7.1`: improved path detection reduces false positives on
  non-path text containing slashes (e.g., "Integration/E2E", "Value/Effort",
  "pass/fail").
- Since `v2.3.0`: distinguishes domain names in prose from full URLs with protocols (issue #106).

Examples

- Good: "Run `npm install` and edit `config.json`."
- Bad: `"Run npm install and edit config.json."`

Path detection heuristics

The rule distinguishes actual file paths from conceptual pairs and
category labels:

- ✅ Detected as paths: `src/components/Button.tsx`, `docs/api/endpoints.md`, `/etc/hosts`
- ❌ Not treated as paths: "Integration/E2E testing", "Value/Effort fields",
  "pass/fail criteria"

Domain names vs. full URLs

The rule treats domain names and full URLs differently:

- ✅ **Full URLs with protocol** require backticks: `http://example.com`, `https://github.com/user/repo`
- ❌ **Domain names in prose** do NOT require backticks: "Visit GitHub.com", "Send email via Gmail.com"
- ✅ **URLs in angle brackets** are autolinks (already marked up): `<https://example.com>` - not flagged

Product and service names like "Outlook.com" or "Microsoft365.com" in prose pass unflagged,
while bare URLs with protocols must be wrapped for consistency and clickability.

---

## `no-bare-url` (BU001)

Flags bare URLs linkified by markdown-it and suggests wrapping them in angle brackets.

- Example: `https://example.com` → `<https://example.com>`
- Respects optional `allowedDomains`.
- Auto-fix wraps the URL in `<...>`.

---

## `no-dead-internal-links` (DL001)

Detects broken internal links (relative paths and anchors).

- Validates that the target file exists; for extensionless links, tries common Markdown extensions.
- Optionally validates `#anchors` against extracted headings (GitHub-style slugs).
- Detects placeholder patterns to avoid false positives in documentation templates.
- Caches file stats and heading extraction per run for performance.
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

When `allowPlaceholders` is enabled, the rule recognizes common placeholder patterns in documentation templates and example files to prevent false positives.

**Matching strategy:**

1. **Exact match** (case-insensitive): `URL` matches `url`, `URL`, `Url`
2. **Path prefix match**: `path/to/` matches `path/to/file.md`, `path/to/image.png`
3. **Word-boundary substring match**: Pattern must appear as a complete word segment, separated by hyphens, underscores, dots, or slashes

**Examples of word-boundary matching:**

- ✅ `TODO` matches: `TODO.md`, `project-TODO.md`, `my_TODO.txt`
- ❌ `TODO` does NOT match: `PHOTODOC.md` (embedded within word)
- ✅ `link` matches: `link`, `my-link.md`, `docs/link/file.md`
- ❌ `link` does NOT match: `unlinked.md`, `linking.md` (embedded within word)

Word-boundary matching prevents false negatives where legitimate broken links would be skipped because they contain placeholder keywords (e.g., `unlinked-page.md` containing "link").

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

Replaces standalone `&` with "and" in prose.

- Skips code blocks, inline code, links, and HTML entity contexts.
- Respects configurable `exceptions` and includes common defaults (`R&D`, `Q&A`, `M&A`, `S&P`, `AT&T`).
- Auto-fix replaces `&` with `and`.

---

## `no-empty-list-items` (ELI001)

Detects list items with no content after the marker. Common in Word-to-Markdown conversions.

- Checks both ordered and unordered lists via micromark tokens.
- Auto-fix deletes the empty line.
- No configuration options.

Examples

- Good: `- Item with content`
- Bad: `-` (marker followed by whitespace only)

---

## See also

- `docs/extending.md` -- creating custom rules, helpers contract, plugins, and contributing
- `docs/configuration.md` -- preset tiers and configuration options
