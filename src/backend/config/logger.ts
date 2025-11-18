/**
 * ロガー設定
 *
 * Winston を使用した構造化ログ
 *
 * 参照: docs/implementation-strategy.md Phase 2 技術スタック
 */
import winston from 'winston';
import { env, isProduction } from './env.js';

/**
 * ログフォーマット
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * コンソール出力用フォーマット（開発環境）
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * ロガーインスタンス
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'spec-manager-api' },
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: isProduction ? logFormat : consoleFormat,
    }),

    // エラーログファイル（本番環境）
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ]
      : []),
  ],
  // 本番環境ではキャッチされなかった例外も記録
  exceptionHandlers: isProduction
    ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
    : [],
  rejectionHandlers: isProduction
    ? [new winston.transports.File({ filename: 'logs/rejections.log' })]
    : [],
});

/**
 * HTTPリクエストログのヘルパー
 */
export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

/**
 * 監査ログのヘルパー
 */
export const logAudit = (
  action: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>
) => {
  logger.info('Audit Log', {
    action,
    userId,
    resourceType,
    resourceId,
    ...details,
  });
};
