/**
 * スキーマサービス
 */
import { apiClient } from './api';
import type { SchemaResponse } from '../types/dto';
import type { SchemaWithStructure } from '@common/entities';

export const schemaService = {
  /**
   * デフォルトスキーマを取得
   */
  async getDefault(): Promise<SchemaResponse> {
    const response = await apiClient.get<SchemaResponse>('/api/schema');
    return response.data;
  },

  /**
   * 特定のスキーマを取得
   */
  async get(id: string): Promise<SchemaResponse> {
    const response = await apiClient.get<SchemaResponse>(`/api/schema/${id}`);
    return response.data;
  },

  /**
   * スキーマを更新（管理者のみ）
   */
  async update(schema: SchemaWithStructure): Promise<void> {
    await apiClient.put('/api/schema', schema);
  },

  /**
   * デフォルトスキーマにリセット（管理者のみ）
   */
  async reset(): Promise<void> {
    await apiClient.post('/api/schema/reset');
  },
};
