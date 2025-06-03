// @ts-check

"use strict";

/**
 * Test suite to validate that all custom rules conform to markdownlint standards.
 * 
 * This ensures all rules follow the structure requirements from CustomRules.md
 * and adhere to the project's rule guidelines.
 * 
 * @module rule-structure-conformance.test
 */

const fs = require("fs");
const path = require("path");

// Helper function to load all rule modules
const loadAllRules = () => {
  const rulesDir = path.resolve(__dirname, "../../rules");
  const ruleFiles = fs.readdirSync(rulesDir)
    .filter(file => file.endsWith(".js"))
    // Exclude helper files from rule checks
    .filter(file => !file.includes("-helpers"));
  
  return ruleFiles.map(file => {
    const rulePath = path.join(rulesDir, file);
    const ruleName = path.basename(file, ".js");
    const ruleModule = require(rulePath);
    return { 
      name: ruleName, 
      module: ruleModule,
      path: rulePath 
    };
  });
};

describe("Rule structure conformance", () => {
  const allRules = loadAllRules();
  
  test("all rules should be loaded successfully", () => {
    expect(allRules.length).toBeGreaterThan(0);
    allRules.forEach(rule => {
      expect(rule.module).toBeDefined();
    });
  });

  test.each(allRules)("$name should have all required fields", (rule) => {
    // Required fields according to CustomRules.md
    expect(rule.module).toHaveProperty("names");
    expect(Array.isArray(rule.module.names)).toBe(true);
    expect(rule.module.names.length).toBeGreaterThan(0);
    
    expect(rule.module).toHaveProperty("description");
    expect(typeof rule.module.description).toBe("string");
    expect(rule.module.description.length).toBeGreaterThan(0);
    
    expect(rule.module).toHaveProperty("tags");
    expect(Array.isArray(rule.module.tags)).toBe(true);
    expect(rule.module.tags.length).toBeGreaterThan(0);
    
    expect(rule.module).toHaveProperty("parser");
    expect(["markdownit", "micromark", "none"].includes(rule.module.parser)).toBe(true);
    
    expect(rule.module).toHaveProperty("function");
    expect(typeof rule.module.function).toBe("function");
  });

  test.each(allRules)("$name should have valid information URL if provided", (rule) => {
    // information field is optional but if present should be a valid URL
    if (rule.module.information) {
      expect(rule.module.information).toBeInstanceOf(URL);
      // Additional validation that URL is accessible could be added here
    }
  });

  test("all rule names should be unique across the codebase", () => {
    const allNames = allRules.flatMap(rule => rule.module.names);
    const uniqueNames = new Set(allNames);
    
    expect(allNames.length).toBe(uniqueNames.size);
  });

  test.each(allRules)("$name should have consistent function signature", (rule) => {
    // All rule functions should accept params and onError parameters
    const ruleFunction = rule.module.function;
    expect(ruleFunction.length).toBeGreaterThanOrEqual(2);
    
    // If rule is asynchronous, it should be marked as such
    if (ruleFunction.toString().includes("async")) {
      expect(rule.module.asynchronous).toBe(true);
    }
  });

  test.each(allRules)("$name JSDoc should be comprehensive", (rule) => {
    // Skip helper files
    if (rule.name.includes("-helpers")) {
      return;
    }
    
    // Read the file content to check JSDoc
    const fileContent = fs.readFileSync(rule.path, "utf8");
    
    // Check for module JSDoc
    expect(fileContent).toMatch(/\/\*\*[\s\S]*?@module[\s\S]*?\*\//);
    
    // Check for rule function JSDoc
    expect(fileContent).toMatch(/\/\*\*[\s\S]*?@param[\s\S]*?params[\s\S]*?\*\//);
    expect(fileContent).toMatch(/\/\*\*[\s\S]*?@param[\s\S]*?onError[\s\S]*?\*\//);
  });
});
