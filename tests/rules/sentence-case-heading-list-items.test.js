import { lintMarkdown } from '../test-helpers.js';

describe('sentence-case-heading rule for bolded list items', () => {
  // Test cases for correctly cased bolded list items
  test('should not report errors for correctly cased bolded list items', async () => {
    const markdown = `
- **This is a correct item**: with more text.
- **API Integration**: Details about the API.
- **Version 1.0.0**: Initial release.
- **Dr. Patel's Research**: Findings.
- **Working with \`npm\`**: Package manager.
- **A Link to Google**: Description.
- **This is a _bold_ and *italic* test**: With mixed formatting.
- **This is a \`code\` example**: With inline code.
- **This is a \`v1.2.3\` version**: With a version number.
- **This is a 2023-10-26 date**: With a date.
- **Incorrect API**
- **This is a test with \`CODE\`**
    `;
    const results = await lintMarkdown(markdown, ['sentence-case-heading']);
    expect(results).toHaveLength(0);
  });

  // Test cases for incorrectly cased bolded list items, expecting errors and autofix
  test('should report errors and provide autofix for incorrectly cased bolded list items', async () => {
    const markdown = `
- **this is an incorrect item**
- **This Is An Incorrect Item**
- **ALL CAPS ITEM**
- **Incorrect Json**
- **Incorrect-Hyphenated-Word**
- **This is a Test**
- **This is a test with LINK**
- **This is a test with _ITALIC_**
- **This is a test with *BOLD***
- **This is a test with 2023-10-26 Date**
- **This is a test with V1.0.0 Version**
    `;
    const results = await lintMarkdown(markdown, ['sentence-case-heading']);

    // Define expected errors for each line, including fixInfo for autofix verification
    expect(results).toEqual(expect.arrayContaining([
      // Line 2: - **this is an incorrect item**
      expect.objectContaining({
        lineNumber: 2,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'First word "this" should be "This".',
        fixInfo: { editColumn: 4, deleteCount: 27, insertText: 'This is an incorrect item' },
      }),
      // Line 3: - **This Is An Incorrect Item** (Multiple errors for this line)
      expect.objectContaining({
        lineNumber: 3,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Is" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 27, insertText: 'This is an incorrect item' },
      }),
      expect.objectContaining({
        lineNumber: 3,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "An" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 27, insertText: 'This is an incorrect item' },
      }),
      expect.objectContaining({
        lineNumber: 3,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Incorrect" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 27, insertText: 'This is an incorrect item' },
      }),
      expect.objectContaining({
        lineNumber: 3,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Item" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 27, insertText: 'This is an incorrect item' },
      }),
      // Line 4: - **ALL CAPS ITEM**
      expect.objectContaining({
        lineNumber: 4,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Heading should not be in all caps.',
        fixInfo: { editColumn: 4, deleteCount: 13, insertText: 'All caps item' },
      }),
      // Line 5: - **Incorrect Json**
      expect.objectContaining({
        lineNumber: 5,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Json" should be "JSON".',
        fixInfo: { editColumn: 4, deleteCount: 14, insertText: 'Incorrect JSON' },
      }),
      // Line 6: - **Incorrect-Hyphenated-Word**
      expect.objectContaining({
        lineNumber: 6,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Hyphenated" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 26, insertText: 'Incorrect-hyphenated-word' },
      }),
      // Line 7: - **This is a Test**
      expect.objectContaining({
        lineNumber: 7,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "Test" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 16, insertText: 'This is a test' },
      }),
      // Line 8: - **This is a test with LINK**
      expect.objectContaining({
        lineNumber: 8,
        ruleNames: ['sentence-case-heading', 'SC001'],
        detail: 'Word "LINK" in heading should be lowercase.',
        fixInfo: { editColumn: 4, deleteCount: 20, insertText: 'This is a test with link' },
      }),
      // ... (additional expectations for other lines would follow a similar pattern)
    ]));
  });
});