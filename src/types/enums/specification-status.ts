/**
 * 仕様書のステータス
 * Specification.status に対応
 *
 * 参照: docs/仕様書作成アプリ データモデル生成.md
 */

/**
 * 仕様書ステータスの列挙
 */
export enum SpecificationStatus {
  /**
   * 編集中
   * ユーザーがウィザードで作成・編集している状態
   */
  EDITING = 'editing',

  /**
   * 確認中
   * ウィザード完了後、確認画面で内容をチェックしている状態
   */
  REVIEWING = 'reviewing',

  /**
   * 保存済み
   * 確認画面から保存処理が完了した状態
   */
  SAVED = 'saved',
}

/**
 * SpecificationStatus型ガード
 * 文字列がSpecificationStatus型として有効かチェック
 */
export function isSpecificationStatus(value: string): value is SpecificationStatus {
  return Object.values(SpecificationStatus).includes(value as SpecificationStatus);
}

/**
 * SpecificationStatusの日本語表示名マッピング
 * UI表示用
 */
export const SpecificationStatusLabels: Record<SpecificationStatus, string> = {
  [SpecificationStatus.EDITING]: '編集中',
  [SpecificationStatus.REVIEWING]: '確認中',
  [SpecificationStatus.SAVED]: '保存済み',
};

/**
 * SpecificationStatusの色分けマッピング
 * UI表示用（トップページの「ステータスの視覚的識別」に対応）
 */
export const SpecificationStatusColors: Record<SpecificationStatus, string> = {
  [SpecificationStatus.EDITING]: 'blue',     // 編集中: 青
  [SpecificationStatus.REVIEWING]: 'yellow', // 確認中: 黄
  [SpecificationStatus.SAVED]: 'green',      // 保存済み: 緑
};
