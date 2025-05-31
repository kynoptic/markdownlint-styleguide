# Sentence-case rule fixture

## Headings that pass

### This is a proper sentence case heading <!-- ✅ -->

### Another heading in sentence case with `code` elements <!-- ✅ -->

### This heading has JavaScript and `npm` in it <!-- ✅ -->

#### Single word heading <!-- ✅ -->

#### API documentation for JavaScript <!-- ✅ -->

## Headings that fail

### This Is A Title Case Heading That Should Fail <!-- ❌ -->

### Another Heading In Title Case <!-- ❌ -->

### The GitHub API and Node.js Integration Should Fail <!-- ❌ -->

#### ALL CAPS IS NOT SENTENCE CASE <!-- ❌ -->

## Bold text that passes

**bold text in sentence case** <!-- ✅ -->
**Bold123** <!-- ✅ -->
**Bold with `inline code`** <!-- ✅ -->

## Bold text that fails

**Bold Text In Title Case** <!-- ❌ -->
**Example With Title Case** <!-- ❌ -->
**BOLD ALL CAPS** <!-- ❌ -->

## Mixed content

This paragraph has **bold text in sentence case** and `code` elements. <!-- ✅ -->
This paragraph has **Bold Text In Title Case** and unwrapped function keyword. <!-- ❌ -->

## Edge cases

Email: <user+test@domain.com> <!-- ✅ -->
