"use client";

import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const {
    address,
    status,
    connect,
    connectWalletConnect,
    switchNetwork,
    disconnect,
    balance,
    error,
    networkName,
  } = useWallet();

  if (status === "wrong_network") {
    return (
      <Button onClick={switchNetwork} aria-label="Switch to GenLayer network">
        Switch network
      </Button>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-slate-500 sm:inline">
          {balance} GEN · {networkName || "GenLayer"}
        </span>
        <Button
          variant="outline"
          onClick={disconnect}
          aria-label="Disconnect wallet"
        >
          {truncateAddress(address)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex gap-2">
        <Button onClick={connect} aria-label="Connect MetaMask">
          {status === "connecting" ? "Connecting…" : "MetaMask"}
        </Button>
        <Button
          variant="outline"
          onClick={connectWalletConnect}
          aria-label="Connect WalletConnect"
        >
          WalletConnect
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
