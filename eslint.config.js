/**
 * ESLint configuration for markdownlint-trap project
 *
 * @description Defines linting rules for JavaScript files in the project
 * to ensure consistent code style and quality
 */

module.exports = [
  {
    files: ["rules/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "warn",
      "no-console": "off",
    },
    plugins: {},
    ignores: ["node_modules/**", "coverage/**"],
  },
];
