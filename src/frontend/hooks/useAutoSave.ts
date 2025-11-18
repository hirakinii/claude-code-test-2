import { useEffect, useState, useRef } from 'react';
import { debounce } from 'lodash';
import type { FieldValue } from '../types/dto';

/**
 * 自動保存フック
 * LocalStorage に自動的にデータを保存し、ブラウザリロード時に復元する
 */
export function useAutoSave(
  specificationId: string | null,
  data: Record<string, FieldValue>,
  delay: number = 500
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // debounce 関数を useRef で保持（再レンダリング時の再作成を防ぐ）
  const debouncedSave = useRef(
    debounce((id: string, dataToSave: Record<string, FieldValue>) => {
      try {
        setIsSaving(true);
        const key = `wizard_data_${id}`;
        localStorage.setItem(key, JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay)
  ).current;

  // データが変更されたら自動保存
  useEffect(() => {
    if (specificationId && Object.keys(data).length > 0) {
      debouncedSave(specificationId, data);
    }

    // Cleanup: コンポーネントアンマウント時に pending な保存をキャンセル
    return () => {
      debouncedSave.cancel();
    };
  }, [specificationId, data, debouncedSave]);

  /**
   * LocalStorage からデータを復元
   */
  const loadFromLocalStorage = (id: string): Record<string, FieldValue> | null => {
    try {
      const key = `wizard_data_${id}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  };

  /**
   * LocalStorage からデータを削除（保存完了後に呼び出す）
   */
  const clearLocalStorage = (id: string) => {
    try {
      const key = `wizard_data_${id}`;
      localStorage.removeItem(key);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  return {
    isSaving,
    lastSaved,
    loadFromLocalStorage,
    clearLocalStorage,
  };
}
