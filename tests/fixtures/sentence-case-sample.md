# ✅ This is a proper sentence case heading <!-- should pass -->

This paragraph contains normal text with no issues. <!-- ✅ -->

## ❌ This Is A Title Case Heading That Should Fail <!-- should fail -->

This paragraph has **Bold Text In Title Case** that should fail the check. <!-- ❌ bold should fail -->

### ✅ Another sentence case heading with JavaScript <!-- should pass -->

This paragraph has **bold text in sentence case** that should pass the check. <!-- ✅ -->

## ❌ ALL CAPS HEADING IS NOT TITLE CASE <!-- should fail -->

This paragraph has **BOLD ALL CAPS** which is not title case. <!-- ❌ bold should fail -->

### ❌ The GitHub API and Node.js Integration Should Fail <!-- should fail (title case, API acronym) -->

This paragraph mentions `file.js` and `src/components` correctly. <!-- ✅ -->

---

# ❌ heading with an API acronym and 123 numbers <!-- should fail (API acronym, numbers) -->

**bold with API** should fail, but **bold text in sentence case** should pass. <!-- ❌/✅ -->

## Heading with punctuation! does it work? <!-- should pass -->

### Heading: with colon and - dash <!-- should pass -->

#### Heading with trailing whitespace <!-- should pass -->

# ✅ Emoji at the start should pass <!-- ✅ (emoji allowed) -->

# ❌ Emoji At The Start Should Fail <!-- ❌ (title case after emoji) -->

# 1. Numbered heading should pass <!-- ✅ (numbered list style) -->

# 2. Numbered Heading Should Fail <!-- ❌ (title case after number) -->

# - Dash at start should pass <!-- ✅ (dash allowed) -->

# - Dash At Start Should Fail <!-- ❌ (title case after dash) -->

# Heading with emoji ✅ in the middle <!-- ✅ (emoji allowed) -->

# Heading With Emoji ❌ In The Middle Should Fail <!-- ❌ (title case with emoji) -->

**BOLD123** should pass. <!-- ✅ -->

**Bold With 123** should fail. <!-- ❌ -->

**bold with a URL <https://foo.com/bar.js>** should pass. <!-- ✅ -->

**bold with `inline code`** should pass. <!-- ✅ -->

**Bold With `Inline Code`** should fail. <!-- ❌ -->

# Heading with `inline code` and src/path <!-- ✅ -->

## Heading With a URL <https://foo.com/bar.js> <!-- ✅ (URL, not a sentence) -->

**Bold with `inline code`** should pass. <!-- ✅ -->
