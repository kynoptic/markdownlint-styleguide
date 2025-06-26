/**
 * @fileoverview Rule to enforce that URLs are always wrapped in a proper Markdown link.
 * @author Joseph Casciano
 */

/**
 * @type {import('markdownlint').Rule}
 */
module.exports = {
  names: ["no-bare-urls"],
  description: "Enforce that URLs are always wrapped in a proper Markdown link with descriptive text.",
  tags: ["links", "accessibility"],
  function: function noBareUrls(params, onError) {
    // Regex to find URL-like patterns: http(s)://... or www....
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    let inLink = false;

    params.tokens.forEach((token) => {
      // Track whether we are inside a link to ignore URLs that are already linked
      if (token.type === 'link_open') {
        inLink = true;
      } else if (token.type === 'link_close') {
        inLink = false;
      }

      // This rule only applies to plain text tokens that are not part of a link.
      // URLs within code blocks are implicitly ignored as they are not 'text' tokens.
      if (token.type === 'text' && !inLink) {
        const line = params.lines[token.lineNumber - 1];
        let match;
        while ((match = urlRegex.exec(token.content)) !== null) {
          let bareUrl = match[0];

          // Trim trailing punctuation that is unlikely to be part of the URL itself,
          // such as a period at the end of a sentence.
          const trailingChars = /[.,;!?\)\]\}]$/;
          if (trailingChars.test(bareUrl)) {
            bareUrl = bareUrl.slice(0, -1);
          }

          // Re-verify the match isn't empty after trimming
          if (!bareUrl) continue;

          const column = token.range[0] + match.index;

          onError({
            lineNumber: token.lineNumber,
            detail: `Do not use bare URLs. Wrap "${bareUrl}" in descriptive link text.`,
            context: line,
            range: [column, bareUrl.length],
            fixInfo: {
              editColumn: column,
              deleteCount: bareUrl.length,
              insertText: `link`
            }
          });
        }
      }
    });
  },
};