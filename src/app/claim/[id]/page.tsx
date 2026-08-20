"use client";

import { useParams } from "next/navigation";
import { useClaim, useClaimStatus } from "@/hooks/useClaims";
import { Shimmer } from "@/components/ui/Shimmer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useGenLayer } from "@/hooks/useGenLayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QueryError } from "@/components/shared/QueryError";
import { StatusBadge } from "@/components/StatusBadge";
import { VerificationDetails } from "@/components/VerificationDetails";
import { TxHash } from "@/components/shared/TxHash";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useClaim(params.id);
  const { write } = useGenLayer();

  const poll = useClaimStatus(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Shimmer className="h-8 w-48 mb-4" />
        <Shimmer className="h-4 w-32 mb-8" />
        <Shimmer className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <AnimatedSection>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950" role="alert">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-200">Claim not found</h3>
            <QueryError message={(error as Error).message} onRetry={() => void refetch()} />
            <Link href="/claims" className="mt-6 inline-block rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              Back to Claims
            </Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  const status = poll.data?.status ?? data?.status ?? "pending_verification";
  const steps = ["filed", "pending_verification", status];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <AnimatedSection>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/claims" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Back to claims">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Claim #{data?.claim_id}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Policy {data?.policy_id}
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Status timeline */}
      <AnimatedSection delay={0.1}>
        <ol className="mb-8 flex items-center gap-2" aria-label="Claim status timeline">
          {steps.map((s, i) => (
            <li key={`${s}-${i}`} className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-medium ${
                i === steps.length - 1 ? "bg-brand text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700"
              }`}>
                {i + 1}
              </span>
              <span className={`text-sm ${i === steps.length - 1 ? "font-medium text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                {s.replace(/_/g, " ")}
              </span>
              {i < steps.length - 1 && (
                <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700 mx-2" />
              )}
            </li>
          ))}
        </ol>
      </AnimatedSection>

      {/* Payout info */}
      <AnimatedSection delay={0.2}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Payout</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(poll.data?.payout ?? data?.payout ?? 0).toLocaleString()} GEN
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Confidence</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {((poll.data?.confidence ?? data?.confidence ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          {poll.data?.payout_tx && (
            <p className="mt-4 text-xs text-slate-400">
              TX: <TxHash hash={poll.data.payout_tx} className="font-mono" />
            </p>
          )}
        </div>
      </AnimatedSection>

      {/* Verification details */}
      <AnimatedSection delay={0.3}>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="p-5">
            <p className="font-medium text-slate-900 dark:text-white">Verification Details</p>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 px-5 pb-5">
            <VerificationDetails
              verificationResult={poll.data?.verification_result ?? data?.verification_result}
              status={status}
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Action button */}
      {(status === "pending_funding" || status === "pending_verification") && (
        <AnimatedSection delay={0.4}>
          <Button
            className="mt-6 w-full"
            type="button"
            onClick={async () => {
              await write.mutateAsync({
                method: "settle_claim",
                args: [Number(params.id)],
              });
              await refetch();
              await poll.refetch();
            }}
          >
            {write.isPending ? "Processing..." : "Retry Settlement"}
          </Button>
        </AnimatedSection>
      )}
    </div>
  );
}
