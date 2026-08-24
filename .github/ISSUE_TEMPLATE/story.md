---
name: Story
about: Capture a situation and the behavior change that would resolve it
title: ''
labels: story
assignees: ''
---

<!--
Title guidance: Name the situation, not the solution
Example: "Restocking requires checking each item's quantity individually"
Avoid conventional commit format for issues (no "feat:", "add:", etc.)

Stories are few — a dozen or so, total. Candidates hang off an existing story;
they don't each get their own. If every issue has a parent story, the model has
become a folder structure. Never create a story to make the hierarchy look complete.
-->

## Situation

<When this comes up: where the person is standing, what they're holding. One or two sentences.>

<!--
Not a persona. A situation comes from observed behavior — someone watched, a
support thread, a session recording. An AI assistant must never draft this
section, even as a placeholder: a generated situation is a citation with no
source to check. Flag it as missing instead.
-->

## Behavior change

<What someone does differently if this exists.>

<!--
Must be observable. "Users will be happier" fails. "Stops opening each item to
check quantity before reordering" passes.
-->

## Candidates

<!--
Sub-issues, as a task list. Both Gitea and GitHub render these as trackable
checkboxes; on GitHub they can also be linked as sub-issues. One parent per
candidate — cross-cutting work picks the story with the most observable behavior
change and cross-links the other. Don't build a second parent out of labels.
-->

- [ ] #XXX

## Related work

- **ADRs**: `ADR-XXX`
- **Related stories**: `#XXX`
