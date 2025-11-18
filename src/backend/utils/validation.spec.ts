/**
 * バリデーションユーティリティのユニットテスト
 *
 * 参照: docs/backend-api-test-specification.md セクション3
 */
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  createSpecificationSchema,
  updateSpecificationSchema,
  listSpecificationsSchema,
  formatZodErrors,
} from './validation';
import { SpecificationStatus } from '@prisma/client';

describe('validation', () => {
  describe('loginSchema', () => {
    test('正常なログインデータをバリデーション', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    test('無効なメールアドレスでエラー', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email');
      }
    });

    test('パスワードが空でエラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Password is required');
      }
    });
  });

  describe('registerSchema', () => {
    test('正常な登録データをバリデーション', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test1234',
        fullName: 'テストユーザー',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('パスワードが8文字未満でエラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Test12',
        fullName: 'テストユーザー',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    test('パスワードに大文字が含まれていない場合エラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'test1234',
        fullName: 'テストユーザー',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase letter');
      }
    });

    test('パスワードに小文字が含まれていない場合エラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TEST1234',
        fullName: 'テストユーザー',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('lowercase letter');
      }
    });

    test('パスワードに数字が含まれていない場合エラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestTest',
        fullName: 'テストユーザー',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('one number');
      }
    });

    test('fullNameが空の場合エラー', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Test1234',
        fullName: '',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Full name is required');
      }
    });
  });

  describe('createSpecificationSchema', () => {
    test('タイトルのみで作成可能', () => {
      const validData = {
        title: 'テスト仕様書',
      };

      const result = createSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('空のオブジェクトでも作成可能', () => {
      const validData = {};

      const result = createSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('schema_idが有効なUUIDの場合成功', () => {
      const validData = {
        schema_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('schema_idが無効なUUIDの場合エラー', () => {
      const invalidData = {
        schema_id: 'invalid-uuid',
      };

      const result = createSpecificationSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid UUID');
      }
    });
  });

  describe('updateSpecificationSchema', () => {
    test('タイトルのみの更新が可能', () => {
      const validData = {
        title: '更新されたタイトル',
      };

      const result = updateSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('ステータスの更新が可能', () => {
      const validData = {
        status: SpecificationStatus.saved,
      };

      const result = updateSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('コンテンツの更新が可能', () => {
      const validData = {
        content: [
          {
            field_id: '123e4567-e89b-12d3-a456-426614174000',
            value: 'テスト値',
          },
          {
            field_id: '223e4567-e89b-12d3-a456-426614174000',
            value: ['選択肢1', '選択肢2'],
          },
        ],
      };

      const result = updateSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('納品物の更新が可能', () => {
      const validData = {
        deliverables: [
          {
            name: '納品物1',
            quantity: 1,
            description: '説明1',
          },
        ],
      };

      const result = updateSpecificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('納品物の数量が負の数の場合エラー', () => {
      const invalidData = {
        deliverables: [
          {
            name: '納品物1',
            quantity: -1,
            description: '説明1',
          },
        ],
      };

      const result = updateSpecificationSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('listSpecificationsSchema', () => {
    test('ページネーションパラメータをパース', () => {
      const validData = {
        page: '1',
        pageSize: '20',
      };

      const result = listSpecificationsSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    test('ステータスフィルタをパース', () => {
      const validData = {
        status: SpecificationStatus.saved,
      };

      const result = listSpecificationsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('検索クエリをパース', () => {
      const validData = {
        search: 'テスト',
      };

      const result = listSpecificationsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    test('pageSizeが100を超える場合エラー', () => {
      const invalidData = {
        pageSize: '200',
      };

      const result = listSpecificationsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('formatZodErrors', () => {
    test('Zodエラーをフォーマット', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const result = schema.safeParse({
        email: 'invalid',
        password: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('email');
        expect(formatted).toHaveProperty('password');
        expect(formatted.email[0]).toContain('Invalid email');
        expect(formatted.password[0]).toContain('at least 8');
      }
    });

    test('ネストされたエラーをフォーマット', () => {
      const schema = z.object({
        deliverables: z.array(
          z.object({
            name: z.string().min(1),
            quantity: z.number().positive(),
          })
        ),
      });

      const result = schema.safeParse({
        deliverables: [
          {
            name: '',
            quantity: -1,
          },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('deliverables.0.name');
        expect(formatted).toHaveProperty('deliverables.0.quantity');
      }
    });
  });
});
