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
    // It captures the URL string, including any trailing punctuation that might be part of the URL
    // or immediately follow it (like a period at the end of a sentence).
    // The fixture implies that trailing punctuation should be part of the detected bare URL.
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    params.tokens.forEach((token, index) => {
      // This rule only applies to plain text tokens.
      // URLs within inline code (`code_inline` tokens) or fenced code blocks (`fence` tokens)
      // are implicitly ignored because their token types are not 'text'.
      if (token.type === 'text') {
        // Get the full line content for context in the error report.
        const line = params.lines[token.lineNumber - 1];

        // Check if this text token is part of an autolink (e.g., <http://example.com>).
        // Autolinks are represented by a 'link_open' token with 'info: "auto"' immediately
        // preceding the 'text' token that contains the URL.
        const prevToken = params.tokens[index - 1];
        if (prevToken && prevToken.type === 'link_open' && prevToken.info === 'auto') {
          // This text token is part of an autolink, which is an allowed exception.
          return;
        }

        // Search for bare URLs within the content of the current text token.
        let match;
        while ((match = urlRegex.exec(token.content)) !== null) {
          const bareUrl = match[0];

          // Calculate the 1-based column number for the start of the bare URL.
          // token.range[0] is the 1-based start column of the token's content within the line.
          // match.index is the 0-based start index of the URL within the token's content.
          const column = token.range[0] + match.index;

          // Report the error. Auto-fix functionality will be added in a later step.
          onError({
            lineNumber: token.lineNumber,
            detail: `Do not use bare URLs. Wrap "${bareUrl}" in descriptive link text.`,
            context: line,
            range: [column, bareUrl.length], // Highlight the bare URL
            fixInfo: {
              deleteCount: bareUrl.length,
              insertText: `link`
            }
          });
        }
      }
    });
  },
};