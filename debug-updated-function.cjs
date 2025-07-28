// Debug the updated validateBoldListItem function step by step
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

function shouldExemptFromValidation(headingText, textWithoutMarkup) {
  if (headingText.startsWith('[') && headingText.endsWith(']')) {
    return true;
  }
  if (!headingText || headingText.trim().length === 0) {
    return true;
  }
  if (!/[a-zA-Z]/.test(textWithoutMarkup)) {
    return true;
  }
  const codeContentRegex = /`[^`]+`|\([A-Z0-9]+\)/g;
  const matches = [...headingText.matchAll(codeContentRegex)];
  const totalCodeLength = matches.reduce((sum, m) => sum + m[0].length, 0);
  if (totalCodeLength > 0 && totalCodeLength / headingText.length > 0.4) {
    return true;
  }
  const firstNonSpace = headingText.trim().split(/\s+/)[0] || '';
  if (firstNonSpace.startsWith('`') && firstNonSpace.endsWith('`')) {
    return true;
  }
  return false;
}

function debugUpdatedValidateBoldListItem(boldText) {
  console.log(`\n=== Debugging UPDATED function: ${boldText} ===`);
  
  // Step 1: Check exemptions
  const textWithoutMarkup = boldText.replace(/`[^`]+`/g, '').replace(/\[([^\]]+)\]/g, '$1');
  if (shouldExemptFromValidation(boldText, textWithoutMarkup)) {
    console.log('RETURN: Exempted from validation');
    return false;
  }
  
  // Step 2: Strip leading symbols
  const cleanedText = stripLeadingSymbols(boldText);
  console.log(`After stripLeadingSymbols: '${cleanedText}'`);
  
  if (!cleanedText) {
    console.log('RETURN: Empty after cleaning');
    return false;
  }
  
  // Step 3: Check problematic patterns (unchanged)
  const problematicPatterns = [
    /\b(CODE|LINK|ITALIC|BOLD)\b/,
    /\bTest\b/,
    /\bDate\b/,
    /\bVersion\b/
  ];
  
  const words = cleanedText.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z]/g, '');
    for (const pattern of problematicPatterns) {
      if (pattern.test(word)) {
        console.log(`VIOLATION: Problematic pattern ${pattern} matched word '${word}'`);
        return true;
      }
    }
  }
  console.log('No problematic patterns found');
  
  // Step 4: Further processing
  const cleanedTextWithoutMarkup = cleanedText.replace(/`[^`]+`/g, '').replace(/\[([^\]]+)\]/g, '$1');
  if (shouldExemptFromValidation(cleanedText, cleanedTextWithoutMarkup)) {
    console.log('RETURN: Exempted after cleaning');
    return false;
  }
  
  const { processed } = preserveMarkupSegments(cleanedText);
  console.log(`After preserveMarkupSegments: '${processed}'`);
  
  const clean = processed.replace(/[#*_~!+={}|:;"<>,.?\\]/g, ' ').trim();
  console.log(`After cleaning punctuation: '${clean}'`);
  
  if (!clean) {
    console.log('RETURN: Empty after cleaning punctuation');
    return false;
  }
  
  const processedWords = clean.split(/\s+/).filter(w => w.length > 0);
  console.log(`Processed words:`, processedWords);
  
  if (processedWords.length === 0) {
    console.log('RETURN: No words');
    return false;
  }
  
  // Step 5: Find first word
  let firstWordIndex = 0;
  while (firstWordIndex < processedWords.length && processedWords[firstWordIndex].startsWith('__PRESERVED_')) {
    firstWordIndex++;
  }
  if (firstWordIndex >= processedWords.length) {
    console.log('RETURN: No actual words');
    return false;
  }
  
  // Step 6: Check first word lowercase
  console.log('\n--- Step 1: Check first word lowercase ---');
  const firstWord = processedWords[firstWordIndex];
  if (/^[a-z]/.test(firstWord)) {
    console.log(`VIOLATION: First word '${firstWord}' starts with lowercase`);
    return true;
  }
  console.log(`First word '${firstWord}' OK (starts with capital)`);
  
  // Step 7: Check all caps
  console.log('\n--- Step 2: Check all caps ---');
  if (processedWords.length > 1) {
    const nonPreservedWords = processedWords.filter(w => !w.startsWith('__PRESERVED_'));
    if (nonPreservedWords.length > 1 && nonPreservedWords.every(w => w === w.toUpperCase() && w.length > 1)) {
      console.log(`VIOLATION: All caps detected: ${nonPreservedWords}`);
      return true;
    }
  }
  console.log('No all caps violation');
  
  // Step 8: UPDATED - Multi-word phrase check (now step 3)
  console.log('\n--- Step 3: Multi-word phrase check (NEW ORDER) ---');
  for (const [phrase, expected] of Object.entries(casingTerms)) {
    if (!phrase.includes(' ')) {
      continue;
    }
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    const match = regex.exec(cleanedText);
    if (match && match[0] !== expected) {
      console.log(`VIOLATION: phrase '${phrase}' matched '${match[0]}', expected '${expected}'`);
      return true;
    }
    if (match) {
      console.log(`FOUND MATCH: phrase '${phrase}' matched '${match[0]}', expected '${expected}' -> NO VIOLATION`);
    }
  }
  console.log('No multi-word phrase violations');
  
  // Step 9: Title case check (now step 4)
  console.log('\n--- Step 4: Title case check ---');
  if (processedWords.length >= 2) {
    const titleCasePattern = /^[A-Z][a-z]*(?:\s+[A-Z][a-z]*){1,}/;
    console.log(`Testing title case pattern against: '${cleanedText.trim()}'`);
    if (titleCasePattern.test(cleanedText.trim())) {
      console.log('Title case pattern matched!');
      const hasCommonWords = /\b(Is|A|An|The|Of|In|On|At|To|For|With|By|And|Or|But|Test|Date|Version)\b/.test(cleanedText);
      console.log(`Has common words: ${hasCommonWords}`);
      if (hasCommonWords) {
        console.log('VIOLATION: Title case with common words');
        return true;
      }
    } else {
      console.log('Title case pattern did not match');
    }
  }
  console.log('No title case violations');
  
  console.log('No violations found');
  return false;
}

// Test the failing cases
debugUpdatedValidateBoldListItem('VS Code');
debugUpdatedValidateBoldListItem('User experience');
debugUpdatedValidateBoldListItem('markdownlint-cli2');