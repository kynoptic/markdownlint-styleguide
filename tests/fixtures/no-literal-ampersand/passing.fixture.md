# Test cases that should pass (no violations)

This document contains examples that should NOT trigger the no-literal-ampersand rule.

## Valid uses of ampersand

### HTML entities
Here are some HTML entities: &amp; &lt; &gt; &quot; &apos; &#123; <!-- ✅ -->

### Inline code
This code has an ampersand: `function test() { return a & b; }` <!-- ✅ -->

### Code blocks
```javascript
function bitwiseAnd(a, b) {
    return a & b;
}
```

```bash
grep "pattern" file.txt | head && tail
```

    // Indented code block
    if (condition & mask) {
        return true;
    }

### Inside links
[Research & Development](https://example.com/r&d) <!-- ✅ -->
[Johnson & Johnson](https://jnj.com) <!-- ✅ -->

### Inside link text
[This & That](example.com) <!-- ✅ -->

### Inside URLs
Visit https://example.com/search?q=cats&dogs for more info. <!-- ✅ -->

### Combined with other punctuation (not standalone)
- Use R&D for research <!-- ✅ -->
- Visit the B&B <!-- ✅ -->
- Check Q&A section <!-- ✅ -->
- AT&T services <!-- ✅ -->

### Combined with other punctuation (standalone)
- P&G products <!-- ✅ -->

### In HTML tags
<div class="red & blue">Content</div> <!-- ✅ -->
<img src="image.jpg" alt="cats & dogs" /> <!-- ✅ -->

### Mathematical expressions in LaTeX
$a \& b$ and $x \& y$ <!-- ✅ -->

### Special cases
Email addresses like user@domain.com and user2@domain.com are valid. <!-- ✅ -->