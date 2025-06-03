# Backtick code elements rule fixture

## Filenames (should pass)

The file `example.js` contains JavaScript code. <!-- ✅ -->
Check out `README.md` for more information. <!-- ✅ -->
The file `README.md` and the path `docs/usage` are correct. <!-- ✅ -->

- List item with `file.js` <!-- ✅ -->

> Blockquote with `src/index.js` <!-- ✅ -->
>
## Filenames (should fail)

The file example.js contains JavaScript code. <!-- ❌ -->
Check out README.md for more information. <!-- ❌ -->
The file example.js contains JavaScript code. <!-- ❌ -->

- file.js <!-- ❌ -->
- <file.js> <!-- ❌ -->

## Directory paths (should pass)

The directory `src/components` contains React components. <!-- ✅ -->
Look in the `tests/unit/` directory. <!-- ✅ -->
The file `README.md` and the path `docs/usage` are correct. <!-- ✅ -->
A heading with `inline code` and properly wrapped `src/path` <!-- ✅ -->

## Directory paths (should fail)

The directory src/components contains React components. <!-- ❌ -->
Look in the tests/unit/ directory. <!-- ❌ -->
You can find components in the src/components directory. <!-- ❌ -->
The file `README.md` is correct, but src/components should be wrapped. <!-- ❌ -->
> Blockquote with src/index.js and `src/index.js` <!-- ❌ -->
>
## Code elements (should pass)

Use the `function` keyword to define functions. <!-- ✅ -->
Use `const` for constants and `let` for variables. <!-- ✅ -->
Install packages using `npm` or `yarn`. <!-- ✅ -->
Here's a tricky one: `function` in a sentence. <!-- ✅ -->
More content with `example.js` file reference. <!-- ✅ -->
Content with proper nouns and code elements. <!-- ✅ -->
**Bold with `inline code`** should pass. <!-- ✅ -->

## Code elements (should fail)

Use the function keyword to define functions. <!-- ❌ -->
Use const for constants and let for variables. <!-- ❌ -->
Install packages using npm or yarn. <!-- ❌ -->
A paragraph with multiple issues: const, let, and file.js all need backticks. <!-- ❌ -->
This paragraph has **Bold Text In Title Case** and unwrapped function keyword. <!-- ❌ -->

## URLs, links, and emails (should pass)

Visit <https://example.com/path/to/file.js> for more information. <!-- ✅ -->
Check <http://github.com/user/repo/blob/main/src/index.js> for the source code. <!-- ✅ -->
A URL: <https://github.com/user/repo/file.js> should be ignored. <!-- ✅ -->
A markdown link: [the file.js](file.js) should not be flagged. <!-- ✅ -->
Bare URL: <https://foo.com/bar.js> should not be flagged. <!-- ✅ -->
Email: <user+test@domain.com> should not be flagged. <!-- ✅ -->

## Mixed content and edge cases

This paragraph has `example.js` (correct) but also has function and const keywords that should be wrapped. <!-- ❌ -->
A paragraph with multiple issues: const, let, and file.js all need backticks. <!-- ❌ -->

## Lists and blockquotes

- List item with file.js <!-- ❌ -->
- List item with `file.js` <!-- ✅ -->
- List item with <file.js> <!-- ❌ -->

> Blockquote with src/index.js and `src/index.js` <!-- ❌ -->
>
> Blockquote with `src/index.js` <!-- ✅ -->
>
## Documentation phrases with code keywords (should pass)

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), the popular Markdown/CommonMark linter. <!-- ✅ -->
Or use npm script: <!-- ✅ -->
You can install using npm or yarn. <!-- ✅ -->
This is a test for the git workflow. <!-- ✅ -->

- Detects filenames (e.g., `example.js`) <!-- ✅ -->
- Detects directory paths (e.g., `src/components/`) <!-- ✅ -->
- Detects code keywords (e.g., `function`, `const`, `import`) <!-- ✅ -->
- [`markdownlint-absolute.js`](./markdownlint-absolute.js): Like `markdownlint.js`, but uses absolute paths for custom rules—helpful if your config is loaded from outside the package root. <!-- ✅ -->

## Proper nouns and technology names (should pass)

You can use Node.js or React.js for this project. <!-- ✅ -->

- **From JavaScript code (Node.js)**: <!-- ✅ -->
Data from the API is processed by the application. <!-- ✅ -->
VSCode automatically checks Markdown files as you type. It reads settings from `.vscode/settings.json`. <!-- ✅ -->

## Bold phrases as labels (should pass)

- **Tested with Jest** ensures rules are working as expected. <!-- ✅ -->

## Proper nouns and keywords (should fail)

You can use Nodejs or Reactjs for this project. <!-- ❌ -->
VSCode automatically checks Markdown files as you type. It reads settings from .vscode/settings.json. <!-- ❌ -->
Data from API is processed by the application. <!-- ❌ -->

- **Tested With Jest** ensures rules are working as expected. <!-- ❌ -->

## CHANGELOG entries (should pass)

- Added `index.js` to allow usage as an npm package. <!-- ✅ -->
- Added `package.json` and updated `README.md` <!-- ✅ -->
- Implemented JSDoc comments for improved code understanding. <!-- ✅ -->

## CHANGELOG entries (should fail)

- Added index.js to allow usage as an npm package. <!-- ❌ -->
- Updated package.json and README.md <!-- ❌ -->
`function`: The rule implementation function <!-- ✅ -->
This paragraph has **bold text in sentence case** and `code` elements. <!-- ✅ -->

## Special formats

Code block (should be ignored):

```javascript
import foo from './foo.js';
const path = 'src/components';
```
