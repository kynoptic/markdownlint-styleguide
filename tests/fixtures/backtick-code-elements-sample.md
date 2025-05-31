# Backtick code elements sample

## Should pass (no lint)

The file `example.js` contains JavaScript code. <!-- ✅ filename wrapped -->

You can find components in the `src/components` directory. <!-- ✅ dir wrapped -->

Use the `function` keyword to define functions in JavaScript. <!-- ✅ code word wrapped -->

Use `const` for constants and `let` for variables. <!-- ✅ code words wrapped -->

Install packages using `npm` or `yarn`. <!-- ✅ commands wrapped -->

A markdown link: [the file.js](file.js) should not be flagged. <!-- ✅ link text -->

A code block:

```javascript
import foo from './foo.js';
const path = 'src/components';
```
<!-- ✅ code block should not trigger -->

Visit <https://example.com/path/to/file.js> for more information. <!-- ✅ URL ignored -->

Check <http://github.com/user/repo/blob/main/src/index.js> for the source code. <!-- ✅ URL ignored -->

Bare URL: <https://foo.com/bar.js> should not be flagged. <!-- ✅ URL ignored -->

Email: <user+test@domain.com> should not be flagged. <!-- ✅ email ignored -->

## Should fail (should trigger lint)

The file example.js contains JavaScript code. <!-- ❌ filename not wrapped -->

You can find components in the src/components directory. <!-- ❌ dir not wrapped -->

Use the function keyword to define functions in JavaScript. <!-- ❌ code word not wrapped -->

Use const for constants and let for variables. <!-- ❌ code words not wrapped -->

Install packages using npm or yarn. <!-- ❌ commands not wrapped -->

A tricky one: file.js, `file.js`, and <file.js> in a list:

- file.js <!-- ❌ not wrapped -->
- `file.js` <!-- ✅ wrapped -->
- <file.js> <!-- ❌ not wrapped -->

> Blockquote with src/index.js and `src/index.js` <!-- ❌ first not wrapped, second wrapped -->

The file `example.js` is good, but file.js needs backticks. <!-- ❌ file.js not wrapped -->

Check `src/components` and also check tests/unit for tests. <!-- ❌ tests/unit not wrapped -->

A sentence with function as a word and `function` as code. <!-- ❌ 'function' as word not wrapped -->
