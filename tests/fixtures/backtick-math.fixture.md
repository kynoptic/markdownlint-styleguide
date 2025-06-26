# Math and Code Contexts for backtick-code-elements

This is a LaTeX inline math expression: $x^2 + y^2 = z^2$ <!-- ✅ -->
This is a LaTeX inline math with text: $\text{hello}$ <!-- ✅ -->
This is a LaTeX block math expression:
$$
\int_0^1 x^2 dx
$$ <!-- ✅ -->

Normal sentence with no code or math. <!-- ✅ -->

Some code-like expressions:

`$HOME/bin` is a path. <!-- ✅ -->

LaTeX math with dollar signs: $E = mc^2$ <!-- ✅ -->

A shell command: grep $pattern file.txt <!-- ❌ -->
A shell export: export x=$value <!-- ❌ -->

A math block with text:
$$
\sum_{i=1}^n i = \frac{n(n+1)}{2}
$$ <!-- ✅ -->

Inline math with punctuation: $a+b$, $c-d$. <!-- ✅ -->

