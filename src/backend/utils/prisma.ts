/**
 * Prisma クライアントのシングルトンインスタンス
 *
 * 参照: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

/**
 * グローバル型定義（開発環境でのホットリロード対応）
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma クライアントインスタンス
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

// クエリログをWinstonに転送
prisma.$on('query', (e) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

// 開発環境でのホットリロード時にインスタンスを保持
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * データベース接続をクローズ
 */
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Disconnected from database');
};
