import { _forTesting } from '../../src/rules/no-dead-internal-links.js';

const { headingToAnchor } = _forTesting;

describe('headingToAnchor', () => {
  test('should retain accented Unicode letters like GitHub', () => {
    expect(headingToAnchor('Diátaxis')).toBe('diátaxis');
  });

  test('should retain accents within a multi-word heading', () => {
    expect(headingToAnchor('Classify Diátaxis type')).toBe('classify-diátaxis-type');
  });

  test('should keep ASCII slug behavior unchanged', () => {
    expect(headingToAnchor('evals.json')).toBe('evalsjson');
    expect(headingToAnchor("don't")).toBe('dont');
  });

  test('should collapse whitespace into hyphens and strip punctuation', () => {
    expect(headingToAnchor('Hello World!')).toBe('hello-world');
  });

  test('should map each space to its own hyphen after punctuation is stripped', () => {
    expect(headingToAnchor('Theft \u2014 host hardening does not close it'))
      .toBe('theft--host-hardening-does-not-close-it');
  });

  test('should drop non-space whitespace instead of hyphenating it', () => {
    expect(headingToAnchor('Alpha\tBeta')).toBe('alphabeta');
    expect(headingToAnchor('Alpha \t Beta')).toBe('alpha--beta');
  });
});
