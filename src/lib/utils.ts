import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** `0x` + first 6 hex chars + … + last 4. */
export function truncateTxHash(hash: string) {
  const h = (hash || "").trim();
  if (h.length < 12) return h;
  const hex = h.startsWith("0x") || h.startsWith("0X") ? h.slice(2) : h;
  return `0x${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

export function explorerTxUrl(hash: string) {
  const base = "https://explorer-studio.genlayer.com";
  return `${base}/tx/${hash}`;
}

const WEI = 10n ** 18n;

export function toWeiBigInt(raw: unknown): bigint {
  if (typeof raw === "bigint") return raw >= 0n ? raw : 0n;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return BigInt(Math.max(0, Math.trunc(raw)));
  }
  if (typeof raw === "string" && raw.trim()) {
    const t = raw.trim();
    if (/^\d+$/.test(t)) return BigInt(t);
    const n = Number(t);
    if (Number.isFinite(n)) return BigInt(Math.max(0, Math.trunc(n)));
  }
  return 0n;
}

/** coverage and premium in the same unit space as the contract (wei). */
export function premiumFor(coverageWei: bigint | number, bps: number) {
  const cov = typeof coverageWei === "bigint" ? coverageWei : toWeiBigInt(coverageWei);
  const prem = (cov * BigInt(bps)) / 10_000n;
  return prem < 1n ? 1n : prem;
}

export function maxCoverageWei(contractBalanceWei: bigint, capBps: number): bigint {
  if (contractBalanceWei <= 0n || capBps <= 0) return 0n;
  return (contractBalanceWei * BigInt(capBps)) / 10_000n;
}

export function genToWei(gen: number): bigint {
  if (!Number.isFinite(gen) || gen <= 0) return 0n;
  const scaled = Math.round(gen * 1e6);
  return BigInt(scaled) * 10n ** 12n;
}

export function weiToGen(wei: bigint | number | string): number {
  const n = toWeiBigInt(wei);
  return Number(n / WEI) + Number(n % WEI) / 1e18;
}

export function formatUnits(n: number | bigint) {
  const v = typeof n === "bigint" ? weiToGen(n) : n >= 1e12 ? n / 1e18 : n;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(v);
}
