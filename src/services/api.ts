const API_BASE = "https://mayflower-pipeline-production.up.railway.app";

export interface CreateSubmissionData {
  organization_name: string;
  industry_sector: string;
  annual_revenue_millions: number;
  number_of_employees: number;
  policy_type?: string;
  geographic_scope?: string;
}

export interface SubmissionResponse {
  id: string;
  status: string;
  message: string;
  upload_url: string;
}

export interface AttestationData {
  past_ai_claims_5yr: string;
  number_of_claims: number;
  regulatory_investigations: boolean;
  known_potential_circumstances: boolean;
  previous_insurance_denials: boolean;
  autonomous_weapons: boolean;
  social_scoring_surveillance: boolean;
  black_box_no_explainability: boolean;
  unsupported_open_source_critical: boolean;
  other_controversial: boolean;
}

export interface SectionScore {
  section_name: string;
  weight: number;
  raw_score: number;
  max_score: number;
  percentage: number;
  rating: string;
}

export interface FactorMultiplier {
  code: string;
  name: string;
  value: number;
  source: string;
}

export interface UnderwritingCheck {
  check_name: string;
  result: string;
  detail: string;
}

export interface ScoreResponse {
  submission_id: string;
  decision: string;
  composite_governance_score: number;
  composite_status: string;
  section_scores: SectionScore[];
  factor_multipliers: FactorMultiplier[];
  underwriting_checks: UnderwritingCheck[];
  premium: Record<string, any> | null;
  coverage: Record<string, any> | null;
  notes: string[];
  decline_reasons: string[];
}

export interface ExtractionFactor {
  factor_code: string;
  factor_name: string;
  found: boolean;
  confidence: string;
  evidence: string;
  source_document: string;
  selected_option?: string;
}

export interface ExtractionResponse {
  submission_id: string;
  status: string;
  factors: ExtractionFactor[];
  summary?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(
      `Request failed (${res.status})`,
      res.status
    );
  }
  return res.json();
}

export const api = {
  createSubmission: async (data: CreateSubmissionData): Promise<SubmissionResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<SubmissionResponse>(res);
  },

  uploadDocument: async (subId: string, file: File, docType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `${API_BASE}/api/v1/submissions/${subId}/upload?doc_type=${encodeURIComponent(docType)}`,
      { method: "POST", body: formData }
    );
    return handleResponse<any>(res);
  },

  triggerExtraction: async (subId: string): Promise<ExtractionResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/submissions/${subId}/extract`, {
      method: "POST",
    });
    return handleResponse<ExtractionResponse>(res);
  },

  submitAttestation: async (subId: string, data: AttestationData) => {
    const res = await fetch(`${API_BASE}/api/v1/submissions/${subId}/attestation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getScore: async (subId: string): Promise<ScoreResponse> => {
    const res = await fetch(`${API_BASE}/api/v1/submissions/${subId}/score`);
    return handleResponse<ScoreResponse>(res);
  },

  getStatus: async (subId: string) => {
    const res = await fetch(`${API_BASE}/api/v1/submissions/${subId}/status`);
    return handleResponse<any>(res);
  },
};
