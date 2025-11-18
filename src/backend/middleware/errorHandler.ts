/**
 * エラーハンドリングミドルウェア
 *
 * 参照: docs/implementation-strategy.md Phase 2.4
 *
 * セキュリティ注意:
 * - 本番環境ではスタックトレースを隠蔽
 * - 操作可能エラー (isOperational=true) のみユーザーに表示
 * - それ以外は汎用メッセージを返す
 */
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';
import { ErrorResponse } from '../types/api.js';

/**
 * エラーハンドリングミドルウェア
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // AppError の場合
  if (err instanceof AppError) {
    // ログ記録
    if (err.statusCode >= 500) {
      logger.error('Server Error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.user_id,
      });
    } else {
      logger.warn('Client Error', {
        error: err.message,
        url: req.url,
        method: req.method,
        userId: req.user?.user_id,
      });
    }

    // ValidationError の場合は詳細エラーを含める
    if (err instanceof ValidationError) {
      const response: ErrorResponse = {
        status: 'error',
        message: err.message,
        errors: err.errors,
      };
      res.status(err.statusCode).json(response);
      return;
    }

    // 通常の AppError
    const response: ErrorResponse = {
      status: 'error',
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 予期しないエラー
  logger.error('Unexpected Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.user_id,
  });

  // 本番環境では汎用メッセージ
  const response: ErrorResponse = {
    status: 'error',
    message: isProduction
      ? 'Internal server error'
      : err.message || 'An unexpected error occurred',
  };

  res.status(500).json(response);
};

/**
 * 404 Not Found ハンドラー
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const response: ErrorResponse = {
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
  };

  logger.warn('404 Not Found', {
    url: req.url,
    method: req.method,
  });

  res.status(404).json(response);
};

/**
 * 非同期ハンドラーラッパー
 *
 * 非同期関数のエラーを自動的にキャッチして next() に渡す
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
