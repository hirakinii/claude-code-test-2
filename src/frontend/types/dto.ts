/**
 * フロントエンド専用のDTO (Data Transfer Object) 型定義
 * バックエンド API とのやり取りで使用するデータ構造
 */

import type {
  User,
  Specification,
  SchemaWithStructure,
  SpecificationStatus,
  RoleName,
} from '@common/entities';

/**
 * 認証関連
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: {
    userId: string;
    email: string;
    fullName: string;
    roles: RoleName[];
  };
  token: string;
}

/**
 * 仕様書関連
 */
export interface SpecificationListItem {
  specificationId: string;
  title: string;
  status: SpecificationStatus;
  version: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecificationCreateRequest {
  schemaId: string;
}

export interface SpecificationUpdateRequest {
  title: string;
  data: Record<string, FieldValue>;
}

export interface SpecificationDetailResponse extends Specification {
  authorName: string;
  schema: SchemaWithStructure;
  content: Record<string, FieldValue>;
}

/**
 * スキーマ関連
 */
export interface SchemaResponse extends SchemaWithStructure {}

/**
 * フィールド値の型
 */
export type FieldValue =
  | string
  | string[]
  | number
  | boolean
  | null
  | DeliverableItem[]
  | BusinessTaskItem[]
  | SystemRequirementItem[]
  | object;

export interface DeliverableItem {
  deliverableId?: string;
  name: string;
  description: string;
  format: string;
  dueDate: string | null;
}

export interface BusinessTaskItem {
  businessTaskId?: string;
  taskName: string;
  description: string;
  assignedDepartment: string;
  estimatedHours: number | null;
}

export interface SystemRequirementItem {
  requirementId?: string;
  requirementType: string;
  description: string;
  priority: string;
  isRequired: boolean;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

/**
 * ページネーション
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 検証エラー
 */
export interface ValidationError {
  field: string;
  message: string;
}
