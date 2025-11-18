/**
 * スキーマフィールドのデータ型
 * Schema_Field.data_type に対応
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 */

/**
 * フィールドデータ型の列挙
 */
export enum FieldDataType {
  /**
   * テキスト（1行入力）
   */
  TEXT = 'text',

  /**
   * テキストエリア（複数行入力）
   */
  TEXTAREA = 'textarea',

  /**
   * ラジオボタン（単一選択）
   */
  RADIO = 'radio',

  /**
   * チェックボックス（複数選択）
   */
  CHECKBOX = 'checkbox',

  /**
   * 日付入力
   */
  DATE = 'date',

  /**
   * リスト（1:N の構造化データ）
   * 独立したサブエンティティ（Deliverable, BusinessTask等）を参照
   */
  LIST = 'list',
}

/**
 * FieldDataType型ガード
 * 文字列がFieldDataType型として有効かチェック
 */
export function isFieldDataType(value: string): value is FieldDataType {
  return Object.values(FieldDataType).includes(value as FieldDataType);
}

/**
 * FieldDataTypeの日本語表示名マッピング
 * UI表示用
 */
export const FieldDataTypeLabels: Record<FieldDataType, string> = {
  [FieldDataType.TEXT]: 'テキスト',
  [FieldDataType.TEXTAREA]: 'テキストエリア',
  [FieldDataType.RADIO]: 'ラジオボタン',
  [FieldDataType.CHECKBOX]: 'チェックボックス',
  [FieldDataType.DATE]: '日付',
  [FieldDataType.LIST]: 'リスト',
};
