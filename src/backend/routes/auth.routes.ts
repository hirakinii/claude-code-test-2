/**
 * 認証ルート
 */
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/auth/register
 * ユーザー登録
 */
router.post('/register', validateBody(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * ログイン
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * GET /api/auth/me
 * 現在のユーザー情報を取得（認証必須）
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * ログアウト（認証必須）
 */
router.post('/logout', authenticate, authController.logout);

export default router;
