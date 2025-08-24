module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 60000,
  // Skip MongoDB-dependent tests in CI environments and ARM64 due to compatibility issues
  testPathIgnorePatterns: [
    '/node_modules/',
    ...((process.arch === 'arm64' || process.env.CI === 'true' || process.env.CIRCLECI === 'true') ? [
      '<rootDir>/src/tests/unit/utils/jwt.test.ts',
      '<rootDir>/src/tests/unit/models/',
      '<rootDir>/src/tests/integration/'
    ] : [])
  ]
};