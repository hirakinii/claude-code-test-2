/**
 * シードデータ検証テスト
 * Phase 1: デフォルトスキーマとロールの品質保証
 *
 * 検証内容:
 * - TC-DB-040: ロール投入確認
 * - TC-DB-041: デフォルトスキーマ投入確認
 * - TC-DB-042: カテゴリ投入確認
 * - TC-DB-043: フィールド投入確認
 * - TC-DB-044: 必須フィールド確認
 *
 * 参照: docs/database-test-specification.md
 */

import { prisma } from './setup';
import { RoleName, FieldDataType } from '@prisma/client';

describe('シードデータ検証', () => {
  describe('TC-DB-040: ロール投入確認', () => {
    it('2つのロールが投入されている', async () => {
      const roles = await prisma.role.findMany({
        orderBy: { role_id: 'asc' },
      });

      expect(roles).toHaveLength(2);

      // administrator ロール
      expect(roles[0].role_name).toBe(RoleName.administrator);

      // creator ロール
      expect(roles[1].role_name).toBe(RoleName.creator);
    });

    it('ロール名がユニークである', async () => {
      const roles = await prisma.role.findMany();
      const roleNames = roles.map((r) => r.role_name);
      const uniqueRoleNames = new Set(roleNames);

      expect(roleNames.length).toBe(uniqueRoleNames.size);
    });
  });

  describe('TC-DB-041: デフォルトスキーマ投入確認', () => {
    it('デフォルトスキーマが投入されている', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      expect(defaultSchema).not.toBeNull();
      expect(defaultSchema?.schema_name).toBe('デフォルトスキーマ');
      expect(defaultSchema?.is_default).toBe(true);
    });

    it('デフォルトスキーマが1つだけ存在する', async () => {
      const defaultSchemas = await prisma.schema.findMany({
        where: { is_default: true },
      });

      expect(defaultSchemas).toHaveLength(1);
    });
  });

  describe('TC-DB-042: カテゴリ投入確認', () => {
    it('5つのカテゴリが正しい順序で投入されている', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      expect(defaultSchema).not.toBeNull();

      const categories = await prisma.schemaCategory.findMany({
        where: { schema_id: defaultSchema!.schema_id },
        orderBy: { display_order: 'asc' },
      });

      expect(categories).toHaveLength(5);

      // カテゴリ名の確認
      expect(categories[0].category_name).toBe('基本情報');
      expect(categories[0].display_order).toBe(1);

      expect(categories[1].category_name).toBe('調達の種別とスコープ');
      expect(categories[1].display_order).toBe(2);

      expect(categories[2].category_name).toBe('納品情報');
      expect(categories[2].display_order).toBe(3);

      expect(categories[3].category_name).toBe('受注者等の要件');
      expect(categories[3].display_order).toBe(4);

      expect(categories[4].category_name).toBe('各業務の詳細仕様');
      expect(categories[4].display_order).toBe(5);
    });

    it('各カテゴリに説明文が設定されている', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
      });

      const categories = await prisma.schemaCategory.findMany({
        where: { schema_id: defaultSchema!.schema_id },
      });

      categories.forEach((category) => {
        expect(category.description).not.toBe('');
        expect(category.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TC-DB-043: フィールド投入確認', () => {
    it('10個以上のフィールドが投入されている', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
        include: {
          categories: {
            include: {
              fields: true,
            },
          },
        },
      });

      expect(defaultSchema).not.toBeNull();

      const totalFields = defaultSchema!.categories.reduce(
        (sum, category) => sum + category.fields.length,
        0
      );

      expect(totalFields).toBeGreaterThanOrEqual(10);
    });

    it('基本情報カテゴリに3つのフィールドがある', async () => {
      const category = await prisma.schemaCategory.findFirst({
        where: { category_name: '基本情報' },
        include: { fields: true },
      });

      expect(category).not.toBeNull();
      expect(category!.fields).toHaveLength(3);

      const fieldNames = category!.fields.map((f) => f.field_name);
      expect(fieldNames).toContain('件名');
      expect(fieldNames).toContain('背景');
      expect(fieldNames).toContain('調達の目的');
    });

    it('フィールドに適切なデータ型が設定されている', async () => {
      const fields = await prisma.schemaField.findMany();

      fields.forEach((field) => {
        // data_type が有効な FieldDataType 値であることを確認
        expect(Object.values(FieldDataType)).toContain(field.data_type);
      });
    });

    it('リスト型フィールドに list_target_entity が設定されている', async () => {
      const listFields = await prisma.schemaField.findMany({
        where: { data_type: FieldDataType.list },
      });

      // リスト型フィールドが存在する
      expect(listFields.length).toBeGreaterThan(0);

      // すべてのリスト型フィールドに list_target_entity が設定されている
      listFields.forEach((field) => {
        expect(field.list_target_entity).not.toBeNull();
        expect(field.list_target_entity).not.toBe('');

        // 有効なエンティティ名であることを確認
        const validEntities = [
          'Deliverable',
          'ContractorRequirement',
          'BasicBusinessRequirement',
          'BusinessTask',
        ];
        expect(validEntities).toContain(field.list_target_entity);
      });
    });
  });

  describe('TC-DB-044: 必須フィールド確認', () => {
    it('必須フィールドが7個以上存在する', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { is_default: true },
        include: {
          categories: {
            include: {
              fields: {
                where: { is_required: true },
              },
            },
          },
        },
      });

      expect(defaultSchema).not.toBeNull();

      const requiredFields = defaultSchema!.categories.flatMap(
        (category) => category.fields
      );

      expect(requiredFields.length).toBeGreaterThanOrEqual(7);
    });

    it('件名フィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '件名' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.text);
    });

    it('背景フィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '背景' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.textarea);
    });

    it('調達の目的フィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '調達の目的' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.textarea);
    });

    it('納品期限フィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '納品期限' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.date);
    });

    it('納品物フィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '納品物' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.list);
      expect(field!.list_target_entity).toBe('Deliverable');
    });

    it('業務タスクフィールドが必須である', async () => {
      const field = await prisma.schemaField.findFirst({
        where: { field_name: '業務タスク' },
      });

      expect(field).not.toBeNull();
      expect(field!.is_required).toBe(true);
      expect(field!.data_type).toBe(FieldDataType.list);
      expect(field!.list_target_entity).toBe('BusinessTask');
    });
  });

  describe('フィールドオプション検証', () => {
    it('ラジオボタンフィールドに選択肢が設定されている', async () => {
      const radioFields = await prisma.schemaField.findMany({
        where: { data_type: FieldDataType.radio },
      });

      radioFields.forEach((field) => {
        expect(field.options).not.toBeNull();

        const options = field.options as { choices?: Array<{ value: string; label: string }> };
        expect(options.choices).toBeDefined();
        expect(options.choices!.length).toBeGreaterThan(0);

        // 各選択肢に value と label がある
        options.choices!.forEach((choice) => {
          expect(choice.value).toBeDefined();
          expect(choice.label).toBeDefined();
        });
      });
    });

    it('チェックボックスフィールドに選択肢が設定されている', async () => {
      const checkboxFields = await prisma.schemaField.findMany({
        where: { data_type: FieldDataType.checkbox },
      });

      checkboxFields.forEach((field) => {
        expect(field.options).not.toBeNull();

        const options = field.options as { choices?: Array<{ value: string; label: string }> };
        expect(options.choices).toBeDefined();
        expect(options.choices!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('表示順序検証', () => {
    it('各カテゴリ内のフィールドに display_order が設定されている', async () => {
      const categories = await prisma.schemaCategory.findMany({
        include: {
          fields: {
            orderBy: { display_order: 'asc' },
          },
        },
      });

      categories.forEach((category) => {
        const orders = category.fields.map((f) => f.display_order);

        // display_order が連番であることを確認
        orders.forEach((order, index) => {
          expect(order).toBe(index + 1);
        });
      });
    });
  });
});
