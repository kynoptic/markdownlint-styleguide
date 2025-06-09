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
  FBI: true,
  COVID: true,
  iOS: true,
  macOS: true,
  Markdown: true
});


// Proper nouns that must be capitalized when checked
const properNouns = Object.freeze({
  paris: 'Paris',
  facebook: 'Facebook',
  github: 'GitHub',
  zoloft: 'Zoloft',
  michael: 'Michael',
  andes: 'Andes',
  japanese: 'Japanese',
  windows: 'Windows',
  glossary: 'Glossary',
  'vs code': 'VS Code',
  vscode: 'VS Code'
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
 *
 * @param {string[]} words - Words extracted from the heading.
 * @returns {boolean} True when every relevant word is uppercase.
 */
function isAllCapsHeading(words) {
  const relevant = words.filter(
    (w) =>
      w.length > 1 &&
      !(w.startsWith('__PRESERVED_') && w.endsWith('__'))
  );
  const allCaps = relevant.filter((w) => w === w.toUpperCase());
  return (
    relevant.length > 1 &&
    allCaps.length === relevant.length &&
    !/\d/.test(relevant.join(''))
  );
}

/**
 * Validate a hyphenated word.
 *
 * @param {string} word - Candidate word from the heading.
 * @param {number} lineNumber - Line number for error reporting.
 * @param {string} headingText - Full heading text.
 * @param {import("markdownlint").RuleOnError} onError - Callback to report violations.
 * @returns {boolean} True if a lint error was generated.
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

    // Strip leading emoji or symbol characters before analysis
    headingText = headingText
      .replace(/^[\u{1F000}-\u{1FFFF}\u{2000}-\u{3FFF}\u{FE0F}]+\s*/u, '')
      .trim();
    if (!headingText) {
      return;
    }


    if (headingText.trim().startsWith('[') || headingText.trim().startsWith('`')) {
      return;
    }

    if (
      headingText.trim().split(/\s+/).length === 1 &&
      headingText.trim() === headingText.trim().toLowerCase() &&
      !/[0-9-]/.test(headingText)
    ) {
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

    if (/^[\d./-]+$/.test(headingText.replace(/\s+/g, ''))) {
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

    const clean = processed.replace(/[\#\*_~!\-+=\{\}|:;"<>,.?\\]/g, ' ').trim();
    if (!clean) {
      return;
    }
    if (/^\d+[\d./-]*$/.test(clean)) {
      return;
    }
    const words = clean.split(/\s+/).filter((w) => w.length > 0);
    if (words.every((w) => w.startsWith('__PRESERVED_') && w.endsWith('__'))) {
      return;
    }

    let firstIndex = 0;
    const numeric = /^[-\d.,/]+$/;
    const startsWithYear = /^\d{4}(?:\D|$)/.test(headingText);
    const isSingleWordHyphen = headingText.trim().split(/\s+/).length === 1 && headingText.includes('-');
    while (
      firstIndex < words.length &&
      ((words[firstIndex].startsWith('__PRESERVED_') &&
        words[firstIndex].endsWith('__')) ||
        numeric.test(words[firstIndex]))
    ) {
      firstIndex++;
    }
    if (firstIndex >= words.length) {
      return;
    }

    const firstWord = words[firstIndex];
    if (!firstWord.startsWith('__PRESERVED_')) {
      const base = firstWord.split('-')[0];
      const numericPrefixSkipped = firstIndex > 0 && numeric.test(words[0]);
      if (numericPrefixSkipped && startsWithYear) {
        // year-prefixed headings may start with a lowercase word
      } else if (!isSingleWordHyphen && firstWord[0] !== firstWord[0].toUpperCase()) {
        onError({
          lineNumber,
          detail: "Heading's first word should be capitalized.",
          context: headingText,
          errorContext: headingText
        });
        return;
      }
      if (
        !technicalTerms[base] &&
        base.length > 1 &&
        base.substring(1) !== base.substring(1).toLowerCase() &&
        !(base.length <= 4 && base === base.toUpperCase()) &&
        !(base === base.toUpperCase() && /\d/.test(base))
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

    const colonIndex = headingText.indexOf(':');
    for (let i = firstIndex + 1; i < words.length; i++) {
      const word = words[i];
      const wordPos = headingText.indexOf(word);
      if (colonIndex !== -1 && colonIndex < 10 && wordPos > colonIndex) {
        const afterColon = headingText.slice(colonIndex + 1).trimStart();
        if (afterColon.startsWith(word)) {
          continue; // allow capitalization after colon
        }
      }
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
