/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  
  roots: ['<rootDir>/test'],
  
  testMatch: ['**/*.js'], 

  moduleDirectories: ['node_modules', 'lib', 'dist'],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  
  collectCoverageFrom: [
    'index.js',
    'lib/**/*.js',
    '!lib/version.js', // Exclude generated files
  ],
  
  moduleNameMapper: {
    '^@dagrejs/dagre$': '<rootDir>/dist/dagre.cjs.js',
  },

  watchAll: false,
};

module.exports = config;