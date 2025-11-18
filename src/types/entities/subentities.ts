/**
 * 1:N サブエンティティ（動的リスト）
 *
 * SchemaField の data_type が "list" の場合に参照される独立したエンティティ群
 * 構造化された子オブジェクトのリストを管理
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 * - 表4: 1:N サブエンティティ（動的リスト）
 */

import { UUID } from '../common/database-types';

/**
 * Deliverableエンティティ（納品物）
 *
 * 仕様書に紐づく納品物のリストを管理
 * UI: 「納品物」リスト（名称、個数、説明）
 */
export interface Deliverable {
  /**
   * 納品物ID（主キー）
   */
  deliverable_id: UUID;

  /**
   * 仕様書ID（外部キー）
   * Specification エンティティへの参照
   */
  specification_id: UUID;

  /**
   * 納品物の名称
   * 例: "システム設計書", "要件定義書"
   */
  name: string;

  /**
   * 個数
   * 例: 1, 2, 3
   */
  quantity: number;

  /**
   * 説明
   * 納品物の詳細情報
   */
  description: string;
}

/**
 * ContractorRequirementエンティティ（受注者要件）
 *
 * 仕様書に紐づく受注者要件のリストを管理
 * UI: 「受注者要件」リスト（カテゴリ、説明）
 */
export interface ContractorRequirement {
  /**
   * 要件ID（主キー）
   */
  req_id: UUID;

  /**
   * 仕様書ID（外部キー）
   * Specification エンティティへの参照
   */
  specification_id: UUID;

  /**
   * 要件カテゴリ
   * 例: "技術要件", "人員要件", "資格要件"
   */
  category: string;

  /**
   * 要件の説明
   * カテゴリに対する具体的な要件内容
   */
  description: string;
}

/**
 * BasicBusinessRequirementエンティティ（業務基本要件）
 *
 * 仕様書に紐づく業務基本要件のリストを管理
 * UI: 「業務基本要件」リスト（カテゴリ、説明）
 */
export interface BasicBusinessRequirement {
  /**
   * 基本要件ID（主キー）
   */
  basic_req_id: UUID;

  /**
   * 仕様書ID（外部キー）
   * Specification エンティティへの参照
   */
  specification_id: UUID;

  /**
   * 要件カテゴリ
   * 例: "業務フロー", "データ管理", "セキュリティ"
   */
  category: string;

  /**
   * 要件の説明
   * カテゴリに対する具体的な要件内容
   */
  description: string;
}

/**
 * BusinessTaskエンティティ（業務タスク）
 *
 * 仕様書に紐づく業務タスクのリストを管理
 * UI: 「業務タスク」リスト（タイトル、詳細仕様）
 *
 * 重要: 仕様書詳細情報画面に「業務数: N件」として集計表示される
 */
export interface BusinessTask {
  /**
   * タスクID（主キー）
   */
  task_id: UUID;

  /**
   * 仕様書ID（外部キー）
   * Specification エンティティへの参照
   */
  specification_id: UUID;

  /**
   * タスクのタイトル
   * 例: "ユーザー登録機能", "データ移行処理"
   */
  title: string;

  /**
   * 詳細仕様
   * タスクの具体的な実装内容や要件
   */
  detailed_spec: string;
}

/**
 * サブエンティティ型の共通インターフェース
 * 全てのサブエンティティが specification_id を持つことを保証
 */
export interface SubEntity {
  specification_id: UUID;
}

/**
 * サブエンティティ型のユニオン型
 * 型安全な処理に使用
 */
export type SubEntityType =
  | Deliverable
  | ContractorRequirement
  | BasicBusinessRequirement
  | BusinessTask;

/**
 * エンティティ名からエンティティ型へのマッピング
 * SchemaField.list_target_entity から型を推論する際に使用
 */
export type SubEntityMap = {
  Deliverable: Deliverable;
  ContractorRequirement: ContractorRequirement;
  BasicBusinessRequirement: BasicBusinessRequirement;
  BusinessTask: BusinessTask;
};

/**
 * サブエンティティ名の型
 */
export type SubEntityName = keyof SubEntityMap;

/**
 * サブエンティティ名の配列
 */
export const SUB_ENTITY_NAMES: SubEntityName[] = [
  'Deliverable',
  'ContractorRequirement',
  'BasicBusinessRequirement',
  'BusinessTask',
];

/**
 * サブエンティティ名の日本語表示名マッピング
 */
export const SubEntityLabels: Record<SubEntityName, string> = {
  Deliverable: '納品物',
  ContractorRequirement: '受注者要件',
  BasicBusinessRequirement: '業務基本要件',
  BusinessTask: '業務タスク',
};

/**
 * 文字列がサブエンティティ名として有効かチェック
 */
export function isSubEntityName(value: string): value is SubEntityName {
  return SUB_ENTITY_NAMES.includes(value as SubEntityName);
}

/**
 * 仕様書に紐づくサブエンティティの集計情報
 * 仕様書詳細情報画面に表示
 */
export interface SubEntityCounts {
  /**
   * 納品物の数
   */
  deliverables: number;

  /**
   * 受注者要件の数
   */
  contractorRequirements: number;

  /**
   * 業務基本要件の数
   */
  basicBusinessRequirements: number;

  /**
   * 業務タスクの数
   * 仕様書詳細情報画面に「業務数: N件」として表示
   */
  businessTasks: number;
}
