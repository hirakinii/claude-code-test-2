/**
 * サーバーエントリーポイント
 *
 * Express サーバーを起動
 */
import { createApp } from './app.js';
import { env, isDevelopment } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma, disconnectPrisma } from './utils/prisma.js';

/**
 * サーバーを起動
 */
const startServer = async () => {
  try {
    // データベース接続確認
    await prisma.$connect();
    logger.info('Connected to database');

    // Express アプリケーション作成
    const app = createApp();

    // サーバー起動
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server started`, {
        environment: env.NODE_ENV,
        host: env.HOST,
        port: env.PORT,
        url: `http://${env.HOST}:${env.PORT}`,
      });

      if (isDevelopment) {
        console.log(`
🚀 Server is running!

  Environment:  ${env.NODE_ENV}
  URL:          http://${env.HOST}:${env.PORT}
  Health Check: http://${env.HOST}:${env.PORT}/health

  API Endpoints:
  - POST   /api/auth/register
  - POST   /api/auth/login
  - GET    /api/auth/me
  - POST   /api/auth/logout
  - GET    /api/specifications
  - POST   /api/specifications
  - GET    /api/specifications/:id
  - PUT    /api/specifications/:id
  - DELETE /api/specifications/:id
  - GET    /api/schema
  - GET    /api/schemas/:id
  - PUT    /api/schemas/:id (Admin only)
  - POST   /api/schema/reset (Admin only)

Press CTRL-C to stop
        `);
      }
    });

    // グレースフルシャットダウン
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // データベース接続をクローズ
        await disconnectPrisma();

        process.exit(0);
      });

      // 強制終了タイマー（10秒）
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // シグナルハンドラー
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 未処理のエラー
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', {
        reason,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// サーバー起動
startServer();
