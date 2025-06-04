// @ts-check

/**
 * Custom markdownlint rule that enforces sentence case for headings.
 * 
 * @param {import("markdownlint").RuleParams} params - The rule parameters from the markdownlint package.
 * @param {import("markdownlint").RuleOnError} onError - Callback to report errors from the markdownlint package.
 */
function basicSentenceCaseHeadingFunction(params, onError) {
  // Ensure necessary parameters and tokens are available
  // This check will now correctly align with the imported types
  if (!params || !params.parsers || !params.parsers.micromark || !params.parsers.micromark.tokens || typeof onError !== 'function') {
    // console.error("basic-sentence-case-heading: Invalid params, parsers, tokens, or onError callback received.");
    return;
  }

  const tokens = params.parsers.micromark.tokens;
  const lines = params.lines;

  tokens.forEach((token, index) => {
    if (token.type === 'atxHeading') {
      const lineNumber = token.startLine;
      const lineText = lines[lineNumber - 1];
      let headingText = "";
      const headingSequenceToken = tokens.find(t => t.type === 'atxHeadingSequence' && t.startLine === lineNumber && t.startColumn === token.startColumn);

      if (headingSequenceToken) {
          const textStartColumn = headingSequenceToken.endColumn;
          headingText = lineText.substring(textStartColumn -1, token.endColumn -1).trim();
      } else {
          const match = lineText.match(/^#+\s*(.*)/);
          if (match && match[1]) {
              headingText = match[1].trim();
          }
      }

      if (!headingText) {
        return;
      }

      // Remove markdown syntax but preserve text in parentheses for checking
      const cleanHeadingText = headingText.replace(/[\#\*`_~\[\]!\-+=\{\}|:;"'<>,.?\\]/g, "").trim();
      if (!cleanHeadingText) {
        return;
      }

      const words = cleanHeadingText.split(/\s+/).filter(word => word.length > 0);

      if (words.length > 0) {
        const firstWord = words[0];
        if (firstWord[0] !== firstWord[0].toUpperCase()) {
          onError({
            lineNumber: lineNumber,
            detail: "Heading's first word should be capitalized.",
            context: cleanHeadingText.substring(0, 50)
          });
          return;
        }

        if (firstWord.length > 1 && firstWord.substring(1) !== firstWord.substring(1).toLowerCase()) {
            if (!(firstWord.length <= 4 && firstWord === firstWord.toUpperCase())) {
                onError({
                    lineNumber: lineNumber,
                    detail: "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym).",
                    context: cleanHeadingText.substring(0, 50)
                });
                return;
            }
        }

        // Check if the entire heading is in all caps (except allowed acronyms)
        const nonAcronymWords = words.filter(word => word.length > 1);
        const allCapsWords = nonAcronymWords.filter(word => word === word.toUpperCase());
        
        // If all non-acronym words are uppercase, it's an all-caps heading
        if (nonAcronymWords.length > 1 && allCapsWords.length === nonAcronymWords.length) {
          onError({
            lineNumber: lineNumber,
            detail: "Heading should not be in all caps.",
            context: cleanHeadingText.substring(0, 50)
          });
          return;
        }
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          
          // Skip words in parentheses (likely code identifiers)
          if (headingText.includes(`(${word})`) || 
              // Handle case where there might be multiple words in parentheses
              (headingText.includes('(') && headingText.includes(')') && 
               headingText.substring(headingText.indexOf('('), headingText.indexOf(')')+1).includes(word))) {
            continue;
          }
          
          // Check if the word should be lowercase
          if (word !== word.toLowerCase()) {
            // Allow short acronyms (≤ 4 letters) and the pronoun "I"
            if (!(word.length <= 4 && word === word.toUpperCase()) && word !== "I") {
              onError({
                lineNumber: lineNumber,
                detail: `Word "${word}" in heading should be lowercase.`,
                context: cleanHeadingText.substring(0, 50)
              });
              return;
            }
          }
        }
      }
    }
  });
}

export default {
  names: ["sentence-case-heading", "SC001"],
  description: "Ensures ATX (`# `) headings use sentence case.",
  tags: ["headings", "style", "custom", "basic"],
  parser: "micromark",
  function: basicSentenceCaseHeadingFunction
};