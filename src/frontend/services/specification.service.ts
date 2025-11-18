/**
 * 仕様書サービス
 */
import { apiClient } from './api';
import type {
  SpecificationListItem,
  SpecificationCreateRequest,
  SpecificationUpdateRequest,
  SpecificationDetailResponse,
} from '../types/dto';

export const specificationService = {
  /**
   * 仕様書一覧を取得
   */
  async list(): Promise<SpecificationListItem[]> {
    const response = await apiClient.get<SpecificationListItem[]>('/api/specifications');
    return response.data;
  },

  /**
   * 仕様書詳細を取得
   */
  async get(id: string): Promise<SpecificationDetailResponse> {
    const response = await apiClient.get<SpecificationDetailResponse>(
      `/api/specifications/${id}`
    );
    return response.data;
  },

  /**
   * 新規仕様書を作成
   */
  async create(data: SpecificationCreateRequest): Promise<{ specificationId: string }> {
    const response = await apiClient.post<{ specificationId: string }>(
      '/api/specifications',
      data
    );
    return response.data;
  },

  /**
   * 仕様書を更新
   */
  async update(id: string, data: SpecificationUpdateRequest): Promise<void> {
    await apiClient.put(`/api/specifications/${id}`, data);
  },

  /**
   * 仕様書を削除
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/specifications/${id}`);
  },

  /**
   * 仕様書をエクスポート（PDF/Word/Markdown）
   */
  async export(id: string, format: 'pdf' | 'word' | 'markdown'): Promise<Blob> {
    const response = await apiClient.get(`/api/specifications/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
