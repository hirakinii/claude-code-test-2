/**
 * スキーマサービス
 *
 * スキーマ（テンプレート）のCRUD操作
 *
 * 参照: docs/implementation-strategy.md Phase 2.3
 *
 * セキュリティ注意:
 * - スキーマ変更は管理者のみ可能
 * - デフォルトスキーマの削除は禁止
 */
import { Schema, SchemaCategory, SchemaField } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger, logAudit } from '../config/logger.js';

/**
 * スキーマ全体を取得（カテゴリ、フィールド含む）
 */
export const getSchemaWithStructure = async (schemaId: string) => {
  const schema = await prisma.schema.findUnique({
    where: { schema_id: schemaId },
    include: {
      categories: {
        include: {
          fields: {
            orderBy: {
              display_order: 'asc',
            },
          },
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!schema) {
    throw new NotFoundError('Schema');
  }

  return schema;
};

/**
 * デフォルトスキーマを取得
 */
export const getDefaultSchema = async () => {
  const schema = await prisma.schema.findFirst({
    where: { is_default: true },
    include: {
      categories: {
        include: {
          fields: {
            orderBy: {
              display_order: 'asc',
            },
          },
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!schema) {
    throw new NotFoundError('Default schema not found. Run seed script first.');
  }

  return schema;
};

/**
 * スキーマ一覧を取得
 */
export const listSchemas = async (): Promise<Schema[]> => {
  return prisma.schema.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });
};

/**
 * スキーマ更新データ型
 */
interface UpdateSchemaData {
  schema_name?: string;
  categories?: Array<{
    category_id?: string;
    category_name: string;
    description: string;
    display_order: number;
    fields: Array<{
      field_id?: string;
      field_name: string;
      data_type: string;
      is_required: boolean;
      options?: {
        choices?: string[];
      };
      placeholder_text?: string;
      list_target_entity?: string;
      display_order: number;
    }>;
  }>;
}

/**
 * スキーマを更新
 *
 * 注意: この操作は既存の仕様書に影響を与える可能性がある
 * トランザクション内で実行
 */
export const updateSchema = async (
  schemaId: string,
  userId: string,
  data: UpdateSchemaData
) => {
  // スキーマを取得
  const schema = await prisma.schema.findUnique({
    where: { schema_id: schemaId },
  });

  if (!schema) {
    throw new NotFoundError('Schema');
  }

  // トランザクション開始
  const updatedSchema = await prisma.$transaction(async (tx) => {
    // スキーマ名を更新
    if (data.schema_name) {
      await tx.schema.update({
        where: { schema_id: schemaId },
        data: { schema_name: data.schema_name },
      });
    }

    // カテゴリとフィールドを更新
    if (data.categories) {
      // 既存のカテゴリとフィールドを削除
      // 注意: CASCADE により SchemaField も自動削除される
      await tx.schemaCategory.deleteMany({
        where: { schema_id: schemaId },
      });

      // 新しいカテゴリとフィールドを作成
      for (const category of data.categories) {
        await tx.schemaCategory.create({
          data: {
            schema_id: schemaId,
            category_name: category.category_name,
            description: category.description,
            display_order: category.display_order,
            fields: {
              create: category.fields.map((field) => ({
                field_name: field.field_name,
                data_type: field.data_type,
                is_required: field.is_required,
                options: field.options || null,
                placeholder_text: field.placeholder_text,
                list_target_entity: field.list_target_entity,
                display_order: field.display_order,
              })),
            },
          },
        });
      }
    }

    // 更新後のスキーマを取得
    return getSchemaWithStructure(schemaId);
  });

  logAudit('UPDATE', userId, 'Schema', schemaId, {
    schema_name: data.schema_name,
  });

  logger.info('Schema updated', {
    schemaId,
    userId,
  });

  return updatedSchema;
};

/**
 * デフォルトスキーマをリセット
 *
 * 現在のデフォルトスキーマを削除し、シードデータを再投入
 * 注意: この操作は既存の仕様書に影響を与える可能性がある
 */
export const resetDefaultSchema = async (userId: string): Promise<void> => {
  // デフォルトスキーマを取得
  const defaultSchema = await prisma.schema.findFirst({
    where: { is_default: true },
  });

  if (!defaultSchema) {
    throw new NotFoundError('Default schema');
  }

  // このスキーマを使用している仕様書があるかチェック
  const specificationsCount = await prisma.specification.count({
    where: { schema_id: defaultSchema.schema_id },
  });

  if (specificationsCount > 0) {
    throw new BadRequestError(
      `Cannot reset default schema. ${specificationsCount} specifications are using this schema.`
    );
  }

  // デフォルトスキーマを削除（CASCADE により関連データも削除）
  await prisma.schema.delete({
    where: { schema_id: defaultSchema.schema_id },
  });

  logAudit('RESET', userId, 'Schema', defaultSchema.schema_id);

  logger.warn('Default schema reset', {
    schemaId: defaultSchema.schema_id,
    userId,
  });

  // 注意: シードスクリプトの再実行が必要
  throw new BadRequestError(
    'Default schema deleted. Please run seed script to recreate it.'
  );
};
