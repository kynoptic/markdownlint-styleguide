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
Look for an existing story first — most features hang off one already written. A
tracking issue or audit checklist is not a story: it records findings, not a
situation. Write a new story only when nothing fits and the work is worth doing,
and never one per issue.
Stories are few — a dozen or so across a project. Exception for trivial changes:
if the change fits in one commit and changes no behavior contract, write
"None — trivial" here and skip the story.
-->

## Object

<Which existing object this hangs off.>

<!--
Framework: OOUX (object-oriented UX) — a domain's objects, their attributes, and
what is navigable from what.

An object is a thing the system stores that a person can name and open — user,
order, article. Not a class, view, or module: naming the code you'll touch
answers a different question. This section only applies in repos that persist
objects; delete it otherwise.

Name the one existing object this hangs off, or write "no object-model change"
when the work leaves the model alone. Three answers need a linked ADR instead: a
new object, a move between object and attribute in either direction, or a change
to what is navigable from what. A new screen is usually that third case.
Nothing else requires an ADR.
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

<!--
Framework: information foraging — each criterion names concrete rendered output,
so a reader can tell from the screen whether the behavior changed.
-->

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
