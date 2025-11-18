/**
 * バリデーションミドルウェア
 *
 * Zod スキーマを使用してリクエストを検証
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors/AppError.js';
import { formatZodErrors } from '../utils/validation.js';

/**
 * リクエストボディをバリデーション
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};

/**
 * クエリパラメータをバリデーション
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};

/**
 * パスパラメータをバリデーション
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};
