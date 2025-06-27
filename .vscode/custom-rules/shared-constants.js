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
  cli: 'CLI',
  css: 'CSS',
  es6: 'ES6',
  fbi: 'FBI',
  gcp: 'GCP',
  http: 'HTTP',
  https: 'HTTPS',
  ibm: 'IBM',
  json: 'JSON',
  nasa: 'NASA',
  oauth2: 'OAuth2',
  rest: 'REST',
  sql: 'SQL',
  ui: 'UI',
  unesco: 'UNESCO',
  unicef: 'UNICEF',
  url: 'URL',
  ux: 'UX',
  xml: 'XML',

  // Proper Nouns & Brand Names
  amazon: 'Amazon',
  android: 'Android',
  angular: 'Angular',
  apple: 'Apple',
  azure: 'Azure',
  chatgpt: 'ChatGPT',
  covid: 'COVID',
  docker: 'Docker',
  'dr. patel': 'Dr. Patel',
  facebook: 'Facebook',
  gemini: 'Gemini',
  git: 'Git',
  github: 'GitHub',
  glossary: 'Glossary',
  google: 'Google',
  ios: 'iOS',
  japanese: 'Japanese',
  javascript: 'JavaScript',
  kubernetes: 'Kubernetes',
  linux: 'Linux',
  macos: 'macOS',
  markdown: 'Markdown',
  michael: 'Michael',
  microsoft: 'Microsoft',
  nodejs: 'Node.js',
  npm: 'npm',
  paris: 'Paris',
  'red hat': 'Red Hat',
  react: 'React',
  socrates: 'Socrates',
  terraform: 'Terraform',
  typescript: 'TypeScript',
  'vs code': 'VS Code',
  vscode: 'VS Code',
  vue: 'Vue',
  windows: 'Windows',
  yarn: 'Yarn',
  zoloft: 'Zoloft',
  ai: 'AI',

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
