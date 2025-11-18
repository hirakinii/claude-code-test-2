# データベース層 テスト仕様書

**文書バージョン**: 1.0
**作成日**: 2025-11-18
**対象フェーズ**: Phase 1 - データベース層
**参照**: `docs/implementation-strategy.md` Phase 1

---

## 目次

1. [テスト概要](#1-テスト概要)
2. [テスト環境](#2-テスト環境)
3. [テストケース](#3-テストケース)
4. [テスト実行手順](#4-テスト実行手順)
5. [成功基準](#5-成功基準)

---

## 1. テスト概要

### 1.1. テストの目的

Phase 1 で実装したデータベース層の品質を検証し、以下を保証する：

1. **スキーマ整合性**: 12エンティティのテーブル、カラム、型、制約が仕様通りに定義されている
2. **リレーション整合性**: 外部キー制約が正しく設定され、参照整合性が保たれる
3. **インデックス最適化**: パフォーマンス要件を満たすインデックスが設定されている
4. **シードデータ品質**: デフォルトスキーマが正しく投入されている
5. **セキュリティ**: SQLインジェクション対策が施されている

### 1.2. テスト範囲

| カテゴリ | 対象 |
|---------|------|
| **スキーマ検証** | 12エンティティのテーブル定義 |
| **制約検証** | 主キー、外部キー、ユニーク制約、NOT NULL制約 |
| **インデックス検証** | パフォーマンス最適化インデックス |
| **Enum検証** | FieldDataType, SpecificationStatus, RoleName |
| **シードデータ検証** | デフォルトスキーマ、ロール |
| **リレーション検証** | CASCADE, RESTRICT動作 |
| **セキュリティ検証** | パラメータ化クエリ（Prisma ORM使用） |

---

## 2. テスト環境

### 2.1. 必要な環境

| 項目 | 設定 |
|-----|------|
| **データベース** | PostgreSQL 15以上 |
| **Node.js** | 20 LTS以上 |
| **ORM** | Prisma 5.22.0以上 |
| **テストツール** | Jest + ts-jest |

### 2.2. 環境変数

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_test?schema=public"
NODE_ENV="test"
```

### 2.3. セットアップ手順

```bash
# 1. 依存関係のインストール
npm install

# 2. Prismaクライアント生成
npm run db:generate

# 3. テストデータベース作成（PostgreSQL起動済み）
createdb spec_manager_test

# 4. マイグレーション実行
npm run db:migrate:dev

# 5. シードデータ投入
npm run db:seed
```

---

## 3. テストケース

### 3.1. スキーマ検証テスト

#### TC-DB-001: テーブル存在確認

**目的**: 12エンティティのテーブルがすべて作成されている

**SQL**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**期待結果**:
```
basic_business_requirements
business_tasks
contractor_requirements
deliverables
roles
schema_categories
schema_fields
schemas
specification_content
specifications
user_roles
users
```

**合計**: 12テーブル

---

#### TC-DB-002: users テーブル構造検証

**目的**: users テーブルのカラムと型が正しい

**SQL**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**期待結果**:

| column_name | data_type | is_nullable | column_default |
|------------|-----------|-------------|----------------|
| user_id | uuid | NO | gen_random_uuid() |
| email | character varying | NO | - |
| password_hash | character varying | NO | - |
| full_name | character varying | NO | - |
| created_at | timestamp with time zone | NO | now() |

**制約**:
- PRIMARY KEY: user_id
- UNIQUE: email

---

#### TC-DB-003: specifications テーブル構造検証

**目的**: specifications テーブルのカラムと型が正しい

**SQL**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'specifications'
ORDER BY ordinal_position;
```

**期待結果**:

| column_name | data_type | is_nullable | column_default |
|------------|-----------|-------------|----------------|
| specification_id | uuid | NO | gen_random_uuid() |
| author_user_id | uuid | NO | - |
| schema_id | uuid | NO | - |
| title | character varying | YES | - |
| status | SpecificationStatus | NO | 'editing' |
| version | character varying | NO | '1.0' |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

**外部キー**:
- author_user_id → users(user_id) ON DELETE CASCADE
- schema_id → schemas(schema_id) ON DELETE RESTRICT

---

#### TC-DB-004: schema_fields テーブル構造検証

**目的**: schema_fields テーブルのカラムと型が正しい

**SQL**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'schema_fields'
ORDER BY ordinal_position;
```

**期待結果**:

| column_name | data_type | is_nullable | column_default |
|------------|-----------|-------------|----------------|
| field_id | uuid | NO | gen_random_uuid() |
| category_id | uuid | NO | - |
| field_name | character varying | NO | - |
| data_type | FieldDataType | NO | - |
| is_required | boolean | NO | false |
| options | jsonb | YES | - |
| placeholder_text | text | YES | - |
| list_target_entity | character varying | YES | - |
| display_order | integer | NO | - |

**外部キー**:
- category_id → schema_categories(category_id) ON DELETE CASCADE

---

### 3.2. Enum型検証テスト

#### TC-DB-010: Enum型存在確認

**SQL**:
```sql
SELECT typname
FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;
```

**期待結果**:
```
FieldDataType
RoleName
SpecificationStatus
```

---

#### TC-DB-011: FieldDataType Enum値検証

**SQL**:
```sql
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'FieldDataType'
ORDER BY enumsortorder;
```

**期待結果**:
```
text
textarea
radio
checkbox
date
list
```

---

### 3.3. インデックス検証テスト

#### TC-DB-020: パフォーマンスインデックス存在確認

**目的**: 実装戦略書で定義されたインデックスが存在する

**SQL**:
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('specifications', 'schema_categories', 'schema_fields', 'specification_content')
ORDER BY tablename, indexname;
```

**期待インデックス**:

| テーブル | インデックス名 | 目的 |
|---------|-------------|------|
| specifications | idx_specifications_author_updated | 仕様書一覧の高速化 (author_user_id, updated_at DESC) |
| specifications | idx_specifications_status | ステータス絞り込み |
| schema_categories | idx_schema_categories_schema_order | カテゴリ取得の高速化 (schema_id, display_order) |
| schema_fields | idx_schema_fields_category_order | フィールド取得の高速化 (category_id, display_order) |
| specification_content | idx_specification_content_spec_field | EAVクエリの高速化 (specification_id, field_id) |

---

#### TC-DB-021: インデックスパフォーマンス検証

**目的**: インデックスが実際にクエリで使用される

**SQL**:
```sql
EXPLAIN ANALYZE
SELECT specification_id, title, status, version, updated_at
FROM specifications
WHERE author_user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY updated_at DESC
LIMIT 20;
```

**期待結果**:
- `Index Scan using idx_specifications_author_updated` が使用される
- Execution Time < 10ms（データ量1000件の場合）

---

### 3.4. 外部キー制約検証テスト

#### TC-DB-030: CASCADE 削除動作確認

**目的**: ユーザー削除時に関連仕様書も削除される

**SQL**:
```sql
-- テストユーザー作成
INSERT INTO users (user_id, email, password_hash, full_name)
VALUES ('test-user-001', 'test@example.com', 'hash', 'Test User');

-- 仕様書作成
INSERT INTO specifications (specification_id, author_user_id, schema_id, status, version)
VALUES ('test-spec-001', 'test-user-001', '00000000-0000-0000-0000-000000000001', 'editing', '1.0');

-- ユーザー削除
DELETE FROM users WHERE user_id = 'test-user-001';

-- 仕様書が削除されているか確認
SELECT COUNT(*) FROM specifications WHERE specification_id = 'test-spec-001';
```

**期待結果**: `0`（CASCADE削除成功）

---

#### TC-DB-031: RESTRICT 削除防止確認

**目的**: スキーマ削除時、関連仕様書がある場合は削除を防止

**SQL**:
```sql
-- 仕様書が存在する状態でスキーマ削除を試みる
DELETE FROM schemas WHERE schema_id = '00000000-0000-0000-0000-000000000001';
```

**期待結果**: エラー `violates foreign key constraint`（RESTRICT成功）

---

### 3.5. シードデータ検証テスト

#### TC-DB-040: ロール投入確認

**SQL**:
```sql
SELECT role_id, role_name FROM roles ORDER BY role_id;
```

**期待結果**:

| role_id | role_name |
|---------|-----------|
| 1 | administrator |
| 2 | creator |

---

#### TC-DB-041: デフォルトスキーマ投入確認

**SQL**:
```sql
SELECT schema_id, schema_name, is_default FROM schemas;
```

**期待結果**:

| schema_id | schema_name | is_default |
|-----------|-------------|------------|
| 00000000-0000-0000-0000-000000000001 | デフォルトスキーマ | true |

---

#### TC-DB-042: カテゴリ投入確認

**SQL**:
```sql
SELECT category_name, display_order
FROM schema_categories
WHERE schema_id = '00000000-0000-0000-0000-000000000001'
ORDER BY display_order;
```

**期待結果**:

| category_name | display_order |
|--------------|---------------|
| 基本情報 | 1 |
| 調達の種別とスコープ | 2 |
| 納品情報 | 3 |
| 受注者等の要件 | 4 |
| 各業務の詳細仕様 | 5 |

---

#### TC-DB-043: フィールド投入確認

**SQL**:
```sql
SELECT COUNT(*) AS total_fields
FROM schema_fields sf
JOIN schema_categories sc ON sf.category_id = sc.category_id
WHERE sc.schema_id = '00000000-0000-0000-0000-000000000001';
```

**期待結果**: `total_fields >= 10`（最低10フィールド）

---

#### TC-DB-044: 必須フィールド確認

**SQL**:
```sql
SELECT field_name, is_required
FROM schema_fields sf
JOIN schema_categories sc ON sf.category_id = sc.category_id
WHERE sc.schema_id = '00000000-0000-0000-0000-000000000001'
  AND is_required = true
ORDER BY sc.display_order, sf.display_order;
```

**期待結果**（最低限）:

| field_name | is_required |
|-----------|-------------|
| 件名 | true |
| 背景 | true |
| 調達の目的 | true |
| 調達の種別 | true |
| 納品期限 | true |
| 納品物 | true |
| 業務タスク | true |

---

### 3.6. データ整合性検証テスト

#### TC-DB-050: UNIQUE制約確認（メール重複防止）

**SQL**:
```sql
-- 1回目: 成功
INSERT INTO users (user_id, email, password_hash, full_name)
VALUES ('test-001', 'duplicate@example.com', 'hash', 'User 1');

-- 2回目: 失敗するはず
INSERT INTO users (user_id, email, password_hash, full_name)
VALUES ('test-002', 'duplicate@example.com', 'hash', 'User 2');
```

**期待結果**: 2回目で `duplicate key value violates unique constraint "users_email_key"`

---

#### TC-DB-051: NOT NULL制約確認

**SQL**:
```sql
INSERT INTO specifications (specification_id, author_user_id, schema_id, title, status, version)
VALUES ('test-spec', NULL, '00000000-0000-0000-0000-000000000001', 'Test', 'editing', '1.0');
```

**期待結果**: エラー `null value in column "author_user_id" violates not-null constraint`

---

### 3.7. セキュリティ検証テスト

#### TC-DB-060: Prisma ORM のパラメータ化クエリ検証

**目的**: SQLインジェクション対策の確認

**テストコード** (`prisma/tests/security.test.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('SQLインジェクション対策: パラメータ化クエリ', async () => {
  const maliciousEmail = "admin@example.com' OR '1'='1";

  // Prisma は自動的にパラメータ化するため、インジェクションは無効化される
  const user = await prisma.user.findUnique({
    where: { email: maliciousEmail },
  });

  expect(user).toBeNull(); // マッチしないはず
});
```

**期待結果**: テスト成功（インジェクション無効化）

---

### 3.8. パフォーマンステスト

#### TC-DB-070: 仕様書一覧取得パフォーマンス

**目的**: 10,000件の仕様書から一覧を200ms以内で取得

**前提条件**: 10,000件の仕様書データを投入

**SQL**:
```sql
EXPLAIN ANALYZE
SELECT specification_id, title, status, version, updated_at
FROM specifications
WHERE author_user_id = 'test-user-id'
ORDER BY updated_at DESC
LIMIT 20;
```

**成功基準**:
- `Index Scan` が使用される
- Execution Time < 200ms

---

#### TC-DB-071: EAVクエリパフォーマンス

**目的**: SpecificationContentの取得が50ms以内

**SQL**:
```sql
EXPLAIN ANALYZE
SELECT sc.value, sf.field_name
FROM specification_content sc
JOIN schema_fields sf ON sc.field_id = sf.field_id
WHERE sc.specification_id = 'test-spec-id';
```

**成功基準**:
- インデックス `idx_specification_content_spec_field` が使用される
- Execution Time < 50ms

---

## 4. テスト実行手順

### 4.1. 手動テスト実行

```bash
# 1. PostgreSQL接続
psql -U postgres -d spec_manager_test

# 2. テストケースSQLを順次実行
\i tests/sql/TC-DB-001.sql
\i tests/sql/TC-DB-002.sql
# ... 以下同様
```

### 4.2. 自動テスト実行

```bash
# Jestテスト実行
npm test -- prisma/tests/database.test.ts

# カバレッジ付き実行
npm test -- --coverage
```

---

## 5. 成功基準

### 5.1. 必須基準（Phase 1 完了条件）

- [ ] 全テーブル（12個）が存在する
- [ ] 全Enum型（3個）が存在する
- [ ] 全外部キー制約が正しく設定されている
- [ ] パフォーマンスインデックスがすべて設定されている
- [ ] シードデータ（デフォルトスキーマ、ロール）が投入されている
- [ ] CASCADE/RESTRICT動作が正しい
- [ ] Prismaクライアントが正常に生成される

### 5.2. パフォーマンス基準

- [ ] 仕様書一覧取得: < 200ms（10,000件時）
- [ ] EAVクエリ: < 50ms
- [ ] スキーマ定義取得: < 100ms

### 5.3. セキュリティ基準

- [ ] SQLインジェクション対策（Prisma自動パラメータ化）
- [ ] パスワードハッシュ化（本番実装時）
- [ ] ロールベースアクセス制御の基盤整備

---

## 6. テスト結果記録

| TC番号 | テスト名 | 実行日 | 結果 | 備考 |
|--------|---------|--------|------|------|
| TC-DB-001 | テーブル存在確認 | - | - | - |
| TC-DB-002 | users構造検証 | - | - | - |
| TC-DB-003 | specifications構造検証 | - | - | - |
| ... | ... | ... | ... | ... |

**テスト担当者**: ___________
**レビュー担当者**: ___________
**承認日**: ___________

---

**次フェーズ**: Phase 2 - バックエンドAPI実装
