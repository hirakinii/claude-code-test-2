/**
 * Jest Configuration
 * Phase 1: データベース層の最小限テスト
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '**/prisma/tests/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@prisma/(.*)$': '<rootDir>/prisma/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/prisma/tests/setup.ts'],
  collectCoverageFrom: [
    'prisma/**/*.ts',
    '!prisma/tests/**',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // 30秒（DB操作を考慮）
  verbose: true,
  // Prismaクライアントの生成を待つ
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
