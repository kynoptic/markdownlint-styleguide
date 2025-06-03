# Backtick code elements abbreviation fixture <!-- ✅ -->

## Common abbreviations (should pass)

Common programming languages (e.g., JavaScript, Python) are supported. <!-- ✅ -->
Use statically typed languages (i.e., TypeScript) for better tooling. <!-- ✅ -->
Common keywords (e.g., function, const, let) should be wrapped in backticks. <!-- ✅ for e.g., ❌ for unwrapped code -->

## Abbreviations with code elements (mixed cases)

The following abbreviations should not be flagged, but code elements should be:

- Common keywords (e.g., function, const, let) should be wrapped in backticks. <!-- ✅ for e.g., ❌ for unwrapped code -->
- Supported file types (e.g., .js, .ts, .jsx) should be documented. <!-- ✅ for e.g., ❌ for unwrapped code -->
- Popular frameworks (e.g., React, Vue, Angular) require specific configurations. <!-- ✅ for e.g., ❌ for unwrapped code -->

## Abbreviations in different contexts

- At the beginning of a sentence: E.g., JavaScript is a popular language. <!-- ✅ -->
- In parentheses (e.g., when writing documentation) abbreviations should be ignored. <!-- ✅ -->
- With comma: e.g., function should be properly formatted. <!-- ✅ for e.g., ❌ for unwrapped code -->
- Without comma: e.g. function should be properly formatted. <!-- ✅ for e.g., ❌ for unwrapped code -->

## Other Latin abbreviations

- That is (i.e., in other words) this is an example. <!-- ✅ -->
- For example (e.g., this text) should be clear. <!-- ✅ -->
- And others (etc.) should be considered. <!-- ✅ -->

## Edge cases with abbreviations

Code with e.g. inside: `const example = "e.g., this is an example";` <!-- ✅ -->
Abbreviation with code: e.g., `function` is a keyword in JavaScript. <!-- ✅ -->
Multiple abbreviations: Both i.e. and e.g. are Latin abbreviations. <!-- ✅ -->
