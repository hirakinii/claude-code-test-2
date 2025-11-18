/**
 * バリデーションユーティリティのユニットテスト
 *
 * 参照: docs/frontend-test-specification.md セクション3.3.1
 */
import {
  validateRequiredFields,
  validateEmail,
  validateUrl,
  validateDate,
} from './validation';
import type { SchemaField } from '@common/entities';
import { FieldDataType } from '@common/enums';

describe('validation utils', () => {
  describe('validateRequiredFields', () => {
    const mockFields: SchemaField[] = [
      {
        fieldId: 'field1',
        label: '件名',
        isRequired: true,
        dataType: FieldDataType.TEXT,
        displayOrder: 1,
        placeholderText: '',
      },
      {
        fieldId: 'field2',
        label: '目的',
        isRequired: true,
        dataType: FieldDataType.TEXTAREA,
        displayOrder: 2,
        placeholderText: '',
      },
      {
        fieldId: 'field3',
        label: '備考',
        isRequired: false,
        dataType: FieldDataType.TEXTAREA,
        displayOrder: 3,
        placeholderText: '',
      },
    ];

    test('すべての必須項目が入力されている場合、validationが成功する', () => {
      const data = {
        field1: 'テスト件名',
        field2: 'テスト目的',
        field3: '',
      };

      const result = validateRequiredFields(mockFields, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('必須項目が未入力の場合、エラーが返される', () => {
      const data = {
        field1: '',
        field2: 'テスト目的',
      };

      const result = validateRequiredFields(mockFields, data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('field1');
      expect(result.errors.field1).toContain('件名は必須項目です');
    });

    test('オプション項目は未入力でもエラーにならない', () => {
      const data = {
        field1: 'テスト件名',
        field2: 'テスト目的',
        // field3 (オプション) は未入力
      };

      const result = validateRequiredFields(mockFields, data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('空の配列は未入力として扱われる', () => {
      const fieldsWithArray: SchemaField[] = [
        {
          fieldId: 'field4',
          label: '選択肢',
          isRequired: true,
          dataType: FieldDataType.MULTISELECT,
          displayOrder: 1,
          placeholderText: '',
        },
      ];

      const data = {
        field4: [],
      };

      const result = validateRequiredFields(fieldsWithArray, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.field4).toContain('選択肢は少なくとも1つ入力してください');
    });

    test('nullやundefinedは未入力として扱われる', () => {
      const data = {
        field1: null,
        field2: undefined,
      };

      const result = validateRequiredFields(mockFields, data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('field1');
      expect(result.errors).toHaveProperty('field2');
    });
  });

  describe('validateEmail', () => {
    test('正しいメールアドレス形式を検証', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.jp')).toBe(true);
      expect(validateEmail('user_name@example.com')).toBe(true);
    });

    test('無効なメールアドレス形式を拒否', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    test('正しいURL形式を検証', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://example.com/path?query=value')).toBe(true);
      expect(validateUrl('ftp://example.com')).toBe(true);
    });

    test('無効なURL形式を拒否', () => {
      expect(validateUrl('invalid')).toBe(false);
      expect(validateUrl('htp://example.com')).toBe(false);
      expect(validateUrl('//example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validateDate', () => {
    test('正しい日付形式（YYYY-MM-DD）を検証', () => {
      expect(validateDate('2024-01-01')).toBe(true);
      expect(validateDate('2024-12-31')).toBe(true);
      expect(validateDate('2024-06-15')).toBe(true);
    });

    test('無効な日付形式を拒否', () => {
      expect(validateDate('2024/01/01')).toBe(false); // スラッシュ区切り
      expect(validateDate('01-01-2024')).toBe(false); // 順序が異なる
      expect(validateDate('2024-1-1')).toBe(false); // ゼロパディングなし
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('')).toBe(false);
    });

    test('存在しない日付を拒否', () => {
      expect(validateDate('2024-02-30')).toBe(false); // 2月30日は存在しない
      expect(validateDate('2024-13-01')).toBe(false); // 13月は存在しない
    });

    test('うるう年の日付を正しく検証', () => {
      expect(validateDate('2024-02-29')).toBe(true); // 2024年はうるう年
      expect(validateDate('2023-02-29')).toBe(false); // 2023年はうるう年ではない
    });
  });
});
