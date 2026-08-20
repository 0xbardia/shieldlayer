export type PolicyType = "flight_delay" | "storm" | "bankruptcy";
export type PolicyStatus =
  | "active"
  | "pending"
  | "pending_verification"
  | "pending_manual_review"
  | "pending_funding"
  | "approved"
  | "rejected"
  | "paid";

export interface Policy {
  policy_id: number;
  policy_type: PolicyType;
  beneficiary: string;
  coverage_amount: number;
  premium_paid: number;
  event_data: string;
  status: PolicyStatus;
  purchase_timestamp: number;
  claim_id: number | null;
  verification_result: Record<string, unknown> | null;
}
