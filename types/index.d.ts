import * as markdownlint from 'markdownlint';

/**
 * Extended Rule interface that includes our custom properties
 */
export interface CustomRule extends markdownlint.Rule {
  helpers?: {
    checkText: Function;
    checkSegment: Function;
    shouldExclude: Function;
    isInRegion: Function;
    getRegions: Function;
  };
}

/**
 * Type guard to check if a rule is a CustomRule with helpers
 */
export function isCustomRule(rule: markdownlint.Rule | CustomRule): rule is CustomRule {
  return 'helpers' in rule;
}
