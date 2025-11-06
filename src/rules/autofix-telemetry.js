// @ts-check

/**
 * Autofix telemetry system for capturing and analyzing safety heuristic performance.
 * Provides structured visibility into autofix decisions, confidence scores, and heuristic contributions.
 */

/**
 * @typedef {Object} TelemetryDecision
 * @property {string} rule - Rule that made the decision
 * @property {string} original - Original text
 * @property {string} [fixed] - Fixed text (if applicable)
 * @property {number} confidence - Confidence score (0-1)
 * @property {boolean} applied - Whether the fix was applied
 * @property {string} [reason] - Reason for skipping (if not applied)
 * @property {Object} [heuristics] - Heuristic contributions to confidence score
 * @property {string} [file] - Source file
 * @property {number} [line] - Line number
 * @property {number} [timestamp] - Decision timestamp
 */

/**
 * @typedef {Object} TelemetryConfig
 * @property {boolean} enabled - Whether telemetry is enabled
 * @property {string} [outputFile] - Optional file path for JSON output
 * @property {boolean} [verbose] - Whether to log verbose output
 */

/**
 * @typedef {Object} RuleStatistics
 * @property {number} totalDecisions - Total decisions made
 * @property {number} applied - Number of fixes applied
 * @property {number} skipped - Number of fixes skipped
 * @property {number} averageConfidence - Average confidence score
 * @property {number} applicationRate - Rate of fixes applied (0-1)
 */

/**
 * @typedef {Object} TelemetryStatistics
 * @property {number} totalDecisions - Total decisions across all rules
 * @property {number} applied - Total fixes applied
 * @property {number} skipped - Total fixes skipped
 * @property {number} averageConfidence - Average confidence score
 * @property {number} applicationRate - Rate of fixes applied (0-1)
 * @property {Object<string, RuleStatistics>} byRule - Statistics per rule
 * @property {Object<string, number>} confidenceDistribution - Distribution of confidence scores
 */

/**
 * @typedef {Object} TelemetryInsights
 * @property {string[]} potentiallyAggressiveHeuristics - Heuristics that may be blocking valid fixes
 * @property {string[]} potentiallyPermissiveHeuristics - Heuristics that may be allowing questionable fixes
 * @property {Object} thresholdRecommendations - Recommendations for threshold adjustments
 * @property {number} thresholdRecommendations.nearThresholdCount - Decisions near threshold
 * @property {number} thresholdRecommendations.currentThreshold - Current threshold (typically 0.5)
 * @property {string} thresholdRecommendations.suggestion - Human-readable suggestion
 */

/**
 * Autofix telemetry collector with zero-cost when disabled.
 */
export class AutofixTelemetry {
  /**
   * Create a new telemetry collector.
   * @param {TelemetryConfig} config - Telemetry configuration
   */
  constructor(config = { enabled: false }) {
    this.config = config;
    this.decisions = [];
    this.startTime = Date.now();
  }

  /**
   * Record an autofix decision.
   * @param {TelemetryDecision} decision - Decision details
   */
  recordDecision(decision) {
    // Zero-cost no-op when disabled
    if (!this.config.enabled) {
      return;
    }

    this.decisions.push({
      ...decision,
      timestamp: Date.now()
    });
  }

  /**
   * Get raw telemetry data.
   * @returns {Object} Raw telemetry data
   */
  getData() {
    return {
      decisions: this.decisions,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }

  /**
   * Calculate aggregate statistics.
   * @returns {TelemetryStatistics} Aggregated statistics
   */
  getStatistics() {
    if (this.decisions.length === 0) {
      return {
        totalDecisions: 0,
        applied: 0,
        skipped: 0,
        averageConfidence: 0,
        applicationRate: 0,
        byRule: {},
        confidenceDistribution: {
          '0.0-0.3': 0,
          '0.3-0.5': 0,
          '0.5-0.7': 0,
          '0.7-1.0': 0
        }
      };
    }

    const applied = this.decisions.filter(d => d.applied).length;
    const skipped = this.decisions.length - applied;
    const averageConfidence = this.decisions.reduce((sum, d) => sum + d.confidence, 0) / this.decisions.length;

    // Calculate per-rule statistics
    const byRule = {};
    for (const decision of this.decisions) {
      if (!byRule[decision.rule]) {
        byRule[decision.rule] = {
          totalDecisions: 0,
          applied: 0,
          skipped: 0,
          averageConfidence: 0,
          applicationRate: 0,
          confidences: []
        };
      }

      byRule[decision.rule].totalDecisions++;
      byRule[decision.rule].confidences.push(decision.confidence);
      
      if (decision.applied) {
        byRule[decision.rule].applied++;
      } else {
        byRule[decision.rule].skipped++;
      }
    }

    // Calculate averages and rates per rule
    for (const rule in byRule) {
      const stats = byRule[rule];
      stats.averageConfidence = stats.confidences.reduce((sum, c) => sum + c, 0) / stats.confidences.length;
      stats.applicationRate = stats.applied / stats.totalDecisions;
      delete stats.confidences; // Remove temporary array
    }

    // Calculate confidence distribution
    const confidenceDistribution = {
      '0.0-0.3': 0,
      '0.3-0.5': 0,
      '0.5-0.7': 0,
      '0.7-1.0': 0
    };

    for (const decision of this.decisions) {
      const conf = decision.confidence;
      if (conf < 0.3) {
        confidenceDistribution['0.0-0.3']++;
      } else if (conf < 0.5) {
        confidenceDistribution['0.3-0.5']++;
      } else if (conf < 0.7) {
        confidenceDistribution['0.5-0.7']++;
      } else {
        confidenceDistribution['0.7-1.0']++;
      }
    }

    return {
      totalDecisions: this.decisions.length,
      applied,
      skipped,
      averageConfidence,
      applicationRate: applied / this.decisions.length,
      byRule,
      confidenceDistribution
    };
  }

  /**
   * Generate actionable insights from telemetry data.
   * @returns {TelemetryInsights} Insights for heuristic tuning
   */
  getInsights() {
    const insights = {
      potentiallyAggressiveHeuristics: [],
      potentiallyPermissiveHeuristics: [],
      thresholdRecommendations: {
        nearThresholdCount: 0,
        currentThreshold: 0.5,
        suggestion: ''
      }
    };

    if (this.decisions.length === 0) {
      return insights;
    }

    // Analyze heuristic patterns in skipped fixes
    const heuristicPenalties = {};
    const skippedDecisions = this.decisions.filter(d => !d.applied && d.heuristics);

    for (const decision of skippedDecisions) {
      for (const [heuristic, value] of Object.entries(decision.heuristics)) {
        if (value < 0) { // Negative contributions (penalties)
          if (!heuristicPenalties[heuristic]) {
            heuristicPenalties[heuristic] = { count: 0, totalPenalty: 0 };
          }
          heuristicPenalties[heuristic].count++;
          heuristicPenalties[heuristic].totalPenalty += Math.abs(value);
        }
      }
    }

    // Identify aggressive heuristics (frequently blocking fixes)
    for (const [heuristic, data] of Object.entries(heuristicPenalties)) {
      if (data.count >= 3 && data.totalPenalty / data.count > 0.2) {
        insights.potentiallyAggressiveHeuristics.push(heuristic);
      }
    }

    // Analyze heuristic patterns in applied fixes with low confidence
    const heuristicBoosts = {};
    const lowConfidenceApplied = this.decisions.filter(d => d.applied && d.confidence < 0.6 && d.heuristics);

    for (const decision of lowConfidenceApplied) {
      for (const [heuristic, value] of Object.entries(decision.heuristics)) {
        if (value > 0) { // Positive contributions (boosts)
          if (!heuristicBoosts[heuristic]) {
            heuristicBoosts[heuristic] = { count: 0, totalBoost: 0 };
          }
          heuristicBoosts[heuristic].count++;
          heuristicBoosts[heuristic].totalBoost += value;
        }
      }
    }

    // Identify permissive heuristics (allowing questionable fixes)
    for (const [heuristic, data] of Object.entries(heuristicBoosts)) {
      if (data.count >= 3 && data.totalBoost / data.count < 0.15) {
        insights.potentiallyPermissiveHeuristics.push(heuristic);
      }
    }

    // Analyze decisions near threshold (0.45 - 0.55)
    const nearThreshold = this.decisions.filter(d => d.confidence >= 0.45 && d.confidence <= 0.55);
    insights.thresholdRecommendations.nearThresholdCount = nearThreshold.length;

    if (nearThreshold.length > this.decisions.length * 0.3) {
      insights.thresholdRecommendations.suggestion = 
        'High concentration of decisions near threshold (0.5). Consider adjusting heuristic weights for clearer separation.';
    } else if (nearThreshold.length > 0) {
      const appliedNearThreshold = nearThreshold.filter(d => d.applied).length;
      const rate = appliedNearThreshold / nearThreshold.length;
      
      if (rate < 0.3) {
        insights.thresholdRecommendations.suggestion = 
          'Many decisions near threshold are being skipped. Consider lowering threshold or reducing heuristic penalties.';
      } else if (rate > 0.7) {
        insights.thresholdRecommendations.suggestion = 
          'Many decisions near threshold are being applied. Consider raising threshold or increasing heuristic penalties for safety.';
      }
    }

    return insights;
  }

  /**
   * Format telemetry data for console output.
   * @returns {string} Formatted console output
   */
  formatConsoleOutput() {
    const stats = this.getStatistics();
    const insights = this.getInsights();
    
    let output = '\n=== Autofix Telemetry Summary ===\n\n';
    
    output += 'Total decisions: ' + stats.totalDecisions + '\n';
    output += 'Applied: ' + stats.applied + ' (' + (stats.applicationRate * 100).toFixed(1) + '%)\n';
    output += 'Skipped: ' + stats.skipped + '\n';
    output += 'Average confidence: ' + stats.averageConfidence.toFixed(3) + '\n\n';
    
    output += 'Confidence distribution:\n';
    output += '  0.0-0.3 (low):    ' + stats.confidenceDistribution['0.0-0.3'] + '\n';
    output += '  0.3-0.5 (medium): ' + stats.confidenceDistribution['0.3-0.5'] + '\n';
    output += '  0.5-0.7 (good):   ' + stats.confidenceDistribution['0.5-0.7'] + '\n';
    output += '  0.7-1.0 (high):   ' + stats.confidenceDistribution['0.7-1.0'] + '\n\n';
    
    output += 'Per-rule statistics:\n';
    for (const [rule, ruleStats] of Object.entries(stats.byRule)) {
      output += '  ' + rule + ':\n';
      output += '    Decisions: ' + ruleStats.totalDecisions + ', ';
      output += 'Applied: ' + ruleStats.applied + ', ';
      output += 'Avg confidence: ' + ruleStats.averageConfidence.toFixed(3) + '\n';
    }
    
    if (insights.potentiallyAggressiveHeuristics.length > 0) {
      output += '\nPotentially aggressive heuristics (may be blocking valid fixes):\n';
      for (const heuristic of insights.potentiallyAggressiveHeuristics) {
        output += '  - ' + heuristic + '\n';
      }
    }
    
    if (insights.potentiallyPermissiveHeuristics.length > 0) {
      output += '\nPotentially permissive heuristics (may be allowing questionable fixes):\n';
      for (const heuristic of insights.potentiallyPermissiveHeuristics) {
        output += '  - ' + heuristic + '\n';
      }
    }
    
    if (insights.thresholdRecommendations.suggestion) {
      output += '\nThreshold recommendation:\n  ' + insights.thresholdRecommendations.suggestion + '\n';
    }
    
    if (this.config.verbose && this.decisions.length > 0) {
      output += '\n=== Individual Decisions ===\n';
      for (const decision of this.decisions.slice(0, 20)) {
        const location = decision.file ? decision.file + ':' + decision.line : 'unknown';
        output += '\n[' + decision.rule + '] ' + location + '\n';
        output += '  Original: "' + decision.original + '"\n';
        if (decision.fixed) {
          output += '  Fixed: "' + decision.fixed + '"\n';
        }
        output += '  Confidence: ' + decision.confidence.toFixed(3) + '\n';
        output += '  Applied: ' + decision.applied + '\n';
        if (decision.reason) {
          output += '  Reason: ' + decision.reason + '\n';
        }
        if (decision.heuristics) {
          output += '  Heuristics:\n';
          for (const [name, value] of Object.entries(decision.heuristics)) {
            output += '    ' + name + ': ' + (typeof value === 'number' ? value.toFixed(3) : value) + '\n';
          }
        }
      }
      if (this.decisions.length > 20) {
        output += '\n... and ' + (this.decisions.length - 20) + ' more decisions\n';
      }
    }
    
    output += '\n';
    return output;
  }

  /**
   * Convert telemetry data to JSON.
   * @returns {string} JSON representation
   */
  toJSON() {
    return JSON.stringify({
      decisions: this.decisions,
      statistics: this.getStatistics(),
      insights: this.getInsights(),
      metadata: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime
      }
    }, null, 2);
  }

  /**
   * Reset telemetry data.
   */
  reset() {
    this.decisions = [];
    this.startTime = Date.now();
  }
}

/**
 * Singleton telemetry instance for global access.
 * Can be configured once and accessed from any rule.
 */
let globalTelemetry = null;

/**
 * Initialize global telemetry instance.
 * @param {TelemetryConfig} config - Telemetry configuration
 */
export function initTelemetry(config) {
  globalTelemetry = new AutofixTelemetry(config);
  return globalTelemetry;
}

/**
 * Get the global telemetry instance.
 * @returns {AutofixTelemetry} Global telemetry instance
 */
export function getTelemetry() {
  if (!globalTelemetry) {
    globalTelemetry = new AutofixTelemetry({ enabled: false });
  }
  return globalTelemetry;
}

/**
 * Reset global telemetry instance.
 */
export function resetTelemetry() {
  if (globalTelemetry) {
    globalTelemetry.reset();
  }
}
