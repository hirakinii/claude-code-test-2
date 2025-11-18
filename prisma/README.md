# Phase 1: データベース層 実装完了

**実装日**: 2025-11-18
**フェーズ**: Phase 1 - データベース層（2-3週間）
**参照**: `docs/implementation-strategy.md`

---

## 実装概要

Phase 1では、仕様書作成支援アプリのデータベース層を完全に実装しました。

### 実装内容

✅ **完了項目**:

1. **マイグレーションツール選定**: Prisma ORM を採用
2. **12エンティティのテーブル定義**: 全エンティティをPrismaスキーマとして実装
3. **インデックス戦略**: パフォーマンス最適化インデックスを設定
4. **外部キー制約**: リレーションとCASCADE/RESTRICT動作を実装
5. **デフォルトスキーマのシードデータ**: 5ステップ、10+フィールドを投入
6. **テスト仕様書**: 包括的なテストケースを作成
7. **自動テスト実装**: Jest による最小限のテスト（33+ テストケース）

---

## 実装ファイル一覧

### 設定ファイル

| ファイル | 説明 |
|---------|------|
| `package.json` | 依存関係とスクリプト定義 |
| `tsconfig.json` | TypeScript設定（strict mode） |
| `jest.config.js` | Jest設定 |
| `.env.example` | 環境変数テンプレート（開発用） |
| `.env.test` | 環境変数テンプレート（テスト用） |

### Prismaファイル

| ファイル | 説明 |
|---------|------|
| `prisma/schema.prisma` | **12エンティティのスキーマ定義** |
| `prisma/seed.ts` | デフォルトスキーマ・ロールのシードデータ |
| `prisma/tests/setup.ts` | テスト環境セットアップ |
| `prisma/tests/schema.test.ts` | スキーマ検証テスト |
| `prisma/tests/seed.test.ts` | シードデータ検証テスト |
| `prisma/tests/constraints.test.ts` | 外部キー制約検証テスト |
| `prisma/README.md` | 本ファイル |

### ドキュメント

| ファイル | 説明 |
|---------|------|
| `docs/database-test-specification.md` | データベーステスト仕様書 |

---

## 12エンティティ一覧

### ユーザーおよび権限エンティティ

1. **User**: ユーザー情報
2. **Role**: ロール定義（administrator, creator）
3. **UserRole**: ユーザーとロールの多対多ジャンクションテーブル

### スキーマ（メタモデル）エンティティ

4. **Schema**: テンプレート全体の定義
5. **SchemaCategory**: ウィザードステップの定義
6. **SchemaField**: 入力項目の定義

### 仕様書（データ）エンティティ

7. **Specification**: 仕様書マスター
8. **SpecificationContent**: EAVパターンの入力値

### 1:N サブエンティティ（動的リスト）

9. **Deliverable**: 納品物
10. **ContractorRequirement**: 受注者要件
11. **BasicBusinessRequirement**: 業務基本要件
12. **BusinessTask**: 業務タスク

---

## インデックス戦略

パフォーマンス要件を満たすために以下のインデックスを設定:

| テーブル | インデックス | 目的 |
|---------|------------|------|
| `specifications` | `idx_specifications_author_updated` | 仕様書一覧の高速化 |
| `specifications` | `idx_specifications_status` | ステータス絞り込み |
| `schema_categories` | `idx_schema_categories_schema_order` | カテゴリ取得の高速化 |
| `schema_fields` | `idx_schema_fields_category_order` | フィールド取得の高速化 |
| `specification_content` | `idx_specification_content_spec_field` | EAVクエリの高速化 |

**パフォーマンス目標**:
- 仕様書一覧取得: < 200ms（10,000件時）
- EAVクエリ: < 50ms

---

## デフォルトスキーマ構造

シードデータとして投入されるデフォルトスキーマ:

### ステップ1: 基本情報
- 件名（text, 必須）
- 背景（textarea, 必須）
- 調達の目的（textarea, 必須）

### ステップ2: 調達の種別とスコープ
- 調達の種別（radio, 必須）
- 調達のスコープ（checkbox）

### ステップ3: 納品情報
- 納品期限（date, 必須）
- 納品場所（text）
- 納品担当者（text）
- 納品物（list → Deliverable, 必須）

### ステップ4: 受注者等の要件
- 受注者要件（list → ContractorRequirement）
- 業務基本要件（list → BasicBusinessRequirement）

### ステップ5: 各業務の詳細仕様
- 業務タスク（list → BusinessTask, 必須）

---

## セットアップ手順

### 前提条件

- Node.js 20 LTS以上
- PostgreSQL 15以上
- Git

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集してデータベース接続情報を設定:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_dev?schema=public"
```

### 3. データベースの作成

```bash
# PostgreSQLに接続
psql -U postgres

# データベース作成
CREATE DATABASE spec_manager_dev;

# 接続確認
\c spec_manager_dev
```

### 4. Prismaクライアント生成

```bash
npm run db:generate
```

### 5. マイグレーション実行

```bash
npm run db:migrate:dev
```

初回実行時、マイグレーション名を聞かれます:
```
Enter a name for the new migration: › init
```

### 6. シードデータ投入

```bash
npm run db:seed
```

**出力例**:
```
🌱 Seeding database...
📋 Creating roles...
✅ Created roles: administrator, creator
📋 Creating default schema...
✅ Created schema: デフォルトスキーマ
📋 Creating schema categories...
✅ Created 5 categories
📋 Creating schema fields...
✅ Created 10 fields

🎉 Seeding completed successfully!
```

### 7. Prisma Studio で確認

```bash
npm run db:studio
```

ブラウザが自動的に開き、データベースの内容を確認できます。

---

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run db:generate` | Prismaクライアントを生成 |
| `npm run db:push` | スキーマをDBに即座に反映（開発用） |
| `npm run db:migrate:dev` | マイグレーション作成・実行（開発用） |
| `npm run db:migrate:deploy` | マイグレーション実行（本番用） |
| `npm run db:studio` | Prisma Studioを起動 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:reset` | DB削除→マイグレーション→シード |

---

## テスト実行

### 自動テスト（推奨）

Phase 1では最小限の自動テストを実装しています。

#### 1. テスト環境のセットアップ

```bash
# テスト用データベース作成
createdb spec_manager_test

# テスト用環境変数設定
cp .env.test .env

# 依存関係インストール（未実施の場合）
npm install

# Prismaクライアント生成
npm run db:generate

# マイグレーション実行
npm run db:migrate:dev

# シードデータ投入
npm run db:seed
```

#### 2. テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード（ファイル変更時に自動実行）
npm run test:watch

# カバレッジ付き実行
npm test -- --coverage
```

#### 3. テスト内容

| テストファイル | テストケース数 | 検証内容 |
|--------------|-------------|---------|
| `schema.test.ts` | 8+ | 12テーブル、3 Enum型、インデックス |
| `seed.test.ts` | 15+ | デフォルトスキーマ、ロール、フィールド |
| `constraints.test.ts` | 10+ | CASCADE/RESTRICT、UNIQUE、NOT NULL |

**期待結果**: 全テストが成功 ✅

```
PASS  prisma/tests/schema.test.ts
PASS  prisma/tests/seed.test.ts
PASS  prisma/tests/constraints.test.ts

Test Suites: 3 passed, 3 total
Tests:       33+ passed, 33+ total
```

---

### テスト仕様書の確認

```bash
cat docs/database-test-specification.md
```

---

### 手動テスト（オプション）

PostgreSQLに接続してテストSQLを実行:

```bash
psql -U postgres -d spec_manager_test

-- テーブル一覧確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- デフォルトスキーマ確認
SELECT * FROM schemas;

-- カテゴリ確認
SELECT category_name, display_order
FROM schema_categories
ORDER BY display_order;
```

---

## セキュリティ注意事項

### ⚠️ 本番環境での対応必須事項

1. **パスワードハッシュ化**: シードデータのパスワードはプレースホルダーです。本番では bcrypt を使用してください。

```typescript
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash('password', 12);
```

2. **環境変数管理**: `.env` ファイルは `.gitignore` に含まれています。本番環境では Google Cloud Secret Manager を使用してください。

3. **データベース接続**: 本番環境では以下を設定:
   - SSL/TLS接続の有効化
   - 接続プーリング（PgBouncer）
   - リードレプリカの設定

---

## トラブルシューティング

### エラー: `relation "users" does not exist`

**原因**: マイグレーションが未実行

**解決策**:
```bash
npm run db:migrate:dev
```

---

### エラー: `P1001: Can't reach database server`

**原因**: PostgreSQLが起動していない、または接続情報が誤っている

**解決策**:
1. PostgreSQLの起動確認:
```bash
# macOS (Homebrew)
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

2. `.env` の `DATABASE_URL` を確認

---

### シードデータが重複エラー

**原因**: シードデータが既に投入されている

**解決策**:
```bash
# データベースをリセットして再投入
npm run db:reset
```

---

## 次のステップ: Phase 2 - バックエンドAPI実装

Phase 1が完了しました。次は Phase 2 に進みます:

1. **認証・認可API**: JWT認証、RBAC実装
2. **仕様書CRUD API**: 仕様書の作成・取得・更新・削除
3. **スキーマ管理API**: スキーマのCRUD操作
4. **バリデーションエンジン**: 必須項目チェック
5. **バージョン管理エンジン**: メジャー/マイナーバージョン判定

**参照**: `docs/implementation-strategy.md` Phase 2

---

## チェックリスト

Phase 1完了前に以下を確認してください:

- [ ] 12エンティティのテーブルが存在する
- [ ] Enum型（3個）が存在する
- [ ] インデックスがすべて設定されている
- [ ] 外部キー制約が正しく設定されている
- [ ] シードデータが投入されている
- [ ] 自動テストが全て成功する（`npm test`）
- [ ] Prisma Studio でデータを確認できる
- [ ] テスト仕様書を確認した
- [ ] セキュリティ注意事項を理解した

---

**実装者**: Claude Code
**レビュー**: 未実施
**承認**: 未実施
