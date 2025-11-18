# Backend API テスト仕様書

**文書バージョン**: 1.0
**作成日**: 2025-11-18
**対象**: Phase 2 - バックエンドAPI
**参照**: `docs/implementation-strategy.md` Phase 2

---

## 目次

1. [概要](#1-概要)
2. [テスト環境](#2-テスト環境)
3. [認証APIテスト](#3-認証apiテスト)
4. [仕様書APIテスト](#4-仕様書apiテスト)
5. [スキーマAPIテスト](#5-スキーマapiテスト)
6. [セキュリティテスト](#6-セキュリティテスト)
7. [パフォーマンステスト](#7-パフォーマンステスト)
8. [統合テスト](#8-統合テスト)

---

## 1. 概要

### 1.1. テストの目的

Phase 2 で実装したバックエンドAPIの機能、セキュリティ、パフォーマンスを検証する。

### 1.2. テスト範囲

| カテゴリ | 説明 |
|---------|------|
| **ユニットテスト** | 個別の関数・メソッドの動作検証 |
| **統合テスト** | APIエンドポイントの動作検証 |
| **セキュリティテスト** | OWASP Top 10 対策の検証 |
| **パフォーマンステスト** | レスポンスタイムの検証 |

### 1.3. テストツール

- **Jest**: ユニットテスト・統合テストフレームワーク
- **Supertest**: HTTPリクエストテスト
- **ts-jest**: TypeScript対応

---

## 2. テスト環境

### 2.1. 環境変数

```bash
NODE_ENV=test
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_test"
JWT_SECRET="test-jwt-secret-min-32-characters-long-for-testing"
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=error
```

### 2.2. セットアップ手順

```bash
# テスト用データベース作成
createdb spec_manager_test

# 環境変数設定
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_test"

# マイグレーション実行
npm run db:migrate:dev

# シードデータ投入
npm run db:seed

# テスト実行
npm run test:backend
```

---

## 3. 認証APIテスト

### 3.1. ユーザー登録 (POST /api/auth/register)

#### テストケース 3.1.1: 正常系 - 新規ユーザー登録

**目的**: 新規ユーザーを正常に登録できることを確認

**リクエスト**:
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "fullName": "テストユーザー"
}
```

**期待結果**:
- ステータスコード: 201
- レスポンス:
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": "<UUID>",
      "email": "test@example.com",
      "full_name": "テストユーザー",
      "roles": ["creator"]
    },
    "token": "<JWT>",
    "expiresIn": "7d"
  }
}
```
- データベースに新規ユーザーが作成される
- パスワードがbcryptでハッシュ化されている
- デフォルトで `creator` ロールが付与される

#### テストケース 3.1.2: 異常系 - メールアドレス重複

**目的**: 既存のメールアドレスで登録できないことを確認

**前提条件**: `test@example.com` が既に登録済み

**リクエスト**:
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "fullName": "重複ユーザー"
}
```

**期待結果**:
- ステータスコード: 409
- レスポンス:
```json
{
  "status": "error",
  "message": "Email already exists"
}
```

#### テストケース 3.1.3: 異常系 - バリデーションエラー

**目的**: 入力値の検証が正しく機能することを確認

**テストデータ**:

| フィールド | 値 | 期待エラー |
|-----------|-----|-----------|
| email | "invalid-email" | Invalid email address |
| password | "short" | Password must be at least 8 characters |
| password | "nouppercase123" | Password must contain at least one uppercase letter |
| fullName | "" | Full name is required |

**期待結果**:
- ステータスコード: 422
- レスポンス:
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"]
  }
}
```

### 3.2. ログイン (POST /api/auth/login)

#### テストケース 3.2.1: 正常系 - ログイン成功

**目的**: 正しいメールアドレスとパスワードでログインできることを確認

**前提条件**: `test@example.com` が登録済み

**リクエスト**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

**期待結果**:
- ステータスコード: 200
- レスポンス: JWTトークンを含む
- トークンの検証が成功する

#### テストケース 3.2.2: 異常系 - パスワード誤り

**目的**: 誤ったパスワードでログインできないことを確認

**リクエスト**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "WrongPassword"
}
```

**期待結果**:
- ステータスコード: 401
- レスポンス:
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

#### テストケース 3.2.3: 異常系 - ユーザー不存在

**目的**: 存在しないユーザーでログインできないことを確認

**リクエスト**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "nonexistent@example.com",
  "password": "Password123"
}
```

**期待結果**:
- ステータスコード: 401
- レスポンス:
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### 3.3. 現在のユーザー情報取得 (GET /api/auth/me)

#### テストケース 3.3.1: 正常系 - 認証済みユーザー

**目的**: JWTトークンで認証されたユーザー情報を取得できることを確認

**リクエスト**:
```http
GET /api/auth/me
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス: ユーザー情報（パスワードハッシュは含まない）

#### テストケース 3.3.2: 異常系 - トークンなし

**目的**: トークンなしでアクセスできないことを確認

**リクエスト**:
```http
GET /api/auth/me
```

**期待結果**:
- ステータスコード: 401
- レスポンス:
```json
{
  "status": "error",
  "message": "No token provided"
}
```

#### テストケース 3.3.3: 異常系 - 無効なトークン

**目的**: 無効なトークンでアクセスできないことを確認

**リクエスト**:
```http
GET /api/auth/me
Authorization: Bearer invalid-token
```

**期待結果**:
- ステータスコード: 401
- レスポンス:
```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

---

## 4. 仕様書APIテスト

### 4.1. 仕様書作成 (POST /api/specifications)

#### テストケース 4.1.1: 正常系 - 最小限のデータで作成

**目的**: 最小限のデータで仕様書を作成できることを確認

**リクエスト**:
```json
POST /api/specifications
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "テスト仕様書"
}
```

**期待結果**:
- ステータスコード: 201
- レスポンス: 作成された仕様書
- デフォルトスキーマが使用される
- ステータスは `editing`
- バージョンは `1.0`

#### テストケース 4.1.2: 正常系 - スキーマ指定で作成

**目的**: 特定のスキーマを指定して作成できることを確認

**リクエスト**:
```json
POST /api/specifications
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "schema_id": "<SCHEMA_UUID>",
  "title": "カスタムスキーマ仕様書"
}
```

**期待結果**:
- ステータスコード: 201
- 指定されたスキーマが使用される

#### テストケース 4.1.3: 異常系 - 認証なし

**目的**: 認証なしでは作成できないことを確認

**リクエスト**:
```json
POST /api/specifications
Content-Type: application/json

{
  "title": "テスト仕様書"
}
```

**期待結果**:
- ステータスコード: 401

### 4.2. 仕様書一覧取得 (GET /api/specifications)

#### テストケース 4.2.1: 正常系 - 自分の仕様書一覧取得

**目的**: 自分が作成した仕様書の一覧を取得できることを確認

**前提条件**: ユーザーが3件の仕様書を作成済み

**リクエスト**:
```http
GET /api/specifications
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス: 3件の仕様書を含む
- 他のユーザーの仕様書は含まれない

#### テストケース 4.2.2: 正常系 - ページネーション

**目的**: ページネーションが正しく機能することを確認

**リクエスト**:
```http
GET /api/specifications?page=1&pageSize=10
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス:
```json
{
  "status": "success",
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 25,
    "totalPages": 3
  }
}
```

#### テストケース 4.2.3: 正常系 - ステータスフィルタ

**目的**: ステータスでフィルタできることを確認

**リクエスト**:
```http
GET /api/specifications?status=saved
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス: `status=saved` の仕様書のみ

### 4.3. 仕様書取得 (GET /api/specifications/:id)

#### テストケース 4.3.1: 正常系 - 自分の仕様書取得

**目的**: 自分が作成した仕様書の詳細を取得できることを確認

**リクエスト**:
```http
GET /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス: 仕様書の完全なデータ（コンテンツ、納品物等を含む）

#### テストケース 4.3.2: 異常系 - 他人の仕様書にアクセス

**目的**: 他人の仕様書にアクセスできないことを確認

**前提条件**: 別のユーザーが作成した仕様書

**リクエスト**:
```http
GET /api/specifications/<OTHER_USER_SPEC_ID>
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 403
- レスポンス:
```json
{
  "status": "error",
  "message": "You do not have permission to access this resource"
}
```

#### テストケース 4.3.3: 異常系 - 存在しない仕様書

**目的**: 存在しない仕様書IDでエラーになることを確認

**リクエスト**:
```http
GET /api/specifications/00000000-0000-0000-0000-000000000000
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 404

### 4.4. 仕様書更新 (PUT /api/specifications/:id)

#### テストケース 4.4.1: 正常系 - タイトル更新

**目的**: 仕様書のタイトルを更新できることを確認

**リクエスト**:
```json
PUT /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "更新されたタイトル"
}
```

**期待結果**:
- ステータスコード: 200
- タイトルが更新される
- バージョンがインクリメントされる

#### テストケース 4.4.2: 正常系 - コンテンツ更新（必須項目すべて入力）

**目的**: 必須項目をすべて入力した場合、メジャーバージョンが更新されることを確認

**前提条件**: 現在のバージョンが `1.0`

**リクエスト**:
```json
PUT /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "content": [
    { "field_id": "<REQUIRED_FIELD_1>", "value": "値1" },
    { "field_id": "<REQUIRED_FIELD_2>", "value": "値2" },
    ...
  ],
  "deliverables": [...],
  "business_tasks": [...]
}
```

**期待結果**:
- ステータスコード: 200
- バージョンが `2.0` に更新される
- ステータスが `saved` になる

#### テストケース 4.4.3: 正常系 - コンテンツ更新（必須項目に未入力あり）

**目的**: 必須項目に未入力がある場合、マイナーバージョンが更新されることを確認

**前提条件**: 現在のバージョンが `1.0`

**リクエスト**:
```json
PUT /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "content": [
    { "field_id": "<REQUIRED_FIELD_1>", "value": "値1" }
    // REQUIRED_FIELD_2 が未入力
  ]
}
```

**期待結果**:
- ステータスコード: 200
- バージョンが `1.1` に更新される
- ステータスが `editing` のまま

#### テストケース 4.4.4: 正常系 - トランザクションの整合性

**目的**: DELETE & INSERT パターンが正しく動作することを確認

**リクエスト**:
```json
PUT /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "deliverables": [
    { "name": "納品物A", "quantity": 1, "description": "説明A" },
    { "name": "納品物B", "quantity": 2, "description": "説明B" }
  ]
}
```

**期待結果**:
- ステータスコード: 200
- 既存の納品物が削除される
- 新しい納品物が挿入される
- トランザクション内で実行される（途中でエラーが発生した場合はロールバック）

#### テストケース 4.4.5: 異常系 - 他人の仕様書を更新

**目的**: 他人の仕様書を更新できないことを確認

**リクエスト**:
```json
PUT /api/specifications/<OTHER_USER_SPEC_ID>
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "不正な更新"
}
```

**期待結果**:
- ステータスコード: 403

### 4.5. 仕様書削除 (DELETE /api/specifications/:id)

#### テストケース 4.5.1: 正常系 - 自分の仕様書削除

**目的**: 自分が作成した仕様書を削除できることを確認

**リクエスト**:
```http
DELETE /api/specifications/<SPEC_ID>
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- データベースから仕様書が削除される
- CASCADE により関連データも削除される

#### テストケース 4.5.2: 異常系 - 他人の仕様書を削除

**目的**: 他人の仕様書を削除できないことを確認

**リクエスト**:
```http
DELETE /api/specifications/<OTHER_USER_SPEC_ID>
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 403

### 4.6. 仕様書エクスポート (GET /api/specifications/:id/export)

#### テストケース 4.6.1: 正常系 - Markdownエクスポート

**目的**: 仕様書をMarkdown形式でエクスポートできることを確認

**リクエスト**:
```http
GET /api/specifications/<SPEC_ID>/export?format=markdown
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- Content-Type: `text/markdown; charset=utf-8`
- レスポンス: Markdown形式のテキスト

#### テストケース 4.6.2: 異常系 - 未実装フォーマット

**目的**: PDF/Word形式はまだ未実装であることを確認

**リクエスト**:
```http
GET /api/specifications/<SPEC_ID>/export?format=pdf
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 400
- レスポンス:
```json
{
  "status": "error",
  "message": "PDF export is not implemented yet. Please use Markdown export."
}
```

---

## 5. スキーマAPIテスト

### 5.1. デフォルトスキーマ取得 (GET /api/schema)

#### テストケース 5.1.1: 正常系 - デフォルトスキーマ取得

**目的**: デフォルトスキーマを取得できることを確認

**リクエスト**:
```http
GET /api/schema
Authorization: Bearer <JWT>
```

**期待結果**:
- ステータスコード: 200
- レスポンス: デフォルトスキーマ（カテゴリ、フィールド含む）

### 5.2. スキーマ更新 (PUT /api/schemas/:id)

#### テストケース 5.2.1: 正常系 - 管理者によるスキーマ更新

**目的**: 管理者がスキーマを更新できることを確認

**前提条件**: ログインユーザーが `administrator` ロール

**リクエスト**:
```json
PUT /api/schemas/<SCHEMA_ID>
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "schema_name": "更新されたスキーマ",
  "categories": [...]
}
```

**期待結果**:
- ステータスコード: 200
- スキーマが更新される

#### テストケース 5.2.2: 異常系 - 一般ユーザーによるスキーマ更新

**目的**: 一般ユーザーがスキーマを更新できないことを確認

**前提条件**: ログインユーザーが `creator` ロールのみ

**リクエスト**:
```json
PUT /api/schemas/<SCHEMA_ID>
Authorization: Bearer <USER_JWT>
Content-Type: application/json

{
  "schema_name": "不正な更新"
}
```

**期待結果**:
- ステータスコード: 403
- レスポンス:
```json
{
  "status": "error",
  "message": "Insufficient permissions"
}
```

---

## 6. セキュリティテスト

### 6.1. SQLインジェクション対策

#### テストケース 6.1.1: SQLインジェクション攻撃

**目的**: SQLインジェクションが防止されることを確認

**リクエスト**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com' OR '1'='1",
  "password": "anything"
}
```

**期待結果**:
- ステータスコード: 401
- SQLインジェクション攻撃が失敗する
- Prisma ORM のパラメータ化クエリにより防止

### 6.2. XSS対策

#### テストケース 6.2.1: XSSスクリプト挿入

**目的**: XSS攻撃が防止されることを確認

**リクエスト**:
```json
POST /api/specifications
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "<script>alert('XSS')</script>"
}
```

**期待結果**:
- ステータスコード: 201
- スクリプトがそのまま文字列として保存される
- フロントエンドで自動エスケープされる

### 6.3. CSRF対策

**注意**: JWT認証を使用しているため、CSRF攻撃のリスクは低い（Cookieベース認証の場合は対策必要）

### 6.4. レート制限

#### テストケース 6.4.1: レート制限の動作確認

**目的**: レート制限が正しく機能することを確認

**リクエスト**: 同一IPから15分以内に100回以上のリクエスト

**期待結果**:
- 101回目のリクエスト: ステータスコード 429
- レスポンス:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

#### テストケース 6.4.2: 認証エンドポイントの厳格なレート制限

**目的**: ログインエンドポイントで厳格なレート制限が機能することを確認

**リクエスト**: 15分以内に5回以上のログイン試行

**期待結果**:
- 6回目のリクエスト: ステータスコード 429

---

## 7. パフォーマンステスト

### 7.1. APIレスポンスタイム

#### テストケース 7.1.1: 仕様書一覧取得のレスポンスタイム

**目的**: 仕様書一覧取得が200ms以内に完了することを確認

**前提条件**: データベースに10,000件の仕様書が存在

**リクエスト**:
```http
GET /api/specifications?page=1&pageSize=20
Authorization: Bearer <JWT>
```

**期待結果**:
- レスポンスタイム < 200ms (p95)

#### テストケース 7.1.2: データベースクエリのパフォーマンス

**目的**: インデックスが効果的に使用されることを確認

**検証方法**: PostgreSQLの `EXPLAIN ANALYZE` を使用

**期待結果**:
- `idx_specifications_author_updated` インデックスが使用される
- クエリ実行時間 < 50ms

---

## 8. 統合テスト

### 8.1. エンドツーエンドフロー

#### テストケース 8.1.1: 仕様書作成から削除までの完全フロー

**目的**: 仕様書のライフサイクル全体が正しく動作することを確認

**フロー**:
1. ユーザー登録
2. ログイン
3. 仕様書作成
4. 仕様書更新（コンテンツ入力）
5. 仕様書取得
6. 仕様書エクスポート
7. 仕様書削除

**期待結果**:
- すべてのステップが成功する
- データの整合性が保たれる

---

## まとめ

本テスト仕様書は、Phase 2 で実装したバックエンドAPIの品質を保証するための包括的なテストケースを定義している。

**重要ポイント**:
- 認証・認可の徹底的なテスト
- トランザクションの整合性検証
- セキュリティ対策の検証
- パフォーマンス要件の確認

次のステップでは、この仕様書に基づいて自動テストを実装する。
