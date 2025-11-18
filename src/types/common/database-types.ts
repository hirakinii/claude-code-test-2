/**
 * データベース型定義
 * PostgreSQLの型をTypeScriptで表現
 */

/**
 * UUID型
 * PostgreSQLのUUID型に対応
 * ブランド型により文字列との混同を防ぐ
 */
export type UUID = string & { readonly __brand: 'UUID' };

/**
 * Timestamp型
 * PostgreSQLのTIMESTAMP型に対応
 */
export type Timestamp = Date;

/**
 * Version型
 * セマンティックバージョニング形式 (例: "1.0", "1.1", "2.0")
 */
export type Version = string & { readonly __brand: 'Version' };

/**
 * Email型
 * メールアドレス文字列
 */
export type Email = string & { readonly __brand: 'Email' };

/**
 * UUID型ガード関数
 * 実行時にUUID形式の文字列かチェック
 */
export function isUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * UUID型アサーション関数
 * 文字列をUUID型として扱う（型チェックは行わない）
 */
export function asUUID(value: string): UUID {
  return value as UUID;
}

/**
 * Version型アサーション関数
 * 文字列をVersion型として扱う
 */
export function asVersion(value: string): Version {
  return value as Version;
}

/**
 * Email型アサーション関数
 * 文字列をEmail型として扱う
 */
export function asEmail(value: string): Email {
  return value as Email;
}
