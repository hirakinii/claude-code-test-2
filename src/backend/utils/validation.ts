/**
 * バリデーションスキーマ
 *
 * Zod を使用したリクエストバリデーション
 *
 * 参照: docs/implementation-strategy.md Phase 2.3
 */
import { z } from 'zod';
import { FieldDataType, SpecificationStatus } from '@prisma/client';

/**
 * メールアドレスバリデーション
 */
const emailSchema = z.string().email('Invalid email address');

/**
 * パスワードバリデーション
 * - 最小8文字
 * - 大文字、小文字、数字を含む
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * UUID バリデーション
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

// ============================================================================
// 認証関連
// ============================================================================

/**
 * ログインリクエスト
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * ユーザー登録リクエスト
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),
});

// ============================================================================
// 仕様書関連
// ============================================================================

/**
 * 納品物スキーマ
 */
const deliverableSchema = z.object({
  name: z
    .string()
    .min(1, 'Deliverable name is required')
    .max(255, 'Deliverable name must be less than 255 characters'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  description: z.string(),
});

/**
 * 受注者要件スキーマ
 */
const contractorRequirementSchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(255, 'Category must be less than 255 characters'),
  description: z.string(),
});

/**
 * 業務基本要件スキーマ
 */
const basicBusinessRequirementSchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(255, 'Category must be less than 255 characters'),
  description: z.string(),
});

/**
 * 業務タスクスキーマ
 */
const businessTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be less than 255 characters'),
  detailed_spec: z.string(),
});

/**
 * 仕様書コンテンツ項目スキーマ
 */
const specificationContentItemSchema = z.object({
  field_id: uuidSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
});

/**
 * 仕様書作成リクエスト
 */
export const createSpecificationSchema = z.object({
  schema_id: uuidSchema.optional(),
  title: z
    .string()
    .max(500, 'Title must be less than 500 characters')
    .optional(),
});

/**
 * 仕様書更新リクエスト
 */
export const updateSpecificationSchema = z.object({
  title: z
    .string()
    .max(500, 'Title must be less than 500 characters')
    .optional(),
  status: z.nativeEnum(SpecificationStatus).optional(),
  content: z.array(specificationContentItemSchema).optional(),
  deliverables: z.array(deliverableSchema).optional(),
  contractor_requirements: z.array(contractorRequirementSchema).optional(),
  basic_business_requirements: z
    .array(basicBusinessRequirementSchema)
    .optional(),
  business_tasks: z.array(businessTaskSchema).optional(),
});

/**
 * 仕様書一覧取得クエリパラメータ
 */
export const listSpecificationsSchema = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().int().positive()).optional(),
  pageSize: z.string().optional().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  status: z.nativeEnum(SpecificationStatus).optional(),
  search: z.string().optional(),
});

// ============================================================================
// スキーマ管理関連
// ============================================================================

/**
 * スキーマフィールド作成/更新
 */
const schemaFieldInputSchema = z.object({
  field_id: uuidSchema.optional(),
  field_name: z
    .string()
    .min(1, 'Field name is required')
    .max(255, 'Field name must be less than 255 characters'),
  data_type: z.nativeEnum(FieldDataType),
  is_required: z.boolean().default(false),
  options: z
    .object({
      choices: z.array(z.string()).optional(),
    })
    .optional(),
  placeholder_text: z.string().optional(),
  list_target_entity: z.string().max(100).optional(),
  display_order: z.number().int().nonnegative(),
});

/**
 * スキーマカテゴリ作成/更新
 */
const schemaCategoryInputSchema = z.object({
  category_id: uuidSchema.optional(),
  category_name: z
    .string()
    .min(1, 'Category name is required')
    .max(255, 'Category name must be less than 255 characters'),
  description: z.string(),
  display_order: z.number().int().nonnegative(),
  fields: z.array(schemaFieldInputSchema),
});

/**
 * スキーマ更新リクエスト
 */
export const updateSchemaSchema = z.object({
  schema_name: z
    .string()
    .min(1, 'Schema name is required')
    .max(255, 'Schema name must be less than 255 characters')
    .optional(),
  categories: z.array(schemaCategoryInputSchema).optional(),
});

// ============================================================================
// バリデーションヘルパー
// ============================================================================

/**
 * Zod バリデーションエラーをフォーマット
 */
export const formatZodErrors = (
  error: z.ZodError
): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
};
