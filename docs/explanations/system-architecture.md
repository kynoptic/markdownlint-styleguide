# System architecture

This document explains the structure and rationale behind the `markdownlint-rules` project.

## Overview

- **Entry point:** The package exposes custom rules for markdownlint.
- **Configuration:** Rules are enabled via `.markdownlint.json`.
- **Extensibility:** Users can add or override rules in their config.

## Design choices

- **Separation of concerns:** Rules are modular and can be enabled/disabled independently.
- **Compatibility:** Follows markdownlint’s config schema for seamless integration.

## Dependencies

- [markdownlint](https://github.com/DavidAnson/markdownlint)
- [markdownlint-cli](https://github.com/DavidAnson/markdownlint-cli)

## Further reading

- [How to configure](../how-to/how-to-configure.md)
- [Configuration reference](../reference/configuration-reference.md)
