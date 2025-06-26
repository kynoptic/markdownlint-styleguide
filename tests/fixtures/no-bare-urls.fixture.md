# Fixture for no-bare-urls rule

This is a valid link: [Google](https://www.google.com). <!-- ✅ -->
This is a bare URL: https://www.google.com. <!-- ❌ -->

This is also a bare URL: http://example.com/path. <!-- ❌ -->
And another one: www.anothersite.org. <!-- ❌ -->

URLs inside backticks are fine: `https://api.example.com/v1`. <!-- ✅ -->
A URL in a link is also fine: API docs. <!-- ✅ -->

A fenced code block with a URL is okay. The `curl` command below should not trigger a violation. <!-- ✅ -->
```bash
curl -X POST https://api.example.com/data
```

- Here is a bare URL in a list item: https://github.com for more info. <!-- ❌ -->

This is an autolink and should be allowed: <https://www.example.com>. <!-- ✅ -->

Another bare one for good measure: https://www.github.com. <!-- ❌ -->