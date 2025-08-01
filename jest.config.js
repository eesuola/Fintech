export default {
  testEnvironment: 'node',
  transform: {}, // Disable Babel transform for ESM
  extensionsToTreatAsEsm: ['.js'], // Treat .js files as ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Handle .js extensions in imports
  },
};