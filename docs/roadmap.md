# 🛣️ Project roadmap for markdownlint-clarity

This roadmap outlines planned improvements and features for the `markdownlint-clarity` project. It is intended to help contributors—especially junior developers—understand priorities and implement improvements confidently. Tasks are ordered by logical progression and technical dependency.

## 📦 Code cleanup and modularization

*Improve clarity, readability, and long-term maintainability.*

### Extract utility functions

Move shared logic from `sentence-case.js` and `backtick-code-elements.js` into a `lib/` directory.

Suggested functions:

- `isBackticked(text)`
- `isInCodeSpan(token)`
- `convertToSentenceCase(text)`
- `isSentenceCase(text)`
- `shouldExcludeBacktickCheck(...)`

This will improve testability and reduce duplication.

### Centralize regexes and config constants

Move regex patterns and exclusion lists to named constants:

- Place regexes in `lib/patterns.js`
- Place common exclusions in `lib/constants.js`

Use naming that reflects intent clearly, e.g., `COMMON_CODE_EXTENSIONS`, `IGNORED_FILENAMES`, etc.

## 🔍 Improve detection accuracy

*Reduce false positives and strengthen contextual awareness.*

### Implement acronym and tech term whitelisting

Allow terms like `API`, `HTML`, and `JSON` to remain uppercase in sentence-case enforcement:

```js
const ALLOWED_UPPERCASE = ["API", "HTML", "CSS", "JSON"];
```

### Refine sentence-case logic

Make detection more precise by:

- Avoiding conversion of known proper nouns
- Handling list items and headings separately
- Preserving punctuation context (e.g., sentence boundaries)

### Limit sentence-case enforcement on bold text

Avoid flagging bold text unless it clearly represents a standalone sentence or section heading.

## 🛠️ Add fix suggestions

*Provide automatic corrections via `fixInfo`*

### Add fix logic to both rules

Wrap unwrapped code elements with backticks:

```js
fixInfo: {
  editColumn: column,
  deleteCount: match.length,
  insertText: `\`${match}\``
}
```

Convert incorrect headings and bold text to sentence case:

```js
fixInfo: {
  insertText: convertToSentenceCase(text)
}
```

### Validate safe application

- Ensure fixes are not applied inside links, code blocks, or inline HTML.
- Consider an optional “safe mode” toggle in rule config.

## 🧪 Extend and adapt test coverage

*Ensure changes are verified and regressions are prevented.*

### Update existing unit and feature tests

- Reflect any changed logic after refactors.
- Add tests for the new utility functions in `lib/`.

### Add tests for fixInfo

- Include Markdown examples that trigger automatic fixes.
- Confirm results with Jest snapshots or plain string comparisons.

### Add tests for new config options (if introduced in Phase 5)

## ⚙️ Improve configuration and project polish

### Increase adoption and contributor friendliness

#### Support rule-level configuration

Allow users to configure rule behavior in `.markdownlint.json`:

```json
{
  "sentence-case": {
    "allowedUppercase": ["GraphQL"]
  }
}
```

### Improve documentation

Update:

- `README.md`: usage, rule descriptions, `before/after` examples.
- `rules/README.md`: technical notes on rule design and logic.
- Link this `roadmap.md`.

### Prepare for optional `npm` publication

Ensure `package.json` is complete:

- `main`, `exports`, `author`, `repository`, `keywords`
- Include MIT license
- Test distribution packaging with the package manager

## 🌱 Future enhancements

- Rule: Enforce consistent heading punctuation (e.g., no trailing `.`)
- Rule: Flag vague link text like "click here"
- Optional: VS Code extension recommendations in `.vscode/extensions.json`

## 🔄 Markdownlint rule conformance improvements

*Align with markdownlint best practices and standards from `CustomRules.md`.*

### Migrate to micromark parser

Update rules to use the preferred `micromark` parser instead of `markdownit`:

- Refactor token handling in both rules to use `micromark` tokens
- Update tests to verify correct token processing
- Document token structure differences in code comments

### Enhance error reporting

Improve error objects with more context and precise locations:

```js
onError({
  lineNumber: token.lineNumber,
  detail: "Code element should be wrapped in backticks",
  context: matchText,
  range: [matchColumn, matchText.length] // Add column and length information
});
```

### Implement rule helpers integration

Leverage the `markdownlint-rule-helpers` package for common operations:

- Replace custom token traversal with helper functions
- Use standardized front matter handling
- Implement consistent range calculations

### Add asynchronous rule support

Create infrastructure for asynchronous rules that can:

- Validate external links
- Check referenced files exist
- Verify code snippets `compile/lint` correctly

```js
module.exports = {
  names: ["validate-external-links"],
  description: "Ensures external links are valid",
  tags: ["links", "validation"],
  parser: "micromark",
  asynchronous: true, // Mark as asynchronous
  function: async (params, onError) => {
    // Async implementation
    // Returns a Promise
  }
};
```

### Standardize rule structure validation

Expand test suite to validate all rules against markdownlint standards:

- Verify required fields (`names`, `description`, `tags`, `parser`, `function`)
- Ensure proper JSDoc documentation
- Check for consistent error reporting format
- Validate rule naming conventions
