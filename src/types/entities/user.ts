/**
 * ユーザーおよび権限エンティティ
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 * - 表1: ユーザーおよび権限エンティティ
 */

import { UUID, Email, Timestamp } from '../common/database-types';
import { CreatedMetadata } from '../common/base-entity';
import { RoleName } from '../enums/role-name';

/**
 * Userエンティティ
 * ログインする個人を識別
 *
 * セキュリティ注意:
 * - password_hash は DB にのみ存在し、API レスポンスには含めない
 * - DTO 変換時に除外する必要がある
 */
export interface User extends CreatedMetadata {
  /**
   * ユーザーID（主キー）
   */
  user_id: UUID;

  /**
   * メールアドレス（一意制約）
   * ログイン認証に使用
   */
  email: Email;

  /**
   * パスワードハッシュ
   * 平文パスワードは保存しない（bcrypt, argon2等でハッシュ化）
   *
   * セキュリティ:
   * - このフィールドは API レスポンスに含めない
   * - DTO 層で除外する
   */
  password_hash: string;

  /**
   * フルネーム
   */
  full_name: string;

  /**
   * 作成日時（CreatedMetadata から継承）
   */
  // created_at: Timestamp;
}

/**
 * Roleエンティティ
 * RBAC（ロールベースアクセス制御）のロール定義
 *
 * 主要ロール:
 * - administrator: 仕様書管理者（スキーマ設定可能）
 * - creator: 仕様書作成者（仕様書作成のみ）
 */
export interface Role {
  /**
   * ロールID（主キー）
   * Integer型を使用（小規模な列挙型のため）
   */
  role_id: number;

  /**
   * ロール名（一意制約）
   * RoleName enum の値を使用
   */
  role_name: RoleName;
}

/**
 * UserRoleエンティティ（ジャンクションテーブル）
 * User と Role の多対多（N:M）関係を解決
 *
 * 複合主キー: (user_id, role_id)
 */
export interface UserRole {
  /**
   * ユーザーID（外部キー + 主キー）
   */
  user_id: UUID;

  /**
   * ロールID（外部キー + 主キー）
   */
  role_id: number;
}

/**
 * UserDTO（API レスポンス用）
 * password_hash を除外したユーザー情報
 *
 * セキュリティ:
 * - API レスポンスでは必ずこの型を使用
 * - password_hash を外部に公開しない
 */
export interface UserDTO {
  user_id: UUID;
  email: Email;
  full_name: string;
  created_at: Timestamp;
}

/**
 * ロールを含むユーザー情報（JOIN 結果）
 * User と UserRole, Role を JOIN した結果
 */
export interface UserWithRoles extends UserDTO {
  /**
   * ユーザーが持つロールのリスト
   */
  roles: Role[];
}

/**
 * User から UserDTO への変換関数
 * password_hash を除外
 */
export function toUserDTO(user: User): UserDTO {
  const { password_hash, ...userDTO } = user;
  return userDTO;
}

/**
 * ユーザーが特定のロールを持っているかチェック
 */
export function hasRole(userWithRoles: UserWithRoles, roleName: RoleName): boolean {
  return userWithRoles.roles.some(role => role.role_name === roleName);
}

/**
 * ユーザーが管理者かチェック
 */
export function isAdministrator(userWithRoles: UserWithRoles): boolean {
  return hasRole(userWithRoles, RoleName.ADMINISTRATOR);
}

/**
 * ユーザーが作成者ロールを持っているかチェック
 */
export function isCreator(userWithRoles: UserWithRoles): boolean {
  return hasRole(userWithRoles, RoleName.CREATOR);
}
