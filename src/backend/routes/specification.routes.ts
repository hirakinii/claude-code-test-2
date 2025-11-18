/**
 * 仕様書ルート
 */
import { Router } from 'express';
import * as specificationController from '../controllers/specification.controller.js';
import * as exportController from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createSpecificationSchema,
  updateSpecificationSchema,
  listSpecificationsSchema,
} from '../utils/validation.js';
import { z } from 'zod';

const router = Router();

// すべてのルートで認証必須
router.use(authenticate);

/**
 * POST /api/specifications
 * 仕様書を新規作成
 */
router.post(
  '/',
  validateBody(createSpecificationSchema),
  specificationController.createSpecification
);

/**
 * GET /api/specifications
 * 仕様書一覧を取得
 */
router.get(
  '/',
  validateQuery(listSpecificationsSchema),
  specificationController.listSpecifications
);

/**
 * GET /api/specifications/:id
 * 仕様書を取得
 */
router.get('/:id', specificationController.getSpecification);

/**
 * PUT /api/specifications/:id
 * 仕様書を更新
 */
router.put(
  '/:id',
  validateBody(updateSpecificationSchema),
  specificationController.updateSpecification
);

/**
 * DELETE /api/specifications/:id
 * 仕様書を削除
 */
router.delete('/:id', specificationController.deleteSpecification);

/**
 * GET /api/specifications/:id/export
 * 仕様書をエクスポート
 */
router.get('/:id/export', exportController.exportSpecification);

export default router;
