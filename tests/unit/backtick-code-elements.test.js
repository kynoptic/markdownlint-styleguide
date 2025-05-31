// @ts-check

"use strict";

/**
 * Unit tests for backtick-code-elements rule
 * 
 * @module backtick-code-elements.test
 */

const backtickCodeElements = require("../../rules/backtick-code-elements");
const { testRule } = require("../helpers/test-helpers");

// Now we can directly test the exported helper functions
const { checkText, checkSegment } = backtickCodeElements;

describe("backtick-code-elements", () => {
  // Set longer timeout for these tests due to known performance issues
  jest.setTimeout(10000);

  test("filenames wrapped in backticks pass", (done) => {
    const testCases = [
      {
        markdown: "The file `example.js` contains code.",
        expected: 0
      },
      {
        markdown: "Check out `README.md` for more information.",
        expected: 0
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("filenames not wrapped in backticks fail", (done) => {
    const testCases = [
      {
        markdown: "The file example.js contains code.",
        expected: 1,
        lineNumbers: [1]
      },
      {
        markdown: "Check out README.md for more information.",
        expected: 1,
        lineNumbers: [1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("directory paths wrapped in backticks pass", (done) => {
    const testCases = [
      {
        markdown: "The directory `src/components` contains React components.",
        expected: 0
      },
      {
        markdown: "Look in the `tests/unit/` directory.",
        expected: 0
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("directory paths not wrapped in backticks fail", (done) => {
    const testCases = [
      {
        markdown: "The directory src/components contains React components.",
        expected: 1,
        lineNumbers: [1]
      },
      {
        markdown: "Look in the tests/unit/ directory.",
        expected: 1,
        lineNumbers: [1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("code elements wrapped in backticks pass", (done) => {
    const testCases = [
      {
        markdown: "Use the `function` keyword to define functions.",
        expected: 0
      },
      {
        markdown: "Use `const` for constants and `let` for variables.",
        expected: 0
      },
      {
        markdown: "Install packages using `npm` or `yarn`.",
        expected: 0
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("code elements not wrapped in backticks fail", (done) => {
    const testCases = [
      {
        markdown: "Use the function keyword to define functions.",
        expected: 1,
        lineNumbers: [1]
      },
      {
        markdown: "Use const for constants and let for variables.",
        expected: 2,
        lineNumbers: [1, 1]
      },
      {
        markdown: "Install packages using npm or yarn.",
        expected: 2,
        lineNumbers: [1, 1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("URLs are ignored", (done) => {
    const testCases = [
      {
        markdown: "Visit https://example.com/path/to/file.js for more information.",
        expected: 0
      },
      {
        markdown: "Check http://github.com/user/repo/blob/main/src/index.js for the source code.",
        expected: 0
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("mixed content is handled correctly", (done) => {
    const testCases = [
      {
        markdown: "The file example.js contains code and https://example.com/file.js is a URL.",
        expected: 1,  // Only the first 'example.js' should be flagged, not the one in the URL
        lineNumbers: [1]
      },
      {
        markdown: "Check src/components before and after https://github.com/user/repo/src/components.",
        expected: 1,  // Only the first 'src/components' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "Before URL: index.js and after URL: https://example.com and then another file.js",
        expected: 2,  // Both 'index.js' and 'file.js' should be flagged
        lineNumbers: [1, 1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("inline code spans are ignored", (done) => {
    const testCases = [
      {
        markdown: "This is `index.js` in backticks and this is file.js without backticks.",
        expected: 1,  // Only 'file.js' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "Code like `const x = 10;` is ignored but const y = 20; is flagged.",
        expected: 1,  // Only 'const' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "Multiple backticks: ``src/components`` are also ignored.",
        expected: 0
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("common phrases with code keywords are not flagged", (done) => {
    const testCases = [
      {
        markdown: "Custom, shareable rules for markdownlint, the popular Markdown/CommonMark linter.",
        expected: 0  // Should not flag 'markdownlint' due to context exclusion
      },
      {
        markdown: "Or use npm script:",
        expected: 0  // Should not flag 'npm' due to context exclusion
      },
      {
        markdown: "Or use yarn to install dependencies",
        expected: 0  // Should not flag 'yarn' due to context exclusion
      },
      {
        markdown: "This is a git workflow guide",
        expected: 0  // Should not flag 'git' due to context exclusion
      },
      // The following should be flagged with our stricter rules
      {
        markdown: "You can install using npm or yarn",
        expected: 2  // Should flag both 'npm' and 'yarn' with stricter rules
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  test("unclosed backticks are handled correctly", (done) => {
    const testCases = [
      {
        markdown: "This has an unclosed backtick ` and then index.js appears.",
        expected: 1,  // 'index.js' should be flagged since the backtick is unclosed
        lineNumbers: [1]
      },
      {
        markdown: "Multiple unclosed backticks ``` and then src/components appears.",
        expected: 1,  // 'src/components' should be flagged
        lineNumbers: [1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("complex mixed content with URLs and code spans", (done) => {
    const testCases = [
      {
        markdown: "Check `index.js` and https://example.com/index.js and then another index.js file.",
        expected: 1,  // Only the last 'index.js' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "This is a complex case with `src/components` and https://example.com/src/components and src/components.",
        expected: 1,  // Only the last 'src/components' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "URL between code elements: `const` https://example.com/const const and `let` https://example.com/let let.",
        expected: 2,  // Both standalone 'const' and 'let' should be flagged
        lineNumbers: [1, 1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("very short segments are handled correctly", (done) => {
    const testCases = [
      {
        markdown: "Very short like a or if should not be flagged.",
        expected: 0  // Very short words should be ignored
      },
      {
        markdown: "Short segments like js or py might be flagged if they match patterns.",
        expected: 0  // Depends on the patterns, but generally short segments should be ignored
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("word boundaries are respected", (done) => {
    const testCases = [
      {
        markdown: "Words like functionCall or myIndex.js should be analyzed correctly.",
        expected: 1,  // Only 'myIndex.js' should be flagged
        lineNumbers: [1]
      },
      {
        markdown: "No space: index.js. With space: index.js at the end.",
        expected: 2,  // Both instances of 'index.js' should be flagged
        lineNumbers: [1, 1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });

  test("markdown links with file extensions are ignored", (done) => {
    const testCases = [
      {
        markdown: "A markdown link: [the file.js](file.js) should not be flagged.",
        expected: 0  // file.js inside markdown link should not be flagged
      },
      {
        markdown: "Multiple links: [README.md](README.md) and [index.js](https://example.com/index.js) should be ignored.",
        expected: 0  // No files should be flagged inside links
      },
      {
        markdown: "Link with text: [Check this file](file.js) but standalone file.js should be flagged.",
        expected: 1,  // Only the standalone file.js should be flagged
        lineNumbers: [1]
      }
    ];
    
    testRule(backtickCodeElements, testCases, done);
  });
});

describe("backtick-code-elements helper functions", () => {
  // Test the checkText helper function directly
  describe("checkText", () => {
    test("skips very short text", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" },
        { regex: /src\/components/g, type: "directory" }
      ];
      
      checkText("ab", 1, onError, patterns);
      expect(onError).not.toHaveBeenCalled();
    });
    
    test("processes text without URLs", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkText("This is index.js file", 1, onError, patterns);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        lineNumber: 1,
        detail: expect.stringContaining("index.js")
      }));
    });
    
    test("processes text with URLs", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkText("Before URL: index.js and after URL: https://example.com/index.js and another index.js", 1, onError, patterns);
      expect(onError).toHaveBeenCalledTimes(2);
    });
    
    test("skips matches inside URLs", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkText("Only URL: https://example.com/index.js", 1, onError, patterns);
      expect(onError).not.toHaveBeenCalled();
    });
  });
  
  // Test the checkSegment helper function directly
  describe("checkSegment", () => {
    test("skips very short segments", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkSegment("ab", 0, 1, onError, patterns);
      expect(onError).not.toHaveBeenCalled();
    });
    
    test("detects unwrapped code elements", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkSegment("This is index.js file", 0, 1, onError, patterns);
      expect(onError).toHaveBeenCalledTimes(1);
    });
    
    test("skips already wrapped code elements", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /index\.js/g, type: "filename" }
      ];
      
      checkSegment("This is `index.js` file", 0, 1, onError, patterns);
      expect(onError).not.toHaveBeenCalled();
    });
    
    test("respects word boundaries", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /const/g, type: "code" }
      ];
      
      // Should detect standalone 'const'
      checkSegment("Use const for constants", 0, 1, onError, patterns);
      expect(onError).toHaveBeenCalledTimes(1);
      
      // Reset mock
      onError.mockReset();
      
      // Should not detect 'const' inside 'constants'
      checkSegment("These are constants", 0, 1, onError, patterns);
      expect(onError).not.toHaveBeenCalled();
    });
    
    test("detects matches based on length", () => {
      const onError = jest.fn();
      const patterns = [
        { regex: /if|is/g, type: "code" }
      ];
      
      checkSegment("This is a test if it works", 0, 1, onError, patterns);
      // Both 'if' and 'is' are detected (the rule's length check is for < 2 chars)
      expect(onError).toHaveBeenCalledTimes(2);
      // Verify one of the calls contains 'if'
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        detail: expect.stringContaining("'if'")
      }));
    });
  });
});
