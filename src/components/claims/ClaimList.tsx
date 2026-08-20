import type { Claim } from "@/types";

export function ClaimList({ claims }: { claims: Claim[] }) {
  if (!claims.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:text-slate-400">
        No claims filed. Only the policy beneficiary can file, and two structured feeds must agree
        before a payout.
      </div>
    );
  }
  return (
    <ul>
      {claims.map((c) => (
        <li key={c.claim_id}>
          #{c.claim_id} {c.status}
        </li>
      ))}
    </ul>
  );
}
