# フロントエンドテスト仕様書

**文書バージョン**: 1.0
**作成日**: 2025-11-18
**対象**: Phase 3 フロントエンド実装
**参照**: `docs/implementation-strategy.md` Phase 3

---

## 目次

1. [概要](#1-概要)
2. [テスト戦略](#2-テスト戦略)
3. [ユニットテスト仕様](#3-ユニットテスト仕様)
4. [統合テスト仕様](#4-統合テスト仕様)
5. [E2Eテスト仕様](#5-e2eテスト仕様)
6. [テスト環境](#6-テスト環境)

---

## 1. 概要

### 1.1. 目的

Phase 3 で実装したフロントエンドコンポーネント、フック、サービスの品質を保証し、リグレッションを防止する。

### 1.2. 対象範囲

- **共通コンポーネント**: Button, Input, Modal, Card, Loading, ErrorMessage
- **レイアウトコンポーネント**: Header, Sidebar, Layout
- **ダッシュボードコンポーネント**: SpecificationList, StatusBadge
- **ウィザードコンポーネント**: WizardContainer, DynamicField, StepProgress
- **カスタムフック**: useAuth, useAutoSave, useLocalStorage
- **サービス層**: authService, specificationService, schemaService
- **ユーティリティ**: validation, formatting

### 1.3. テスト目標

| 指標 | 目標値 |
|------|--------|
| **ユニットテストカバレッジ** | 80% 以上 |
| **統合テストカバレッジ** | 主要フロー 100% |
| **E2Eテストカバレッジ** | クリティカルパス 100% |

---

## 2. テスト戦略

### 2.1. テストピラミッド

```
        /\
       /  \  E2E テスト (少)
      /    \  - クリティカルパスのみ
     /------\
    /        \ 統合テスト (中)
   /          \ - コンポーネント間連携
  /------------\
 /              \ ユニットテスト (多)
/________________\ - 個別関数・コンポーネント
```

### 2.2. テストツール

| テスト種別 | ツール | 用途 |
|-----------|--------|------|
| ユニットテスト | Jest + React Testing Library | コンポーネント、フック、関数 |
| 統合テスト | Jest + React Testing Library | ページレベルの動作 |
| E2Eテスト | Playwright / Cypress | ユーザーフロー全体 |
| スナップショットテスト | Jest | UI の回帰検証 |

---

## 3. ユニットテスト仕様

### 3.1. 共通コンポーネント

#### 3.1.1. Button コンポーネント

**テストケース**:

```typescript
describe('Button', () => {
  test('renders button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disables button when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('処理中...');
  });

  test('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="contained">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-contained');

    rerender(<Button variant="outlined">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-outlined');
  });
});
```

#### 3.1.2. Input コンポーネント

**テストケース**:

```typescript
describe('Input', () => {
  test('renders input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('updates value on change', () => {
    const handleChange = jest.fn();
    render(<Input value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('shows error message when error prop is true', () => {
    render(<Input error helperText="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('validates required field', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('required');
  });
});
```

### 3.2. カスタムフック

#### 3.2.1. useAutoSave フック

**テストケース**:

```typescript
describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves data to localStorage after debounce delay', async () => {
    const { result } = renderHook(() =>
      useAutoSave('spec-123', { title: 'Test' }, 100)
    );

    await waitFor(() => {
      expect(localStorage.getItem('wizard_data_spec-123')).toBeTruthy();
    }, { timeout: 200 });

    const saved = JSON.parse(localStorage.getItem('wizard_data_spec-123')!);
    expect(saved).toEqual({ title: 'Test' });
  });

  test('loads data from localStorage', () => {
    localStorage.setItem('wizard_data_spec-456', JSON.stringify({ title: 'Loaded' }));

    const { result } = renderHook(() => useAutoSave('spec-456', {}, 100));

    const loaded = result.current.loadFromLocalStorage('spec-456');
    expect(loaded).toEqual({ title: 'Loaded' });
  });

  test('clears data from localStorage', () => {
    localStorage.setItem('wizard_data_spec-789', JSON.stringify({ title: 'Clear Me' }));

    const { result } = renderHook(() => useAutoSave('spec-789', {}, 100));

    result.current.clearLocalStorage('spec-789');
    expect(localStorage.getItem('wizard_data_spec-789')).toBeNull();
  });
});
```

### 3.3. ユーティリティ関数

#### 3.3.1. バリデーション

**テストケース**:

```typescript
describe('validation utils', () => {
  describe('validateRequiredFields', () => {
    const fields: SchemaField[] = [
      { fieldId: 'name', label: '名前', isRequired: true, dataType: FieldDataType.TEXT },
      { fieldId: 'email', label: 'メール', isRequired: true, dataType: FieldDataType.TEXT },
      { fieldId: 'note', label: '備考', isRequired: false, dataType: FieldDataType.TEXTAREA },
    ];

    test('returns valid when all required fields are filled', () => {
      const data = { name: 'John', email: 'john@example.com', note: '' };
      const result = validateRequiredFields(fields, data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('returns errors for missing required fields', () => {
      const data = { name: '', email: 'john@example.com' };
      const result = validateRequiredFields(fields, data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('name');
    });

    test('ignores optional fields', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const result = validateRequiredFields(fields, data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    test('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.jp')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });
});
```

---

## 4. 統合テスト仕様

### 4.1. 認証フロー

**テストケース**:

```typescript
describe('Authentication Flow', () => {
  test('user can login successfully', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error message on login failure', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    });
  });
});
```

### 4.2. 仕様書作成フロー

**テストケース**:

```typescript
describe('Specification Creation Flow', () => {
  test('user can create a new specification', async () => {
    render(<WizardPage />);

    // ステップ1: 基本情報
    await waitFor(() => {
      expect(screen.getByLabelText('件名')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('件名'), {
      target: { value: 'テスト仕様書' },
    });

    fireEvent.click(screen.getByRole('button', { name: '次へ' }));

    // ステップ2: 詳細情報
    await waitFor(() => {
      expect(screen.getByLabelText('目的')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('目的'), {
      target: { value: 'テスト目的' },
    });

    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('validates required fields before moving to next step', async () => {
    render(<WizardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('件名')).toBeInTheDocument();
    });

    // 必須フィールドを空のまま次へ
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));

    await waitFor(() => {
      expect(screen.getByText(/必須項目です/)).toBeInTheDocument();
    });
  });
});
```

---

## 5. E2Eテスト仕様

### 5.1. クリティカルパス

#### 5.1.1. ユーザー登録〜仕様書作成〜エクスポート

**シナリオ**:

```typescript
test('End-to-end user journey', async ({ page }) => {
  // 1. ユーザー登録
  await page.goto('http://localhost:5173/register');
  await page.fill('input[name="fullName"]', 'テストユーザー');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Test1234');
  await page.fill('input[name="passwordConfirm"]', 'Test1234');
  await page.click('button[type="submit"]');

  // 2. ダッシュボードに遷移
  await expect(page).toHaveURL(/dashboard/);

  // 3. 新規仕様書作成
  await page.click('button:has-text("新規作成")');
  await expect(page).toHaveURL(/specifications\/.*\/edit/);

  // 4. フォーム入力
  await page.fill('input[name="subject"]', 'E2Eテスト仕様書');
  await page.fill('textarea[name="purpose"]', 'E2Eテストの目的');
  await page.click('button:has-text("次へ")');

  // 5. 保存
  await page.click('button:has-text("保存")');
  await expect(page).toHaveURL(/dashboard/);

  // 6. 作成した仕様書が一覧に表示されることを確認
  await expect(page.locator('text=E2Eテスト仕様書')).toBeVisible();

  // 7. エクスポート
  await page.click('button[aria-label="操作メニュー"]');
  await page.click('text=PDF エクスポート');

  // ダウンロード完了を待機
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/specification_.*\.pdf/);
});
```

### 5.2. エラーケース

**シナリオ**:

```typescript
test('Handles network errors gracefully', async ({ page }) => {
  // ネットワークをオフラインに設定
  await page.context().setOffline(true);

  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // エラーメッセージが表示されることを確認
  await expect(page.locator('text=エラーが発生しました')).toBeVisible();
});
```

---

## 6. テスト環境

### 6.1. ローカル環境

```bash
# ユニットテスト・統合テスト
npm test

# カバレッジ付き
npm test -- --coverage

# ウォッチモード
npm run test:watch

# E2Eテスト
npm run test:e2e
```

### 6.2. CI/CD 環境

```yaml
# .github/workflows/test.yml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

---

## 7. テスト実装状況

### 7.1. 現在の状況

| カテゴリ | 実装状況 | カバレッジ |
|---------|---------|-----------|
| 共通コンポーネント | ⚠️ 未実装 | 0% |
| レイアウトコンポーネント | ⚠️ 未実装 | 0% |
| ダッシュボード | ⚠️ 未実装 | 0% |
| ウィザード | ⚠️ 未実装 | 0% |
| カスタムフック | ⚠️ 未実装 | 0% |
| ユーティリティ | ⚠️ 未実装 | 0% |
| E2Eテスト | ⚠️ 未実装 | 0% |

### 7.2. 今後の実装計画

**Phase 4** で以下のテストを実装予定:

1. **Week 1**: ユニットテスト（共通コンポーネント、ユーティリティ）
2. **Week 2**: 統合テスト（認証フロー、ダッシュボード）
3. **Week 3**: E2Eテスト（クリティカルパス）
4. **Week 4**: カバレッジ改善、リグレッション修正

---

## まとめ

Phase 3 のフロントエンド実装に対する包括的なテスト仕様を策定した。Phase 4 でこれらのテストを実装し、品質保証を確立する。
