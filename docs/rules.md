# Rule catalogue

Custom markdownlint rules for documentation. Each rule has an ID, autofix capability, and configurable options. See the [configuration reference](configuration.md) for preset tiers and global options.

## Rules

| Rule | ID | Autofix | Description |
|------|----|---------|-------------|
| `sentence-case-heading` | SC001 | Yes | First word capitalized, rest lowercase except acronyms |
| `backtick-code-elements` | BCE001 | Yes | Wrap code-like terms in backticks |
| `no-bare-url` | BU001 | Yes | Autolink or wrap bare URLs |
| `no-dead-internal-links` | DL001 | No | Validate internal file and anchor links |
| `no-literal-ampersand` | NLA001 | Yes | Replace literal `&` with "and" |
| `no-empty-list-items` | ELI001 | Yes | Flag empty list items |
| `date-time-consistency` | DTC001 | Yes | Validate weekdays, `EST`/`EDT`, UTC offsets |

## `sentence-case-heading` (SC001)

Flag ATX headings and bold list-item labels that are not in sentence case: first word capitalized, everything else lowercase unless it is a configured acronym or proper noun.

Configure with `acronyms` (terms that must be uppercase) and `properNouns` (terms whose capitalized form is allowed).

```jsonc
{
  "sentence-case-heading": {
    "acronyms": ["API", "JSON", "HTML"],
    "properNouns": ["JavaScript", "TypeScript", "GitHub"]
  }
}
```

Words like "Skill", "Feature", or "Workspace" that your project uses as capitalized product terms should be added to `properNouns`. The rule cannot distinguish the common noun "skill" from a product concept "Skill" without project-specific context.

```jsonc
{
  "sentence-case-heading": {
    "properNouns": ["Skill", "Workspace", "Pipeline"],
    "acronyms": ["API"]
  }
}
```

The deprecated `specialTerms` key still works as an alias for `properNouns` but emits a console warning; migrate to `acronyms`/`properNouns`.

## `backtick-code-elements` (BCE001)

Flag code-like elements in prose that are not wrapped in backticks: file paths, function calls, CLI commands, environment variables.

The autofix wraps detected elements in backticks. Two corruption modes are explicitly rejected: wrapping a bare URL in a code span, and inserting a backtick mid-token at a letter or apostrophe boundary.

Enable `detectPascalCase` (boolean, default `false`) to flag PascalCase identifiers; it is opt-in because product and brand names frequently use PascalCase and would produce false positives.

```jsonc
{
  "backtick-code-elements": {
    "detectPascalCase": false
  }
}
```

## `no-bare-url` (BU001)

Flag bare URLs in prose. The autofix wraps them in angle brackets (`<https://example.com>`) or, when link text is available, a Markdown link.

## `no-dead-internal-links` (DL001)

Validate internal links to files and heading anchors. Reports links whose target file or `#anchor` does not exist.

```jsonc
{
  "no-dead-internal-links": {
    "allowPlaceholders": true,
    "linkBase": "file",
    "repoRoot": "."
  }
}
```

- `allowPlaceholders` (default `true`): skip links that look like templated placeholders such as `{{ variable }}` or `path/to/file`.
- `linkBase` (`"file"` or `"root"`, default `"file"`): resolve root-relative links (`/path`) from either the linking file's directory or the repository root.
- `repoRoot` (string, default auto-detected): the repository root used when `linkBase` is `"root"`. Auto-detected by walking up to a `.git` marker.

Anchor checks use GitHub-style slugs: Unicode letters are retained and punctuation is stripped, so "Diátaxis" becomes `diátaxis`.

## `no-literal-ampersand` (NLA001)

Flag standalone literal `&` in prose and suggest "and". Ampersands inside code spans, code blocks, and HTML entities are ignored.

## `no-empty-list-items` (ELI001)

Flag list items with no meaningful content (empty or whitespace-only).

## `date-time-consistency` (DTC001)

Validate weekday names, `EST`/`EDT` timezone abbreviations, and UTC offsets against the date they describe.

```jsonc
{
  "date-time-consistency": {
    "timezone": "America/New_York"
  }
}
```

Checks performed:

- Weekday matches the calendar date (e.g. flag "Monday, 2026-01-01" if that date is a Thursday).
- `EST`/`EDT` matches whether the date falls in daylight saving time.
- UTC offset matches the stated timezone and date.

## See also

- [Custom rule authoring guide](extending.md) — write and register new rules.
- [Configuration reference](configuration.md) — preset tiers and global options.
- [Architecture overview](architecture.md) — module structure and shared helpers.
