---
name: Feature
about: Propose a new feature or enhancement
title: ''
labels: feature
assignees: ''
---

<!--
Title guidance: Describe the problem being solved, not the solution
Example: "Can't export user data to CSV"
Avoid conventional commit format for issues (no "feat:", "add:", etc.)
-->

## Parent story

<Link to the story this serves: #XXX>

<!--
If no story exists and the work is worth doing, write the story first. Exception
for trivial changes: if it fits in one commit and changes no behavior contract,
skip the story. Stories are few — never write one per issue.
-->

## Object

<Which existing object this hangs off.>

<!--
Only applies in repos with a domain model; delete this section otherwise. If the
answer is "a new object" or "a new screen," link an ADR — object-model changes
are the ADR trigger.
-->

## Summary

<One line overview.>

## The problem

<Why this matters to users or contributors.>

## Cheapest version

<The smallest change that produces the behavior change.>

<!-- Often not the feature. Write this before the proposed solution, not after. -->

## Proposed solution

<How we'll solve it (keep distinct from the problem).>

## Empty, broken, reversible

- **Empty**: <what it shows with no data>
- **Broken**: <what it does on failure>
- **Reversible**: <instant | undoable | confirmed>

<!--
Reversibility is a policy of the object, not of this feature. If the object
already has one, restate it here rather than inventing a second.
-->

## Ongoing tax

<none | local | permanent — what must be supported forever once this ships.>

<!--
Read once at triage: permanent tax on a nice-to-have is a won't-fix, not a
backlog item. How often the situation comes up is a `frequency:` label, not a
field here — it's the third key of the triage sort, and a sort key you have to
open the issue to read can't order a list.

Optional, where user expectation is actually known:
Kano: basic | performance | delighter. Drives UI placement, not priority. An AI
assistant may suggest one with explicit uncertainty, never assign it — it depends
on what users already expect, which can't be observed from the repo.
-->

## Acceptance criteria (testable)

- [ ] GIVEN … WHEN … THEN …
- [ ] …
- [ ] Documentation updated

## Testing strategy (test-first)

<!--
Follow test-first approach with meaningful behavioral tests
Avoid vanity tests that only verify framework behavior or trivial operations
-->

- **Unit tests**:
- **Integration/E2E tests**:
- **Edge cases**:

## Links

- **ADRs**: `ADR-XXX`
