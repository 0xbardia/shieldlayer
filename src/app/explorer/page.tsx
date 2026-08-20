"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPolicyR,
  fetchClaimR,
  fetchClaimStatusR,
  type PolicyData,
  type ClaimData,
  type ClaimStatusData,
  type ReadResult,
} from "@/lib/resilient-read";
import { formatUnits } from "@/lib/utils";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Shimmer } from "@/components/ui/Shimmer";
import { StaleBanner } from "@/components/shared/StaleBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { VerificationDetails } from "@/components/VerificationDetails";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  SearchIcon,
  ShieldIcon,
  FileTextIcon,
  AlertIcon,
} from "@/components/ui/Icons";

/* ── Helpers ──────────────────────────────────────────────── */

function tryParseEvent(eventData: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(eventData);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function EventDataDisplay({ eventData }: { eventData: string }) {
  const data = tryParseEvent(eventData);
  const keys = Object.keys(data);
  if (!keys.length) {
    return (
      <span className="text-sm text-slate-400">No event data</span>
    );
  }
  return (
    <div className="space-y-2">
      {keys.map((k) => (
        <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {k.replace(/_/g, " ")}
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">
            {String(data[k])}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Confidence Bar ───────────────────────────────────────── */

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct < 40
      ? "bg-red-500"
      : pct < 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-slate-900 dark:text-white">
        {pct}%
      </span>
      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Policy Card ──────────────────────────────────────────── */

function PolicyCard({ policy }: { policy: PolicyData }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Policy #{policy.policy_id}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {policy.policy_type?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <StatusBadge status={policy.status} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Coverage</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatUnits(policy.coverage_amount)} GEN
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Premium Paid</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatUnits(policy.premium_paid)} GEN
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Beneficiary</span>
          <CopyButton text={policy.beneficiary} />
        </div>
        {policy.claim_id != null && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">Claim</span>
            <span className="text-sm font-medium text-brand">#{policy.claim_id}</span>
          </div>
        )}

        {/* Event Data */}
        <div className="pt-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Event Data
          </p>
          <EventDataDisplay eventData={policy.event_data} />
        </div>

        {/* Verification Result */}
        {policy.verification_result && (
          <div className="pt-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Verification
            </p>
            <VerificationDetails
              verificationResult={policy.verification_result}
              status={policy.status}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Claim Card ───────────────────────────────────────────── */

function ClaimCard({
  claim,
  status,
}: {
  claim: ClaimData;
  status: ClaimStatusData | undefined;
}) {
  const s = status?.status ?? claim.status;
  const conf = status?.confidence ?? claim.confidence;
  const vr = claim.verification_result;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Claim #{claim.claim_id}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Policy {claim.policy_id}
            </p>
          </div>
        </div>
        <StatusBadge status={s} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Payout</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatUnits(status?.payout ?? claim.payout)} GEN
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Confidence</span>
          <ConfidenceBar confidence={conf} />
        </div>
        {status?.payout_tx && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">TX</span>
            <CopyButton text={status.payout_tx} />
          </div>
        )}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Claimant</span>
          <CopyButton text={claim.claimant} />
        </div>

        {/* Verification Details (structured, NOT raw JSON) */}
        {vr && typeof vr === "object" && (
          <div className="pt-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Verification Details
            </p>
            <VerificationDetails
              verificationResult={vr}
              status={s}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Lookup Input ─────────────────────────────────────────── */

function LookupInput({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  icon: Icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            min="1"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onSearch}
        disabled={!value}
        className="rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        Search
      </button>
    </div>
  );
}

/* ── Not Found State ──────────────────────────────────────── */

function NotFound({ type }: { type: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <AlertIcon className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {type} not found. Check the ID and try again.
      </p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function ExplorerPage() {
  const [policyId, setPolicyId] = useState("");
  const [claimId, setClaimId] = useState("");
  const [activePolicyId, setActivePolicyId] = useState<number | null>(null);
  const [activeClaimId, setActiveClaimId] = useState<number | null>(null);

  const searchPolicy = useCallback(() => {
    const n = Number(policyId);
    if (Number.isFinite(n) && n > 0) setActivePolicyId(n);
  }, [policyId]);

  const searchClaim = useCallback(() => {
    const n = Number(claimId);
    if (Number.isFinite(n) && n > 0) setActiveClaimId(n);
  }, [claimId]);

  const policyQ = useQuery<ReadResult<PolicyData>, Error>({
    queryKey: ["explorer", "policy", activePolicyId],
    queryFn: () => fetchPolicyR(activePolicyId!),
    enabled: activePolicyId !== null,
    retry: false,
    staleTime: 30_000,
  });

  const claimQ = useQuery<ReadResult<ClaimData>, Error>({
    queryKey: ["explorer", "claim", activeClaimId],
    queryFn: () => fetchClaimR(activeClaimId!),
    enabled: activeClaimId !== null,
    retry: false,
    staleTime: 30_000,
  });

  const claimStatusQ = useQuery<ReadResult<ClaimStatusData>, Error>({
    queryKey: ["explorer", "claim-status", activeClaimId],
    queryFn: () => fetchClaimStatusR(activeClaimId!),
    enabled: activeClaimId !== null,
    retry: false,
    staleTime: 10_000,
    refetchInterval: activeClaimId !== null ? 15_000 : false,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <AnimatedSection>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Explorer
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Look up any policy or claim on ShieldLayer. No wallet required.
        </p>
      </AnimatedSection>

      {/* Policy Lookup */}
      <AnimatedSection delay={0.1}>
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <ShieldIcon className="h-4 w-4 text-brand" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Policy Lookup
            </h2>
          </div>
          <LookupInput
            label="Policy ID"
            placeholder="e.g. 1"
            value={policyId}
            onChange={setPolicyId}
            onSearch={searchPolicy}
            icon={SearchIcon}
          />

          {policyQ.isLoading && activePolicyId && (
            <div className="mt-4">
              <Shimmer className="h-48" />
            </div>
          )}

          {policyQ.isError && activePolicyId && (
            <div className="mt-4">
              <NotFound type="Policy" />
            </div>
          )}

          {policyQ.data && !policyQ.isError && activePolicyId && (
            <div className="mt-4">
              {policyQ.data.stale && (
                <StaleBanner
                  updatedAt={policyQ.data.updatedAt
                    ? new Date(policyQ.data.updatedAt).toISOString()
                    : null}
                  onRetry={() => void policyQ.refetch()}
                />
              )}
              {(policyQ.data.data as unknown as { error?: string })?.error ===
              "not_found" ? (
                <NotFound type="Policy" />
              ) : (
                <PolicyCard policy={policyQ.data.data} />
              )}
            </div>
          )}

          {!activePolicyId && !policyQ.isLoading && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <ShieldIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">
                Enter a policy ID to view details
              </p>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Claim Lookup */}
      <AnimatedSection delay={0.2}>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <FileTextIcon className="h-4 w-4 text-brand" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Claim Lookup
            </h2>
          </div>
          <LookupInput
            label="Claim ID"
            placeholder="e.g. 1"
            value={claimId}
            onChange={setClaimId}
            onSearch={searchClaim}
            icon={SearchIcon}
          />

          {claimQ.isLoading && activeClaimId && (
            <div className="mt-4">
              <Shimmer className="h-48" />
            </div>
          )}

          {claimQ.isError && activeClaimId && (
            <div className="mt-4">
              <NotFound type="Claim" />
            </div>
          )}

          {claimQ.data && !claimQ.isError && activeClaimId && (
            <div className="mt-4">
              {claimQ.data.stale && (
                <StaleBanner
                  updatedAt={claimQ.data.updatedAt
                    ? new Date(claimQ.data.updatedAt).toISOString()
                    : null}
                  onRetry={() => void claimQ.refetch()}
                />
              )}
              {(claimQ.data.data as unknown as { error?: string })?.error ===
              "not_found" ? (
                <NotFound type="Claim" />
              ) : (
                <ClaimCard
                  claim={claimQ.data.data}
                  status={claimStatusQ.data?.data}
                />
              )}
            </div>
          )}

          {!activeClaimId && !claimQ.isLoading && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <FileTextIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">
                Enter a claim ID to view details
              </p>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}
