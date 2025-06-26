// jest.config.js

// This configuration ensures Jest correctly handles ES Modules and uses Babel for transpilation.
export default {
  // Treat .js files as ES Modules, necessary when "type": "module" is in package.json
  extensionsToTreatAsEsm: ['.js'],
  // Use babel-jest to transform all .js files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};