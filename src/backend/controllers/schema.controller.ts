/**
 * スキーマコントローラー
 *
 * スキーマのCRUD操作（管理者のみ）
 */
import { Request, Response } from 'express';
import * as schemaService from '../services/schema.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SuccessResponse } from '../types/api.js';

/**
 * デフォルトスキーマを取得
 *
 * GET /api/schema
 */
export const getDefaultSchema = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const schema = await schemaService.getDefaultSchema();

    const response: SuccessResponse<any> = {
      status: 'success',
      data: schema,
    };

    res.json(response);
  }
);

/**
 * スキーマ一覧を取得
 *
 * GET /api/schemas
 */
export const listSchemas = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const schemas = await schemaService.listSchemas();

    const response: SuccessResponse<any> = {
      status: 'success',
      data: schemas,
    };

    res.json(response);
  }
);

/**
 * スキーマを取得
 *
 * GET /api/schemas/:id
 */
export const getSchema = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const schema = await schemaService.getSchemaWithStructure(id);

    const response: SuccessResponse<any> = {
      status: 'success',
      data: schema,
    };

    res.json(response);
  }
);

/**
 * スキーマを更新
 *
 * PUT /api/schemas/:id
 *
 * 管理者のみ
 */
export const updateSchema = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    const schema = await schemaService.updateSchema(id, user.user_id, updateData);

    const response: SuccessResponse<any> = {
      status: 'success',
      data: schema,
    };

    res.json(response);
  }
);

/**
 * デフォルトスキーマをリセット
 *
 * POST /api/schema/reset
 *
 * 管理者のみ
 */
export const resetDefaultSchema = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;

    await schemaService.resetDefaultSchema(user.user_id);

    const response: SuccessResponse<{ message: string }> = {
      status: 'success',
      data: { message: 'Default schema reset. Please run seed script.' },
    };

    res.json(response);
  }
);
