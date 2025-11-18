/**
 * 基底エンティティ型定義
 * 監査可能性を担保するための共通フィールド
 */

import { Timestamp, UUID } from './database-types';

/**
 * 作成時メタデータ
 * エンティティの作成情報を記録
 */
export interface CreatedMetadata {
  /**
   * 作成日時
   */
  created_at: Timestamp;

  /**
   * 作成者ユーザーID（監査用）
   * オプショナル: システム生成の場合は未設定
   */
  created_by?: UUID;
}

/**
 * 更新時メタデータ
 * エンティティの更新情報を記録
 */
export interface UpdatedMetadata {
  /**
   * 最終更新日時
   */
  updated_at: Timestamp;

  /**
   * 最終更新者ユーザーID（監査用）
   * オプショナル: システム更新の場合は未設定
   */
  updated_by?: UUID;
}

/**
 * 監査対応ベースエンティティ
 * 作成・更新の両方の監査情報を持つエンティティ
 *
 * 適用対象:
 * - Schema系エンティティ（管理者操作を追跡）
 * - Specification系エンティティ（編集履歴を追跡）
 */
export interface AuditableEntity extends CreatedMetadata, UpdatedMetadata {}

/**
 * 将来的な拡張: 論理削除対応
 */
export interface SoftDeletableEntity {
  /**
   * 削除日時（NULL = 未削除）
   */
  deleted_at: Timestamp | null;

  /**
   * 削除者ユーザーID
   */
  deleted_by?: UUID;
}
