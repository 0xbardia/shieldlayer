"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { CHAIN_ID, GENLAYER_NETWORK, WC_PROJECT_ID } from "@/lib/constants";

type Status =
  | "idle"
  | "connecting"
  | "connected"
  | "wrong_network"
  | "no_wallet";

type EipProvider = Eip1193Provider & {
  on?: (e: string, fn: () => void) => void;
  removeListener?: (e: string, fn: () => void) => void;
};

function injected(): EipProvider | undefined {
  const w = window as unknown as {
    ethereum?: EipProvider & {
      providers?: EipProvider[];
      isMetaMask?: boolean;
      isBackpack?: boolean;
    };
  };
  const eth = w.ethereum;
  if (!eth) return undefined;
  const many = eth.providers;
  if (Array.isArray(many) && many.length) {
    const mm = many.find((p) => p && (p as { isMetaMask?: boolean }).isMetaMask);
    return mm || many[0];
  }
  return eth;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>("");
  const [providerKind, setProviderKind] = useState<"injected" | "walletconnect">(
    "injected",
  );

  const applyProvider = useCallback(async (eth: EipProvider) => {
    const provider = new BrowserProvider(eth);
    const network = await provider.getNetwork();
    const cid = Number(network.chainId);
    setChainId(cid);
    setNetworkName(
      network.name || (cid === CHAIN_ID ? "GenLayer Studio" : `chain ${cid}`),
    );
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    if (!accounts[0]) {
      setAddress(null);
      setStatus("idle");
      return;
    }
    setAddress(accounts[0]);
    const bal = await provider.getBalance(accounts[0]);
    setBalance((Number(bal) / 1e18).toFixed(4));
    setStatus(cid === CHAIN_ID ? "connected" : "wrong_network");
  }, []);

  const refresh = useCallback(async () => {
    const eth = injected();
    if (!eth) {
      setStatus("no_wallet");
      return;
    }
    await applyProvider(eth);
  }, [applyProvider]);

  useEffect(() => {
    void refresh();
    const eth = injected();
    if (!eth) return;
    const onAcc = () => void refresh();
    eth.on?.("accountsChanged", onAcc);
    eth.on?.("chainChanged", onAcc);
    return () => {
      eth.removeListener?.("accountsChanged", onAcc);
      eth.removeListener?.("chainChanged", onAcc);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    const eth = injected();
    if (!eth) {
      setStatus("no_wallet");
      setError("No wallet found. Install MetaMask or use WalletConnect.");
      return;
    }
    setStatus("connecting");
    setError(null);
    setProviderKind("injected");
    try {
      await eth.request({ method: "eth_requestAccounts" });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "User rejected";
      setError(msg);
      setStatus("idle");
    }
  }, [refresh]);

  const connectWalletConnect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      if (!WC_PROJECT_ID) {
        throw new Error(
          "WalletConnect project id missing. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
        );
      }
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const wc = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [CHAIN_ID],
        showQrModal: true,
        metadata: {
          name: "ShieldLayer",
          description: "ShieldLayer: Protection, On-Chain",
          url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3456",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
      await wc.enable();
      setProviderKind("walletconnect");
      await applyProvider(wc as unknown as EipProvider);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "WalletConnect failed");
      setStatus("idle");
    }
  }, [applyProvider]);

  const switchNetwork = useCallback(async () => {
    const eth = injected();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: GENLAYER_NETWORK.chainId }],
      });
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string };
      if (err?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [GENLAYER_NETWORK],
        });
      } else {
        setError(err?.message ?? "Network switch rejected");
      }
    }
    await refresh();
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("idle");
    setProviderKind("injected");
  }, []);

  return {
    address,
    balance,
    status,
    error,
    chainId,
    networkName,
    providerKind,
    connect,
    connectWalletConnect,
    disconnect,
    switchNetwork,
    refresh,
  };
}
