# 仕様書作成・管理アプリケーション

仕様書の作成・管理を支援するWebアプリケーションです。セキュリティ、スケーラビリティ、監査可能性を重視した設計で、1万ユーザーの同時接続に対応します。

## プロジェクト概要

このアプリケーションは、開発チームが効率的に仕様書を作成・管理できるように設計されています。

### 主な特徴

- セキュアな認証・認可システム
- スケーラブルなアーキテクチャ（1万ユーザー同時接続対応）
- 完全な監査ログ機能
- リアルタイムコラボレーション
- バージョン管理

## 技術スタック

### Backend
- **言語・ランタイム**: Node.js + TypeScript
- **フレームワーク**: Express
- **データベース**: PostgreSQL
- **ORM**: (TBD)

### Frontend
- **フレームワーク**: React + TypeScript
- **状態管理**: (TBD)
- **UI ライブラリ**: (TBD)

### インフラストラクチャ
- **クラウドプロバイダー**: Google Cloud
- **コンテナ**: (TBD)
- **CI/CD**: (TBD)

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

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集して必要な環境変数を設定
```

### 環境変数

以下の環境変数を `.env` ファイルに設定してください：

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Application
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Google Cloud (本番環境のみ)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

### データベースのセットアップ

```bash
# マイグレーションの実行
npm run migrate

# シードデータの投入（開発環境のみ）
npm run seed
```

### アプリケーションの起動

```bash
# 開発モード
npm run dev

# 本番モード
npm run build
npm start
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

# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# カバレッジレポート
npm run test:coverage
```

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
│   ├── backend/       # バックエンドコード
│   ├── frontend/      # フロントエンドコード
│   └── shared/        # 共通コード
├── tests/             # テストコード
├── migrations/        # データベースマイグレーション
├── docs/              # ドキュメント
├── .env.example       # 環境変数のサンプル
├── CLAUDE.md          # Claude Code用のガイドライン
└── README.md          # このファイル
```

## ライセンス

(TBD)

## 貢献

(TBD: コントリビューションガイドライン)

## 参考リソース

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
