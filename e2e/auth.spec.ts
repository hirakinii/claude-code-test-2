/**
 * 認証フローのE2Eテスト
 *
 * 参照: docs/frontend-test-specification.md セクション5.1
 */
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  const testUser = {
    email: `test-e2e-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'E2Eテストユーザー',
  };

  test('ユーザー登録からログインまでの完全なフロー', async ({ page }) => {
    // 1. ユーザー登録ページに移動
    await page.goto('/register');
    await expect(page).toHaveTitle(/仕様書作成/);

    // 2. 登録フォームに入力
    await page.fill('input[name="fullName"]', testUser.fullName);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="passwordConfirm"]', testUser.password);

    // 3. 登録ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. ダッシュボードに遷移することを確認
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=ダッシュボード')).toBeVisible();

    // 5. ログアウト
    await page.click('button[aria-label="アカウントメニュー"]');
    await page.click('text=ログアウト');

    // 6. ログインページに遷移
    await expect(page).toHaveURL(/\/login/);

    // 7. 再度ログイン
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 8. ダッシュボードに戻ることを確認
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('無効な認証情報でログインできない', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=エラー')).toBeVisible();
    // ログインページに留まることを確認
    await expect(page).toHaveURL(/\/login/);
  });

  test('バリデーションエラーが正しく表示される', async ({ page }) => {
    await page.goto('/register');

    // 無効なメールアドレスを入力
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    // バリデーションエラーが表示されることを確認
    await expect(page.locator('text=メール')).toBeVisible();
  });
});
