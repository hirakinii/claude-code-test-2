/**
 * スキーマAPI統合テスト
 *
 * 参照: docs/backend-api-test-specification.md セクション5
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../utils/prisma.js';
import type { Express } from 'express';
import { FieldDataType } from '@prisma/client';

describe('スキーマAPI', () => {
  let app: Express;
  let adminToken: string;
  let adminUserId: string;
  let userToken: string;
  let userId: string;
  let defaultSchemaId: string;

  beforeAll(async () => {
    app = createApp();

    // 一般ユーザーを作成
    const userEmail = `test-schema-user-${Date.now()}@example.com`;
    const userPassword = 'TestPassword123';

    const userRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: userPassword,
        fullName: '一般ユーザー',
      });

    userToken = userRegisterResponse.body.data.token;
    userId = userRegisterResponse.body.data.user.user_id;

    // 管理者ユーザーを作成
    const adminEmail = `test-schema-admin-${Date.now()}@example.com`;
    const adminRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: userPassword,
        fullName: '管理者ユーザー',
      });

    adminToken = adminRegisterResponse.body.data.token;
    adminUserId = adminRegisterResponse.body.data.user.user_id;

    // 管理者ロールを付与
    await prisma.userRole.create({
      data: {
        user_id: adminUserId,
        role_name: 'administrator',
      },
    });

    // デフォルトスキーマを取得
    const defaultSchema = await prisma.schema.findFirst({
      where: { is_default: true },
    });
    defaultSchemaId = defaultSchema!.schema_id;
  });

  afterAll(async () => {
    // テストユーザーを削除
    await prisma.user.deleteMany({
      where: {
        OR: [{ user_id: userId }, { user_id: adminUserId }],
      },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/schema', () => {
    test('正常系: デフォルトスキーマを取得', async () => {
      const response = await request(app)
        .get('/api/schema')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('schema_id');
      expect(response.body.data).toHaveProperty('schema_name');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data.is_default).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);

      // カテゴリにフィールドが含まれていることを確認
      if (response.body.data.categories.length > 0) {
        expect(response.body.data.categories[0]).toHaveProperty('fields');
        expect(Array.isArray(response.body.data.categories[0].fields)).toBe(true);
      }
    });

    test('異常系: 認証なしではアクセスできない', async () => {
      const response = await request(app).get('/api/schema').expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/schemas/:id', () => {
    test('正常系: 特定のスキーマを取得', async () => {
      const response = await request(app)
        .get(`/api/schemas/${defaultSchemaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.schema_id).toBe(defaultSchemaId);
      expect(response.body.data).toHaveProperty('categories');
    });

    test('異常系: 存在しないスキーマID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/schemas/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    test('異常系: 認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get(`/api/schemas/${defaultSchemaId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/schemas/:id', () => {
    let testSchemaId: string;

    beforeEach(async () => {
      // テスト用スキーマを作成
      const testSchema = await prisma.schema.create({
        data: {
          schema_name: 'テスト用スキーマ',
          is_default: false,
          categories: {
            create: [
              {
                category_name: 'テストカテゴリ',
                description: 'テスト用',
                display_order: 1,
                fields: {
                  create: [
                    {
                      field_name: 'テストフィールド',
                      data_type: FieldDataType.text,
                      is_required: false,
                      display_order: 1,
                    },
                  ],
                },
              },
            ],
          },
        },
      });
      testSchemaId = testSchema.schema_id;
    });

    afterEach(async () => {
      // テスト用スキーマを削除
      await prisma.schema.delete({
        where: { schema_id: testSchemaId },
      });
    });

    test('正常系: 管理者がスキーマ名を更新', async () => {
      const response = await request(app)
        .put(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schema_name: '更新されたスキーマ名',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.schema_name).toBe('更新されたスキーマ名');
    });

    test('正常系: 管理者がカテゴリとフィールドを更新', async () => {
      const response = await request(app)
        .put(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: [
            {
              category_name: '新しいカテゴリ',
              description: '新しい説明',
              display_order: 1,
              fields: [
                {
                  field_name: '新しいフィールド1',
                  data_type: FieldDataType.text,
                  is_required: true,
                  display_order: 1,
                },
                {
                  field_name: '新しいフィールド2',
                  data_type: FieldDataType.number,
                  is_required: false,
                  display_order: 2,
                },
              ],
            },
          ],
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.categories.length).toBe(1);
      expect(response.body.data.categories[0].category_name).toBe('新しいカテゴリ');
      expect(response.body.data.categories[0].fields.length).toBe(2);
    });

    test('異常系: 一般ユーザーはスキーマを更新できない', async () => {
      const response = await request(app)
        .put(`/api/schemas/${testSchemaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          schema_name: '不正な更新',
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });

    test('異常系: 存在しないスキーマは更新できない', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/schemas/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schema_name: '存在しないスキーマ',
        })
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    test('異常系: 認証なしでは更新できない', async () => {
      const response = await request(app)
        .put(`/api/schemas/${testSchemaId}`)
        .send({
          schema_name: '不正な更新',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
