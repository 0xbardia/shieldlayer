"use client";

import { CONTRACT_ADDRESS } from "@/lib/constants";

function isStaleError(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("rpc_unavailable") || m.includes("all read sources failed") || m.includes("proxy") || m.includes("rpc_timeout") || m.includes("timeout") || m.includes("failed to fetch") || m.includes("networkerror");
}

export function QueryError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  if (isStaleError(message)) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20" role="status" aria-live="polite">
        <p className="text-sm text-amber-800 dark:text-amber-300">Live data unavailable — showing cached data or empty state.</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30">
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  const mapped =
    message && message.toLowerCase().includes("missing or invalid parameters")
      ? `Could not read the contract (missing or invalid parameters). Contract in use: ${CONTRACT_ADDRESS}.`
      : message;
  const text =
    mapped && !mapped.startsWith("ERR_")
      ? mapped
      : "Could not load on-chain data. Connect MetaMask to GenLayer Studio and retry.";
  return (
    <div
      className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950"
      role="alert"
    >
      <p className="text-sm text-red-600 dark:text-red-400">{text}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
