<!-- markdownlint-disable-next-line sentence-case-heading -->
# markdownlint-trap custom rules

## Rule details

### `sentence-case-heading` (SC001)

Ensures ATX headings (`#`, `##`, etc.) use sentence case formatting, where only the first word is capitalized. This promotes consistency and readability across documentation.

#### Rationale

Sentence case is often preferred in technical documentation because:

* It's easier to read and appears less formal than title case
* It reduces inconsistencies in capitalization decisions
* It aligns with many modern style guides for technical content
* It's easier to maintain consistency across a large documentation set

#### Rule behavior

This rule checks each heading and validates that:

1. The first word's first letter is capitalized
2. All other words are lowercase, with specific exceptions
3. The heading is not entirely in uppercase

#### Correct examples

```markdown
# This is a correct heading
## Another good example with an API reference
# Working with JSON and REST APIs
# I am using proper sentence case
# Using the getUserData() function
```

#### Incorrect examples

```markdown
# This Is Not Correct
## DO NOT USE ALL CAPS
# first word not capitalized
# Sentence with Another capitalized Word
```

#### Rule exceptions

The following exceptions are allowed in sentence case headings:

* Short acronyms (≤ 4 letters) like API, REST, JSON, HTML
* The pronoun "I"
* Words in parentheses (likely code identifiers or technical terms)
* Words within code backticks (preserved as-is)

#### Error messages

The rule provides specific error messages to help users understand the violation:

* "Heading's first word should be capitalized."
* "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym)."
* "Word "X" in heading should be lowercase."
* "Heading should not be in all caps."

#### Implementation details

The rule uses the micromark parser to analyze heading tokens and applies a series of checks to validate sentence case formatting. Content inside backticks or square brackets, version numbers and dates are temporarily preserved so they are not modified. A small dictionary of technical terms and proper nouns is loaded once at module scope for performance. Certain lines in the test fixture are explicitly exempted to demonstrate corner cases.

#### Configuration

Currently, this rule has no configuration options. Future versions may include options to customize acronym length or add a custom dictionary of proper nouns.
