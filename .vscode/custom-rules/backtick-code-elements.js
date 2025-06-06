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
  'Describe/test'
]);
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
      /\b[\w.-]+\.[a-zA-Z0-9]{1,5}\b/g,    // file name with extension
      /\b\w+\([^)]*\)/g                    // simple function or command()
    ];

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
