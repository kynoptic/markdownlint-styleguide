---
description: Creates or appends a custom `markdownlint` rule file in `rules/*.js`, ensuring it adheres to the proper structure with required fields (`names`, `description`, `tags`, `parser`, `function`, etc.). Supports both `micromark` and `markdown-it` parsers and allows reusable lint logic through helper packages.
---

# Create or extend a markdownlint custom rule

1. **Create rule file if not exists** – Check if the rule is already covered by another rule. If not, use terminal to create the specified `.js` file under the `rules/` directory if it doesn't already exist. Add a header comment indicating it's a markdownlint custom rule.

2. **Scaffold rule structure** – Insert or update an exported rule object in the target file using the gathered metadata. If the file already contains an `exports`, convert it to an array of rules if needed.

3. **Implement rule function template** – Generate a rule `function` stub using the selected parser. Prefer the `micromark` parser over `markdownit` or `none`, unless legacy support is required.
   - For `micromark`: iterate over `params.parsers.micromark.tokens` and show a sample blockquote check.
   - For `markdownit`: iterate over `params.parsers.markdownit.tokens` and show a sample blockquote check.
   - For `none`: access `params.lines` and show a basic line-matching example.

4. **Ensure module export is valid** – If the file contains multiple rules, ensure `module.exports` is an array of rule objects. If only one, export it directly. Avoid naming conflicts in `names`.

5. **Validate syntax and structure** – Use a JavaScript parser or `eslint` to ensure the generated rule file is syntactically valid. If errors occur, log and attempt automatic correction (e.g., missing commas, duplicate exports).

6. **Generate test scaffolding (optional)** – If `test/` directory exists, create a placeholder test file (e.g., `test/no-blockquotes.test.js`) with a minimal `markdownlint` test case using this rule.

7. **Final step** – Print a summary of the rule details and location. Recommend adding this rule to `customRules` in the markdownlint configuration and running `markdownlint` on a test markdown file to verify behavior.
