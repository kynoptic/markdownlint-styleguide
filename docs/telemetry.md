# Autofix telemetry

## Overview

Autofix telemetry exposes safety heuristic performance, revealing which heuristics block valid fixes (too aggressive) or allow questionable fixes (too permissive).

## Enabling telemetry

Telemetry is disabled by default with zero performance overhead. Initialize telemetry in your linting workflow to enable it:

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

- `enabled` (boolean): Toggle telemetry collection. Default: `false`
- `verbose` (boolean): Include individual decision details in console output. Default: `false`
- `outputFile` (string): Path for JSON output file (optional)

## What telemetry captures

Each autofix decision records:

- **Rule**: Which rule decided (`sentence-case`, `backtick`, etc.)
- **Original text**: The evaluated text
- **Fixed text**: The proposed fix
- **Confidence score**: Computed confidence (0-1)
- **Applied**: Whether the fix was applied
- **Reason**: Why the fix was skipped (if not applied)
- **Heuristics**: Which heuristics contributed to the confidence score
- **Location**: File and line number (when available)

## Understanding telemetry output

### Console format

```text
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

JSON output contains top-level keys: `decisions`, `statistics`, `insights`, and `metadata`. See `src/rules/autofix-telemetry.js` for the full schema.

## Performance considerations

Disabled telemetry adds zero overhead. Enabled telemetry costs ~100 bytes per decision and <1% CPU. Testing with 10,000+ decisions shows no noticeable impact.

## Use cases

- **Tuning safety heuristics**: Run telemetry on a representative corpus to find overly aggressive or permissive heuristics.
- **Debugging autofix issues**: Enable verbose mode to inspect individual decisions, including heuristic breakdowns and confidence scores.

## API reference

### AutofixTelemetry class

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

## Related documentation

- [Autofix safety strategy](./adr/adr-001-autofix-safety-strategy.md)
- [Testing guide](./testing.md)
- [Rules reference](./rules.md)
