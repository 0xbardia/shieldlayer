"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClaim, fetchClaims, fetchClaimStatus } from "@/lib/contract-reads";
import { usePendingWrites } from "./usePendingWrites";

const ADDR_OK = /^0x[a-fA-F0-9]{40}$/;

export function useClaims(address?: string | null) {
  const ready = Boolean(address && ADDR_OK.test(address));
  const { pending } = usePendingWrites();
  return useQuery({
    queryKey: ["claims", address?.toLowerCase()],
    enabled: ready,
    queryFn: () => fetchClaims(address as string),
    refetchInterval: pending > 0 ? 15_000 : false,
  });
}

export function useClaim(id: string | number) {
  const n = Number(id);
  return useQuery({
    queryKey: ["claim", id],
    enabled: Number.isFinite(n),
    queryFn: () => fetchClaim(id),
  });
}

export function useClaimStatus(id: string | number) {
  const n = Number(id);
  return useQuery({
    queryKey: ["claim-status", id],
    enabled: Number.isFinite(n),
    queryFn: () => fetchClaimStatus(id),
    refetchInterval: 30_000,
  });
}
