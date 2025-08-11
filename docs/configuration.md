# Configuration reference

This page lists configuration options for each rule. Use these in your `.markdownlint-cli2.jsonc` under the top-level `config` key.

Global examples:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

```jsonc
{
  "customRules": ["markdownlint-trap"],
  "config": {
    "default": true,
    "sentence-case-heading": {
      "specialTerms": ["API", "GitHub", "OAuth"]
    },
    "backtick-code-elements": {
      "ignoredTerms": ["README", "LICENSE"],
      "skipCodeBlocks": true,
      "skipMathBlocks": true
    },
    "no-bare-url": {
      "allowedDomains": ["localhost"]
    },
    "no-dead-internal-links": {
      "ignoredPaths": ["node_modules/**"],
      "checkAnchors": true,
      "allowedExtensions": [".md", ".markdown"]
    },
    "no-literal-ampersand": {
      "exceptions": ["R&D", "Q&A"],
      "skipCodeBlocks": true,
      "skipInlineCode": true
    }
  }
}
```

---

## `sentence-case-heading` (SC001)

- specialTerms: string[] — Proper nouns and technical terms to preserve as-is.
- Deprecated: technicalTerms, properNouns — Use `specialTerms` instead.

Defaults: none (uses built-in dictionary for common terms). Fixable: Yes.

---

## `backtick-code-elements` (BCE001)

- ignoredTerms: string[] — Additional terms to ignore (in addition to built-in ignores).
- skipCodeBlocks: boolean (default: true) — Skip fenced/indented code blocks.
- skipMathBlocks: boolean (default: true) — Skip LaTeX `$$` math blocks.

Fixable: Yes.

---

## `no-bare-url` (BU001)

- allowedDomains: string[] — Domains allowed as bare URLs (skip reporting).
- skipCodeBlocks: boolean (default: true) — Validated; currently no special handling needed.

Fixable: Yes (wrap in `<...>`). Requires markdown-it with `linkify: true`.

---

## `no-dead-internal-links` (DL001)

- ignoredPaths: string[] — Paths to ignore when checking targets.
- checkAnchors: boolean (default: true) — Validate `#anchors` against headings.
- allowedExtensions: string[] (default: [".md", ".markdown"]) — Extensions to try for extensionless links.

Fixable: No.

---

## `no-literal-ampersand` (NLA001)

- exceptions: string[] — Phrases where `&` is allowed (e.g., `R&D`).
- skipCodeBlocks: boolean (default: true) — Skip fenced/indented code blocks.
- skipInlineCode: boolean (default: true) — Skip inline code spans.

Fixable: Yes (replace `&` with `and`).

---

## Migration notes

The following options are deprecated; use the replacements instead:

| Rule | Deprecated | Replacement |
|------|------------|-------------|
| `sentence-case-heading` | `technicalTerms`, `properNouns` | `specialTerms` |
