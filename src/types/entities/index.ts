/**
 * エンティティ型定義エクスポート
 *
 * 全てのエンティティ型を集約してエクスポート
 */

// ユーザーおよび権限エンティティ
export * from './user';

// スキーマ（メタモデル）エンティティ
export * from './schema';

// 仕様書（データ）エンティティ
export * from './specification';

// 1:N サブエンティティ（動的リスト）
export * from './subentities';
