/**
 * 仕様書サービス
 *
 * 仕様書のCRUD操作、トランザクション管理
 *
 * 参照: docs/implementation-strategy.md Phase 2.3
 *
 * セキュリティ注意:
 * - リソース所有権チェックを必ず実施
 * - DELETE & INSERT パターンのため、トランザクション必須
 */
import {
  Specification,
  SpecificationStatus,
  Prisma,
  RoleName,
} from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../errors/AppError.js';
import { updateSpecificationVersion } from './version.service.js';
import { logger, logAudit } from '../config/logger.js';

/**
 * 仕様書作成データ型
 */
interface CreateSpecificationData {
  author_user_id: string;
  schema_id?: string;
  title?: string;
}

/**
 * 仕様書更新データ型
 */
interface UpdateSpecificationData {
  title?: string;
  status?: SpecificationStatus;
  content?: Array<{
    field_id: string;
    value: unknown;
  }>;
  deliverables?: Array<{
    name: string;
    quantity: number;
    description: string;
  }>;
  contractor_requirements?: Array<{
    category: string;
    description: string;
  }>;
  basic_business_requirements?: Array<{
    category: string;
    description: string;
  }>;
  business_tasks?: Array<{
    title: string;
    detailed_spec: string;
  }>;
}

/**
 * 仕様書一覧取得オプション
 */
interface ListSpecificationsOptions {
  author_user_id?: string;
  page?: number;
  pageSize?: number;
  status?: SpecificationStatus;
  search?: string;
}

/**
 * デフォルトスキーマを取得
 */
const getDefaultSchema = async () => {
  const defaultSchema = await prisma.schema.findFirst({
    where: { is_default: true },
  });

  if (!defaultSchema) {
    throw new BadRequestError(
      'Default schema not found. Run seed script first.'
    );
  }

  return defaultSchema;
};

/**
 * リソース所有権チェック
 */
const checkOwnership = (
  specification: Specification,
  userId: string,
  userRoles: string[]
): void => {
  // 管理者は全てのリソースにアクセス可能
  if (userRoles.includes(RoleName.administrator)) {
    return;
  }

  // 自分が作成した仕様書のみアクセス可能
  if (specification.author_user_id !== userId) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
};

/**
 * 仕様書を新規作成
 */
export const createSpecification = async (
  data: CreateSpecificationData
): Promise<Specification> => {
  // スキーマIDが指定されていない場合はデフォルトを使用
  const schemaId = data.schema_id || (await getDefaultSchema()).schema_id;

  // 仕様書作成
  const specification = await prisma.specification.create({
    data: {
      author_user_id: data.author_user_id,
      schema_id: schemaId,
      title: data.title || '新規仕様書',
      status: SpecificationStatus.editing,
      version: '1.0',
    },
  });

  logAudit(
    'CREATE',
    data.author_user_id,
    'Specification',
    specification.specification_id,
    { title: specification.title }
  );

  logger.info('Specification created', {
    specificationId: specification.specification_id,
    userId: data.author_user_id,
  });

  return specification;
};

/**
 * 仕様書を取得
 */
export const getSpecification = async (
  specificationId: string,
  userId: string,
  userRoles: string[]
) => {
  const specification = await prisma.specification.findUnique({
    where: { specification_id: specificationId },
    include: {
      author: {
        select: {
          user_id: true,
          email: true,
          full_name: true,
        },
      },
      schema: true,
      specification_content: {
        include: {
          field: true,
        },
      },
      deliverables: true,
      contractor_requirements: true,
      basic_business_requirements: true,
      business_tasks: true,
    },
  });

  if (!specification) {
    throw new NotFoundError('Specification');
  }

  // 所有権チェック
  checkOwnership(specification, userId, userRoles);

  return specification;
};

/**
 * 仕様書一覧を取得
 */
export const listSpecifications = async (
  options: ListSpecificationsOptions
) => {
  const {
    author_user_id,
    page = 1,
    pageSize = 20,
    status,
    search,
  } = options;

  // WHERE 条件を構築
  const where: Prisma.SpecificationWhereInput = {};

  if (author_user_id) {
    where.author_user_id = author_user_id;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.title = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // 総数を取得
  const totalCount = await prisma.specification.count({ where });

  // 仕様書を取得
  const specifications = await prisma.specification.findMany({
    where,
    include: {
      author: {
        select: {
          user_id: true,
          email: true,
          full_name: true,
        },
      },
      _count: {
        select: {
          deliverables: true,
          business_tasks: true,
        },
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data: specifications,
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
};

/**
 * 仕様書を更新
 *
 * DELETE & INSERT パターンを使用
 * トランザクション内で実行
 */
export const updateSpecification = async (
  specificationId: string,
  userId: string,
  userRoles: string[],
  data: UpdateSpecificationData
): Promise<Specification> => {
  // 仕様書を取得
  const specification = await prisma.specification.findUnique({
    where: { specification_id: specificationId },
  });

  if (!specification) {
    throw new NotFoundError('Specification');
  }

  // 所有権チェック
  checkOwnership(specification, userId, userRoles);

  // トランザクション開始
  const updatedSpecification = await prisma.$transaction(async (tx) => {
    // コンテンツマップを作成（バージョン判定用）
    const contentMap = new Map<string, unknown>();
    if (data.content) {
      data.content.forEach((item) => {
        contentMap.set(item.field_id, item.value);
      });
    }

    // バージョン更新
    const { version, status } = await updateSpecificationVersion(
      specificationId,
      specification.schema_id,
      contentMap,
      specification.version
    );

    // 既存のコンテンツを削除
    if (data.content) {
      await tx.specificationContent.deleteMany({
        where: { specification_id: specificationId },
      });
    }

    // 既存のサブエンティティを削除
    if (data.deliverables) {
      await tx.deliverable.deleteMany({
        where: { specification_id: specificationId },
      });
    }

    if (data.contractor_requirements) {
      await tx.contractorRequirement.deleteMany({
        where: { specification_id: specificationId },
      });
    }

    if (data.basic_business_requirements) {
      await tx.basicBusinessRequirement.deleteMany({
        where: { specification_id: specificationId },
      });
    }

    if (data.business_tasks) {
      await tx.businessTask.deleteMany({
        where: { specification_id: specificationId },
      });
    }

    // 新しいコンテンツを挿入
    if (data.content && data.content.length > 0) {
      await tx.specificationContent.createMany({
        data: data.content.map((item) => ({
          specification_id: specificationId,
          field_id: item.field_id,
          value: item.value as Prisma.JsonValue,
        })),
      });
    }

    // 新しいサブエンティティを挿入
    if (data.deliverables && data.deliverables.length > 0) {
      await tx.deliverable.createMany({
        data: data.deliverables.map((item) => ({
          specification_id: specificationId,
          ...item,
        })),
      });
    }

    if (data.contractor_requirements && data.contractor_requirements.length > 0) {
      await tx.contractorRequirement.createMany({
        data: data.contractor_requirements.map((item) => ({
          specification_id: specificationId,
          ...item,
        })),
      });
    }

    if (
      data.basic_business_requirements &&
      data.basic_business_requirements.length > 0
    ) {
      await tx.basicBusinessRequirement.createMany({
        data: data.basic_business_requirements.map((item) => ({
          specification_id: specificationId,
          ...item,
        })),
      });
    }

    if (data.business_tasks && data.business_tasks.length > 0) {
      await tx.businessTask.createMany({
        data: data.business_tasks.map((item) => ({
          specification_id: specificationId,
          ...item,
        })),
      });
    }

    // 仕様書本体を更新
    const updated = await tx.specification.update({
      where: { specification_id: specificationId },
      data: {
        title: data.title,
        status: data.status !== undefined ? data.status : status,
        version,
      },
    });

    return updated;
  });

  logAudit('UPDATE', userId, 'Specification', specificationId, {
    version: updatedSpecification.version,
    status: updatedSpecification.status,
  });

  logger.info('Specification updated', {
    specificationId,
    userId,
    version: updatedSpecification.version,
  });

  return updatedSpecification;
};

/**
 * 仕様書を削除
 */
export const deleteSpecification = async (
  specificationId: string,
  userId: string,
  userRoles: string[]
): Promise<void> => {
  // 仕様書を取得
  const specification = await prisma.specification.findUnique({
    where: { specification_id: specificationId },
  });

  if (!specification) {
    throw new NotFoundError('Specification');
  }

  // 所有権チェック
  checkOwnership(specification, userId, userRoles);

  // 削除（CASCADE設定により関連データも自動削除）
  await prisma.specification.delete({
    where: { specification_id: specificationId },
  });

  logAudit('DELETE', userId, 'Specification', specificationId);

  logger.info('Specification deleted', {
    specificationId,
    userId,
  });
};
