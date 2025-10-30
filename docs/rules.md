# Rules

This page describes each custom rule's behavior, ID, and fixability. See `docs/configuration.md` for configuration options.

> [!NOTE]
> Since v1.7.0, rules share common heuristics for acronym detection, markup preservation, and code span recognition. This ensures consistent behavior across the entire rule suite and prevents edge-case handling from drifting over time.

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
- Skips code-heavy headings, version/date-only headings, and certain bracketed labels.
- Provides safe auto-fixes with guardrails.
- Since v1.7.0: improved internal architecture with modular components for better maintainability and performance.

Examples

- Good: `# Getting started with APIs`
- Bad: `# Getting Started With APIs`

---

## `backtick-code-elements` (BCE001)

Wraps code-like tokens in prose with backticks to improve readability.

- Detects commands, flags, file paths, filenames, function-like calls, env vars, and common tech references.
- Avoids code spans, links, HTML comments, LaTeX math, URLs, and configured `ignoredTerms`.
- Provides contextual error messages and safe auto-fixes.
- Since v1.7.0: uses shared heuristics for consistent acronym detection (e.g., PM2-style terms with numbers).

Examples

- Good: "Run `npm install` and edit `config.json`."
- Bad: "Run npm install and edit config.json."

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
- Uses per-run caches for file stats and heading extraction for performance.
- Not auto-fixable.

Examples

- Good: `[Config](docs/configuration.md)`
- Bad: `[Config](docs/missing.md)`

---

## `no-literal-ampersand` (NLA001)

Replaces standalone `&` with "and" in prose for clarity.

- Skips code blocks, inline code, links, and HTML entity contexts.
- Respects configurable `exceptions` and includes common defaults (`R&D`, `Q&A`, `M&A`, `S&P`, `AT&T`).
- Auto-fix replaces `&` with `and`.
