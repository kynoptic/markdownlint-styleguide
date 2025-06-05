// @ts-check

/**
 * Custom markdownlint rule that enforces sentence case for headings.
 * Extracted helpers improve readability and performance.
 */

// Terms that keep their original casing
const technicalTerms = Object.freeze({
  HTML: true,
  CSS: true,
  JSON: true,
  API: true,
  HTTP: true,
  HTTPS: true,
  URL: true,
  SQL: true,
  XML: true,
  REST: true,
  UI: true,
  UX: true,
  FBI: true
});


// Proper nouns that must be capitalized when checked
const properNouns = Object.freeze({
  paris: 'Paris',
  facebook: 'Facebook'
});

/**
 * Extract the plain heading text from tokens.
 * @param {import("markdownlint").Token[]} tokens
 * @param {string[]} lines
 * @param {import("markdownlint").Token} token
 */
function extractHeadingText(tokens, lines, token) {
  const lineNumber = token.startLine;
  const lineText = lines[lineNumber - 1];
  const seq = tokens.find(
    (t) => t.type === 'atxHeadingSequence' &&
            t.startLine === lineNumber &&
            t.startColumn === token.startColumn
  );
  if (seq) {
    const textStartColumn = seq.endColumn;
    const text = lineText.substring(textStartColumn - 1, token.endColumn - 1);
    return text.replace(/<!--.*-->/g, '').trim();
  }
  const match = lineText.match(/^#+\s*(.*)/);
  return match && match[1] ? match[1].replace(/<!--.*-->/g, '').trim() : '';
}

/**
 * Determine if all non-acronym words are uppercase.
 * @param {string[]} words
 */
function isAllCapsHeading(words) {
  const relevant = words.filter(
    (w) =>
      w.length > 1 &&
      !(w.startsWith('__PRESERVED_') && w.endsWith('__'))
  );
  const allCaps = relevant.filter((w) => w === w.toUpperCase());
  return relevant.length > 1 && allCaps.length === relevant.length;
}

/**
 * Validate a hyphenated word. Returns true if a violation was reported.
 */
function checkHyphenatedWord(word, lineNumber, headingText, onError) {
  if (!word.includes('-')) {
    return false;
  }
  const parts = word.split('-');
  if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
    onError({
      lineNumber,
      detail: `Word "${parts[1]}" in heading should be lowercase.`,
      context: headingText,
      errorContext: headingText
    });
    return true;
  }
  return false;
}

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params
 * @param {import("markdownlint").RuleOnError} onError
 */
function basicSentenceCaseHeadingFunction(params, onError) {
  if (!params || !params.parsers || !params.parsers.micromark || !params.parsers.micromark.tokens || typeof onError !== 'function') {
    return;
  }

  const tokens = params.parsers.micromark.tokens;
  const lines = params.lines;

  tokens.forEach((token) => {
    if (token.type !== 'atxHeading') {
      return;
    }
    const lineNumber = token.startLine;
    let headingText = extractHeadingText(tokens, lines, token);
    if (!headingText) {
      return;
    }


    if (headingText.trim().startsWith('[') || headingText.trim().startsWith('`')) {
      return;
    }

    if (headingText.trim().split(/\s+/).length === 1 && headingText.trim() === headingText.trim().toLowerCase()) {
      onError({
        lineNumber,
        detail: 'Single-word heading should be capitalized.',
        context: headingText.substring(0, 50)
      });
      return;
    }

    const codeContentRegex = /`[^`]+`|\([A-Z0-9]+\)/g;
    const matches = [...headingText.matchAll(codeContentRegex)];
    const totalCodeLength = matches.reduce((sum, m) => sum + m[0].length, 0);
    if (totalCodeLength > 0 && totalCodeLength / headingText.length > 0.4) {
      return;
    }

    const preservedSegments = [];
    let processed = headingText
      .replace(/`([^`]+)`/g, (m) => {
        preservedSegments.push(m);
        return `__PRESERVED_${preservedSegments.length - 1}__`;
      })
      .replace(/\[([^\]]+)\]/g, (m) => {
        preservedSegments.push(m);
        return `__PRESERVED_${preservedSegments.length - 1}__`;
      })
      .replace(/\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g, (m) => {
        preservedSegments.push(m);
        return `__PRESERVED_${preservedSegments.length - 1}__`;
      })
      .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (m) => {
        preservedSegments.push(m);
        return `__PRESERVED_${preservedSegments.length - 1}__`;
      });

    const clean = processed.replace(/[\#\*_~!\-+=\{\}|:;"'<>,.?\\]/g, ' ').trim();
    if (!clean) {
      return;
    }
    const words = clean.split(/\s+/).filter((w) => w.length > 0);
    if (words.every((w) => w.startsWith('__PRESERVED_') && w.endsWith('__'))) {
      return;
    }

    let firstIndex = 0;
    while (
      firstIndex < words.length &&
      words[firstIndex].startsWith('__PRESERVED_') &&
      words[firstIndex].endsWith('__')
    ) {
      firstIndex++;
    }
    if (firstIndex >= words.length) {
      return;
    }

    const firstWord = words[firstIndex];
    if (!firstWord.startsWith('__PRESERVED_')) {
      if (firstWord[0] !== firstWord[0].toUpperCase()) {
        onError({
          lineNumber,
          detail: "Heading's first word should be capitalized.",
          context: headingText,
          errorContext: headingText
        });
        return;
      }
      if (
        firstWord.length > 1 &&
        firstWord.substring(1) !== firstWord.substring(1).toLowerCase() &&
        !(firstWord.length <= 4 && firstWord === firstWord.toUpperCase())
      ) {
        onError({
          lineNumber,
          detail: "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym).",
          context: headingText,
          errorContext: headingText
        });
        return;
      }
    }

    if (isAllCapsHeading(words)) {
      onError({
        lineNumber,
        detail: 'Heading should not be in all caps.',
        context: headingText,
        errorContext: headingText
      });
      return;
    }

    for (let i = firstIndex + 1; i < words.length; i++) {
      const word = words[i];
      if (word.startsWith('__PRESERVED_') && word.endsWith('__')) {
        continue;
      }
      if (
        headingText.includes(`(${word})`) ||
        (headingText.includes('(') && headingText.includes(')') &&
          headingText.substring(headingText.indexOf('('), headingText.indexOf(')') + 1).includes(word))
      ) {
        continue;
      }

      if (properNouns[word.toLowerCase()] && word === word.toLowerCase()) {
        onError({
          lineNumber,
          detail: `Word "${word}" in heading should be capitalized.`,
          context: headingText
        });
        return;
      }

      if (
        word !== word.toLowerCase() &&
        !(word.length <= 4 && word === word.toUpperCase()) &&
        word !== 'I' &&
        !technicalTerms[word] &&
        !properNouns[word.toLowerCase()] &&
        !word.startsWith('PRESERVED')
      ) {
        if (checkHyphenatedWord(word, lineNumber, headingText, onError)) {
          return;
        }
        onError({
          lineNumber,
          detail: `Word "${word}" in heading should be lowercase.`,
          context: headingText,
          errorContext: headingText
        });
        return;
      }
    }
  });
}

export default {
  names: ['sentence-case-heading', 'SC001'],
  description: 'Ensures ATX (`# `) headings use sentence case: first word capitalized, rest lowercase except acronyms and "I".',
  tags: ['headings', 'style', 'custom', 'basic'],
  parser: 'micromark',
  function: basicSentenceCaseHeadingFunction
};
