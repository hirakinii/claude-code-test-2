/**
 * 仕様書API統合テスト
 *
 * 参照: docs/backend-api-test-specification.md セクション4
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../utils/prisma.js';
import type { Application } from 'express';
import { SpecificationStatus } from '@prisma/client';

describe('仕様書API', () => {
  let app: Application;
  let testUserEmail: string;
  let testUserPassword: string;
  let testUserToken: string;
  let testUserId: string;
  let testUser2Token: string;
  let testUser2Id: string;
  let defaultSchemaId: string;

  beforeAll(async () => {
    app = createApp();

    // テストユーザー1を作成
    testUserEmail = `test-spec-${Date.now()}@example.com`;
    testUserPassword = 'TestPassword123';

    const registerResponse1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        fullName: 'テストユーザー1',
      });

    testUserToken = registerResponse1.body.data.token;
    testUserId = registerResponse1.body.data.user.user_id;

    // テストユーザー2を作成（権限チェック用）
    const testUser2Email = `test-spec2-${Date.now()}@example.com`;
    const registerResponse2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser2Email,
        password: testUserPassword,
        fullName: 'テストユーザー2',
      });

    testUser2Token = registerResponse2.body.data.token;
    testUser2Id = registerResponse2.body.data.user.user_id;

    // デフォルトスキーマを取得
    const defaultSchema = await prisma.schema.findFirst({
      where: { is_default: true },
    });
    defaultSchemaId = defaultSchema!.schema_id;
  });

  afterAll(async () => {
    // テストデータを削除
    await prisma.specification.deleteMany({
      where: {
        OR: [
          { author_user_id: testUserId },
          { author_user_id: testUser2Id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [{ email: testUserEmail }, { email: `test-spec2-${testUserEmail.split('-')[2]}` }],
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/specifications', () => {
    test('正常系: 最小限のデータで仕様書を作成', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          title: 'テスト仕様書',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('テスト仕様書');
      expect(response.body.data.status).toBe(SpecificationStatus.editing);
      expect(response.body.data.version).toBe('1.0');
      expect(response.body.data.author_user_id).toBe(testUserId);
    });

    test('正常系: スキーマを指定して仕様書を作成', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          schema_id: defaultSchemaId,
          title: 'カスタムスキーマ仕様書',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.schema_id).toBe(defaultSchemaId);
    });

    test('異常系: 認証なしでは作成できない', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .send({
          title: 'テスト仕様書',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('正常系: タイトルなしでも作成可能（デフォルトタイトルが設定される）', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({})
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('新規仕様書');
    });
  });

  describe('GET /api/specifications', () => {
    beforeAll(async () => {
      // テスト用仕様書を3件作成
      await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '仕様書A' });

      await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '仕様書B' });

      await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '仕様書C' });
    });

    test('正常系: 自分の仕様書一覧を取得', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('pageSize');
      expect(response.body.meta).toHaveProperty('totalCount');
    });

    test('正常系: ページネーション', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .query({ page: 1, pageSize: 2 })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.pageSize).toBe(2);
    });

    test('正常系: ステータスフィルタ', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .query({ status: SpecificationStatus.editing })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.forEach((spec: any) => {
        expect(spec.status).toBe(SpecificationStatus.editing);
      });
    });

    test('正常系: 検索フィルタ', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .query({ search: '仕様書A' })
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.some((spec: any) => spec.title.includes('仕様書A'))).toBe(true);
    });

    test('異常系: 認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/specifications/:id', () => {
    let specId: string;
    let otherUserSpecId: string;

    beforeAll(async () => {
      // 自分の仕様書を作成
      const spec = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '取得テスト仕様書' });
      specId = spec.body.data.specification_id;

      // 他のユーザーの仕様書を作成
      const otherSpec = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({ title: '他人の仕様書' });
      otherUserSpecId = otherSpec.body.data.specification_id;
    });

    test('正常系: 自分の仕様書の詳細を取得', async () => {
      const response = await request(app)
        .get(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.specification_id).toBe(specId);
      expect(response.body.data.title).toBe('取得テスト仕様書');
      expect(response.body.data.author).toHaveProperty('user_id');
      expect(response.body.data).toHaveProperty('schema');
    });

    test('異常系: 他人の仕様書にはアクセスできない', async () => {
      const response = await request(app)
        .get(`/api/specifications/${otherUserSpecId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('permission');
    });

    test('異常系: 存在しない仕様書ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/specifications/${fakeId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    test('異常系: 認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get(`/api/specifications/${specId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/specifications/:id', () => {
    let specId: string;

    beforeEach(async () => {
      // 各テストケースで新しい仕様書を作成
      const spec = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '更新テスト仕様書' });
      specId = spec.body.data.specification_id;
    });

    test('正常系: タイトルを更新', async () => {
      const response = await request(app)
        .put(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          title: '更新されたタイトル',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('更新されたタイトル');
    });

    test('正常系: コンテンツを更新するとバージョンが上がる', async () => {
      // フィールドIDを取得
      const schema = await prisma.schema.findFirst({
        where: { is_default: true },
        include: {
          categories: {
            include: {
              fields: true,
            },
          },
        },
      });

      const field = schema!.categories[0].fields[0];

      const response = await request(app)
        .put(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          content: [
            {
              field_id: field.field_id,
              value: 'テスト値',
            },
          ],
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.version).not.toBe('1.0'); // バージョンが更新される
    });

    test('正常系: 納品物を追加', async () => {
      const response = await request(app)
        .put(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          deliverables: [
            {
              name: '納品物A',
              quantity: 1,
              description: '説明A',
            },
            {
              name: '納品物B',
              quantity: 2,
              description: '説明B',
            },
          ],
        })
        .expect(200);

      expect(response.body.status).toBe('success');

      // 納品物が保存されたことを確認
      const spec = await request(app)
        .get(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(spec.body.data.deliverables.length).toBe(2);
    });

    test('異常系: 他人の仕様書は更新できない', async () => {
      const response = await request(app)
        .put(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({
          title: '不正な更新',
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    test('異常系: 認証なしでは更新できない', async () => {
      const response = await request(app)
        .put(`/api/specifications/${specId}`)
        .send({
          title: '不正な更新',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/specifications/:id', () => {
    let specId: string;
    let otherUserSpecId: string;

    beforeEach(async () => {
      // 自分の仕様書を作成
      const spec = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ title: '削除テスト仕様書' });
      specId = spec.body.data.specification_id;

      // 他のユーザーの仕様書を作成
      const otherSpec = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({ title: '他人の仕様書' });
      otherUserSpecId = otherSpec.body.data.specification_id;
    });

    test('正常系: 自分の仕様書を削除', async () => {
      const response = await request(app)
        .delete(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');

      // 削除されたことを確認
      await request(app)
        .get(`/api/specifications/${specId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);
    });

    test('異常系: 他人の仕様書は削除できない', async () => {
      const response = await request(app)
        .delete(`/api/specifications/${otherUserSpecId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');

      // 削除されていないことを確認
      await request(app)
        .get(`/api/specifications/${otherUserSpecId}`)
        .set('Authorization', `Bearer ${testUser2Token}`)
        .expect(200);
    });

    test('異常系: 存在しない仕様書は削除できない', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/specifications/${fakeId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    test('異常系: 認証なしでは削除できない', async () => {
      const response = await request(app)
        .delete(`/api/specifications/${specId}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
