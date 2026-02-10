/**
 * Custom API Hooks
 *
 * Provides reusable data-fetching hooks with loading states,
 * error handling, caching, and pull-to-refresh support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseApiOptions {
  /** Skip the initial fetch */
  skip?: boolean;
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** Retry failed requests (default: 1) */
  retries?: number;
  /** Dependencies that trigger a refetch */
  deps?: any[];
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
  mutate: (newData: T | ((prev: T | null) => T)) => void;
}

interface UsePaginatedApiReturn<T> extends UseApiReturn<T[]> {
  page: number;
  totalPages: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

// ============================================================================
// CACHE
// ============================================================================

const apiCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string, duration: number): T | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() });

  // Evict oldest entries if cache grows too large
  if (apiCache.size > 100) {
    const oldest = Array.from(apiCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 20);
    oldest.forEach(([k]) => apiCache.delete(k));
  }
}

export function clearApiCache(): void {
  apiCache.clear();
}

// ============================================================================
// useApi - Single resource fetching
// ============================================================================

export function useApi<T>(
  fetcher: () => Promise<{ data: T }>,
  cacheKey?: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    skip = false,
    cacheDuration = DEFAULT_CACHE_DURATION,
    retries = 1,
    deps = [],
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: cacheKey ? getCachedData<T>(cacheKey, cacheDuration) : null,
    loading: !skip && !(cacheKey && getCachedData<T>(cacheKey, cacheDuration)),
    error: null,
    refreshing: false,
  });

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        loading: !isRefresh,
        refreshing: isRefresh,
        error: null,
      }));

      let lastError: string | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await fetcherRef.current();
          if (!mountedRef.current) return;

          const data = result.data;
          if (cacheKey) setCachedData(cacheKey, data);

          setState({
            data,
            loading: false,
            error: null,
            refreshing: false,
          });
          return;
        } catch (error: any) {
          lastError = error.message || 'An error occurred';

          if (attempt < retries) {
            // Wait before retry with exponential backoff
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: lastError,
      }));
    },
    [cacheKey, retries, ...deps]
  );

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, [fetchData, skip]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);
  const onRefresh = useCallback(() => fetchData(true), [fetchData]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T)) => {
      setState((prev) => ({
        ...prev,
        data: typeof newData === 'function'
          ? (newData as (prev: T | null) => T)(prev.data)
          : newData,
      }));
    },
    []
  );

  return { ...state, refetch, onRefresh, mutate };
}

// ============================================================================
// usePaginatedApi - Paginated list fetching
// ============================================================================

export function usePaginatedApi<T>(
  fetcher: (page: number, pageSize: number) => Promise<{
    data: T[];
    pagination?: {
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
    };
  }>,
  pageSize: number = 20,
  options: UseApiOptions = {}
): UsePaginatedApiReturn<T> {
  const { skip = false, deps = [] } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(!skip);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!mountedRef.current) return;

      try {
        const result = await fetcherRef.current(pageNum, pageSize);
        if (!mountedRef.current) return;

        const newItems = result.data || [];
        const pagination = result.pagination;

        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setPage(pageNum);

        if (pagination) {
          setTotalPages(pagination.totalPages);
          setHasMore(pagination.hasNextPage);
        } else {
          setHasMore(newItems.length >= pageSize);
        }

        setError(null);
      } catch (err: any) {
        if (!mountedRef.current) return;
        setError(err.message || 'Failed to load data');
      }
    },
    [pageSize, ...deps]
  );

  // Initial load
  useEffect(() => {
    if (!skip) {
      setLoading(true);
      fetchPage(1).finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    }
  }, [fetchPage, skip]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchPage(1);
    setLoading(false);
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    await fetchPage(page + 1, true);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  const mutate = useCallback(
    (newData: T[] | ((prev: T[] | null) => T[])) => {
      setItems((prev) =>
        typeof newData === 'function' ? newData(prev) : newData
      );
    },
    []
  );

  return {
    data: items,
    loading,
    error,
    refreshing,
    page,
    totalPages,
    hasMore,
    loadMore,
    loadingMore,
    refetch,
    onRefresh,
    mutate,
  };
}

// ============================================================================
// useMutation - For create/update/delete operations
// ============================================================================

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData }>
): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        if (mountedRef.current) {
          setData(result.data);
          setLoading(false);
        }
        return result.data;
      } catch (err: any) {
        const message = err.message || 'Operation failed';
        if (mountedRef.current) {
          setError(message);
          setLoading(false);
        }
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, loading, error, reset };
}

export default { useApi, usePaginatedApi, useMutation, clearApiCache };
