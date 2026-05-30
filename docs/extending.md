# Extending markdownlint-trap

Create custom rules, package them as plugins, and contribute to the project.

## Rule anatomy

Every markdownlint rule is a JavaScript object with a standard shape. `no-empty-list-items` is a minimal example:

```javascript
// src/rules/no-empty-list-items.js

function noEmptyListItems(params, onError) {
  const tokens = params.parsers?.micromark?.tokens || [];
  // Walk list tokens; for each listItemPrefix with no following content,
  // report an error with fixInfo to delete the empty item.
  // ...
}

export default {
  names: ["no-empty-list-items", "ELI001"],
  description: "Empty list items are not allowed",
  tags: ["lists", "blank_lines"],
  parser: "micromark",
  function: noEmptyListItems,
};
```

### Required fields

| Field | Type | Purpose |
|-------|------|---------|
| `names` | `string[]` | Kebab-case name and short code (e.g., `["my-rule", "MR001"]`) |
| `description` | `string` | One-line summary shown in lint output |
| `tags` | `string[]` | Categories for grouping and filtering |
| `parser` | `string` | `"micromark"` (preferred) or `"markdownit"` |
| `function` | `function` | `(params, onError) => void` |

### The `params` object

- `params.lines` -- array of source lines (strings)
- `params.parsers.micromark.tokens` -- parsed token tree (when `parser: "micromark"`)
- `params.config` -- user configuration for the rule

### Reporting errors and fixes

Call `onError()` with the violation location and an optional `fixInfo` describing the edit:

```javascript
onError({
  lineNumber: 5,             // 1-based line number
  detail: "What is wrong",   // shown to the user
  context: "the bad text",   // snippet for context
  range: [column, length],   // optional highlight range
  fixInfo: {                 // optional auto-fix
    editColumn: 3,           // 1-based column
    deleteCount: 5,          // characters to remove (-1 deletes the whole line)
    insertText: "replacement",
  },
});
```

## Shared utilities

Rules `import` shared utilities directly. The following modules are available under `src/rules/`:

| Module | Purpose |
|--------|---------|
| `config-validation.js` | Validate rule config options (`validateStringArray`, `validateBoolean`, etc.) |
| `autofix-safety.js` | Confidence scoring for autofixes (`createSafeFixInfo`) |
| `shared-context.js` | Build document line context once via `buildLineContext`; query `isInCode`, `isInInlineCode`, `isInLinkDestination`, `isInFrontmatter` |
| `shared-utils.js` | Code block detection, inline code spans, emoji stripping |
| `shared-heuristics.js` | Acronym detection, markup segment preservation |
| `shared-constants.js` | Technical term dictionaries and default config values |

### Config validation

```javascript
import { validateConfig, validateStringArray, validateBoolean } from "./rules/config-validation.js";
```

### Context detection

A rule that scans lines must know whether a position sits in code, a link, a comment, or frontmatter before flagging it. Build the context once per document and query it:

```javascript
import { buildLineContext } from "./rules/shared-context.js";

const ctx = buildLineContext(params.lines);
if (ctx.isInCode(lineNumber, column)) return; // skip code spans and fences
if (ctx.isInLinkDestination(lineNumber, column)) return; // skip URLs
```

Reuse this instead of re-implementing fence, inline-code, or link scanning per rule.

### Safety checks for autofixes

Wrap a `fixInfo` with confidence scoring before returning it. `createSafeFixInfo(fixInfo, ruleType, original, fixed, context, safetyConfig?)` analyzes pattern strength, ambiguity, and context to decide whether the fix applies automatically, needs review, or is skipped:

```javascript
import { createSafeFixInfo } from "./rules/autofix-safety.js";

const fixInfo = createSafeFixInfo(
  { editColumn: start, deleteCount: text.length, insertText: `\`${text}\`` },
  "backtick",
  text,
  `\`${text}\``,
  { line },
);
```

## Using a custom rule alongside the presets

Add your own rule next to the built-ins. With `markdownlint-cli2`, extend a preset and list the rule under `customRules`:

```jsonc
// .markdownlint-cli2.jsonc
{
  "config": { "extends": "markdownlint-trap/recommended-config.jsonc" },
  "customRules": ["./my-rules/no-todo-comments.js"]
}
```

With the `markdownlint` API, spread the exported array and append your rule:

```javascript
import { lint } from "markdownlint/promise";
import markdownlintTrap from "markdownlint-trap";
import myCustomRule from "./my-rules/no-todo-comments.js";

const results = await lint({
  files: ["README.md"],
  customRules: [...markdownlintTrap, myCustomRule],
  config: { "no-todo-comments": { severity: "warn" } },
});
```

For preset selection and configuration, see `docs/configuration.md`.

## Rule registration and discovery

Register rules in `src/index.js`:

```javascript
import noEmptyListItems from "./rules/no-empty-list-items.js";
// ... other imports

export default [
  backtickCodeElements,
  sentenceCaseHeading,
  noBareUrls,
  noDeadInternalLinks,
  noLiteralAmpersand,
  noEmptyListItems,
  dateTimeConsistency,
];
```

The default export is an array of rule objects. Pass this array to `markdownlint` via the `customRules` option, or reference it through a preset.

Add a new rule to the project:

1. Create the rule file in `src/rules/`
2. Import it in `src/index.js` and add it to the exported array
3. Enable it in the appropriate preset config files (`basic-config.jsonc`, `recommended-config.jsonc`, `strict-config.jsonc`)

External rules do not need registration here. Pass them to `markdownlint` via `customRules` in your own configuration.

## Plugin packaging

A plugin is a standalone npm package that exports one or more rule objects. No special plugin API is needed because markdownlint rules are plain objects. Structure it like the main package: rule files and an `index.js` under `src/`, tests under `tests/`.

`src/index.js` aggregates the rules:

```javascript
import noTodoComments from "./no-todo-comments.js";
export default [noTodoComments];
```

`package.json` sets `"type": "module"`, points `main` at `./src/index.js`, and declares a `markdownlint` peer dependency:

```json
{
  "name": "markdownlint-rule-my-plugin",
  "type": "module",
  "main": "./src/index.js",
  "peerDependencies": { "markdownlint": ">=0.35.0" }
}
```

After `npm install markdownlint-rule-my-plugin`, reference it in `customRules`:

```jsonc
// .markdownlint-cli2.jsonc
{
  "customRules": ["markdownlint-rule-my-plugin"]
}
```

### Reusing shared primitives

To use markdownlint-trap utilities (config validation, autofix safety, shared heuristics), declare `markdownlint-trap` as a peer dependency, then import from its main entry point:

```javascript
import {
  shouldApplyAutofix,
  mergeAutofixSafetyConfig,
  validateAutofixSafetyConfig,
} from "markdownlint-trap";
```

## Testing expectations

All rules (contributed or external) should follow the project testing conventions.

### Feature tests with fixtures

Create fixture files with passing and failing examples, then lint each and assert on the result count:

```javascript
import { lint } from "markdownlint/promise";
import myRule from "../src/rules/my-rule.js";

async function lintFixture(name) {
  const file = `tests/fixtures/my-rule/${name}.fixture.md`;
  const results = await lint({
    files: [file],
    customRules: [myRule],
    config: { default: false, "my-rule": true },
  });
  return results[file];
}

test("detects violations in failing fixture", async () => {
  expect((await lintFixture("failing")).length).toBeGreaterThan(0);
});

test("passes clean fixture without violations", async () => {
  expect(await lintFixture("passing")).toHaveLength(0);
});
```

### What to test

- **Passing cases**: valid markdown producing zero violations
- **Failing cases**: invalid markdown with violations on expected lines
- **Auto-fix output**: if the rule provides `fixInfo`, verify the transformed output
- **Configuration options**: each option changes behavior as documented
- **Edge cases**: inline code, code blocks, links, emoji, and HTML comments — use [shared context detection](#context-detection) to skip these positions

Run `npm test` for the full suite, `npm test -- tests/features/` for feature tests, or `npm test -- --testNamePattern="my rule"` to filter by name. See `docs/testing.md` for the complete testing strategy.

## Contributing a rule to the project

### Proposal process

1. **Open an issue** describing what the rule enforces, why it matters, and example violations; label it `enhancement` and `rule-proposal`
2. **Discussion**: maintainers weigh whether the rule catches a real recurring problem, automates with low false positives, avoids overlap with built-in rules, and belongs in core versus a plugin
3. **Approval**: maintainers label the issue `accepted` and assign a rule ID

### Core vs. plugin rules

| Criterion | Core rule | Plugin |
|-----------|-----------|--------|
| Broadly useful across projects | Yes | No |
| Low false-positive rate | Required | Flexible |
| Uses shared primitives | Expected | Optional |
| Maintained by this project | Yes | Author maintains |

### Implementation workflow

After a rule proposal is accepted:

1. **Branch**: create `issue-<id>-<slug>` from `main`
2. **Write tests first** (TDD): create fixtures in `tests/fixtures/<rule-name>/` and feature tests in `tests/features/<rule-name>.test.js`
3. **Implement the rule** in `src/rules/<rule-name>.js` with a kebab-case filename
4. **Register** in `src/index.js`
5. **Enable** in the appropriate preset configs
6. **Document** in `docs/rules.md` (behavior, configuration, examples)
7. **Validate** against a consumer repository (see `docs/testing.md` for the false positive validation loop)
8. **Submit PR** linking to the issue with "Closes #N"

### Coding standards for contributed rules

- ES modules only, no transpilation
- Kebab-case filenames (e.g., `no-empty-list-items.js`)
- Named exports for utility functions, default export for the rule object
- JSDoc typedefs for public helpers
- 2-space indentation
- Use shared utilities (`shared-context.js`, `shared-utils.js`, `config-validation.js`) instead of reimplementing common patterns

## See also

The built-in rule catalogue (`docs/rules.md`), preset and configuration reference (`docs/configuration.md`), and testing strategy (`docs/testing.md`).
