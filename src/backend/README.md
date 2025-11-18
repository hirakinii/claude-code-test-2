# Backend API - Phase 2 実装完了

**実装日**: 2025-11-18
**フェーズ**: Phase 2 - バックエンドAPI（4-5週間）
**参照**: `docs/implementation-strategy.md` Phase 2

---

## 実装概要

Phase 2では、仕様書作成支援アプリのバックエンドAPIを完全に実装しました。

### 実装内容

✅ **完了項目**:

1. **Express サーバー基本設定**: CORS、Helmet、レート制限
2. **認証・認可**: JWT + bcrypt + RBAC
3. **バリデーション**: Zod による型安全なバリデーション
4. **仕様書CRUD API**: 作成、取得、更新、削除
5. **スキーマ管理API**: デフォルトスキーマ取得、更新（管理者のみ）
6. **バージョン管理エンジン**: 必須項目充足度によるメジャー/マイナーバージョン管理
7. **エクスポート機能**: Markdown形式のエクスポート（PDF/Wordは未実装）
8. **エラーハンドリング**: カスタムエラークラス、統一されたエラーレスポンス
9. **ロギング**: Winston による構造化ログ、監査ログ
10. **APIテスト仕様書**: 包括的なテストケース定義
11. **自動テスト**: 認証APIの基本テスト（Jest + Supertest）

---

## ディレクトリ構造

```
src/backend/
├── config/               # 設定ファイル
│   ├── env.ts           # 環境変数の型定義と検証
│   └── logger.ts        # Winston ロガー設定
├── controllers/          # ルートハンドラー
│   ├── auth.controller.ts
│   ├── specification.controller.ts
│   ├── schema.controller.ts
│   └── export.controller.ts
├── middleware/           # ミドルウェア
│   ├── auth.ts          # 認証・認可（JWT、RBAC）
│   ├── errorHandler.ts  # エラーハンドリング
│   └── validate.ts      # Zod バリデーション
├── routes/               # ルーティング定義
│   ├── auth.routes.ts
│   ├── specification.routes.ts
│   └── schema.routes.ts
├── services/             # ビジネスロジック
│   ├── auth.service.ts
│   ├── specification.service.ts
│   ├── schema.service.ts
│   ├── version.service.ts
│   └── export.service.ts
├── utils/                # ユーティリティ
│   ├── prisma.ts        # Prisma クライアントシングルトン
│   └── validation.ts    # Zod バリデーションスキーマ
├── errors/               # カスタムエラー
│   └── AppError.ts
├── types/                # 型定義
│   ├── express.d.ts     # Express型拡張
│   ├── auth.ts
│   └── api.ts
├── tests/                # テスト
│   └── auth.test.ts
├── app.ts                # Express アプリケーション
└── server.ts             # サーバーエントリーポイント
```

---

## 技術スタック

### Backend

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| ランタイム | Node.js | 20 LTS |
| 言語 | TypeScript | 5.3+ |
| フレームワーク | Express.js | 4.18+ |
| ORM | Prisma | 5.22+ |
| 認証 | JWT + bcrypt | - |
| バリデーション | Zod | 3.22+ |
| ログ | Winston | 3.11+ |
| テスト | Jest + Supertest | 29.7+ |

### セキュリティ

| 項目 | 実装 |
|-----|------|
| 認証 | JWT (Bearer Token) |
| パスワードハッシュ | bcrypt (コスト12) |
| 認可 | RBAC (Role-Based Access Control) |
| レート制限 | express-rate-limit |
| セキュアヘッダー | Helmet |
| CORS | cors ミドルウェア |

---

## API エンドポイント

### 認証 API

| エンドポイント | メソッド | 説明 | 認証 |
|-------------|---------|------|------|
| `/api/auth/register` | POST | ユーザー登録 | - |
| `/api/auth/login` | POST | ログイン | - |
| `/api/auth/me` | GET | 現在のユーザー情報取得 | ✓ |
| `/api/auth/logout` | POST | ログアウト | ✓ |

### 仕様書 API

| エンドポイント | メソッド | 説明 | 認証 |
|-------------|---------|------|------|
| `/api/specifications` | POST | 仕様書作成 | ✓ |
| `/api/specifications` | GET | 仕様書一覧取得 | ✓ |
| `/api/specifications/:id` | GET | 仕様書詳細取得 | ✓ |
| `/api/specifications/:id` | PUT | 仕様書更新 | ✓ |
| `/api/specifications/:id` | DELETE | 仕様書削除 | ✓ |
| `/api/specifications/:id/export` | GET | 仕様書エクスポート | ✓ |

### スキーマ API

| エンドポイント | メソッド | 説明 | 認証 | 権限 |
|-------------|---------|------|------|------|
| `/api/schema` | GET | デフォルトスキーマ取得 | ✓ | - |
| `/api/schemas/list` | GET | スキーマ一覧取得 | ✓ | - |
| `/api/schemas/:id` | GET | スキーマ詳細取得 | ✓ | - |
| `/api/schemas/:id` | PUT | スキーマ更新 | ✓ | Admin |
| `/api/schema/reset` | POST | デフォルトスキーマリセット | ✓ | Admin |

---

## セットアップ手順

### 前提条件

- Node.js 20 LTS以上
- PostgreSQL 15以上
- Phase 1 のデータベースセットアップ完了

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集:

```bash
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_dev?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-change-in-production"
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

**セキュリティ注意**: 本番環境では `JWT_SECRET` を必ず変更してください（32文字以上推奨）。

### 3. データベースの準備

```bash
# マイグレーション実行（Phase 1 で完了済みの場合はスキップ）
npm run db:migrate:dev

# シードデータ投入（Phase 1 で完了済みの場合はスキップ）
npm run db:seed

# Prisma クライアント生成
npm run db:generate
```

### 4. サーバー起動

#### 開発環境

```bash
npm run dev
```

サーバーが起動すると以下のように表示されます:

```
🚀 Server is running!

  Environment:  development
  URL:          http://0.0.0.0:3000
  Health Check: http://0.0.0.0:3000/health

  API Endpoints:
  - POST   /api/auth/register
  - POST   /api/auth/login
  - GET    /api/auth/me
  ...
```

#### 本番環境

```bash
# ビルド
npm run build

# 起動
npm start
```

### 5. 動作確認

#### ヘルスチェック

```bash
curl http://localhost:3000/health
```

**期待レスポンス**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T...",
  "uptime": 12.345
}
```

#### ユーザー登録

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "テストユーザー"
  }'
```

#### ログイン

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**レスポンスから `token` を取得して環境変数に設定**:

```bash
export TOKEN="<取得したトークン>"
```

#### 仕様書作成

```bash
curl -X POST http://localhost:3000/api/specifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "テスト仕様書"
  }'
```

---

## テスト

### テスト実行

```bash
# 全テスト実行
npm test

# バックエンドテストのみ
npm run test:backend

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm test -- --coverage
```

### テスト仕様書

詳細なテスト仕様書は `docs/backend-api-test-specification.md` を参照してください。

---

## セキュリティチェックリスト

Phase 2 実装時のセキュリティ対策:

- [x] パスワードのbcryptハッシュ化（コスト12）
- [x] JWT による認証
- [x] RBAC による認可
- [x] SQLインジェクション対策（Prisma ORM のパラメータ化クエリ）
- [x] XSS対策（React自動エスケープ、JSONレスポンス）
- [x] レート制限（一般API: 100req/15min、認証: 5req/15min）
- [x] セキュアHTTPヘッダー（Helmet）
- [x] CORS設定
- [x] 環境変数による設定管理
- [x] エラーメッセージの適切な隠蔽（本番環境）
- [x] 監査ログ記録

---

## パフォーマンス最適化

実装済みの最適化:

- **データベース**: Prismaによる効率的なクエリ、既存のインデックス活用
- **トランザクション**: DELETE & INSERT パターンでのデータ整合性保証
- **ログ**: 構造化ログによる効率的なログ管理

---

## 今後の改善点

### 未実装機能（MVP後）

1. **PDF/Word エクスポート**: Puppeteer/docx ライブラリを使用した実装
2. **キャッシュ**: Redis を使用したスキーマ定義のキャッシュ
3. **非同期ジョブ**: Bull を使用した重い処理のバックグラウンド実行
4. **全文検索**: Elasticsearch を使用した高度な検索機能
5. **リアルタイム通知**: WebSocket を使用した通知機能

### 追加テスト

- 仕様書APIの統合テスト
- スキーマAPIのテスト
- エクスポート機能のテスト
- パフォーマンステスト

---

## トラブルシューティング

### エラー: `JWT_SECRET must be at least 32 characters`

**原因**: 環境変数 `JWT_SECRET` が短すぎる

**解決策**: `.env` ファイルで32文字以上の値を設定
```bash
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
```

### エラー: `P1001: Can't reach database server`

**原因**: PostgreSQL が起動していない、または接続情報が誤っている

**解決策**:
1. PostgreSQL の起動確認
2. `.env` の `DATABASE_URL` を確認

### エラー: `Default schema not found`

**原因**: シードデータが投入されていない

**解決策**:
```bash
npm run db:seed
```

---

## 次のステップ: Phase 3 - フロントエンド実装

Phase 2 が完了しました。次は Phase 3 に進みます:

1. **React + TypeScript フロントエンド実装**
2. **動的フォーム生成**
3. **自動保存・復元機能**
4. **ウィザードUI実装**
5. **管理画面実装**

**参照**: `docs/implementation-strategy.md` Phase 3

---

## 貢献者

**実装者**: Claude Code
**レビュー**: 未実施
**承認**: 未実施

---

**最終更新**: 2025-11-18
