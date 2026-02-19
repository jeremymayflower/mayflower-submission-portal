import { create } from 'zustand';
import type { ExtractionFactor, ScoreResponse, AttestationData } from '../services/api';

export const DOC_TYPES = [
  { key: 'AI/ML Governance Policy', label: 'AI/ML Governance Policy', desc: 'Your AI governance framework, ethics policy, or responsible AI guidelines.', icon: 'Shield' },
  { key: 'SOC 2 Type II Report', label: 'SOC 2 Type II Report', desc: 'Most recent SOC 2 Type II audit report covering AI-related or general IT controls.', icon: 'FileCheck' },
  { key: 'Model Cards', label: 'Model Cards / Model Documentation', desc: 'Model cards, technical specifications, performance reports, or validation results.', icon: 'FileText' },
  { key: 'Bias Audit Reports', label: 'Bias Audit / Fairness Reports', desc: 'Third-party or internal bias audits, fairness assessments, or algorithmic impact assessments.', icon: 'Scale' },
  { key: 'Incident Response Plan', label: 'Incident Response Plan', desc: 'AI-specific incident response plan, or general IR plan covering AI systems.', icon: 'AlertTriangle' },
  { key: 'Data Governance Policy', label: 'Data Governance / Privacy Policy', desc: 'Data governance framework, retention policies, privacy compliance docs (GDPR, CCPA, etc.).', icon: 'Database' },
  { key: 'ISO 42001 Certificate', label: 'ISO 42001 Certificate', desc: 'ISO/IEC 42001 AI Management System certification, if applicable.', icon: 'Award' },
] as const;

export const INDUSTRY_SECTORS = [
  'Financial Services',
  'Healthcare',
  'Insurance',
  'Technology',
  'Retail & E-commerce',
  'Manufacturing',
  'Other',
] as const;

export const AI_USE_CASES = [
  'Customer-Facing Chatbots',
  'Internal Decision Support',
  'Automated Underwriting/Pricing',
  'Content Generation',
  'Predictive Analytics',
  'Computer Vision',
  'HR/Hiring Automation',
  'Claims Processing',
  'Fraud Detection',
  'Autonomous Systems',
  'Other',
] as const;

interface UploadedDoc {
  file: File;
  docType: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  filename: string;
}

interface CompanyInfo {
  organization_name: string;
  industry_sector: string;
  annual_revenue_millions: number | '';
  number_of_employees: number | '';
  policy_type: string;
  geographic_scope: string;
}

interface ProfileInfo {
  ai_use_cases: string[];
  coverage_lines: string[];
  effective_date: string;
  current_carriers: string;
  models_in_production: string;
}

interface AttestationChecks {
  check1: boolean;
  check2: boolean;
  check3: boolean;
  check4: boolean;
  check5: boolean;
}

interface SigningInfo {
  full_name: string;
  title: string;
  email: string;
  date: string;
}

interface GapAnswers {
  [factorCode: string]: string;
}

interface SubmissionStore {
  // Navigation
  currentStep: number;
  setStep: (step: number) => void;

  // Submission ID from backend
  submissionId: string | null;
  setSubmissionId: (id: string) => void;

  // Step 1: Company + Documents
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  uploadedDocs: UploadedDoc[];
  addDoc: (doc: UploadedDoc) => void;
  updateDocStatus: (docType: string, status: UploadedDoc['status']) => void;
  removeDoc: (docType: string) => void;

  // Step 2: Extraction results
  extractionFactors: ExtractionFactor[];
  setExtractionFactors: (factors: ExtractionFactor[]) => void;
  overriddenFactors: string[];
  overrideFactor: (factorCode: string) => void;

  // Step 3: Gap answers + claims + profile
  gapAnswers: GapAnswers;
  setGapAnswer: (factorCode: string, value: string) => void;
  claims: AttestationData;
  setClaims: (data: Partial<AttestationData>) => void;
  profile: ProfileInfo;
  setProfile: (data: Partial<ProfileInfo>) => void;

  // Step 4: Attestations + Signing
  attestationChecks: AttestationChecks;
  setAttestationCheck: (key: keyof AttestationChecks, value: boolean) => void;
  signingInfo: SigningInfo;
  setSigningInfo: (data: Partial<SigningInfo>) => void;

  // Step 5: Score (internal)
  scoreResponse: ScoreResponse | null;
  setScoreResponse: (score: ScoreResponse) => void;

  // Loading / errors
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (msg: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  toast: string | null;
  setToast: (msg: string | null) => void;

  // Computed
  isCompanyInfoComplete: () => boolean;
  submissionProgress: () => number;
}

const defaultClaims: AttestationData = {
  past_ai_claims_5yr: 'No',
  number_of_claims: 0,
  regulatory_investigations: false,
  known_potential_circumstances: false,
  previous_insurance_denials: false,
  autonomous_weapons: false,
  social_scoring_surveillance: false,
  black_box_no_explainability: false,
  unsupported_open_source_critical: false,
  other_controversial: false,
};

const today = new Date();
const defaultEffective = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  .toISOString().split('T')[0];

export const useStore = create<SubmissionStore>((set, get) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),

  submissionId: null,
  setSubmissionId: (id) => set({ submissionId: id }),

  companyInfo: {
    organization_name: '',
    industry_sector: '',
    annual_revenue_millions: '',
    number_of_employees: '',
    policy_type: 'AI Primary Policy',
    geographic_scope: 'US Only',
  },
  setCompanyInfo: (info) =>
    set((s) => ({ companyInfo: { ...s.companyInfo, ...info } })),

  uploadedDocs: [],
  addDoc: (doc) => set((s) => ({
    uploadedDocs: [...s.uploadedDocs.filter(d => d.docType !== doc.docType), doc],
  })),
  updateDocStatus: (docType, status) => set((s) => ({
    uploadedDocs: s.uploadedDocs.map(d =>
      d.docType === docType ? { ...d, status } : d
    ),
  })),
  removeDoc: (docType) => set((s) => ({
    uploadedDocs: s.uploadedDocs.filter(d => d.docType !== docType),
  })),

  extractionFactors: [],
  setExtractionFactors: (factors) => set({ extractionFactors: factors }),
  overriddenFactors: [],
  overrideFactor: (factorCode) => set((s) => ({
    overriddenFactors: [...s.overriddenFactors, factorCode],
  })),

  gapAnswers: {},
  setGapAnswer: (factorCode, value) => set((s) => ({
    gapAnswers: { ...s.gapAnswers, [factorCode]: value },
  })),

  claims: defaultClaims,
  setClaims: (data) => set((s) => ({ claims: { ...s.claims, ...data } })),

  profile: {
    ai_use_cases: [],
    coverage_lines: [],
    effective_date: defaultEffective,
    current_carriers: '',
    models_in_production: '',
  },
  setProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),

  attestationChecks: {
    check1: false, check2: false, check3: false, check4: false, check5: false,
  },
  setAttestationCheck: (key, value) => set((s) => ({
    attestationChecks: { ...s.attestationChecks, [key]: value },
  })),

  signingInfo: {
    full_name: '',
    title: '',
    email: '',
    date: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  },
  setSigningInfo: (data) => set((s) => ({
    signingInfo: { ...s.signingInfo, ...data },
  })),

  scoreResponse: null,
  setScoreResponse: (score) => set({ scoreResponse: score }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  loadingMessage: '',
  setLoadingMessage: (msg) => set({ loadingMessage: msg }),
  error: null,
  setError: (error) => set({ error }),
  toast: null,
  setToast: (msg) => set({ toast: msg }),

  isCompanyInfoComplete: () => {
    const c = get().companyInfo;
    return !!(
      c.organization_name.trim() &&
      c.industry_sector &&
      c.annual_revenue_millions &&
      Number(c.annual_revenue_millions) > 0 &&
      c.number_of_employees &&
      Number(c.number_of_employees) > 0
    );
  },

  submissionProgress: () => {
    const s = get();
    let total = 10; // company fields weight
    let done = 0;

    // Company info (4 required fields = 4 points)
    const c = s.companyInfo;
    if (c.organization_name.trim()) done += 1;
    if (c.industry_sector) done += 1;
    if (c.annual_revenue_millions && Number(c.annual_revenue_millions) > 0) done += 1;
    if (c.number_of_employees && Number(c.number_of_employees) > 0) done += 1;

    // Docs (1 point each, max 3)
    done += Math.min(s.uploadedDocs.filter(d => d.status === 'uploaded').length, 3);
    total += 3;

    // Gap answers
    const missingFactors = s.extractionFactors.filter(
      f => !f.found || s.overriddenFactors.includes(f.factor_code)
    );
    if (missingFactors.length > 0) {
      total += missingFactors.length;
      done += Object.keys(s.gapAnswers).length;
    }

    // Profile (2 points)
    total += 2;
    if (s.profile.coverage_lines.length > 0) done += 1;
    if (s.profile.ai_use_cases.length > 0) done += 1;

    // Attestations (5 points)
    total += 5;
    Object.values(s.attestationChecks).forEach(v => { if (v) done += 1; });

    // Signing (3 points)
    total += 3;
    if (s.signingInfo.full_name.trim()) done += 1;
    if (s.signingInfo.title.trim()) done += 1;
    if (s.signingInfo.email.trim()) done += 1;

    return Math.round((done / total) * 100);
  },
}));
