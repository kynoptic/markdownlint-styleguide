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
  // File format acronyms (should stay uppercase)
  docx: 'DOCX',
  xlsx: 'XLSX',
  pptx: 'PPTX',
  pdf: 'PDF',
  jpg: 'JPG',
  jpeg: 'JPEG',
  png: 'PNG',
  gif: 'GIF',
  svg: 'SVG',
  csv: 'CSV',
  pr: 'PR',  // Pull Request
  api: 'API',
  apis: 'APIs',
  e2e: 'E2E',  // End-to-End testing acronym
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
  mcp: 'MCP',
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
  wsl: 'WSL',  // Windows Subsystem for Linux
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
  nodejs: 'Node.js',  // Common misspelling
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

  // Build tools and automation
  babel: 'Babel',
  renovate: 'Renovate',
  dependabot: 'Dependabot',
  husky: 'Husky',
  markdownlint: 'markdownlint',  // conventionally lowercase
  rollup: 'Rollup',
  esbuild: 'esbuild',
  parcel: 'Parcel',
  turbo: 'Turbo',
  turborepo: 'Turborepo',
  lerna: 'Lerna',
  nx: 'Nx',
  gulp: 'Gulp',
  grunt: 'Grunt',

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
  'apple mail': 'Apple Mail',
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
  'claude code': 'Claude Code',
  'claude desktop': 'Claude Desktop',
  'agent skills': 'Agent Skills',
  'agent skill': 'Agent Skill',
  // Note: "skills" as a standalone word is NOT included because it's a common English word
  // Only "Agent Skills" as a phrase is a proper noun (Claude Code feature)
  opencode: 'OpenCode',
  sharepoint: 'SharePoint',  // Microsoft SharePoint (camelCase brand name)
  powerpoint: 'PowerPoint',
  cloudflare: 'Cloudflare',
  codeberg: 'Codeberg',
  confluence: 'Confluence',
  copilot: 'Copilot',
  'github copilot': 'GitHub Copilot',
  codex: 'Codex',
  'codex cli': 'Codex CLI',
  cursor: 'Cursor',
  playwright: 'Playwright',
  'gemini cli': 'Gemini CLI',
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
  promptfoo: 'Promptfoo',
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

  // Days of the week (proper nouns, always capitalized)
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',

  // Months (proper nouns, always capitalized)
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',

  // Language names (always capitalized as proper nouns)
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  italian: 'Italian',
  portuguese: 'Portuguese',
  russian: 'Russian',
  chinese: 'Chinese',
  korean: 'Korean',
  arabic: 'Arabic',
  hindi: 'Hindi',
  dutch: 'Dutch',
  polish: 'Polish',
  swedish: 'Swedish',
  norwegian: 'Norwegian',
  danish: 'Danish',
  finnish: 'Finnish',
  greek: 'Greek',
  hebrew: 'Hebrew',
  turkish: 'Turkish',
  vietnamese: 'Vietnamese',
  thai: 'Thai',
  indonesian: 'Indonesian',
  'american english': 'American English',
  'british english': 'British English',

  // Historical event names (proper nouns)
  'revolutionary war': 'Revolutionary War',
  'american revolutionary war': 'American Revolutionary War',
  'civil war': 'Civil War',
  'american civil war': 'American Civil War',
  'world war': 'World War',
  'world war i': 'World War I',
  'world war ii': 'World War II',
  'cold war': 'Cold War',

  // GitHub Markdown Alerts (must be all-caps per spec)
  note: 'NOTE',
  tip: 'TIP',
  important: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'CAUTION',

  // Standard documentation file conventions (all-caps by convention)
  // Note: Only include unambiguous file name conventions, not words that
  // have common English usage (e.g., "contributing" is also a verb)
  readme: 'README',
  readmes: 'READMEs',
  // Note: "changelog" → "CHANGELOG" recognizes CHANGELOG as valid in any position
  // "Changelog" as a standalone section title is handled separately in shouldExemptFromValidation
  changelog: 'CHANGELOG',
  codeowners: 'CODEOWNERS',

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
  changelog: {
    properForm: 'Changelog',
    reason: 'Could be "Changelog" (section title) OR "CHANGELOG" (filename reference)'
  },
  make: {
    properForm: 'Make',
    reason: 'Could be verb "make" OR GNU Make (the build tool)'
  },
  edge: {
    properForm: 'Edge',
    reason: 'Could be noun "edge" OR Microsoft Edge (the browser)'
  },
  skills: {
    properForm: 'Skills',
    reason: 'Could be common noun "skills" OR Claude Skills feature'
  },
  skill: {
    properForm: 'Skill',
    reason: 'Could be common noun "skill" OR Claude Skill feature'
  },
  agent: {
    properForm: 'Agent',
    reason: 'Could be common noun "agent" OR Claude Agent feature/SDK'
  },
  explore: {
    properForm: 'Explore',
    reason: 'Could be verb "explore" OR Explore agent type in Claude Code'
  },
  sdk: {
    properForm: 'SDK',
    reason: 'Could be generic SDK reference OR specific product SDK name'
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
  // Common acronym plurals (prose, not code identifiers)
  'ADRs',
  'PRs',
  'LLMs',
  'SDKs',
  'VPNs',
  'URLs',
  'CDNs',
  'IDs',
  'MCPs',
  'UUIDs',
  'IDEs',
  'SHAs',
  'GUIs',
  'CLIs',
  'APIs',
  // Module system names (proper nouns)
  'CommonJS',
  'ESM',
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
  'lowest/most',
  // Issue #round10: Additional prose patterns that are not file paths
  'CSV/JSON/markdown',
  'JSON/XML',
  'HTML/CSS',
  'JS/TS',
  'pages/documents',
  'files/folders',
  'users/groups',
  'roles/permissions',
  'read/write/execute',
  'owner/group/other'
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
 * Snake_case patterns that should be exempted from code identifier detection.
 * These are valid snake_case-looking patterns that are NOT code identifiers.
 * @type {Readonly<Set<string>>}
 */
export const snakeCaseExemptions = new Set([
  // Locale codes (ISO 639-1 language + ISO 3166-1 country)
  'en_US', 'en_GB', 'en_AU', 'en_CA', 'en_NZ', 'en_IE', 'en_ZA', 'en_IN',
  'zh_CN', 'zh_TW', 'zh_HK', 'zh_SG',
  'ja_JP',
  'ko_KR',
  'de_DE', 'de_AT', 'de_CH',
  'fr_FR', 'fr_CA', 'fr_BE', 'fr_CH',
  'es_ES', 'es_MX', 'es_AR', 'es_CO', 'es_CL',
  'pt_BR', 'pt_PT',
  'it_IT', 'it_CH',
  'ru_RU',
  'pl_PL',
  'nl_NL', 'nl_BE',
  'sv_SE',
  'da_DK',
  'fi_FI',
  'nb_NO', 'nn_NO',
  'cs_CZ',
  'sk_SK',
  'hu_HU',
  'tr_TR',
  'el_GR',
  'he_IL',
  'ar_SA', 'ar_EG', 'ar_AE',
  'th_TH',
  'vi_VN',
  'id_ID',
  'ms_MY',
  'hi_IN',
  'bn_BD', 'bn_IN',
  'uk_UA',
  'ro_RO',
  'bg_BG',
  'hr_HR',
  'sr_RS',
  'sl_SI',
  'lt_LT',
  'lv_LV',
  'et_EE',
]);

/**
 * camelCase patterns that should be exempted from code identifier detection.
 * These are brand names, product names, and proper nouns that use internal capitals
 * but are NOT code identifiers.
 * @type {Readonly<Set<string>>}
 */
export const camelCaseExemptions = new Set([
  // Apple products and services
  'iPhone', 'iPad', 'iPod', 'iMac', 'iCloud', 'iTunes', 'iWork', 'iMovie',
  'iPhoto', 'iBooks', 'iMessage', 'iOS', 'iPadOS', 'macOS', 'tvOS', 'watchOS',
  'visionOS', 'AirPods', 'AirPlay', 'AirDrop', 'AirPrint', 'AirTag',
  'HomePod', 'FaceTime', 'QuickTime', 'FileVault', 'TimeMachine',
  'MacBook', 'MacPro', 'MacMini',

  // Apple product names with specific casing
  'AppleMail',

  // Other tech brands and products
  'eBay', 'eBook', 'eBooks', 'eReader', 'eLearning', 'eCommerce', 'eMail',
  'PlayStation', 'GameCube', 'GameBoy',
  'YouTube', 'LinkedIn', 'TikTok', 'WhatsApp', 'WeChat', 'OneDrive',
  'PayPal', 'MasterCard', 'AmEx',
  'DoorDash', 'GrubHub', 'UberEats',
  'TechCrunch', 'VentureBeat',
  'OpenAI', 'DeepMind', 'AlphaGo', 'AlphaFold', 'ChatGPT', 'MidJourney',
  'LaTeX', 'BibTeX', 'MiKTeX', 'XeTeX', 'LuaTeX', 'ConTeXt', // TeX-related
  'DocuSign', 'SalesForce', 'HubSpot', 'MailChimp', 'ServiceNow',
  'LastPass', 'BitLocker', 'NordVPN', 'ExpressVPN', 'OnePassword',
  // Security vendors
  'CrowdStrike', 'SentinelOne', 'CarbonBlack', 'FireEye', 'McAfee',
  'SonicWall', 'CheckPoint', 'PaloAlto', 'FortiNet', 'CyberArk',
  // Backup and IT management tools
  'CrashPlan', 'BackBlaze', 'SpiderOak', 'CloudBerry',
  // Enterprise platforms
  'ServiceNow', 'SharePoint', 'BigQuery', 'DataBricks', 'SnowFlake',
  'HarvardKey', 'eCommons',
  // Developer tools
  'SpotBugs', 'OpenRewrite', 'SonarQube', 'SonarLint',
  'truffleHog', 'GitLeaks', 'GitGuardian',
  // Image/media formats and tools
  'WebP', 'WebM', 'DevTools', 'ChromeDriver', 'GeckoDriver',
  // Data/ML tools
  'PyYAML', 'NumPy', 'SciPy', 'TensorFlow', 'PyTorch',
  // General tech terms with unusual casing
  'WiFi', 'HiDPI', 'WebRTC', 'WebGL', 'WebVR', 'WebXR',
  'InDesign', 'InCopy', 'QuarkXPress',
  'AutoCAD', 'SolidWorks', 'SketchUp',
  'CodePen', 'CodeSandbox', 'StackBlitz', 'StackOverflow',
  'HackerRank', 'LeetCode', 'CodeWars',
  'JetBrains', 'IntelliJ', 'PyCharm', 'WebStorm', 'PhpStorm', 'GoLand',
  'NetBeans', 'XCode',

  // Names with Mc/Mac prefix (Scottish/Irish surnames)
  // Note: We use a regex pattern instead of listing all names
]);

/**
 * Regex pattern to match Mc/Mac surname prefixes.
 * These are Scottish/Irish names, not code identifiers.
 * Examples: McDonald, MacArthur, McCartney, MacBook
 * @type {RegExp}
 */
export const mcMacNamePattern = /^(?:Mc|Mac)[A-Z][a-z]+$/;

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

/**
 * Comprehensive emoji detection regex covering all major emoji Unicode ranges.
 * Includes:
 * - Basic emoji (emoticons, symbols, pictographs)
 * - Emoji with modifiers (skin tones, variation selectors)
 * - Zero-width joiner (ZWJ) sequences (multi-person emoji, professional emoji)
 * - Regional indicators (flags)
 * - Supplemental symbols and pictographs
 *
 * This regex uses Unicode property escapes for comprehensive coverage.
 * @type {RegExp}
 */
// eslint-disable-next-line no-misleading-character-class
export const EMOJI_REGEX = /[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F]/u;
