/**
 * Resilient read layer for ShieldLayer.
 *
 * Strategy:
 *  1. Backend proxy  → POST /api/read  (server-side RPC)
 *  2. Browser SDK    → genlayer-js readContract (Studio RPC)
 *  3. Raw fetch      → direct POST to Studio RPC endpoint
 *
 * Every call retries up to 3× with exponential backoff (1 s, 2 s, 4 s).
 * A 5 s AbortSignal timeout is applied per attempt.
 * On success the result is cached keyed by (function, args).
 * On total failure the cache is returned with `stale: true`.
 */

import { CONTRACT_ADDRESS, RPC_URL } from "./constants";

/* ------------------------------------------------------------------ */
/*  Tiny in-memory cache                                               */
/* ------------------------------------------------------------------ */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheKey(fn: string, args: unknown[]): string {
  return `${fn}::${JSON.stringify(args)}`;
}

function cached(key: string): CacheEntry<unknown> | undefined {
  return cache.get(key);
}

function store(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isZeroAddress(): boolean {
  return !CONTRACT_ADDRESS || /0{40}/.test(CONTRACT_ADDRESS);
}

/* ------------------------------------------------------------------ */
/*  Attempt 1: Backend proxy /api/read                                  */
/* ------------------------------------------------------------------ */

async function readViaBackend<T>(fn: string, args: unknown[]): Promise<T> {
  const res = await withTimeout(
    fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ function: fn, args }),
    }),
    5_000,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(String(body.error ?? `backend_${res.status}`));
  }
  const body = (await res.json()) as { result?: T; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result as T;
}

/* ------------------------------------------------------------------ */
/*  Attempt 2: Browser SDK (genlayer-js) readContract                   */
/* ------------------------------------------------------------------ */

async function readViaBrowser<T>(fn: string, args: unknown[]): Promise<T> {
  const { createReadClient } = await import("./genlayer-client");
  const sdk = await createReadClient();
  if (!sdk) throw new Error("browser_sdk_unavailable");
  const result = await withTimeout(
    sdk.readContract({ address: CONTRACT_ADDRESS, functionName: fn, args }),
    5_000,
  );
  return result as T;
}

/* ------------------------------------------------------------------ */
/*  Attempt 3: Raw fetch to Studio RPC                                  */
/* ------------------------------------------------------------------ */

function selector4(name: string): string {
  const KNOWN: Record<string, string> = {
    get_stats: "0xb810f1e2",
    get_premium_bps: "0x580046d6",
    get_owner: "0x8da5cb5b",
    get_reserve: "0x173b93b0",
    get_policy: "0x1a50b87b",
    get_policies: "0xb2d2c1f3",
    get_claim: "0xf4434594",
    get_claims_by_user: "0xc3c99144",
    check_claim_status: "0x0c5b4e94",
  };
  return KNOWN[name] ?? "0x00000000";
}

function encodeArgs(args: unknown[]): string {
  let hex = "";
  for (const a of args) {
    if (typeof a === "number" || typeof a === "bigint") {
      const big = BigInt(a);
      hex += big.toString(16).padStart(64, "0");
    } else if (typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a)) {
      hex += a.slice(2).toLowerCase().padStart(64, "0");
    } else if (typeof a === "string") {
      const bytes = new TextEncoder().encode(a);
      const padded = new Uint8Array(32);
      padded.set(bytes.slice(0, 32));
      hex += Array.from(padded).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  return hex;
}

async function readViaRawRpc<T>(fn: string, args: unknown[]): Promise<T> {
  const data = selector4(fn) + encodeArgs(args);
  const res = await withTimeout(
    fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data }, "latest"],
      }),
    }),
    5_000,
  );
  if (!res.ok) throw new Error(`raw_rpc_${res.status}`);
  const body = (await res.json()) as { result?: string; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "raw_rpc_error");
  if (!body.result) throw new Error("raw_rpc_no_result");
  try {
    const hexStr = body.result.startsWith("0x") ? body.result.slice(2) : body.result;
    const bytes = new Uint8Array(hexStr.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) ?? []);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const clean = text.replace(/\0/g, "").trim();
    return JSON.parse(clean) as T;
  } catch {
    throw new Error("decode_failed");
  }
}

/* ------------------------------------------------------------------ */
/*  Public API: resilientRead                                           */
/* ------------------------------------------------------------------ */

export interface ReadResult<T> {
  data: T;
  stale: boolean;
  source: "cache" | "backend" | "browser" | "raw_rpc";
  updatedAt: number;
}

type SourceFn = <T>(fn: string, args: unknown[]) => Promise<T>;

const SOURCES: SourceFn[] = [readViaBackend, readViaBrowser, readViaRawRpc];

/**
 * Try backend → browser SDK → raw RPC, with retries and caching.
 * Never throws when cache is available. On total failure throws.
 */
export async function resilientRead<T>(
  fn: string,
  args: unknown[] = [],
): Promise<ReadResult<T>> {
  if (isZeroAddress()) {
    const c = cached(cacheKey(fn, args));
    if (c) return { data: c.data as T, stale: true, source: "cache", updatedAt: c.ts };
    throw new Error("Contract is not deployed");
  }

  const key = cacheKey(fn, args);
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (let si = 0; si < SOURCES.length; si++) {
      try {
        const data = await SOURCES[si]<T>(fn, args);
        store(key, data);
        return {
          data,
          stale: false,
          source: si === 0 ? "backend" : si === 1 ? "browser" : "raw_rpc",
          updatedAt: Date.now(),
        };
      } catch {
        // try next source
      }
    }
    if (attempt < maxRetries - 1) await sleep(1000 * 2 ** attempt);
  }

  // All failed — return cached if available
  const c = cached(key);
  if (c) return { data: c.data as T, stale: true, source: "cache", updatedAt: c.ts };

  throw new Error("All read sources failed and no cache available");
}

/* ------------------------------------------------------------------ */
/*  Typed wrappers for each view method                                 */
/* ------------------------------------------------------------------ */

export interface StatsData {
  total_policies: number;
  total_claims: number;
  premium_pool: number;
  total_premium_pool: number;
  total_active_coverage: number;
  contract_balance: number;
  approved_claims: number;
  rejected_claims: number;
  required_reserve: number;
  collateral_bps: number;
  treasury_balance: number;
  paused: boolean;
}

export interface ReserveData {
  required_reserve: number;
  premium_pool: number;
  contract_balance: number;
  withdrawable: number;
  collateral_bps: number;
  outstanding: number;
  treasury_balance: number;
}

export interface OwnerData {
  owner: string;
  pending_owner: string;
  owner_proposed_at: number;
  paused: boolean;
}

export interface PremiumBpsData {
  flight_delay: number;
  storm: number;
  bankruptcy: number;
}

export interface PolicyData {
  policy_id: number;
  policy_type: string;
  beneficiary: string;
  coverage_amount: number;
  premium_paid: number;
  event_data: string;
  status: string;
  claim_id: number | null;
  verification_result: Record<string, unknown> | null;
  created_at?: number;
}

export interface ClaimData {
  claim_id: number;
  policy_id: number;
  claimant: string;
  status: string;
  payout: number;
  payout_tx: string | null;
  verification_result: Record<string, unknown> | null;
  confidence: number;
  filed_timestamp?: number;
}

export interface ClaimStatusData {
  claim_id: number;
  status: string;
  payout: number;
  payout_tx: string | null;
  confidence: number;
}

export function fetchStatsR(): Promise<ReadResult<StatsData>> {
  return resilientRead<StatsData>("get_stats", []);
}

export function fetchReserveR(): Promise<ReadResult<ReserveData>> {
  return resilientRead<ReserveData>("get_reserve", []);
}

export function fetchOwnerR(): Promise<ReadResult<OwnerData>> {
  return resilientRead<OwnerData>("get_owner", []);
}

export function fetchPremiumBpsR(): Promise<ReadResult<PremiumBpsData>> {
  return resilientRead<PremiumBpsData>("get_premium_bps", []);
}

export function fetchPolicyR(id: number): Promise<ReadResult<PolicyData>> {
  return resilientRead<PolicyData>("get_policy", [id]);
}

export function fetchPoliciesR(user: string): Promise<ReadResult<PolicyData[]>> {
  return resilientRead<PolicyData[]>("get_policies", [user]);
}

export function fetchClaimR(id: number): Promise<ReadResult<ClaimData>> {
  return resilientRead<ClaimData>("get_claim", [id]);
}

export function fetchClaimsByUserR(user: string): Promise<ReadResult<ClaimData[]>> {
  return resilientRead<ClaimData[]>("get_claims_by_user", [user]);
}

export function fetchClaimStatusR(id: number): Promise<ReadResult<ClaimStatusData>> {
  return resilientRead<ClaimStatusData>("check_claim_status", [id]);
}
