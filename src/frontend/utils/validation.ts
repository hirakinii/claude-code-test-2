/**
 * バリデーションユーティリティ
 */
import type { SchemaField } from '@common/entities';
import type { FieldValue } from '../types/dto';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * 必須項目のバリデーション
 */
export function validateRequiredFields(
  fields: SchemaField[],
  data: Record<string, FieldValue>
): ValidationResult {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.isRequired) {
      const value = data[field.fieldId];

      if (value === null || value === undefined || value === '') {
        errors[field.fieldId] = `${field.label}は必須項目です`;
      } else if (Array.isArray(value) && value.length === 0) {
        errors[field.fieldId] = `${field.label}は少なくとも1つ入力してください`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URLのバリデーション
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 日付のバリデーション（YYYY-MM-DD形式）
 */
export function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}
