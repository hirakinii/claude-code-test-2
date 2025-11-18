# Phase 4 テスト実装レポート

**作成日**: 2025-11-18
**Phase**: Phase 4 - 統合・テスト
**ステータス**: ✅ 完了

---

## 概要

Phase 4 では、バックエンド・フロントエンド・E2Eの包括的なテスト実装を行いました。本ドキュメントでは、実装したテストの詳細と実行方法を記載します。

---

## 実装したテスト

### 1. バックエンドユニットテスト

#### 1.1. version.service.spec.ts

**テスト対象**: バージョン管理エンジン
**テストケース数**: 15

- 必須項目チェック機能
- バージョン計算機能（メジャー/マイナー）
- 完了率計算機能

**実行方法**:
```bash
npm run test:backend -- version.service.spec.ts
```

#### 1.2. validation.spec.ts

**テスト対象**: バリデーションユーティリティ
**テストケース数**: 20+

- ログイン/登録スキーマのバリデーション
- 仕様書作成/更新スキーマのバリデーション
- Zodエラーフォーマット

**実行方法**:
```bash
npm run test:backend -- validation.spec.ts
```

### 2. バックエンド統合テスト

#### 2.1. auth.test.ts

**テスト対象**: 認証API
**テストケース数**: 15

- ユーザー登録（正常系・異常系）
- ログイン（正常系・異常系）
- 現在のユーザー情報取得

**実行方法**:
```bash
npm run test:backend -- auth.test.ts
```

#### 2.2. specification.test.ts

**テスト対象**: 仕様書API
**テストケース数**: 25+

- 仕様書のCRUD操作
- 権限チェック
- バージョン管理
- ページネーション
- フィルタリング

**実行方法**:
```bash
npm run test:backend -- specification.test.ts
```

#### 2.3. schema.test.ts

**テスト対象**: スキーマAPI
**テストケース数**: 10

- デフォルトスキーマ取得
- スキーマ更新（管理者のみ）
- 権限チェック

**実行方法**:
```bash
npm run test:backend -- schema.test.ts
```

#### 2.4. security.test.ts

**テスト対象**: セキュリティ
**テストケース数**: 20+

- SQLインジェクション対策
- XSS対策
- 認証・認可
- 入力バリデーション
- レート制限
- HTTPヘッダーセキュリティ
- エラーメッセージの安全性

**実行方法**:
```bash
npm run test:backend -- security.test.ts
```

### 3. フロントエンドユニットテスト

#### 3.1. Button.test.tsx

**テスト対象**: Buttonコンポーネント
**テストケース数**: 8

- レンダリング
- クリックイベント
- loading状態
- variantとcolorプロパティ

**実行方法**:
```bash
npm run test:frontend -- Button.test.tsx
```

#### 3.2. Input.test.tsx

**テスト対象**: Inputコンポーネント
**テストケース数**: 10

- ラベル表示
- 入力変更
- エラー表示
- バリデーション

**実行方法**:
```bash
npm run test:frontend -- Input.test.tsx
```

#### 3.3. useAutoSave.test.ts

**テスト対象**: useAutoSaveフック
**テストケース数**: 11

- LocalStorageへの自動保存
- データの読み込み・削除
- デバウンス機能
- エラーハンドリング

**実行方法**:
```bash
npm run test:frontend -- useAutoSave.test.ts
```

#### 3.4. validation.test.ts & formatting.test.ts

**テスト対象**: フロントエンドユーティリティ
**テストケース数**: 30+

- 必須項目バリデーション
- メール/URL/日付バリデーション
- 日付・ファイルサイズ・数値フォーマット

**実行方法**:
```bash
npm run test:frontend -- validation.test.ts
npm run test:frontend -- formatting.test.ts
```

### 4. E2Eテスト

#### 4.1. auth.spec.ts

**テスト対象**: 認証フロー
**テストケース数**: 3

- ユーザー登録からログインまでの完全なフロー
- 無効な認証情報でのログイン失敗
- バリデーションエラー表示

**実行方法**:
```bash
npm run test:e2e -- auth.spec.ts
```

#### 4.2. specification.spec.ts

**テスト対象**: 仕様書作成フロー
**テストケース数**: 5

- 仕様書の作成から保存までの完全なフロー
- 必須項目バリデーション
- 自動保存機能
- 仕様書の編集
- 仕様書の削除

**実行方法**:
```bash
npm run test:e2e -- specification.spec.ts
```

---

## テスト実行方法

### 全テストを実行

```bash
# Jestテスト（バックエンド + フロントエンド）
npm test

# バックエンドテストのみ
npm run test:backend

# フロントエンドテストのみ
npm run test:frontend

# E2Eテスト
npm run test:e2e
```

### ウォッチモード

```bash
npm run test:watch
```

### カバレッジレポート

```bash
npm test -- --coverage
```

### E2Eテスト（デバッグモード）

```bash
npm run test:e2e:debug
```

---

## テスト環境

### 必要な環境変数

```bash
# テスト用データベース
DATABASE_URL="postgresql://postgres:password@localhost:5432/spec_manager_test"

# JWT設定
JWT_SECRET="test-jwt-secret-min-32-characters-long-for-testing"
JWT_EXPIRES_IN=7d

# その他
NODE_ENV=test
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=error
```

### 環境構築手順

```bash
# 1. テスト用データベース作成
createdb spec_manager_test

# 2. 環境変数設定
cp .env.example .env.test
# .env.test ファイルを編集

# 3. マイグレーション実行
DATABASE_URL="..." npm run db:migrate:dev

# 4. シードデータ投入
DATABASE_URL="..." npm run db:seed

# 5. テスト実行
npm test
```

---

## テストカバレッジ

### 目標

| カテゴリ | 目標 | 現状 |
|---------|------|------|
| Branches | 70% | 実測値待ち |
| Functions | 70% | 実測値待ち |
| Lines | 70% | 実測値待ち |
| Statements | 70% | 実測値待ち |

### カバレッジ測定

```bash
npm test -- --coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成されます。

---

## テスト構成

```
.
├── __mocks__/
│   └── fileMock.js                  # 静的ファイルのモック
├── e2e/                              # E2Eテスト
│   ├── auth.spec.ts                 # 認証フロー
│   └── specification.spec.ts        # 仕様書作成フロー
├── prisma/tests/                     # データベーステスト
│   ├── setup.ts
│   ├── schema.test.ts
│   ├── seed.test.ts
│   └── constraints.test.ts
├── src/backend/tests/                # バックエンドテスト
│   ├── setup.ts
│   ├── auth.test.ts                 # 認証API統合テスト
│   ├── specification.test.ts        # 仕様書API統合テスト
│   ├── schema.test.ts               # スキーマAPI統合テスト
│   └── security.test.ts             # セキュリティテスト
├── src/backend/services/
│   └── version.service.spec.ts      # バージョン管理ユニットテスト
├── src/backend/utils/
│   └── validation.spec.ts           # バリデーションユニットテスト
├── src/frontend/tests/               # フロントエンドテスト
│   └── setup.ts
├── src/frontend/components/common/
│   ├── Button.test.tsx
│   └── Input.test.tsx
├── src/frontend/hooks/
│   └── useAutoSave.test.ts
├── src/frontend/utils/
│   ├── validation.test.ts
│   └── formatting.test.ts
├── jest.config.js                    # Jest設定
└── playwright.config.ts              # Playwright設定
```

---

## CI/CD統合

### GitHub Actions設定例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate:dev
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/spec_manager_test

      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/spec_manager_test
          JWT_SECRET: test-secret-key-for-ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

```
Error: DATABASE_URL is not set
```

**解決方法**: `.env`ファイルに`DATABASE_URL`を設定してください。

#### 2. Jest ESMエラー

```
SyntaxError: Cannot use import statement outside a module
```

**解決方法**: `jest.config.js`で`preset: 'ts-jest/presets/default-esm'`を使用しています。問題が続く場合は設定を確認してください。

#### 3. E2Eテストのタイムアウト

```
Error: Timeout 30000ms exceeded
```

**解決方法**: `playwright.config.ts`の`timeout`設定を増やすか、サーバーの起動を確認してください。

---

## 次のステップ

1. **カバレッジの改善**: 70%目標に対して不足している箇所を特定し、テストを追加
2. **パフォーマンステスト**: APIレスポンスタイムの測定
3. **ビジュアルリグレッションテスト**: スクリーンショット比較
4. **アクセシビリティテスト**: WCAG準拠の確認

---

## まとめ

Phase 4 では、バックエンド・フロントエンド・E2Eの包括的なテストを実装しました。

**実装したテスト総数**: 120+ テストケース

**カテゴリ別内訳**:
- バックエンドユニットテスト: 35テストケース
- バックエンド統合テスト: 70テストケース
- フロントエンドユニットテスト: 59テストケース
- E2Eテスト: 8テストケース

これにより、アプリケーションの品質を保証し、リグレッションを防止する体制が整いました。
