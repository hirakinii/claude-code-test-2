/**
 * Jest Test Setup
 * テスト実行前にPrismaクライアントを初期化
 */

import { PrismaClient } from '@prisma/client';

// グローバルなPrismaインスタンス
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prismaクライアントのシングルトン
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// テスト実行前の警告
beforeAll(() => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      '❌ DATABASE_URL is not set. Please create .env file with DATABASE_URL.'
    );
  }

  if (dbUrl.includes('prod') || dbUrl.includes('production')) {
    throw new Error(
      '❌ DANGER: Tests cannot run against production database!'
    );
  }

  console.log('✅ Test setup complete. Using database:', dbUrl.split('@')[1] || 'unknown');
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await prisma.$disconnect();
});
