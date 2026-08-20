const _addr = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "").trim();
const STALE = /84ADD77c|76068aAD|e390956A/i;
export const CONTRACT_ADDRESS = STALE.test(_addr)
  ? "0x0000000000000000000000000000000000000000"
  : _addr || "0x0000000000000000000000000000000000000000";

export const CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ??
    process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ??
    61999,
);
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ??
  "https://studio.genlayer.com/api";

/** Must match contract.main.PREMIUM_BPS */
/** Must match contract EXPECTED_LOSS_BPS + OP_FEE_BPS */
export const PREMIUM_BPS: Record<string, number> = {
  flight_delay: 2200,
  storm: 1700,
  bankruptcy: 1200,
};

/** Must match contract.main.POLICY_CAP_BPS (1% of pool). */
export const POLICY_CAP_BPS = 100;

/** Premium as a fraction of coverage. Must match PREMIUM_BPS / 10_000. */
export const PREMIUM_RATE: Record<"flight_delay" | "storm" | "bankruptcy", number> = {
  flight_delay: 0.22,
  storm: 0.17,
  bankruptcy: 0.12,
};

export const POLICY_TYPES = [
  {
    id: "flight_delay" as const,
    title: "Flight delay",
    blurb: "Payout if your flight is delayed more than N hours.",
    example: "Did flight BA249 on 2026-08-01 delay more than 3 hours?",
    rateBps: PREMIUM_BPS.flight_delay,
  },
  {
    id: "storm" as const,
    title: "Storm",
    blurb: "Payout if wind exceeds a threshold at your location.",
    example: "Did wind exceed 80 km/h in Miami on 2026-09-12?",
    rateBps: PREMIUM_BPS.storm,
  },
  {
    id: "bankruptcy" as const,
    title: "Bankruptcy",
    blurb: "Payout if a named company files or loses >80% value.",
    example: "Did Acme Corp file for bankruptcy or lose 80% of equity?",
    rateBps: PREMIUM_BPS.bankruptcy,
  },
];

export const GENLAYER_NETWORK = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: "GenLayer Studio",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
