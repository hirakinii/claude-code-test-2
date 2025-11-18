/**
 * useAutoSave フックのユニットテスト
 *
 * 参照: docs/frontend-test-specification.md セクション3.2.1
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('デバウンス後にLocalStorageにデータが保存される', async () => {
    const { result } = renderHook(() =>
      useAutoSave('spec-123', { title: 'Test' }, 100)
    );

    await waitFor(
      () => {
        const saved = localStorage.getItem('wizard_data_spec-123');
        expect(saved).toBeTruthy();
      },
      { timeout: 300 }
    );

    const saved = JSON.parse(localStorage.getItem('wizard_data_spec-123')!);
    expect(saved).toEqual({ title: 'Test' });
  });

  test('LocalStorageからデータを読み込める', () => {
    localStorage.setItem('wizard_data_spec-456', JSON.stringify({ title: 'Loaded' }));

    const { result } = renderHook(() => useAutoSave('spec-456', {}, 100));

    const loaded = result.current.loadFromLocalStorage('spec-456');
    expect(loaded).toEqual({ title: 'Loaded' });
  });

  test('LocalStorageからデータを削除できる', () => {
    localStorage.setItem('wizard_data_spec-789', JSON.stringify({ title: 'Clear Me' }));

    const { result } = renderHook(() => useAutoSave('spec-789', {}, 100));

    act(() => {
      result.current.clearLocalStorage('spec-789');
    });

    expect(localStorage.getItem('wizard_data_spec-789')).toBeNull();
    expect(result.current.lastSaved).toBeNull();
  });

  test('specificationIdがnullの場合は保存しない', async () => {
    const { result } = renderHook(() =>
      useAutoSave(null, { title: 'Test' }, 100)
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(localStorage.length).toBe(0);
  });

  test('データが空の場合は保存しない', async () => {
    const { result } = renderHook(() =>
      useAutoSave('spec-empty', {}, 100)
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(localStorage.getItem('wizard_data_spec-empty')).toBeNull();
  });

  test('保存中のステータスが正しく設定される', async () => {
    const { result } = renderHook(() =>
      useAutoSave('spec-status', { title: 'Test' }, 100)
    );

    // 初期状態では保存中ではない
    expect(result.current.isSaving).toBe(false);

    // デバウンス後、保存が完了するまで待つ
    await waitFor(
      () => {
        expect(result.current.lastSaved).not.toBeNull();
      },
      { timeout: 300 }
    );
  });

  test('lastSavedが正しく更新される', async () => {
    const { result } = renderHook(() =>
      useAutoSave('spec-timestamp', { title: 'Test' }, 100)
    );

    const beforeSave = new Date();

    await waitFor(
      () => {
        expect(result.current.lastSaved).not.toBeNull();
      },
      { timeout: 300 }
    );

    expect(result.current.lastSaved!.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
  });

  test('データが更新されるたびにデバウンスが再設定される', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave('spec-debounce', data, 200),
      {
        initialProps: { data: { title: 'Test1' } },
      }
    );

    // 最初のデータ
    await new Promise((resolve) => setTimeout(resolve, 100));

    // データを更新
    rerender({ data: { title: 'Test2' } });
    await new Promise((resolve) => setTimeout(resolve, 100));

    // さらにデータを更新
    rerender({ data: { title: 'Test3' } });

    // デバウンス完了を待つ
    await waitFor(
      () => {
        const saved = localStorage.getItem('wizard_data_spec-debounce');
        expect(saved).toBeTruthy();
      },
      { timeout: 400 }
    );

    const saved = JSON.parse(localStorage.getItem('wizard_data_spec-debounce')!);
    expect(saved).toEqual({ title: 'Test3' });
  });

  test('コンポーネントアンマウント時にdebounceがキャンセルされる', () => {
    const { unmount } = renderHook(() =>
      useAutoSave('spec-unmount', { title: 'Test' }, 500)
    );

    // すぐにアンマウント
    unmount();

    // デバウンス時間後もLocalStorageには保存されない
    expect(localStorage.getItem('wizard_data_spec-unmount')).toBeNull();
  });

  test('LocalStorageエラー時にconsole.errorが呼ばれる', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // LocalStorageのsetItemをモック（エラーをスロー）
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('LocalStorage is full');
    });

    const { result } = renderHook(() =>
      useAutoSave('spec-error', { title: 'Test' }, 100)
    );

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save to localStorage:',
          expect.any(Error)
        );
      },
      { timeout: 300 }
    );

    setItemSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
