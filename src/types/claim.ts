export type ClaimStatus =
  | "pending"
  | "pending_verification"
  | "pending_manual_review"
  | "pending_funding"
  | "approved"
  | "rejected"
  | "paid";

export interface Claim {
  claim_id: number;
  policy_id: number;
  claimant: string;
  status: ClaimStatus;
  payout: number;
  filed_timestamp: number;
  verification_result: Record<string, unknown> | null;
  confidence: number;
}
