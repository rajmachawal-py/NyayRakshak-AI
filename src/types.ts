export interface Clause {
  clause_text: string;
  category: "Termination" | "Payment" | "Liability" | "IP Ownership" | "Non-compete" | "Confidentiality" | "Indemnification" | "Dispute Resolution" | "Force Majeure" | "Other";
  risk_level: "Safe" | "Moderate" | "High";
  risk_reason: string;
  role_impact: string;
  explanation: string;
  industry_comparison: string;
  benchmark_status: "Standard" | "Above Standard" | "Below Standard";
  suggestion: string;
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: "Safe" | "Moderate" | "High";
  summary: string;
  clauses: Clause[];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export type Role = "Tenant" | "Employee" | "Freelancer" | "Vendor";

export interface ContractVersion {
  id: string;
  version_id: string;
  timestamp: number;
  filename: string;
  text: string;
  risk_score: number;
  risk_level: string;
  summary: string;
  clauses: Clause[];
}

export interface ComparisonResult {
  v1: { id: string; version_id: string; risk_score: number; risk_level: string };
  v2: { id: string; version_id: string; risk_score: number; risk_level: string };
  textDiff: { value: string; added?: boolean; removed?: boolean }[];
  riskDiff: number;
  riskTrend: "increased" | "decreased" | "unchanged";
  changedClauses: (Clause & { change_type: "new" | "removed" | "unchanged" })[];
}
