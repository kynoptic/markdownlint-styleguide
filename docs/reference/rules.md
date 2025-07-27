# Custom rules

This document describes the custom `markdownlint` rules included in this project.

## `sentence-case-heading` (SC001)

Enforces sentence case for all ATX headings. The first word of a heading must be capitalized, and all other words must be lowercase, unless they are proper nouns or acronyms.

### Configuration

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `specialTerms` | `string[]` | `[]` | A list of terms with specific capitalization (e.g., proper nouns, brand names, technical terms). |
| `technicalTerms` | `string[]` | `[]` | **Deprecated:** Use `specialTerms` instead. |
| `properNouns` | `string[]` | `[]` | **Deprecated:** Use `specialTerms` instead. |

**Migration Guide:** If you're using the deprecated `technicalTerms` or `properNouns` options, combine them into a single `specialTerms` array:

```javascript
// Old configuration (deprecated)
{
  "sentence-case-heading": {
    "technicalTerms": ["API", "JavaScript"],
    "properNouns": ["GitHub", "OAuth"]
  }
}

// New configuration (recommended)
{
  "sentence-case-heading": {
    "specialTerms": ["API", "JavaScript", "GitHub", "OAuth"]
  }
}
```

### Examples

**Passing:**

```markdown
# This is a heading

# This is a heading with a Proper Noun
```

**Failing:**

```markdown
# This is a Heading

# this is a heading
```

## `backtick-code-elements` (BCE001)

Requires code snippets, file names, and directory paths to be wrapped in backticks when used in prose. This improves readability and clearly distinguishes code elements from regular text.

### Why wrap code elements in backticks?

Using backticks around code-like elements provides several benefits:

- Improves visual distinction between code and prose
- Follows markdown conventions for inline code
- Enhances readability in documentation
- Helps readers quickly identify technical references
- Prevents ambiguity between file paths and natural language

### How the rule works

The rule identifies code-like patterns that should be wrapped in backticks:

1. **File paths**: Any path containing forward slashes (`src/components/Button.js`)
2. **File names**: Files with extensions (`package.json`, `README.md`)
3. **Dotfiles**: Configuration files starting with a dot (`.env`, `.gitignore`)
4. **Commands**: Shell commands and their arguments (`npm install`, `git clone`)
5. **Environment variables**: All-caps variables with underscores (`NODE_ENV`, `API_KEY`)
6. **Command flags**: Options starting with dashes (`--verbose`, `-f`)
7. **Function calls**: Text with parentheses (`parseInt()`, `console.log()`)
8. **Import statements**: `JavaScript/TypeScript` imports (`import React`)
9. **Key combinations**: Keyboard shortcuts (`CTRL+C`, `ALT+TAB`)
10. **Network addresses**: Host:port patterns (`localhost:3000`)
11. **Shell variables**: Variables starting with `$` (`$HOME`, `$USER`)

The rule intelligently avoids flagging:

- Text already in code blocks or inline code spans
- Content inside markdown links or URLs
- Text within HTML comments
- LaTeX math expressions
- Common English phrases that might look like paths (`read/write`, `pass/fail`)
- Very short ambiguous terms that could be natural language

### Configuration

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (no options) | | | This rule has no configurable options |

### Examples

**Passing:**

```markdown
Install dependencies with `npm install`.

Edit the `package.json` file in your project root.

Set the `NODE_ENV` variable to production.

Use the `--watch` flag for live reloading.

Navigate to `src/components/` directory.

Press `CTRL+S` to save the file.

The server runs on `localhost:3000` by default.

Run `git status` to check changes.

Import React with `import React from 'react'`.

Configure your `.env` file with API keys.
```

**Failing:**

```markdown
Install dependencies with npm install.

Edit the package.json file in your project root.

Set the NODE_ENV variable to production.

Use the --watch flag for live reloading.

Navigate to src/components/ directory.

Press CTRL+S to save the file.

The server runs on localhost:3000 by default.

Run git status to check changes.

Import React with import React from 'react'.

Configure your .env file with API keys.
```

### Error messages

When a violation is detected, the rule provides contextual error messages:

- "Filename '`package.json`' should be wrapped in backticks to distinguish it from regular text"
- "Command '`npm install`' should be wrapped in backticks to distinguish it from regular text"
- "File path 'src/components/`Button.js`' should be wrapped in backticks for clarity and to distinguish it from regular text"
- "Environment variable '`NODE_ENV`' should be wrapped in backticks to indicate it's a system variable"

### Auto-fix

The rule provides intelligent auto-fix support with safety validation:

- **High-confidence fixes**: Clear file paths, commands, and environment variables are automatically fixed
- **Safety validation**: Common English words and ambiguous terms are flagged but not auto-fixed to prevent false positives
- **Context awareness**: The autofix system considers the surrounding text to make better decisions

Running `markdownlint` with the `--fix` option will automatically wrap appropriate code elements in backticks while preserving cases where manual review is needed.

## `no-bare-urls-trap` (BU001)

Prevents bare URLs from appearing in markdown content. URLs must be properly formatted as markdown links or autolinks to improve accessibility and provide better user experience.

### Why avoid bare URLs?

Using proper markdown formatting for URLs provides several benefits:

- **Accessibility**: Screen readers can better interpret and announce links
- **User experience**: Readers can see link destinations before clicking
- **Professional appearance**: Properly formatted links look more polished
- **Markdown compliance**: Follows standard markdown conventions
- **Click tracking**: Allows for better analytics when links have descriptive text

### How the rule works

The rule detects URLs that have been automatically converted to links by markdown processors with linkify enabled. It identifies:

1. **`HTTP/HTTPS` URLs**: Any URL starting with `http://` or `https://`
2. **WWW URLs**: URLs starting with `www.`
3. **Domain URLs**: Basic domain patterns that get auto-linked
4. **IP addresses**: URLs with IP addresses and ports

The rule relies on the markdown processor's linkify feature to identify bare URLs and then flags them for proper formatting.

**Note**: This rule requires the markdown processor to be configured with `{ linkify: true }` to detect bare URLs.

### Configuration

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| (no options) | | | This rule has no configurable options |

### Examples

**Passing:**

```markdown
Visit [our website](https://example.com) for more information.

Check out the documentation at <https://docs.example.com>.

Read more about [API endpoints](https://api.example.com/docs).

Autolink format: <http://example.com/path>

Reference style: [Example Site][1]

[1]: https://example.com
```

**Failing:**

```markdown
Visit https://example.com for more information.

Check out the documentation at https://docs.example.com.

Read more about API endpoints at https://api.example.com/docs.

Simple domain: www.example.org

IP address: http://192.168.1.1:8080

Protocol with path: http://example.com/api/v1/users
```

### Error messages

When a violation is detected, the rule reports:

- "Bare URL used."

### Recommended fixes

When a bare URL is detected, consider these options:

1. **Descriptive link**: `[Visit our website](https://example.com)`
2. **Autolink**: `<https://example.com>`
3. **Reference style**: `[website][1]` with `[1]: https://example.com`

Choose the format that best fits your content:

- Use descriptive links when the link text should be meaningful
- Use autolinks when the URL itself is the important information
- Use reference style for multiple references to the same URL


## `no-literal-ampersand` (NLA001)

Flags standalone ampersands (&) and provides autofix to replace them with "and". This improves readability and follows common writing conventions.

### Why avoid literal ampersands?

Using "and" instead of "&" in prose provides several benefits:

- Improves readability and follows standard writing conventions
- Avoids confusion with HTML entities and code syntax
- Makes text more accessible to screen readers
- Maintains consistency in technical documentation

### How the rule works

The rule identifies standalone ampersands that are:

1. Surrounded by whitespace or at line boundaries
2. Not inside code blocks, inline code, or HTML contexts
3. Not part of HTML entities or special markup
4. Not inside markdown links or URLs

### Examples

**Passing:**

```markdown
Use `&` operator for bitwise operations
Check &amp; and &lt; entities
[Johnson & Johnson](https://jnj.com)
Visit https://example.com/search?q=cats&dogs
Use R&D for research
```

**Failing:**

```markdown
Dogs & cats are pets
Research & Development
- Item one & item two
This & that example
```

### Error messages

When a violation is detected, the rule reports:

- "Use 'and' instead of literal ampersand (&)"

### Auto-fix

The rule provides auto-fix support. Running `markdownlint` with the `--fix` option will automatically replace standalone ampersands with "and".
