"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/contract-reads";
import { usePendingWrites } from "./usePendingWrites";

export function useStats() {
  const { pending } = usePendingWrites();
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: pending > 0 ? 15_000 : false,
  });
}
