// @ts-check

/**
 * A centralized collection of terms with special casing rules or that should be ignored by certain linting rules.
 * This helps maintain consistency across different custom rules.
 */

/**
 * A unified dictionary of all terms with specific casing requirements.
 * Includes proper nouns, technical terms, acronyms, and brand names.
 * The key is the lowercase version of the term for easy lookup, and the value is the correct casing.
 * Used by all rules that need to enforce or recognize special casing.
 * @type {Record<string, string>}
 */
export const casingTerms = {
  // Technical Terms & Acronyms
  ai: 'AI',
  api: 'API',
  apis: 'APIs',
  ar: 'AR',
  aws: 'AWS',
  cdc: 'CDC',
  cdn: 'CDN',
  cli: 'CLI',
  cpo: 'CPO',
  css: 'CSS',
  dns: 'DNS',
  es6: 'ES6',
  fbi: 'FBI',
  gcp: 'GCP',
  graphql: 'GraphQL',
  http: 'HTTP',
  https: 'HTTPS',
  ibm: 'IBM',
  iot: 'IoT',
  jwt: 'JWT',
  json: 'JSON',
  lcnc: 'LCNC',
  llm: 'LLM',
  mfa: 'MFA',
  ml: 'ML',
  mr: 'MR',
  nasa: 'NASA',
  nlp: 'NLP',
  oauth2: 'OAuth2',
  rest: 'REST',
  rl: 'RL',
  sdk: 'SDK',
  spa: 'SPA',
  sso: 'SSO',
  sql: 'SQL',
  ssl: 'SSL',
  tco: 'TCO',
  tls: 'TLS',
  ui: 'UI',
  unesco: 'UNESCO',
  unicef: 'UNICEF',
  url: 'URL',
  urls: 'URLs',
  ux: 'UX',
  vpn: 'VPN',
  vr: 'VR',
  xml: 'XML',

  // Timezone codes (always uppercase)
  utc: 'UTC',
  gmt: 'GMT',
  est: 'EST',
  edt: 'EDT',
  cst: 'CST',
  cdt: 'CDT',
  mst: 'MST',
  mdt: 'MDT',
  pst: 'PST',
  pdt: 'PDT',
  aest: 'AEST',
  aedt: 'AEDT',
  cet: 'CET',
  cest: 'CEST',
  jst: 'JST',
  ist: 'IST',

  // Programming Languages & Frameworks
  angular: 'Angular',
  astro: 'Astro',
  'c#': 'C#',
  'c++': 'C++',
  deno: 'Deno',
  eslint: 'ESLint',
  fastapi: 'FastAPI',
  javascript: 'JavaScript',
  jest: 'Jest',
  jsdoc: 'JSDoc',
  kotlin: 'Kotlin',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  'node.js': 'Node.js',
  nuxt: 'Nuxt',
  php: 'PHP',
  pytest: 'pytest',
  'react.js': 'React.js',
  react: 'React',
  remix: 'Remix',
  solidjs: 'SolidJS',
  'solid.js': 'SolidJS',
  svelte: 'Svelte',
  sveltekit: 'SvelteKit',
  typescript: 'TypeScript',
  vite: 'Vite',
  vue: 'Vue',
  vitest: 'Vitest',
  webpack: 'Webpack',

  // Databases
  cassandra: 'Cassandra',
  clickhouse: 'ClickHouse',
  couchdb: 'CouchDB',
  dynamodb: 'DynamoDB',
  elasticsearch: 'Elasticsearch',
  firestore: 'Firestore',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  neo4j: 'Neo4j',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  sqlite: 'SQLite',
  'sql server': 'SQL Server',
  supabase: 'Supabase',

  // Proper Nouns & Brand Names
  '2fa': '2FA',
  adobe: 'Adobe',
  agile: 'Agile',
  amazon: 'Amazon',
  android: 'Android',
  anthropic: 'Anthropic',
  apple: 'Apple',
  azure: 'Azure',
  bun: 'Bun',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  codeberg: 'Codeberg',
  confluence: 'Confluence',
  copilot: 'Copilot',
  covid: 'COVID',
  'dall-e': 'DALL-E',
  debian: 'Debian',
  devops: 'DevOps',
  diátaxis: 'Diátaxis',
  docker: 'Docker',
  'dr. patel': 'Dr. Patel',
  facebook: 'Facebook',
  figma: 'Figma',
  gdpr: 'GDPR',
  gemini: 'Gemini',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  glossary: 'Glossary',
  'google cloud': 'Google Cloud',
  google: 'Google',
  hipaa: 'HIPAA',
  html: 'HTML',
  huggingface: 'Hugging Face',
  'hugging face': 'Hugging Face',
  iaas: 'IaaS',
  ios: 'iOS',
  japanese: 'Japanese',
  jenkins: 'Jenkins',
  jira: 'Jira',
  kanban: 'Kanban',
  kubernetes: 'Kubernetes',
  langchain: 'LangChain',
  linux: 'Linux',
  llama: 'Llama',
  macos: 'macOS',
  markdown: 'Markdown',
  'markdownlint-cli2': 'markdownlint-cli2',
  'machine learning': 'Machine Learning',
  meta: 'Meta',
  michael: 'Michael',
  microsoft: 'Microsoft',
  midjourney: 'Midjourney',
  netlify: 'Netlify',
  notion: 'Notion',
  npm: 'npm',
  'npm publishing': 'npm Publishing',
  nvidia: 'NVIDIA',
  openai: 'OpenAI',
  paas: 'PaaS',
  paris: 'Paris',
  'pci dss': 'PCI DSS',
  planetscale: 'PlanetScale',
  postman: 'Postman',
  prettier: 'Prettier',
  pytorch: 'PyTorch',
  'red hat': 'Red Hat',
  'rest api': 'REST API',
  saas: 'SaaS',
  salesforce: 'Salesforce',
  scrum: 'Scrum',
  slack: 'Slack',
  socrates: 'Socrates',
  'single sign-on': 'Single Sign-On',
  stripe: 'Stripe',
  swagger: 'Swagger',
  openapi: 'OpenAPI',
  pandoc: 'Pandoc',
  tensorflow: 'TensorFlow',
  terraform: 'Terraform',
  twilio: 'Twilio',
  'microsoft word': 'Microsoft Word',
  ubuntu: 'Ubuntu',
  'user experience': 'User experience',
  'user interface': 'User Interface',
  vercel: 'Vercel',
  'vs code': 'VS Code',
  vscode: 'VS Code',
  windows: 'Windows',
  yarn: 'Yarn',
  zoloft: 'Zoloft',

  // Multi-word terms (proper nouns and established brand/service names only)
  'amazon web services': 'Amazon Web Services',
  'api gateway': 'API Gateway',
  'aws lambda': 'AWS Lambda',
  'azure functions': 'Azure Functions',
  'ci/cd': 'CI/CD',
  'google cloud platform': 'Google Cloud Platform',
  'github actions': 'GitHub Actions',
  'github projects': 'GitHub Projects',
  'gitlab ci': 'GitLab CI',
  'microsoft azure': 'Microsoft Azure',
  
  // Geographic names
  andes: 'Andes',
  mit: 'MIT',

  // GitHub Markdown Alerts (must be all-caps per spec)
  note: 'NOTE',
  tip: 'TIP',
  important: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'CAUTION',

  // Common technical terms
  semver: 'SemVer',
};

/**
 * Ambiguous terms that could be either common words or proper nouns/technical terms.
 * These terms are flagged for manual review but NOT autofixed to avoid incorrect changes.
 *
 * Each entry maps: lowercase term → { properForm: 'Capitalized', reason: 'explanation' }
 *
 * Examples of ambiguity:
 * - "word" - could be common noun OR Microsoft Word
 * - "go" - could be verb OR Go programming language
 * - "swift" - could be adjective OR Swift programming language
 * - "rust" - could be noun OR Rust programming language
 * - "major"/"minor" - could be adjectives OR SemVer terminology
 *
 * @type {Record<string, { properForm: string, reason: string }>}
 */
export const ambiguousTerms = {
  word: {
    properForm: 'Word',
    reason: 'Could be common noun "word" OR Microsoft Word (the software)'
  },
  go: {
    properForm: 'Go',
    reason: 'Could be verb "go" OR Go programming language'
  },
  swift: {
    properForm: 'Swift',
    reason: 'Could be adjective "swift" OR Swift programming language'
  },
  rust: {
    properForm: 'Rust',
    reason: 'Could be noun "rust" OR Rust programming language'
  },
  ruby: {
    properForm: 'Ruby',
    reason: 'Could be gemstone "ruby" OR Ruby programming language'
  },
  python: {
    properForm: 'Python',
    reason: 'Could be snake "python" OR Python programming language'
  },
  java: {
    properForm: 'Java',
    reason: 'Could be island/coffee "java" OR Java programming language'
  },
  scala: {
    properForm: 'Scala',
    reason: 'Could be Italian word "scala" OR Scala programming language'
  },
  dart: {
    properForm: 'Dart',
    reason: 'Could be noun "dart" OR Dart programming language'
  },
  patch: {
    properForm: 'PATCH',
    reason: 'Could be verb/noun "patch" OR SemVer PATCH version'
  },
  minor: {
    properForm: 'MINOR',
    reason: 'Could be adjective "minor" OR SemVer MINOR version'
  },
  major: {
    properForm: 'MAJOR',
    reason: 'Could be adjective "major" OR SemVer MAJOR version'
  },
};

/**
 * Additional terms to ignore in the `backtick-code-elements` rule, not covered by casingTerms.
 * @type {readonly string[]}
 */
const additionalBacktickIgnoredTerms = [
  'github.com',
  'ulca.edu',
  'pass/fail',
  'e.g',
  'i.e',
  'CI/CD',
  'Describe/test',
  'CSV/JSON',
  'Swagger/OpenAPI',
  // Common option/alternative patterns
  'on/off',
  'true/false',
  'yes/no',
  'read/write',
  'input/output',
  'enable/disable',
  'start/stop',
  'open/close',
  'get/set',
  'push/pull',
  'left/right',
  'up/down',
  'in/out',
  'and/or',
  'either/or',
  'http/https',
  'import/export',
  'GET/POST',
  'PUT/POST',
  'PUT/PATCH',
  'CREATE/UPDATE',
  'add/remove',
  'insert/delete',
  'show/hide',
  'expand/collapse',
  'min/max',
  'first/last',
  'prev/next',
  'before/after',
  'old/new',
  'src/dest',
  'source/target',
  'from/to',
  'client/server',
  'local/remote',
  'dev/prod',
  // Issue #89: Additional non-path patterns
  'integration/e2e',
  'Integration/E2E',
  'value/effort',
  'Value/Effort',
  'feature/module',
  'added/updated',
  'adapt/extend',
  'start/complete',
  'lowest/most'
];

/**
 * Common English words used in non-path conceptual pairs (issue #89).
 * Used by isLikelyFilePath() to avoid flagging phrases like "pass/fail" or "start/complete".
 * @type {readonly string[]}
 */
export const commonConceptualWords = [
  'true', 'false', 'yes', 'no', 'on', 'off', 'read', 'write', 'input', 'output',
  'pass', 'fail', 'enable', 'disable', 'start', 'stop', 'open', 'close',
  'get', 'set', 'push', 'pull', 'left', 'right', 'up', 'down', 'in', 'out',
  'and', 'or', 'either', 'http', 'https', 'import', 'export', 'add', 'remove',
  'insert', 'delete', 'show', 'hide', 'expand', 'collapse', 'min', 'max',
  'first', 'last', 'prev', 'next', 'before', 'after', 'old', 'new',
  'client', 'server', 'local', 'remote', 'dev', 'prod', 'source', 'target',
  'from', 'to', 'create', 'update', 'post', 'put', 'patch',
  'integration', 'e2e', 'value', 'effort', 'feature', 'module', 'added', 'updated',
  'adapt', 'extend', 'complete', 'lowest', 'most'
];

/**
 * Known directory prefixes commonly used in project structures (issue #89).
 * Used to distinguish actual file paths from conceptual pairs.
 * @type {readonly string[]}
 */
export const knownDirectoryPrefixes = [
  'src', 'lib', 'dist', 'build', 'out', 'bin', 'test', 'tests', 'spec', 'specs',
  'doc', 'docs', 'examples', 'demo', 'config', 'configs', 'scripts', 'tools',
  'assets', 'static', 'public', 'private', 'node_modules', 'vendor', 'packages',
  'app', 'apps', 'components', 'pages', 'views', 'models', 'controllers',
  'services', 'utils', 'helpers', 'middleware', 'routes', 'api', 'styles',
  'css', 'js', 'ts', 'img', 'images', 'fonts', 'data', 'fixtures'
];
/**
 * A set of terms that should be ignored by the `backtick-code-elements` rule.
 * This includes all special-cased terms from the dictionary above plus a few domain-specific exceptions.
 * @type {Readonly<Set<string>>}
 */
export const backtickIgnoredTerms = new Set([
  ...Object.values(casingTerms),
  ...additionalBacktickIgnoredTerms
]);

/**
 * Default exceptions where a literal ampersand is acceptable in prose.
 * These are common industry and brand names.
 * Consumers can extend/override via the rule's `exceptions` option.
 * @type {readonly string[]}
 */
export const ampersandDefaultExceptions = [
  'R&D',
  'Q&A',
  'M&A',
  'S&P',
  'AT&T'
];

/**
 * Unicode regex patterns for internationalized text validation.
 * These patterns use Unicode property escapes to support all scripts (Latin, Cyrillic, Greek, CJK, Arabic, etc.).
 */

/**
 * Unicode letter regex using \p{L} property escape.
 * Matches any letter character across all Unicode scripts.
 * Use this instead of ASCII-only [a-zA-Z] for international text support.
 * @type {RegExp}
 */
export const UNICODE_LETTER_REGEX = /\p{L}/u;

/**
 * Unicode uppercase letter regex using \p{Lu} property escape.
 * Matches uppercase letters across all Unicode scripts (A-Z, À-Ö, Α-Ω, А-Я, etc.).
 * Use this for case validation and acronym detection in internationalized content.
 * @type {RegExp}
 */
export const UNICODE_UPPERCASE_REGEX = /\p{Lu}/u;

/**
 * Unicode uppercase word regex (word must contain only uppercase letters).
 * Used for acronym detection across all Unicode scripts.
 * @type {RegExp}
 */
export const UPPERCASE_WORD_REGEX = /^\p{Lu}+$/u;
