// Debug the validateBoldListItem function step by step
const { casingTerms } = require('./.markdownlint-rules/rules/shared-constants.cjs');

function stripLeadingSymbols(text) {
  return text.replace(/^[^\w\s]*\s*/, '').trim();
}

function preserveMarkupSegments(text) {
  const preservedSegments = [];
  const processed = text.replace(/`([^`]+)`/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  }).replace(/\[[^\]]+\]\([^)]+\)|\[[^\]]+\]/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  }).replace(/\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  }).replace(/\b(\d{4}-\d{2}-\d{2})\b/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  }).replace(/(\*\*|__)(.*?)\1/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  }).replace(/(\*|_)(.*?)\1/g, m => {
    preservedSegments.push(m);
    return `__PRESERVED_${preservedSegments.length - 1}__`;
  });
  return { processed, preservedSegments };
}

function debugValidateBoldListItem(boldText) {
  console.log(`\n=== Debugging: ${boldText} ===`);
  
  // Step 1: Strip leading symbols
  const cleanedText = stripLeadingSymbols(boldText);
  console.log(`After stripLeadingSymbols: '${cleanedText}'`);
  
  if (!cleanedText) {
    console.log('RETURN: Empty after cleaning');
    return false;
  }
  
  // Step 2: Check for multi-word proper phrases first
  console.log('\n--- Multi-word phrase check ---');
  for (const [phrase, expected] of Object.entries(casingTerms)) {
    if (!phrase.includes(' ')) {
      continue;
    }
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    const match = regex.exec(cleanedText);
    if (match && match[0] !== expected) {
      console.log(`VIOLATION FOUND: phrase '${phrase}' matched '${match[0]}', expected '${expected}'`);
      return true;
    }
  }
  console.log('No multi-word violations found');
  
  // Step 3: Process markup
  const { processed } = preserveMarkupSegments(cleanedText);
  console.log(`After preserveMarkupSegments: '${processed}'`);
  
  const clean = processed.replace(/[#*_~!+={}|:;"<>,.?\\]/g, ' ').trim();
  console.log(`After cleaning punctuation: '${clean}'`);
  
  if (!clean) {
    console.log('RETURN: Empty after cleaning');
    return false;
  }
  
  const processedWords = clean.split(/\s+/).filter(w => w.length > 0);
  console.log(`Processed words:`, processedWords);
  
  if (processedWords.length === 0) {
    console.log('RETURN: No words');
    return false;
  }
  
  // Step 4: Check single words
  console.log('\n--- Single word technical term check ---');
  for (let i = 0; i < processedWords.length; i++) {
    const word = processedWords[i];
    if (word.startsWith('__PRESERVED_')) continue;
    const wordLower = word.toLowerCase();
    const expectedCasing = casingTerms[wordLower];
    
    console.log(`Word ${i}: '${word}', lowercase: '${wordLower}', expected: '${expectedCasing}'`);
    
    // If we have a known technical term and it doesn't match
    if (expectedCasing && word !== expectedCasing) {
      console.log(`VIOLATION: Expected '${expectedCasing}' but found '${word}'`);
      return true;
    }
  }
  
  console.log('No single-word violations found');
  return false;
}

// Test the failing cases
debugValidateBoldListItem('VS Code');
debugValidateBoldListItem('User experience');
debugValidateBoldListItem('markdownlint-cli2');