# `rules`

This directory contains custom rules for markdownlint. Each rule is implemented in its own file and follows the markdownlint rule API.

## Available Rules

### backtick-code-elements.js

Ensures that code elements are properly wrapped in backticks.

**Options**: None

**Example**:

```markdown
<!-- Bad -->

Use `const` to declare variables.

<!-- Good -->

Use `const` to declare variables.
```

### sentence-case.js

Enforces sentence case for headings.

**Options**:

- `sentence-case-headings-bold`: When true, enforces sentence case for bold text in headings

**Example**:

```markdown
<!-- Bad -->

# This is a Heading

<!-- Good -->

# This is a heading
```

## Creating a New Rule

1. Create a new file in this directory with a descriptive name.
2. Implement the rule following the markdownlint rule API.
3. Export an object with the following properties:
   - `names`: Array of rule names
   - `description`: Description of the rule
   - `function`: The rule implementation function
4. Add tests in the `tests/rules` directory.
5. Document the rule in this README.

## Testing Rules

Run the test suite:

```bash
npm test
```

Or test a specific rule:

```bash
npx jest tests/rules/your-rule.test.js
```
