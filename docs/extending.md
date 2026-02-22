# Extending markdownlint-trap

Create custom rules, package them as plugins, and contribute to the project.

## Rule anatomy

Every markdownlint rule is a JavaScript object with a standard shape. `no-empty-list-items` is a minimal example:

```javascript
// src/rules/no-empty-list-items.js

function noEmptyListItems(params, onError) {
  const tokens = params.parsers?.micromark?.tokens || [];

  for (const token of tokens) {
    if (token.type !== "listUnordered" && token.type !== "listOrdered") {
      continue;
    }

    const children = token.children || [];
    for (let i = 0; i < children.length; i++) {
      if (children[i].type !== "listItemPrefix") continue;

      const next = children[i + 1];
      if (!next || next.type !== "content") {
        onError({
          lineNumber: children[i].startLine,
          detail: "Empty list item found",
          context: params.lines[children[i].startLine - 1].trim(),
          fixInfo: { deleteCount: -1 },
        });
      }
    }
  }
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

### Reporting errors

Call `onError()` with:

```javascript
onError({
  lineNumber: 5,          // 1-based line number
  detail: "What is wrong", // shown to the user
  context: "the bad text", // snippet for context
  range: [column, length], // optional highlight range
  fixInfo: { ... },        // optional auto-fix (see below)
});
```

### Auto-fix via `fixInfo`

```javascript
fixInfo: {
  editColumn: 3,           // 1-based column
  deleteCount: 5,          // characters to remove
  insertText: "replacement" // text to insert
}
```

Set `deleteCount: -1` to delete the entire line.

## Shared helpers contract

Rules that need configuration validation, autofix safety scoring, or integrated logging should use the shared helpers. This pattern is recommended for contributed rules.

```javascript
import {
  createRuleContext,
  extractConfig,
  reportViolation,
  createFixInfo,
} from "./rules/rule-helpers.js";
import { validateStringArray, validateBoolean } from "./rules/config-validation.js";

export default {
  names: ["my-rule", "MR001"],
  description: "Describe what the rule enforces",
  tags: ["style"],
  parser: "micromark",
  function: (params, onError) => {
    const context = createRuleContext(params, onError, "my-rule", "MR001");
    if (!context.isValid) return;

    const config = extractConfig(context, { ignoredTerms: validateStringArray }, { ignoredTerms: [] });

    context.lines.forEach((line, index) => {
      const fixInfo = createFixInfo(context, { column: 5, length: 4, replacement: "new text" });
      reportViolation(context, { lineNumber: index + 1, message: "Description", context: "text", fixInfo });
    });
  },
};
```

### Available helpers

| Helper | Source | Purpose |
|--------|--------|---------|
| `createRuleContext` | `rule-helpers.js` | Validate params, create context object |
| `extractConfig` | `rule-helpers.js` | Extract and validate config with defaults |
| `reportViolation` | `rule-helpers.js` | Report errors with consistent formatting |
| `createFixInfo` | `rule-helpers.js` | Build fix info with optional safety checks |
| `validateStringArray` | `config-validation.js` | Validate `string[]` config fields |
| `validateBoolean` | `config-validation.js` | Validate `boolean` config fields |
| `validateNonNegativeNumber` | `config-validation.js` | Validate `number >= 0` config fields |
| `getCodeBlockLines` | `shared-utils.js` | Detect which lines are inside code blocks |
| `isInInlineCode` | `shared-utils.js` | Check if a position is inside backtick spans |
| `getInlineCodeSpans` | `shared-utils.js` | Extract all inline code span ranges |
| `stripLeadingDecorations` | `shared-utils.js` | Remove leading emoji from text |

### Safety checks for autofixes

Pass `ruleType` to `createFixInfo` to enable confidence scoring:

```javascript
const fixInfo = createFixInfo(context, {
  column: start, length: text.length, replacement: `\`${text}\``,
  ruleType: 'backtick', original: text, context: { line }
});
```

Safety checks analyze pattern strength, ambiguity, and context to decide whether to apply a fix automatically, flag it for review, or skip it.

## Using rules as a consumer

### With `markdownlint-cli2`

In `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

This loads all built-in rules. Add your own rule alongside the defaults:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  },
  "customRules": ["./my-rules/no-todo-comments.js"]
}
```

### With the `markdownlint` API

```javascript
import { lint } from "markdownlint/promise";
import markdownlintTrap from "markdownlint-trap";
import myCustomRule from "./my-rules/no-todo-comments.js";

const results = await lint({
  files: ["README.md"],
  customRules: [...markdownlintTrap, myCustomRule],
  config: {
    "no-todo-comments": { severity: "warn" },
  },
});
```

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
];
```

The default export is an array of rule objects. Pass this array to `markdownlint` via the `customRules` option, or reference it through a preset.

Add a new rule to the project:

1. Create the rule file in `src/rules/`
2. Import it in `src/index.js` and add it to the exported array
3. Enable it in the appropriate preset config files (`basic-config.jsonc`, `recommended-config.jsonc`, `strict-config.jsonc`)

External rules do not need registration here. Pass them to `markdownlint` via `customRules` in your own configuration.

## Plugin packaging

A plugin is a standalone npm package that exports one or more rule objects. No special plugin API is needed because markdownlint rules are plain objects.

### Minimal plugin structure

```text
markdownlint-rule-my-plugin/
  src/
    no-todo-comments.js
    index.js
  tests/
    no-todo-comments.test.js
  package.json
```

`src/index.js`:

```javascript
import noTodoComments from "./no-todo-comments.js";
export default [noTodoComments];
```

`package.json`:

```json
{
  "name": "markdownlint-rule-my-plugin",
  "type": "module",
  "main": "./src/index.js",
  "peerDependencies": {
    "markdownlint": ">=0.35.0"
  }
}
```

Install and use the plugin:

```bash
npm install markdownlint-rule-my-plugin
```

```jsonc
// .markdownlint-cli2.jsonc
{
  "customRules": ["markdownlint-rule-my-plugin"]
}
```

### Reusing shared primitives

If your plugin uses markdownlint-trap utilities (config validation, autofix safety, shared heuristics), declare `markdownlint-trap` as a peer dependency:

```json
{
  "peerDependencies": {
    "markdownlint": ">=0.35.0",
    "markdownlint-trap": ">=2.0.0"
  }
}
```

Then import the utilities:

```javascript
import {
  shouldApplyAutofix,
  mergeAutofixSafetyConfig,
  validateAutofixSafetyConfig,
} from "markdownlint-trap";
```

The package exports autofix safety components from its main entry point.

## Testing expectations

All rules (contributed or external) should follow the project testing conventions.

### Feature tests with fixtures

Create a fixture file with passing and failing examples, then test against it:

```javascript
import { lint } from "markdownlint/promise";
import myRule from "../src/rules/my-rule.js";

test("detects violations in failing fixture", async () => {
  const results = await lint({
    files: ["tests/fixtures/my-rule/failing.fixture.md"],
    customRules: [myRule],
    config: { default: false, "my-rule": true },
  });
  expect(results[fixturePath].length).toBeGreaterThan(0);
});

test("passes clean fixture without violations", async () => {
  const results = await lint({
    files: ["tests/fixtures/my-rule/passing.fixture.md"],
    customRules: [myRule],
    config: { default: false, "my-rule": true },
  });
  expect(results[fixturePath]).toHaveLength(0);
});
```

### What to test

- **Passing cases**: valid markdown producing zero violations
- **Failing cases**: invalid markdown with violations on expected lines
- **Auto-fix output**: if the rule provides `fixInfo`, verify the transformed output
- **Configuration options**: each option changes behavior as documented
- **Edge cases**: inline code, code blocks, links, emoji, and HTML comments

### Running the test suite

```bash
npm test                          # Full suite
npm test -- tests/features/       # Feature tests only
npm test -- --testNamePattern="my rule"  # Filter by name
```

See `docs/testing.md` for the complete testing strategy.

## Contributing a rule to the project

### Proposal process

1. **Open an issue** describing what the rule enforces, why it matters, and example violations
2. **Label it** `enhancement` and `rule-proposal`
3. **Discussion**: maintainers evaluate against these criteria:
   - Does the rule catch a real, recurring problem in markdown documentation?
   - Can it be automated with low false-positive rates?
   - Does it overlap with existing markdownlint built-in rules?
   - Should it be a core rule or an external plugin?
4. **Approval**: maintainers label the issue `accepted` and assign a rule ID

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
- Use shared utilities (`shared-utils.js`, `config-validation.js`) instead of reimplementing common patterns

## See also

- `docs/rules.md` -- built-in rule catalogue
- `docs/configuration.md` -- preset tiers and configuration options
- `docs/testing.md` -- testing strategy and conventions
