import { useStore } from '../../store/submission';
import { CheckCircle, AlertCircle, MinusCircle, RotateCcw } from 'lucide-react';

function ConfidenceDot({ confidence }: { confidence: string }) {
  const c = confidence.toLowerCase();
  if (c === 'high') return <span className="w-2 h-2 rounded-full bg-success inline-block" title="High confidence" />;
  if (c === 'medium') return <span className="w-2 h-2 rounded-full bg-warning inline-block" title="Medium confidence" />;
  return <span className="w-2 h-2 rounded-full bg-muted inline-block" title="Low confidence" />;
}

export default function Step2Review() {
  const {
    extractionFactors, overriddenFactors, overrideFactor, setStep,
  } = useStore();

  const found = extractionFactors.filter(
    f => f.found && !overriddenFactors.includes(f.factor_code)
  );
  const notFound = extractionFactors.filter(
    f => !f.found || overriddenFactors.includes(f.factor_code)
  );

  // Group found factors by source document
  const grouped = found.reduce((acc, f) => {
    const src = f.source_document || 'Extracted';
    if (!acc[src]) acc[src] = [];
    acc[src].push(f);
    return acc;
  }, {} as Record<string, typeof found>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
          Here's what we found in your documents
        </h1>
        <p className="text-text-secondary text-sm">
          We identified evidence for <span className="font-semibold text-navy">{found.length}</span> governance
          areas from your uploaded documents. You'll only need to answer questions about the
          remaining {notFound.length > 0 ? notFound.length : 'few'} gaps.
        </p>
      </div>

      {/* Found factors grouped by source */}
      {Object.entries(grouped).map(([source, factors]) => (
        <section key={source} className="bg-white rounded-xl border border-black/[0.04] overflow-hidden">
          <div className="px-5 py-3 bg-success/[0.04] border-b border-success/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-navy">Found in: {source}</span>
              <span className="text-xs text-text-secondary ml-auto">{factors.length} factor{factors.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="divide-y divide-black/[0.04]">
            {factors.map(f => (
              <div key={f.factor_code} className="px-5 py-3.5 flex items-start gap-3 group">
                <ConfidenceDot confidence={f.confidence} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{f.factor_name}</p>
                  {f.evidence && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">
                      {f.evidence}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-text-secondary">
                      Confidence: {f.confidence}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => overrideFactor(f.factor_code)}
                  className="text-[11px] text-text-secondary hover:text-gold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Override
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {found.length === 0 && (
        <div className="bg-white rounded-xl border border-black/[0.04] p-8 text-center">
          <AlertCircle className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            No governance factors were extracted from your documents.
            All items will appear as questions in the next step.
          </p>
        </div>
      )}

      {/* Not found section */}
      {notFound.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <MinusCircle className="w-4 h-4" />
            Not found — you'll answer these next ({notFound.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {notFound.map(f => (
              <span
                key={f.factor_code}
                className="px-3 py-1.5 bg-black/[0.03] text-text-secondary text-xs rounded-full"
              >
                {f.factor_name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
        <button
          onClick={() => setStep(3)}
          className="bg-gold text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gold-500 transition-colors shadow-sm shadow-gold/20"
        >
          Continue to Remaining Questions →
        </button>
        <button
          onClick={() => setStep(1)}
          className="text-sm text-text-secondary hover:text-navy font-medium transition-colors px-4 py-3"
        >
          Upload More Documents
        </button>
      </div>
    </div>
  );
}
