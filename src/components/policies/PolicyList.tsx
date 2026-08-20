import type { Policy } from "@/types";
import Link from "next/link";

export function PolicyList({ policies }: { policies: Policy[] }) {
  if (!policies.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-slate-600 dark:text-slate-400">No policies yet, purchase your first one.</p>
        <Link href="/new-policy" className="mt-4 inline-block text-brand underline">
          New policy
        </Link>
      </div>
    );
  }
  return (
    <ul>
      {policies.map((p) => (
        <li key={p.policy_id}>
          #{p.policy_id} {p.policy_type} {p.status}
        </li>
      ))}
    </ul>
  );
}
