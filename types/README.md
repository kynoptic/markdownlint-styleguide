# Types directory

This directory contains TypeScript type definitions for markdownlint-trap.

## Contents

- `index.d.ts`: Type definitions for the markdownlint-trap package, including:
  - Rule interfaces
  - Helper function types
  - Configuration options

## Purpose

These type definitions provide TypeScript support for users of the markdownlint-trap package. They enable:

- Autocompletion in TypeScript-aware editors
- Type checking for rule options and configurations
- Better developer experience when integrating with the package

## Usage

TypeScript users will automatically get the benefit of these type definitions when importing the package:

```typescript
import * as markdownlintTrap from 'markdownlint-trap';
```

## Related modules

- [`../rules/`](../rules/): Custom rule implementations
- [`../index.js`](../index.js): Main package entry point
