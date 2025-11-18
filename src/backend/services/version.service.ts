/**
 * バージョン管理エンジン
 *
 * 必須項目の充足度に基づいてメジャー/マイナーバージョンを管理
 *
 * 参照: docs/implementation-strategy.md Phase 2.3
 *
 * バージョン管理ロジック:
 * - 必須項目がすべて入力済み → メジャーバージョン更新 (1.0 → 2.0)
 * - 必須項目に未入力あり → マイナーバージョン更新 (1.0 → 1.1)
 */
import { SchemaField, SpecificationStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

/**
 * バージョン番号をパース
 */
const parseVersion = (version: string): { major: number; minor: number } => {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '1', 10),
    minor: parseInt(parts[1] || '0', 10),
  };
};

/**
 * バージョン番号をフォーマット
 */
const formatVersion = (major: number, minor: number): string => {
  return `${major}.${minor}`;
};

/**
 * 必須項目がすべて入力されているかチェック
 */
export const checkRequiredFields = (
  requiredFields: SchemaField[],
  contentMap: Map<string, unknown>
): {
  isComplete: boolean;
  missingFields: string[];
} => {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = contentMap.get(field.field_id);

    // 値が存在しない、または空の場合
    if (value === undefined || value === null || value === '') {
      missingFields.push(field.field_name);
      continue;
    }

    // 配列の場合は空配列でないことを確認
    if (Array.isArray(value) && value.length === 0) {
      missingFields.push(field.field_name);
      continue;
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
};

/**
 * 新しいバージョン番号を計算
 */
export const calculateNewVersion = (
  currentVersion: string,
  isRequiredFieldsComplete: boolean
): { version: string; status: SpecificationStatus } => {
  const { major, minor } = parseVersion(currentVersion);

  if (isRequiredFieldsComplete) {
    // 必須項目がすべて入力済み → メジャーバージョン更新
    return {
      version: formatVersion(major + 1, 0),
      status: SpecificationStatus.saved,
    };
  } else {
    // 必須項目に未入力あり → マイナーバージョン更新
    return {
      version: formatVersion(major, minor + 1),
      status: SpecificationStatus.editing,
    };
  }
};

/**
 * 仕様書のバージョンを更新
 *
 * @param specificationId - 仕様書ID
 * @param schemaId - スキーマID
 * @param contentMap - 入力内容のマップ (field_id => value)
 * @param currentVersion - 現在のバージョン
 * @returns 新しいバージョンとステータス
 */
export const updateSpecificationVersion = async (
  _specificationId: string,
  schemaId: string,
  contentMap: Map<string, unknown>,
  currentVersion: string
): Promise<{ version: string; status: SpecificationStatus }> => {
  // スキーマの必須項目を取得
  const requiredFields = await prisma.schemaField.findMany({
    where: {
      category: {
        schema_id: schemaId,
      },
      is_required: true,
    },
  });

  // 必須項目チェック
  const { isComplete } = checkRequiredFields(requiredFields, contentMap);

  // 新しいバージョンを計算
  const { version, status } = calculateNewVersion(
    currentVersion,
    isComplete
  );

  return { version, status };
};

/**
 * 仕様書の完了率を計算
 *
 * @param schemaId - スキーマID
 * @param contentMap - 入力内容のマップ
 * @returns 完了率 (0-100)
 */
export const calculateCompletionRate = async (
  schemaId: string,
  contentMap: Map<string, unknown>
): Promise<{
  completionRate: number;
  totalFields: number;
  completedFields: number;
}> => {
  // スキーマのすべてのフィールドを取得
  const allFields = await prisma.schemaField.findMany({
    where: {
      category: {
        schema_id: schemaId,
      },
    },
  });

  if (allFields.length === 0) {
    return {
      completionRate: 0,
      totalFields: 0,
      completedFields: 0,
    };
  }

  // 入力済みフィールド数をカウント
  let completedFields = 0;

  for (const field of allFields) {
    const value = contentMap.get(field.field_id);

    // 値が存在し、空でない場合
    if (value !== undefined && value !== null && value !== '') {
      if (!Array.isArray(value) || value.length > 0) {
        completedFields++;
      }
    }
  }

  const completionRate = Math.round(
    (completedFields / allFields.length) * 100
  );

  return {
    completionRate,
    totalFields: allFields.length,
    completedFields,
  };
};
