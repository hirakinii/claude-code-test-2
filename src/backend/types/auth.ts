/**
 * 認証関連の型定義
 */

/**
 * JWT ペイロード
 */
export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * ログインレスポンス
 */
export interface LoginResponse {
  user: {
    user_id: string;
    email: string;
    full_name: string;
    roles: string[];
  };
  token: string;
  expiresIn: string;
}

/**
 * 現在のユーザー情報レスポンス
 */
export interface CurrentUserResponse {
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: Date;
}
