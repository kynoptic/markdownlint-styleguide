// @ts-check

/**
 * Unit tests for the shared line-scanning context helper.
 *
 * The helper answers, for a given line + column, whether that offset sits inside
 * fenced code, an inline code span, a link destination, an HTML comment, or YAML
 * frontmatter. Line-scanning rules route through it instead of reimplementing
 * their own context regex.
 */

import { buildLineContext } from '../../src/rules/shared-context.js';

describe('shared-context', () => {
  describe('fenced code blocks', () => {
    test('should_report_fenced_code_when_inside_backtick_fence', () => {
      const lines = ['Intro', '```js', 'const x = 1;', '```', 'Outro'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFencedCode(2, 0)).toBe(true); // const x line
      expect(ctx.isInFencedCode(0, 0)).toBe(false); // Intro
      expect(ctx.isInFencedCode(4, 0)).toBe(false); // Outro
    });

    test('should_treat_fence_marker_lines_as_fenced_code', () => {
      const lines = ['```', 'code', '```'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFencedCode(0, 0)).toBe(true);
      expect(ctx.isInFencedCode(1, 0)).toBe(true);
      expect(ctx.isInFencedCode(2, 0)).toBe(true);
    });

    test('should_handle_tilde_fences', () => {
      const lines = ['~~~', 'code', '~~~', 'after'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFencedCode(1, 0)).toBe(true);
      expect(ctx.isInFencedCode(3, 0)).toBe(false);
    });

    test('should_treat_indented_code_blocks_as_code', () => {
      const lines = ['Para', '', '    indented code & more', '', 'After'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFencedCode(2, 0)).toBe(true);
      expect(ctx.isInFencedCode(0, 0)).toBe(false);
      expect(ctx.isInFencedCode(4, 0)).toBe(false);
    });

    test('should_not_close_fence_on_shorter_inner_fence', () => {
      const lines = ['````', '```', 'still code', '````', 'after'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFencedCode(1, 0)).toBe(true); // inner ``` is content
      expect(ctx.isInFencedCode(2, 0)).toBe(true);
      expect(ctx.isInFencedCode(4, 0)).toBe(false); // after the 4-backtick close
    });
  });

  describe('inline code spans', () => {
    test('should_report_inline_code_when_offset_inside_span', () => {
      const line = 'Use `npm install` to set up.';
      const lines = [line];
      const ctx = buildLineContext(lines);

      const inside = line.indexOf('npm');
      const outside = line.indexOf('Use');
      expect(ctx.isInInlineCode(0, inside)).toBe(true);
      expect(ctx.isInInlineCode(0, outside)).toBe(false);
    });

    test('should_handle_multi_backtick_inline_spans', () => {
      const line = 'Literal `` ` `` backtick here.';
      const lines = [line];
      const ctx = buildLineContext(lines);

      const insideSpan = line.indexOf('`', line.indexOf('`` ') + 3);
      expect(ctx.isInInlineCode(0, insideSpan)).toBe(true);
      const after = line.indexOf('backtick');
      expect(ctx.isInInlineCode(0, after)).toBe(false);
    });

    test('should_not_report_inline_code_inside_a_fence', () => {
      const lines = ['```', '`not a span`', '```'];
      const ctx = buildLineContext(lines);
      // Inside a fence, every offset is "code context"; inline detection
      // should not run, but the unified predicate must still report code.
      expect(ctx.isInCode(1, 0)).toBe(true);
    });
  });

  describe('link destinations', () => {
    test('should_report_link_destination_offsets', () => {
      const line = 'See [docs](https://example.com/path) now.';
      const lines = [line];
      const ctx = buildLineContext(lines);

      const destPos = line.indexOf('https://example.com');
      expect(ctx.isInLinkDestination(0, destPos)).toBe(true);

      const textPos = line.indexOf('docs');
      expect(ctx.isInLinkDestination(0, textPos)).toBe(false);

      const prosePos = line.indexOf('now');
      expect(ctx.isInLinkDestination(0, prosePos)).toBe(false);
    });

    test('should_handle_angle_bracketed_destinations', () => {
      const line = 'Link [x](<a b.md>) end.';
      const lines = [line];
      const ctx = buildLineContext(lines);

      const destPos = line.indexOf('a b.md');
      expect(ctx.isInLinkDestination(0, destPos)).toBe(true);
    });
  });

  describe('HTML comments', () => {
    test('should_report_single_line_html_comment', () => {
      const line = 'Text <!-- TODO & stuff --> after';
      const lines = [line];
      const ctx = buildLineContext(lines);

      const insidePos = line.indexOf('TODO');
      expect(ctx.isInHtmlComment(0, insidePos)).toBe(true);

      const beforePos = line.indexOf('Text');
      const afterPos = line.indexOf('after');
      expect(ctx.isInHtmlComment(0, beforePos)).toBe(false);
      expect(ctx.isInHtmlComment(0, afterPos)).toBe(false);
    });

    test('should_report_multi_line_html_comment', () => {
      const lines = ['Before', '<!-- start', 'middle & body', 'end -->', 'After'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInHtmlComment(2, 0)).toBe(true); // middle line
      expect(ctx.isInHtmlComment(0, 0)).toBe(false);
      expect(ctx.isInHtmlComment(4, 0)).toBe(false);
    });
  });

  describe('YAML frontmatter', () => {
    test('should_report_frontmatter_lines', () => {
      const lines = ['---', 'title: A & B', 'tags: [x]', '---', '# Heading'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFrontmatter(1, 0)).toBe(true);
      expect(ctx.isInFrontmatter(2, 0)).toBe(true);
      expect(ctx.isInFrontmatter(4, 0)).toBe(false); // heading is body
    });

    test('should_not_treat_horizontal_rule_as_frontmatter', () => {
      const lines = ['# Heading', '', '---', 'body'];
      const ctx = buildLineContext(lines);

      expect(ctx.isInFrontmatter(2, 0)).toBe(false);
    });
  });

  describe('unified isInCode / isInProse predicate', () => {
    test('should_flag_code_for_fenced_inline_and_link_destinations', () => {
      const lines = [
        '---',
        'k: v',
        '---',
        'Prose [t](http://x.com) and `code` and <!-- c -->.',
        '```',
        'fenced',
        '```'
      ];
      const ctx = buildLineContext(lines);

      // frontmatter body
      expect(ctx.isInCode(1, 0)).toBe(true);
      // link destination
      const destPos = lines[3].indexOf('http://x.com');
      expect(ctx.isInCode(3, destPos)).toBe(true);
      // inline code
      const codePos = lines[3].indexOf('code');
      expect(ctx.isInCode(3, codePos)).toBe(true);
      // html comment
      const commentPos = lines[3].indexOf('<!--') + 5;
      expect(ctx.isInCode(3, commentPos)).toBe(true);
      // fenced
      expect(ctx.isInCode(5, 0)).toBe(true);
      // plain prose
      const prosePos = lines[3].indexOf('Prose');
      expect(ctx.isInCode(3, prosePos)).toBe(false);
    });
  });
});
