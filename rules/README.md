# `rules` directory

This directory contains custom rules for markdownlint-trap. Each rule is implemented in its own file and follows the markdownlint rule API.

## Directory structure

- `helpers/`: Helper functions and utilities used by rules
  - See [`helpers/README.md`](./helpers/README.md) for details
- Rule implementation files (`e.g.`, `backtick-code-elements.js`, `sentence-case.js`)

## Available rules

### `backtick-code-elements.js`

Ensures that filenames, directory paths, and code elements are properly wrapped in backticks for better readability and proper markdown formatting.

**Rule name**: `backtick-code-elements`

**Tags**: formatting, code

**Options**: None

**Implementation details**:

- Scans text content for unwrapped code elements
- Detects filenames (e.g., `example.js`)
- Detects directory paths (e.g., `src/components/`)
- Detects code keywords (e.g., `function`, `const`, `import`)
- Ignores text within links and existing code spans

**Examples**:

```markdown
<!-- Bad -->
Use const instead of var for better scoping.
Check the src/components/ directory.
Open example.js file.

<!-- Good -->
Use `const` instead of `var` for better scoping.
Check the `src/components/` directory.
Open `example.js` file.
```

### `sentence-case.js`

Enforces sentence case for headings and bold text instead of title case. Properly handles proper nouns, acronyms, and technical terms.

**Rule name**: `sentence-case-headings-bold`

**Tags**: headings, bold, case

**Options**:

- None configurable via options object, behavior is controlled by the rule name

**Implementation details**:

- Analyzes heading text to detect title case patterns
- Analyzes bold text to detect title case patterns
- Intelligently ignores proper nouns, acronyms, and technical terms
- Uses percentage-based detection to avoid false positives
- Maintains a list of common proper nouns and technical terms

**Examples**:

```markdown
<!-- Bad (will be flagged) -->
# This Is Title Case
Some text with **Title Case Bold Text** here.

<!-- Good (will not be flagged) -->
# This is sentence case
Some text with **bold text in sentence case** here.

<!-- Also good (proper nouns and technical terms) -->
# Using JavaScript with React and TypeScript
The **GitHub API** provides access to repositories.
```

## Creating a new rule

1. Create a new file in this directory with a descriptive name.
2. Implement the rule following the markdownlint rule API.
3. Export an object with the following properties:
   - `names`: Array of rule names
   - `description`: Description of the rule
   - `function`: The rule implementation function
4. Add tests in the `tests/rules` directory.
5. Document the rule in this README.

## Testing rules

Run the test suite:

```bash
npm test
```

Or test a specific rule:

```bash
npx jest tests/rules/your-rule.test.js
```
