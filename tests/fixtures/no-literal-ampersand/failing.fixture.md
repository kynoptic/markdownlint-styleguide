# Test cases that should fail (violations expected)

This document contains examples that SHOULD trigger the no-literal-ampersand rule.

## Standalone ampersands that need fixing

### In regular text
This is a test & it should be flagged. <!-- ❌ -->

Dogs & cats are both pets. <!-- ❌ -->

### In headings
## Research & Development <!-- ❌ -->

### In list items
- Item one & item two <!-- ❌ -->
- Another item & yet another <!-- ❌ -->

### Multiple ampersands in one line
This has one & this has another & even more. <!-- ❌ -->

### At beginning and end of lines
& this starts with ampersand <!-- ❌ -->
This ends with ampersand & <!-- ❌ -->

### In quotes
"This is a quote & it has an ampersand." <!-- ❌ -->

### Mixed with other content
Visit our website & read the documentation. <!-- ❌ -->

### In table content
| Column 1 | Column 2 & More |
|----------|-----------------|
| Data & Info | More & Data | <!-- ❌ -->

### After punctuation
Check this out, & you'll see what I mean. <!-- ❌ -->

### Before punctuation
This is good & we can continue. <!-- ❌ -->

### Simple cases
A & B <!-- ❌ -->
X & Y <!-- ❌ -->
First & second <!-- ❌ -->