/**
 * Backend Test Setup
 * バックエンドテスト実行前の初期化
 */

import { prisma } from '../utils/prisma.js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// テスト実行前の警告とセットアップ
beforeAll(() => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      '❌ DATABASE_URL is not set. Please create .env file with DATABASE_URL.'
    );
  }

  if (dbUrl.includes('prod') || dbUrl.includes('production')) {
    throw new Error(
      '❌ DANGER: Tests cannot run against production database!'
    );
  }

  // JWT_SECRETの確認
  if (!process.env.JWT_SECRET) {
    throw new Error(
      '❌ JWT_SECRET is not set. Please set JWT_SECRET in .env file.'
    );
  }

  console.log('✅ Backend test setup complete. Using database:', dbUrl.split('@')[1] || 'unknown');
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await prisma.$disconnect();
});
