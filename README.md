# 仕様書作成・管理アプリケーション

仕様書の作成・管理を支援するWebアプリケーションです。セキュリティ、スケーラビリティ、監査可能性を重視した設計で、1万ユーザーの同時接続に対応します。

## プロジェクト概要

このアプリケーションは、開発チームが効率的に仕様書を作成・管理できるように設計されています。

### 実装状況

- ✅ **Phase 0**: 基盤整備（完了）
- ✅ **Phase 1**: データベース層（完了）
- ✅ **Phase 2**: バックエンドAPI（完了）
- ✅ **Phase 3**: フロントエンド実装（完了）
- 🚧 **Phase 4**: 統合・テスト（未着手）
- 🚧 **Phase 5**: デプロイメント（未着手）

### 主な特徴

- ✅ セキュアな認証・認可システム（JWT + bcrypt + RBAC）
- ✅ スケーラブルなアーキテクチャ（1万ユーザー同時接続対応）
- ✅ 完全な監査ログ機能
- ✅ バージョン管理エンジン（メジャー/マイナー自動判定）
- ✅ メタモデル・アーキテクチャ（動的スキーマ定義）
- ✅ ウィザード形式の仕様書作成UI
- ✅ 自動保存機能（LocalStorage + サーバー永続化）
- ✅ レスポンシブデザイン（モバイル/タブレット/デスクトップ対応）
- 🚧 リアルタイムコラボレーション（未実装）

## 技術スタック

### Backend ✅
- **言語・ランタイム**: Node.js 20 LTS + TypeScript 5.3+
- **フレームワーク**: Express.js 4.18+
- **データベース**: PostgreSQL 15+
- **ORM**: Prisma 5.22+
- **認証**: JWT + bcrypt
- **バリデーション**: Zod 3.22+
- **ログ**: Winston 3.11+
- **テスト**: Jest 29.7+ + Supertest 6.3+

### Frontend ✅
- **フレームワーク**: React 18 + TypeScript 5.3+
- **ビルドツール**: Vite 5.0+
- **状態管理**: Redux Toolkit 2.0+
- **ルーティング**: React Router 6.21+
- **UI ライブラリ**: Material-UI (MUI) 5.15+
- **フォーム**: React Hook Form 7.49+
- **HTTP クライアント**: Axios 1.6+

### インフラストラクチャ 🚧
- **クラウドプロバイダー**: Google Cloud
- **コンテナ**: Cloud Run（未実装）
- **CI/CD**: Cloud Build（未実装）

## セットアップ

### 前提条件

- Node.js (v18以上推奨)
- PostgreSQL (v14以上推奨)
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd claude-code-test-2

# 依存パッケージのインストール
npm install

# Prisma クライアント生成
npm run db:generate

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集して必要な環境変数を設定
```

### 環境変数

以下の環境変数を `.env` ファイルに設定してください：

```bash
# Environment
NODE_ENV=development

# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_dev?schema=public"

# JWT（本番環境では必ず変更すること）
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-change-in-production"
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**セキュリティ注意**: 本番環境では `JWT_SECRET` を必ず変更してください（32文字以上推奨）。

### データベースのセットアップ

```bash
# PostgreSQL データベース作成
createdb spec_manager_dev

# マイグレーションの実行
npm run db:migrate:dev

# シードデータの投入（必須）
npm run db:seed
```

### アプリケーションの起動

#### 開発環境（フルスタック）

```bash
# バックエンド + フロントエンドを同時起動
npm run dev

# バックエンドのみ
npm run dev:backend

# フロントエンドのみ
npm run dev:frontend
```

起動後、以下のURLでアクセスできます：
- フロントエンド: `http://localhost:5173`
- バックエンドAPI: `http://localhost:3000`

#### 本番ビルド

```bash
# バックエンド + フロントエンドをビルド
npm run build

# バックエンドのみビルド
npm run build:backend

# フロントエンドのみビルド
npm run build:frontend

# 本番モードで起動
npm start
```

#### 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# ユーザー登録
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "テストユーザー"
  }'
```

## 開発ガイドライン

### 開発原則

1. **セキュリティファースト**: OWASP Top 10の脆弱性を防ぐ
2. **スケーラビリティ設計**: 効率的なクエリとキャッシュ戦略
3. **監査可能性**: 全ての重要な操作をログ記録

詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

### コーディング規約

- 型安全性を最大限活用（`any`型は最小限に）
- 厳格なTypeScript設定（`strict: true`）
- 全ての非同期処理で適切なエラーハンドリング
- 明確で説明的なコミットメッセージ

### テスト

```bash
# 全てのテストを実行
npm test

# バックエンドテストのみ
npm run test:backend

# ウォッチモード
npm run test:watch

# カバレッジレポート
npm test -- --coverage
```

**テスト仕様書**:
- Phase 1: `docs/database-test-specification.md`
- Phase 2: `docs/backend-api-test-specification.md`

### セキュリティチェックリスト

実装時に以下を確認してください：

- [ ] 入力値の検証とサニタイゼーション
- [ ] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] XSS対策（出力エスケープ）
- [ ] CSRF対策
- [ ] 認証・認可の適切な実装
- [ ] センシティブデータの暗号化
- [ ] APIキーやシークレットの適切な管理
- [ ] レート制限の実装
- [ ] セキュアなHTTPヘッダーの設定

## 禁止事項

以下の行為は厳禁です：

1. **APIキーのハードコーディング**: 環境変数または専用のシークレット管理サービスを使用
2. **本番環境での直接データベース操作**: マイグレーションスクリプトを使用
3. **未テストコードのデプロイ**: 全てのコードに適切なテストを実装

## デプロイメント

### デプロイ手順

1. 全てのテストが成功していることを確認
2. ステージング環境で動作確認
3. セキュリティチェックリストの確認
4. 本番環境へデプロイ
5. デプロイ後の監視とログ確認

### CI/CD

(TBD: CI/CDパイプラインの詳細)

## プロジェクト構成

```
.
├── src/
│   ├── backend/           # バックエンドコード ✅
│   │   ├── config/        # 設定ファイル
│   │   ├── controllers/   # ルートハンドラー
│   │   ├── middleware/    # ミドルウェア
│   │   ├── routes/        # ルーティング定義
│   │   ├── services/      # ビジネスロジック
│   │   ├── utils/         # ユーティリティ
│   │   ├── errors/        # カスタムエラー
│   │   ├── types/         # 型定義
│   │   ├── tests/         # テスト
│   │   ├── app.ts         # Express アプリ
│   │   ├── server.ts      # エントリーポイント
│   │   └── README.md      # バックエンドドキュメント
│   ├── frontend/          # フロントエンドコード 🚧
│   ├── types/             # 共通型定義 ✅
│   └── shared/            # 共通コード
├── prisma/                # Prisma スキーマ ✅
│   ├── schema.prisma      # データベーススキーマ
│   ├── seed.ts            # シードデータ
│   ├── tests/             # データベーステスト
│   └── README.md          # データベースドキュメント
├── docs/                  # ドキュメント
│   ├── implementation-strategy.md             # 実装戦略書
│   ├── backend-api-test-specification.md      # APIテスト仕様書
│   ├── database-test-specification.md         # DBテスト仕様書
│   └── 仕様書作成支援アプリ機能仕様書.md
├── .env.example           # 環境変数のサンプル
├── CLAUDE.md              # Claude Code用のガイドライン
├── package.json           # 依存関係
├── tsconfig.json          # TypeScript設定
├── tsconfig.backend.json  # バックエンドTypeScript設定
└── README.md              # このファイル
```

## ライセンス

(TBD)

## 貢献

(TBD: コントリビューションガイドライン)

## 開発ドキュメント

### Phase 1: データベース層
- 実装完了: ✅
- ドキュメント: `prisma/README.md`
- テスト仕様: `docs/database-test-specification.md`

### Phase 2: バックエンドAPI
- 実装完了: ✅
- ドキュメント: `src/backend/README.md`
- テスト仕様: `docs/backend-api-test-specification.md`
- API エンドポイント:
  - 認証: `/api/auth/*`
  - 仕様書: `/api/specifications/*`
  - スキーマ: `/api/schema/*`

### Phase 3: フロントエンド
- 実装状況: ✅ 完了
- ドキュメント: `src/frontend/` 各ディレクトリ
- テスト仕様: `docs/frontend-test-specification.md`
- 主要機能:
  - 認証UI（ログイン・登録）
  - ダッシュボード（仕様書一覧・検索・エクスポート）
  - ウィザード（ステップ形式の仕様書作成）
  - 管理画面（スキーマ表示・リセット）
  - 自動保存・復元機能
  - レスポンシブデザイン

## 参考リソース

- [実装戦略書](./docs/implementation-strategy.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
