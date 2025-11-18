/**
 * エクスポートサービス
 *
 * 仕様書をPDF/Word/Markdown形式にエクスポート
 *
 * 参照: docs/implementation-strategy.md Phase 2.3
 *
 * 注意: この実装は基本構造のみ。実際のPDF/Word生成は複雑なため、
 * MVP後に詳細実装を行う。
 */
import { Specification } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';

/**
 * エクスポート形式
 */
export type ExportFormat = 'pdf' | 'word' | 'markdown';

/**
 * 仕様書をMarkdown形式にエクスポート
 *
 * 最もシンプルな実装から開始
 */
export const exportToMarkdown = async (
  specificationId: string
): Promise<string> => {
  // 仕様書を取得
  const specification = await prisma.specification.findUnique({
    where: { specification_id: specificationId },
    include: {
      author: true,
      schema: {
        include: {
          categories: {
            include: {
              fields: {
                orderBy: { display_order: 'asc' },
              },
            },
            orderBy: { display_order: 'asc' },
          },
        },
      },
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

  // Markdownを生成
  let markdown = `# ${specification.title || '仕様書'}\n\n`;
  markdown += `**バージョン**: ${specification.version}\n`;
  markdown += `**ステータス**: ${specification.status}\n`;
  markdown += `**作成者**: ${specification.author.full_name}\n`;
  markdown += `**作成日**: ${specification.created_at.toISOString()}\n`;
  markdown += `**更新日**: ${specification.updated_at.toISOString()}\n\n`;
  markdown += `---\n\n`;

  // コンテンツマップを作成
  const contentMap = new Map(
    specification.specification_content.map((c) => [
      c.field_id,
      c.value,
    ])
  );

  // カテゴリごとにセクションを生成
  for (const category of specification.schema.categories) {
    markdown += `## ${category.category_name}\n\n`;

    if (category.description) {
      markdown += `${category.description}\n\n`;
    }

    for (const field of category.fields) {
      const value = contentMap.get(field.field_id);

      markdown += `### ${field.field_name}\n\n`;

      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          markdown += `${value}\n\n`;
        } else if (Array.isArray(value)) {
          value.forEach((v) => {
            markdown += `- ${v}\n`;
          });
          markdown += `\n`;
        } else {
          markdown += `${JSON.stringify(value, null, 2)}\n\n`;
        }
      } else {
        markdown += `（未入力）\n\n`;
      }
    }
  }

  // 納品物
  if (specification.deliverables.length > 0) {
    markdown += `## 納品物\n\n`;
    markdown += `| 名称 | 数量 | 説明 |\n`;
    markdown += `|------|------|------|\n`;
    specification.deliverables.forEach((d) => {
      markdown += `| ${d.name} | ${d.quantity} | ${d.description} |\n`;
    });
    markdown += `\n`;
  }

  // 受注者要件
  if (specification.contractor_requirements.length > 0) {
    markdown += `## 受注者要件\n\n`;
    specification.contractor_requirements.forEach((r) => {
      markdown += `### ${r.category}\n\n`;
      markdown += `${r.description}\n\n`;
    });
  }

  // 業務基本要件
  if (specification.basic_business_requirements.length > 0) {
    markdown += `## 業務基本要件\n\n`;
    specification.basic_business_requirements.forEach((r) => {
      markdown += `### ${r.category}\n\n`;
      markdown += `${r.description}\n\n`;
    });
  }

  // 業務タスク
  if (specification.business_tasks.length > 0) {
    markdown += `## 業務タスク\n\n`;
    specification.business_tasks.forEach((t, index) => {
      markdown += `### ${index + 1}. ${t.title}\n\n`;
      markdown += `${t.detailed_spec}\n\n`;
    });
  }

  logger.info('Specification exported to Markdown', {
    specificationId,
  });

  return markdown;
};

/**
 * 仕様書をPDF形式にエクスポート
 *
 * 注意: 本実装ではPuppeteerを使用する必要があるが、
 * MVP段階では未実装。Markdownから変換する方式を推奨。
 */
export const exportToPDF = async (
  specificationId: string
): Promise<Buffer> => {
  // TODO: Puppeteerを使用してPDF生成
  // const markdown = await exportToMarkdown(specificationId);
  // Puppeteer で HTML に変換してからPDF化

  throw new BadRequestError('PDF export is not implemented yet. Please use Markdown export.');
};

/**
 * 仕様書をWord形式にエクスポート
 *
 * 注意: 本実装ではdocxライブラリを使用する必要があるが、
 * MVP段階では未実装。
 */
export const exportToWord = async (
  specificationId: string
): Promise<Buffer> => {
  // TODO: docxライブラリを使用してWord文書生成

  throw new BadRequestError('Word export is not implemented yet. Please use Markdown export.');
};

/**
 * エクスポート形式に応じてエクスポート
 */
export const exportSpecification = async (
  specificationId: string,
  format: ExportFormat
): Promise<string | Buffer> => {
  switch (format) {
    case 'markdown':
      return exportToMarkdown(specificationId);
    case 'pdf':
      return exportToPDF(specificationId);
    case 'word':
      return exportToWord(specificationId);
    default:
      throw new BadRequestError(`Unsupported export format: ${format}`);
  }
};
