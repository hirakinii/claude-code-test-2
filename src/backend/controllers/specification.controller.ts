/**
 * 仕様書コントローラー
 *
 * 仕様書のCRUD操作
 */
import { Request, Response } from 'express';
import * as specificationService from '../services/specification.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SuccessResponse, PaginatedResponse } from '../types/api.js';
import { Specification } from '@prisma/client';

/**
 * 仕様書を新規作成
 *
 * POST /api/specifications
 */
export const createSpecification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { schema_id, title } = req.body;

    const specification = await specificationService.createSpecification({
      author_user_id: user.user_id,
      schema_id,
      title,
    });

    const response: SuccessResponse<Specification> = {
      status: 'success',
      data: specification,
    };

    res.status(201).json(response);
  }
);

/**
 * 仕様書一覧を取得
 *
 * GET /api/specifications
 */
export const listSpecifications = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { page, pageSize, status, search } = req.query as {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    };

    // 管理者以外は自分の仕様書のみ取得
    const author_user_id = user.roles.some((r) => r.role_name === 'administrator')
      ? undefined
      : user.user_id;

    const result = await specificationService.listSpecifications({
      author_user_id,
      page,
      pageSize,
      status: status as any,
      search,
    });

    const response: PaginatedResponse<any> = {
      status: 'success',
      data: result.data,
      meta: result.meta,
    };

    res.json(response);
  }
);

/**
 * 仕様書を取得
 *
 * GET /api/specifications/:id
 */
export const getSpecification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { id } = req.params;

    const specification = await specificationService.getSpecification(
      id,
      user.user_id,
      user.roles.map((r) => r.role_name)
    );

    const response: SuccessResponse<any> = {
      status: 'success',
      data: specification,
    };

    res.json(response);
  }
);

/**
 * 仕様書を更新
 *
 * PUT /api/specifications/:id
 */
export const updateSpecification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { id } = req.params;
    const updateData = req.body;

    const specification = await specificationService.updateSpecification(
      id,
      user.user_id,
      user.roles.map((r) => r.role_name),
      updateData
    );

    const response: SuccessResponse<Specification> = {
      status: 'success',
      data: specification,
    };

    res.json(response);
  }
);

/**
 * 仕様書を削除
 *
 * DELETE /api/specifications/:id
 */
export const deleteSpecification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { id } = req.params;

    await specificationService.deleteSpecification(
      id,
      user.user_id,
      user.roles.map((r) => r.role_name)
    );

    const response: SuccessResponse<{ message: string }> = {
      status: 'success',
      data: { message: 'Specification deleted successfully' },
    };

    res.json(response);
  }
);
