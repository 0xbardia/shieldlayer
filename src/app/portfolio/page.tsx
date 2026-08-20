"use client";

import { useWallet } from "@/hooks/useWallet";
import { useResilientQuery } from "@/hooks/useResilientQuery";
import {
  type PolicyData,
  type ClaimData,
} from "@/lib/resilient-read";
import { formatUnits } from "@/lib/utils";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Shimmer } from "@/components/ui/Shimmer";
import { StaleBanner } from "@/components/shared/StaleBanner";
import { RefreshBar } from "@/components/shared/RefreshBar";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/shared/CopyButton";
import Link from "next/link";
import {
  ShieldIcon,
  FileTextIcon,
  WalletIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

/* ── Empty State ──────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <Icon className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/* ── Connect Wall ─────────────────────────────────────────── */

function ConnectWall({ connect }: { connect: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <WalletIcon className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        Connect your wallet
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Connect your wallet to view your policies and claims.
      </p>
      <button
        onClick={connect}
        className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label="Connect wallet to view portfolio"
      >
        Connect Wallet
      </button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function PortfolioPage() {
  const { address, connect } = useWallet();

  const policies = useResilientQuery<PolicyData[]>(
    ["portfolio", "policies", address ?? ""],
    "get_policies",
    address ? [address] : [],
    { enabled: !!address },
  );

  const claims = useResilientQuery<ClaimData[]>(
    ["portfolio", "claims", address ?? ""],
    "get_claims_by_user",
    address ? [address] : [],
    { enabled: !!address },
  );

  const isStale = policies.isStaleData || claims.isStaleData;
  const updatedAt = policies.lastUpdated || claims.lastUpdated;
  const secondsAgo = policies.secondsAgo ?? claims.secondsAgo;
  const doRefresh = policies.hardRefresh;

  const policyList = policies.data?.data ?? [];
  const claimList = claims.data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Portfolio
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {address ? (
                <>
                  Policies and claims for{" "}
                  <CopyButton text={address} className="inline-flex" />
                </>
              ) : (
                "Connect your wallet to see your portfolio."
              )}
            </p>
          </div>
          {address && (
            <RefreshBar
              secondsAgo={secondsAgo}
              onRefresh={doRefresh}
              isLoading={policies.isFetching || claims.isFetching}
            />
          )}
        </div>
      </AnimatedSection>

      {!address ? (
        <AnimatedSection delay={0.1}>
          <div className="mt-12">
            <ConnectWall connect={connect} />
          </div>
        </AnimatedSection>
      ) : (
        <>
          {/* Stale banner */}
          {isStale && (
            <div className="mt-4">
              <StaleBanner
                updatedAt={updatedAt}
                onRetry={doRefresh}
              />
            </div>
          )}

          {/* Policies Section */}
          <AnimatedSection delay={0.1}>
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Policies
                </h2>
                <span className="text-sm text-slate-400">
                  {policies.isLoading ? "..." : policyList.length}
                </span>
              </div>

              {policies.isLoading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Shimmer key={i} className="h-20" />
                  ))}
                </div>
              ) : policyList.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={ShieldIcon}
                    title="No policies yet"
                    description="Purchase your first parametric insurance policy."
                    ctaLabel="Get Insured"
                    ctaHref="/new-policy"
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3" role="list">
                  {policyList.map((p, i) => (
                    <AnimatedSection key={p.policy_id} delay={0.15 + i * 0.03}>
                      <li className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft card-hover dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
                              <ShieldIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate">
                                #{p.policy_id} · {p.policy_type?.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Cover {formatUnits(p.coverage_amount)} GEN · Premium {formatUnits(p.premium_paid)} GEN
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={p.status} />
                            {p.status === "active" && (
                              <Link
                                href={`/new-policy?file_claim=${p.policy_id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/20 transition-colors"
                                aria-label={`File claim for policy ${p.policy_id}`}
                              >
                                <FileTextIcon className="h-3 w-3" />
                                File Claim
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    </AnimatedSection>
                  ))}
                </ul>
              )}
            </div>
          </AnimatedSection>

          {/* Claims Section */}
          <AnimatedSection delay={0.25}>
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Claims
                </h2>
                <span className="text-sm text-slate-400">
                  {claims.isLoading ? "..." : claimList.length}
                </span>
              </div>

              {claims.isLoading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Shimmer key={i} className="h-20" />
                  ))}
                </div>
              ) : claimList.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={FileTextIcon}
                    title="No claims yet"
                    description="File a claim on one of your active policies."
                    ctaLabel="View Policies"
                    ctaHref="/policies"
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3" role="list">
                  {claimList.map((c, i) => (
                    <AnimatedSection key={c.claim_id} delay={0.3 + i * 0.03}>
                      <li className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft card-hover dark:border-slate-800 dark:bg-slate-900">
                        <Link
                          href={`/claim/${c.claim_id}`}
                          className="block focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-2xl"
                          aria-label={`View claim ${c.claim_id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
                                <FileTextIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                                  Claim #{c.claim_id}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Policy {c.policy_id} · Confidence {Math.round(c.confidence * 100)}%
                                </p>
                                {c.status === "pending_manual_review" && (
                                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                    Queued for manual review.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <StatusBadge status={c.status} />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {formatUnits(c.payout)} GEN
                              </span>
                              <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" />
                            </div>
                          </div>
                        </Link>
                      </li>
                    </AnimatedSection>
                  ))}
                </ul>
              )}
            </div>
          </AnimatedSection>
        </>
      )}
    </div>
  );
}
