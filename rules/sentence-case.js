// @ts-check

"use strict";

/**
 * Sentence case rule for markdownlint
 *
 * @description Enforces sentence case for headings and bold text instead of title case
 * @module sentence-case-headings-bold
 * @example
 * // Incorrect (will be flagged)
 * # This Is Title Case
 * Some text with **Title Case Bold Text** here
 *
 * // Correct (will not be flagged)
 * # This is sentence case
 * Some text with **bold text in sentence case** here
 */

module.exports = {
  names: ["sentence-case-headings-bold"],
  description: "Headings and bold text must use sentence case (not title case)",
  tags: ["headings", "bold", "case"],
  information: new URL("https://github.com/DavidAnson/markdownlint"),
  /**
   * Rule implementation function
   * 
   * @param {Object} params - Parameters object from markdownlint
   * @param {Array} params.tokens - Tokens from markdown-it
   * @param {Function} onError - Callback to report errors
   */
  function: function rule(params, onError) {
    // Initialize state
    const tokens = params.tokens;

    // Walk through all tokens
    tokens.forEach(function forToken(token, idx) {
      // Check headings
      if (token.type === "heading_open") {
        const inline = tokens[idx + 1];
        if (inline && inline.type === "inline") {
          const text = inline.content.trim();
          if (text && isDefinitelyTitleCase(text)) {
            onError({
              lineNumber: token.lineNumber,
              detail: "Heading is not in sentence case",
              context: text,
            });
          }
        }
      }

      // Check bold text
      if (token.type === "inline" && token.children) {
        token.children.forEach(function forChild(child) {
          if (child.type === "strong_open") {
            const boldIdx = token.children.indexOf(child);
            const boldTextToken = token.children[boldIdx + 1];
            if (boldTextToken && boldTextToken.type === "text") {
              const boldText = boldTextToken.content.trim();
              // Only flag if it's clearly title case (multiple capitalized words)
              if (boldText && isDefinitelyTitleCase(boldText)) {
                onError({
                  lineNumber: token.lineNumber,
                  detail: "Bold text is not in sentence case",
                  context: boldText,
                });
              }
            }
          }
        });
      }
    });
  },
};

/**
 * Checks if text is definitely in title case (not sentence case)
 * This is a more strict check that only flags clear title case patterns
 * @param {string} text - The text to check
 * @returns {boolean} - True if definitely title case
 */
function isDefinitelyTitleCase(text) {
  // Empty text is fine
  if (!text) {
    return false;
  }

  // Preprocess text to remove leading list markers (e.g., "1. ", "- ")
  // This ensures "Installation" in "1. Installation" is treated as the first word
  // of the actual content.
  let processedText = text.replace(/^\d+\.\s+/, ""); // Step 1: Try to remove numbered list marker
  processedText = processedText.replace(/^[\u002D*+]\s+/, ""); // Step 2: Try to remove bullet list marker
  // Step 3: Try to remove leading emojis (broad range, includes symbols, pictographs, transport, etc.)
  processedText = processedText.replace(/^[\u{1F000}-\u{1FFFF}\u{2000}-\u{3FFF}]\s*/u, "").trim();

  // If, after removing a potential marker, the text is empty (e.g., original was "1. ")
  // or contains no spaces (e.g., original was "Word" or "1. Word" becoming "Word"),
  // it's not considered title case.
  if (!processedText || !processedText.includes(" ")) {
    // This log is now less relevant as the main check is the output of the function for the specific input
    return false;
  }

  // All caps is not sentence case (e.g. "THIS IS ALL CAPS" after marker removal)
  if (processedText === processedText.toUpperCase()) {
    return true; // Flag all-caps headings as violations
  }

  // Split the processed text into words
  const words = processedText.split(/\s+/);

  // At this point, 'words' will have at least two elements because
  // !processedText.includes(" ") was false earlier.

  // Count capitalized words and total eligible words
  // The first word of 'processedText' (words[0]) can be capitalized in sentence case.
  // We check words from words[1] onwards.
  let capitalizedWordCount = 0;
  let eligibleWordCount = 0;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];

    // Skip small words (e.g., "a", "is", "to"), acronyms (e.g., "API"), and likely proper nouns (e.g., "JavaScript")
    if (
      word.length <= 2 || // Handles very short words, often articles/prepositions
      word === word.toUpperCase() || // Handles acronyms
      isLikelyProperNoun(word) // Handles known proper nouns or patterns
    ) {
      continue;
    }

    eligibleWordCount++;

    // Check if the word starts with a capital letter followed by lowercase letters
    if (/^[A-Z][a-z]+/.test(word)) {
      capitalizedWordCount++;
    }
  }

  // If there are no "eligible" words to check (e.g., "First Word an API the"), it's not title case.
  if (eligibleWordCount === 0) {
    return false;
  }

  // Calculate the percentage of eligible (non-first, non-proper/acronym, non-small) words that are capitalized.
  const capitalizedPercentage = (capitalizedWordCount / eligibleWordCount) * 100;

  // If more than 40% of these eligible words are capitalized, it's likely title case.
  return capitalizedPercentage > 40;
}

/**
 * Checks if a word is likely a proper noun (very basic check)
 * @param {string} word - The word to check
 * @returns {boolean} - True if likely a proper noun
 */
function isLikelyProperNoun(word) {
  // Only consider capitalized words as potential proper nouns
  if (!/^[A-Z]/.test(word)) return false;

  // Check if the word is an acronym (all caps)
  if (word === word.toUpperCase() && word.length > 1) return true;

  // Check if it's a compound word with internal caps (e.g., MarkdownLint)
  if (word.length > 2 && /^[A-Z][a-z]+[A-Z]/.test(word)) return true;

  // This is a very basic check - in a real implementation,
  // you might use a dictionary of common proper nouns
  const commonProperNouns = [
    // Days and months
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    // Programming languages, technologies and platforms
    "I",
    "JavaScript",
    "TypeScript",
    "GitHub",
    "VSCode",
    "Markdown",
    "Node",
    "Python",
    "Java",
    "HTML",
    "CSS",
    "API",
    "JSON",
    "XML",
    "YAML",
    "React",
    "Angular",
    "Vue",
    "Windows",
    "Mac",
    "Linux",
    "Unix",
    "Internet",
    "Web",
    // Project-specific terms
    "Windsurf",
    "MarkdownLint",
    "Mocha",
    "NPM",
    "Yarn",
    "Git",
  ];

  return commonProperNouns.includes(word);
}
