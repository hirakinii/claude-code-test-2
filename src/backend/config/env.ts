/**
 * 環境変数の型定義と検証
 *
 * セキュリティ注意:
 * - 環境変数は必ず検証してから使用する
 * - 本番環境では Google Cloud Secret Manager を使用すること
 *
 * 参照: CLAUDE.md - セキュリティファースト
 */
import { config } from 'dotenv';
import { z } from 'zod';

// .env ファイルを読み込み
config();

/**
 * 環境変数スキーマ
 */
const envSchema = z.object({
  // Node環境
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // サーバー設定
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // データベース
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT設定
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS設定
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ログレベル
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),

  // レート制限
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15分
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

/**
 * 環境変数を検証
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

/**
 * 本番環境かどうか
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * 開発環境かどうか
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * テスト環境かどうか
 */
export const isTest = env.NODE_ENV === 'test';
