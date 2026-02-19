import { useStore } from '../../store/submission';
import { ShieldCheck } from 'lucide-react';

const ATTESTATION_TEXTS = [
  'I attest that the information provided in this application is true, accurate, and complete to the best of my knowledge. Material misrepresentation may result in denial of coverage or voiding of any policy issued.',
  'I confirm that all uploaded documents are authentic, current, and accurately represent my organization\'s practices as of the date of this submission.',
  'I confirm I have disclosed all known regulatory actions, legal claims, material incidents, and anticipated claims related to AI/ML systems.',
  'I acknowledge that Mayflower Specialty may request additional documentation or assessments as part of the underwriting process.',
];

export default function Step4Attestations() {
  const {
    companyInfo,
    attestationChecks, setAttestationCheck,
    signingInfo, setSigningInfo,
    setStep,
  } = useStore();

  const allChecked = Object.values(attestationChecks).every(Boolean);
  const signingComplete = !!(
    signingInfo.full_name.trim() &&
    signingInfo.title.trim() &&
    signingInfo.email.trim()
  );
  const canProceed = allChecked && signingComplete;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
          Confirm and attest
        </h1>
        <p className="text-text-secondary text-sm">
          Please review and confirm the following. These are binding representations
          that form part of your insurance application.
        </p>
      </div>

      {/* Attestations */}
      <div className="bg-white rounded-xl border-2 border-navy/10 overflow-hidden shadow-sm">
        <div className="bg-navy/[0.03] px-5 py-3 border-b border-navy/10 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-navy" />
          <span className="text-sm font-semibold text-navy">Required Attestations</span>
        </div>

        <div className="divide-y divide-navy/[0.06]">
          {ATTESTATION_TEXTS.map((text, i) => {
            const key = `check${i + 1}` as keyof typeof attestationChecks;
            return (
              <label
                key={i}
                className={`
                  flex gap-3.5 px-5 py-4 cursor-pointer transition-colors
                  ${attestationChecks[key] ? 'bg-success/[0.03]' : 'hover:bg-black/[0.01]'}
                `}
              >
                <input
                  type="checkbox"
                  checked={attestationChecks[key]}
                  onChange={e => setAttestationCheck(key, e.target.checked)}
                  className="mt-0.5 accent-success w-4 h-4 flex-shrink-0"
                />
                <span className={`text-sm leading-relaxed ${attestationChecks[key] ? 'text-navy' : 'text-text-secondary'}`}>
                  {text}
                </span>
              </label>
            );
          })}

          {/* Attestation 5 with dynamic org name */}
          <label
            className={`
              flex gap-3.5 px-5 py-4 cursor-pointer transition-colors
              ${attestationChecks.check5 ? 'bg-success/[0.03]' : 'hover:bg-black/[0.01]'}
            `}
          >
            <input
              type="checkbox"
              checked={attestationChecks.check5}
              onChange={e => setAttestationCheck('check5', e.target.checked)}
              className="mt-0.5 accent-success w-4 h-4 flex-shrink-0"
            />
            <span className={`text-sm leading-relaxed ${attestationChecks.check5 ? 'text-navy' : 'text-text-secondary'}`}>
              I confirm I am authorized to submit this application on behalf of{' '}
              <span className="font-semibold text-navy">
                {companyInfo.organization_name || '[Organization Name]'}
              </span>{' '}
              and to bind the organization to the representations made herein.
            </span>
          </label>
        </div>
      </div>

      {/* Signing Block */}
      <div className="bg-white rounded-xl border border-black/[0.04] p-6">
        <h3 className="font-serif text-base font-semibold text-navy mb-4">Authorized Signatory</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Full Name <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              value={signingInfo.full_name}
              onChange={e => setSigningInfo({ full_name: e.target.value })}
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Title / Role <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              value={signingInfo.title}
              onChange={e => setSigningInfo({ title: e.target.value })}
              placeholder="Chief Risk Officer"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Email Address <span className="text-gold">*</span>
            </label>
            <input
              type="email"
              value={signingInfo.email}
              onChange={e => setSigningInfo({ email: e.target.value })}
              placeholder="jane@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date</label>
            <input
              type="text"
              value={signingInfo.date}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm bg-black/[0.02] text-text-secondary"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          onClick={() => setStep(5)}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-lg font-semibold text-sm transition-all
            ${canProceed
              ? 'bg-gold text-white hover:bg-gold-500 shadow-sm shadow-gold/20'
              : 'bg-muted/50 text-white cursor-not-allowed'
            }
          `}
        >
          Review & Submit →
        </button>
        {!allChecked && (
          <p className="text-xs text-text-secondary self-center">
            Please confirm all attestations to proceed.
          </p>
        )}
      </div>
    </div>
  );
}
