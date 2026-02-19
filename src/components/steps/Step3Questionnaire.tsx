import { useState } from 'react';
import { useStore, AI_USE_CASES } from '../../store/submission';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

// Maturity options for governance gap questions (no point values shown)
const MATURITY_OPTIONS = [
  { value: 'none', label: 'Not in place' },
  { value: 'informal', label: 'Informal / ad-hoc' },
  { value: 'developing', label: 'Developing / partially documented' },
  { value: 'established', label: 'Established and documented' },
  { value: 'advanced', label: 'Advanced with regular review' },
];

const CLAIMS_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes - 1', label: 'Yes — 1 claim' },
  { value: 'Yes - 2+', label: 'Yes — 2+ claims' },
  { value: 'Severe', label: 'Severe' },
];

const MODELS_OPTIONS = ['1-5', '6-20', '21-50', '51-100', '100+'];

function CollapsibleSection({
  title, count, total, children, defaultOpen = true,
}: {
  title: string; count: number; total: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-black/[0.04] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-black/[0.01] transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
        <span className="font-serif text-base font-semibold text-navy flex-1">{title}</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct === 100 ? '#2D7D46' : pct > 0 ? '#D4A030' : '#94A3B8',
              }}
            />
          </div>
          <span className="text-xs text-text-secondary">{count}/{total}</span>
        </div>
      </button>
      {open && <div className="px-5 pb-5 space-y-5">{children}</div>}
    </div>
  );
}

export default function Step3Questionnaire() {
  const {
    extractionFactors, overriddenFactors,
    gapAnswers, setGapAnswer,
    claims, setClaims,
    profile, setProfile,
    setStep,
  } = useStore();

  // Gap factors = not found or overridden
  const gapFactors = extractionFactors.filter(
    f => !f.found || overriddenFactors.includes(f.factor_code)
  );

  const gapCount = Object.keys(gapAnswers).length;
  const hasGaps = gapFactors.length > 0;

  // Dynamic header
  const headerText = gapFactors.length === 0
    ? 'Your documents covered everything — just confirm a few details.'
    : gapFactors.length <= 5
      ? 'Almost there — just a few items left'
      : 'Let\'s fill in the remaining details';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">{headerText}</h1>
        <p className="text-text-secondary text-sm">
          {hasGaps
            ? `Answer the ${gapFactors.length} remaining governance question${gapFactors.length > 1 ? 's' : ''}, then complete the claims and profile sections below.`
            : 'Please complete the claims history and profile sections below.'
          }
        </p>
      </div>

      {/* Gap Questions */}
      {hasGaps && (
        <CollapsibleSection
          title="Governance Questions"
          count={gapCount}
          total={gapFactors.length}
        >
          {gapFactors.map((factor, idx) => (
            <div
              key={factor.factor_code}
              className="animate-fadeIn"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <p className="text-sm font-medium text-navy mb-2.5">
                {factor.factor_name}
              </p>
              <div className="space-y-1.5">
                {MATURITY_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                      ${gapAnswers[factor.factor_code] === opt.value
                        ? 'bg-gold/[0.08] border border-gold/30 text-navy font-medium'
                        : 'bg-black/[0.02] border border-transparent hover:bg-black/[0.04]'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`gap-${factor.factor_code}`}
                      value={opt.value}
                      checked={gapAnswers[factor.factor_code] === opt.value}
                      onChange={() => setGapAnswer(factor.factor_code, opt.value)}
                      className="accent-gold w-4 h-4"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {idx < gapFactors.length - 1 && <hr className="border-black/[0.04] mt-5" />}
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Claims & Regulatory History */}
      <CollapsibleSection
        title="Claims & Regulatory History"
        count={
          (claims.past_ai_claims_5yr ? 1 : 0) +
          (claims.past_ai_claims_5yr !== 'No' ? 0 : 1) // simplified
        }
        total={5}
      >
        {/* Claims History */}
        <div>
          <p className="text-sm font-medium text-navy mb-2.5">
            Has your organization had any AI-related insurance claims in the past 5 years?
          </p>
          <div className="space-y-1.5">
            {CLAIMS_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                  ${claims.past_ai_claims_5yr === opt.value
                    ? 'bg-gold/[0.08] border border-gold/30 text-navy font-medium'
                    : 'bg-black/[0.02] border border-transparent hover:bg-black/[0.04]'
                  }
                `}
              >
                <input
                  type="radio"
                  name="claims_history"
                  value={opt.value}
                  checked={claims.past_ai_claims_5yr === opt.value}
                  onChange={() => setClaims({ past_ai_claims_5yr: opt.value })}
                  className="accent-gold w-4 h-4"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {claims.past_ai_claims_5yr !== 'No' && (
            <div className="mt-3 animate-fadeIn">
              <label className="block text-xs text-text-secondary mb-1">How many claims?</label>
              <input
                type="number"
                value={claims.number_of_claims || ''}
                onChange={e => setClaims({ number_of_claims: Number(e.target.value) || 0 })}
                min="0"
                className="w-32 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          )}
        </div>

        <hr className="border-black/[0.04]" />

        {/* Toggle questions */}
        {[
          { key: 'regulatory_investigations', label: 'Is your organization currently subject to any regulatory investigation related to AI/ML systems?' },
          { key: 'known_potential_circumstances', label: 'Are you aware of any circumstances that may give rise to a claim related to AI/ML systems?' },
          { key: 'previous_insurance_denials', label: 'Has your organization previously been denied AI-related insurance coverage?' },
        ].map(q => (
          <div key={q.key}>
            <p className="text-sm font-medium text-navy mb-2.5">{q.label}</p>
            <div className="flex gap-2">
              {[false, true].map(val => (
                <button
                  key={String(val)}
                  onClick={() => setClaims({ [q.key]: val } as any)}
                  className={`
                    px-5 py-2 rounded-lg text-sm font-medium transition-all
                    ${(claims as any)[q.key] === val
                      ? val ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-success/10 border border-success/20 text-success'
                      : 'bg-black/[0.02] border border-transparent hover:bg-black/[0.04] text-text-secondary'
                    }
                  `}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        ))}

        <hr className="border-black/[0.04]" />

        {/* Restricted Applications */}
        <div>
          <p className="text-sm font-medium text-navy mb-1">
            Does your organization use AI in any of the following applications?
          </p>
          <p className="text-[11px] text-text-secondary mb-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            These may affect eligibility for coverage.
          </p>
          <div className="space-y-2">
            {[
              { key: 'autonomous_weapons', label: 'Autonomous weapons systems' },
              { key: 'social_scoring_surveillance', label: 'Social scoring or mass surveillance' },
              { key: 'black_box_no_explainability', label: 'Black-box AI with no explainability in critical decisions' },
              { key: 'unsupported_open_source_critical', label: 'Unsupported open-source models in critical/production systems' },
              { key: 'other_controversial', label: 'Other controversial AI applications' },
            ].map(item => (
              <label
                key={item.key}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                  ${(claims as any)[item.key]
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-black/[0.02] border border-transparent hover:bg-black/[0.04]'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={(claims as any)[item.key]}
                  onChange={e => setClaims({ [item.key]: e.target.checked } as any)}
                  className="accent-gold w-4 h-4"
                />
                <span className={(claims as any)[item.key] ? 'text-red-700' : 'text-navy'}>{item.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer bg-black/[0.02] border border-transparent hover:bg-black/[0.04] text-sm">
              <input
                type="checkbox"
                checked={
                  !claims.autonomous_weapons &&
                  !claims.social_scoring_surveillance &&
                  !claims.black_box_no_explainability &&
                  !claims.unsupported_open_source_critical &&
                  !claims.other_controversial
                }
                onChange={() => setClaims({
                  autonomous_weapons: false,
                  social_scoring_surveillance: false,
                  black_box_no_explainability: false,
                  unsupported_open_source_critical: false,
                  other_controversial: false,
                })}
                className="accent-gold w-4 h-4"
              />
              <span className="text-navy">None of the above</span>
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* Profile Details */}
      <CollapsibleSection
        title="Additional Profile Details"
        count={
          (profile.ai_use_cases.length > 0 ? 1 : 0) +
          (profile.coverage_lines.length > 0 ? 1 : 0) +
          (profile.effective_date ? 1 : 0) +
          (profile.models_in_production ? 1 : 0)
        }
        total={4}
      >
        {/* AI Use Cases */}
        <div>
          <p className="text-sm font-medium text-navy mb-2.5">Primary AI Use Cases</p>
          <div className="flex flex-wrap gap-2">
            {AI_USE_CASES.map(uc => {
              const selected = profile.ai_use_cases.includes(uc);
              return (
                <button
                  key={uc}
                  onClick={() => {
                    setProfile({
                      ai_use_cases: selected
                        ? profile.ai_use_cases.filter(x => x !== uc)
                        : [...profile.ai_use_cases, uc],
                    });
                  }}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${selected
                      ? 'bg-gold/15 text-gold border border-gold/30'
                      : 'bg-black/[0.03] text-text-secondary border border-transparent hover:bg-black/[0.06]'
                    }
                  `}
                >
                  {uc}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-black/[0.04]" />

        {/* Coverage Lines */}
        <div>
          <p className="text-sm font-medium text-navy mb-2.5">
            Coverage Lines Requested <span className="text-gold text-xs">(select at least 1)</span>
          </p>
          <div className="flex gap-3">
            {['D&O', 'EPL', 'E&O'].map(line => {
              const selected = profile.coverage_lines.includes(line);
              return (
                <label
                  key={line}
                  className={`
                    flex items-center gap-2.5 px-4 py-3 rounded-lg cursor-pointer transition-all text-sm font-medium flex-1 justify-center
                    ${selected
                      ? 'bg-navy text-white shadow-sm'
                      : 'bg-black/[0.02] text-navy border border-black/[0.06] hover:bg-black/[0.04]'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={e => {
                      setProfile({
                        coverage_lines: e.target.checked
                          ? [...profile.coverage_lines, line]
                          : profile.coverage_lines.filter(l => l !== line),
                      });
                    }}
                    className="hidden"
                  />
                  {line}
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-black/[0.04]" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Desired Effective Date</label>
            <input
              type="date"
              value={profile.effective_date}
              onChange={e => setProfile({ effective_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">AI/ML Models in Production</label>
            <div className="relative">
              <select
                value={profile.models_in_production}
                onChange={e => setProfile({ models_in_production: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none bg-white"
              >
                <option value="">Select range...</option>
                {MODELS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy mb-1">Current Insurance Carrier(s)</label>
            <input
              type="text"
              value={profile.current_carriers}
              onChange={e => setProfile({ current_carriers: e.target.value })}
              placeholder="e.g., Chubb, AIG, Hartford"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          onClick={() => setStep(4)}
          className="bg-gold text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gold-500 transition-colors shadow-sm shadow-gold/20"
        >
          Continue to Attestations →
        </button>
      </div>
    </div>
  );
}
