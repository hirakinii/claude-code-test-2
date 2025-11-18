/**
 * スキーマ検証テスト
 * Phase 1: データベース層の品質保証
 *
 * 検証内容:
 * - TC-DB-001: 12テーブルの存在確認
 * - TC-DB-010: 3つのEnum型の存在確認
 *
 * 参照: docs/database-test-specification.md
 */

import { prisma } from './setup';

describe('データベーススキーマ検証', () => {
  describe('TC-DB-001: テーブル存在確認', () => {
    it('12エンティティのテーブルがすべて存在する', async () => {
      const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      const tableNames = result.map((row) => row.table_name);

      // 期待する12テーブル
      const expectedTables = [
        'basic_business_requirements',
        'business_tasks',
        'contractor_requirements',
        'deliverables',
        'roles',
        'schema_categories',
        'schema_fields',
        'schemas',
        'specification_content',
        'specifications',
        'user_roles',
        'users',
      ];

      // すべてのテーブルが存在するか確認
      expectedTables.forEach((tableName) => {
        expect(tableNames).toContain(tableName);
      });

      // 余分なテーブルがないか確認（Prismaの管理テーブルは除く）
      const unexpectedTables = tableNames.filter(
        (name) => !expectedTables.includes(name) && name !== '_prisma_migrations'
      );

      expect(unexpectedTables).toEqual([]);
      expect(tableNames.filter(name => name !== '_prisma_migrations').length).toBe(12);
    });
  });

  describe('TC-DB-010: Enum型存在確認', () => {
    it('3つのEnum型が存在する', async () => {
      const result = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname
        FROM pg_type
        WHERE typtype = 'e'
        ORDER BY typname;
      `;

      const enumNames = result.map((row) => row.typname);

      // 期待する3つのEnum型
      expect(enumNames).toContain('FieldDataType');
      expect(enumNames).toContain('RoleName');
      expect(enumNames).toContain('SpecificationStatus');
      expect(enumNames.length).toBe(3);
    });

    it('FieldDataType Enumが正しい値を持つ', async () => {
      const result = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
        SELECT enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'FieldDataType'
        ORDER BY enumsortorder;
      `;

      const values = result.map((row) => row.enumlabel);

      // 期待する6つの値
      expect(values).toEqual(['text', 'textarea', 'radio', 'checkbox', 'date', 'list']);
    });

    it('SpecificationStatus Enumが正しい値を持つ', async () => {
      const result = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
        SELECT enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'SpecificationStatus'
        ORDER BY enumsortorder;
      `;

      const values = result.map((row) => row.enumlabel);

      expect(values).toEqual(['editing', 'reviewing', 'saved']);
    });

    it('RoleName Enumが正しい値を持つ', async () => {
      const result = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
        SELECT enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'RoleName'
        ORDER BY enumsortorder;
      `;

      const values = result.map((row) => row.enumlabel);

      expect(values).toEqual(['administrator', 'creator']);
    });
  });

  describe('主要テーブル構造検証', () => {
    it('users テーブルが必要なカラムを持つ', async () => {
      const result = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string; is_nullable: string }>
      >`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;

      const columns = result.map((row) => row.column_name);

      // 必須カラムの存在確認
      expect(columns).toContain('user_id');
      expect(columns).toContain('email');
      expect(columns).toContain('password_hash');
      expect(columns).toContain('full_name');
      expect(columns).toContain('created_at');

      // user_id が uuid 型であることを確認
      const userIdColumn = result.find((row) => row.column_name === 'user_id');
      expect(userIdColumn?.data_type).toBe('uuid');
      expect(userIdColumn?.is_nullable).toBe('NO');

      // email が NOT NULL であることを確認
      const emailColumn = result.find((row) => row.column_name === 'email');
      expect(emailColumn?.is_nullable).toBe('NO');
    });

    it('specifications テーブルが必要なカラムを持つ', async () => {
      const result = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'specifications'
        ORDER BY ordinal_position;
      `;

      const columns = result.map((row) => row.column_name);

      // 必須カラムの存在確認
      expect(columns).toContain('specification_id');
      expect(columns).toContain('author_user_id');
      expect(columns).toContain('schema_id');
      expect(columns).toContain('title');
      expect(columns).toContain('status');
      expect(columns).toContain('version');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');

      // status が SpecificationStatus 型であることを確認
      const statusColumn = result.find((row) => row.column_name === 'status');
      expect(statusColumn?.data_type).toBe('USER-DEFINED'); // Enum型はUSER-DEFINEDと表示される
    });

    it('schema_fields テーブルが必要なカラムを持つ', async () => {
      const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'schema_fields'
        ORDER BY ordinal_position;
      `;

      const columns = result.map((row) => row.column_name);

      // 必須カラムの存在確認
      expect(columns).toContain('field_id');
      expect(columns).toContain('category_id');
      expect(columns).toContain('field_name');
      expect(columns).toContain('data_type');
      expect(columns).toContain('is_required');
      expect(columns).toContain('options');
      expect(columns).toContain('placeholder_text');
      expect(columns).toContain('list_target_entity');
      expect(columns).toContain('display_order');
    });
  });

  describe('インデックス検証', () => {
    it('パフォーマンス最適化インデックスが存在する', async () => {
      const result = await prisma.$queryRaw<
        Array<{ tablename: string; indexname: string }>
      >`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN (
            'specifications',
            'schema_categories',
            'schema_fields',
            'specification_content'
          )
        ORDER BY tablename, indexname;
      `;

      const indexNames = result.map((row) => row.indexname);

      // 重要なインデックスの存在確認
      expect(indexNames).toContain('idx_specifications_author_updated');
      expect(indexNames).toContain('idx_specifications_status');
      expect(indexNames).toContain('idx_schema_categories_schema_order');
      expect(indexNames).toContain('idx_schema_fields_category_order');
      expect(indexNames).toContain('idx_specification_content_spec_field');
    });
  });
});
