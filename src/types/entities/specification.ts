/**
 * 仕様書（データ）エンティティ
 *
 * 仕様書作成者がウィザードを通じて入力する個々の「値」を格納
 * EAV (Entity-Attribute-Value) パターンを採用
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 * - 表3: 仕様書（データ）エンティティ
 */

import { UUID, Version, Timestamp } from '../common/database-types';
import { AuditableEntity } from '../common/base-entity';
import { SpecificationStatus } from '../enums/specification-status';

/**
 * Specificationエンティティ
 * すべてのデータインスタンス（作成者による入力内容）を集約する「マスター」エンティティ
 */
export interface Specification extends AuditableEntity {
  /**
   * 仕様書ID（主キー）
   * 新規作成時に採番
   */
  specification_id: UUID;

  /**
   * 作成者ユーザーID（外部キー）
   * User エンティティへの参照
   * "自分が作成・管理している" を実現
   */
  author_user_id: UUID;

  /**
   * スキーマID（外部キー）
   * Schema エンティティへの参照
   * この仕様書がどのテンプレートを使用しているかを示す
   *
   * 用途:
   * - 保存時のバリデーションロジック（必須項目チェック）
   * - ウィザード画面の構築
   */
  schema_id: UUID;

  /**
   * 件名（非正規化フィールド）
   * 本来は SpecificationContent (EAV) に格納されるべきデータ
   *
   * 非正規化の理由:
   * - トップページの一覧表示で頻繁に使用
   * - 毎回 JOIN するとパフォーマンス低下
   * - 保存時に SpecificationContent から「件名」の value を取得してコピー
   *
   * null の場合: トップページに "(件名未設定)" と表示
   */
  title: string | null;

  /**
   * ステータス
   * - editing: 編集中
   * - reviewing: 確認中
   * - saved: 保存済み
   *
   * 用途:
   * - トップページの「操作」ボタン制御（編集/詳細）
   * - 保存ロジック（バージョン管理）
   * - ステータスの視覚的識別（色分け）
   */
  status: SpecificationStatus;

  /**
   * バージョン番号
   * セマンティックバージョニング形式
   * 例: "1.0", "1.1", "2.0"
   *
   * バージョン管理ロジック:
   * - 必須項目のみ変更 → マイナーバージョンアップ (1.0 → 1.1)
   * - 任意項目も変更 → メジャーバージョンアップ (1.0 → 2.0)
   */
  version: Version;

  /**
   * 作成日時（AuditableEntity から継承）
   * 仕様書詳細情報画面に表示
   */
  // created_at: Timestamp;

  /**
   * 最終更新日時（AuditableEntity から継承）
   * 仕様書一覧表示に表示
   */
  // updated_at: Timestamp;
}

/**
 * フィールド値の型
 * SpecificationContent.value に格納される動的な値
 *
 * JSONB型で格納することで、様々な型に対応
 */
export type FieldValue =
  | string              // テキスト、テキストエリア、ラジオボタン
  | string[]            // チェックボックス（複数選択）
  | Date                // 日付
  | number              // 数値（将来的な拡張）
  | boolean             // 真偽値（将来的な拡張）
  | { [key: string]: unknown };  // 複雑な構造（将来的な拡張）

/**
 * SpecificationContentエンティティ
 * EAV (Entity-Attribute-Value) パターンの中核
 *
 * SchemaField（質問）に対する「回答」の値を格納
 * 管理者が SchemaField を増減させても、このテーブルのスキーマ変更は不要
 */
export interface SpecificationContent {
  /**
   * コンテンツID（主キー）
   */
  content_id: UUID;

  /**
   * 仕様書ID（外部キー）
   * Specification エンティティへの参照
   * どの仕様書の値か
   */
  specification_id: UUID;

  /**
   * フィールドID（外部キー）
   * SchemaField エンティティへの参照
   * どの項目（例：「調達の目的」）の値か
   */
  field_id: UUID;

  /**
   * 値（JSONB型推奨）
   * 実際の入力値を格納
   *
   * 例:
   * - テキスト: "調達の目的を入力してください"
   * - チェックボックス: ["コンサルティング", "要件定義支援"]
   * - 日付: "2025-11-18T00:00:00.000Z"
   *
   * PostgreSQL の JSONB型を使用することで:
   * - 配列やオブジェクトをネイティブに格納
   * - インデックス作成可能
   * - JSON クエリ関数が使用可能
   */
  value: FieldValue;
}

/**
 * フィールドとその値を含む拡張型
 * JOIN 結果用（確認画面、詳細画面で使用）
 */
export interface SpecificationContentWithField extends SpecificationContent {
  /**
   * フィールド定義
   * SchemaField エンティティ
   */
  field: {
    field_id: UUID;
    field_name: string;
    data_type: string;
    is_required: boolean;
  };
}

/**
 * 仕様書の完全な構造
 * JOIN 結果用（確認画面、詳細画面で使用）
 */
export interface SpecificationWithContent extends Specification {
  /**
   * 作成者情報
   */
  author: {
    user_id: UUID;
    full_name: string;
    email: string;
  };

  /**
   * スキーマ情報
   */
  schema: {
    schema_id: UUID;
    schema_name: string;
  };

  /**
   * 仕様書の入力内容（カテゴリ別にグループ化）
   */
  contents: SpecificationContentWithField[];
}

/**
 * 仕様書一覧用の軽量型
 * トップページの一覧表示用
 */
export interface SpecificationListItem {
  specification_id: UUID;
  title: string | null;
  status: SpecificationStatus;
  version: Version;
  author_user_id: UUID;
  author_name: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * 仕様書が編集可能かチェック
 */
export function isEditable(spec: Specification): boolean {
  return spec.status === SpecificationStatus.EDITING;
}

/**
 * 仕様書が確認中かチェック
 */
export function isReviewing(spec: Specification): boolean {
  return spec.status === SpecificationStatus.REVIEWING;
}

/**
 * 仕様書が保存済みかチェック
 */
export function isSaved(spec: Specification): boolean {
  return spec.status === SpecificationStatus.SAVED;
}

/**
 * バージョン番号をパース
 */
export function parseVersion(version: Version): { major: number; minor: number } {
  const [major, minor] = version.split('.').map(Number);
  return { major, minor };
}

/**
 * マイナーバージョンをインクリメント
 * 例: "1.0" → "1.1"
 */
export function incrementMinorVersion(version: Version): Version {
  const { major, minor } = parseVersion(version);
  return `${major}.${minor + 1}` as Version;
}

/**
 * メジャーバージョンをインクリメント
 * 例: "1.0" → "2.0"
 */
export function incrementMajorVersion(version: Version): Version {
  const { major } = parseVersion(version);
  return `${major + 1}.0` as Version;
}
