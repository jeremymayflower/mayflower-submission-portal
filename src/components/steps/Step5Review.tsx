import { useStore } from '../../store/submission';
import { api } from '../../services/api';
import {
  Building2, FileText, Shield, AlertTriangle, ShieldCheck,
  Edit3, Send,
} from 'lucide-react';

function SummaryCard({
  icon: Icon, title, onEdit, children,
}: {
  icon: any; title: string; onEdit?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04]">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-navy/50" />
          <span className="font-serif text-sm font-semibold text-navy">{title}</span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs text-gold hover:text-gold-600 font-medium transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      <div className="px-5 py-4 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-secondary text-xs">{label}</span>
      <p className="text-navy font-medium">{value || '—'}</p>
    </div>
  );
}

export default function Step5Review() {
  const store = useStore();
  const {
    companyInfo, uploadedDocs, extractionFactors, overriddenFactors,
    gapAnswers, claims, profile, attestationChecks, signingInfo,
    setStep, setLoading, setLoadingMessage, setToast, setError,
    submissionId, setScoreResponse,
  } = store;

  const foundCount = extractionFactors.filter(
    f => f.found && !overriddenFactors.includes(f.factor_code)
  ).length;
  const gapCount = Object.keys(gapAnswers).length;
  const docsUploaded = uploadedDocs.filter(d => d.status === 'uploaded' || d.status === 'pending');

  const handleSubmit = async () => {
    if (!submissionId) {
      setToast('No submission found. Please start over.');
      return;
    }

    try {
      setLoading(true);

      // 1. Submit attestation data
      setLoadingMessage('Submitting attestation data...');
      await api.submitAttestation(submissionId, claims);

      // 2. Trigger scoring
      setLoadingMessage('Processing your submission...');
      const scoreResp = await api.getScore(submissionId);
      setScoreResponse(scoreResp);

      setLoading(false);
      setStep(6); // confirmation
    } catch (err) {
      setLoading(false);
      setToast('Something went wrong. Please try again.');
      console.error(err);
    }
  };

  const hasRestricted = claims.autonomous_weapons ||
    claims.social_scoring_surveillance ||
    claims.black_box_no_explainability ||
    claims.unsupported_open_source_critical ||
    claims.other_controversial;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
          Review your submission
        </h1>
        <p className="text-text-secondary text-sm">
          Please review all sections before submitting. You can edit any section by clicking "Edit."
        </p>
      </div>

      {/* Card 1: Organization Profile */}
      <SummaryCard icon={Building2} title="Organization Profile" onEdit={() => setStep(1)}>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Organization" value={companyInfo.organization_name} />
          <Field label="Industry" value={companyInfo.industry_sector} />
          <Field label="Revenue" value={companyInfo.annual_revenue_millions ? `$${companyInfo.annual_revenue_millions}M` : ''} />
          <Field label="Employees" value={String(companyInfo.number_of_employees || '')} />
          <Field label="Policy Type" value={companyInfo.policy_type} />
          <Field label="Geography" value={companyInfo.geographic_scope} />
          <Field label="Coverage Lines" value={profile.coverage_lines.join(', ') || 'Not selected'} />
          <Field label="Use Cases" value={profile.ai_use_cases.slice(0, 3).join(', ') + (profile.ai_use_cases.length > 3 ? ` +${profile.ai_use_cases.length - 3} more` : '') || 'Not selected'} />
          <Field label="Effective Date" value={profile.effective_date} />
        </div>
      </SummaryCard>

      {/* Card 2: Documents */}
      <SummaryCard icon={FileText} title="Documents Uploaded" onEdit={() => setStep(1)}>
        {docsUploaded.length > 0 ? (
          <div className="space-y-1.5">
            {docsUploaded.map(d => (
              <div key={d.docType} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-navy">{d.docType}</span>
                <span className="text-text-secondary text-xs">— {d.filename}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">No documents uploaded — all items answered via questionnaire.</p>
        )}
      </SummaryCard>

      {/* Card 3: Governance Assessment */}
      <SummaryCard icon={Shield} title="Governance Assessment" onEdit={() => setStep(3)}>
        <p className="text-navy">
          We assessed your organization across{' '}
          <span className="font-semibold">{extractionFactors.length}</span> governance areas.{' '}
          {foundCount > 0 && (
            <><span className="font-semibold text-success">{foundCount}</span> covered by documents. </>
          )}
          {gapCount > 0 && (
            <><span className="font-semibold text-gold">{gapCount}</span> answered via questionnaire.</>
          )}
        </p>
      </SummaryCard>

      {/* Card 4: Claims & Regulatory */}
      <SummaryCard icon={AlertTriangle} title="Claims & Regulatory" onEdit={() => setStep(3)}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-text-secondary">AI-related claims (5yr)</span>
            <span className={`font-medium ${claims.past_ai_claims_5yr === 'No' ? 'text-success' : 'text-red-600'}`}>
              {claims.past_ai_claims_5yr}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Regulatory investigations</span>
            <span className={`font-medium ${!claims.regulatory_investigations ? 'text-success' : 'text-red-600'}`}>
              {claims.regulatory_investigations ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Known circumstances</span>
            <span className={`font-medium ${!claims.known_potential_circumstances ? 'text-success' : 'text-red-600'}`}>
              {claims.known_potential_circumstances ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Previous denials</span>
            <span className={`font-medium ${!claims.previous_insurance_denials ? 'text-success' : 'text-red-600'}`}>
              {claims.previous_insurance_denials ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Restricted applications</span>
            <span className={`font-medium ${!hasRestricted ? 'text-success' : 'text-red-600'}`}>
              {hasRestricted ? 'Disclosed' : 'None'}
            </span>
          </div>
        </div>
      </SummaryCard>

      {/* Card 5: Attestations */}
      <SummaryCard icon={ShieldCheck} title="Attestations" onEdit={() => setStep(4)}>
        <p className="text-navy">
          All 5 attestations confirmed by{' '}
          <span className="font-semibold">{signingInfo.full_name}</span>,{' '}
          {signingInfo.title} on {signingInfo.date}.
        </p>
      </SummaryCard>

      {/* Submit block */}
      <div className="bg-navy/[0.03] rounded-xl border border-navy/10 p-6 text-center">
        <p className="text-sm text-text-secondary mb-4">
          Your application will be reviewed by our underwriting team.
          You'll hear back within 5 business days.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleSubmit}
            className="bg-gold text-white px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-gold-500 transition-all shadow-md shadow-gold/20 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Application
          </button>
        </div>

        <p className="text-[11px] text-muted mt-4">Submission does not guarantee coverage.</p>
      </div>
    </div>
  );
}
