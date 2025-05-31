# ✅ Should Pass (no lint)

This is a normal paragraph with no issues. <!-- ✅ -->

The file `README.md` and the path `docs/usage` are correct. <!-- ✅ wrapped filename, dir -->

Use `npm install` to install. <!-- ✅ wrapped command -->

Here's a tricky one: `function` in a sentence. <!-- ✅ code wrapped -->

- List item with `file.js` <!-- ✅ wrapped -->

> Blockquote with `src/index.js` <!-- ✅ wrapped -->

A URL: <https://github.com/user/repo/file.js> should be ignored. <!-- ✅ URL ignored -->

A markdown link: [the file.js](file.js) should not be flagged. <!-- ✅ link text -->

**bold text in sentence case** should pass. <!-- ✅ -->

**Bold123** should pass. <!-- ✅ -->

# Heading with `inline code` and src/path <!-- ✅ heading with code and dir -->

**Bold with `inline code`** should pass. <!-- ✅ -->

---

# Should fail (should trigger lint)

# This Is Title Case <!-- ❌ heading should fail (title case) -->

This is a paragraph with a filename example.js that should be wrapped in backticks. <!-- ❌ filename not wrapped -->

**This Is Bold Text In Title Case** which should be flagged. <!-- ❌ bold should fail -->

A directory path like src/components/Button should be wrapped in backticks. <!-- ❌ dir not wrapped -->

Here's some code elements that should be wrapped: function, var, const, import. <!-- ❌ code not wrapped -->

## Another Title Case Heading <!-- ❌ heading should fail (title case) -->

# sentence case heading with ACRONYM and 123 <!-- ❌ heading should fail (acronym, numbers) -->

**Bold With API** should fail. <!-- ❌ bold should fail (API) -->

but docs/usage should fail. <!-- ❌ dir not wrapped -->

but npm install (no backticks) should fail. <!-- ❌ command not wrapped -->

and function as a word. <!-- ❌ code word not wrapped -->

- List item with file.js <!-- ❌ not wrapped -->
- List item with <file.js> <!-- ❌ not wrapped -->

> Blockquote with src/index.js <!-- ❌ not wrapped -->

**BOLD ALL CAPS** should fail. <!-- ❌ bold should fail -->

## Heading With a URL <https://foo.com/bar.js> <!-- ❌ heading should fail (title case) -->
