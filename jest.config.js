/**
 * Jest Configuration
 * Phase 4: 統合・テスト（バックエンド + フロントエンド + データベース）
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // テスト対象のパターン
  testMatch: [
    '**/prisma/tests/**/*.test.ts',
    '**/src/backend/tests/**/*.test.ts',
    '**/src/backend/**/*.spec.ts',
    '**/src/frontend/**/*.test.tsx',
    '**/src/frontend/**/*.spec.tsx',
  ],

  // モジュール名のマッピング
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@prisma/(.*)$': '<rootDir>/prisma/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    // CSS/画像のモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // プロジェクトごとの設定
  projects: [
    {
      displayName: 'database',
      testEnvironment: 'node',
      testMatch: ['**/prisma/tests/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/prisma/tests/setup.ts'],
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '**/src/backend/tests/**/*.test.ts',
        '**/src/backend/**/*.spec.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/backend/tests/setup.ts'],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: [
        '**/src/frontend/**/*.test.tsx',
        '**/src/frontend/**/*.spec.tsx',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/frontend/tests/setup.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.frontend.json',
        }],
      },
    },
  ],

  // カバレッジ設定
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    'src/frontend/**/*.{ts,tsx}',
    'prisma/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // タイムアウト設定
  testTimeout: 30000, // 30秒（DB操作を考慮）

  // その他の設定
  verbose: true,
  maxWorkers: '50%',

  // トランスフォーム設定
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: 'react',
      },
    }],
  },

  // モジュール拡張子
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
