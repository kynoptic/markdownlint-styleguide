<!-- markdownlint-disable-next-line sentence-case-heading -->
# markdownlint-trap custom rules

This document describes the custom markdownlint rules included in **markdownlint-trap**.

## `sentence-case-heading` (SC001)

The `sentence-case-heading` rule enforces sentence case for ATX headings. Only the first word is capitalized, keeping documentation consistent and easy to read.

### Why sentence case?

Sentence case is common in technical writing because it:

- Is less formal and easier to scan
- Avoids confusion over which words should be capitalized
- Aligns with many modern style guides
- Helps keep large sets of documentation consistent

### How the rule works

The rule checks each heading and ensures that:

1. The first word begins with a capital letter
2. Remaining words are lower case unless covered by an exception
3. The heading is not entirely in uppercase

### Allowed exceptions

The following elements may remain as they appear:

- Short acronyms (four letters or fewer), such as API, REST or HTML
- The pronoun "I"
- Words in parentheses, often code identifiers
- Text wrapped in backticks

### Correct examples

```markdown
# This is a correct heading
## Another good example with an API reference
# Working with JSON and REST APIs
# I am using proper sentence case
# Using the getUserData() function
```

### Incorrect examples

```markdown
# This Is Not Correct
## DO NOT USE ALL CAPS
# first word not capitalized
# Sentence with Another capitalized Word
```

### Error messages

When a violation is detected, the rule reports:

- "Heading's first word should be capitalized."
- "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym)."
- "Word \"X\" in heading should be lowercase."
- "Heading should not be in all caps."

### Implementation notes

The rule uses the micromark parser to analyze heading tokens and run a series of checks. Content inside backticks or square brackets, version numbers and dates is temporarily preserved so it is not modified. A small dictionary of technical terms and proper nouns is loaded once for performance. Some lines in the test fixture are exempt to illustrate edge cases.

### Configuration

There are currently no configuration options. Future versions may allow custom acronym lengths or additional dictionaries of proper nouns.

### Auto-fix

The rule provides basic auto-fix support. Running `markdownlint` with the `--fix` option converts headings to sentence case when possible.

## `backtick-code-elements` (BCE001)

The `backtick-code-elements` rule ensures that file names, folder names and simple code snippets are wrapped in backticks when referenced in normal text.

### When to use backticks

- File names like `package.json`
- Directory paths such as `src/utils`
- Shell commands or function calls

### Example

```markdown
Run `./build.sh` to start the build
```
