# Autofix telemetry

## Overview

The autofix telemetry system provides structured visibility into safety heuristic performance, helping teams identify which heuristics are too aggressive (blocking valid fixes) or too permissive (allowing questionable fixes).

## Enabling telemetry

Telemetry is disabled by default and has zero performance overhead when disabled. To enable it, initialize the telemetry system in your linting workflow:

```javascript
import { initTelemetry } from 'markdownlint-trap/src/rules/autofix-telemetry.js';

// Enable telemetry
const telemetry = initTelemetry({
  enabled: true,
  verbose: false, // Set to true for detailed decision logs
  outputFile: './telemetry-output.json' // Optional: write to file
});

// Run your linting...

// Output results
console.log(telemetry.formatConsoleOutput());

// Or export as JSON
const jsonData = telemetry.toJSON();
fs.writeFileSync('./telemetry.json', jsonData);
```

## Configuration options

- `enabled` (boolean): Enable or disable telemetry collection. Default: `false`
- `verbose` (boolean): Include individual decision details in console output. Default: `false`
- `outputFile` (string): Optional path for JSON output file

## What telemetry captures

For each autofix decision, telemetry records:

- **Rule**: Which rule made the decision (`sentence-case`, `backtick`, etc.)
- **Original text**: The text being evaluated
- **Fixed text**: The proposed fix
- **Confidence score**: Computed confidence (0-1) for the fix
- **Applied**: Whether the fix was actually applied
- **Reason**: Why the fix was skipped (if not applied)
- **Heuristics**: Breakdown of which heuristics contributed to the confidence score
- **Location**: File and line number (when available)

## Understanding telemetry output

### Console format

```
=== Autofix Telemetry Summary ===

Total decisions: 45
Applied: 32 (71.1%)
Skipped: 13
Average confidence: 0.687

Confidence distribution:
  0.0-0.3 (low):    8
  0.3-0.5 (medium): 5
  0.5-0.7 (good):   12
  0.7-1.0 (high):   20

Per-rule statistics:
  sentence-case:
    Decisions: 12, Applied: 10, Avg confidence: 0.742
  backtick:
    Decisions: 33, Applied: 22, Avg confidence: 0.665

Potentially aggressive heuristics (may be blocking valid fixes):
  - naturalLanguagePenalty

Threshold recommendation:
  Many decisions near threshold are being skipped. Consider lowering threshold or reducing heuristic penalties.
```

### JSON format

The JSON output includes:

- `decisions`: Array of all individual decisions with full details
- `statistics`: Aggregated statistics per rule and overall
- `insights`: Actionable recommendations for tuning heuristics
- `metadata`: Runtime information (start time, duration, etc.)

Example structure:

```json
{
  "decisions": [
    {
      "rule": "backtick",
      "original": "npm",
      "fixed": "`npm`",
      "confidence": 0.85,
      "applied": true,
      "heuristics": {
        "baseConfidence": 0.5,
        "commandPattern": 0.3,
        "filePathPattern": 0,
        "naturalLanguagePenalty": 0,
        "contextAdjustment": 0.05
      },
      "file": "README.md",
      "line": 42,
      "timestamp": 1699564800000
    }
  ],
  "statistics": {
    "totalDecisions": 45,
    "applied": 32,
    "skipped": 13,
    "averageConfidence": 0.687,
    "applicationRate": 0.711,
    "byRule": { ... },
    "confidenceDistribution": { ... }
  },
  "insights": {
    "potentiallyAggressiveHeuristics": ["naturalLanguagePenalty"],
    "potentiallyPermissiveHeuristics": [],
    "thresholdRecommendations": { ... }
  },
  "metadata": {
    "startTime": 1699564800000,
    "endTime": 1699564805000,
    "duration": 5000
  }
}
```

## Analyzing telemetry data

### Identifying aggressive heuristics

Heuristics that frequently block fixes (appear in many skipped decisions with large negative values) may be too aggressive:

```javascript
const insights = telemetry.getInsights();

if (insights.potentiallyAggressiveHeuristics.length > 0) {
  console.log('Consider tuning these heuristics:');
  insights.potentiallyAggressiveHeuristics.forEach(h => {
    console.log(`  - ${h}`);
  });
}
```

### Identifying permissive heuristics

Heuristics that allow fixes with low confidence (appear in applied decisions with confidence just above threshold) may be too permissive:

```javascript
if (insights.potentiallyPermissiveHeuristics.length > 0) {
  console.log('These heuristics may allow questionable fixes:');
  insights.potentiallyPermissiveHeuristics.forEach(h => {
    console.log(`  - ${h}`);
  });
}
```

### Analyzing confidence distribution

The distribution shows how often decisions fall into each confidence range:

- **0.0-0.3 (low)**: Usually correctly skipped; high counts here are normal
- **0.3-0.5 (medium)**: Near-threshold decisions; monitor for patterns
- **0.5-0.7 (good)**: Safe to apply; this is the target range
- **0.7-1.0 (high)**: Very confident fixes; should always be applied

If many decisions cluster near 0.5 (the default threshold), consider adjusting heuristic weights for clearer separation.

## Performance considerations

When **disabled** (default), telemetry has zero performance overhead:

```javascript
const telemetry = initTelemetry({ enabled: false });
// No-op calls, negligible cost
```

When **enabled**, telemetry adds minimal overhead:

- Memory: ~100 bytes per decision
- CPU: <1% overhead for typical documents
- Tested with 10,000+ decisions with no noticeable impact

## Use cases

### Tuning safety heuristics

Run telemetry on a representative corpus of documents to identify heuristic issues:

```bash
# Enable telemetry, run linting, analyze output
node scripts/run-with-telemetry.js corpus/**/*.md > telemetry-report.txt
```

### Debugging autofix issues

When a fix is unexpectedly skipped or applied:

```javascript
const telemetry = initTelemetry({ enabled: true, verbose: true });

// Run linting...

// Find specific decision
const decisions = telemetry.getData().decisions;
const problematic = decisions.find(d => 
  d.original === 'the text in question'
);

console.log('Decision details:', problematic);
console.log('Heuristics:', problematic.heuristics);
```

### Regression testing

Track telemetry statistics over time to detect changes in heuristic behavior:

```javascript
// Baseline
const baseline = { applied: 0.75, averageConfidence: 0.68 };

// Current run
const stats = telemetry.getStatistics();

if (Math.abs(stats.applicationRate - baseline.applied) > 0.1) {
  console.warn('Application rate changed significantly');
}
```

## Integration with CI/CD

Export telemetry data in CI for analysis:

```yaml
- name: Run linting with telemetry
  run: |
    node scripts/lint-with-telemetry.js
    
- name: Upload telemetry artifacts
  uses: actions/upload-artifact@v3
  with:
    name: telemetry-report
    path: telemetry-output.json
```

## API reference

### AutofixTelemetry class

#### Constructor

```javascript
new AutofixTelemetry(config)
```

Parameters:
- `config.enabled` (boolean): Enable telemetry
- `config.verbose` (boolean): Include verbose output
- `config.outputFile` (string): Optional output file path

#### Methods

- `recordDecision(decision)`: Record an autofix decision
- `getData()`: Get raw telemetry data
- `getStatistics()`: Get aggregated statistics
- `getInsights()`: Get actionable recommendations
- `formatConsoleOutput()`: Format for console display
- `toJSON()`: Export as JSON string
- `reset()`: Clear all telemetry data

### Global functions

```javascript
import { initTelemetry, getTelemetry, resetTelemetry } from '...';

// Initialize global instance
initTelemetry({ enabled: true });

// Access from anywhere
const telemetry = getTelemetry();

// Reset between runs
resetTelemetry();
```

## Troubleshooting

### Telemetry not collecting data

Ensure telemetry is enabled before linting:

```javascript
const telemetry = initTelemetry({ enabled: true });
// Must be called before running rules
```

### Large telemetry files

For very large documents, consider:

- Filtering decisions by confidence threshold
- Sampling (record every Nth decision)
- Aggregating only statistics, not individual decisions

### Memory usage

Reset telemetry between large batches:

```javascript
for (const batch of largeBatches) {
  resetTelemetry();
  // Process batch...
  exportTelemetryData();
}
```

## Related documentation

- [Autofix safety strategy](./adr/adr-001-autofix-safety-strategy.md)
- [Testing guide](./testing.md)
- [Rules reference](./rules.md)
