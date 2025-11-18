/**
 * 認証コントローラー
 *
 * ログイン、登録、現在のユーザー情報取得
 */
import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SuccessResponse } from '../types/api.js';
import { LoginResponse, CurrentUserResponse } from '../types/auth.js';

/**
 * ユーザー登録
 *
 * POST /api/auth/register
 */
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, fullName } = req.body;

    const result = await authService.register(email, password, fullName);

    const response: SuccessResponse<LoginResponse> = {
      status: 'success',
      data: result,
    };

    res.status(201).json(response);
  }
);

/**
 * ユーザーログイン
 *
 * POST /api/auth/login
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    const response: SuccessResponse<LoginResponse> = {
      status: 'success',
      data: result,
    };

    res.json(response);
  }
);

/**
 * 現在のユーザー情報を取得
 *
 * GET /api/auth/me
 *
 * 認証必須
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // authenticate ミドルウェアにより req.user が設定済み
    const user = req.user!;

    const userData: CurrentUserResponse = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles.map((r) => r.role_name),
      created_at: user.created_at,
    };

    const response: SuccessResponse<CurrentUserResponse> = {
      status: 'success',
      data: userData,
    };

    res.json(response);
  }
);

/**
 * ログアウト
 *
 * POST /api/auth/logout
 *
 * 注意: JWT はステートレスなので、サーバー側で無効化できない
 * クライアント側でトークンを削除する必要がある
 */
export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const response: SuccessResponse<{ message: string }> = {
      status: 'success',
      data: {
        message: 'Logged out successfully. Please delete the token on client side.',
      },
    };

    res.json(response);
  }
);
