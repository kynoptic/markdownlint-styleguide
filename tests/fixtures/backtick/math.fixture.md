# LaTeX Math Expression Test

## Inline math expressions
$x^2 + y^2 = z^2$ is the Pythagorean theorem <!-- ✅ -->
The formula $E = mc^2$ describes the relationship between energy and mass <!-- ✅ -->
Calculate the area using $A = \pi r^2$ <!-- ✅ -->
The limit is expressed as $\lim_{x \to \infty} f(x)$ <!-- ✅ -->

## Block math expressions
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$ <!-- ✅ -->

$$\int_{a}^{b} f(x) dx = F(b) - F(a)$$ <!-- ✅ -->

## Mixed content with math
The function $f(x) = x^2$ has derivative $f'(x) = 2x$ <!-- ✅ -->
For any $x > 0$, the logarithm $\log(x)$ is defined <!-- ✅ -->

## Invalid cases that should still be flagged
The command grep $pattern file.txt should be wrapped in backticks <!-- ❌ -->
Set the variable using export x=$value in your terminal <!-- ❌ -->
