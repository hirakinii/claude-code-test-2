/**
 * API レスポンス型定義
 */

/**
 * 成功レスポンス
 */
export interface SuccessResponse<T = unknown> {
  status: 'success';
  data: T;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * ページネーション情報
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  meta: PaginationMeta;
}
