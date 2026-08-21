"use client";

import { useState } from "react";
import { useGenLayer } from "@/hooks/useGenLayer";
import { formatUnits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui/Shimmer";

function genToWei(gen: number): bigint {
  return BigInt(Math.round(gen * 1e18));
}

export function FundPoolButton() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("10");
  const { write } = useGenLayer();
  const [stage, setStage] = useState<"idle" | "confirming" | "submitting" | "confirmed">("idle");

  const parsed = Number.parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const busy = stage === "confirming" || stage === "submitting";

  const handleFund = async () => {
    if (!valid) return;
    try {
      setStage("confirming");
      await write.mutateAsync({
        method: "fund_pool",
        args: [],
        value: genToWei(parsed),
        onStage: (s) => {
          if (s === "signing") setStage("confirming");
          if (s === "submitted") setStage("submitting");
        },
      });
      setStage("confirmed");
      setTimeout(() => {
        setOpen(false);
        setStage("idle");
      }, 2000);
    } catch {
      setStage("idle");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Fund
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fund Pool</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Add GEN tokens to the protocol premium pool.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Amount (GEN)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="mt-2 flex gap-2">
                {[1, 5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400 mb-4">
              <div className="flex justify-between">
                <span>Pool ({valid ? (parsed * 0.9).toFixed(2) : "0"} GEN)</span>
                <span>Treasury ({valid ? (parsed * 0.1).toFixed(2) : "0"} GEN)</span>
              </div>
            </div>

            {stage === "confirming" && (
              <div className="mb-4 flex items-center gap-2 text-sm text-amber-600">
                <Shimmer className="h-4 w-4" />
                Waiting for wallet confirmation...
              </div>
            )}

            {stage === "submitting" && (
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Transaction submitted...
              </div>
            )}

            {stage === "confirmed" && (
              <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Funded successfully!
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleFund} disabled={!valid || busy} className="flex-1">
                {busy ? "Funding..." : `Fund ${valid ? amount : "0"} GEN`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
