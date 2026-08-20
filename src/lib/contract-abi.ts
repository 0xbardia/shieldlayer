/** Method catalog for GenLayer intelligent contract (Python, not EVM ABI). */
export const CONTRACT_METHODS = {
  purchase_policy: {
    type: "write" as const,
    args: ["policy_type", "coverage_amount", "event_data"],
  },
  file_claim: { type: "write" as const, args: ["policy_id"] },
  get_policies: { type: "view" as const, args: ["user"] },
  get_policy: { type: "view" as const, args: ["policy_id"] },
  get_claim: { type: "view" as const, args: ["claim_id"] },
  get_claims_by_user: { type: "view" as const, args: ["user"] },
  get_stats: { type: "view" as const, args: [] },
  get_premium_bps: { type: "view" as const, args: [] },
  check_claim_status: { type: "view" as const, args: ["claim_id"] },
  settle_claim: { type: "write" as const, args: ["claim_id"] },
  fund_pool: { type: "write" as const, args: [] },
  propose_owner: { type: "write" as const, args: ["new_owner"] },
  accept_ownership: { type: "write" as const, args: [] },
  schedule_admin: { type: "write" as const, args: ["action", "payload"] },
  cancel_admin: { type: "write" as const, args: ["op_id"] },
  execute_admin: { type: "write" as const, args: ["op_id"] },
  get_reserve: { type: "view" as const, args: [] },
  get_owner: { type: "view" as const, args: [] },
};
