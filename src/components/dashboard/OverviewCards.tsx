export function OverviewCards({
  policies,
  claims,
  pool,
  collateralBps,
}: {
  policies: number;
  claims: number;
  pool: number;
  collateralBps?: number;
}) {
  const ratio = collateralBps != null ? `${(collateralBps / 100).toFixed(0)}%` : "n/a";
  const healthy = collateralBps != null && collateralBps >= 10_000;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-xl border p-4">Policies {policies}</div>
      <div className="rounded-xl border p-4">Claims {claims}</div>
      <div className="rounded-xl border p-4">Pool {pool}</div>
      <div className="rounded-xl border p-4">
        Collateralization {ratio} {healthy ? "(healthy)" : "(below 100%, new cover paused)"}
      </div>
    </div>
  );
}
