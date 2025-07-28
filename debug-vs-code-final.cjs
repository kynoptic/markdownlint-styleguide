// Debug why VS Code is still being flagged
const { casingTerms } = require('./.markdownlint-rules/rules/shared-constants.cjs');

function testStep6Logic(processedWords, cleanedText) {
  console.log('=== Testing Step 6: Individual technical term check ===');
  console.log('Processed words:', processedWords);
  console.log('Cleaned text:', cleanedText);
  
  for (let i = 0; i < processedWords.length; i++) {
    const word = processedWords[i];
    if (word.startsWith('__PRESERVED_')) continue;
    
    const wordLower = word.toLowerCase();
    const expectedCasing = casingTerms[wordLower];
    
    console.log(`\nWord ${i}: '${word}'`);
    console.log(`  Lowercase: '${wordLower}'`);
    console.log(`  Expected casing: '${expectedCasing}'`);
    
    // If we have a known technical term and it doesn't match
    if (expectedCasing && word !== expectedCasing) {
      console.log(`  ❌ VIOLATION: Expected '${expectedCasing}' but found '${word}'`);
      return true;
    }
    
    // Check for incorrectly capitalized words that should be lowercase or special cased
    if (i > 0) {
      // Skip first word (already checked)
      // Words like "Test", "Date", "Version" should be lowercase unless they're proper nouns
      if (/^[A-Z][a-z]+$/.test(word) && !expectedCasing) {
        const commonWords = ['Test', 'Date', 'Version', 'Link', 'Code', 'Bold', 'Italic'];
        console.log(`  Checking if '${word}' is in commonWords: ${commonWords.includes(word)}`);
        if (commonWords.includes(word)) {
          console.log(`  ❌ VIOLATION: Common word '${word}' should be lowercase`);
          return true;
        }
      }
    }
    
    // Check for hyphenated words that shouldn't be title-cased
    if (word.includes('-') && /[A-Z]/.test(word.slice(1))) {
      const parts = word.split('-');
      // If second part of hyphenated word is capitalized when it shouldn't be
      if (parts.length > 1 && parts[1] !== parts[1].toLowerCase() && !casingTerms[parts[1].toLowerCase()]) {
        console.log(`  ❌ VIOLATION: Hyphenated word '${word}' has incorrect capitalization`);
        return true;
      }
    }
    
    console.log(`  ✅ OK`);
  }
  
  console.log('No violations in step 6');
  return false;
}

// Test VS Code specifically
console.log('Testing VS Code step 6 logic:');
testStep6Logic(['VS', 'Code'], 'VS Code');

console.log('\n' + '='.repeat(50));

// Test User experience
console.log('Testing User experience step 6 logic:');
testStep6Logic(['User', 'experience'], 'User experience');