// @ts-check

/**
 * Confidence-scoring heuristics for autofix safety decisions.
 * Pure functions — no side effects, no telemetry, no reporter integration.
 * Used by autofix-safety.js to score sentence-case and backtick fixes.
 */

/**
 * Set of command keywords for efficient lookup
 * @type {Set<string>}
 */
const COMMAND_KEYWORDS = new Set([
  'npm', 'yarn', 'git', 'docker', 'kubectl', 'curl', 'wget', 'ssh', 'scp', 'rsync',
  'grep', 'sed', 'awk', 'find', 'ls', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'chmod',
  'chown', 'sudo', 'su', 'ps', 'top', 'htop', 'kill', 'killall', 'systemctl',
  'service', 'crontab', 'tar', 'gzip', 'zip', 'unzip', 'cat', 'head', 'tail',
  'less', 'more', 'vim', 'nano', 'emacs', 'code', 'open', 'explorer', 'ping',
  'traceroute', 'nslookup', 'dig', 'netstat', 'ss', 'iptables', 'ufw', 'tcpdump',
  'wireshark', 'nmap', 'john', 'hashcat', 'hydra', 'metasploit', 'burp', 'owasp',
  'nikto', 'sqlmap', 'aircrack', 'reaver'
]);

/**
 * Bare file extension strings used to identify code file references.
 * Matched against the extension extracted from a filename (without the dot).
 * Only genuine file format extensions are included — not filenames or pipeline names.
 * @type {Set<string>}
 */
const CODE_FILE_EXTENSIONS = new Set([
  // Source code
  'js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'scala',
  'php', 'pl', 'lua', 'r', 'ex', 'exs', 'erl', 'hs', 'clj', 'fs', 'fsx',
  // Shell
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  // Query and data
  'sql', 'graphql', 'gql',
  // Markup and style
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'xml', 'svg', 'vue', 'svelte',
  // Config and data formats
  'json', 'jsonc', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env',
  // Docs
  'md', 'mdx', 'rst', 'txt',
  // Build artifacts and lock files
  'lock', 'sum',
  // Compiled / binary descriptors
  'wasm', 'so', 'dll', 'dylib',
  // Dotfile names matched as extensions via getFileExtension() on `.name` paths
  'gitignore', 'dockerignore', 'gitattributes', 'npmignore',
  'editorconfig', 'prettierrc', 'eslintrc', 'babelrc', 'stylelintrc',
]);

/**
 * Common English words that are rarely appropriate for backticks
 * @type {string[]}
 */
const COMMON_WORDS = [
  'i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
  'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
  'all', 'any', 'some', 'many', 'much', 'few', 'little', 'most', 'more', 'less',
  'one', 'two', 'three', 'first', 'last', 'next', 'previous', 'before', 'after'
];

/**
 * Natural language phrases that should not be wrapped in backticks
 * @type {string[]}
 */
const NATURAL_LANGUAGE_PHRASES = [
  'read/write', 'pass/fail', 'on/off', 'in/out', 'up/down', 'left/right', 'true/false', 'yes/no',
  'black/white', 'day/night', 'hot/cold', 'big/small', 'fast/slow', 'high/low', 'old/new',
  'start/stop', 'begin/end', 'open/close', 'save/load', 'push/pull', 'give/take',
  'buy/sell', 'win/lose', 'love/hate', 'good/bad', 'right/wrong', 'rich/poor',
  'male/female', 'young/old', 'early/late', 'easy/hard', 'safe/dangerous'
];

/**
 * Regex patterns that commonly cause false positives for code detection
 * @type {RegExp[]}
 */
const PROBLEMATIC_PATTERNS = [
  /^[a-z]{1,3}$/, // Very short lowercase words (e.g., 'is', 'or', 'in')
  /^(go|do|be|if|it|my|we|he|she|you|us|me|him|her|our|his|its|who|what|why|how|when|where)$/i, // Common English words
  /^(one|two|three|four|five|six|seven|eight|nine|ten)$/i, // Number words
  /^(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey)$/i, // Color words
  /^(big|small|large|tiny|huge|mini|max|min)$/i, // Size words
  /^(new|old|fresh|stale|young|ancient|modern|classic)$/i, // Age/time words
  /^(good|bad|nice|cool|hot|cold|warm|best|worst|better|worse)$/i, // Quality words
  /^(quick|slow|fast|rapid|swift|delayed|instant)$/i, // Speed words
  /^(easy|hard|simple|complex|basic|advanced|tough|difficult)$/i, // Complexity words
];

/**
 * Natural language context indicators that suggest non-code content
 * @type {string[]}
 */
const NATURAL_LANGUAGE_INDICATORS = [
  'is a', 'are a', 'was a', 'were a', 'this is', 'that is', 'it is', 'he is', 'she is',
  'would be', 'could be', 'should be', 'might be', 'must be',
  'i think', 'i believe', 'in my opinion', 'personally', 'generally',
  'for example', 'such as', 'like this', 'as follows', 'namely',
  'however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
  'note that', 'remember that', 'keep in mind', 'be aware', 'make sure'
];

/**
 * Technical context indicators that suggest code content
 * @type {string[]}
 */
const TECHNICAL_INDICATORS = [
  'install', 'configure', 'setup', 'deploy', 'build', 'compile', 'run', 'execute',
  'command', 'script', 'function', 'method', 'class', 'variable', 'parameter',
  'api', 'endpoint', 'request', 'response', 'server', 'client', 'database',
  'repository', 'branch', 'commit', 'merge', 'push', 'pull', 'clone', 'fork'
];

/**
 * Precompiled regex for technical term detection in sentence case confidence.
 * Hoisted to module scope to avoid recompilation on every call.
 * @type {RegExp}
 */
const TECHNICAL_TERM_PATTERN = /\b(API|URL|HTML|CSS|JSON|XML|HTTP|HTTPS|SDK|CLI|GUI|UI|UX|SQL|NoSQL|REST|GraphQL|JWT|OAuth|CSRF|XSS|CORS|DNS|CDN|VPN|SSL|TLS|SSH|FTP|SMTP|POP|IMAP|TCP|UDP|IP|IPv4|IPv6|MAC|VLAN|LAN|WAN|WiFi|Bluetooth|USB|HDMI|GPU|CPU|RAM|SSD|HDD|OS|iOS|Android|Windows|Linux|macOS|Unix|AWS|Azure|GCP|Docker|Kubernetes|Git|GitHub|GitLab|npm|yarn|pip|conda|Maven|Gradle|Webpack|Rollup|Vite|React|Vue|Angular|Next|Nuxt|Express|Django|Flask|Rails|Laravel|Spring|Hibernate|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Kafka|RabbitMQ|Jenkins|CircleCI|GitHub Actions|Travis|Azure DevOps|Terraform|Ansible|Puppet|Chef|Vagrant|VMware|VirtualBox|Hyper-V|KVM|Xen|Node\.js|Python|Java|JavaScript|TypeScript|C\+\+|C#|Go|Rust|Swift|Kotlin|Scala|Ruby|PHP|Perl|R|MATLAB|Stata|SAS|SPSS|Tableau|PowerBI|Excel|Word|PowerPoint|Outlook|Teams|Slack|Discord|Zoom|WebEx|Skype|WhatsApp|Telegram|Signal|Firefox|Chrome|Safari|Edge|Opera|Brave|Tor|VPN|Proxy|Firewall|Antivirus|Malware|Ransomware|Phishing|Spear-phishing|Social engineering|Two-factor authentication|Multi-factor authentication|Single sign-on|Identity and access management|Role-based access control|Attribute-based access control|Discretionary access control|Mandatory access control|Bell-LaPadula|Biba|Clark-Wilson|Chinese Wall|Take-Grant|HRU|RBAC|ABAC|DAC|MAC|BLP|Biba|CW|TG|HRU)\b/gi;

/**
 * Precompiled patterns for definite natural language detection.
 * Used in analyzeCodeVsNaturalLanguage to immediately disqualify common English words.
 * @type {RegExp[]}
 */
const DEFINITELY_NOT_CODE = [
  /^(a|an|the|and|or|but|if|then|else|when|where|why|how|who|what|which|that|this|these|those|here|there|now|today|yesterday|tomorrow)$/i,
  /^(i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their)$/i,
  /^(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall)$/i,
  /^(good|bad|big|small|new|old|first|last|next|previous|best|worst|better|worse|more|less|most|least)$/i,
  /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand)$/i
];

/**
 * Precompiled strong code indicator patterns.
 * Built from CODE_FILE_EXTENSIONS and COMMAND_KEYWORDS sets at module load time.
 * @type {RegExp[]}
 */
const STRONG_CODE_INDICATORS = [
  new RegExp(`\\.(${Array.from(CODE_FILE_EXTENSIONS).join('|')})$`, 'i'),
  /^[A-Z_][A-Z0-9_]*$/, // ENVIRONMENT_VARIABLES
  new RegExp(`^(${Array.from(COMMAND_KEYWORDS).join('|')})\\s`),
  /\(.*\)$/, // Function calls
  /^import\s+/,
  /^from\s+.*import/,
  /^\$[A-Z_]+$/, // Shell variables
  /^--[a-z-]+$/, // Command flags
  /\/.*\//, // Paths with slashes
  /^\.[a-zA-Z]/ // Dotfiles
];

/**
 * Precompiled moderate code indicator patterns.
 * @type {RegExp[]}
 */
const MODERATE_CODE_INDICATORS = [
  /[A-Z]{2,}/, // Contains acronyms
  /_/, // Contains underscores
  /\d/, // Contains numbers
  /^[a-z]+[A-Z]/, // camelCase
  /^[A-Z][a-z]+[A-Z]/, // PascalCase
  /^[a-z-]{4,}$/ // kebab-case (only if longer than 3 chars)
];

/**
 * Common directory prefixes that indicate a code path.
 * @type {Set<string>}
 */
const CODE_DIRECTORY_PREFIXES = new Set([
  'src', 'lib', 'bin', 'dist', 'build', 'out', 'output', 'target',
  'tests', 'test', 'spec', 'specs', '__tests__', '__mocks__',
  'docs', 'doc', 'documentation',
  'config', 'configs', 'conf', 'settings',
  'scripts', 'tools', 'utils', 'helpers', 'common',
  'components', 'modules', 'packages', 'plugins',
  'assets', 'static', 'public', 'resources', 'images', 'icons',
  'styles', 'css', 'scss', 'less',
  'node_modules', 'vendor', 'third_party', 'external',
  'api', 'routes', 'controllers', 'models', 'views', 'services',
  'app', 'apps', 'pages', 'layouts', 'templates',
  '.github', '.gitlab', '.circleci', '.vscode'
]);

/**
 * Extract file extension from a filename or path
 * @param {string} filename - The filename or path
 * @returns {string} The file extension (without the dot)
 */
function getFileExtension(filename) {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Get confidence boost for file path patterns.
 * @param {string} text - Text to analyze
 * @returns {number} Confidence boost (0-0.4)
 */
function getFilePathConfidence(text) {
  if (!text.includes('/')) {
    return 0;
  }

  // File path with extension (e.g., src/index.js)
  if (/\.[a-zA-Z0-9]+$/.test(text)) {
    return 0.4; // Strong indicator: file path with extension
  }

  const segments = text.split('/');
  const firstSegment = segments[0].toLowerCase();

  // Paths starting with common code directory prefixes
  if (CODE_DIRECTORY_PREFIXES.has(firstSegment)) {
    return 0.3; // Strong indicator: starts with code directory
  }

  // Multi-segment paths without extension
  if (segments.length > 2) {
    return 0.3; // Multi-segment paths are likely code references
  }

  // Simple two-segment paths (less certain)
  return 0.15;
}

/**
 * Get confidence boost for command-like patterns.
 * @param {string} text - Text to analyze
 * @returns {number} Confidence boost (0-0.4)
 */
function getCommandConfidence(text) {
  let confidence = 0;

  // Standalone filenames with common extensions
  if (/^[a-zA-Z0-9._-]+\.(json|js|ts|py|md|txt|yml|yaml|xml|html|css|scss|sh|sql|env|cfg|conf|ini|toml|lock|log)$/i.test(text)) {
    confidence += 0.3; // Standalone filenames are strong code indicators
  }

  // Import statements
  if (/^import\s+\w+/.test(text)) {
    confidence += 0.2; // Import statements are definitively code
  }

  // Command-line tools
  if (COMMAND_KEYWORDS.has(text.split(/\s+/)[0]?.toLowerCase())) {
    confidence += 0.3; // Command tools are strong code indicators
  }

  // Environment variables
  if (/^[A-Z_][A-Z0-9_]*$/.test(text) && text.length > 2) {
    confidence += 0.2; // Environment variable pattern
  }

  // File extensions
  if (CODE_FILE_EXTENSIONS.has(getFileExtension(text))) {
    confidence += 0.2; // File extension references
  }

  // snake_case identifiers (variable_name, function_name, max_retries)
  // These are very strong indicators of code identifiers
  if (/^_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(text)) {
    confidence += 0.25; // snake_case is almost always code
  }

  // camelCase identifiers (useEffect, fetchData, myVariable)
  // Strong code indicator
  if (/^[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/.test(text)) {
    confidence += 0.25; // camelCase is almost always code
  }

  // PascalCase identifiers (MyComponent, HttpClient)
  // Note: May have false positives with brand names, so slightly lower boost
  if (/^[A-Z](?=[a-zA-Z0-9]*[A-Z])[a-zA-Z0-9]*[a-z][a-zA-Z0-9]*$/.test(text)) {
    confidence += 0.2; // PascalCase is likely code, but watch for brand names
  }

  return Math.min(confidence, 0.4); // Cap at 0.4 to avoid over-boosting
}

/**
 * Get confidence penalty for natural language patterns.
 * @param {string} text - Text to analyze
 * @returns {number} Confidence penalty (0-0.9)
 */
function getNaturalLanguagePenalty(text) {
  if (COMMON_WORDS.includes(text.toLowerCase())) {
    return 0.7; // Heavy penalty: common English words rarely need backticks
  } else if (NATURAL_LANGUAGE_PHRASES.includes(text.toLowerCase())) {
    return 0.9; // Severe penalty: natural language phrases shouldn't be code
  } else if (PROBLEMATIC_PATTERNS.some(pattern => pattern.test(text))) {
    return 0.5; // Moderate penalty: ambiguous patterns
  }

  let penalty = 0;

  // Very short terms
  if (text.length <= 2) {
    penalty += 0.3; // Short terms are usually natural language
  }

  // Short letter-only words
  if (/^[a-zA-Z]+$/.test(text) && text.length < 5) {
    penalty += 0.2; // Short letter-only words are ambiguous
  }

  return penalty;
}

/**
 * Get context-aware confidence adjustments.
 * @param {string} text - Text to analyze
 * @param {Object} context - Context with line information
 * @returns {number} Confidence adjustment (-0.5 to +0.2)
 */
function getContextAdjustment(text, context) {
  if (!context || !context.line) {
    return 0;
  }

  const line = context.line.toLowerCase();
  let adjustment = 0;

  if (NATURAL_LANGUAGE_INDICATORS.some(indicator => line.includes(indicator))) {
    adjustment -= 0.3; // Natural language context reduces code likelihood
  }

  // Repeated terms in prose
  const termCount = (line.match(new RegExp(`\\b${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length;
  if (termCount > 1) {
    adjustment -= 0.2; // Repeated terms suggest natural language usage
  }

  if (TECHNICAL_INDICATORS.some(indicator => line.includes(indicator))) {
    adjustment += 0.2; // Technical context increases code likelihood
  }

  return adjustment;
}

/**
 * Calculate confidence score for a sentence case autofix.
 * @param {string} original - Original text
 * @param {string} fixed - Fixed text
 * @param {Object} context - Additional context
 * @returns {{ confidence: number, heuristics: Object }} Confidence score and heuristic breakdown
 */
export function calculateSentenceCaseConfidence(original, fixed, context = {}) { // eslint-disable-line no-unused-vars
  const heuristics = {
    baseConfidence: 0.5,
    firstWordCapitalization: 0,
    caseChangesOnly: 0,
    structuralChanges: 0,
    manyWordsChanged: 0,
    technicalTerms: 0
  };

  if (!original || !fixed || original === fixed) {
    return { confidence: 0, heuristics };
  }

  let confidence = 0.5; // Base confidence: neutral starting point

  // +0.3: High confidence boost for simple first-word capitalization
  // This is the most common and safest sentence case change
  const words = original.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    const expectedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

    if (fixed.startsWith(expectedFirstWord)) {
      heuristics.firstWordCapitalization = 0.3;
      confidence += 0.3; // Strong indicator of correct sentence case fix
    }
  }

  // +0.2: Moderate confidence boost if only case changes (no word additions/removals)
  // Purely case-based changes are safer than structural changes
  if (original.toLowerCase() === fixed.toLowerCase()) {
    heuristics.caseChangesOnly = 0.2;
    confidence += 0.2; // Safe transformation - only case changes
  }

  // -0.2: Moderate confidence penalty for structural changes
  // Word count changes indicate more complex transformations that could be wrong
  const originalWords = original.split(/\s+/);
  const fixedWords = fixed.split(/\s+/);

  if (originalWords.length !== fixedWords.length) {
    heuristics.structuralChanges = -0.2;
    confidence -= 0.2; // Structural changes are riskier
  }

  // -0.3: Strong confidence penalty if many words are changed
  // If >50% of words change, the transformation is likely too aggressive
  let changedWords = 0;
  for (let i = 0; i < Math.min(originalWords.length, fixedWords.length); i++) {
    if (originalWords[i].toLowerCase() !== fixedWords[i].toLowerCase()) {
      changedWords++;
    }
  }

  if (changedWords > originalWords.length * 0.5) {
    heuristics.manyWordsChanged = -0.3;
    confidence -= 0.3; // Heavy penalty for extensive changes (likely over-correction)
  }

  // +0.1 per technical term (max +0.3): Slight confidence boost for technical content
  // Technical content often has specific capitalization rules that should be preserved
  // Reset lastIndex since TECHNICAL_TERM_PATTERN is a global regex reused across calls
  TECHNICAL_TERM_PATTERN.lastIndex = 0;
  const technicalMatches = (original.match(TECHNICAL_TERM_PATTERN) || []).length;
  if (technicalMatches > 0) {
    const boost = 0.1 * Math.min(technicalMatches, 3);
    heuristics.technicalTerms = boost;
    confidence += boost; // Small boost per technical term, capped at 3
  }

  const finalConfidence = Math.max(0, Math.min(1, confidence));
  return { confidence: finalConfidence, heuristics };
}

/**
 * Calculate confidence score for a backtick autofix.
 * @param {string} original - Original text to be wrapped
 * @param {Object} context - Additional context
 * @returns {{ confidence: number, heuristics: Object }} Confidence score and heuristic breakdown
 */
export function calculateBacktickConfidence(original, context = {}) {
  const heuristics = {
    baseConfidence: 0.5,
    filePathPattern: 0,
    commandPattern: 0,
    naturalLanguagePenalty: 0,
    contextAdjustment: 0
  };

  if (!original) {
    return { confidence: 0, heuristics };
  }

  let confidence = 0.5; // Base confidence: neutral starting point

  const filePathBoost = getFilePathConfidence(original);
  heuristics.filePathPattern = filePathBoost;
  confidence += filePathBoost;

  const commandBoost = getCommandConfidence(original);
  heuristics.commandPattern = commandBoost;
  confidence += commandBoost;

  const naturalPenalty = getNaturalLanguagePenalty(original);
  heuristics.naturalLanguagePenalty = -naturalPenalty;
  confidence -= naturalPenalty;

  const contextAdj = getContextAdjustment(original, context);
  heuristics.contextAdjustment = contextAdj;
  confidence += contextAdj;

  const finalConfidence = Math.max(0, Math.min(1, confidence));
  return { confidence: finalConfidence, heuristics };
}

/**
 * Advanced pattern matching to detect if a term is likely code vs natural language.
 * @param {string} text - Text to analyze
 * @param {Object} context - Additional context including surrounding text
 * @returns {Object} Analysis result with confidence and reasoning
 */
export function analyzeCodeVsNaturalLanguage(text, context = {}) {
  const analysis = {
    isLikelyCode: false,
    confidence: 0.5,
    reasons: [],
    shouldAutofix: false
  };

  // Immediate disqualifiers for common natural language (precompiled at module level)
  if (DEFINITELY_NOT_CODE.some(pattern => pattern.test(text))) {
    analysis.confidence = 0.1;
    analysis.reasons.push('Matches common English word pattern');
    return analysis;
  }

  // Strong code indicators (precompiled at module level)
  const strongMatches = STRONG_CODE_INDICATORS.filter(pattern => pattern.test(text));
  if (strongMatches.length > 0) {
    analysis.confidence += 0.4;
    analysis.reasons.push(`Strong code pattern: ${strongMatches.length} matches`);
  }

  // Moderate code indicators (precompiled at module level)
  const moderateMatches = MODERATE_CODE_INDICATORS.filter(pattern => pattern.test(text));
  if (moderateMatches.length > 0) {
    analysis.confidence += 0.1 * moderateMatches.length;
    analysis.reasons.push(`Moderate code patterns: ${moderateMatches.length} matches`);
  }

  // Context-based analysis
  if (context.line) {
    const line = context.line.toLowerCase();

    if (/(command|execute|run|install|configure|setup|deploy|build|compile)/.test(line)) {
      analysis.confidence += 0.2;
      analysis.reasons.push('Technical context detected');
    }

    if (/(example|like|such as|for instance|namely)/.test(line)) {
      analysis.confidence -= 0.3;
      analysis.reasons.push('Example/illustration context detected');
    }
  }

  analysis.isLikelyCode = analysis.confidence > 0.5;
  analysis.shouldAutofix = analysis.confidence > 0.6;

  return analysis;
}
