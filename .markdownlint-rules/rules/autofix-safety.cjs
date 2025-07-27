"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.analyzeCodeVsNaturalLanguage = analyzeCodeVsNaturalLanguage;
exports.calculateBacktickConfidence = calculateBacktickConfidence;
exports.calculateSentenceCaseConfidence = calculateSentenceCaseConfidence;
exports.createSafeFixInfo = createSafeFixInfo;
exports.shouldApplyAutofix = shouldApplyAutofix;
// @ts-check

/**
 * Autofix safety utilities to prevent incorrect automatic fixes.
 * These utilities help reduce false positive corrections and make autofix more reliable.
 */

/**
 * Configuration for autofix safety checks.
 * @typedef {Object} AutofixSafetyConfig
 * @property {boolean} enabled - Whether safety checks are enabled
 * @property {number} confidenceThreshold - Minimum confidence score (0-1) to apply autofix
 * @property {string[]} safeWords - Words that are always safe to fix
 * @property {string[]} unsafeWords - Words that should never be auto-fixed
 * @property {boolean} requireManualReview - Whether certain fixes require manual review
 */

/**
 * Default safety configuration.
 * @type {AutofixSafetyConfig}
 */
const DEFAULT_SAFETY_CONFIG = {
  enabled: true,
  confidenceThreshold: 0.5,
  safeWords: ['npm', 'api', 'url', 'html', 'css', 'json', 'xml', 'http', 'https'],
  unsafeWords: ['i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
  requireManualReview: false
};

/**
 * Calculate confidence score for a sentence case autofix.
 * @param {string} original - Original text
 * @param {string} fixed - Fixed text  
 * @param {Object} context - Additional context
 * @returns {number} Confidence score between 0 and 1
 */
function calculateSentenceCaseConfidence(original, fixed, context = {}) {
  // eslint-disable-line no-unused-vars
  if (!original || !fixed || original === fixed) {
    return 0;
  }
  let confidence = 0.5; // Base confidence

  // Higher confidence for simple first-word capitalization
  const words = original.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    const expectedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    if (fixed.startsWith(expectedFirstWord)) {
      confidence += 0.3;
    }
  }

  // Higher confidence if only case changes (no word additions/removals)
  if (original.toLowerCase() === fixed.toLowerCase()) {
    confidence += 0.2;
  }

  // Lower confidence for complex changes
  const originalWords = original.split(/\s+/);
  const fixedWords = fixed.split(/\s+/);
  if (originalWords.length !== fixedWords.length) {
    confidence -= 0.2;
  }

  // Lower confidence if many words are changed
  let changedWords = 0;
  for (let i = 0; i < Math.min(originalWords.length, fixedWords.length); i++) {
    if (originalWords[i].toLowerCase() !== fixedWords[i].toLowerCase()) {
      changedWords++;
    }
  }
  if (changedWords > originalWords.length * 0.5) {
    confidence -= 0.3;
  }

  // Check for technical terms and proper nouns
  const technicalTermPattern = /\b(API|URL|HTML|CSS|JSON|XML|HTTP|HTTPS|SDK|CLI|GUI|UI|UX|SQL|NoSQL|REST|GraphQL|JWT|OAuth|CSRF|XSS|CORS|DNS|CDN|VPN|SSL|TLS|SSH|FTP|SMTP|POP|IMAP|TCP|UDP|IP|IPv4|IPv6|MAC|VLAN|LAN|WAN|WiFi|Bluetooth|USB|HDMI|GPU|CPU|RAM|SSD|HDD|OS|iOS|Android|Windows|Linux|macOS|Unix|AWS|Azure|GCP|Docker|Kubernetes|Git|GitHub|GitLab|npm|yarn|pip|conda|Maven|Gradle|Webpack|Rollup|Vite|React|Vue|Angular|Next|Nuxt|Express|Django|Flask|Rails|Laravel|Spring|Hibernate|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|Kafka|RabbitMQ|Jenkins|CircleCI|GitHub Actions|Travis|Azure DevOps|Terraform|Ansible|Puppet|Chef|Vagrant|VMware|VirtualBox|Hyper-V|KVM|Xen|Node\.js|Python|Java|JavaScript|TypeScript|C\+\+|C#|Go|Rust|Swift|Kotlin|Scala|Ruby|PHP|Perl|R|MATLAB|Stata|SAS|SPSS|Tableau|PowerBI|Excel|Word|PowerPoint|Outlook|Teams|Slack|Discord|Zoom|WebEx|Skype|WhatsApp|Telegram|Signal|Firefox|Chrome|Safari|Edge|Opera|Brave|Tor|VPN|Proxy|Firewall|Antivirus|Malware|Ransomware|Phishing|Spear-phishing|Social engineering|Two-factor authentication|Multi-factor authentication|Single sign-on|Identity and access management|Role-based access control|Attribute-based access control|Discretionary access control|Mandatory access control|Bell-LaPadula|Biba|Clark-Wilson|Chinese Wall|Take-Grant|HRU|RBAC|ABAC|DAC|MAC|BLP|Biba|CW|TG|HRU)\b/gi;
  const technicalMatches = (original.match(technicalTermPattern) || []).length;
  if (technicalMatches > 0) {
    confidence += 0.1 * Math.min(technicalMatches, 3);
  }
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate confidence score for a backtick autofix.
 * @param {string} original - Original text to be wrapped
 * @param {Object} context - Additional context
 * @returns {number} Confidence score between 0 and 1
 */
function calculateBacktickConfidence(original, context = {}) {
  if (!original) {
    return 0;
  }
  let confidence = 0.5; // Base confidence

  // Higher confidence for clear file paths
  if (original.includes('/') && /\.[a-zA-Z0-9]+$/.test(original)) {
    confidence += 0.4; // Files with extensions
  } else if (original.includes('/') && original.split('/').length > 2) {
    confidence += 0.3; // Multi-segment paths
  } else if (original.includes('/')) {
    confidence += 0.1; // Simple paths like src/utils
  }

  // Higher confidence for common file names
  if (/^[a-zA-Z0-9._-]+\.(json|js|ts|py|md|txt|yml|yaml|xml|html|css|scss|sh|sql|env|cfg|conf|ini|toml|lock|log)$/i.test(original)) {
    confidence += 0.3;
  }

  // Higher confidence for import statements
  if (/^import\s+\w+/.test(original)) {
    confidence += 0.2;
  }

  // Higher confidence for clear commands
  if (/^(npm|yarn|git|docker|kubectl|curl|wget|ssh|scp|rsync|grep|sed|awk|find|ls|cd|mkdir|rm|cp|mv|chmod|chown|sudo|su|ps|top|htop|kill|killall|systemctl|service|crontab|tar|gzip|zip|unzip|cat|head|tail|less|more|vim|nano|emacs|code|open|explorer|ping|traceroute|nslookup|dig|netstat|ss|iptables|ufw|tcpdump|wireshark|nmap|john|hashcat|hydra|metasploit|burp|owasp|nikto|sqlmap|aircrack|reaver|hashcat|john|hydra|metasploit|burp|owasp|nikto|sqlmap|aircrack|reaver)\s/.test(original)) {
    confidence += 0.3;
  }

  // Higher confidence for environment variables
  if (/^[A-Z_][A-Z0-9_]*$/.test(original) && original.length > 2) {
    confidence += 0.2;
  }

  // Higher confidence for code-like patterns
  if (/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|rb|php|pl|sh|bash|zsh|fish|ps1|bat|cmd|sql|html|css|scss|sass|less|xml|json|yaml|yml|toml|ini|cfg|conf|config|env|gitignore|dockerignore|editorconfig|prettierrc|eslintrc|babelrc|tsconfigjson|packagejson|composerjson|gemfile|requirements\.txt|pipfile|cargo\.toml|go\.mod|pom\.xml|build\.gradle|webpack\.config\.js|rollup\.config\.js|vite\.config\.js|next\.config\.js|nuxt\.config\.js|vue\.config\.js|angular\.json|tsconfig\.json|jest\.config\.js|cypress\.json|playwright\.config\.js|storybook|readme\.md|changelog\.md|license|contributing\.md|code_of_conduct\.md|security\.md|pull_request_template\.md|issue_template\.md|funding\.yml|dependabot\.yml|codeql\.yml|ci\.yml|cd\.yml|deploy\.yml|release\.yml|test\.yml|build\.yml|lint\.yml|format\.yml|security\.yml|audit\.yml|update\.yml|backup\.yml|restore\.yml|migrate\.yml|seed\.yml|rollback\.yml|status\.yml|health\.yml|monitor\.yml|alert\.yml|log\.yml|trace\.yml|debug\.yml|profile\.yml|benchmark\.yml|load\.yml|stress\.yml|smoke\.yml|integration\.yml|unit\.yml|e2e\.yml|acceptance\.yml|contract\.yml|mutation\.yml|property\.yml|snapshot\.yml|visual\.yml|accessibility\.yml|performance\.yml|security\.yml|compliance\.yml|governance\.yml|risk\.yml|audit\.yml|review\.yml|approval\.yml|merge\.yml|conflict\.yml|rebase\.yml|cherry-pick\.yml|tag\.yml|branch\.yml|commit\.yml|push\.yml|pull\.yml|fetch\.yml|clone\.yml|fork\.yml|star\.yml|watch\.yml|follow\.yml|sponsor\.yml|donate\.yml|support\.yml|contact\.yml|feedback\.yml|report\.yml|request\.yml|suggestion\.yml|idea\.yml|proposal\.yml|rfc\.yml|adr\.yml|decision\.yml|meeting\.yml|agenda\.yml|minutes\.yml|action\.yml|task\.yml|todo\.yml|done\.yml|progress\.yml|status\.yml|update\.yml|news\.yml|announcement\.yml|release\.yml|changelog\.yml|version\.yml|migration\.yml|upgrade\.yml|downgrade\.yml|patch\.yml|hotfix\.yml|bugfix\.yml|feature\.yml|enhancement\.yml|improvement\.yml|optimization\.yml|refactor\.yml|cleanup\.yml|maintenance\.yml|deprecation\.yml|removal\.yml|addition\.yml|modification\.yml|update\.yml|change\.yml|fix\.yml|repair\.yml|restore\.yml|recover\.yml|backup\.yml|archive\.yml|export\.yml|import\.yml|sync\.yml|transfer\.yml|copy\.yml|move\.yml|delete\.yml|remove\.yml|purge\.yml|clean\.yml|clear\.yml|reset\.yml|restart\.yml|reload\.yml|refresh\.yml|renew\.yml|regenerate\.yml|rebuild\.yml|recreate\.yml|redeploy\.yml|republish\.yml|reprocess\.yml|rerun\.yml|retry\.yml|resume\.yml|pause\.yml|stop\.yml|start\.yml|enable\.yml|disable\.yml|activate\.yml|deactivate\.yml|install\.yml|uninstall\.yml|setup\.yml|configure\.yml|initialize\.yml|finalize\.yml|complete\.yml|finish\.yml|end\.yml|close\.yml|open\.yml|launch\.yml|execute\.yml|run\.yml|invoke\.yml|call\.yml|trigger\.yml|schedule\.yml|queue\.yml|process\.yml|handle\.yml|manage\.yml|control\.yml|monitor\.yml|observe\.yml|track\.yml|measure\.yml|analyze\.yml|evaluate\.yml|assess\.yml|validate\.yml|verify\.yml|confirm\.yml|approve\.yml|reject\.yml|accept\.yml|decline\.yml|allow\.yml|deny\.yml|grant\.yml|revoke\.yml|assign\.yml|unassign\.yml|allocate\.yml|deallocate\.yml|reserve\.yml|release\.yml|lock\.yml|unlock\.yml|secure\.yml|unsecure\.yml|protect\.yml|unprotect\.yml|encrypt\.yml|decrypt\.yml|sign\.yml|verify\.yml|authenticate\.yml|authorize\.yml|login\.yml|logout\.yml|signin\.yml|signout\.yml|register\.yml|unregister\.yml|subscribe\.yml|unsubscribe\.yml|join\.yml|leave\.yml|enter\.yml|exit\.yml|connect\.yml|disconnect\.yml|link\.yml|unlink\.yml|bind\.yml|unbind\.yml|attach\.yml|detach\.yml|mount\.yml|unmount\.yml|load\.yml|unload\.yml|save\.yml|persist\.yml|store\.yml|retrieve\.yml|fetch\.yml|get\.yml|set\.yml|put\.yml|post\.yml|patch\.yml|delete\.yml|head\.yml|options\.yml|trace\.yml|connect\.yml)$/.test(original)) {
    confidence += 0.2;
  }

  // Lower confidence for common English words and natural language phrases
  const commonWords = ['i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'some', 'many', 'much', 'few', 'little', 'most', 'more', 'less', 'one', 'two', 'three', 'first', 'last', 'next', 'previous', 'before', 'after'];
  const naturalLanguagePhrases = ['read/write', 'pass/fail', 'on/off', 'in/out', 'up/down', 'left/right', 'true/false', 'yes/no', 'black/white', 'day/night', 'hot/cold', 'big/small', 'fast/slow', 'high/low', 'old/new', 'start/stop', 'begin/end', 'open/close', 'save/load', 'push/pull', 'give/take', 'buy/sell', 'win/lose', 'love/hate', 'good/bad', 'right/wrong', 'rich/poor', 'male/female', 'young/old', 'early/late', 'easy/hard', 'safe/dangerous'];

  // Additional patterns that commonly cause false positives
  const problematicPatterns = [/^[a-z]{1,3}$/,
  // Very short lowercase words (e.g., 'is', 'or', 'in')
  /^(go|do|be|if|it|my|we|he|she|you|us|me|him|her|our|his|its|who|what|why|how|when|where)$/i,
  // Common English words
  /^(one|two|three|four|five|six|seven|eight|nine|ten)$/i,
  // Number words
  /^(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey)$/i,
  // Color words
  /^(big|small|large|tiny|huge|mini|max|min)$/i,
  // Size words
  /^(new|old|fresh|stale|young|ancient|modern|classic)$/i,
  // Age/time words
  /^(good|bad|nice|cool|hot|cold|warm|best|worst|better|worse)$/i,
  // Quality words
  /^(quick|slow|fast|rapid|swift|delayed|instant)$/i,
  // Speed words
  /^(easy|hard|simple|complex|basic|advanced|tough|difficult)$/i // Complexity words
  ];
  if (commonWords.includes(original.toLowerCase())) {
    confidence -= 0.7; // Strong penalty for common words
  } else if (naturalLanguagePhrases.includes(original.toLowerCase())) {
    confidence -= 0.9; // Very strong penalty for natural language phrases
  } else if (problematicPatterns.some(pattern => pattern.test(original))) {
    confidence -= 0.5; // Moderate penalty for problematic patterns
  }

  // Lower confidence for very short terms that could be ambiguous
  if (original.length <= 2) {
    confidence -= 0.3;
  }

  // Lower confidence for terms that contain only letters (no technical indicators)
  if (/^[a-zA-Z]+$/.test(original) && original.length < 5) {
    confidence -= 0.2;
  }

  // Context-aware safety checks
  if (context && context.line) {
    const line = context.line.toLowerCase();

    // Lower confidence if the text appears in obviously natural language contexts
    const naturalLanguageIndicators = ['is a', 'are a', 'was a', 'were a', 'this is', 'that is', 'it is', 'he is', 'she is', 'would be', 'could be', 'should be', 'might be', 'must be', 'i think', 'i believe', 'in my opinion', 'personally', 'generally', 'for example', 'such as', 'like this', 'as follows', 'namely', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'note that', 'remember that', 'keep in mind', 'be aware', 'make sure'];
    if (naturalLanguageIndicators.some(indicator => line.includes(indicator))) {
      confidence -= 0.3;
    }

    // Lower confidence if the term appears multiple times in normal prose
    const termCount = (line.match(new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length;
    if (termCount > 1) {
      confidence -= 0.2;
    }

    // Higher confidence if the text appears in technical contexts
    const technicalIndicators = ['install', 'configure', 'setup', 'deploy', 'build', 'compile', 'run', 'execute', 'command', 'script', 'function', 'method', 'class', 'variable', 'parameter', 'api', 'endpoint', 'request', 'response', 'server', 'client', 'database', 'repository', 'branch', 'commit', 'merge', 'push', 'pull', 'clone', 'fork'];
    if (technicalIndicators.some(indicator => line.includes(indicator))) {
      confidence += 0.2;
    }
  }
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Advanced pattern matching to detect if a term is likely code vs natural language.
 * @param {string} text - Text to analyze
 * @param {Object} context - Additional context including surrounding text
 * @returns {Object} Analysis result with confidence and reasoning
 */
function analyzeCodeVsNaturalLanguage(text, context = {}) {
  const analysis = {
    isLikelyCode: false,
    confidence: 0.5,
    reasons: [],
    shouldAutofix: false
  };

  // Immediate disqualifiers for common natural language
  const definitelyNotCode = [/^(a|an|the|and|or|but|if|then|else|when|where|why|how|who|what|which|that|this|these|those|here|there|now|today|yesterday|tomorrow)$/i, /^(i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their)$/i, /^(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall)$/i, /^(good|bad|big|small|new|old|first|last|next|previous|best|worst|better|worse|more|less|most|least)$/i, /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand)$/i];
  if (definitelyNotCode.some(pattern => pattern.test(text))) {
    analysis.confidence = 0.1;
    analysis.reasons.push('Matches common English word pattern');
    return analysis;
  }

  // Strong code indicators
  const strongCodeIndicators = [/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|rb|php|pl|sh|bash|zsh|fish|ps1|bat|cmd|sql|html|css|scss|sass|less|xml|json|yaml|yml|toml|ini|cfg|conf|config|env)$/i, /^[A-Z_][A-Z0-9_]*$/,
  // ENVIRONMENT_VARIABLES
  /^(npm|yarn|pip|git|docker|kubectl|curl|wget|ssh|scp|rsync|grep|sed|awk|find|ls|cd|mkdir|rm|cp|mv|chmod|chown|sudo)\s/, /\(.*\)$/,
  // Function calls
  /^import\s+/, /^from\s+.*import/, /^\$[A-Z_]+$/,
  // Shell variables
  /^--[a-z-]+$/,
  // Command flags
  /\/.*\//,
  // Paths with slashes
  /^\.[a-zA-Z]/ // Dotfiles
  ];
  const strongMatches = strongCodeIndicators.filter(pattern => pattern.test(text));
  if (strongMatches.length > 0) {
    analysis.confidence += 0.4;
    analysis.reasons.push(`Strong code pattern: ${strongMatches.length} matches`);
  }

  // Moderate code indicators
  const moderateCodeIndicators = [/[A-Z]{2,}/,
  // Contains acronyms
  /_/,
  // Contains underscores
  /\d/,
  // Contains numbers
  /^[a-z]+[A-Z]/,
  // camelCase
  /^[A-Z][a-z]+[A-Z]/,
  // PascalCase
  /^[a-z-]{4,}$/ // kebab-case (only if longer than 3 chars)
  ];
  const moderateMatches = moderateCodeIndicators.filter(pattern => pattern.test(text));
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

/**
 * Check if an autofix should be applied based on safety rules.
 * @param {string} ruleType - Type of rule (e.g., 'sentence-case', 'backtick')
 * @param {string} original - Original text
 * @param {string} fixed - Fixed text (for sentence-case)
 * @param {Object} context - Additional context
 * @param {AutofixSafetyConfig} config - Safety configuration
 * @returns {Object} Safety check result
 */
function shouldApplyAutofix(ruleType, original, fixed = '', context = {}, config = DEFAULT_SAFETY_CONFIG) {
  if (!config.enabled) {
    return {
      safe: true,
      confidence: 1.0,
      reason: 'Safety checks disabled'
    };
  }
  let confidence = 0;
  let reason = '';
  switch (ruleType) {
    case 'sentence-case':
      confidence = calculateSentenceCaseConfidence(original, fixed, context);
      reason = `Sentence case confidence: ${confidence.toFixed(2)}`;
      break;
    case 'backtick':
      confidence = calculateBacktickConfidence(original, context);
      reason = `Backtick confidence: ${confidence.toFixed(2)}`;
      break;
    default:
      confidence = 0.5;
      reason = 'Unknown rule type';
  }
  const safe = confidence >= config.confidenceThreshold;
  return {
    safe,
    confidence,
    reason,
    requiresReview: config.requireManualReview && !safe
  };
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
function createSafeFixInfo(originalFixInfo, ruleType, original, fixed, context = {}, config = DEFAULT_SAFETY_CONFIG) {
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
      return null;
    }
  }
  if (!safetyCheck.safe) {
    // Return null to disable autofix for unsafe changes
    return null;
  }

  // Add safety metadata to the fix info
  return {
    ...originalFixInfo,
    _safety: {
      confidence: safetyCheck.confidence,
      reason: safetyCheck.reason,
      ruleType,
      advancedAnalysis
    }
  };
}