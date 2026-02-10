/**
 * useApi Hooks Tests
 *
 * Tests the useApi, usePaginatedApi, and useMutation hooks
 * including loading states, caching, retries, and error handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useApi, usePaginatedApi, useMutation, clearApiCache } from '../useApi';

beforeEach(() => {
  clearApiCache();
});

// ============================================================================
// useApi
// ============================================================================

describe('useApi', () => {
  test('fetches data on mount and sets loading states', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } });

    const { result } = renderHook(() => useApi(mockFetcher, 'test-key'));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(result.current.error).toBeNull();
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  test('skips fetch when skip option is true', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'value' });

    const { result } = renderHook(() =>
      useApi(mockFetcher, 'skip-key', { skip: true })
    );

    // Should not be loading and not fetched
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  test('handles fetch errors', async () => {
    const mockFetcher = jest.fn().mockRejectedValue(new Error('API failed'));

    const { result } = renderHook(() =>
      useApi(mockFetcher, 'error-key', { retries: 0 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API failed');
    expect(result.current.data).toBeNull();
  });

  test('retries on failure with configured retry count', async () => {
    jest.useFakeTimers();

    const mockFetcher = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockResolvedValueOnce({ data: 'success' });

    const { result } = renderHook(() =>
      useApi(mockFetcher, 'retry-key', { retries: 1 })
    );

    // Advance past the retry backoff (1000ms * 2^0 = 1000ms)
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('success');
    expect(mockFetcher).toHaveBeenCalledTimes(2); // initial + 1 retry

    jest.useRealTimers();
  });

  test('uses cache when available', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'fetched' });

    // First render - fetches and caches
    const { result: result1 } = renderHook(() =>
      useApi(mockFetcher, 'cache-key')
    );

    await waitFor(() => expect(result1.current.loading).toBe(false));
    expect(result1.current.data).toBe('fetched');

    // Second render - should have cached data immediately
    const { result: result2 } = renderHook(() =>
      useApi(mockFetcher, 'cache-key')
    );

    // Cache is available immediately, so not in loading state
    expect(result2.current.data).toBe('fetched');
  });

  test('refetch reloads data', async () => {
    let callCount = 0;
    const mockFetcher = jest.fn(() => {
      callCount++;
      return Promise.resolve({ data: `result-${callCount}` });
    });

    const { result } = renderHook(() => useApi(mockFetcher, 'refetch-key'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('result-1');

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe('result-2');
  });

  test('onRefresh sets refreshing state', async () => {
    let resolve: (val: any) => void;
    const mockFetcher = jest.fn().mockImplementation(
      () => new Promise((r) => { resolve = r; })
    );

    const { result } = renderHook(() => useApi(mockFetcher));

    // Resolve initial fetch
    await act(async () => {
      resolve!({ data: 'initial' });
    });

    // Start refresh
    let refreshPromise: Promise<void>;
    act(() => {
      refreshPromise = result.current.onRefresh();
    });

    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false); // loading stays false during refresh

    await act(async () => {
      resolve!({ data: 'refreshed' });
      await refreshPromise;
    });

    expect(result.current.refreshing).toBe(false);
    expect(result.current.data).toBe('refreshed');
  });

  test('mutate updates data locally', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: { count: 0 } });

    const { result } = renderHook(() => useApi(mockFetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.mutate({ count: 5 });
    });

    expect(result.current.data).toEqual({ count: 5 });
  });

  test('mutate with updater function', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: { count: 10 } });

    const { result } = renderHook(() => useApi(mockFetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.mutate((prev: any) => ({ count: prev.count + 1 }));
    });

    expect(result.current.data).toEqual({ count: 11 });
  });
});

// ============================================================================
// usePaginatedApi
// ============================================================================

describe('usePaginatedApi', () => {
  test('loads first page on mount', async () => {
    const items = [{ id: '1' }, { id: '2' }];
    const mockFetcher = jest.fn().mockResolvedValue({
      data: items,
      pagination: { totalPages: 3, totalItems: 50, hasNextPage: true },
    });

    const { result } = renderHook(() => usePaginatedApi(mockFetcher, 20));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(items);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.hasMore).toBe(true);
    expect(mockFetcher).toHaveBeenCalledWith(1, 20);
  });

  test('loadMore appends next page', async () => {
    const page1 = [{ id: '1' }, { id: '2' }];
    const page2 = [{ id: '3' }, { id: '4' }];

    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({
        data: page1,
        pagination: { totalPages: 2, totalItems: 4, hasNextPage: true },
      })
      .mockResolvedValueOnce({
        data: page2,
        pagination: { totalPages: 2, totalItems: 4, hasNextPage: false },
      });

    const { result } = renderHook(() => usePaginatedApi(mockFetcher, 2));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(page1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data).toEqual([...page1, ...page2]);
    expect(result.current.page).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  test('loadMore does nothing when no more pages', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({
      data: [{ id: '1' }],
      pagination: { totalPages: 1, totalItems: 1, hasNextPage: false },
    });

    const { result } = renderHook(() => usePaginatedApi(mockFetcher, 20));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    // Fetcher only called once (initial load), not again
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  test('onRefresh resets to page 1', async () => {
    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({
        data: [{ id: '1' }],
        pagination: { totalPages: 2, totalItems: 2, hasNextPage: true },
      })
      .mockResolvedValueOnce({
        data: [{ id: '2' }],
        pagination: { totalPages: 2, totalItems: 2, hasNextPage: false },
      })
      .mockResolvedValueOnce({
        data: [{ id: '1-refreshed' }],
        pagination: { totalPages: 2, totalItems: 2, hasNextPage: true },
      });

    const { result } = renderHook(() => usePaginatedApi(mockFetcher, 1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Load page 2
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data).toHaveLength(2);

    // Refresh back to page 1
    await act(async () => {
      await result.current.onRefresh();
    });

    expect(result.current.data).toEqual([{ id: '1-refreshed' }]);
    expect(result.current.page).toBe(1);
  });

  test('handles fetch error', async () => {
    const mockFetcher = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePaginatedApi(mockFetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toEqual([]);
  });

  test('skips fetch when skip option is true', async () => {
    const mockFetcher = jest.fn();

    const { result } = renderHook(() =>
      usePaginatedApi(mockFetcher, 20, { skip: true })
    );

    expect(result.current.loading).toBe(false);
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  test('falls back to item count heuristic when no pagination info', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({
      data: [{ id: '1' }, { id: '2' }, { id: '3' }],
      // no pagination object
    });

    const { result } = renderHook(() => usePaginatedApi(mockFetcher, 3));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 3 items returned with pageSize 3, so hasMore should be true
    expect(result.current.hasMore).toBe(true);
  });
});

// ============================================================================
// useMutation
// ============================================================================

describe('useMutation', () => {
  test('executes mutation and returns data', async () => {
    const mockMutationFn = jest.fn().mockResolvedValue({
      data: { id: 'new-1', name: 'Created' },
    });

    const { result } = renderHook(() => useMutation(mockMutationFn));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.mutate({ name: 'Created' });
    });

    expect(returnedData).toEqual({ id: 'new-1', name: 'Created' });
    expect(result.current.data).toEqual({ id: 'new-1', name: 'Created' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('sets error on mutation failure', async () => {
    const mockMutationFn = jest.fn().mockRejectedValue(
      new Error('Validation failed')
    );

    const { result } = renderHook(() => useMutation(mockMutationFn));

    await act(async () => {
      try {
        await result.current.mutate({ invalid: true });
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('Validation failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  test('reset clears mutation state', async () => {
    const mockMutationFn = jest.fn().mockResolvedValue({
      data: { id: '1' },
    });

    const { result } = renderHook(() => useMutation(mockMutationFn));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.data).toEqual({ id: '1' });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('loading is true during mutation', async () => {
    let resolveMutation: (val: any) => void;
    const mockMutationFn = jest.fn().mockImplementation(
      () => new Promise((r) => { resolveMutation = r; })
    );

    const { result } = renderHook(() => useMutation(mockMutationFn));

    let mutationPromise: Promise<any>;
    act(() => {
      mutationPromise = result.current.mutate({});
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveMutation!({ data: 'done' });
      await mutationPromise;
    });

    expect(result.current.loading).toBe(false);
  });
});

// ============================================================================
// clearApiCache
// ============================================================================

describe('clearApiCache', () => {
  test('clears all cached data', async () => {
    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({ data: 'first' })
      .mockResolvedValueOnce({ data: 'second' });

    // Fetch and cache
    const { result: r1 } = renderHook(() => useApi(mockFetcher, 'clear-test'));
    await waitFor(() => expect(r1.current.loading).toBe(false));
    expect(r1.current.data).toBe('first');

    // Clear cache
    clearApiCache();

    // New render should not have cached data
    const { result: r2 } = renderHook(() => useApi(mockFetcher, 'clear-test'));
    expect(r2.current.data).toBeNull(); // no cache hit
    expect(r2.current.loading).toBe(true);
  });
});
