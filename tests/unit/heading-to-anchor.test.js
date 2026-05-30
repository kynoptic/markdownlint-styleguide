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
});
