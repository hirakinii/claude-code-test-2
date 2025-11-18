/**
 * ユーザーロール名
 * Role.role_name に対応
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 * RBAC (Role-Based Access Control) の実装
 */

/**
 * ロール名の列挙
 */
export enum RoleName {
  /**
   * 仕様書管理者
   * - スキーマ設定画面へのアクセス権限
   * - Schema, SchemaCategory, SchemaField の CRUD 操作権限
   */
  ADMINISTRATOR = 'administrator',

  /**
   * 仕様書作成者
   * - ウィザード画面で仕様書を作成・編集する権限
   * - 自分が作成した仕様書のみ管理可能
   */
  CREATOR = 'creator',
}

/**
 * RoleName型ガード
 * 文字列がRoleName型として有効かチェック
 */
export function isRoleName(value: string): value is RoleName {
  return Object.values(RoleName).includes(value as RoleName);
}

/**
 * RoleNameの日本語表示名マッピング
 * UI表示用
 */
export const RoleNameLabels: Record<RoleName, string> = {
  [RoleName.ADMINISTRATOR]: '仕様書管理者',
  [RoleName.CREATOR]: '仕様書作成者',
};

/**
 * ロール別の権限マトリクス
 * アクセス制御ロジックで使用
 */
export const RolePermissions = {
  [RoleName.ADMINISTRATOR]: {
    canAccessSettings: true,       // 設定画面へのアクセス
    canManageSchema: true,          // スキーマの管理
    canCreateSpecification: true,   // 仕様書の作成
    canViewAllSpecifications: true, // 全仕様書の閲覧（将来的な機能）
  },
  [RoleName.CREATOR]: {
    canAccessSettings: false,
    canManageSchema: false,
    canCreateSpecification: true,
    canViewAllSpecifications: false, // 自分の仕様書のみ閲覧可能
  },
} as const;
