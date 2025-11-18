/**
 * スキーマ（メタモデル）エンティティ
 *
 * メタモデル・アーキテクチャの中核
 * 仕様書管理者が「スキーマ設定」画面で管理する
 * ウィザードの構造（ステップ、入力項目）を動的に定義
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 * - 表2: スキーマ（メタモデル）エンティティ
 */

import { UUID, Timestamp } from '../common/database-types';
import { AuditableEntity } from '../common/base-entity';
import { FieldDataType } from '../enums/field-data-type';

/**
 * Schemaエンティティ
 * テンプレート全体を定義するマスターエンティティ
 *
 * 例: 「デフォルトスキーマ」
 */
export interface Schema extends AuditableEntity {
  /**
   * スキーマID（主キー）
   */
  schema_id: UUID;

  /**
   * スキーマ名
   * 例: "デフォルトスキーマ", "簡易版スキーマ"
   */
  schema_name: string;

  /**
   * デフォルトスキーマフラグ
   * true の場合、新規仕様書作成時にこのスキーマを使用
   */
  is_default: boolean;

  /**
   * 作成日時（AuditableEntity から継承）
   */
  // created_at: Timestamp;

  /**
   * 最終更新日時（AuditableEntity から継承）
   */
  // updated_at: Timestamp;
}

/**
 * SchemaCategoryエンティティ
 * ウィザードの各ステップを定義
 *
 * 例: "ステップ 1 基本情報", "ステップ 2 調達の種別とスコープ"
 */
export interface SchemaCategory {
  /**
   * カテゴリID（主キー）
   */
  category_id: UUID;

  /**
   * 所属スキーマID（外部キー）
   */
  schema_id: UUID;

  /**
   * カテゴリ名
   * 例: "基本情報", "調達の種別とスコープ"
   */
  category_name: string;

  /**
   * カテゴリの説明
   */
  description: string;

  /**
   * 表示順序
   * ウィザードのステップ順を制御（昇順ソート）
   * 例: 1, 2, 3, ...
   */
  display_order: number;
}

/**
 * フィールドオプション（JSON型）
 * Schema_Field.options に格納
 *
 * チェックボックス/ラジオボタンの選択肢を定義
 */
export interface FieldOptions {
  /**
   * 選択肢のリスト
   * 例: [{ value: "consulting", label: "コンサルティング" }]
   */
  choices?: Array<{
    /**
     * 選択肢の値（内部値）
     */
    value: string;

    /**
     * 選択肢の表示名
     */
    label: string;
  }>;

  /**
   * 将来的な拡張用
   * 任意の追加プロパティを許容
   */
  [key: string]: unknown;
}

/**
 * SchemaFieldエンティティ
 * 各カテゴリ内の個別の入力項目を定義
 *
 * 例: "調達の目的", "調達のスコープ", "納品物"
 */
export interface SchemaField {
  /**
   * フィールドID（主キー）
   */
  field_id: UUID;

  /**
   * 所属カテゴリID（外部キー）
   */
  category_id: UUID;

  /**
   * フィールド名
   * 例: "調達の目的", "件名", "納品物"
   */
  field_name: string;

  /**
   * データ型
   * テキスト、テキストエリア、ラジオボタン、チェックボックス、日付、リスト
   */
  data_type: FieldDataType;

  /**
   * 必須フラグ
   * true の場合、未入力時にバリデーションエラー
   */
  is_required: boolean;

  /**
   * フィールドオプション（JSON型）
   * チェックボックス/ラジオボタンの選択肢を格納
   *
   * data_type が CHECKBOX または RADIO の場合に使用
   */
  options: FieldOptions | null;

  /**
   * プレースホルダーテキスト
   * 入力フィールドに表示するヒント
   * 例: "調達の目的を入力してください"
   */
  placeholder_text: string | null;

  /**
   * リスト参照先エンティティ名
   * data_type が LIST の場合に使用
   *
   * 例:
   * - "Deliverable" → 納品物リスト
   * - "BusinessTask" → 業務タスクリスト
   * - "ContractorRequirement" → 受注者要件リスト
   * - "BasicBusinessRequirement" → 業務基本要件リスト
   *
   * このフィールドは、UI ロジックに対する「シグナル」として機能
   * フロントエンドは、この値を読み取って適切なリスト編集コンポーネントを表示
   */
  list_target_entity: string | null;

  /**
   * 表示順序
   * カテゴリ内の項目順を制御（昇順ソート）
   * 例: 1, 2, 3, ...
   */
  display_order: number;
}

/**
 * カテゴリとそのフィールドを含む拡張型
 * JOIN 結果用
 */
export interface SchemaCategoryWithFields extends SchemaCategory {
  /**
   * カテゴリに属するフィールドのリスト
   * display_order でソート済み
   */
  fields: SchemaField[];
}

/**
 * スキーマ全体の構造を含む拡張型
 * JOIN 結果用（ウィザード画面構築に使用）
 */
export interface SchemaWithStructure extends Schema {
  /**
   * スキーマに属するカテゴリのリスト
   * display_order でソート済み
   * 各カテゴリは fields を含む
   */
  categories: SchemaCategoryWithFields[];
}

/**
 * フィールドがリスト型かチェック
 */
export function isListField(field: SchemaField): boolean {
  return field.data_type === FieldDataType.LIST;
}

/**
 * フィールドが選択肢を持つ型かチェック
 */
export function hasChoices(field: SchemaField): boolean {
  return (
    field.data_type === FieldDataType.CHECKBOX ||
    field.data_type === FieldDataType.RADIO
  );
}

/**
 * フィールドの選択肢を取得（型安全）
 */
export function getFieldChoices(field: SchemaField): Array<{ value: string; label: string }> {
  if (!hasChoices(field) || !field.options?.choices) {
    return [];
  }
  return field.options.choices;
}
