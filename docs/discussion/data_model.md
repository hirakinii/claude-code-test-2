# エンティティインターフェース実装方針

## 概要

本ドキュメントは、`docs/仕様書作成アプリ データモデル生成.md` に基づいて、システムで扱われる各エンティティと属性を表現するTypeScriptインターフェースの実装方針を定義します。

## 設計アーキテクチャ

### ディレクトリ構造

```
src/
├── types/
│   ├── entities/          # エンティティ型定義
│   │   ├── index.ts
│   │   ├── user.ts        # User, Role, UserRole
│   │   ├── schema.ts      # Schema, SchemaCategory, SchemaField
│   │   ├── specification.ts  # Specification, SpecificationContent
│   │   └── subentities.ts    # Deliverable, ContractorRequirement等
│   ├── enums/             # Enum型定義
│   │   ├── index.ts
│   │   ├── field-data-type.ts
│   │   ├── specification-status.ts
│   │   └── role-name.ts
│   ├── common/            # 共通型
│   │   ├── index.ts
│   │   ├── base-entity.ts     # 監査フィールド
│   │   └── database-types.ts   # UUID等のDB型
│   └── index.ts           # 全エクスポート
```

### 型の階層化

```
Database型 (DB層)
    ↓
Entity型 (ドメイン層) ← 今回実装
    ↓
DTO型 (API層)
```

## 型安全性戦略

### 厳格な型定義

- **UUID型**: `string`のブランド型で型安全性を確保
- **Enum型**: `const enum`ではなく`enum`または`union type`を使用（実行時チェック可能）
- **Timestamp型**: `Date`オブジェクトまたは`ISO 8601`文字列
- **JSON型**: 具体的な型定義（`any`禁止）

### 必須/オプショナルの明確化

- Nullable属性は`| null`で明示
- オプショナルは`?`で明示
- データモデル定義書の仕様に厳密に従う

## 監査可能性への対応

### 共通ベースインターフェース

```typescript
// 作成時メタデータ
interface CreatedMetadata {
  created_at: Date;
  created_by?: string; // 作成者ユーザーID（監査用）
}

// 更新時メタデータ
interface UpdatedMetadata {
  updated_at: Date;
  updated_by?: string; // 更新者ユーザーID（監査用）
}

// 監査対応ベース
interface AuditableEntity extends CreatedMetadata, UpdatedMetadata {}
```

### 適用方針

- Schema系エンティティ: `AuditableEntity`を継承（管理者操作を追跡）
- Specification系: `AuditableEntity`を継承（編集履歴を追跡）
- User: `CreatedMetadata`のみ（作成日時記録）

## Enum型の定義方針

### データモデルで定義されたEnum

#### FieldDataType (Schema_Field.data_type)

```typescript
enum FieldDataType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  LIST = 'list'
}
```

#### SpecificationStatus (Specification.status)

```typescript
enum SpecificationStatus {
  EDITING = 'editing',      // 編集中
  REVIEWING = 'reviewing',  // 確認中
  SAVED = 'saved'           // 保存済み
}
```

#### RoleName (Role.role_name)

```typescript
enum RoleName {
  ADMINISTRATOR = 'administrator',  // 仕様書管理者
  CREATOR = 'creator'               // 仕様書作成者
}
```

## 特殊フィールドの型定義

### Schema_Field.options (JSON型)

```typescript
// チェックボックス/ラジオボタンの選択肢
interface FieldOptions {
  choices?: Array<{
    value: string;
    label: string;
  }>;
  // 将来的な拡張用
  [key: string]: unknown;
}
```

### Specification_Content.value (JSONB型)

```typescript
// 動的な値を格納
type FieldValue =
  | string              // テキスト、テキストエリア
  | string[]            // チェックボックス
  | Date                // 日付
  | { [key: string]: unknown };  // 複雑な構造
```

### Specification.version (String)

```typescript
// セマンティックバージョニング形式
type Version = string;  // "1.0", "1.1", "2.0" 等
```

## リレーションシップの表現

### 外部キー参照

```typescript
// ID型のみ保持（正規化）
interface Specification {
  specification_id: string;
  author_user_id: string;  // FK to User
  schema_id: string;        // FK to Schema
  // ...
}

// 拡張型（JOIN結果用）※別途DTOとして定義
interface SpecificationWithAuthor extends Specification {
  author: User;  // Populated
}
```

### 多対多関係 (User - Role)

```typescript
// ジャンクションテーブル
interface UserRole {
  user_id: string;
  role_id: number;
}
```

## セキュリティ考慮事項

### 機密情報の分離

```typescript
// パスワードハッシュを含むDB型
interface UserEntity {
  user_id: string;
  email: string;
  password_hash: string;  // ← DBにのみ存在
  full_name: string;
  created_at: Date;
}

// API応答用（パスワード除外）※別途DTOで定義
interface UserDTO {
  user_id: string;
  email: string;
  full_name: string;
  created_at: Date;
}
```

**重要**: 本実装ではEntity型のみを定義します。DTOへの変換ロジックは別レイヤーで実装します。

## バリデーション対応

### 型レベルでの制約表現

```typescript
// emailはUnique制約
interface User {
  user_id: string;
  email: string;  // Runtime validation: email format + uniqueness
  // ...
}

// is_requiredフラグの表現
interface SchemaField {
  field_id: string;
  is_required: boolean;
  // ...
}
```

### 実行時バリデーションとの連携

- 型定義はコンパイル時の型チェック
- 実行時バリデーションは別途（Zod, Joi等）実装を推奨

## 命名規則

### インターフェース名

- エンティティ名をPascalCaseで表現
- DB名との対応: `User` ↔ `users` テーブル
- 接頭辞 `I` は**使用しない**（TypeScript推奨スタイル）

### 属性名

- **snake_case**を使用（DB列名と一致）
  - 理由: PostgreSQLの列名と直接マッピング可能
  - ORMとの親和性
- camelCaseへの変換は**DTO層で実施**

## 実装の段階的アプローチ

### Phase 1: 基礎インフラ
1. 共通型定義 (`common/`)
2. Enum型定義 (`enums/`)

### Phase 2: コアエンティティ
3. User系エンティティ (`user.ts`)
4. Schema系エンティティ (`schema.ts`)

### Phase 3: ビジネスエンティティ
5. Specification系エンティティ (`specification.ts`)
6. サブエンティティ (`subentities.ts`)

### Phase 4: 統合
7. インデックスファイルの整備
8. エクスポート構成の最適化

## 今後の拡張性考慮

### 監査ログテーブルの追加準備

```typescript
// 将来実装用のインターフェース設計を考慮
interface AuditLog {
  log_id: string;
  entity_type: string;
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_by: string;
  changed_at: Date;
  changes: Record<string, unknown>;
}
```

### バージョン管理の拡張

```typescript
// 将来的な仕様書履歴管理
interface SpecificationHistory {
  history_id: string;
  specification_id: string;
  version: string;
  snapshot: Specification;
  created_at: Date;
}
```

## エンティティ一覧

本実装で定義する12のエンティティ：

### ユーザーおよび権限エンティティ
1. **User** - ユーザー
2. **Role** - ロール
3. **UserRole** - ユーザーロール（ジャンクションテーブル）

### スキーマ（メタモデル）エンティティ
4. **Schema** - スキーマ
5. **SchemaCategory** - スキーマ・カテゴリ
6. **SchemaField** - スキーマ・フィールド

### 仕様書（データ）エンティティ
7. **Specification** - 仕様書
8. **SpecificationContent** - 仕様書コンテンツ（EAVモデル）

### 1:N サブエンティティ（動的リスト）
9. **Deliverable** - 納品物
10. **ContractorRequirement** - 受注者要件
11. **BasicBusinessRequirement** - 業務基本要件
12. **BusinessTask** - 業務タスク

## 実装原則

### セキュリティファースト
- OWASP Top 10の脆弱性を防ぐ型設計
- 機密情報（パスワード等）の適切な型分離
- 入力値検証のための型制約

### スケーラビリティ設計
- 効率的なDB型マッピング
- 適切な正規化/非正規化の型表現
- パフォーマンスを考慮した型定義

### 監査可能性
- 全エンティティに適切な監査フィールド
- 変更履歴追跡のための型設計
- タイムスタンプと実行ユーザーの記録

## 技術的決定事項

### PostgreSQL準拠
- UUIDは文字列型として扱う（PostgreSQL の uuid型に対応）
- JSONB型は`unknown`またはジェネリクス型で表現
- Timestamp型は`Date`オブジェクト

### TypeScript strict モード
- `strict: true`設定を前提
- `any`型の使用を最小限に
- null安全性を確保

## 参照ドキュメント

- [仕様書作成アプリ データモデル生成.md](../仕様書作成アプリ%20データモデル生成.md)
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト開発原則
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**作成日**: 2025-11-18
**最終更新**: 2025-11-18
