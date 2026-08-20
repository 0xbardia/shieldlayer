"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState, useEffect } from "react";
import { resilientRead } from "@/lib/resilient-read";
import type { ReadResult } from "@/lib/resilient-read";

export type ResilientQueryResult<T> = ReturnType<typeof useQuery<ReadResult<T>, Error>> & {
  isStaleData: boolean;
  lastUpdated: string | null;
  secondsAgo: number | null;
  hardRefresh: () => void;
};

/**
 * Wraps react-query with the resilient read layer.
 * - refetchInterval: 20 s (auto-refresh)
 * - staleTime: 0 (always revalidate)
 * - Keeps last successful data on error (stale-while-revalidate)
 */
export function useResilientQuery<T>(
  queryKey: string[],
  fn: string,
  args: unknown[] = [],
  opts?: { enabled?: boolean; refetchInterval?: number },
): ResilientQueryResult<T> {
  const [now, setNow] = useState(Date.now());
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const query = useQuery<ReadResult<T>, Error>({
    queryKey: ["resilient", ...queryKey, fn, args],
    queryFn: () => resilientRead<T>(fn, args),
    staleTime: 0,
    gcTime: 300_000,
    refetchInterval: opts?.refetchInterval ?? 20_000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: opts?.enabled ?? true,
    placeholderData: (prev) => prev,
  });

  const updatedAt = query.data?.updatedAt ?? startRef.current;
  const secondsAgo = Math.max(0, Math.floor((now - updatedAt) / 1000));
  const lastUpdated = updatedAt ? new Date(updatedAt).toISOString() : null;

  const hardRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    ...query,
    isStaleData: query.data?.stale ?? false,
    lastUpdated,
    secondsAgo,
    hardRefresh,
  } as ResilientQueryResult<T>;
}
