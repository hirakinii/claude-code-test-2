/**
 * エクスポートコントローラー
 *
 * 仕様書のエクスポート
 */
import { Request, Response } from 'express';
import * as exportService from '../services/export.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { BadRequestError } from '../errors/AppError.js';

/**
 * 仕様書をエクスポート
 *
 * GET /api/specifications/:id/export
 *
 * クエリパラメータ:
 * - format: 'pdf' | 'word' | 'markdown' (デフォルト: 'markdown')
 */
export const exportSpecification = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { format = 'markdown' } = req.query as { format?: string };

    // フォーマット検証
    if (!['pdf', 'word', 'markdown'].includes(format)) {
      throw new BadRequestError('Invalid export format. Use: pdf, word, or markdown');
    }

    const result = await exportService.exportSpecification(
      id,
      format as exportService.ExportFormat
    );

    // レスポンスの設定
    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="specification-${id}.md"`
      );
      res.send(result);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="specification-${id}.pdf"`
      );
      res.send(result);
    } else if (format === 'word') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="specification-${id}.docx"`
      );
      res.send(result);
    }
  }
);
