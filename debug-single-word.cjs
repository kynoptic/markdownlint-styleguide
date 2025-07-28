// Test the single word logic
const { casingTerms } = require('./.markdownlint-rules/rules/shared-constants.cjs');

function testSingleWord(word) {
  const processedWords = [word]; // Simulate the processedWords array
  
  console.log(`\n=== Testing single word: ${word} ===`);
  
  for (let i = 0; i < processedWords.length; i++) {
    const currentWord = processedWords[i];
    if (currentWord.startsWith('__PRESERVED_')) continue;
    
    const wordLower = currentWord.toLowerCase();
    const expectedCasing = casingTerms[wordLower];
    
    console.log(`Word: '${currentWord}'`);
    console.log(`Lowercase: '${wordLower}'`);
    console.log(`Expected casing: '${expectedCasing}'`);
    
    // If we have a known technical term and it doesn't match
    if (expectedCasing && currentWord !== expectedCasing) {
      console.log(`VIOLATION: Should be '${expectedCasing}' but found '${currentWord}'`);
      return true;
    } else if (expectedCasing) {
      console.log(`OK: Matches expected casing`);
    } else {
      console.log(`No expected casing found`);
    }
  }
  
  return false;
}

// Test the problematic words
testSingleWord('markdownlint-cli2');
testSingleWord('VS');
testSingleWord('Code');