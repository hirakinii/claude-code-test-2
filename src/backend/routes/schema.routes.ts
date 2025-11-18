/**
 * スキーマルート
 */
import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as schemaController from '../controllers/schema.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateSchemaSchema } from '../utils/validation.js';

const router = Router();

// すべてのルートで認証必須
router.use(authenticate);

/**
 * GET /api/schema
 * デフォルトスキーマを取得（全ユーザー）
 */
router.get('/', schemaController.getDefaultSchema);

/**
 * GET /api/schemas
 * スキーマ一覧を取得（全ユーザー）
 */
router.get('/list', schemaController.listSchemas);

/**
 * GET /api/schemas/:id
 * スキーマを取得（全ユーザー）
 */
router.get('/:id', schemaController.getSchema);

/**
 * PUT /api/schemas/:id
 * スキーマを更新（管理者のみ）
 */
router.put(
  '/:id',
  requireRole(RoleName.administrator),
  validateBody(updateSchemaSchema),
  schemaController.updateSchema
);

/**
 * POST /api/schema/reset
 * デフォルトスキーマをリセット（管理者のみ）
 */
router.post(
  '/reset',
  requireRole(RoleName.administrator),
  schemaController.resetDefaultSchema
);

export default router;
