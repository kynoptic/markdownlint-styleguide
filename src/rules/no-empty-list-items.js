/**
 * @fileoverview Rule to detect empty list items (common Word-to-Markdown conversion artifacts).
 */

/**
 * @typedef {import("markdownlint").Rule} Rule
 * @typedef {import("markdownlint").RuleParams} RuleParams
 * @typedef {import("markdownlint").RuleOnError} RuleOnError
 */

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

      // Check if the next meaningful sibling is content
      const next = children[i + 1];
      const hasContent = next && next.type === "content";

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
