/**
 * Express アプリケーション設定
 *
 * ミドルウェア、ルーティング、エラーハンドリングを設定
 */
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, isDevelopment } from './config/env.js';
import { logger, logHttpRequest } from './config/logger.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler.js';

// ルート
import authRoutes from './routes/auth.routes.js';
import specificationRoutes from './routes/specification.routes.js';
import schemaRoutes from './routes/schema.routes.js';

/**
 * Express アプリケーションを作成
 */
export const createApp = (): Application => {
  const app = express();

  // ============================================================================
  // セキュリティミドルウェア
  // ============================================================================

  // Helmet: セキュアな HTTP ヘッダーを設定
  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment ? false : undefined,
    })
  );

  // CORS: クロスオリジンリクエストを許可
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // レート制限: DDoS攻撃対策
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // 認証エンドポイントには厳格なレート制限
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 5, // 5回まで
    message: 'Too many authentication attempts, please try again later.',
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // ============================================================================
  // 基本ミドルウェア
  // ============================================================================

  // JSON パーサー
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTPリクエストログ
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logHttpRequest(
        req.method,
        req.url,
        res.statusCode,
        duration,
        req.user?.user_id
      );
    });

    next();
  });

  // ============================================================================
  // ヘルスチェックエンドポイント
  // ============================================================================

  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ============================================================================
  // API ルーティング
  // ============================================================================

  app.use('/api/auth', authRoutes);
  app.use('/api/specifications', specificationRoutes);
  app.use('/api/schema', schemaRoutes);

  // ============================================================================
  // エラーハンドリング
  // ============================================================================

  // 404 Not Found
  app.use(notFoundHandler);

  // エラーハンドラー（最後に配置）
  app.use(errorHandler);

  return app;
};
