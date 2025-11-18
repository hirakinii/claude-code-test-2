/**
 * 認証・認可ミドルウェア
 *
 * JWT検証、RBAC実装
 *
 * 参照: docs/implementation-strategy.md Phase 2.2
 *
 * セキュリティ注意:
 * - トークンは Authorization ヘッダーから取得
 * - トークン検証失敗時は 401 Unauthorized
 * - ロールチェック失敗時は 403 Forbidden
 */
import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { verifyToken, findUserById, hasRole } from '../services/auth.service.js';
import { logger } from '../config/logger.js';

/**
 * 認証ミドルウェア
 *
 * Authorization ヘッダーから JWT トークンを検証
 * 検証成功時は req.user にユーザー情報をセット
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorization ヘッダーを取得
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    // トークンを抽出
    const token = authHeader.substring(7); // "Bearer " を除去

    // トークン検証
    const payload = verifyToken(token);

    // ユーザー情報を取得
    const user = await findUserById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // req.user にセット
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Authentication failed', {
        url: req.url,
        method: req.method,
        error: error.message,
      });
      next(error);
    } else {
      logger.error('Authentication error', {
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * ロールベースアクセス制御 (RBAC) ミドルウェア
 *
 * 指定されたロールを持つユーザーのみアクセス許可
 *
 * 使用例:
 * ```typescript
 * router.put('/api/schema',
 *   authenticate,
 *   requireRole(RoleName.administrator),
 *   updateSchema
 * );
 * ```
 */
export const requireRole = (roleName: RoleName) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 認証チェック
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        url: req.url,
        method: req.method,
      });
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // ロールチェック
    if (!hasRole(req.user, roleName)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        url: req.url,
        method: req.method,
        userId: req.user.user_id,
        requiredRole: roleName,
        userRoles: req.user.roles.map((r) => r.role_name),
      });
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * オプション認証ミドルウェア
 *
 * トークンがあれば検証するが、なくてもエラーにしない
 * 認証済み/未認証ユーザーで異なる応答を返す場合に使用
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // トークンがなければスキップ
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // トークンが無効でもエラーにしない
    next();
  }
};
