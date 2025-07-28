// Test the regex logic directly
const specialCasedTerms = { 'vs code': 'VS Code', 'user experience': 'User Experience' };

function testPhrase(phrase, expected, text) {
  const regex = new RegExp(`\\b${phrase}\\b`, 'i');
  console.log(`Testing phrase '${phrase}' in text '${text}'`);
  console.log(`Regex: ${regex}`);
  const match = regex.exec(text);
  console.log(`Match result:`, match);
  if (match) {
    console.log(`Found: '${match[0]}', Expected: '${expected}', Equal: ${match[0] === expected}`);
    return match[0] !== expected;
  }
  return false;
}

const testTexts = ['VS Code', 'User experience', 'markdownlint-cli2'];
testTexts.forEach(text => {
  console.log(`\n=== Testing: ${text} ===`);
  for (const [phrase, expected] of Object.entries(specialCasedTerms)) {
    if (!phrase.includes(' ')) continue;
    const hasViolation = testPhrase(phrase, expected, text);
    console.log(`Violation: ${hasViolation}`);
  }
});