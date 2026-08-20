/**
 * ShieldLayer — paste these into DevTools on https://YOUR_SERVER_HOST
 * while MetaMask is on GenLayer Studio (chain 61999).
 *
 * This is a GenLayer Intelligent Contract (Python / GenVM), NOT an EVM ABI
 * contract. ethers.Contract("function fund_pool() payable") will NOT work.
 * Use genlayer-js (Script A–D). Script E is left only to show why ethers fails.
 *
 * Contract: set your deployed contract address below.
 */

const SHIELDLAYER_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";

/* ── Script A: load genlayer-js from CDN ───────────────────────────────
Paste this first. Wait for "✅ genlayer-js loaded".
*/
async function shieldlayerLoadSdk() {
  const [{ createClient }, { studionet }] = await Promise.all([
    import("https://esm.sh/genlayer-js@1.1.8"),
    import("https://esm.sh/genlayer-js@1.1.8/chains"),
  ]);
  window.__slCreateClient = createClient;
  window.__slStudionet = studionet;
  console.log("✅ genlayer-js loaded");
}
// await shieldlayerLoadSdk();

/* ── shared client ───────────────────────────────────────────────────── */
async function shieldlayerClient() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  if (!window.__slCreateClient) await shieldlayerLoadSdk();
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (Number.parseInt(chainId, 16) !== 61999) {
    throw new Error("Switch MetaMask to GenLayer Studio (61999 / 0xF22F)");
  }
  return window.__slCreateClient({
    chain: window.__slStudionet,
    endpoint: "https://studio.genlayer.com/api",
    account: accounts[0],
    provider: window.ethereum,
  });
}

/* ── Script B: fund the pool with 10 GEN ───────────────────────────────
Studio has no value field. This attaches 10 * 10^18 wei (10 GEN).
*/
async function shieldlayerFundPool() {
  const client = await shieldlayerClient();
  const hash = await client.writeContract({
    address: SHIELDLAYER_CONTRACT,
    functionName: "fund_pool",
    args: [],
    value: 10n * 10n ** 18n,
  });
  console.log("⏳ Funding TX:", hash);
  console.log("Wait ~2–3 min for Studio consensus, then run shieldlayerStats()");
  return hash;
}
// await shieldlayerFundPool();

/* ── Script C: purchase a flight_delay policy ──────────────────────────
Matches the dApp integer units: coverage 10000, premium 2200 (22% bps).
Requires a funded pool (policy cap is 1% of pool).
*/
async function shieldlayerBuyPolicy() {
  const client = await shieldlayerClient();
  const eventData = JSON.stringify({
    flight: "AA123",
    date: "2026-08-20",
    hours: 3,
  });
  const hash = await client.writeContract({
    address: SHIELDLAYER_CONTRACT,
    functionName: "purchase_policy",
    args: ["flight_delay", 10000, eventData],
    value: 2200n,
  });
  console.log("⏳ Purchase TX:", hash);
  console.log("After consensus, refresh /policies");
  return hash;
}
// await shieldlayerBuyPolicy();

/* ── Script D: file claim on policy id 1 ─────────────────────────────── */
async function shieldlayerFileClaim(policyId = 1) {
  const client = await shieldlayerClient();
  const hash = await client.writeContract({
    address: SHIELDLAYER_CONTRACT,
    functionName: "file_claim",
    args: [policyId],
    value: 0n,
  });
  console.log("⏳ Claim TX:", hash);
  console.log("After ~2 min: await shieldlayerClaimStatus(1)");
  return hash;
}
// await shieldlayerFileClaim(1);

async function shieldlayerStats() {
  const client = await shieldlayerClient();
  const stats = await client.readContract({
    address: SHIELDLAYER_CONTRACT,
    functionName: "get_stats",
    args: [],
  });
  console.log("📊 Stats:", stats);
  return stats;
}

async function shieldlayerClaimStatus(claimId = 1) {
  const client = await shieldlayerClient();
  const status = await client.readContract({
    address: SHIELDLAYER_CONTRACT,
    functionName: "check_claim_status",
    args: [claimId],
  });
  console.log("📋 Claim status:", status);
  return status;
}
