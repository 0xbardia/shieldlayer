import { CONTRACT_ADDRESS, RPC_URL } from "./constants";

/** Served-bundle marker so we can confirm the new read path is live. */
export const SHIELD_READ_V2 = "SHIELD_READ_V2";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type WriteStage = "waiting_signature" | "signing" | "submitting" | "submitted";

export type WriteParams = {
  functionName: string;
  args: unknown[];
  value?: bigint;
  address: string;
  provider: EthereumProvider;
  signMessage?: (message: string) => Promise<string>;
  onStage?: (stage: WriteStage) => void;
  signal?: AbortSignal;
};

export type GenLayerLike = {
  writeContract: (p: {
    address: string;
    functionName: string;
    args: unknown[];
    value?: bigint;
  }) => Promise<`0x${string}`>;
  waitForTransactionReceipt: (p: { hash: string }) => Promise<{ status: string; hash: string }>;
  readContract: (p: {
    address: string;
    functionName: string;
    args?: unknown[];
  }) => Promise<unknown>;
};

function injectedProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    ethereum?: EthereumProvider & {
      providers?: EthereumProvider[];
      isMetaMask?: boolean;
    };
  };
  const eth = w.ethereum;
  if (!eth) return undefined;
  const many = eth.providers;
  if (Array.isArray(many) && many.length) {
    const mm = many.find((p) => (p as { isMetaMask?: boolean }).isMetaMask);
    return mm || many[0];
  }
  return eth;
}

async function loadSdk(): Promise<{
  createClient: (c: {
    chain?: unknown;
    endpoint?: string;
    account?: string;
    provider?: EthereumProvider;
  }) => GenLayerLike;
  studionet: unknown;
}> {
  const [sdkMod, chainsMod] = await Promise.all([
    import("genlayer-js") as Promise<{
      createClient: (c: {
        chain?: unknown;
        endpoint?: string;
        account?: string;
        provider?: EthereumProvider;
      }) => GenLayerLike;
    }>,
    import("genlayer-js/chains") as Promise<{ studionet: unknown }>,
  ]);
  return { createClient: sdkMod.createClient, studionet: chainsMod.studionet };
}

/** Writes: Studio chain + injected wallet. Never pass a private key. */
export async function createBrowserClient(opts?: {
  account?: string;
  provider?: EthereumProvider;
}): Promise<GenLayerLike | null> {
  try {
    const { createClient, studionet } = await loadSdk();
    const provider = opts?.provider ?? injectedProvider();
    return createClient({
      chain: studionet,
      endpoint: RPC_URL,
      account: opts?.account,
      provider,
    });
  } catch {
    return null;
  }
}

/** Reads: HTTP Studio RPC only. Do not use window.ethereum (it cannot gen_call). */
export async function createReadClient(): Promise<GenLayerLike | null> {
  try {
    const { createClient, studionet } = await loadSdk();
    return createClient({
      chain: studionet,
      endpoint: RPC_URL,
    });
  } catch {
    return null;
  }
}

/** Read-only client. Never used for writes. */
export async function createGenLayerClient(): Promise<GenLayerLike | null> {
  try {
    const mod = (await import("genlayer-js")) as {
      createClient?: (c: { endpoint: string }) => GenLayerLike;
    };
    if (typeof mod.createClient === "function") {
      return mod.createClient({ endpoint: RPC_URL });
    }
  } catch {
    return null;
  }
  return null;
}

function isZeroAddress(addr: string) {
  return /^0x0{40}$/i.test(addr);
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as {
      code?: number | string;
      shortMessage?: string;
      message?: string;
      cause?: { message?: string };
    };
    return o.shortMessage || o.cause?.message || o.message || String(err);
  }
  return String(err);
}

/** Map wallet / RPC failures to a user-facing message. Never leak internals. */
export function mapWalletWriteError(err: unknown): string {
  const raw = errorMessage(err);
  const lower = raw.toLowerCase();
  const code =
    err && typeof err === "object" && "code" in err
      ? (err as { code?: number | string }).code
      : undefined;

  if (lower === "cancelled" || lower.includes("aborted")) {
    return "Cancelled";
  }
  if (code === 4001 || code === "ACTION_REJECTED" || lower.includes("user rejected") || lower.includes("rejected the request")) {
    return "Signature rejected in wallet";
  }
  if (code === 4902 || lower.includes("unrecognized chain") || lower.includes("wallet_addethereumchain")) {
    return "Switch to GenLayer Studio (61999) in your wallet";
  }
  if (
    lower.includes("insufficient funds") ||
    lower.includes("insufficient balance") ||
    lower.includes("exceeds the balance")
  ) {
    return "Insufficient GEN balance for premium plus gas";
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch") || lower.includes("incorrect chain")) {
    return "Switch to GenLayer Studio (61999) first";
  }
  if (lower.includes("no account set")) {
    return "Wallet account is not connected. Connect MetaMask and try again.";
  }
  if (
    lower.includes("err_rpc_timeout") ||
    lower.includes("timeout") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror")
  ) {
    return "Could not reach GenLayer Studio. Connect MetaMask on chain 61999 and retry.";
  }
  if (lower.includes("revert") || lower.includes("execution reverted")) {
    const reason = raw.replace(/^[\s\S]*revert(?:ed)?:?\s*/i, "").trim();
    return reason && reason.length < 160 ? `Transaction reverted: ${reason}` : "Transaction reverted on-chain";
  }
  return raw || "Transaction rejected or failed";
}

/**
 * Writes MUST be signed in the browser. The client is created with the
 * wallet address + injected provider so MetaMask pops a signature prompt.
 * Never pass a private key.
 */
export async function writeContract(params: WriteParams): Promise<string> {
  const value = params.value ?? 0n;
  if (isZeroAddress(CONTRACT_ADDRESS)) {
    throw new Error("Network unavailable: contract is not deployed");
  }
  if (!params.address || isZeroAddress(params.address)) {
    throw new Error("Connect a wallet first");
  }
  if (!params.provider?.request) {
    throw new Error("No wallet");
  }

  try {
    const sdk = await createBrowserClient({
      account: params.address,
      provider: params.provider,
    });
    if (!sdk) {
      throw new Error("Network unavailable: GenLayer client could not be created");
    }

    params.onStage?.("waiting_signature");
    params.onStage?.("signing");
    const hash = await sdk.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: params.functionName,
      args: params.args,
      value,
    });
    if (params.signal?.aborted) {
      throw new Error("Cancelled");
    }
    if (!hash || String(hash).startsWith("local:")) {
      throw new Error("Off-chain simulation is disabled");
    }
    params.onStage?.("submitting");
    try {
      await sdk.waitForTransactionReceipt({ hash });
    } catch {
      // Receipt wait is best-effort; hash is still a submitted tx.
    }
    if (params.signal?.aborted) {
      throw new Error("Cancelled");
    }
    params.onStage?.("submitted");
    return hash;
  } catch (err) {
    throw new Error(mapWalletWriteError(err));
  }
}

export function mapReadError(err: unknown): string {
  const raw = errorMessage(err);
  const lower = raw.toLowerCase();
  if (lower.includes("err_rpc_timeout") || lower.includes("timeout") || lower.includes("failed to fetch")) {
    return "Could not load on-chain data. Connect MetaMask to GenLayer Studio (61999) and retry.";
  }
  if (lower.includes("not_found") || lower.includes("not found")) {
    return "Nothing found for that id.";
  }
  if (lower.includes("no wallet") || lower.includes("connect")) {
    return "Connect your wallet to load this data.";
  }
  if (lower.includes("missing or invalid parameters")) {
    return `Could not read the contract (missing or invalid parameters). Contract in use: ${CONTRACT_ADDRESS}. Confirm this matches the Studio deploy that includes fetch_evidence.`;
  }
  return raw && !raw.startsWith("ERR_")
    ? raw
    : "Could not load on-chain data. Retry after connecting your wallet.";
}

async function readViaBackend<T>(functionName: string, args: unknown[]): Promise<T> {
  const res = await fetch("/api/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: functionName, args }),
  });
  const data = (await res.json()) as { result?: T; error?: string };
  if (!res.ok) throw new Error(data.error ?? "backend_read_failed");
  return data.result as T;
}

/**
 * Primary path: genlayer-js in the browser (wallet provider / Studio RPC).
 * Fallback: backend /api/read if the browser client cannot complete.
 */
export async function readContract<T>(
  functionName: string,
  args: unknown[] = [],
  _opts?: { account?: string },
): Promise<T> {
  if (isZeroAddress(CONTRACT_ADDRESS)) {
    throw new Error("Contract is not deployed");
  }
  try {
    const sdk = await createReadClient();
    if (!sdk) throw new Error("browser_client_unavailable");
    const result = await sdk.readContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
    });
    return result as T;
  } catch (browserErr) {
    try {
      return await readViaBackend<T>(functionName, args);
    } catch {
      throw new Error(mapReadError(browserErr));
    }
  }
}
