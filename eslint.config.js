module.exports = [
  {
    files: ["rules/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "warn",
      "no-console": "off"
    },
    plugins: {},
    ignores: ["node_modules/**", "coverage/**"]
  }
];
