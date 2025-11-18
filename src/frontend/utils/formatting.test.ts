/**
 * フォーマットユーティリティのユニットテスト
 */
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatNumber,
} from './formatting';

describe('formatting utils', () => {
  describe('formatDate', () => {
    test('Dateオブジェクトを日本語形式でフォーマット', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/15/);
    });

    test('文字列の日付を日本語形式でフォーマット', () => {
      const formatted = formatDate('2024-01-15');

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/15/);
    });
  });

  describe('formatDateTime', () => {
    test('Dateオブジェクトを日時形式でフォーマット', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDateTime(date);

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/10/);
      expect(formatted).toMatch(/30/);
    });

    test('文字列の日時を日時形式でフォーマット', () => {
      const formatted = formatDateTime('2024-01-15T10:30:00');

      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/01/);
      expect(formatted).toMatch(/15/);
    });
  });

  describe('formatFileSize', () => {
    test('0バイトを正しくフォーマット', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    test('バイト単位を正しくフォーマット', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    test('キロバイト単位を正しくフォーマット', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5KB
    });

    test('メガバイト単位を正しくフォーマット', () => {
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1MB
      expect(formatFileSize(2621440)).toBe('2.5 MB'); // 2.5MB
    });

    test('ギガバイト単位を正しくフォーマット', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB'); // 1GB
      expect(formatFileSize(2147483648)).toBe('2 GB'); // 2GB
    });

    test('小数点以下を適切に丸める', () => {
      const result = formatFileSize(1234567);
      expect(result).toMatch(/MB/);
      // 小数点以下2桁まで表示
      expect(result.split(' ')[0].split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('formatNumber', () => {
    test('整数を3桁区切りでフォーマット', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    test('小さい数値をそのまま表示', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });

    test('負の数値を正しくフォーマット', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(-1000000)).toBe('-1,000,000');
    });

    test('小数を正しくフォーマット', () => {
      const result = formatNumber(1000.5);
      expect(result).toMatch(/1,000/);
    });

    test('0を正しくフォーマット', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });
});
