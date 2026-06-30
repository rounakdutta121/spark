"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseInfiniteCursorOptions<T> {
  fetchPage: (cursor?: string) => Promise<CursorPage<T>>;
  getKey: (item: T) => string;
  enabled?: boolean;
  /** When this value changes, the list reloads from the first page */
  reloadKey?: string;
}

export function useInfiniteCursor<T>({
  fetchPage,
  getKey,
  enabled = true,
  reloadKey = "",
}: UseInfiniteCursorOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const fetchPageRef = useRef(fetchPage);

  fetchPageRef.current = fetchPage;

  const load = useCallback(async (reset = false) => {
    if (!enabled || loadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    loadingRef.current = true;
    setError(null);

    if (reset) {
      setIsLoading(true);
      cursorRef.current = null;
      hasMoreRef.current = true;
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await fetchPageRef.current(
        reset ? undefined : cursorRef.current ?? undefined,
      );
      cursorRef.current = result.nextCursor;
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
      setItems((prev) =>
        reset ? result.items : [...prev, ...result.items],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [enabled]);

  const refresh = useCallback(async () => {
    hasMoreRef.current = true;
    setHasMore(true);
    await load(true);
  }, [load]);

  const removeByKey = useCallback(
    (key: string) => {
      setItems((prev) => prev.filter((item) => getKey(item) !== key));
    },
    [getKey],
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void load(true);
  }, [enabled, load, reloadKey]);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore: () => load(false),
    refresh,
    removeByKey,
  };
}
