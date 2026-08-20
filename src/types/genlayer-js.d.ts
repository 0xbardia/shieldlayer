declare module "genlayer-js" {
  export function createClient(config: {
    endpoint?: string;
    chain?: unknown;
    account?: string;
    provider?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }): {
    writeContract: (p: {
      address: string;
      functionName: string;
      args: unknown[];
      value?: bigint;
    }) => Promise<`0x${string}`>;
    waitForTransactionReceipt: (p: { hash: string }) => Promise<{
      status: string;
      hash: string;
    }>;
    readContract: (p: {
      address: string;
      functionName: string;
      args?: unknown[];
    }) => Promise<unknown>;
  };
}

declare module "genlayer-js/chains" {
  export const studionet: {
    id: number;
    name: string;
    rpcUrls: { default: { http: readonly string[] } };
    nativeCurrency: { name: string; symbol: string; decimals: number };
  };
}
