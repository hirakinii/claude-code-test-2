/**
 * Express型拡張
 *
 * Requestオブジェクトにユーザー情報を追加
 */
import { User, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRoles;
    }
  }
}

/**
 * ロール情報を含むユーザー型
 */
export interface UserWithRoles extends User {
  roles: Role[];
}
