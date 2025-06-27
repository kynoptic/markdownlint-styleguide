// @ts-check

/**
 * A centralized collection of terms with special casing rules or that should be ignored by certain linting rules.
 * This helps maintain consistency across different custom rules.
 */

/**
 * A dictionary of terms that have a specific, required capitalization.
 * This includes technical terms, acronyms, and proper nouns.
 * The key is the lowercase version of the term for easy lookup, and the value is the correct casing.
 * This is used by the `sentence-case-heading` rule.
 * @type {Readonly<Record<string, string>>}
 */
export const specialCasedTerms = Object.freeze({
  // Technical Terms & Acronyms
  api: 'API',
  aws: 'AWS',
  cdc: 'CDC',
  cdn: 'CDN',
  cli: 'CLI',
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
  mfa: 'MFA',
  ml: 'ML',
  nasa: 'NASA',
  oauth2: 'OAuth2',
  rest: 'REST',
  sdk: 'SDK',
  sso: 'SSO',
  sql: 'SQL',
  ssl: 'SSL',
  tls: 'TLS',
  ui: 'UI',
  unesco: 'UNESCO',
  unicef: 'UNICEF',
  url: 'URL',
  ux: 'UX',
  vpn: 'VPN',
  xml: 'XML',

  // Programming Languages & Frameworks
  angular: 'Angular',
  'c#': 'C#',
  go: 'Go',
  java: 'Java',
  javascript: 'JavaScript',
  kotlin: 'Kotlin',
  nodejs: 'Node.js',
  php: 'PHP',
  python: 'Python',
  react: 'React',
  ruby: 'Ruby',
  rust: 'Rust',
  scala: 'Scala',
  swift: 'Swift',
  typescript: 'TypeScript',
  vue: 'Vue',

  // Databases
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  redis: 'Redis',

  // Proper Nouns & Brand Names
  '2fa': '2FA',
  adobe: 'Adobe',
  agile: 'Agile',
  amazon: 'Amazon',
  android: 'Android',
  apple: 'Apple',
  azure: 'Azure',
  chatgpt: 'ChatGPT',
  covid: 'COVID',
  docker: 'Docker',
  'dr. patel': 'Dr. Patel',
  facebook: 'Facebook',
  gdpr: 'GDPR',
  gemini: 'Gemini',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  glossary: 'Glossary',
  google: 'Google',
  hipaa: 'HIPAA',
  ios: 'iOS',
  japanese: 'Japanese',
  jenkins: 'Jenkins',
  jira: 'Jira',
  kanban: 'Kanban',
  kubernetes: 'Kubernetes',
  linux: 'Linux',
  macos: 'macOS',
  markdown: 'Markdown',
  michael: 'Michael',
  microsoft: 'Microsoft',
  npm: 'npm',
  paris: 'Paris',
  'pci dss': 'PCI DSS',
  postman: 'Postman',
  prettier: 'Prettier',
  'red hat': 'Red Hat',
  salesforce: 'Salesforce',
  scrum: 'Scrum',
  slack: 'Slack',
  socrates: 'Socrates',
  swagger: 'Swagger',
  terraform: 'Terraform',
  ubuntu: 'Ubuntu',
  'vs code': 'VS Code',
  vscode: 'VS Code',
  windows: 'Windows',
  yarn: 'Yarn',
  zoloft: 'Zoloft',
  ai: 'AI',
  'amazon web services': 'Amazon Web Services',
  'google cloud': 'Google Cloud',
  'microsoft azure': 'Microsoft Azure',
  devops: 'DevOps',
  eslint: 'ESLint',
  webpack: 'Webpack',
  confluence: 'Confluence',
  debian: 'Debian',

  // Geographic names
  andes: 'Andes',
});

/**
 * A set of terms that should be ignored by the `backtick-code-elements` rule.
 * This includes all special-cased terms from the dictionary above.
 * @type {Readonly<Set<string>>}
 */
export const backtickIgnoredTerms = new Set(Object.values(specialCasedTerms));
backtickIgnoredTerms.add('github.com');
backtickIgnoredTerms.add('ulca.edu');
backtickIgnoredTerms.add('pass/fail');
backtickIgnoredTerms.add('e.g');
backtickIgnoredTerms.add('i.e');
backtickIgnoredTerms.add('CI/CD');
backtickIgnoredTerms.add('Describe/test');
