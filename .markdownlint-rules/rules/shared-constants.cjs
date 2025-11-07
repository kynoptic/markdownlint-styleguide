"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.knownDirectoryPrefixes = exports.commonConceptualWords = exports.casingTerms = exports.backtickIgnoredTerms = exports.ampersandDefaultExceptions = exports.ambiguousTerms = exports.UPPERCASE_WORD_REGEX = exports.UNICODE_UPPERCASE_REGEX = exports.UNICODE_LETTER_REGEX = void 0;
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
const casingTerms = exports.casingTerms = {
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
  bash: 'Bash',
  'c#': 'C#',
  'c++': 'C++',
  deno: 'Deno',
  django: 'Django',
  elixir: 'Elixir',
  ember: 'Ember',
  erlang: 'Erlang',
  eslint: 'ESLint',
  express: 'Express',
  fastapi: 'FastAPI',
  flask: 'Flask',
  gatsby: 'Gatsby',
  haskell: 'Haskell',
  javascript: 'JavaScript',
  jest: 'Jest',
  jquery: 'jQuery',
  jsdoc: 'JSDoc',
  kotlin: 'Kotlin',
  laravel: 'Laravel',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  'node.js': 'Node.js',
  nuxt: 'Nuxt',
  perl: 'Perl',
  phoenix: 'Phoenix',
  php: 'PHP',
  preact: 'Preact',
  pytest: 'pytest',
  rails: 'Rails',
  'react.js': 'React.js',
  react: 'React',
  remix: 'Remix',
  solidjs: 'SolidJS',
  'solid.js': 'SolidJS',
  spring: 'Spring',
  svelte: 'Svelte',
  sveltekit: 'SvelteKit',
  symfony: 'Symfony',
  tailwind: 'Tailwind',
  typescript: 'TypeScript',
  vite: 'Vite',
  vue: 'Vue',
  vitest: 'Vitest',
  webpack: 'Webpack',
  zsh: 'Zsh',
  // Databases
  cassandra: 'Cassandra',
  clickhouse: 'ClickHouse',
  cockroachdb: 'CockroachDB',
  couchbase: 'Couchbase',
  couchdb: 'CouchDB',
  dynamodb: 'DynamoDB',
  elasticsearch: 'Elasticsearch',
  firestore: 'Firestore',
  influxdb: 'InfluxDB',
  mariadb: 'MariaDB',
  memcached: 'Memcached',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  neo4j: 'Neo4j',
  oracle: 'Oracle',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  snowflake: 'Snowflake',
  sqlite: 'SQLite',
  'sql server': 'SQL Server',
  supabase: 'Supabase',
  timescaledb: 'TimescaleDB',
  // Proper Nouns & Brand Names
  '2fa': '2FA',
  adobe: 'Adobe',
  agile: 'Agile',
  airflow: 'Airflow',
  amazon: 'Amazon',
  android: 'Android',
  ansible: 'Ansible',
  anthropic: 'Anthropic',
  apache: 'Apache',
  apple: 'Apple',
  argocd: 'ArgoCD',
  atlassian: 'Atlassian',
  auth0: 'Auth0',
  azure: 'Azure',
  bitbucket: 'Bitbucket',
  bun: 'Bun',
  centos: 'CentOS',
  chatgpt: 'ChatGPT',
  chrome: 'Chrome',
  circleci: 'CircleCI',
  claude: 'Claude',
  cloudflare: 'Cloudflare',
  codeberg: 'Codeberg',
  confluence: 'Confluence',
  copilot: 'Copilot',
  covid: 'COVID',
  'dall-e': 'DALL-E',
  datadog: 'Datadog',
  debian: 'Debian',
  devops: 'DevOps',
  diátaxis: 'Diátaxis',
  docker: 'Docker',
  'dr. patel': 'Dr. Patel',
  dropbox: 'Dropbox',
  edge: 'Edge',
  facebook: 'Facebook',
  fedora: 'Fedora',
  figma: 'Figma',
  firefox: 'Firefox',
  gdpr: 'GDPR',
  gemini: 'Gemini',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  glossary: 'Glossary',
  'google cloud': 'Google Cloud',
  google: 'Google',
  grafana: 'Grafana',
  helm: 'Helm',
  heroku: 'Heroku',
  hipaa: 'HIPAA',
  html: 'HTML',
  huggingface: 'Hugging Face',
  'hugging face': 'Hugging Face',
  iaas: 'IaaS',
  instagram: 'Instagram',
  ios: 'iOS',
  japanese: 'Japanese',
  jenkins: 'Jenkins',
  jira: 'Jira',
  jupyter: 'Jupyter',
  kanban: 'Kanban',
  kafka: 'Kafka',
  kubernetes: 'Kubernetes',
  langchain: 'LangChain',
  linkedin: 'LinkedIn',
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
  nginx: 'Nginx',
  notion: 'Notion',
  npm: 'npm',
  'npm publishing': 'npm Publishing',
  nosql: 'NoSQL',
  nvidia: 'NVIDIA',
  oauth: 'OAuth',
  openai: 'OpenAI',
  paas: 'PaaS',
  paris: 'Paris',
  'pci dss': 'PCI DSS',
  planetscale: 'PlanetScale',
  postman: 'Postman',
  prettier: 'Prettier',
  prometheus: 'Prometheus',
  pytorch: 'PyTorch',
  rabbitmq: 'RabbitMQ',
  railway: 'Railway',
  'red hat': 'Red Hat',
  render: 'Render',
  'rest api': 'REST API',
  saas: 'SaaS',
  safari: 'Safari',
  salesforce: 'Salesforce',
  scrum: 'Scrum',
  sendgrid: 'SendGrid',
  sentry: 'Sentry',
  slack: 'Slack',
  socrates: 'Socrates',
  'single sign-on': 'Single Sign-On',
  splunk: 'Splunk',
  spotify: 'Spotify',
  stripe: 'Stripe',
  swagger: 'Swagger',
  openapi: 'OpenAPI',
  pandoc: 'Pandoc',
  tensorflow: 'TensorFlow',
  terraform: 'Terraform',
  travisci: 'Travis CI',
  'travis ci': 'Travis CI',
  trello: 'Trello',
  twilio: 'Twilio',
  twitter: 'Twitter',
  'microsoft word': 'Microsoft Word',
  ubuntu: 'Ubuntu',
  'user experience': 'User experience',
  'user interface': 'User Interface',
  vagrant: 'Vagrant',
  vercel: 'Vercel',
  'vs code': 'VS Code',
  vscode: 'VS Code',
  windows: 'Windows',
  wordpress: 'WordPress',
  yarn: 'Yarn',
  youtube: 'YouTube',
  zoloft: 'Zoloft',
  // Multi-word terms (proper nouns and established brand/service names only)
  'amazon web services': 'Amazon Web Services',
  'api gateway': 'API Gateway',
  'aws lambda': 'AWS Lambda',
  'azure functions': 'Azure Functions',
  'ci/cd': 'CI/CD',
  'create react app': 'Create React App',
  'google cloud platform': 'Google Cloud Platform',
  'github actions': 'GitHub Actions',
  'github projects': 'GitHub Projects',
  'gitlab ci': 'GitLab CI',
  'microsoft azure': 'Microsoft Azure',
  'visual studio code': 'Visual Studio Code',
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
  semver: 'SemVer'
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
const ambiguousTerms = exports.ambiguousTerms = {
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
  }
};

/**
 * Additional terms to ignore in the `backtick-code-elements` rule, not covered by casingTerms.
 * @type {readonly string[]}
 */
const additionalBacktickIgnoredTerms = ['github.com', 'ulca.edu', 'pass/fail', 'e.g', 'i.e', 'CI/CD', 'Describe/test', 'CSV/JSON', 'Swagger/OpenAPI',
// Common option/alternative patterns
'on/off', 'true/false', 'yes/no', 'read/write', 'input/output', 'enable/disable', 'start/stop', 'open/close', 'get/set', 'push/pull', 'left/right', 'up/down', 'in/out', 'and/or', 'either/or', 'http/https', 'import/export', 'GET/POST', 'PUT/POST', 'PUT/PATCH', 'CREATE/UPDATE', 'add/remove', 'insert/delete', 'show/hide', 'expand/collapse', 'min/max', 'first/last', 'prev/next', 'before/after', 'old/new', 'src/dest', 'source/target', 'from/to', 'client/server', 'local/remote', 'dev/prod',
// Issue #89: Additional non-path patterns
'integration/e2e', 'Integration/E2E', 'value/effort', 'Value/Effort', 'feature/module', 'added/updated', 'adapt/extend', 'start/complete', 'lowest/most'];

/**
 * Common English words used in non-path conceptual pairs (issue #89).
 * Used by isLikelyFilePath() to avoid flagging phrases like "pass/fail" or "start/complete".
 * @type {readonly string[]}
 */
const commonConceptualWords = exports.commonConceptualWords = ['true', 'false', 'yes', 'no', 'on', 'off', 'read', 'write', 'input', 'output', 'pass', 'fail', 'enable', 'disable', 'start', 'stop', 'open', 'close', 'get', 'set', 'push', 'pull', 'left', 'right', 'up', 'down', 'in', 'out', 'and', 'or', 'either', 'http', 'https', 'import', 'export', 'add', 'remove', 'insert', 'delete', 'show', 'hide', 'expand', 'collapse', 'min', 'max', 'first', 'last', 'prev', 'next', 'before', 'after', 'old', 'new', 'client', 'server', 'local', 'remote', 'dev', 'prod', 'source', 'target', 'from', 'to', 'create', 'update', 'post', 'put', 'patch', 'integration', 'e2e', 'value', 'effort', 'feature', 'module', 'added', 'updated', 'adapt', 'extend', 'complete', 'lowest', 'most'];

/**
 * Known directory prefixes commonly used in project structures (issue #89).
 * Used to distinguish actual file paths from conceptual pairs.
 * @type {readonly string[]}
 */
const knownDirectoryPrefixes = exports.knownDirectoryPrefixes = ['src', 'lib', 'dist', 'build', 'out', 'bin', 'test', 'tests', 'spec', 'specs', 'doc', 'docs', 'examples', 'demo', 'config', 'configs', 'scripts', 'tools', 'assets', 'static', 'public', 'private', 'node_modules', 'vendor', 'packages', 'app', 'apps', 'components', 'pages', 'views', 'models', 'controllers', 'services', 'utils', 'helpers', 'middleware', 'routes', 'api', 'styles', 'css', 'js', 'ts', 'img', 'images', 'fonts', 'data', 'fixtures'];
/**
 * A set of terms that should be ignored by the `backtick-code-elements` rule.
 * This includes all special-cased terms from the dictionary above plus a few domain-specific exceptions.
 * @type {Readonly<Set<string>>}
 */
const backtickIgnoredTerms = exports.backtickIgnoredTerms = new Set([...Object.values(casingTerms), ...additionalBacktickIgnoredTerms]);

/**
 * Default exceptions where a literal ampersand is acceptable in prose.
 * These are common industry and brand names.
 * Consumers can extend/override via the rule's `exceptions` option.
 * @type {readonly string[]}
 */
const ampersandDefaultExceptions = exports.ampersandDefaultExceptions = ['R&D', 'Q&A', 'M&A', 'S&P', 'AT&T'];

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
const UNICODE_LETTER_REGEX = exports.UNICODE_LETTER_REGEX = /\p{L}/u;

/**
 * Unicode uppercase letter regex using \p{Lu} property escape.
 * Matches uppercase letters across all Unicode scripts (A-Z, À-Ö, Α-Ω, А-Я, etc.).
 * Use this for case validation and acronym detection in internationalized content.
 * @type {RegExp}
 */
const UNICODE_UPPERCASE_REGEX = exports.UNICODE_UPPERCASE_REGEX = /\p{Lu}/u;

/**
 * Unicode uppercase word regex (word must contain only uppercase letters).
 * Used for acronym detection across all Unicode scripts.
 * @type {RegExp}
 */
const UPPERCASE_WORD_REGEX = exports.UPPERCASE_WORD_REGEX = /^\p{Lu}+$/u;