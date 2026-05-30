# ADR 001: Autofix safety strategy

## Status

Accepted

## Context

The markdownlint-trap project provides custom markdown linting rules with autofix capabilities. When autofixes incorrectly transform content, they can:

- Change technical meaning (e.g., converting code references like `API` to `Api`)
- Damage prose readability (e.g., wrapping natural language words in backticks)
- Create maintenance burden through false positive corrections
- Erode user trust in the linting system

The problem became evident with two specific scenarios:

1. **Sentence-case rule** - Converting headings to sentence case requires distinguishing between ordinary words (should be lowercased) and technical `terms/acronyms` (should preserve casing). Early implementations caused false corrections like `HTTP API Reference` → `Http Api Reference`.

2. **Backtick rule** - Wrapping code elements in backticks requires distinguishing code references from natural language. False positives included wrapping common words like `a`, `an`, `the`, and natural phrases like `read/write`.

Without a safety layer, autofix became unreliable and required users to manually review every automated change—defeating the purpose of automation.

## Decision

We will implement a **confidence-based autofix safety system** as a separate architectural layer in `src/rules/autofix-safety.js`.

### Core principles

1. **Separation of concerns** - Rules detect violations; the safety module decides whether an autofix should apply.

2. **Confidence scoring** - Each autofix receives a confidence score (0-1) based on pattern strength, ambiguity markers, and surrounding context.

3. **Conservative thresholds** - Default confidence threshold is 0.7, requiring high confidence before applying autofixes

4. **Transparent metadata** - Fix objects include `_safety` metadata for debugging.

### Architecture

```text
Rule validation (e.g., sentence-case-heading.js)
    ↓
Generates fixInfo object
    ↓
src/rules/autofix-safety.js
    ↓ shouldApplyAutofix() → {safe, confidence, reason}
    ↓ createSafeFixInfo() → enhanced fixInfo or null
    ↓
Return to markdownlint (null = no autofix, object = apply fix)
```

### Implementation details

The safety module provides:

- `calculateSentenceCaseConfidence(original, fixed, context)` - Analyzes structural changes, word count differences, and technical term preservation
- `calculateBacktickConfidence(original, context)` - Evaluates file path patterns, command-like syntax, and natural language indicators
- `shouldApplyAutofix(ruleType, original, fixed, context, config)` - Main decision gateway
- `createSafeFixInfo(originalFixInfo, ruleType, original, fixed, context, config)` - Wraps fix objects with safety metadata

## Alternatives considered

- **Rule-level safety logic** - Embed confidence scoring in each rule file. Rejected: duplicates code, mixes validation with safety heuristics, and inflates the testing surface.
- **Disable autofixes entirely** - Report violations only. Rejected: defeats the value of automated linting and ignores that many fixes are deterministic and safe.
- **User-controlled allowlists** - Require users to configure safe terms. Rejected: shifts a configuration burden onto users and still needs fallback heuristics. A combined heuristics-plus-allowlist approach is superior.
- **Machine-learning classifier** - Train a model to distinguish code from natural language. Rejected: adds dependency and build complexity and is harder to debug; heuristics suffice for current use cases.

## Consequences

### Benefits

- **Reduced false positives** - Users experience fewer incorrect autofixes.
- **Maintained automation value** - High-confidence fixes still apply automatically.
- **Clear separation of concerns** - Rule logic and safety logic evolve independently.
- **Testability** - Behavioral unit tests validate safety decisions in isolation.
- **Extensibility** - New rules can leverage existing safety infrastructure.
- **Transparency** - `_safety` metadata enables debugging.

### Tradeoffs

- **Increased complexity** - Additional module and configuration surface.
- **Potential under-fixing** - Some valid fixes may be suppressed due to conservative thresholds.
- **Maintenance burden** - Safety heuristics require tuning as new edge cases emerge.

### Open directions

- The confidence threshold may become a user-configurable option.
- The scoring inputs may be extended with document-level context.
- A user feedback mechanism may inform heuristic tuning.

## References

- [System architecture overview](../architecture.md) — module organization rationale
- [Vulnerability scanning process](../../SECURITY.md)
