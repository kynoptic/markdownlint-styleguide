// Debug why VS Code isn't being matched
const { casingTerms } = require('./.markdownlint-rules/rules/shared-constants.cjs');

console.log('=== Checking VS Code phrase matching ===');

const text = 'VS Code';
console.log(`Text to check: '${text}'`);

console.log('\nAll multi-word phrases in casingTerms:');
for (const [phrase, expected] of Object.entries(casingTerms)) {
  if (!phrase.includes(' ')) {
    continue;
  }
  console.log(`  '${phrase}' -> '${expected}'`);
  
  if (phrase === 'vs code') {
    console.log(`    Testing this phrase...`);
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    console.log(`    Regex: ${regex}`);
    const match = regex.exec(text);
    console.log(`    Match result:`, match);
    if (match) {
      console.log(`    Found: '${match[0]}', Expected: '${expected}'`);
      console.log(`    Are they equal? ${match[0] === expected}`);
      console.log(`    Should flag violation? ${match[0] !== expected}`);
    }
  }
}