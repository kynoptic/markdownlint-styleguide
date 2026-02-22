# Rule authoring guide

This guide explains how to create new custom markdownlint rules using the standardized helpers contract. The helpers eliminate boilerplate and ensure consistent configuration validation, logging, and fix application across all rules.

## Quick start

Here's a minimal rule using the helpers contract:

```javascript
import {
  createRuleContext,
  extractConfig,
  reportViolation,
  createFixInfo
} from './rules/rule-helpers.js';
import { validateStringArray, validateBoolean } from './rules/config-validation.js';

export default {
  names: ['my-rule', 'MR001'],
  description: 'Brief description of what the rule does',
  tags: ['style'],
  parser: 'micromark',
  function: (params, onError) => {
    // 1. Create and validate context
    const context = createRuleContext(params, onError, 'my-rule', 'MR001');
    if (!context.isValid) return;

    // 2. Extract and validate configuration
    const schema = {
      ignoredTerms: validateStringArray,
      enabled: validateBoolean
    };
    const config = extractConfig(context, schema, {
      ignoredTerms: [],
      enabled: true
    });

    // 3. Implement rule logic
    context.lines.forEach((line, index) => {
      // ... detect violations ...

      // 4. Create fix information (optional)
      const fixInfo = createFixInfo(context, {
        column: 5,
        length: 4,
        replacement: 'new text'
      });

      // 5. Report violations
      reportViolation(context, {
        lineNumber: index + 1,
        message: 'Description of the violation',
        context: 'violation text',
        fixInfo
      });
    });
  }
};
```

## Helper functions

### `createRuleContext(params, onError, ruleName, ruleCode)`

Creates a validated context object for rule execution. This is always the first step.

**Parameters:**

- `params` - markdownlint params object
- `onError` - markdownlint error callback
- `ruleName` - Name of the rule (e.g., 'sentence-case-heading')
- `ruleCode` - Optional rule code (e.g., 'SC001')

**Returns:** `RuleContext` object with:

- `isValid` - Boolean indicating if parameters are valid
- `lines` - Source lines array
- `tokens` - Parsed tokens (if micromark parser used)
- `config` - Raw configuration object
- `onError` - Error reporting callback
- `ruleName` - Name of the rule
- `ruleCode` - Rule code (if provided)
- `logger` - Logger function integrated with markdownlint
- `params` - Original params object for advanced use

**Example:**

```javascript
const context = createRuleContext(params, onError, 'my-rule', 'MR001');
if (!context.isValid) return; // Early exit for invalid params
```

### `extractConfig(context, schema, defaults)`

Extracts and validates rule configuration with automatic fallback to defaults.

**Parameters:**

- `context` - Rule context from `createRuleContext`
- `schema` - Validation schema with field validators
- `defaults` - Default values for configuration fields

**Returns:** Validated configuration object

**Example:**

```javascript
const schema = {
  ignoredTerms: validateStringArray,
  skipCodeBlocks: validateBoolean,
  threshold: validateNonNegativeNumber
};

const config = extractConfig(context, schema, {
  ignoredTerms: [],
  skipCodeBlocks: true,
  threshold: 5
});

// Now use config.ignoredTerms, config.skipCodeBlocks, etc.
```

### `reportViolation(context, violation)`

Reports a rule violation with consistent formatting.

**Parameters:**

- `context` - Rule context from `createRuleContext`
- `violation` - Object with:
  - `lineNumber` - Line number where violation occurs
  - `message` - Description of the violation
  - `context` - Context text for the violation
  - `fixInfo` - Optional fix information
  - `range` - Optional range [column, length]

**Example:**

```javascript
reportViolation(context, {
  lineNumber: 5,
  message: 'Heading should use sentence case',
  context: 'This Is A Heading',
  fixInfo: createFixInfo(context, { ... }),
  range: [1, 17]
});
```

### `createFixInfo(context, options)`

Creates fix information with optional safety checks.

**Parameters:**

- `context` - Rule context from `createRuleContext`
- `options` - Object with:
  - `column` - Column position (1-based)
  - `length` - Number of characters to replace
  - `replacement` - Text to insert
  - `ruleType` - Optional type for safety checks ('backtick', 'sentence-case')
  - `original` - Optional original text being fixed
  - `context` - Optional additional context for safety checks

**Returns:** Fix info object or null if safety check fails

**Example:**

```javascript
// Simple fix without safety checks
const fixInfo = createFixInfo(context, {
  column: 5,
  length: 4,
  replacement: 'new'
});

// Fix with safety checks
const fixInfo = createFixInfo(context, {
  column: 1,
  length: 4,
  replacement: '`test`',
  ruleType: 'backtick',
  original: 'test',
  context: { line: 'This is a test line' }
});
```

## Configuration validation

Use validators from `config-validation.js`:

- `validateStringArray` - Validates array of strings
- `validateBoolean` - Validates boolean value
- `validateNonNegativeNumber` - Validates non-negative number

**Example schema:**

```javascript
const schema = {
  ignoredTerms: validateStringArray,
  caseSensitive: validateBoolean,
  maxLength: validateNonNegativeNumber
};
```

## Safety checks for autofixes

When creating fixes, you can enable safety checks to prevent low-confidence autofixes:

```javascript
const fixInfo = createFixInfo(context, {
  column: start,
  length: text.length,
  replacement: `\`${text}\``,
  ruleType: 'backtick',  // Triggers safety analysis
  original: text,
  context: { line }  // Provides context for confidence scoring
});
```

Safety checks analyze:

- Common English words (low confidence for backtick wrapping)
- Technical patterns (high confidence for backtick wrapping)
- Context indicators (prose vs. code)
- Sentence case transformations

## Complete example

Here's a complete rule that detects UPPERCASE words and suggests lowercase:

```javascript
import {
  createRuleContext,
  extractConfig,
  reportViolation,
  createFixInfo
} from './rules/rule-helpers.js';
import { validateStringArray, validateBoolean } from './rules/config-validation.js';

export default {
  names: ['no-uppercase-words', 'NUW001'],
  description: 'Flags UPPERCASE words and suggests lowercase',
  tags: ['style'],
  parser: 'micromark',
  fixable: true,
  function: (params, onError) => {
    // 1. Create context with validation
    const context = createRuleContext(params, onError, 'no-uppercase-words', 'NUW001');
    if (!context.isValid) return;

    // 2. Extract and validate config
    const schema = {
      ignoredWords: validateStringArray,
      skipHeadings: validateBoolean
    };
    const config = extractConfig(context, schema, {
      ignoredWords: [],
      skipHeadings: true
    });

    // 3. Process each line
    context.lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Skip headings if configured
      if (config.skipHeadings && /^#+\s/.test(line)) {
        return;
      }

      // Find UPPERCASE words
      const pattern = /\b[A-Z]{2,}\b/g;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const word = match[0];

        // Skip ignored words
        if (config.ignoredWords.includes(word)) {
          continue;
        }

        // 4. Create fix
        const fixInfo = createFixInfo(context, {
          column: match.index + 1,
          length: word.length,
          replacement: word.toLowerCase()
        });

        // 5. Report violation
        reportViolation(context, {
          lineNumber,
          message: `Uppercase word "${word}" should be lowercase`,
          context: word,
          fixInfo,
          range: [match.index + 1, word.length]
        });
      }
    });
  }
};
```

## Benefits of using helpers

Compared to the legacy pattern, helpers provide:

1. **Standardized parameter validation** - No more copy-paste validation logic
2. **Consistent config extraction** - Handles both rule name and code automatically
3. **Type-safe configuration** - IDE autocomplete and validation
4. **Automatic error handling** - Invalid config continues with defaults
5. **Integrated logging** - Errors reported through markdownlint
6. **Safety checks** - Optional confidence scoring for autofixes
7. **Less boilerplate** - Focus on rule logic, not infrastructure

## Migration from legacy pattern

### Legacy pattern (before helpers)

```javascript
function myRule(params, onError) {
  // Manual validation
  if (!params || !Array.isArray(params.lines) || typeof onError !== 'function') {
    return;
  }

  // Manual config extraction
  const config = params.config?.['my-rule'] || params.config?.MR001 || {};

  // Manual validation (often skipped)
  const ignoredTerms = Array.isArray(config.ignoredTerms) ? config.ignoredTerms : [];

  // Business logic...
  params.lines.forEach((line, index) => {
    // Manual error reporting
    onError({
      lineNumber: index + 1,
      detail: 'Error message',
      context: 'text',
      fixInfo: {
        editColumn: 1,
        deleteCount: 4,
        insertText: 'new'
      }
    });
  });
}
```

### Modern pattern (with helpers)

```javascript
function myRule(params, onError) {
  const context = createRuleContext(params, onError, 'my-rule', 'MR001');
  if (!context.isValid) return;

  const schema = { ignoredTerms: validateStringArray };
  const config = extractConfig(context, schema, { ignoredTerms: [] });

  context.lines.forEach((line, index) => {
    const fixInfo = createFixInfo(context, {
      column: 1,
      length: 4,
      replacement: 'new'
    });

    reportViolation(context, {
      lineNumber: index + 1,
      message: 'Error message',
      context: 'text',
      fixInfo
    });
  });
}
```

## Testing your rule

Use the helpers in your tests too:

```javascript
import { lint } from 'markdownlint/promise';
import myRule from './rules/my-rule.js';

it('should_detect_violations', async () => {
  const result = await lint({
    strings: { content: 'Test content' },
    config: {
      default: false,
      'my-rule': {
        ignoredTerms: ['API']
      }
    },
    customRules: [myRule]
  });

  expect(result.content).toHaveLength(1);
  expect(result.content[0].lineNumber).toBe(1);
});
```

## See also

- `src/rules/rule-helpers.js` -- implementation
- `src/rules/config-validation.js` -- validators
- `tests/integration/rule-helpers-migration.test.js` -- examples
- `docs/extending.md` -- extension architecture, plugin packaging, and contribution workflow
