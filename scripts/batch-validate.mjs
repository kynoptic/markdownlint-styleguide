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

console.log(`Processing ${files.length} files from ${repoPath}...`);

let totalViolations = 0;
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
      totalViolations += results.content?.length || 0;
    } catch (e) {
      // Skip problematic files
    }
  }

  const processed = Math.min(i + batchSize, files.length);
  process.stdout.write(`\r  ${processed}/${files.length} files, ${totalViolations} violations`);
}

  console.log(`\nDone: ${files.length} files, ${totalViolations} violations`);
}

main().catch(console.error);
