# no-bare-urls test fixture

## Valid cases (should not trigger the rule)

This is a regular sentence with no URLs. <!-- ✅ -->

### Code blocks

A URL inside an inline code block: `http://example.com`. <!-- ✅ -->

Another one: `www.example.org/path`. <!-- ✅ -->

```javascript
// Fenced code block
const url = "https://code.example.net"; <!-- ✅ -->
console.log(url);
```

    This is an indented code block: http://indented.com <!-- ✅ -->

### Links

A URL that is already a Markdown link: Example. <!-- ✅ -->

Another linked URL: My Website. <!-- ✅ -->

Reference style link: [Reference][1]. <!-- ✅ -->

[1]: http://reference.com

Autolink: <http://autolink.net>. <!-- ✅ -->

### URLs with

A URL used as link text is also fine: http://api.example.com. <!-- ✅ -->

### Non-URLs

This is not a URL: my.domain.com/file.txt <!-- ✅ -->

## Invalid cases (should trigger the rule)

### Basic URLs

Visit our site at http://bare.com. <!-- ❌ fix: Visit our site at link. -->

Check out https://another.org/path. <!-- ❌ fix: Check out link. -->

More info at www.info.net. <!-- ❌ fix: More info at link. -->

A URL with an IP address: http://127.0.0.1. <!-- ❌ fix: A URL with an IP address: link. -->

A URL with a port: http://localhost:3000/status. <!-- ❌ fix: A URL with a port: link. -->

### URLs with query strings and fragments

With query string: http://example.com/search?q=test&page=2. <!-- ❌ fix: With query string: link. -->

With fragment: https://example.com/docs#section-one. <!-- ❌ fix: With fragment: link. -->

### Positional cases

A URL at the beginning: http://start.com is here. <!-- ❌ fix: link is here. -->

In the middle: This is http://middle.com in the text. <!-- ❌ fix: In the middle: This is link in the text. -->

At the end: End of line with www.end.org. <!-- ❌ fix: At the end: End of line with link. -->

### Multiple URLs

Multiple URLs: http://first.com and https://second.org. <!-- ❌ fix: Multiple URLs: link and link. -->

### URLs with surrounding punctuation

URL with trailing period: Go to http://period.com. <!-- ❌ fix: Go to link. -->

URL with trailing comma: See http://comma.org, then continue. <!-- ❌ fix: See link, then continue. -->

URL with trailing question mark: Is it http://question.com? <!-- ❌ fix: Is it link? -->

URL surrounded by parentheses: (http://paren.net). <!-- ❌ fix: (link). -->

A URL ending in a paren that is part of the URL: https://en.wikipedia.org/wiki/Link_(The_Legend_of_Zelda). <!-- ❌ fix: A URL ending in a paren that is part of the URL: link). -->

### URLs with surrounding markdown

In a list item: - https://github.com. <!-- ❌ fix: In a list item: - link. -->

In emphasis: *http://italic.com*. <!-- ❌ fix: In emphasis: *link*. -->

In strong emphasis: **http://bold.com**. <!-- ❌ fix: In strong emphasis: **link**. -->