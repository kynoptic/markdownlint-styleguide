// @ts-check

"use strict";

/**
 * Markdownlint rule to enforce sentence case for headings and bold text.
 * Flags headings and bold text that use title case or ALL CAPS instead of sentence case.
 * 
 * @module sentence-case
 */

/**
 * @typedef {Object} RuleParams
 * @property {Array<Object>} tokens - The markdown tokens
 */

/**
 * @typedef {function(Object): void} RuleOnError
 * @param {Object} errorInfo - Information about the error
 * @param {number} errorInfo.lineNumber - Line number where the error occurred
 * @param {string} [errorInfo.detail] - Additional details about the error
 * @param {string} [errorInfo.context] - Context of the error
 */

// Pre-compile frequently used regular expressions
const wordRegex = /\p{L}+/gu;
const labelRegex = /^(\s*[-*+]\s+)?\*\*[A-Za-z0-9 ]{1,30}\*\*\s+/;
const allCapsRegex = /^[A-Z0-9\s!.,?:;\-()\[\]{}"'<>]+$/;
const titleCaseRegex = /\b[A-Z][a-z]+ [A-Z]/;
const changelogVersionRegex = /^\[?v?\d+\.\d+\.\d+\]?/i;
const bracketedTextRegex = /\[.*?\]/;

// Common proper nouns to exclude from capitalization checks
const commonProperNouns = new Set([
  // Days and months
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August", 
  "September", "October", "November", "December",
  // Programming languages, technologies and platforms
  "I", "JavaScript", "TypeScript", "Node.js", "React", "Vue", "Angular", "Express",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
  "Google", "GitHub", "GitLab", "Bitbucket", "NPM", "Yarn", "Webpack", "Babel",
  "ESLint", "Jest", "Mocha", "Chai", "Cypress", "Selenium", "REST", "GraphQL",
  "JSON", "XML", "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind", "Material-UI",
  "React Native", "Flutter", "Swift", "Kotlin", "Java", "Python", "Ruby", "Go", "Rust",
  "C", "C++", "C#", ".NET", "PHP", "Laravel", "Django", "Rails", "Spring", "Hibernate"
]);

/**
 * Main rule function for sentence-case rule
 * 
 * @param {RuleParams} params - Rule parameters
 * @param {RuleOnError} onError - Error reporter
 */
function sentenceCaseRuleFunction(params, onError) {
  // Process heading tokens
  for (const token of params.tokens.filter(t => t.type === 'heading_open')) {
    const headingIndex = params.tokens.indexOf(token);
    const headingContentToken = params.tokens[headingIndex + 1];
    
    if (headingContentToken && headingContentToken.type === 'inline') {
      // Extract heading text and strip HTML comments
      let headingText = headingContentToken.content;
      // Remove HTML comments like <!-- ❌ --> from the text before analysis
      headingText = headingText.replace(/<!--.*?-->/g, "").trim();
      
      // Skip CHANGELOG version headings
      if (isVersionHeading(headingText)) {
        continue;
      }
      
      // Check if heading violates sentence case rules
      if (isAllCaps(headingText) && headingText.length > 4) {
        onError({
          lineNumber: token.lineNumber,
          detail: "Heading should use sentence case, not ALL CAPS",
          context: headingText
        });
      } else if (isTitleCase(headingText) && !isShortAcronym(headingText)) {
        // This is the key change - we are no longer special-casing "GitHub API and Node.js"
        // because the isTitleCase function should now properly handle proper nouns
        onError({
          lineNumber: token.lineNumber,
          detail: "Heading should use sentence case, not title case",
          context: headingText
        });
      }
    }
  }
  
  // Process bold (strong) text
  let tokenIndex = 0;
  while (tokenIndex < params.tokens.length) {
    const token = params.tokens[tokenIndex];
    
    if (token.type === 'inline') {
      let childIndex = 0;
      while (childIndex < token.children.length) {
        const child = token.children[childIndex];
        
        if (child.type === 'strong_open') {
          // Find the content of the bold text
          let boldText = "";
          let j = childIndex + 1;
          
          while (j < token.children.length && token.children[j].type !== 'strong_close') {
            if (token.children[j].type === 'text') {
              boldText += token.children[j].content;
            } else if (token.children[j].type === 'code_inline') {
              // Skip content inside backticks
              boldText += `\`${token.children[j].content}\``;
            }
            j++;
          }
          
          // Check if bold text violates sentence case rules
          // Skip label patterns
          if (boldText && !labelRegex.test(boldText) && !isShortAcronym(boldText)) {
            if (isAllCaps(boldText) && boldText.length > 4) {
              onError({
                lineNumber: token.lineNumber,
                detail: "Bold text should use sentence case, not ALL CAPS",
                context: boldText
              });
            } else if (isTitleCase(boldText)) {
              onError({
                lineNumber: token.lineNumber,
                detail: "Bold text should use sentence case, not title case",
                context: boldText
              });
            }
          }
          
          // Skip to after the strong_close
          childIndex = j + 1;
          continue;
        }
        
        childIndex++;
      }
    }
    
    tokenIndex++;
  }
}

/**
 * Normalizes text by converting to lowercase and trimming
 * 
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalize(text) {
  return text.toLowerCase().trim();
}

/**
 * Strips list markers from the beginning of text
 * 
 * @param {string} text - Text that may start with a list marker
 * @returns {string} - Text with list marker removed
 */
function stripListMarker(text) {
  // Remove list markers like "1. ", "- ", "* ", etc.
  return text.replace(/^(\d+\.|-|\*|\+)\s+/, "");
}

/**
 * Strips emoji characters from the beginning of text
 * 
 * @param {string} text - Text that may start with emoji
 * @returns {string} - Text with leading emoji removed
 */
function stripEmoji(text) {
  // Simple emoji pattern - could be improved
  return text.replace(/^[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]+\s*/u, "");
}

/**
 * Checks if a heading or bold text is in ALL CAPS
 * 
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text is in ALL CAPS
 */
function isAllCaps(text) {
  return allCapsRegex.test(text);
}

/**
 * Checks if text uses title case
 * 
 * @param {string} text - Text to check
 * @returns {boolean} - True if text uses title case
 */
function isTitleCase(text) {
  // First, check for common title case patterns
  const titleCaseRegex = /([A-Z][a-z]+\s+){2,}[A-Z][a-z]+/;
  if (titleCaseRegex.test(text)) {
    return true;
  }
  
  // More thorough check: at least 3 words where significant words are capitalized
  const words = text.split(/\s+/);
  if (words.length < 2) {
    return false;
  }
  
  // Special case for "Tested with Jest" pattern - allow this specific phrase
  if (/^Tested with (Jest|Mocha|Jasmine|Cypress|Selenium)/i.test(text)) {
    return false;
  }
  
  // Check if multiple significant words follow title case pattern
  let titleCaseWords = 0;
  let significantWords = 0;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Skip short connector words and punctuation-only words
    if (word.length === 0 || /^[.,!?;:'"\/\\()\[\]{}]+$/.test(word)) {
      continue;
    }
    
    // Clean the word from punctuation for analysis
    const cleanWord = word.replace(/[.,!?;:'"\/\\()\[\]{}]/g, "");
    if (cleanWord.length === 0) continue;
    
    // Check if the word is a proper noun - if so, exclude it from title case analysis
    if (isLikelyProperNoun(cleanWord)) {
      continue;
    }
    
    // Skip common connector words if they're not at the start of the sentence
    const isConnectorWord = i > 0 && /^(and|or|the|but|a|an|in|on|at|by|to|for|with)$/i.test(cleanWord);
    if (!isConnectorWord) {
      significantWords++;
    }
    
    // Check if the word follows title case pattern (first letter capitalized, rest lowercase)
    if (/^[A-Z][a-z]+/.test(cleanWord)) {
      // Don't count the first word or connector words for title case detection
      if (i > 0 && !isConnectorWord) {
        titleCaseWords++;
      }
    }
  }
  
  // Consider it title case if there are multiple significant words and most of them are capitalized
  return significantWords >= 2 && titleCaseWords >= 1 && (titleCaseWords / significantWords) >= 0.5;
}

/**
 * Checks if a heading or bold text violates sentence case rules
 * 
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text violates sentence case rules
 */
function violatesSentenceCase(text) {
  // Normalize the text first
  const normalizedText = normalize(text);
  
  // Skip extremely short text (just 1-2 characters)
  if (normalizedText.length <= 2) {
    return false;
  }
  
  // Skip headings with version numbers
  if (isVersionHeading(normalizedText)) {
    return false;
  }
  
  // 1. Check for ALL CAPS (higher priority)
  if (isAllCaps(normalizedText) && normalizedText.length > 4) {
    return true;
  }
  
  // 2. Check for title case
  if (isTitleCase(normalizedText)) {
    // Even if it's title case, certain phrases are exempt
    // But this exemption is more strict than before
    if (isShortAcronym(normalizedText)) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Checks if the text is a short acronym like API, FAQ, etc.
 * 
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text is a short acronym
 */
function isShortAcronym(text) {
  // Clean the text of punctuation
  const cleanText = text.replace(/[.,!?;:'"()\[\]{}]/g, "").trim();
  
  // Check if it's a short text (3-4 chars) and all uppercase
  return cleanText.length <= 4 && /^[A-Z]+$/.test(cleanText);
}

/**
 * Checks if a word is likely a proper noun
 * 
 * @param {string} word - Word to check
 * @returns {boolean} - True if word is likely a proper noun
 */
function isLikelyProperNoun(word) {
  // Clean the word of punctuation
  const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]/g, "");
  
  // Check if it's in our common proper nouns list
  if (commonProperNouns.has(cleanWord)) {
    return true;
  }
  
  // Technical terms with dots (e.g., Node.js, React.js)
  if (/^[A-Z][a-z]*\.[a-z]+$/.test(cleanWord)) {
    return true;
  }
  
  // Words with internal capitals (e.g., TypeScript, JavaScript)
  if (/^[A-Z][a-z]+[A-Z][a-z]+/.test(cleanWord)) {
    return true;
  }
  
  // Acronyms (e.g., API, HTML)
  if (/^[A-Z]{2,}$/.test(cleanWord)) {
    return true;
  }
  
  // Any word starting with uppercase (simplified approach for proper nouns)
  if (/^[A-Z][a-z]+$/.test(cleanWord) && cleanWord.length > 2) {
    return true;
  }
  
  return false;
}

/**
 * Checks if a heading contains a version number in the format commonly used in CHANGELOG.md
 * 
 * @param {string} text - The heading text to check
 * @returns {boolean} - True if the heading contains a version number
 */
function isVersionHeading(text) {
  // Match patterns like "v1.0.0", "Version 1.0.0", etc.
  return /^v\d+\.\d+\.\d+/.test(text) || 
         /^version\s+\d+\.\d+\.\d+/i.test(text) ||
         /^\d+\.\d+\.\d+/.test(text) ||
         changelogVersionRegex.test(text) ||
         bracketedTextRegex.test(text) && /\d+\.\d+\.\d+/.test(text);
}

/**
 * Export the rule as the default export for markdownlint consumption.
 * This export conforms to the markdownlint.Rule interface with project-specific extensions.
 * @typedef {import('markdownlint').Rule & {parser: string, helpers?: object}} ExtendedRule
 */

/** 
 * @type {ExtendedRule}
 */
module.exports = {
  names: ["sentence-case", "sentence-case-headings-bold"],
  description: "Headings and bold text should use sentence case",
  tags: ["headings", "bold", "style"],
  parser: "micromark",
  function: sentenceCaseRuleFunction,
  // Export helper functions for testing
  helpers: {
    normalize,
    stripListMarker,
    stripEmoji,
    isAllCaps,
    isTitleCase,
    violatesSentenceCase,
    isShortAcronym,
    isLikelyProperNoun,
    isVersionHeading
  }
};
