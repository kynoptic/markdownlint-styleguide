// @ts-check

/**
 * Rule that requires code snippets, file names and directory paths
 * to be wrapped in backticks when used in prose.
 */
const ignoredTerms = new Set([
  'Node.js',
  'React.js',
  'CI/CD',
  'e.g',
  'e.g.',
  'i.e',
  'i.e.',
  'import/export',
  'pass/fail',
  'kg/m',
  'D.C',
  'M.D'
]);

/**
 * markdownlint rule enforcing backticks around file paths and commands.
 *
 * @param {import('markdownlint').RuleParams} params - Parsed Markdown input.
 * @param {import('markdownlint').RuleOnError} onError - Callback to report violations.
 * @returns {void}
 */
function backtickCodeElements(params, onError) {
  if (!params || !params.lines || typeof onError !== 'function') {
    return;
  }

  const lines = params.lines;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock || /^\s*#/.test(line)) {
      continue;
    }

    const codeSpans = [];
    const spanRegex = /`[^`]+`/g;
    let spanMatch;
    while ((spanMatch = spanRegex.exec(line)) !== null) {
      codeSpans.push([spanMatch.index, spanMatch.index + spanMatch[0].length]);
    }

    const patterns = [
      /\b(?:\.?\/?[\w.-]+\/)+[\w.-]+\b/g, // directory or file path
      /\b(?=[^\d\s])[\w.-]*[a-zA-Z][\w.-]*\.[a-zA-Z0-9]{1,5}\b/g, // file name with letters
      /\b[a-zA-Z][\w.-]*\([^)]*\)/g,       // simple function or command()
      /\B\.[\w.-]+\b/g,                    // dotfiles like .env
      /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g,      // environment variables like NODE_ENV
      /\B--?[a-zA-Z][\w-]*\b/g,             // CLI flags
      /\b(?:npm|yarn|npx|git|pip|python(?:3)?|node|ls|chmod|curl|wget|java|grep|cat|cp|mv|rm)\b[^`]*/g,
                                             // common CLI commands
      /\bimport\s+\w+/g,                     // import statements
      /\b[A-Za-z0-9.-]+:\d+\b/g,            // host:port patterns
      /\b[A-Z]+\+[A-Z]\b/g                  // key combos like CTRL+C
    ];

    const flaggedPositions = new Set();

    const linkRegex = /!?\[[^\]]*\]\([^)]*\)/g;
    const wikiLinkRegex = /!?\[\[[^\]]+\]\]/g;
    /**
     * Determine if an index range is within a Markdown link or image.
     *
     * @param {string} text - Line being evaluated.
     * @param {number} start - Start index of match.
     * @param {number} end - End index of match.
     * @returns {boolean}
     */
    function inMarkdownLink(text, start, end) {
      let m;
      linkRegex.lastIndex = 0;
      while ((m = linkRegex.exec(text)) !== null) {
        if (start >= m.index && end <= m.index + m[0].length) {
          return true;
        }
      }
      return false;
    }

    function inWikiLink(text, start, end) {
      let m;
      wikiLinkRegex.lastIndex = 0;
      while ((m = wikiLinkRegex.exec(text)) !== null) {
        if (start >= m.index && end <= m.index + m[0].length) {
          return true;
        }
      }
      return false;
    }

    function isLikelyFilePath(str) {
      if (!str.includes('/')) {
        return false;
      }
      if (/[A-Z]/.test(str) || /\s/.test(str)) {
        return false;
      }
      const segments = str.split('/');
      if (segments.length < 2) {
        return false;
      }
      if (segments.length === 2 && !/\.[^/]+$/.test(segments[1])) {
        if (segments[0].length <= 2 || segments[1].length <= 2) {
          return false;
        }
      }
      if (/^\d+$/.test(segments[0])) {
        return false;
      }
      return /[a-zA-Z]/.test(str);
    }

    for (const regex of patterns) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const text = match[0];
        const inSpan = codeSpans.some(([s, e]) => start >= s && end <= e);
        if (inSpan) {
          continue;
        }
        if (ignoredTerms.has(text) || ignoredTerms.has(text.replace(/\.$/, ''))) {
          continue;
        }
        const prefix = line.slice(0, start);
        if (/\(https?:\/\/[^)]*$/.test(prefix)) {
          continue;
        }
        if (prefix.includes('http://') || prefix.includes('https://')) {
          continue;
        }
        if (inMarkdownLink(line, start, end) || inWikiLink(line, start, end)) {
          continue;
        }
        if (/^\d+(?:\.\d+)+$/.test(text)) {
          continue;
        }
        if (regex === patterns[0] && !isLikelyFilePath(text)) {
          continue;
        }
        const key = `${start}-${end}`;
        if (flaggedPositions.has(key)) {
          continue;
        }
        flaggedPositions.add(key);
        onError({
          lineNumber,
          detail: `Wrap "${text}" in backticks.`,
          context: line.trim()
        });
        // report only first violation per line
        regex.lastIndex = line.length;
        break;
      }
    }
  }
}

export default {
  names: ['backtick-code-elements', 'BCE001'],
  description: 'Require code snippets, folder names and directories to be wrapped in backticks.',
  tags: ['style', 'code', 'prose'],
  parser: 'micromark',
  function: backtickCodeElements
};
