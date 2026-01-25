import { lint } from 'markdownlint/promise';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import { glob } from 'glob';

// Import our custom rules
import backtickCodeElements from '../src/rules/backtick-code-elements.js';
import sentenceCaseHeading from '../src/rules/sentence-case-heading.js';
import noBareUrls from '../src/rules/no-bare-urls.js';
import noDeadInternalLinks from '../src/rules/no-dead-internal-links.js';
import noLiteralAmpersand from '../src/rules/no-literal-ampersand.js';

async function main() {
  const repoPath = process.argv[2];
  const files = await glob(`${repoPath}/**/*.md`, { ignore: ['**/node_modules/**'] });

  const violations = {
    'sentence-case-heading': [],
    'backtick-code-elements': [],
    'no-bare-url': [],
    'no-dead-internal-links': [],
    'no-literal-ampersand': []
  };

  const batchSize = 20;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    for (const file of batch) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const results = await lint({
          strings: { content },
          config: {
            default: false,
            'sentence-case-heading': true,
            'backtick-code-elements': true,
            'no-bare-url': true,
            'no-dead-internal-links': true,
            'no-literal-ampersand': true
          },
          customRules: [
            backtickCodeElements,
            sentenceCaseHeading,
            noBareUrls,
            noDeadInternalLinks,
            noLiteralAmpersand
          ],
          markdownItFactory: () => new MarkdownIt({ linkify: true })
        });

        for (const v of results.content || []) {
          const ruleName = v.ruleNames[0];
          if (violations[ruleName]) {
            violations[ruleName].push({
              file: file.replace(repoPath + '/', ''),
              line: v.lineNumber,
              context: v.errorContext,
              detail: v.errorDetail
            });
          }
        }
      } catch (e) {
        // Skip problematic files
      }
    }
  }

  // Output JSON for analysis
  console.log(JSON.stringify(violations, null, 2));
}

main().catch(console.error);
