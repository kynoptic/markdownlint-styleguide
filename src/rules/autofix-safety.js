// @ts-check

/**
 * Autofix safety utilities to prevent incorrect automatic fixes.
 * These utilities help reduce false positive corrections and make autofix more reliable.
 */

import { getTelemetry } from './autofix-telemetry.js';
import { ambiguousTerms } from './shared-constants.js';
import { getNeedsReviewReporter } from '../cli/needs-review-reporter.js';
import { calculateSentenceCaseConfidence, calculateBacktickConfidence, analyzeCodeVsNaturalLanguage } from './autofix-confidence.js';

/**
 * Three-tier autofix thresholds for confidence-based decision making.
 *
 * | Tier | Confidence | Behavior |
 * |------|------------|----------|
 * | Auto-fix | >= 0.7 | Applied automatically, high confidence |
 * | Needs Review | 0.3 - 0.7 | Flagged for manual/AI verification |
 * | Skip | < 0.3 | Too uncertain, not worth surfacing |
 *
 * @type {{ autoFix: number, needsReview: number }}
 */
export const THREE_TIER_THRESHOLDS = {
  autoFix: 0.7,
  needsReview: 0.3
};

// Heuristic constants and scoring functions live in autofix-confidence.js.
// Re-exported here for backward compatibility with existing imports.
export { calculateSentenceCaseConfidence, calculateBacktickConfidence, analyzeCodeVsNaturalLanguage };

/**
 * Configuration for autofix safety checks.
 * @typedef {Object} AutofixSafetyConfig
 * @property {boolean} enabled - Whether safety checks are enabled
 * @property {number} confidenceThreshold - Minimum confidence score (0-1) for auto-fix tier (default: 0.7)
 * @property {number} reviewThreshold - Minimum confidence score (0-1) for needs-review tier (default: 0.3)
 * @property {string[]} safeWords - Words that are always safe to fix
 * @property {string[]} unsafeWords - Words that should never be auto-fixed
 * @property {boolean} requireManualReview - Whether certain fixes require manual review
 * @property {string[]} alwaysReview - Terms that should always go to needs-review tier
 * @property {string[]} neverFlag - Terms that should never be flagged at all (skip tier)
 */

/**
 * Default safety configuration.
 * Uses three-tier thresholds for auto-fix (0.7), needs-review (0.3), and skip (<0.3).
 * @type {AutofixSafetyConfig}
 */
export const DEFAULT_SAFETY_CONFIG = {
  enabled: true,
  confidenceThreshold: THREE_TIER_THRESHOLDS.autoFix,  // 0.7 - high confidence auto-fix
  reviewThreshold: THREE_TIER_THRESHOLDS.needsReview,  // 0.3 - minimum for needs-review
  safeWords: ['npm', 'api', 'url', 'html', 'css', 'json', 'xml', 'http', 'https'],
  unsafeWords: ['i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
  requireManualReview: false,
  alwaysReview: [],  // Terms that should always go to needs-review tier
  neverFlag: []       // Terms that should never be flagged
};

/**
 * Merge a per-rule safety configuration with the defaults.
 * Array fields (safeWords, unsafeWords, alwaysReview, neverFlag) are concatenated
 * with defaults (duplicates removed). Scalar fields override defaults.
 * @param {Partial<AutofixSafetyConfig>|null|undefined} overrides - Per-rule overrides
 * @returns {AutofixSafetyConfig} Merged configuration
 */
export function mergeAutofixSafetyConfig(overrides) {
  if (!overrides || typeof overrides !== 'object') {
    return { ...DEFAULT_SAFETY_CONFIG };
  }

  const merged = { ...DEFAULT_SAFETY_CONFIG };

  // Scalar overrides
  if (overrides.enabled !== undefined) merged.enabled = overrides.enabled;
  if (overrides.confidenceThreshold !== undefined) merged.confidenceThreshold = overrides.confidenceThreshold;
  if (overrides.reviewThreshold !== undefined) merged.reviewThreshold = overrides.reviewThreshold;
  if (overrides.requireManualReview !== undefined) merged.requireManualReview = overrides.requireManualReview;

  // Array fields: concatenate with defaults, deduplicate
  const mergeArrays = (defaults, additions) => {
    if (!additions || !Array.isArray(additions)) return [...defaults];
    return [...new Set([...defaults, ...additions])];
  };

  merged.safeWords = mergeArrays(DEFAULT_SAFETY_CONFIG.safeWords, overrides.safeWords);
  merged.unsafeWords = mergeArrays(DEFAULT_SAFETY_CONFIG.unsafeWords, overrides.unsafeWords);
  merged.alwaysReview = mergeArrays(DEFAULT_SAFETY_CONFIG.alwaysReview, overrides.alwaysReview);
  merged.neverFlag = mergeArrays(DEFAULT_SAFETY_CONFIG.neverFlag, overrides.neverFlag);

  return merged;
}

/**
 * Detect ambiguous terms in text and return ambiguity information.
 * @param {string} text - Text to analyze
 * @returns {{ isAmbiguous: boolean, term?: string, info?: Object, type?: string }} Ambiguity info
 */
function detectAmbiguity(text) {
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (ambiguousTerms[cleanWord]) {
      const termInfo = ambiguousTerms[cleanWord];

      // Determine ambiguity type based on the reason
      let type = 'proper-noun-or-common';
      if (termInfo.reason.includes('programming language')) {
        type = 'programming-language';
      } else if (termInfo.reason.includes('software') || termInfo.reason.includes('browser')) {
        type = 'product-name';
      } else if (termInfo.reason.includes('SemVer')) {
        type = 'semver-term';
      }

      return {
        isAmbiguous: true,
        term: cleanWord,
        info: termInfo,
        type
      };
    }
  }

  return { isAmbiguous: false };
}

/**
 * Determine the tier classification based on confidence and thresholds.
 * @param {number} confidence - Confidence score (0-1)
 * @param {number} autoFixThreshold - Threshold for auto-fix tier
 * @param {number} reviewThreshold - Threshold for needs-review tier
 * @returns {'auto-fix' | 'needs-review' | 'skip'} Tier classification
 */
function classifyTier(confidence, autoFixThreshold, reviewThreshold) {
  if (confidence >= autoFixThreshold) {
    return 'auto-fix';
  } else if (confidence >= reviewThreshold) {
    return 'needs-review';
  } else {
    return 'skip';
  }
}

/**
 * Check if an autofix should be applied based on safety rules.
 * Uses a three-tier system:
 * - Auto-fix (>= autoFixThreshold): Applied automatically
 * - Needs Review (reviewThreshold to autoFixThreshold): Flagged for review
 * - Skip (< reviewThreshold): Too uncertain to surface
 *
 * @param {string} ruleType - Type of rule (e.g., 'sentence-case', 'backtick')
 * @param {string} original - Original text
 * @param {string} fixed - Fixed text (for sentence-case)
 * @param {Object} context - Additional context
 * @param {AutofixSafetyConfig} config - Safety configuration
 * @returns {Object} Safety check result with tier classification
 */
export function shouldApplyAutofix(ruleType, original, fixed = '', context = {}, config = DEFAULT_SAFETY_CONFIG) {
  // Use three-tier thresholds, with config overrides
  const autoFixThreshold = config.confidenceThreshold ?? THREE_TIER_THRESHOLDS.autoFix;
  const reviewThreshold = config.reviewThreshold ?? THREE_TIER_THRESHOLDS.needsReview;

  if (!config.enabled) {
    return {
      safe: true,
      confidence: 1.0,
      reason: 'Safety checks disabled',
      heuristics: {},
      tier: 'auto-fix',
      requiresReview: false
    };
  }

  // Ensure original is a string for safe operations
  const originalStr = typeof original === 'string' ? original : String(original || '');

  // Check for neverFlag terms (skip entirely)
  if (config.neverFlag && Array.isArray(config.neverFlag) && originalStr) {
    const originalLower = originalStr.toLowerCase();
    for (const term of config.neverFlag) {
      if (originalLower.includes(term.toLowerCase())) {
        return {
          safe: false,
          confidence: 0,
          reason: `Term "${term}" is in neverFlag list`,
          heuristics: {},
          tier: 'skip',
          requiresReview: false
        };
      }
    }
  }

  // Check for alwaysReview terms (force to needs-review tier)
  let forceReview = false;
  let forceReviewTerm = null;
  if (config.alwaysReview && Array.isArray(config.alwaysReview) && originalStr) {
    const originalLower = originalStr.toLowerCase();
    for (const term of config.alwaysReview) {
      if (originalLower.includes(term.toLowerCase())) {
        forceReview = true;
        forceReviewTerm = term;
        break;
      }
    }
  }

  let confidence;
  let heuristics;
  let reason;

  switch (ruleType) {
    case 'sentence-case': {
      const result = calculateSentenceCaseConfidence(original, fixed, context);
      confidence = result.confidence;
      heuristics = result.heuristics;
      reason = 'Sentence case confidence: ' + confidence.toFixed(2);
      break;
    }

    case 'backtick': {
      const result = calculateBacktickConfidence(original, context);
      confidence = result.confidence;
      heuristics = result.heuristics;
      reason = 'Backtick confidence: ' + confidence.toFixed(2);
      break;
    }

    case 'no-bare-url': {
      // URLs are almost always safe to wrap in angle brackets
      // High confidence since the rule only triggers on valid URLs
      confidence = 0.9;
      heuristics = { baseConfidence: 0.9, urlPattern: true };
      reason = 'URL autofix confidence: 0.90 (bare URL wrapping is safe)';
      break;
    }

    case 'no-literal-ampersand': {
      // Replacing & with "and" is a safe stylistic change
      // High confidence since the rule only triggers on standalone ampersands
      confidence = 0.85;
      heuristics = { baseConfidence: 0.85, ampersandReplacement: true };
      reason = 'Ampersand replacement confidence: 0.85 (simple substitution)';
      break;
    }

    default:
      confidence = 0.5;
      reason = 'Unknown rule type';
  }

  // Detect ambiguity and apply penalty
  const ambiguityResult = detectAmbiguity(originalStr);
  let ambiguityInfo = null;

  if (ambiguityResult.isAmbiguous) {
    // Apply ambiguity penalty to confidence
    const ambiguityPenalty = 0.25;
    confidence = Math.max(0, confidence - ambiguityPenalty);
    heuristics.ambiguityPenalty = -ambiguityPenalty;
    heuristics.ambiguousTerm = ambiguityResult.term;
    reason += ` (ambiguous term: ${ambiguityResult.term})`;

    ambiguityInfo = {
      type: ambiguityResult.type,
      term: ambiguityResult.term,
      reason: ambiguityResult.info.reason,
      properForm: ambiguityResult.info.properForm
    };
  }

  // Apply per-rule safeWords boost
  if (config.safeWords && Array.isArray(config.safeWords) && originalStr) {
    const originalLower = originalStr.toLowerCase();
    if (config.safeWords.some(w => originalLower === w.toLowerCase())) {
      const safeBoost = 0.3;
      confidence = Math.min(1, confidence + safeBoost);
      heuristics.safeWordBoost = safeBoost;
      reason += ' (safe word match)';
    }
  }

  // Apply per-rule unsafeWords penalty
  if (config.unsafeWords && Array.isArray(config.unsafeWords) && originalStr) {
    const originalLower = originalStr.toLowerCase();
    if (config.unsafeWords.some(w => originalLower === w.toLowerCase())) {
      const unsafePenalty = 0.5;
      confidence = Math.max(0, confidence - unsafePenalty);
      heuristics.unsafeWordPenalty = -unsafePenalty;
      reason += ' (unsafe word match)';
    }
  }

  // Force to needs-review tier if term is in alwaysReview list
  if (forceReview) {
    return {
      safe: false,
      confidence: Math.min(confidence, autoFixThreshold - 0.01), // Just below auto-fix
      heuristics,
      reason: `Term "${forceReviewTerm}" is in alwaysReview list`,
      tier: 'needs-review',
      requiresReview: true,
      ambiguityInfo,
      suggestedFix: fixed
    };
  }

  // Classify into tier
  const tier = classifyTier(confidence, autoFixThreshold, reviewThreshold);
  const safe = tier === 'auto-fix';

  // requiresReview is true for:
  // 1. needs-review tier items (always)
  // 2. skip tier items when requireManualReview config is true (backward compatibility)
  const requiresReview = tier === 'needs-review' ||
    (config.requireManualReview === true && !safe);

  const result = {
    safe,
    confidence,
    heuristics,
    reason,
    tier,
    requiresReview
  };

  // Add ambiguity info if detected
  if (ambiguityInfo) {
    result.ambiguityInfo = ambiguityInfo;
  }

  // Add suggested fix for needs-review tier
  if (tier === 'needs-review' && fixed) {
    result.suggestedFix = fixed;
  }

  return result;
}

/**
 * Create a safer version of fixInfo that includes confidence scoring.
 * @param {Object} originalFixInfo - Original fix information
 * @param {string} ruleType - Type of rule
 * @param {string} original - Original text
 * @param {string} fixed - Fixed text
 * @param {Object} context - Additional context
 * @param {AutofixSafetyConfig} config - Safety configuration
 * @returns {Object|null} Safe fix info or null if unsafe
 */
export function createSafeFixInfo(originalFixInfo, ruleType, original, fixed, context = {}, config = DEFAULT_SAFETY_CONFIG) {
  if (!originalFixInfo) {
    return null;
  }

  // Use the existing safety check system for all rules
  const safetyCheck = shouldApplyAutofix(ruleType, original, fixed, context, config);

  // For backtick rules, also run the advanced analysis for additional insights
  let advancedAnalysis = null;
  if (ruleType === 'backtick') {
    advancedAnalysis = analyzeCodeVsNaturalLanguage(original, context);

    // If the advanced analysis strongly indicates this is NOT code, override the decision
    if (advancedAnalysis.confidence < 0.3) {
      // Record telemetry for skipped fix
      const telemetry = getTelemetry();
      telemetry.recordDecision({
        rule: ruleType,
        original,
        fixed,
        confidence: advancedAnalysis.confidence,
        applied: false,
        reason: 'Advanced analysis indicates not code (confidence < 0.3)',
        heuristics: safetyCheck.heuristics,
        file: context.file,
        line: context.line
      });

      return null;
    }
  }

  // Determine if fix will be applied based on tier
  const applied = safetyCheck.tier === 'auto-fix';

  // Record telemetry with tier information
  const telemetry = getTelemetry();
  telemetry.recordDecision({
    rule: ruleType,
    original,
    fixed,
    confidence: safetyCheck.confidence,
    applied,
    tier: safetyCheck.tier,
    reason: !applied ? safetyCheck.reason : undefined,
    heuristics: safetyCheck.heuristics,
    ambiguityInfo: safetyCheck.ambiguityInfo,
    file: context.file,
    line: context.line
  });

  // Record needs-review items to the global reporter
  if (safetyCheck.tier === 'needs-review') {
    const reporter = getNeedsReviewReporter();
    reporter.addItem({
      file: context.file || 'unknown',
      line: context.lineNumber || 0,
      rule: ruleType,
      original,
      suggested: fixed,
      confidence: safetyCheck.confidence,
      ambiguityInfo: safetyCheck.ambiguityInfo,
      context: context.line,
      heuristics: safetyCheck.heuristics
    });
  }

  // Only auto-fix for the auto-fix tier
  if (safetyCheck.tier !== 'auto-fix') {
    // Return null to disable autofix for needs-review and skip tiers
    return null;
  }

  // Add safety metadata to the fix info
  return {
    ...originalFixInfo,
    _safety: {
      confidence: safetyCheck.confidence,
      reason: safetyCheck.reason,
      ruleType,
      tier: safetyCheck.tier,
      advancedAnalysis,
      // Include review info for transparency
      reviewInfo: safetyCheck.requiresReview ? {
        original,
        suggested: fixed,
        reason: safetyCheck.reason,
        ambiguityInfo: safetyCheck.ambiguityInfo
      } : undefined
    }
  };
}
