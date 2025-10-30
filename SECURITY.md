# Security policy

## Automated vulnerability scanning

This project uses automated vulnerability scanning to detect and prevent security issues in dependencies before they reach production.

### Scanning tools

The CI pipeline runs two complementary security scanners on every pull request and push to main:

- **`npm audit`**: Scans production dependencies against the `npm advisory` database
- **Osv-scanner**: Cross-references dependencies against the Open Source Vulnerabilities database

### Severity thresholds

Builds fail automatically when high or critical vulnerabilities are detected in production dependencies (`npm audit --omit=dev --audit-level=high`). Development dependencies are excluded from blocking checks but should still be addressed when practical.

### Scan reports

Vulnerability scan results are uploaded as artifacts for every CI run and retained for 30 days. To view scan results:

1. Navigate to the **Actions** tab in the repository
2. Select the workflow run
3. Download the `vulnerability-scan-results` artifact

### Exception policy

When vulnerabilities cannot be immediately resolved (for example, no patch available, or patch requires breaking changes), they may be temporarily excepted using policy files:

#### npm audit exceptions

Edit `.npmauditrc.json` to add exceptions:

```json
{
  "exceptions": [
    {
      "id": "GHSA-xxxx-xxxx-xxxx",
      "reason": "No patch available; requires major version upgrade",
      "expiry": "2025-12-31"
    }
  ]
}
```

#### Osv-scanner exceptions

Edit `osv-scanner.toml` to add exceptions:

```toml
[[IgnoredVulns]]
id = "GHSA-1234-5678-90ab"
ignoreUntil = 2025-06-30
reason = "False positive - we don't use the vulnerable code path"
```

**Requirements for exceptions:**

- Document a clear justification explaining why the vulnerability cannot be fixed immediately
- Set an `ignoreUntil` date for review (maximum 6 months)
- Link to tracking issue if remediation requires significant work
- Limit to unavoidable situations only

### Reporting vulnerabilities

If you discover a security vulnerability in this project:

1. **Do not** open a public issue
2. Email the maintainers with details of the vulnerability
3. Allow reasonable time for a fix before public disclosure

### Maintaining security

Contributors should:

- Keep dependencies up to date using `npm update` regularly
- Review security advisories for critical dependencies
- Run `npm audit` locally before submitting pull requests
- Address security warnings in CI builds promptly

### Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [osv-scanner documentation](https://google.github.io/osv-scanner/)
- [GitHub security advisories](https://github.com/advisories)
