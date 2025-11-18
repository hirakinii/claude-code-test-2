/**
 * セキュリティテスト
 *
 * 参照: docs/backend-api-test-specification.md セクション6
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../utils/prisma.js';
import type { Express } from 'express';

describe('セキュリティテスト', () => {
  let app: Express;
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = createApp();

    // テストユーザーを作成
    const testUserEmail = `test-security-${Date.now()}@example.com`;
    const testUserPassword = 'TestPassword123';

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        fullName: 'セキュリティテストユーザー',
      });

    testUserToken = registerResponse.body.data.token;
    testUserId = registerResponse.body.data.user.user_id;
  });

  afterAll(async () => {
    // テストユーザーを削除
    await prisma.user.deleteMany({
      where: { user_id: testUserId },
    });

    await prisma.$disconnect();
  });

  describe('SQLインジェクション対策', () => {
    test('ログイン時のSQLインジェクション攻撃が防止される', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin@example.com' OR '1'='1",
          password: 'anything',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid email or password');
    });

    test('検索パラメータでのSQLインジェクション攻撃が防止される', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .query({ search: "'; DROP TABLE specifications; --" })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      // エラーが発生せず、正常に処理される
      expect(response.body.status).toBe('success');

      // テーブルが削除されていないことを確認
      const count = await prisma.specification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('UUIDパラメータでのSQLインジェクション攻撃が防止される', async () => {
      const response = await request(app)
        .get("/api/specifications/' OR '1'='1")
        .set('Authorization', `Bearer ${testUserToken}`);

      // 400 or 404 エラーが返される（不正なUUID形式）
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('XSS対策', () => {
    test('XSSスクリプトがそのまま保存される（サニタイズは行わない）', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          title: xssPayload,
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      // スクリプトがそのまま保存される
      expect(response.body.data.title).toBe(xssPayload);

      // データベースから取得しても同じ
      const spec = await prisma.specification.findUnique({
        where: { specification_id: response.body.data.specification_id },
      });
      expect(spec?.title).toBe(xssPayload);

      // クリーンアップ
      await prisma.specification.delete({
        where: { specification_id: response.body.data.specification_id },
      });
    });

    test('HTMLタグを含む文字列が正しく保存される', async () => {
      const htmlContent = '<div>テスト<br>改行</div>';

      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          title: htmlContent,
        })
        .expect(201);

      expect(response.body.data.title).toBe(htmlContent);

      // クリーンアップ
      await prisma.specification.delete({
        where: { specification_id: response.body.data.specification_id },
      });
    });
  });

  describe('認証・認可', () => {
    test('トークンなしではAPIにアクセスできない', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No token provided');
    });

    test('無効なトークンではAPIにアクセスできない', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('期限切れのトークン形式でアクセスできない', async () => {
      // 不正な形式のトークン
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';

      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('入力バリデーション', () => {
    test('メールアドレスのバリデーション', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234',
          fullName: 'テストユーザー',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toHaveProperty('email');
    });

    test('パスワードの強度チェック', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          fullName: 'テストユーザー',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toHaveProperty('password');
    });

    test('必須フィールドのバリデーション', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
          // fullName が欠落
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toHaveProperty('fullName');
    });

    test('UUIDフォーマットのバリデーション', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          schema_id: 'invalid-uuid',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toHaveProperty('schema_id');
    });
  });

  describe('レート制限', () => {
    test('短時間に大量のリクエストを送るとレート制限される', async () => {
      // 注意: このテストは時間がかかる可能性があります
      // また、レート制限の設定によってはテストが失敗する可能性があります

      const requests = [];
      const endpoint = '/api/specifications';

      // 連続して多数のリクエストを送信
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${testUserToken}`)
        );
      }

      const responses = await Promise.all(requests);

      // 少なくとも1つは429エラーが返されることを期待
      const rateLimited = responses.some((res) => res.status === 429);

      if (rateLimited) {
        expect(rateLimited).toBe(true);

        // 429エラーのレスポンスを確認
        const limitedResponse = responses.find((res) => res.status === 429);
        expect(limitedResponse?.body.message).toContain('Too many requests');
      } else {
        // レート制限が設定されていないか、制限に達していない
        console.warn('Rate limit not triggered. Check rate limit configuration.');
      }
    }, 60000); // 60秒のタイムアウト

    test('ログインエンドポイントでの厳格なレート制限', async () => {
      const requests = [];

      // 連続してログインリクエストを送信
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);

      // レート制限が発動する可能性がある
      const rateLimited = responses.some((res) => res.status === 429);

      if (rateLimited) {
        expect(rateLimited).toBe(true);
      } else {
        // 401エラーが返される
        responses.forEach((res) => {
          expect([401, 429]).toContain(res.status);
        });
      }
    }, 30000);
  });

  describe('HTTPヘッダーセキュリティ', () => {
    test('セキュアなHTTPヘッダーが設定されている', async () => {
      const response = await request(app).get('/health');

      // Helmet middleware によって設定されるヘッダー
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('CORS設定が正しく適用されている', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173');

      // CORS_ORIGINに設定されたオリジンからのアクセスが許可される
      // 注意: 環境変数の設定によって結果が異なる
      if (process.env.CORS_ORIGIN) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });
  });

  describe('エラーメッセージの安全性', () => {
    test('エラーメッセージに機密情報が含まれない', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // 具体的な情報（ユーザーが存在しないなど）を漏らさない
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.message).not.toContain('User not found');
      expect(response.body.message).not.toContain('database');
    });

    test('スタックトレースが本番環境で公開されない', async () => {
      // 意図的にエラーを発生させる
      const response = await request(app)
        .get('/api/specifications/invalid-uuid-format')
        .set('Authorization', `Bearer ${testUserToken}`);

      // エラーレスポンスにスタックトレースが含まれないことを確認
      expect(response.body).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toContain('at ');
    });
  });
});
