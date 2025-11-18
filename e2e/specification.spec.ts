/**
 * 仕様書作成フローのE2Eテスト
 *
 * 参照: docs/frontend-test-specification.md セクション5.1.1
 */
import { test, expect } from '@playwright/test';

test.describe('仕様書作成フロー', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // テストユーザーを作成してログイン
    const testUser = {
      email: `test-spec-e2e-${Date.now()}@example.com`,
      password: 'Test1234',
      fullName: 'E2E仕様書テストユーザー',
    };

    const response = await request.post('http://localhost:3000/api/auth/register', {
      data: testUser,
    });

    const data = await response.json();
    authToken = data.data.token;
  });

  test('仕様書の作成から保存までの完全なフロー', async ({ page }) => {
    // 認証トークンを設定
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    // 1. ダッシュボードに移動
    await page.goto('/dashboard');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();

    // 2. 新規作成ボタンをクリック
    await page.click('button:has-text("新規作成")');

    // 3. ウィザードページに遷移
    await expect(page).toHaveURL(/\/specifications\/.*\/edit/);

    // 4. ステップ1: 基本情報を入力
    await expect(page.locator('text=基本情報')).toBeVisible();
    await page.fill('input[name="subject"]', 'E2Eテスト仕様書');
    await page.fill('textarea[name="purpose"]', 'E2Eテストの目的');

    // 5. 次のステップに進む
    await page.click('button:has-text("次へ")');

    // 6. ステップ2: 詳細情報（適宜入力）
    await expect(page.locator('text=詳細情報')).toBeVisible();

    // 7. 保存ボタンをクリック
    await page.click('button:has-text("保存")');

    // 8. ダッシュボードに戻る
    await expect(page).toHaveURL(/\/dashboard/);

    // 9. 作成した仕様書が一覧に表示されることを確認
    await expect(page.locator('text=E2Eテスト仕様書')).toBeVisible();
  });

  test('必須項目が未入力の場合、次に進めない', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    await page.goto('/dashboard');
    await page.click('button:has-text("新規作成")');

    // 必須項目を入力せずに次へをクリック
    await page.click('button:has-text("次へ")');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=必須')).toBeVisible();
    // ページが遷移しないことを確認
    await expect(page.locator('text=基本情報')).toBeVisible();
  });

  test('自動保存機能が動作する', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    await page.goto('/dashboard');
    await page.click('button:has-text("新規作成")');

    // フォームに入力
    await page.fill('input[name="subject"]', '自動保存テスト');

    // 少し待つ（debounce）
    await page.waitForTimeout(1000);

    // LocalStorageに保存されていることを確認
    const savedData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const wizardKey = keys.find(key => key.startsWith('wizard_data_'));
      return wizardKey ? localStorage.getItem(wizardKey) : null;
    });

    expect(savedData).toBeTruthy();
    expect(savedData).toContain('自動保存テスト');
  });

  test('仕様書の編集ができる', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    // ダッシュボードに移動
    await page.goto('/dashboard');

    // 既存の仕様書をクリック（最初のカードを選択）
    await page.click('.specification-card:first-child');

    // 編集ページに遷移
    await expect(page).toHaveURL(/\/specifications\/.*\/edit/);

    // タイトルを編集
    const titleInput = page.locator('input[name="subject"]');
    await titleInput.clear();
    await titleInput.fill('編集されたタイトル');

    // 保存
    await page.click('button:has-text("保存")');

    // ダッシュボードに戻る
    await expect(page).toHaveURL(/\/dashboard/);

    // 編集されたタイトルが表示されることを確認
    await expect(page.locator('text=編集されたタイトル')).toBeVisible();
  });

  test('仕様書の削除ができる', async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    await page.goto('/dashboard');

    // 削除する仕様書のタイトルを記録
    const titleToDelete = await page.locator('.specification-card:first-child .title').textContent();

    // 操作メニューを開く
    await page.click('.specification-card:first-child button[aria-label="操作メニュー"]');

    // 削除をクリック
    await page.click('text=削除');

    // 確認ダイアログで確認
    await page.click('button:has-text("削除")');

    // 削除された仕様書が一覧から消えることを確認
    await expect(page.locator(`text=${titleToDelete}`)).not.toBeVisible();
  });
});
