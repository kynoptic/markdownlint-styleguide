// @ts-check

/**
 * Token extraction module for sentence-case-heading rule.
 * Handles parsing and extracting plain text from ATX headings.
 */

/**
 * Extract the plain heading text from tokens.
 * @param {object[]} tokens - Array of micromark tokens
 * @param {string[]} lines - Array of source lines
 * @param {object} token - The current ATX heading token
 * @returns {string} The extracted heading text (HTML comments stripped, whitespace trimmed)
 */
export function extractHeadingText(tokens, lines, token) {
  const lineNumber = token.startLine;
  const lineText = lines[lineNumber - 1];

  // Try to find the atxHeadingSequence token (the # sequence)
  const seq = tokens.find(
    (t) => t.type === 'atxHeadingSequence' &&
           t.startLine === lineNumber &&
           t.startColumn === token.startColumn
  );

  if (seq) {
    // Use sequence end column to determine where text starts
    const textStartColumn = seq.endColumn;
    const text = lineText.substring(textStartColumn - 1, token.endColumn - 1);
    return text.replace(/<!--.*-->/g, '').trim();
  }

  // Fallback: use regex to extract text after the # sequence
  const match = lineText.match(/^#+\s*(.*)/);
  return match && match[1] ? match[1].replace(/<!--.*-->/g, '').trim() : '';
}
