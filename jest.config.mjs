// Jest configuration for ES Modules support in markdownlint-trap
// See https://jestjs.io/docs/ecmascript-modules for details

export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?js$': ['babel-jest', { configFile: './babel.config.json' }]
  },
  moduleNameMapper: {},

};
