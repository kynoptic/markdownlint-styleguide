# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting
significant architectural choices in the markdownlint-trap project.

## What is an ADR?

An ADR captures the context, decision, alternatives, and consequences of an
important architectural choice. ADRs help future maintainers understand why
the system is designed the way it is, not just how it works.

## When to create an ADR

Create an ADR when making decisions about:

- System architecture and module boundaries
- Technology choices (libraries, frameworks, build tools)
- Design patterns and coding conventions
- Performance vs. maintainability tradeoffs
- Security or safety mechanisms

## ADR format

Each ADR follows this structure:

1. **Status** - Proposed, Accepted, Deprecated, Superseded
2. **Context** - The problem or situation requiring a decision
3. **Decision** - The chosen approach and implementation details
4. **Alternatives considered** - Other approaches evaluated and why they were rejected
5. **Consequences** - Benefits, tradeoffs, and migration impact

## Naming convention

Files are named `adr-NNN-short-title.md` where:

- `NNN` is a zero-padded sequential number (001, 002, 003...)
- `short-title` is a kebab-case description

## Index

- [ADR-001: Autofix safety strategy](adr-001-autofix-safety-strategy.md) -
  Confidence-based safety system for preventing false positive autofixes
