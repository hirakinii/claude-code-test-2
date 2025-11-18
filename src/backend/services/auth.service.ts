/**
 * 認証サービス
 *
 * ユーザー認証、JWT生成、パスワード検証
 *
 * 参照: docs/implementation-strategy.md Phase 2.2
 *
 * セキュリティ注意:
 * - パスワードは bcrypt でハッシュ化（コスト12）
 * - JWT トークンは httpOnly cookie に格納推奨
 * - パスワードハッシュは絶対に API レスポンスに含めない
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RoleName } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ConflictError } from '../errors/AppError.js';
import { JwtPayload, LoginResponse } from '../types/auth.js';
import { logger } from '../config/logger.js';

/**
 * bcrypt ソルトラウンド（コスト）
 */
const SALT_ROUNDS = 12;

/**
 * パスワードをハッシュ化
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * パスワードを検証
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * JWT トークンを生成
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * JWT トークンを検証
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

/**
 * ユーザーをメールアドレスで取得（ロール情報含む）
 */
export const findUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    roles: user.user_roles.map((ur) => ur.role),
  };
};

/**
 * ユーザーをIDで取得（ロール情報含む）
 */
export const findUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    roles: user.user_roles.map((ur) => ur.role),
  };
};

/**
 * ユーザーログイン
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // ユーザー取得
  const user = await findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // パスワード検証
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // JWT ペイロード作成
  const payload: JwtPayload = {
    userId: user.user_id,
    email: user.email,
    roles: user.roles.map((r) => r.role_name),
  };

  // トークン生成
  const token = generateToken(payload);

  logger.info('User logged in', {
    userId: user.user_id,
    email: user.email,
  });

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles.map((r) => r.role_name),
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

/**
 * ユーザー登録
 *
 * 注意: 現在はデフォルトで creator ロールを付与
 */
export const register = async (
  email: string,
  password: string,
  fullName: string
): Promise<LoginResponse> => {
  // メールアドレスの重複チェック
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ConflictError('Email already exists');
  }

  // パスワードハッシュ化
  const passwordHash = await hashPassword(password);

  // creator ロールを取得
  const creatorRole = await prisma.role.findUnique({
    where: { role_name: RoleName.creator },
  });

  if (!creatorRole) {
    throw new Error('Creator role not found. Run seed script first.');
  }

  // ユーザー作成
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      user_roles: {
        create: {
          role_id: creatorRole.role_id,
        },
      },
    },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  logger.info('User registered', {
    userId: user.user_id,
    email: user.email,
  });

  // JWT ペイロード作成
  const payload: JwtPayload = {
    userId: user.user_id,
    email: user.email,
    roles: user.user_roles.map((ur) => ur.role.role_name),
  };

  // トークン生成
  const token = generateToken(payload);

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      roles: user.user_roles.map((ur) => ur.role.role_name),
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

/**
 * ユーザーが指定されたロールを持っているかチェック
 */
export const hasRole = (
  user: { roles: { role_name: RoleName }[] },
  roleName: RoleName
): boolean => {
  return user.roles.some((r) => r.role_name === roleName);
};
