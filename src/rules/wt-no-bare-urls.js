/**
 * @fileoverview Rule to enforce that URLs are always wrapped in a proper Markdown link.
 * @author 
 */

import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors 
} from './config-validation.js';

/**
 * @typedef {import("markdownlint").Rule} Rule
 * @typedef {import("markdownlint").RuleParams} RuleParams
 * @typedef {import("markdownlint").RuleOnError} RuleOnError
 */

/** @type {Rule} */
export default {
  names: ["wt/no-bare-urls"],
  description: "Bare URL used. Surround with < and >.",
  tags: ["links", "url"],
  function: 
    /**
     * @param {RuleParams} params
     * @param {RuleOnError} onError
     */
    function rule(params, onError) {
      // This rule relies on markdown-it's linkify option to identify bare URLs.
      // It flags any URL that was automatically converted into a link.
      // The fix is to wrap the URL in angle brackets, e.g., <http://example.com>.
      // Note: Ensure markdown-it is configured with { linkify: true } in your test setup.
      
      const config = params.config?.['wt/no-bare-urls'] || {};

      // Validate configuration
      const configSchema = {
        allowedDomains: validateStringArray,
        skipCodeBlocks: validateBoolean
      };

      const validationResult = validateConfig(config, configSchema, 'wt/no-bare-urls');
      if (!validationResult.isValid) {
        logValidationErrors('wt/no-bare-urls', validationResult.errors);
        // Continue execution with default values to prevent crashes
      }

      // Extract configuration with defaults
      const allowedDomains = Array.isArray(config.allowedDomains) ? config.allowedDomains : [];
      const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true; // eslint-disable-line no-unused-vars
      params.tokens.filter(t => t.type === "inline" && t.children).forEach(token => {
        token.children.forEach((child) => {
          if (child.type === "link_open" && child.info === "auto" && child.markup !== "autolink") {
            const href = child.attrGet("href");
            
            // Check if this URL domain is in the allowed list
            if (allowedDomains.length > 0) {
              try {
                const url = new URL(href);
                if (allowedDomains.includes(url.hostname)) {
                  return; // Skip allowed domains
                }
              } catch (e) {
                // If URL parsing fails, proceed with the error
              }
            }
            
            onError({ lineNumber: child.lineNumber, detail: "Bare URL used.", context: href });
          }
        });
      });
    },
};