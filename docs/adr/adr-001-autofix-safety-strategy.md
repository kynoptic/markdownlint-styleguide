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

1. **Separation of concerns** - Safety logic is separated from rule validation logic:
   - Rules focus on detecting violations (what is wrong)
   - Safety module determines if autofixes should apply (when to fix automatically)

2. **Confidence scoring** - Each autofix receives a confidence score (0-1) based on:
   - Pattern strength (e.g., file paths with extensions = high confidence)
   - Ambiguity markers (e.g., very short words = low confidence)
   - Context indicators (e.g., technical vs. natural language surrounding text)

3. **Conservative thresholds** - Default confidence threshold is 0.5, requiring moderate-to-high confidence before applying autofixes

4. **Transparent metadata** - Fix objects include `_safety` metadata for debugging and future enhancement

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
- `analyzeCodeVsNaturalLanguage(text, context)` - Advanced pattern matching with explicit reasoning
- `shouldApplyAutofix(ruleType, original, fixed, context, config)` - Main decision gateway
- `createSafeFixInfo(originalFixInfo, ruleType, original, fixed, context, config)` - Wraps fix objects with safety metadata

## Alternatives considered

### 1. Rule-level safety logic

**Approach**: Embed confidence scoring directly in each rule file.

**Rejected because**:

- Creates code duplication across rules
- Mixes validation logic with safety heuristics
- Makes it harder to maintain consistent safety behavior
- Increases testing surface area (each rule needs comprehensive safety tests)

### 2. Disable autofixes entirely

**Approach**: Only report violations without offering fixes.

**Rejected because**:

- Defeats the value proposition of automated linting
- Creates unnecessary manual work for users
- Ignores that many fixes (file paths, obvious acronyms) are deterministic and safe

### 3. User-controlled allowlists

**Approach**: Require users to configure safe terms explicitly.

**Rejected because**:

- Creates configuration burden for users
- Requires domain knowledge to configure correctly
- Still needs fallback heuristics for unconfigured terms
- Combined approach (heuristics + optional allowlists) is superior

### 4. Machine-learning classifier

**Approach**: Train a model to distinguish code from natural language.

**Rejected because**:

- Adds dependency complexity (model files, runtime)
- Increases build size and installation time
- Harder to debug and explain decisions
- Heuristic approach is sufficient for current use cases
- Can be reconsidered if heuristic precision plateaus

## Consequences

### Benefits

- **Reduced false positives** - Users experience fewer incorrect autofixes
- **Maintained automation value** - High-confidence fixes still apply automatically
- **Clear separation of concerns** - Rule logic and safety logic evolve independently
- **Testability** - 568 behavioral unit tests validate safety decisions in isolation
- **Extensibility** - New rules can leverage existing safety infrastructure
- **Transparency** - `_safety` metadata enables debugging and future improvements
- **User control** - Configuration allows adjusting thresholds or disabling safety checks

### Tradeoffs

- **Increased complexity** - Additional module and configuration surface
- **Potential under-fixing** - Some valid fixes may be suppressed due to conservative thresholds
- **Maintenance burden** - Safety heuristics require tuning as new edge cases emerge
- **Performance overhead** - Confidence scoring adds computational cost (mitigated by fast-path optimizations)

### Migration impact

- Existing rules must be updated to use `createSafeFixInfo()` wrapper
- Users may notice fewer autofixes initially (by design)
- Documentation must explain when manual review is needed
- CI pipelines should fail on linting errors, not rely solely on autofixes

## Related decisions

- See `docs/architecture.md` section "Shared utilities" for module organization rationale
- See commit [61de511](https://github.com/kynoptic/markdownlint-trap/commit/61de511) for initial implementation
- See `src/rules/autofix-safety.test.js` for comprehensive test coverage

## Future considerations

- Monitor false negative rate (valid fixes being suppressed)
- Consider adding user feedback mechanism to tune heuristics
- Evaluate ML classifier if heuristic approach becomes unmaintainable
- Add telemetry to track confidence score distribution in real-world usage
