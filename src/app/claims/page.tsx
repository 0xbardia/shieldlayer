"use client";

import { useWallet } from "@/hooks/useWallet";
import { useClaims } from "@/hooks/useClaims";
import Link from "next/link";
import { Shimmer } from "@/components/ui/Shimmer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { QueryError } from "@/components/shared/QueryError";
import { StatusBadge } from "@/components/StatusBadge";

export default function ClaimsPage() {
  const { address, connect } = useWallet();
  const { data, isLoading, error, refetch } = useClaims(address);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <AnimatedSection>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Claims</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Track and manage your insurance claims.
        </p>
      </AnimatedSection>

      {!address ? (
        <AnimatedSection delay={0.1}>
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Connect your wallet</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connect your wallet to view and file claims.
            </p>
            <button
              onClick={connect}
              className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              aria-label="Connect wallet to view claims"
            >
              Connect Wallet
            </button>
          </div>
        </AnimatedSection>
      ) : isLoading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <AnimatedSection>
          <QueryError message={(error as Error).message} onRetry={() => void refetch()} />
        </AnimatedSection>
      ) : (
        <AnimatedSection delay={0.1}>
          <ul className="mt-8 space-y-4" role="list">
            {(data ?? []).map((c, i) => (
              <AnimatedSection key={c.claim_id} delay={i * 0.05}>
                <li className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft card-hover dark:border-slate-800 dark:bg-slate-900">
                  <Link
                    href={`/claim/${c.claim_id}`}
                    className="block focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-2xl"
                    aria-label={`View claim ${c.claim_id}`}
                  >
                    <div className="flex flex-nowrap items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                            Claim #{c.claim_id}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            Policy {c.policy_id} · Confidence {c.confidence}
                          </p>
                          {c.status === "pending_manual_review" ? (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                              Oracle sources could not confirm automatically; claim queued for manual review.
                            </p>
                          ) : null}
                        </div>
                      <div className="flex shrink-0 flex-nowrap items-center gap-3">
                        <StatusBadge status={c.status} />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {c.payout.toLocaleString()} GEN
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              </AnimatedSection>
            ))}
          </ul>
          {!data?.length ? (
            <AnimatedSection>
              <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No claims yet</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  File a claim on one of your active policies.
                </p>
                <Link
                  href="/policies"
                  className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  View Policies
                </Link>
              </div>
            </AnimatedSection>
          ) : null}
        </AnimatedSection>
      )}
    </div>
  );
}
