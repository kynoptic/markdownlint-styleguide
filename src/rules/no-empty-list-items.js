/**
 * @fileoverview Rule to detect empty list items (common Word-to-Markdown conversion artifacts).
 */

/**
 * @typedef {import("markdownlint").Rule} Rule
 * @typedef {import("markdownlint").RuleParams} RuleParams
 * @typedef {import("markdownlint").RuleOnError} RuleOnError
 */

/** Token types micromark uses for a nested list. */
const NESTED_LIST_TYPES = new Set(["listOrdered", "listUnordered"]);

/**
 * Reports whether a token carries list item content.
 * A "content" token always does. A nested list token only does when one of its
 * own items carries content, so "1. 1." (an empty inner marker) stays empty
 * however deep the nesting goes.
 * @param {object} [token] - Micromark token to inspect
 * @returns {boolean} True when the token carries content
 */
function carriesContent(token) {
  if (!token) {
    return false;
  }
  if (token.type === "content") {
    return true;
  }
  if (!NESTED_LIST_TYPES.has(token.type)) {
    return false;
  }
  return (token.children || []).some((child) => carriesContent(child));
}

/**
 * Main rule implementation using micromark tokens.
 * Detects list items that have no content (only whitespace after the marker).
 * @param {RuleParams} params - Parsed Markdown input
 * @param {RuleOnError} onError - Callback to report violations
 */
function noEmptyListItems(params, onError) {
  const tokens = params.parsers?.micromark?.tokens || [];

  for (const token of tokens) {
    if (token.type !== "listUnordered" && token.type !== "listOrdered") {
      continue;
    }

    const children = token.children || [];
    for (let i = 0; i < children.length; i++) {
      if (children[i].type !== "listItemPrefix") {
        continue;
      }

      // The sibling after a prefix carries the item's content. It is a
      // "content" token normally, but micromark nests a whole list token
      // there when the item's text itself starts with a list marker
      // (for example "1. 1. text"), so inspect that nested list too.
      const hasContent = carriesContent(children[i + 1]);

      if (!hasContent) {
        onError({
          lineNumber: children[i].startLine,
          detail: "Empty list item found",
          context: params.lines[children[i].startLine - 1].trim(),
          fixInfo: {
            deleteCount: -1,
          },
        });
      }
    }
  }
}

/** @type {Rule} */
export default {
  names: ["no-empty-list-items", "ELI001"],
  description: "Empty list items are not allowed",
  tags: ["lists", "blank_lines"],
  parser: "micromark",
  function: noEmptyListItems,
};
