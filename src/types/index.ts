export type { Policy, PolicyType, PolicyStatus } from "./policy";
export type { Claim, ClaimStatus } from "./claim";

export interface ProtocolStats {
  total_policies: number;
  total_claims: number;
  premium_pool: number;
  approved_claims: number;
  rejected_claims: number;
  collateral_bps?: number;
}
