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
  if (!text) return false;

  // Single words are never title case
  if (!text.includes(" ")) return false;

  // All caps is not title case
  if (text === text.toUpperCase()) return false;

  // Split into words
  const words = text.split(/\s+/);

  // Count capitalized words and total eligible words (excluding first word, small words, acronyms, and proper nouns)
  let capitalizedWordCount = 0;
  let eligibleWordCount = 0;

  // Skip the first word (can be capitalized in sentence case)
  for (let i = 1; i < words.length; i++) {
    const word = words[i];

    // Skip small words, acronyms, and proper nouns
    if (
      word.length <= 2 ||
      word === word.toUpperCase() ||
      isLikelyProperNoun(word)
    ) {
      continue;
    }

    // Count this as an eligible word
    eligibleWordCount++;

    // Check if word starts with capital letter
    if (/^[A-Z][a-z]+/.test(word)) {
      capitalizedWordCount++;
    }
  }

  // If there are no eligible words, it's not title case
  if (eligibleWordCount === 0) return false;

  // Calculate the percentage of eligible words that are capitalized
  const capitalizedPercentage =
    (capitalizedWordCount / eligibleWordCount) * 100;

  // If more than 40% of eligible words are capitalized, it's likely title case
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
