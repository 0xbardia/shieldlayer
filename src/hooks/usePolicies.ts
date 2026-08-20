"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPolicies, fetchPolicy } from "@/lib/contract-reads";
import { usePendingWrites } from "./usePendingWrites";

const ADDR_OK = /^0x[a-fA-F0-9]{40}$/;

export function usePolicies(address?: string | null) {
  const ready = Boolean(address && ADDR_OK.test(address));
  const { pending } = usePendingWrites();
  return useQuery({
    queryKey: ["policies", address?.toLowerCase()],
    enabled: ready,
    queryFn: () => fetchPolicies(address as string),
    refetchInterval: pending > 0 ? 15_000 : false,
  });
}

export function usePolicy(id: string | number) {
  const n = Number(id);
  return useQuery({
    queryKey: ["policy", id],
    enabled: Number.isFinite(n),
    queryFn: () => fetchPolicy(id),
  });
}
