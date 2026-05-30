# ADR 005: Shared line-scanning context helper

## Status

Accepted

## Context

Several rules need to know *where* a given line or offset sits in a document:
inside a fenced code block, inside an inline code span, inside a link
destination, inside an HTML comment, inside frontmatter, or in ordinary prose.
Each rule that needed this answered it independently, re-implementing fenced
block tracking, code-span scanning, link parsing, and frontmatter detection.

That duplication caused two problems. The implementations drifted apart, so the
same Markdown could be classified differently by two rules. And the divergent
scanners were a recurring source of false positives — a construct one rule
correctly skipped, another would flag.

## Decision

We centralize document context detection in
[the shared context module](../../src/rules/shared-context.js)
(`src/rules/shared-context.js`). It exposes `buildLineContext(lines)`, which
returns a `LineContext` with predicates: `isInFencedCode`, `isInInlineCode`,
`isInLinkDestination`, `isInHtmlComment`, `isInFrontmatter`, `isInCode`, and
`isInProse`.

The context is built once per document and shared across the rules that consume
it: `backtick-code-elements`, `date-time-consistency`, `sentence-case-heading`,
`no-literal-ampersand`, and `no-dead-internal-links`.

Single-line code-span detection (`isInsideCodeSpan`) and the term and markup
heuristics stay in
[the shared heuristics module](../../src/rules/shared-heuristics.js); only
document line/offset context detection lives in `shared-context.js`.

## Consequences

### Positive

- Context detection is consistent across every rule that uses it.
- A context bug is fixed in one place rather than in each rule.
- Building the context once per document avoids repeated per-rule scans.

### Negative

- The context pass adds a small upfront cost per document.
- Rules now depend on a shared module rather than self-contained scanning.

## References

- [Shared context module](../../src/rules/shared-context.js) — `buildLineContext`
- [Shared heuristics module](../../src/rules/shared-heuristics.js) — term and
  markup heuristics
- [Per-rule reference](../rules.md) — rule behavior and configuration
