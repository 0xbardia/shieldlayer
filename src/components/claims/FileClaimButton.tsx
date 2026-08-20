"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useGenLayer } from "@/hooks/useGenLayer";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/components/ui/Toast";
import { usePendingWrites } from "@/hooks/usePendingWrites";
import { TxHash } from "@/components/shared/TxHash";
import type { Policy, PolicyStatus } from "@/types";
import type { WriteStage } from "@/lib/genlayer-client";

const STAGE_LABEL: Record<WriteStage, string> = {
  waiting_signature: "Waiting for signature\u2026",
  signing: "Signing\u2026",
  submitting: "Submitting\u2026",
  submitted: "Submitted \u2713",
};

export function FileClaimButton({
  policy,
  onClaimSubmitted,
}: {
  policy: Policy;
  onClaimSubmitted?: (hash: string) => void;
}) {
  const { address, connect, status, switchNetwork } = useWallet();
  const { write } = useGenLayer();
  const qc = useQueryClient();
  const { toast } = useToast();
  const pendingWrites = usePendingWrites();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<WriteStage | null>(null);
  const [timeoutNotice, setTimeoutNotice] = useState(false);
  const [localStatus, setLocalStatus] = useState<PolicyStatus>(policy.status);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalStatus(policy.status);
  }, [policy.status]);

  const active = localStatus === "active";

  const closeModal = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    setOpen(false);
    setStage(null);
    setTimeoutNotice(false);
    write.reset();
  }, [write]);

  /* Focus trap: focus the modal on open */
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  /* ESC key closes modal */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const submit = async () => {
    setErr(null);
    setSubmittedHash(null);
    setTimeoutNotice(false);
    cancelledRef.current = false;
    if (!address) {
      await connect();
      return;
    }
    if (status === "wrong_network") {
      try {
        await switchNetwork();
      } catch {
        setErr("Switch to GenLayer Studio (61999) first");
        return;
      }
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setStage("waiting_signature");
    pendingWrites.begin();
    const guard = window.setTimeout(() => {
      if (!cancelledRef.current) setTimeoutNotice(true);
    }, 90_000);
    try {
      const hash = await write.mutateAsync({
        method: "file_claim",
        args: [policy.policy_id],
        value: 0n,
        signal: ac.signal,
        onStage: (s) => {
          if (!cancelledRef.current) setStage(s);
        },
      });
      if (cancelledRef.current) return;
      setStage("submitted");
      /* Optimistic: disable button immediately */
      setLocalStatus("pending_verification");
      setSubmittedHash(hash);
      onClaimSubmitted?.(hash);
      qc.setQueryData<Policy[]>(["policies", address.toLowerCase()], (old) =>
        (old ?? []).map((p) =>
          p.policy_id === policy.policy_id
            ? { ...p, status: "pending_verification" as PolicyStatus }
            : p,
        ),
      );
      setOpen(false);
      toast(
        "success",
        <span className="inline-flex items-center gap-1.5">
          Claim submitted{" "}
          <TxHash hash={hash} className="text-brand" />
        </span>,
      );
      await qc.invalidateQueries({ queryKey: ["policies"] });
      await qc.invalidateQueries({ queryKey: ["claims"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });

      /* Poll until status leaves pending_verification */
      pollRef.current = setInterval(async () => {
        try {
          await qc.refetchQueries({ queryKey: ["policies"] });
        } catch {
          /* ignore */
        }
      }, 10_000);
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 120_000);
    } catch (e) {
      if (cancelledRef.current) return;
      const message = e instanceof Error ? e.message : "Claim failed";
      closeModal();
      setErr(message === "Cancelled" ? null : message);
    } finally {
      window.clearTimeout(guard);
      pendingWrites.end();
      abortRef.current = null;
      if (!cancelledRef.current) setStage(null);
    }
  };

  /* Stop polling once real status is no longer pending_verification */
  useEffect(() => {
    if (localStatus !== "pending_verification" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [localStatus]);

  /* ── Modal (portaled to body so it never sits inside the grid) ── */
  const modal =
    open && active ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`claim-title-${policy.policy_id}`}
        className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-md rounded-xl bg-white p-6 shadow-soft outline-none dark:bg-slate-900"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <h2 id={`claim-title-${policy.policy_id}`} className="text-lg font-semibold text-slate-900 dark:text-white">
            File claim on policy #{policy.policy_id}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Event data (read-only from purchase):
          </p>
          <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
            {policy.event_data}
          </pre>
          {stage ? (
            <p role="status" className="mt-3 text-sm font-medium text-brand">
              {STAGE_LABEL[stage]}
            </p>
          ) : null}
          {timeoutNotice ? (
            <p role="status" className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              Still pending, check Policies later.
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={submit} disabled={!!stage}>
              {stage ? STAGE_LABEL[stage] : "Confirm claim"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        <Button
          type="button"
          onClick={() => {
            setErr(null);
            setOpen(true);
          }}
          disabled={!active}
          aria-haspopup="dialog"
          aria-disabled={!active}
          size="sm"
        >
          File claim
        </Button>
        {policy.claim_id != null || !active ? (
          <Link
            href={policy.claim_id != null ? `/claim/${policy.claim_id}` : "/claims"}
            className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View claim
          </Link>
        ) : null}
        {/* Inline status / error — kept inside the flex container so it never breaks the row */}
        {submittedHash && !active ? (
          <span className="hidden items-center gap-1 text-xs text-slate-400 dark:text-slate-500" title={submittedHash}>
            <TxHash hash={submittedHash} className="text-xs" />
          </span>
        ) : null}
        {err ? (
          <span
            role="alert"
            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
          >
            <span className="max-w-[10rem] truncate" title={err}>{err}</span>
            <button
              type="button"
              className="ml-0.5 text-slate-400 hover:text-slate-600"
              onClick={() => setErr(null)}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </span>
        ) : null}
      </div>
      {typeof document !== "undefined"
        ? createPortal(modal, document.body)
        : null}
    </>
  );
}
