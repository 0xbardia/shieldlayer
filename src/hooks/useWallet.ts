"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { CHAIN_ID, GENLAYER_NETWORK, WC_PROJECT_ID } from "@/lib/constants";

type Status = "idle" | "connecting" | "connected" | "wrong_network" | "no_wallet";

type EipProvider = Eip1193Provider & {
  on?: (e: string, fn: (...args: unknown[]) => void) => void;
  removeListener?: (e: string, fn: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isBackpack?: boolean;
  providers?: EipProvider[];
};

type AnnouncedDetail = { info: { rdns?: string; name?: string }; provider: EipProvider };

// Singleton registry populated by EIP-6963 announce events (and legacy window.ethereum).
const discovered: EipProvider[] = [];
let eip6963Bound = false;

function ensure6963Listener() {
  if (typeof window === "undefined" || eip6963Bound) return;
  eip6963Bound = true;
  window.addEventListener("eip6963:announceProvider" as unknown as string, ((ev: CustomEvent<AnnouncedDetail>) => {
    const p = ev.detail?.provider;
    if (p && !discovered.includes(p)) discovered.push(p);
  }) as EventListener);
  // Solicit announcements from EIP-6963 wallets.
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function legacyProviders(): EipProvider[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as { ethereum?: EipProvider };
  const eth = w.ethereum;
  if (!eth) return [];
  const many = (eth as { providers?: EipProvider[] }).providers;
  if (Array.isArray(many) && many.length) return many;
  return [eth];
}

function allProviders(): EipProvider[] {
  ensure6963Listener();
  // Merge EIP-6963 + legacy, deduped by identity.
  const merged = [...discovered];
  for (const p of legacyProviders()) {
    if (!merged.includes(p)) merged.push(p);
  }
  return merged;
}

function pickInjected(): EipProvider | undefined {
  const all = allProviders();
  if (!all.length) return undefined;
  // Prefer MetaMask; else first announced/provider.
  const mm = all.find((p) => (p as { isMetaMask?: boolean }).isMetaMask);
  if (mm) return mm;
  return all[0];
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>("");
  const [providerKind, setProviderKind] = useState<"injected" | "walletconnect">("injected");
  const listenersRef = useRef<{ eth: EipProvider; acc: () => void; chain: () => void } | null>(null);

  const applyProvider = useCallback(async (eth: EipProvider) => {
    const provider = new BrowserProvider(eth);
    const network = await provider.getNetwork();
    const cid = Number(network.chainId);
    setChainId(cid);
    setNetworkName(network.name || (cid === CHAIN_ID ? "GenLayer Studio" : `chain ${cid}`));
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
    const eth = pickInjected();
    if (!eth) {
      setStatus("no_wallet");
      return;
    }
    await applyProvider(eth);
  }, [applyProvider]);

  useEffect(() => {
    ensure6963Listener();
    // Re-request EIP-6963 providers on mount (wallet may announce late).
    if (typeof window !== "undefined") window.dispatchEvent(new Event("eip6963:requestProvider"));
    void refresh();
    // Defer listener attach by a tick so late EIP-6963 announces are captured.
    const t = setTimeout(() => {
      const eth = pickInjected();
      if (!eth || !eth.on) return;
      // Guard against duplicate registration across remounts.
      if (listenersRef.current?.eth === eth) return;
      // Remove previous listeners before attaching new.
      if (listenersRef.current) {
        listenersRef.current.eth.removeListener?.("accountsChanged", listenersRef.current.acc);
        listenersRef.current.eth.removeListener?.("chainChanged", listenersRef.current.chain);
      }
      const onAcc = () => void refresh();
      const onChain = () => void refresh();
      eth.on?.("accountsChanged", onAcc);
      eth.on?.("chainChanged", onChain);
      listenersRef.current = { eth, acc: onAcc, chain: onChain };
    }, 300);
    return () => {
      clearTimeout(t);
      if (listenersRef.current) {
        listenersRef.current.eth.removeListener?.("accountsChanged", listenersRef.current.acc);
        listenersRef.current.eth.removeListener?.("chainChanged", listenersRef.current.chain);
        listenersRef.current = null;
      }
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    const eth = pickInjected();
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
      if (!WC_PROJECT_ID) throw new Error("WalletConnect project id missing. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.");
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
    const eth = pickInjected();
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GENLAYER_NETWORK.chainId }] });
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string };
      if (err?.code === 4902) {
        await eth.request({ method: "wallet_addEthereumChain", params: [GENLAYER_NETWORK] });
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

  return { address, balance, status, error, chainId, networkName, providerKind, connect, connectWalletConnect, disconnect, switchNetwork, refresh };
}
