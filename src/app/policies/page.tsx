"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { usePolicies } from "@/hooks/usePolicies";
import { Shimmer } from "@/components/ui/Shimmer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import Link from "next/link";
import { FileClaimButton } from "@/components/claims/FileClaimButton";
import { QueryError } from "@/components/shared/QueryError";
import { TxHash } from "@/components/shared/TxHash";
import { formatUnits } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export default function PoliciesPage() {
  const { address, connect } = useWallet();
  const { data, isLoading, error, refetch } = usePolicies(address);
  /* Track per-policy submitted claim hashes (policyId → hash) */
  const [submittedHashes, setSubmittedHashes] = useState<Record<number, string>>({});

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Policies</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your active insurance policies.
            </p>
          </div>
          <Link
            href="/new-policy"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            + New Policy
          </Link>
        </div>
      </AnimatedSection>

      {!address ? (
        <AnimatedSection delay={0.1}>
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Connect your wallet</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connect your wallet to view your policies.
            </p>
            <button
              onClick={connect}
              className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              aria-label="Connect wallet to view policies"
            >
              Connect Wallet
            </button>
          </div>
        </AnimatedSection>
      ) : isLoading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <AnimatedSection>
          <QueryError message={(error as Error).message} onRetry={() => void refetch()} />
        </AnimatedSection>
      ) : (
        <AnimatedSection delay={0.1}>
          <ul className="mt-8 space-y-4" role="list">
            {(data ?? []).map((p, i) => (
              <AnimatedSection key={p.policy_id} delay={i * 0.05}>
                <li className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 max-sm:grid-cols-[auto_1fr_auto] max-sm:gap-3">
                    {/* Icon chip */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>

                    {/* Info column */}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                        #{p.policy_id} &middot; {p.policy_type.replace(/_/g, " ")}
                      </p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        Cover {formatUnits(p.coverage_amount)} GEN &middot; Premium {formatUnits(p.premium_paid)} GEN
                      </p>
                      {/* Post-submission hash — second line, never breaks the row */}
                      {submittedHashes[p.policy_id] && p.status !== "active" ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          Claim filed
                          <TxHash
                            hash={submittedHashes[p.policy_id]}
                            className="text-xs"
                          />
                        </p>
                      ) : null}
                    </div>

                    {/* Actions column */}
                    <div className="flex shrink-0 items-center gap-2">
                      <FileClaimButton
                        policy={p}
                        onClaimSubmitted={(hash) =>
                          setSubmittedHashes((prev) => ({ ...prev, [p.policy_id]: hash }))
                        }
                      />
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </li>
              </AnimatedSection>
            ))}
          </ul>
          {!data?.length ? (
            <AnimatedSection>
              <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0v3a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25v-3m-16.5-3h13.5m-13.5 0H21" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No policies yet</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Purchase your first parametric insurance policy.
                </p>
                <Link
                  href="/new-policy"
                  className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Get Insured
                </Link>
              </div>
            </AnimatedSection>
          ) : null}
        </AnimatedSection>
      )}
    </div>
  );
}
