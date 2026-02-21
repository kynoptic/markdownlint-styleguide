# Advanced configuration

This guide covers fine-grained customization of markdownlint-trap rules beyond the preset tiers. It assumes you already have a working setup (see [setup](setup.md)) and understand the [preset system](configuration.md).

## Configure autofix safety

markdownlint-trap uses a three-tier confidence system to decide whether an autofix is safe to apply automatically. You can tune this behavior per rule.

### How the tiers work

| Tier | Default threshold | Behavior |
|------|-------------------|----------|
| Auto-fix | >= 0.7 | Applied automatically with `--fix` |
| Needs review | 0.3 -- 0.7 | Flagged for manual review, not applied |
| Skip | < 0.3 | Too uncertain, not surfaced |

### Adjust confidence thresholds

Lower the `confidenceThreshold` to allow more automatic fixes, or raise it to require higher certainty:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "sentence-case-heading": {
      "autofixSafety": {
        "confidenceThreshold": 0.8,  // Stricter: only very confident fixes
        "reviewThreshold": 0.4       // Raise the floor for needs-review items
      }
    }
  }
}
```

### Add safe and unsafe words

Use `safeWords` to boost confidence for terms you know are always correct to fix, and `unsafeWords` to penalize terms that should never be auto-fixed:

```jsonc
{
  "config": {
    "backtick-code-elements": {
      "autofixSafety": {
        "safeWords": ["webpack", "babel", "eslint"],
        "unsafeWords": ["spring", "rust", "swift"]
      }
    }
  }
}
```

The built-in defaults for `safeWords` include common technical terms (`npm`, `api`, `url`, `html`, `css`, `json`, `xml`, `http`, `https`). Your additions are merged with these defaults.

### Force review or skip specific terms

Two additional lists give you direct control over tier assignment:

- `alwaysReview`: forces matching terms into the needs-review tier regardless of confidence score
- `neverFlag`: suppresses matching terms entirely (skip tier)

```jsonc
{
  "config": {
    "sentence-case-heading": {
      "autofixSafety": {
        "alwaysReview": ["Docker", "Kubernetes"],
        "neverFlag": ["CHANGELOG", "README"]
      }
    }
  }
}
```

### Disable safety checks entirely

If you trust all autofixes and want maximum automation:

```jsonc
{
  "config": {
    "sentence-case-heading": {
      "autofixSafety": {
        "enabled": false
      }
    }
  }
}
```

This makes every fix apply automatically with `--fix`, bypassing confidence scoring.

## Override individual rules

Each custom rule accepts configuration options inline in your `.markdownlint-cli2.jsonc`. Use `true` for defaults, or pass an object to customize.

### Override a single rule from a preset

Extend a preset and override specific rules without affecting others:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    // Override just this rule; others keep preset defaults
    "sentence-case-heading": {
      "specialTerms": ["GraphQL", "OAuth", "SSO", "SAML"]
    }
  }
}
```

### Disable a rule from a preset

Set the rule to `false` to turn it off:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/strict-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

### Combine standard and custom rule options

Standard markdownlint rules and custom rules coexist in the same `config` block:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "MD024": true,                         // Re-enable duplicate heading check
    "MD041": true,                         // Require first-line H1
    "no-dead-internal-links": {
      "checkAnchors": true,
      "ignoredPaths": ["vendor", "third_party"]
    }
  }
}
```

## Common customization patterns

### Add project-specific proper nouns

Teams with product names or acronyms not in the built-in dictionary can extend `specialTerms`:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "sentence-case-heading": {
      "specialTerms": [
        "Acme Corp",
        "MyProduct",
        "JIRA",
        "Confluence"
      ]
    }
  }
}
```

These terms are preserved as-is during sentence case validation and autofix.

### Exclude paths from link checking

For repositories with generated or vendored content:

```jsonc
{
  "config": {
    "no-dead-internal-links": {
      "ignoredPaths": ["node_modules", "dist", "vendor", ".docusaurus"],
      "allowPlaceholders": true
    }
  }
}
```

### Allow bare URLs for specific domains

If your project documents internal services with bare URLs:

```jsonc
{
  "config": {
    "no-bare-url": {
      "allowedDomains": ["internal.example.com", "wiki.mycompany.net"]
    }
  }
}
```

### Add ampersand exceptions

For industry-specific abbreviations beyond the defaults (`R&D`, `Q&A`, `M&A`, `S&P`, `AT&T`):

```jsonc
{
  "config": {
    "no-literal-ampersand": {
      "exceptions": ["P&L", "B&B", "H&M"]
    }
  }
}
```

### Ignore additional terms from backtick detection

Suppress false positives for terms your project uses as prose, not code:

```jsonc
{
  "config": {
    "backtick-code-elements": {
      "ignoredTerms": ["Spring Boot", "Ruby on Rails", "Next.js"]
    }
  }
}
```

## Troubleshoot configuration issues

### Rule option not taking effect

Verify the option name is correct. Invalid options produce a validation error at lint time:

```text
Configuration validation failed for rule "sentence-case-heading":
  - unknownField: Unknown configuration option "SpecialTerms" for rule "sentence-case-heading"
```

Option names are case-sensitive. Use `specialTerms`, not `SpecialTerms`.

### Conflicting safe and unsafe words

If the same word appears in both `safeWords` and `unsafeWords`, validation reports a conflict:

```text
Configuration validation failed for rule "autofix-safety":
  - safeWords/unsafeWords: Word "spring" appears in both safeWords and unsafeWords (conflict)
```

Remove the word from one list to resolve.

### Preset overrides not working

When extending a preset, your local overrides must be in the same `config` block. A second `config` key silently replaces the first:

```jsonc
// Wrong: second config block replaces the first
{
  "config": { "extends": "markdownlint-trap/recommended-config.jsonc" },
  "config": { "sentence-case-heading": { "specialTerms": ["JIRA"] } }
}
```

```jsonc
// Correct: single config block with both extends and overrides
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "sentence-case-heading": { "specialTerms": ["JIRA"] }
  }
}
```

### Debug autofix decisions

Enable debug logging to see confidence scores and tier assignments:

```bash
DEBUG=markdownlint-trap* npx markdownlint-cli2 --fix "**/*.md"
```

This prints each autofix decision with its confidence score, tier, and heuristic breakdown, helping you decide which thresholds or word lists to adjust.
