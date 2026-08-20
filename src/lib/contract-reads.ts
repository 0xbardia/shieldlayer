import { mapReadError, readContract, SHIELD_READ_V2 } from "./genlayer-client";
import { toWeiBigInt } from "./utils";
import type { Claim, Policy, ProtocolStats } from "@/types";

void SHIELD_READ_V2;

async function proxyGet(path: string): Promise<unknown> {
  const res = await fetch(path);
  const data = (await res.json()) as { error?: string } & Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error ?? `proxy_${res.status}`));
  return data;
}

function bothFailed(proxyErr: unknown, directErr: unknown): Error {
  const a = proxyErr instanceof Error ? proxyErr.message : String(proxyErr);
  const b = directErr instanceof Error ? directErr.message : String(directErr);
  return new Error(`Could not load on-chain data. Proxy: ${a}. Direct: ${mapReadError(directErr) || b}`);
}

const USER_RE = /^0x[a-fA-F0-9]{40}$/;

function normalizeUser(address: string): string {
  const a = (address || "").trim();
  if (!USER_RE.test(a)) {
    throw new Error("Connect a wallet to view this data.");
  }
  return a.toLowerCase();
}

function asNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function asStr(v: unknown): string {
  return v == null ? "" : String(v);
}

export function parsePolicy(raw: unknown): Policy | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.error === "not_found") return null;
  return {
    policy_id: asNum(o.policy_id),
    policy_type: asStr(o.policy_type) as Policy["policy_type"],
    beneficiary: asStr(o.beneficiary),
    coverage_amount: asNum(o.coverage_amount),
    premium_paid: asNum(o.premium_paid),
    event_data: typeof o.event_data === "string" ? o.event_data : JSON.stringify(o.event_data ?? {}),
    status: asStr(o.status) as Policy["status"],
    purchase_timestamp: asNum(o.purchase_timestamp),
    claim_id: o.claim_id == null ? null : asNum(o.claim_id),
    verification_result:
      o.verification_result && typeof o.verification_result === "object"
        ? (o.verification_result as Record<string, unknown>)
        : null,
  };
}

export function parseClaim(raw: unknown): Claim | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.error === "not_found") return null;
  return {
    claim_id: asNum(o.claim_id),
    policy_id: asNum(o.policy_id),
    claimant: asStr(o.claimant ?? o.beneficiary),
    status: asStr(o.status) as Claim["status"],
    payout: asNum(o.payout),
    filed_timestamp: asNum(o.filed_timestamp),
    verification_result:
      o.verification_result && typeof o.verification_result === "object"
        ? (o.verification_result as Record<string, unknown>)
        : null,
    confidence: asNum(o.confidence),
  };
}

export function parseStats(raw: unknown): ProtocolStats {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    total_policies: asNum(o.total_policies),
    total_claims: asNum(o.total_claims),
    premium_pool: asNum(o.premium_pool),
    approved_claims: asNum(o.approved_claims),
    rejected_claims: asNum(o.rejected_claims),
    collateral_bps: o.collateral_bps == null ? undefined : asNum(o.collateral_bps),
  };
}

function asList(raw: unknown, key: string): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>)[key])) {
    return (raw as Record<string, unknown[]>)[key];
  }
  return [];
}

export async function fetchPolicies(address: string): Promise<Policy[]> {
  const user = normalizeUser(address);
  try {
    const data = await proxyGet(`/api/policies?address=${encodeURIComponent(user)}`);
    return asList(data, "policies").map(parsePolicy).filter((p): p is Policy => p != null);
  } catch {
    try {
      const raw = await readContract<unknown[]>("get_policies", [user]);
      return (Array.isArray(raw) ? raw : []).map(parsePolicy).filter((p): p is Policy => p != null);
    } catch {
      return [];
    }
  }
}

export async function fetchPolicy(id: string | number): Promise<Policy> {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("Policy not found");
  let proxyErr: unknown;
  try {
    const parsed = parsePolicy(await proxyGet(`/api/policies/${n}`));
    if (!parsed) throw new Error("Policy not found");
    return parsed;
  } catch (e) {
    proxyErr = e;
  }
  try {
    const parsed = parsePolicy(await readContract("get_policy", [n]));
    if (!parsed) throw new Error("Policy not found");
    return parsed;
  } catch (directErr) {
    throw bothFailed(proxyErr, directErr);
  }
}

export async function fetchClaims(address: string): Promise<Claim[]> {
  const user = normalizeUser(address);
  try {
    const data = await proxyGet(`/api/claims?address=${encodeURIComponent(user)}`);
    return asList(data, "claims").map(parseClaim).filter((c): c is Claim => c != null);
  } catch {
    try {
      const raw = await readContract<unknown[]>("get_claims_by_user", [user]);
      return (Array.isArray(raw) ? raw : []).map(parseClaim).filter((c): c is Claim => c != null);
    } catch {
      return [];
    }
  }
}

export async function fetchClaim(id: string | number): Promise<Claim> {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("Claim not found");
  let proxyErr: unknown;
  try {
    const parsed = parseClaim(await proxyGet(`/api/claims/${n}`));
    if (!parsed) throw new Error("Claim not found");
    return parsed;
  } catch (e) {
    proxyErr = e;
  }
  try {
    const parsed = parseClaim(await readContract("get_claim", [n]));
    if (!parsed) throw new Error("Claim not found");
    return parsed;
  } catch (directErr) {
    throw bothFailed(proxyErr, directErr);
  }
}

export async function fetchClaimStatus(id: string | number) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("Claim not found");
  const parse = (raw: Record<string, unknown>) => ({
    status: asStr(raw?.status),
    payout: asNum(raw?.payout),
    payout_tx: raw?.payout_tx ? asStr(raw.payout_tx) : undefined,
    confidence: asNum(raw?.confidence),
    verification_result:
      raw?.verification_result && typeof raw.verification_result === "object"
        ? (raw.verification_result as Record<string, unknown>)
        : null,
  });
  let proxyErr: unknown;
  try {
    return parse((await proxyGet(`/api/claim?id=${n}`)) as Record<string, unknown>);
  } catch (e) {
    proxyErr = e;
  }
  try {
    return parse(await readContract<Record<string, unknown>>("check_claim_status", [n]));
  } catch (directErr) {
    throw bothFailed(proxyErr, directErr);
  }
}

export type PoolReserve = {
  contract_balance: bigint;
  premium_pool: bigint;
  required_reserve: bigint;
};

function parseReserve(raw: unknown): PoolReserve {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    contract_balance: toWeiBigInt(o.contract_balance ?? o.premium_pool ?? 0),
    premium_pool: toWeiBigInt(o.premium_pool ?? 0),
    required_reserve: toWeiBigInt(o.required_reserve ?? 0),
  };
}

export async function fetchReserve(): Promise<PoolReserve> {
  try {
    const res = await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ function: "get_reserve", args: [] }),
    });
    const data = (await res.json()) as { result?: unknown };
    if (res.ok && data.result) return parseReserve(data.result);
  } catch {
    /* fall through */
  }
  try {
    return parseReserve(await proxyGet("/api/stats"));
  } catch {
    return parseReserve(await readContract("get_reserve", []));
  }
}

export async function fetchStats(): Promise<ProtocolStats> {
  let proxyErr: unknown;
  try {
    return parseStats(await proxyGet("/api/stats"));
  } catch (e) {
    proxyErr = e;
  }
  try {
    return parseStats(await readContract("get_stats", []));
  } catch (directErr) {
    throw bothFailed(proxyErr, directErr);
  }
}
