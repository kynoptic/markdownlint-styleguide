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
 * Determine indices of words that are part of multi-word proper nouns.
 *
 * @param {string[]} words - Tokenized heading words.
 * @param {Record<string, string>} nouns - Mapping of proper nouns.
 * @returns {Set<number>} Indices that should be ignored during case checks.
 */
function getProperPhraseIndices(words, nouns) {
  const indices = new Set();
  const lowerWords = words.map((w) => w.toLowerCase());
  Object.keys(nouns).forEach((key) => {
    if (!key.includes(' ')) {
      return;
    }
    const parts = key.split(' ');
    for (let i = 0; i <= lowerWords.length - parts.length; i++) {
      const match = parts.every((p, j) => lowerWords[i + j] === p);
      if (match) {
        for (let j = 0; j < parts.length; j++) {
          indices.add(i + j);
        }
      }
    }
  });
  return indices;
}

/**
 * Validate multi-word proper nouns for correct capitalization.
 *
 * @param {string} text - Original heading text.
 * @param {import('markdownlint').RuleOnError} onError - Callback for violations.
 * @param {number} lineNumber - Line number for error reporting.
 * @returns {boolean} True if a violation was reported.
 */
function validateProperPhrases(text, onError, lineNumber) {
  for (const [phrase, expected] of Object.entries(properNouns)) {
    if (!phrase.includes(' ')) {
      continue;
    }
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    const match = regex.exec(text);
    if (match && match[0] !== expected) {
      onError({
        lineNumber,
        detail: `Phrase "${match[0]}" should be "${expected}".`,
        context: text
      });
      return true;
    }
  }
  return false;
}

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
function checkHyphenatedWord(word, lineNumber, headingText, sourceLine, onError) {
  if (!word.includes('-')) {
    return false;
  }
  const parts = word.split('-');
  if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
    report(
      `Word "${parts[1]}" in heading should be lowercase.`,
      lineNumber,
      headingText,
      sourceLine,
      onError
    );
    return true;
  }
  return false;
}

/**
 * Generate fix information converting a heading to sentence case.
 *
 * @param {string} line - Full heading line from the source.
 * @returns {import('markdownlint').FixInfo | undefined}
 */
function getFixInfo(line) {
  const match = /^(#{1,6})(\s+)(.*)$/.exec(line);
  if (!match) {
    return undefined;
  }
  const prefixLength = match[1].length + match[2].length;
  let lineText = match[3];
  const commentIndex = lineText.indexOf('<!--');
  let text = lineText;
  if (commentIndex !== -1) {
    text = lineText.slice(0, commentIndex).trimEnd();
  }

  const preserved = [];
  const processed = text.replace(/`[^`]+`/g, (m) => {
    preserved.push(m);
    return `__P_${preserved.length - 1}__`;
  });
  const words = processed.split(/\s+/);
  const fixedWords = words.map((w, i) => {
    if (w.startsWith('__P_')) {
      return w;
    }
    const lower = w.toLowerCase();
    if (properNouns[lower]) {
      return properNouns[lower];
    }
    if (technicalTerms[w]) {
      return w;
    }
    if (i === 0) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    if (w.length <= 4 && w === w.toUpperCase() && technicalTerms[w]) {
      return w;
    }
    return w.toLowerCase();
  });
  let fixed = fixedWords.join(' ');
  fixed = fixed.replace(/__P_(\d+)__/g, (_, n) => preserved[Number(n)]);
  return {
    editColumn: prefixLength + 1,
    deleteCount: text.length,
    insertText: fixed
  };
}

/**
 * Report a violation with auto-fix information.
 *
 * @param {string} detail - Description of the issue.
 * @param {number} lineNumber - Line number for context.
 * @param {string} headingText - Heading text in question.
 * @param {string} line - Original source line.
 * @param {import('markdownlint').RuleOnError} onError - Callback for reporting.
 */
function report(detail, lineNumber, headingText, line, onError) {
  onError({
    lineNumber,
    detail,
    context: headingText,
    errorContext: headingText,
    fixInfo: getFixInfo(line)
  });
}

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params
 * @param {import("markdownlint").RuleOnError} onError
 */
function basicSentenceCaseHeadingFunction(params, onError) {
  if (
    !params ||
    !params.parsers ||
    !params.parsers.micromark ||
    !params.parsers.micromark.tokens ||
    !Array.isArray(params.lines) ||
    typeof onError !== 'function'
  ) {
    return;
  }

  const tokens = params.parsers.micromark.tokens;
  const lines = params.lines;

  tokens.forEach((token) => {
    if (token.type !== 'atxHeading') {
      return;
    }
    const lineNumber = token.startLine;
    const sourceLine = lines[lineNumber - 1];
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
      report(
        'Single-word heading should be capitalized.',
        lineNumber,
        headingText.substring(0, 50),
        sourceLine,
        onError
      );
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

    if (validateProperPhrases(headingText, onError, lineNumber)) {
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

    const clean = processed
      .replace(/[\#\*_~!+=\{\}|:;"<>,.?\\]/g, ' ')
      .trim();
    if (!clean) {
      return;
    }
    if (/^\d+[\d./-]*$/.test(clean)) {
      return;
    }
    const words = clean.split(/\s+/).filter((w) => w.length > 0);
    const phraseIgnore = getProperPhraseIndices(words, properNouns);
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
    if (!phraseIgnore.has(firstIndex) && !firstWord.startsWith('__PRESERVED_')) {
      const base = firstWord.split('-')[0];
      const numericPrefixSkipped = firstIndex > 0 && numeric.test(words[0]);
      if (numericPrefixSkipped && startsWithYear) {
        // year-prefixed headings may start with a lowercase word
      } else if (!isSingleWordHyphen && firstWord[0] !== firstWord[0].toUpperCase()) {
        report(
          "Heading's first word should be capitalized.",
          lineNumber,
          headingText,
          sourceLine,
          onError
        );
        return;
      }
      if (
        !technicalTerms[base] &&
        base.length > 1 &&
        base.substring(1) !== base.substring(1).toLowerCase() &&
        !(base.length <= 4 && base === base.toUpperCase()) &&
        !(base === base.toUpperCase() && /\d/.test(base))
      ) {
        report(
          "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym).",
          lineNumber,
          headingText,
          sourceLine,
          onError
        );
        return;
      }
    }

    if (isAllCapsHeading(words)) {
      report(
        'Heading should not be in all caps.',
        lineNumber,
        headingText,
        sourceLine,
        onError
      );
      return;
    }

    const colonIndex = headingText.indexOf(':');
    for (let i = firstIndex + 1; i < words.length; i++) {
      if (phraseIgnore.has(i)) {
        continue;
      }
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
        report(
          `Word "${word}" in heading should be capitalized.`,
          lineNumber,
          headingText,
          sourceLine,
          onError
        );
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
        if (checkHyphenatedWord(word, lineNumber, headingText, sourceLine, onError)) {
          return;
        }
        report(
          `Word "${word}" in heading should be lowercase.`,
          lineNumber,
          headingText,
          sourceLine,
          onError
        );
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
