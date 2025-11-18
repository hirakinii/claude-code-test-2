/**
 * 外部キー制約検証テスト
 * Phase 1: データ整合性の品質保証
 *
 * 検証内容:
 * - TC-DB-030: CASCADE 削除動作確認
 * - TC-DB-031: RESTRICT 削除防止確認
 * - TC-DB-050: UNIQUE制約確認
 * - TC-DB-051: NOT NULL制約確認
 *
 * 参照: docs/database-test-specification.md
 */

import { prisma } from './setup';
import { SpecificationStatus } from '@prisma/client';

describe('外部キー制約検証', () => {
  describe('TC-DB-030: CASCADE 削除動作確認', () => {
    it('ユーザー削除時に関連仕様書が CASCADE 削除される', async () => {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          email: 'test-cascade-user@example.com',
          password_hash: 'test-hash',
          full_name: 'Test Cascade User',
        },
      });

      // デフォルトスキーマ取得
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      expect(defaultSchema).not.toBeNull();

      // テスト仕様書作成
      const testSpec = await prisma.specification.create({
        data: {
          author_user_id: testUser.user_id,
          schema_id: defaultSchema!.schema_id,
          title: 'Test Specification for CASCADE',
          status: SpecificationStatus.editing,
          version: '1.0',
        },
      });

      // 仕様書が作成されたことを確認
      const specBeforeDelete = await prisma.specification.findUnique({
        where: { specification_id: testSpec.specification_id },
      });
      expect(specBeforeDelete).not.toBeNull();

      // ユーザー削除
      await prisma.user.delete({
        where: { user_id: testUser.user_id },
      });

      // 仕様書が CASCADE 削除されたことを確認
      const specAfterDelete = await prisma.specification.findUnique({
        where: { specification_id: testSpec.specification_id },
      });
      expect(specAfterDelete).toBeNull();
    });

    it('仕様書削除時にサブエンティティが CASCADE 削除される', async () => {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          email: 'test-cascade-spec@example.com',
          password_hash: 'test-hash',
          full_name: 'Test Cascade Spec User',
        },
      });

      // デフォルトスキーマ取得
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      // テスト仕様書作成
      const testSpec = await prisma.specification.create({
        data: {
          author_user_id: testUser.user_id,
          schema_id: defaultSchema!.schema_id,
          title: 'Test Specification with Deliverables',
          status: SpecificationStatus.editing,
          version: '1.0',
        },
      });

      // 納品物を追加
      const deliverable = await prisma.deliverable.create({
        data: {
          specification_id: testSpec.specification_id,
          name: 'Test Deliverable',
          quantity: 1,
          description: 'Test Description',
        },
      });

      // 納品物が作成されたことを確認
      const deliverableBeforeDelete = await prisma.deliverable.findUnique({
        where: { deliverable_id: deliverable.deliverable_id },
      });
      expect(deliverableBeforeDelete).not.toBeNull();

      // 仕様書削除
      await prisma.specification.delete({
        where: { specification_id: testSpec.specification_id },
      });

      // 納品物が CASCADE 削除されたことを確認
      const deliverableAfterDelete = await prisma.deliverable.findUnique({
        where: { deliverable_id: deliverable.deliverable_id },
      });
      expect(deliverableAfterDelete).toBeNull();

      // クリーンアップ
      await prisma.user.delete({ where: { user_id: testUser.user_id } });
    });

    it('スキーマカテゴリ削除時にフィールドが CASCADE 削除される', async () => {
      // テストスキーマ作成
      const testSchema = await prisma.schema.create({
        data: {
          schema_name: 'Test Schema for CASCADE',
          is_default: false,
        },
      });

      // テストカテゴリ作成
      const testCategory = await prisma.schemaCategory.create({
        data: {
          schema_id: testSchema.schema_id,
          category_name: 'Test Category',
          description: 'Test Description',
          display_order: 1,
        },
      });

      // テストフィールド作成
      const testField = await prisma.schemaField.create({
        data: {
          category_id: testCategory.category_id,
          field_name: 'Test Field',
          data_type: 'text',
          is_required: false,
          display_order: 1,
        },
      });

      // フィールドが作成されたことを確認
      const fieldBeforeDelete = await prisma.schemaField.findUnique({
        where: { field_id: testField.field_id },
      });
      expect(fieldBeforeDelete).not.toBeNull();

      // カテゴリ削除
      await prisma.schemaCategory.delete({
        where: { category_id: testCategory.category_id },
      });

      // フィールドが CASCADE 削除されたことを確認
      const fieldAfterDelete = await prisma.schemaField.findUnique({
        where: { field_id: testField.field_id },
      });
      expect(fieldAfterDelete).toBeNull();

      // クリーンアップ
      await prisma.schema.delete({ where: { schema_id: testSchema.schema_id } });
    });
  });

  describe('TC-DB-031: RESTRICT 削除防止確認', () => {
    it('関連仕様書があるスキーマは削除できない', async () => {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          email: 'test-restrict@example.com',
          password_hash: 'test-hash',
          full_name: 'Test Restrict User',
        },
      });

      // テストスキーマ作成
      const testSchema = await prisma.schema.create({
        data: {
          schema_name: 'Test Schema for RESTRICT',
          is_default: false,
        },
      });

      // テスト仕様書作成（スキーマに紐づく）
      await prisma.specification.create({
        data: {
          author_user_id: testUser.user_id,
          schema_id: testSchema.schema_id,
          title: 'Test Specification for RESTRICT',
          status: SpecificationStatus.editing,
          version: '1.0',
        },
      });

      // スキーマ削除を試みる → エラーになるはず
      await expect(
        prisma.schema.delete({
          where: { schema_id: testSchema.schema_id },
        })
      ).rejects.toThrow();

      // スキーマが削除されていないことを確認
      const schemaAfterDelete = await prisma.schema.findUnique({
        where: { schema_id: testSchema.schema_id },
      });
      expect(schemaAfterDelete).not.toBeNull();

      // クリーンアップ（仕様書を先に削除してからスキーマを削除）
      await prisma.user.delete({ where: { user_id: testUser.user_id } });
      await prisma.schema.delete({ where: { schema_id: testSchema.schema_id } });
    });

    it('関連SpecificationContentがあるSchemaFieldは削除できない', async () => {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          email: 'test-restrict-field@example.com',
          password_hash: 'test-hash',
          full_name: 'Test Restrict Field User',
        },
      });

      // デフォルトスキーマ取得
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
        include: {
          categories: {
            include: {
              fields: true,
            },
            take: 1,
          },
        },
      });

      expect(defaultSchema).not.toBeNull();
      expect(defaultSchema!.categories.length).toBeGreaterThan(0);
      expect(defaultSchema!.categories[0].fields.length).toBeGreaterThan(0);

      const testField = defaultSchema!.categories[0].fields[0];

      // テスト仕様書作成
      const testSpec = await prisma.specification.create({
        data: {
          author_user_id: testUser.user_id,
          schema_id: defaultSchema!.schema_id,
          title: 'Test Specification for Field RESTRICT',
          status: SpecificationStatus.editing,
          version: '1.0',
        },
      });

      // SpecificationContent 作成
      await prisma.specificationContent.create({
        data: {
          specification_id: testSpec.specification_id,
          field_id: testField.field_id,
          value: 'Test Value',
        },
      });

      // フィールド削除を試みる → エラーになるはず
      await expect(
        prisma.schemaField.delete({
          where: { field_id: testField.field_id },
        })
      ).rejects.toThrow();

      // フィールドが削除されていないことを確認
      const fieldAfterDelete = await prisma.schemaField.findUnique({
        where: { field_id: testField.field_id },
      });
      expect(fieldAfterDelete).not.toBeNull();

      // クリーンアップ
      await prisma.user.delete({ where: { user_id: testUser.user_id } });
    });
  });

  describe('TC-DB-050: UNIQUE制約確認', () => {
    it('同じメールアドレスのユーザーは登録できない', async () => {
      const testEmail = 'duplicate-test@example.com';

      // 1人目のユーザー作成
      const user1 = await prisma.user.create({
        data: {
          email: testEmail,
          password_hash: 'test-hash-1',
          full_name: 'User 1',
        },
      });

      // 2人目のユーザー作成を試みる → エラーになるはず
      await expect(
        prisma.user.create({
          data: {
            email: testEmail,
            password_hash: 'test-hash-2',
            full_name: 'User 2',
          },
        })
      ).rejects.toThrow(/unique/i);

      // クリーンアップ
      await prisma.user.delete({ where: { user_id: user1.user_id } });
    });

    it('同じロール名は登録できない', async () => {
      // 既存のロール名を取得
      const existingRole = await prisma.role.findFirst();
      expect(existingRole).not.toBeNull();

      // 同じロール名で作成を試みる → エラーになるはず
      await expect(
        prisma.role.create({
          data: {
            role_name: existingRole!.role_name,
          },
        })
      ).rejects.toThrow(/unique/i);
    });
  });

  describe('TC-DB-051: NOT NULL制約確認', () => {
    it('author_user_id が NULL の仕様書は作成できない', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      // author_user_id を NULL にして仕様書作成を試みる
      await expect(
        prisma.$executeRaw`
          INSERT INTO specifications (specification_id, author_user_id, schema_id, status, version)
          VALUES (gen_random_uuid(), NULL, ${defaultSchema!.schema_id}::uuid, 'editing', '1.0')
        `
      ).rejects.toThrow(/not-null/i);
    });

    it('email が NULL のユーザーは作成できない', async () => {
      await expect(
        prisma.$executeRaw`
          INSERT INTO users (user_id, email, password_hash, full_name)
          VALUES (gen_random_uuid(), NULL, 'hash', 'Test User')
        `
      ).rejects.toThrow(/not-null/i);
    });

    it('is_required が NULL のフィールドは作成できない', async () => {
      const category = await prisma.schemaCategory.findFirst();

      await expect(
        prisma.$executeRaw`
          INSERT INTO schema_fields (field_id, category_id, field_name, data_type, is_required, display_order)
          VALUES (gen_random_uuid(), ${category!.category_id}::uuid, 'Test Field', 'text', NULL, 1)
        `
      ).rejects.toThrow(/not-null/i);
    });
  });

  describe('複合主キー制約確認', () => {
    it('UserRole の複合主キー制約が機能する', async () => {
      // テストユーザー作成
      const testUser = await prisma.user.create({
        data: {
          email: 'test-composite-key@example.com',
          password_hash: 'test-hash',
          full_name: 'Test Composite Key User',
        },
      });

      // ロール取得
      const role = await prisma.role.findFirst();
      expect(role).not.toBeNull();

      // UserRole 作成
      await prisma.userRole.create({
        data: {
          user_id: testUser.user_id,
          role_id: role!.role_id,
        },
      });

      // 同じ組み合わせで再度作成を試みる → エラーになるはず
      await expect(
        prisma.userRole.create({
          data: {
            user_id: testUser.user_id,
            role_id: role!.role_id,
          },
        })
      ).rejects.toThrow(/unique/i);

      // クリーンアップ
      await prisma.user.delete({ where: { user_id: testUser.user_id } });
    });
  });
});
