#!/usr/bin/env node
/**
 * Server-side Intelligent Contract view via genlayer-js (HTTP Studio RPC).
 * Same encoding as the verified-working Node client. No wallet.
 */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const contract = process.env.PUBLIC_CONTRACT_ADDRESS;
const rpc = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const fn = process.argv[2];
const args = JSON.parse(process.argv[3] || "[]");

if (!contract || !fn) {
  process.stderr.write("usage: genlayer_read.mjs <function> <json-args>\n");
  process.exit(2);
}

try {
  const client = createClient({ chain: studionet, endpoint: rpc });
  const result = await client.readContract({
    address: contract,
    functionName: fn,
    args,
  });
  process.stdout.write(JSON.stringify(result ?? null));
  process.exit(0);
} catch (err) {
  process.stderr.write(String(err && err.message ? err.message : err));
  process.exit(1);
}
