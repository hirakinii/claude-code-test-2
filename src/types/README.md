# 型定義 (Types)

このディレクトリには、仕様書作成支援アプリケーションで使用される全ての型定義が含まれています。

## ディレクトリ構造

```
src/types/
├── common/              # 共通型定義
│   ├── database-types.ts    # UUID, Timestamp等のDB型
│   ├── base-entity.ts       # 監査フィールド（created_at, updated_at等）
│   └── index.ts
├── enums/               # Enum型定義
│   ├── field-data-type.ts   # フィールドデータ型（TEXT, TEXTAREA等）
│   ├── specification-status.ts  # 仕様書ステータス（EDITING, SAVED等）
│   ├── role-name.ts         # ロール名（ADMINISTRATOR, CREATOR）
│   └── index.ts
├── entities/            # エンティティ型定義
│   ├── user.ts              # User, Role, UserRole
│   ├── schema.ts            # Schema, SchemaCategory, SchemaField
│   ├── specification.ts     # Specification, SpecificationContent
│   ├── subentities.ts       # Deliverable, BusinessTask等
│   └── index.ts
├── index.ts             # ルートエクスポート
└── README.md            # このファイル
```

## エンティティ一覧

### ユーザーおよび権限エンティティ (3個)
- **User** - ユーザー
- **Role** - ロール（RBAC）
- **UserRole** - ユーザーロール（ジャンクションテーブル）

### スキーマ（メタモデル）エンティティ (3個)
- **Schema** - スキーマ（テンプレート全体）
- **SchemaCategory** - スキーマ・カテゴリ（ウィザードのステップ）
- **SchemaField** - スキーマ・フィールド（入力項目）

### 仕様書（データ）エンティティ (2個)
- **Specification** - 仕様書
- **SpecificationContent** - 仕様書コンテンツ（EAVモデル）

### 1:N サブエンティティ（動的リスト） (4個)
- **Deliverable** - 納品物
- **ContractorRequirement** - 受注者要件
- **BasicBusinessRequirement** - 業務基本要件
- **BusinessTask** - 業務タスク

**合計: 12エンティティ**

## 使用方法

### 基本的なインポート

```typescript
// 個別にインポート
import { User, Role, UserRole } from '@/types/entities/user';
import { FieldDataType } from '@/types/enums/field-data-type';

// ルートからまとめてインポート（推奨）
import {
  User,
  Role,
  Schema,
  Specification,
  FieldDataType,
  SpecificationStatus,
  RoleName,
} from '@/types';
```

### エンティティの使用例

```typescript
import { User, UserDTO, toUserDTO } from '@/types';

// DB から取得したユーザー（password_hash を含む）
const user: User = {
  user_id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
  email: 'user@example.com' as Email,
  password_hash: '$2b$10$...',
  full_name: '山田太郎',
  created_at: new Date(),
};

// API レスポンス用に変換（password_hash を除外）
const userDTO: UserDTO = toUserDTO(user);
```

### 型ガードの使用例

```typescript
import { isFieldDataType, FieldDataType } from '@/types';

const value = 'text';
if (isFieldDataType(value)) {
  // value は FieldDataType 型として扱える
  console.log(value); // 'text'
}
```

### Enum の使用例

```typescript
import { FieldDataType, FieldDataTypeLabels } from '@/types';

const fieldType: FieldDataType = FieldDataType.TEXT;
console.log(FieldDataTypeLabels[fieldType]); // 'テキスト'
```

## 設計原則

### 1. 型安全性

- `any` 型の使用を禁止
- UUID, Email, Version 等はブランド型で型安全性を確保
- Enum 型は実行時チェック可能な形式を採用

### 2. 監査可能性

- `AuditableEntity` を継承して作成・更新情報を追跡
- `created_at`, `updated_at`, `created_by`, `updated_by` を記録

### 3. セキュリティ

- `User` と `UserDTO` を分離（password_hash を API レスポンスに含めない）
- `toUserDTO()` 関数で安全に変換

### 4. 命名規則

- **インターフェース名**: PascalCase（接頭辞 `I` は使用しない）
- **属性名**: snake_case（PostgreSQL の列名と一致）
- **Enum 値**: SCREAMING_SNAKE_CASE

### 5. データベースマッピング

- PostgreSQL の型に直接マッピング
- UUID → `string` (ブランド型)
- TIMESTAMP → `Date`
- JSONB → `FieldValue` (union type)

## メタモデル・アーキテクチャ

本アプリケーションの最大の特徴は、**動的なスキーマ定義**です。

### スキーマ（定義）層
- `Schema`, `SchemaCategory`, `SchemaField` がウィザードの「型」を定義
- 仕様書管理者が「スキーマ設定」画面で自由に編集可能

### インスタンス（データ）層
- `Specification`, `SpecificationContent` が実際の「値」を格納
- EAV (Entity-Attribute-Value) パターンで柔軟性を実現

### リレーションシップ

```
Schema (1) ─── (N) SchemaCategory (1) ─── (N) SchemaField
                                                    │
                                                    │ 定義
                                                    ▼
Specification (1) ─── (N) SpecificationContent ────┘
     │                          (EAV)
     │
     └─── (N) Deliverable
     └─── (N) BusinessTask
     └─── (N) ContractorRequirement
     └─── (N) BasicBusinessRequirement
```

## 将来的な拡張

### 監査ログ

```typescript
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

### バージョン履歴

```typescript
interface SpecificationHistory {
  history_id: string;
  specification_id: string;
  version: string;
  snapshot: Specification;
  created_at: Date;
}
```

## 参考資料

- [データモデル設計報告書](../../docs/仕様書作成アプリ%20データモデル生成.md)
- [実装方針ディスカッション](../../docs/discussion/data_model.md)
- [プロジェクト開発原則](../../CLAUDE.md)

## TypeScript設定

このプロジェクトは **strict モード** を使用します。

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## 貢献ガイドライン

新しいエンティティや型を追加する際は、以下を遵守してください:

1. **ドキュメント**: JSDocコメントを必ず記述
2. **型安全性**: `any` 型を使用しない
3. **命名規則**: 既存の命名規則に従う
4. **エクスポート**: 適切な index.ts にエクスポートを追加
5. **テスト**: 型定義のテストを追加（将来的に実装予定）

---

**作成日**: 2025-11-18
**最終更新**: 2025-11-18
