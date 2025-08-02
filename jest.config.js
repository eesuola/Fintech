export default {
  testEnvironment: 'node',
  transform: {}, // Disable Babel transform for ESM
  verbose: true,
  forceExit: true,
  testTimeout: 30000, // Increase timeout for tests
  detectOpenHandles: true,
  //   moduleNameMapper: {
  //     '^(\\.{1,2}/.*)\\.js$': '$1', // Handle .js extensions in imports
  //   },
};
