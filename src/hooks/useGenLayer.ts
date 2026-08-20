"use client";

import { useMutation } from "@tanstack/react-query";
import { BrowserProvider } from "ethers";
import { writeContract, mapWalletWriteError, type WriteStage } from "@/lib/genlayer-client";
import { CHAIN_ID } from "@/lib/constants";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function injected(): EthereumProvider | undefined {
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export function useGenLayer() {
  const write = useMutation({
    mutationFn: async ({
      method,
      args,
      value = 0n,
      onStage,
      signal,
    }: {
      method: string;
      args: unknown[];
      value?: bigint;
      onStage?: (stage: WriteStage) => void;
      signal?: AbortSignal;
    }) => {
      const eth = injected();
      if (!eth) throw new Error("No wallet");
      const provider = new BrowserProvider(eth);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        throw new Error("Switch to GenLayer Studio (61999) first");
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      if (!address) throw new Error("Connect a wallet first");
      return writeContract({
        functionName: method,
        args,
        value,
        address,
        provider: eth,
        signMessage: (message) => signer.signMessage(message),
        onStage,
        signal,
      });
    },
    onError: () => undefined,
  });

  return {
    write: {
      ...write,
      mutateAsync: async (vars: {
        method: string;
        args: unknown[];
        value?: bigint;
        onStage?: (stage: WriteStage) => void;
        signal?: AbortSignal;
      }) => {
        try {
          return await write.mutateAsync(vars);
        } catch (err) {
          throw new Error(mapWalletWriteError(err));
        }
      },
    },
  };
}
