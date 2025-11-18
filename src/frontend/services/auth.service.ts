/**
 * 認証サービス
 */
import { apiClient } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/dto';

export const authService = {
  /**
   * ログイン
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * ユーザー登録
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/api/users/me');
    return response.data;
  },
};
