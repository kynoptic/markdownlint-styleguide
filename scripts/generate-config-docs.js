#!/usr/bin/env node

/**
 * Auto-generates configuration documentation for markdownlint-trap rules.
 * Extracts configuration schemas from rule files and generates markdown documentation.
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Configuration metadata for rules
 */
const RULE_METADATA = {
  'sentence-case-heading': {
    description: 'Enforces sentence case in headings while allowing specific exceptions',
    examples: {
      valid: [
        '# Getting started with APIs',
        '# Working with JavaScript and HTML'
      ],
      invalid: [
        '# Getting Started With APIs',
        '# Working With JavaScript And HTML'
      ]
    }
  },
  'backtick-code-elements': {
    description: 'Ensures code elements are wrapped in backticks for proper formatting',
    examples: {
      valid: [
        'Check the `config.json` file',
        'Use the `npm install` command'
      ],
      invalid: [
        'Check the config.json file',
        'Use the npm install command'
      ]
    }
  },
  'no-bare-urls': {
    description: 'Requires URLs to be properly formatted with angle brackets',
    examples: {
      valid: [
        'Visit <https://example.com> for details',
        '[Example Site](https://example.com)'
      ],
      invalid: [
        'Visit https://example.com for details'
      ]
    }
  },
  'no-literal-ampersand': {
    description: 'Replaces literal ampersands with "and" for better readability',
    examples: {
      valid: [
        'APIs and database systems',
        'Use GitHub and VSCode'
      ],
      invalid: [
        'APIs & database systems',
        'Use GitHub & VSCode'
      ]
    }
  },
  'no-dead-internal-links': {
    description: 'Validates that internal links point to existing files',
    examples: {
      valid: [
        '[Documentation](docs/README.md)',
        '[API Reference](api/index.md)'
      ],
      invalid: [
        '[Missing File](docs/missing.md)',
        '[Broken Link](nonexistent.md)'
      ]
    }
  }
};

/**
 * Configuration option metadata
 */
const CONFIG_OPTION_METADATA = {
  specialTerms: {
    type: 'string[]',
    description: 'Terms that should maintain their exact casing in headings',
    default: '["API", "APIs", "CSS", "HTML", "HTTP", "HTTPS", "JavaScript", "JSON", "REST", "SDK", "SQL", "URL", "URLs", "XML"]',
    example: '["API", "GitHub", "OAuth"]'
  },
  technicalTerms: {
    type: 'string[]',
    description: '**Deprecated**: Use `specialTerms` instead',
    deprecated: true
  },
  properNouns: {
    type: 'string[]', 
    description: '**Deprecated**: Use `specialTerms` instead',
    deprecated: true
  },
  ignoredTerms: {
    type: 'string[]',
    description: 'Terms to ignore when checking for code element formatting',
    default: '[]',
    example: '["README", "LICENSE"]'
  },
  allowedDomains: {
    type: 'string[]',
    description: 'Domain names that are allowed as bare URLs',
    default: '[]',
    example: '["localhost", "example.com"]'
  },
  exceptions: {
    type: 'string[]',
    description: 'Specific phrases where ampersands are allowed',
    default: '[]',
    example: '["R&D", "Q&A"]'
  },
  ignoredPaths: {
    type: 'string[]',
    description: 'File paths to ignore when checking internal links',
    default: '[]',
    example: '["node_modules/**", "dist/**"]'
  },
  allowedExtensions: {
    type: 'string[]',
    description: 'File extensions to consider valid for internal links',
    default: '[".md", ".markdown", ".html", ".htm"]',
    example: '[".md", ".txt", ".pdf"]'
  },
  skipCodeBlocks: {
    type: 'boolean',
    description: 'Whether to skip validation inside code blocks',
    default: 'true'
  },
  skipInlineCode: {
    type: 'boolean',
    description: 'Whether to skip validation inside inline code spans',
    default: 'true'
  },
  skipMathBlocks: {
    type: 'boolean',
    description: 'Whether to skip validation inside math blocks (LaTeX)',
    default: 'true'
  },
  checkAnchors: {
    type: 'boolean',
    description: 'Whether to validate anchor links within documents',
    default: 'false'
  }
};

/**
 * Extract configuration schema from rule file content
 * @param {string} content - Rule file content
 * @returns {Object|null} Configuration schema or null if not found
 */
function extractConfigSchema(content) {
  // Look for configSchema definition
  const schemaMatch = content.match(/const\s+configSchema\s*=\s*{([^}]*)}/s);
  if (!schemaMatch) return null;

  const schemaContent = schemaMatch[1];
  const options = {};

  // Extract individual option definitions
  const optionMatches = schemaContent.matchAll(/(\w+):\s*validate(\w+)/g);
  for (const match of optionMatches) {
    const [, optionName, validationType] = match;
    options[optionName] = {
      type: validationType === 'StringArray' ? 'string[]' : 'boolean',
      validator: `validate${validationType}`
    };
  }

  return Object.keys(options).length > 0 ? options : null;
}

/**
 * Extract rule names from rule file content
 * @param {string} content - Rule file content
 * @returns {string[]} Array of rule names
 */
function extractRuleNames(content) {
  const namesMatch = content.match(/names:\s*\[([^\]]*)\]/);
  if (!namesMatch) return [];

  return namesMatch[1]
    .split(',')
    .map(name => name.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

/**
 * Extract rule description from rule file content
 * @param {string} content - Rule file content
 * @returns {string} Rule description
 */
function extractRuleDescription(content) {
  const descMatch = content.match(/description:\s*["']([^"']*)["']/);
  return descMatch ? descMatch[1] : '';
}

/**
 * Generate markdown documentation for a single rule
 * @param {string} ruleName - Rule name
 * @param {Object} schema - Configuration schema
 * @param {string} description - Rule description
 * @param {string[]} aliases - Rule name aliases
 * @returns {string} Markdown documentation
 */
function generateRuleDoc(ruleName, schema, description, aliases) {
  const metadata = RULE_METADATA[ruleName] || {};
  const ruleDescription = metadata.description || description;
  
  let doc = `### ${ruleName}\n\n`;
  
  if (aliases.length > 1) {
    doc += `**Aliases:** ${aliases.join(', ')}\n\n`;
  }
  
  doc += `${ruleDescription}\n\n`;
  
  // Add examples if available
  if (metadata.examples) {
    doc += '**Examples:**\n\n';
    
    if (metadata.examples.valid) {
      doc += '✅ **Valid:**\n\n';
      metadata.examples.valid.forEach(example => {
        doc += `- ${example}\n`;
      });
      doc += '\n';
    }
    
    if (metadata.examples.invalid) {
      doc += '❌ **Invalid:**\n\n';
      metadata.examples.invalid.forEach(example => {
        doc += `- ${example}\n`;
      });
      doc += '\n';
    }
  }
  
  // Add configuration options
  if (schema && Object.keys(schema).length > 0) {
    doc += '**Configuration options:**\n\n';
    
    Object.entries(schema).forEach(([optionName, optionInfo]) => {
      const optionMeta = CONFIG_OPTION_METADATA[optionName] || {};
      
      doc += `#### \`${optionName}\`\n\n`;
      doc += `- **Type:** \`${optionMeta.type || optionInfo.type}\`\n`;
      
      if (optionMeta.default) {
        doc += `- **Default:** \`${optionMeta.default}\`\n`;
      }
      
      if (optionMeta.description) {
        doc += `- **Description:** ${optionMeta.description}\n`;
      }
      
      if (optionMeta.example) {
        doc += `- **Example:** \`${optionMeta.example.replace(/"/g, '\\"')}\`\n`;
      }
      
      doc += '\n';
    });
    
    // Add configuration example
    doc += '**Example configuration:**\n\n';
    doc += '```json\n';
    doc += '{\n';
    doc += `  "${ruleName}": {\n`;
    
    const exampleOptions = [];
    Object.entries(schema).forEach(([optionName]) => {
      const optionMeta = CONFIG_OPTION_METADATA[optionName] || {};
      if (!optionMeta.deprecated && optionMeta.example) {
        exampleOptions.push(`    "${optionName}": ${optionMeta.example}`);
      }
    });
    
    if (exampleOptions.length > 0) {
      doc += exampleOptions.join(',\n') + '\n';
    }
    
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
  }
  
  return doc;
}

/**
 * Generate complete configuration documentation
 * @returns {Promise<string>} Complete documentation markdown
 */
async function generateConfigDocs() {
  const ruleFiles = await glob('src/rules/*.js', { cwd: projectRoot });
  const rules = [];
  
  for (const ruleFile of ruleFiles) {
    // Skip utility files
    if (ruleFile.includes('shared-') || ruleFile.includes('config-validation') || ruleFile.includes('autofix-safety')) {
      continue;
    }
    
    const fullPath = join(projectRoot, ruleFile);
    const content = await readFile(fullPath, 'utf8');
    
    const schema = extractConfigSchema(content);
    const names = extractRuleNames(content);
    const description = extractRuleDescription(content);
    
    if (names.length > 0) {
      const primaryName = names[0];
      rules.push({
        name: primaryName,
        aliases: names,
        schema,
        description,
        filePath: ruleFile
      });
    }
  }
  
  // Sort rules alphabetically
  rules.sort((a, b) => a.name.localeCompare(b.name));
  
  let doc = `# Configuration reference

This document provides comprehensive configuration options for all markdownlint-trap rules.

## Overview

markdownlint-trap rules can be configured in your \`.markdownlint.jsonc\` configuration file. Each rule accepts specific configuration options to customize its behavior.

## Configuration format

\`\`\`json
{
  "default": true,
  "rule-name": {
    "option1": "value1",
    "option2": ["array", "of", "values"]
  }
}
\`\`\`

## Rules

`;
  
  for (const rule of rules) {
    doc += generateRuleDoc(rule.name, rule.schema, rule.description, rule.aliases);
  }
  
  // Add global configuration section
  doc += `## Global configuration

### Common patterns

**Disable specific rules:**
\`\`\`json
{
  "default": true,
  "sentence-case-heading": false,
  "no-bare-urls": false
}
\`\`\`

**Configure multiple rules:**
\`\`\`json
{
  "default": true,
  "sentence-case-heading": {
    "specialTerms": ["API", "GitHub", "OAuth"]
  },
  "backtick-code-elements": {
    "ignoredTerms": ["README", "LICENSE"]
  },
  "no-bare-urls": {
    "allowedDomains": ["localhost", "example.com"]
  }
}
\`\`\`

### Environment-specific configuration

**Development environment:**
\`\`\`json
{
  "default": true,
  "no-dead-internal-links": {
    "ignoredPaths": ["node_modules/**", "dist/**", ".git/**"]
  }
}
\`\`\`

**Documentation-focused:**
\`\`\`json
{
  "default": true,
  "sentence-case-heading": {
    "specialTerms": ["API", "REST", "JSON", "HTTP", "HTTPS"]
  },
  "backtick-code-elements": {
    "ignoredTerms": ["README", "CHANGELOG", "LICENSE"]
  }
}
\`\`\`

## Migration guide

### Deprecated options

Some configuration options have been deprecated in favor of more consistent naming:

| Rule | Deprecated Option | New Option | Migration |
|------|------------------|------------|-----------|
| \`sentence-case-heading\` | \`technicalTerms\` | \`specialTerms\` | Rename the option |
| \`sentence-case-heading\` | \`properNouns\` | \`specialTerms\` | Rename the option |

**Before:**
\`\`\`json
{
  "sentence-case-heading": {
    "technicalTerms": ["API", "REST"],
    "properNouns": ["GitHub", "OAuth"]
  }
}
\`\`\`

**After:**
\`\`\`json
{
  "sentence-case-heading": {
    "specialTerms": ["API", "REST", "GitHub", "OAuth"]
  }
}
\`\`\`

---

*This documentation was auto-generated from rule configuration schemas. Last updated: ${new Date().toISOString().split('T')[0]}*
`;
  
  return doc;
}

/**
 * Main function to generate and save documentation
 */
async function main() {
  try {
    console.log('Generating configuration documentation...');
    
    const docs = await generateConfigDocs();
    const outputPath = join(projectRoot, 'docs', 'configuration.md');
    
    await writeFile(outputPath, docs, 'utf8');
    
    console.log(`✅ Configuration documentation generated at: ${outputPath}`);
    console.log(`📄 Documentation contains ${docs.split('\n').length} lines`);
    
  } catch (error) {
    console.error('❌ Error generating configuration documentation:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}