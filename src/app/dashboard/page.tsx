"use client";

import { useWallet } from "@/hooks/useWallet";
import { usePolicies } from "@/hooks/usePolicies";
import { useClaims } from "@/hooks/useClaims";
import { useStats } from "@/hooks/useStats";
import { formatUnits } from "@/lib/utils";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Shimmer } from "@/components/ui/Shimmer";
import { StaleBanner } from "@/components/shared/StaleBanner";
import { RefreshBar } from "@/components/shared/RefreshBar";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ShieldCheckIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknoteIcon,
  LandmarkIcon,
  PauseIcon,
  TrendingUpIcon,
  AlertIcon,
  ClockIcon,
  WalletIcon,
  ArrowRightIcon,
  ActivityIcon,
} from "@/components/ui/Icons";
import Link from "next/link";

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function DashboardPage() {
  const { address, status, connect } = useWallet();
  const policies = usePolicies(address);
  const claims = useClaims(address);
  const stats = useStats();

  if (!address) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AnimatedSection>
          <div className="card p-12">
            <WalletIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h1 className="mt-4 text-2xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-500">Connect a wallet to see your book.</p>
            <button className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors" onClick={connect}>
              Connect Wallet
            </button>
            <p className="mt-2 text-xs text-slate-400">{status}</p>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  const isLoading = stats.isLoading || policies.isLoading || claims.isLoading;
  const isStale = stats.isStale || policies.isStale || claims.isStale;
  const updatedAt = policies.dataUpdatedAt ? timeAgo(Math.floor(policies.dataUpdatedAt / 1000)) : null;
  const doRefresh = () => { policies.refetch(); claims.refetch(); stats.refetch(); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <AnimatedSection>
        <h1 className="heading-section">Overview</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Your portfolio at a glance.</p>
      </AnimatedSection>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Shimmer key={i} className="h-24" />)
        ) : (
          <>
            <AnimatedSection delay={0.1}>
              <div className="card-flat flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-900/20">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Policies</p>
                  <p className="text-2xl font-bold tabular-nums">{policies.data?.length ?? 0}</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <div className="card-flat flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Claims</p>
                  <p className="text-2xl font-bold tabular-nums">{claims.data?.length ?? 0}</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="card-flat flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <BanknoteIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Pool Balance</p>
                  <p className="text-2xl font-bold tabular-nums">{formatUnits(stats.data?.premium_pool ?? 0)} GEN</p>
                </div>
              </div>
            </AnimatedSection>
          </>
        )}
      </div>

      {/* Refresh Bar */}
      <div className="mt-4">
        <RefreshBar secondsAgo={updatedAt ? Number(updatedAt) : null} onRefresh={doRefresh} isLoading={isLoading} />
      </div>

      {isStale && !isLoading && (
        <div className="mt-4">
          <StaleBanner updatedAt={updatedAt} onRetry={doRefresh} />
        </div>
      )}

      {/* Claims Pipeline */}
      <AnimatedSection delay={0.3}>
        <div className="mt-8 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Claims Pipeline</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Pending", icon: ClockIcon, count: claims.data?.filter(c => c.status === "pending_verification").length ?? 0, color: "text-amber-500" },
              { label: "Paid", icon: BanknoteIcon, count: claims.data?.filter(c => c.status === "paid").length ?? 0, color: "text-emerald-500" },
              { label: "Rejected", icon: XCircleIcon, count: claims.data?.filter(c => c.status === "rejected").length ?? 0, color: "text-red-500" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Recent Policies */}
      <AnimatedSection delay={0.35}>
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Policies</h2>
          {policies.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Shimmer key={i} className="h-20" />)}
            </div>
          ) : policies.data?.length ? (
            <div className="space-y-3">
              {policies.data.slice(0, 5).map((p, i) => (
                <div key={p.policy_id} className="card-flat flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <div>
                      <p className="text-sm font-medium">Policy #{p.policy_id}</p>
                      <p className="text-xs text-slate-500">{p.policy_type} · {formatUnits(p.coverage_amount)} GEN</p>
                    </div>
                  </div>
                  <Link href={`/claim/${p.policy_id}`} className="text-brand hover:text-brand-600 transition-colors">
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-flat text-center py-8">
              <p className="text-slate-500">No policies yet. <Link href="/new-policy" className="text-brand hover:underline">Buy cover</Link></p>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}
