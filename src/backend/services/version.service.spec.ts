/**
 * バージョン管理エンジンのユニットテスト
 *
 * 参照: docs/backend-api-test-specification.md セクション2.3
 */
import { SpecificationStatus } from '@prisma/client';
import {
  checkRequiredFields,
  calculateNewVersion,
  calculateCompletionRate,
} from './version.service';
import { prisma } from '../utils/prisma.js';

// Prismaのモック
jest.mock('../utils/prisma.js', () => ({
  prisma: {
    schemaField: {
      findMany: jest.fn(),
    },
  },
}));

describe('version.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRequiredFields', () => {
    const mockRequiredFields = [
      {
        field_id: 'field1',
        field_name: '件名',
        is_required: true,
        data_type: 'text',
      },
      {
        field_id: 'field2',
        field_name: '目的',
        is_required: true,
        data_type: 'textarea',
      },
      {
        field_id: 'field3',
        field_name: '納品物',
        is_required: true,
        data_type: 'list',
      },
    ] as any[];

    test('すべての必須項目が入力済みの場合、isCompleteがtrueを返す', () => {
      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', 'テスト目的'],
        ['field3', ['納品物1', '納品物2']],
      ]);

      const result = checkRequiredFields(mockRequiredFields, contentMap);

      expect(result.isComplete).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    test('必須項目が未入力の場合、isCompleteがfalseでmissingFieldsを返す', () => {
      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', ''], // 空文字列
        // field3 が存在しない
      ]);

      const result = checkRequiredFields(mockRequiredFields, contentMap);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('目的');
      expect(result.missingFields).toContain('納品物');
    });

    test('空の配列は未入力として扱われる', () => {
      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', 'テスト目的'],
        ['field3', []], // 空配列
      ]);

      const result = checkRequiredFields(mockRequiredFields, contentMap);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('納品物');
    });

    test('nullやundefinedは未入力として扱われる', () => {
      const contentMap = new Map<string, unknown>([
        ['field1', null],
        ['field2', undefined],
        ['field3', ['納品物1']],
      ]);

      const result = checkRequiredFields(mockRequiredFields, contentMap);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('件名');
      expect(result.missingFields).toContain('目的');
    });
  });

  describe('calculateNewVersion', () => {
    test('必須項目がすべて入力済みの場合、メジャーバージョンを更新', () => {
      const result = calculateNewVersion('1.0', true);

      expect(result.version).toBe('2.0');
      expect(result.status).toBe(SpecificationStatus.saved);
    });

    test('必須項目に未入力がある場合、マイナーバージョンを更新', () => {
      const result = calculateNewVersion('1.0', false);

      expect(result.version).toBe('1.1');
      expect(result.status).toBe(SpecificationStatus.editing);
    });

    test('マイナーバージョンが既に存在する場合、さらにインクリメント', () => {
      const result = calculateNewVersion('1.5', false);

      expect(result.version).toBe('1.6');
      expect(result.status).toBe(SpecificationStatus.editing);
    });

    test('メジャーバージョン更新時、マイナーバージョンは0にリセット', () => {
      const result = calculateNewVersion('1.5', true);

      expect(result.version).toBe('2.0');
      expect(result.status).toBe(SpecificationStatus.saved);
    });

    test('バージョン10.9からメジャー更新すると11.0になる', () => {
      const result = calculateNewVersion('10.9', true);

      expect(result.version).toBe('11.0');
      expect(result.status).toBe(SpecificationStatus.saved);
    });
  });

  describe('calculateCompletionRate', () => {
    const mockSchemaId = '123e4567-e89b-12d3-a456-426614174000';

    test('全フィールドが入力済みの場合、100%を返す', async () => {
      const mockFields = [
        { field_id: 'field1', field_name: '件名' },
        { field_id: 'field2', field_name: '目的' },
        { field_id: 'field3', field_name: '納品物' },
      ] as any[];

      (prisma.schemaField.findMany as jest.Mock).mockResolvedValue(mockFields);

      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', 'テスト目的'],
        ['field3', ['納品物1']],
      ]);

      const result = await calculateCompletionRate(mockSchemaId, contentMap);

      expect(result.completionRate).toBe(100);
      expect(result.totalFields).toBe(3);
      expect(result.completedFields).toBe(3);
    });

    test('一部のフィールドが入力済みの場合、適切な割合を返す', async () => {
      const mockFields = [
        { field_id: 'field1', field_name: '件名' },
        { field_id: 'field2', field_name: '目的' },
        { field_id: 'field3', field_name: '納品物' },
        { field_id: 'field4', field_name: '備考' },
      ] as any[];

      (prisma.schemaField.findMany as jest.Mock).mockResolvedValue(mockFields);

      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', 'テスト目的'],
        // field3, field4 は未入力
      ]);

      const result = await calculateCompletionRate(mockSchemaId, contentMap);

      expect(result.completionRate).toBe(50); // 2/4 = 50%
      expect(result.totalFields).toBe(4);
      expect(result.completedFields).toBe(2);
    });

    test('フィールドが存在しない場合、0%を返す', async () => {
      (prisma.schemaField.findMany as jest.Mock).mockResolvedValue([]);

      const contentMap = new Map<string, unknown>();

      const result = await calculateCompletionRate(mockSchemaId, contentMap);

      expect(result.completionRate).toBe(0);
      expect(result.totalFields).toBe(0);
      expect(result.completedFields).toBe(0);
    });

    test('空の配列は未入力として扱われる', async () => {
      const mockFields = [
        { field_id: 'field1', field_name: '件名' },
        { field_id: 'field2', field_name: '納品物' },
      ] as any[];

      (prisma.schemaField.findMany as jest.Mock).mockResolvedValue(mockFields);

      const contentMap = new Map<string, unknown>([
        ['field1', 'テスト件名'],
        ['field2', []], // 空配列
      ]);

      const result = await calculateCompletionRate(mockSchemaId, contentMap);

      expect(result.completionRate).toBe(50); // 1/2 = 50%
      expect(result.completedFields).toBe(1);
    });
  });
});
