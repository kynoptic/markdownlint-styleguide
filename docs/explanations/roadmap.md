# Project roadmap

- [x] **Improved test coverage** – Add edge case fixtures to better exercise rule logic. Ensure each rule has comprehensive Jest tests.
- [x] **Documentation clean up** – Consolidate existing docs and add usage examples showing common configurations.
- [ ] **Automated release process** – Set up CI scripts to publish to `npm` and generate changelogs.
- [ ] **VS Code extension integration** – Provide steps and configuration for bundling these rules into a VS Code extension.
- [x] **Simplify test structure** – Map each fixture to a dedicated test file.
- [ ] **Enhanced documentation** – Add missing JSDoc comments for functions and utilities.
- [x] **Folder-level READMEs** – Document purpose and usage for each subdirectory.

---

## Next rule proposal: `no-bare-urls`

You make an excellent point. The imperative mood rule is powerful, but its contextual nature—determining *when* a list is truly procedural—adds significant complexity. A simpler, yet still highly valuable, rule would be a better next step.

### Rule description: `no-bare-urls`

**Enforce that URLs are always wrapped in a proper Markdown link with descriptive text. The only exception would be in code blocks or for URLs that are meant to be displayed as literal text.**

- **Why it's a great next step:** It's purely structural and requires no complex language analysis. It has a massive impact on readability and accessibility for a very low implementation cost.
- **Why it's easier:** You don't need to understand the *intent* of a sentence. You simply need to find a pattern (a URL-like string) that isn't already part of a Markdown link or inside a code `span/block`.

### The real-world value

This rule instantly elevates the quality and usability of a document.

**Without the rule (ugly and unhelpful):**

> For more information on deployment, see [https://github.com/my-org/my-project/blob/main/docs/DEPLOYMENT.md](https://www.google.com/search?q=https://github.com/my-org/my-project/blob/main/docs/DEPLOYMENT.md). You can find the release notes at [https://github.com/my-org/my-project/releases/tag/v1.2.3](https://www.google.com/search?q=https://github.com/my-org/my-project/releases/tag/v1.2.3).

This is hard to read, and the long URLs break the flow of the text. It also fails accessibility standards, as screen readers will read out the entire long, nonsensical URL string.

**With the rule (clean and accessible):**

> For more information on deployment, see the [deployment guide](https://www.google.com/search?q=https://github.com/my-org/my-project/blob/main/docs/DEPLOYMENT.md). You can find the release notes for [version 1.2.3](https://www.google.com/search?q=https://github.com/my-org/my-project/releases/tag/v1.2.3).

This is vastly more readable and professional. Screen readers announce "link, deployment guide," which is infinitely more useful.

### High-level implementation strategy (it's much simpler)

1. **Iterate through text tokens** – Your rule function will receive tokens from the parser. You only need to look at tokens of type `text`.
2. **Use a Regex to Find URLs** – In each text token, use a reliable regular expression to find URL-like patterns (those starting with `http://`, `https://`, or even `www.`).
3. **Check the Context** – When you find a potential bare URL, you only need to confirm two things:
      - It is **not** inside an inline code span (` `` `).
      - It is **not** inside a link's text or destination (i.e., `[already a link](...)`).
        The markdownlint `params` object and token stream make this context easy to check. You can see if the text token is preceded by a `link_open` token or a `code_inline` token.
4. **Report the Error** – If you find a URL in a plain text token, report an error.

That's it. There's no need to maintain verb lists, parse sentence structure, or guess if a list is procedural.

### Auto-fix potential: extremely high and safe

This is one of the easiest rules to auto-fix safely.

- **The fix** – When a bare URL is found, the `fixInfo` object will replace the URL string with a basic Markdown link.
- **Implementation:**
  - `deleteCount`: `url.length`
  - `insertText`: `[link](${url})`

You can use a simple placeholder like `[link]` or `[URL]` and let the author fill in a more descriptive name later. This immediately fixes the structural and accessibility problem, even if the text isn't perfect yet.

```javascript
// Example of the onError call
onError({
  lineNumber,
  detail: `Do not use bare URLs. Wrap "${bareUrl}" in descriptive link text.`,
  context: line,
  fixInfo: {
    editColumn: match.index + 1,
    deleteCount: bareUrl.length,
    insertText: `[link](${bareUrl})`
  }
});
```

This `no-bare-urls` rule is the perfect blend of high-impact and low-complexity, making it an ideal next addition to your excellent project.

---

## Current plan (as of 2025-06-24)

### Phase 1: `backtick-code-elements` enhancements

- Fix Jest ES Module support
- Refine file path regex
- Expand `ignoredTerms` and refactor
- Enhance LaTeX context awareness

### Phase 2: auto-fix implementation

- Project maintenance (disable MD013, fix dependencies)
- Implement auto-fix for `backtick-code-elements`
- Fix Jest test runner regression
- Run all tests to ensure no regressions
- [x] Implement auto-fix for `basic-sentence-case-heading`

### Phase 3: rule enhancements & configuration

- Expand `properNouns` and `technicalTerms`
- Strengthen single-word heading suggestions
- Make rules configurable

### Phase 4: finalization

- Review and update documentation
- Final run of all tests
- Prepare for final commit and release

### Phase 5: implement 'no-bare-urls' rule

- Create test assets for `no-bare-urls` rule
- Implement rule logic to find bare URLs in text tokens, ignoring code blocks and existing links
- Implement auto-fix functionality to wrap bare URLs in a Markdown link
