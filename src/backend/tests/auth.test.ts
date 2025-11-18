/**
 * 認証APIテスト
 *
 * 参照: docs/backend-api-test-specification.md セクション3
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../utils/prisma.js';
import type { Express } from 'express';

describe('認証API', () => {
  let app: Express;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    app = createApp();
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserPassword = 'TestPassword123';
  });

  afterAll(async () => {
    // テストユーザーを削除
    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('正常系: 新規ユーザー登録', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          fullName: 'テストユーザー',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUserEmail);
      expect(response.body.data.user.roles).toContain('creator');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresIn).toBe('7d');
    });

    it('異常系: メールアドレス重複', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: testUserPassword,
          fullName: '重複ユーザー',
        })
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email already exists');
    });

    it('異常系: バリデーションエラー - 無効なメールアドレス', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: testUserPassword,
          fullName: 'テストユーザー',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors.email).toBeDefined();
    });

    it('異常系: バリデーションエラー - パスワードが短い', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test2-${Date.now()}@example.com`,
          password: 'short',
          fullName: 'テストユーザー',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
      expect(response.body.errors.password).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('正常系: ログイン成功', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUserEmail);
      expect(response.body.data.token).toBeDefined();
    });

    it('異常系: パスワード誤り', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('異常系: ユーザー不存在', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword,
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      // ログインしてトークンを取得
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });
      token = response.body.data.token;
    });

    it('正常系: 認証済みユーザー情報取得', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe(testUserEmail);
      expect(response.body.data.password_hash).toBeUndefined(); // パスワードハッシュは含まれない
    });

    it('異常系: トークンなし', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No token provided');
    });

    it('異常系: 無効なトークン', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
