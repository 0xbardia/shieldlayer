"use client";

import { CONTRACT_ADDRESS } from "@/lib/constants";

export function QueryError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
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
