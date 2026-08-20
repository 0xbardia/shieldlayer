import { StatusBadge } from "./StatusBadge";

interface VerificationDetailsProps {
  verificationResult: Record<string, unknown> | null | undefined;
  status?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{children}</span>
    </div>
  );
}

// Custom SVG icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function YesNoIcon({ value }: { value: unknown }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <CheckIcon className="h-4 w-4" />
        Yes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-400">
      <XIcon className="h-4 w-4" />
      No
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence < 0.4
      ? "bg-red-500"
      : confidence < 0.7
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-900 dark:text-white">
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

function SafeString({ value }: { value: unknown }) {
  if (typeof value === "string") return <>{value}</>;
  if (typeof value === "number") return <>{String(value)}</>;
  return <>{JSON.stringify(value)}</>;
}

export function VerificationDetails({
  verificationResult,
  status,
}: VerificationDetailsProps) {
  if (!verificationResult || typeof verificationResult !== "object") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <ShieldCheckIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No verification data yet
        </p>
      </div>
    );
  }

  const vr = verificationResult;

  return (
    <div className="divide-y-0">
      {status && (
        <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400 mr-3">Status</span>
          <StatusBadge status={status} />
        </div>
      )}

      {vr.occurred !== undefined && (
        <Field label="Event occurred">
          <YesNoIcon value={vr.occurred} />
        </Field>
      )}

      {vr.confidence !== undefined && typeof vr.confidence === "number" && (
        <Field label="Confidence">
          <ConfidenceBar confidence={vr.confidence} />
        </Field>
      )}

      {vr.reason !== undefined && (
        <Field label="Reason">
          <span className="max-w-[240px] text-right">
            <SafeString value={vr.reason} />
          </span>
        </Field>
      )}

      {vr.sources_agreed !== undefined && (
        <Field label="Sources agreed">
          {vr.sources_agreed ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckIcon className="h-4 w-4" />
              <CheckIcon className="h-4 w-4 -ml-2" />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-400">
              <AlertCircleIcon className="h-4 w-4" />
              No
            </span>
          )}
        </Field>
      )}

      {vr.tiebreaker_used !== undefined && vr.tiebreaker_used && (
        <Field label="Tiebreaker used">
          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <SparklesIcon className="h-4 w-4" />
            Yes
          </span>
        </Field>
      )}

      {Object.keys(vr)
        .filter(
          (k) =>
            !["occurred", "confidence", "reason", "sources_agreed", "tiebreaker_used", "status"].includes(k),
        )
        .map((key) => (
          <Field key={key} label={key.replace(/_/g, " ")}>
            <SafeString value={vr[key]} />
          </Field>
        ))}
    </div>
  );
}
