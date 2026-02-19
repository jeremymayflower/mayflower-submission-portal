import { useEffect } from 'react';
import { useStore } from './store/submission';
import Step1Upload from './components/steps/Step1Upload';
import Step2Review from './components/steps/Step2Review';
import Step3Questionnaire from './components/steps/Step3Questionnaire';
import Step4Attestations from './components/steps/Step4Attestations';
import Step5Review from './components/steps/Step5Review';
import {
  Upload, BarChart3, ClipboardList, ShieldCheck, Send,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Upload Documents', icon: Upload },
  { num: 2, label: 'Review Findings', icon: BarChart3 },
  { num: 3, label: 'Complete Gaps', icon: ClipboardList },
  { num: 4, label: 'Attestations', icon: ShieldCheck },
  { num: 5, label: 'Review & Submit', icon: Send },
];

function ProgressRing({ progress }: { progress: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = progress >= 90 ? '#2D7D46' : progress >= 50 ? '#D4A030' : '#94A3B8';

  return (
    <div className="flex items-center gap-2.5">
      <svg width="44" height="44" className="transform -rotate-90">
        <circle
          cx="22" cy="22" r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth="3"
        />
        <circle
          cx="22" cy="22" r={radius}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-text-secondary">Submission Progress</span>
        <span className="text-sm font-bold text-navy" style={{ color }}>{progress}%</span>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 toast">
      <div className="bg-navy text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">&times;</button>
      </div>
    </div>
  );
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div className="w-12 h-12 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-3 border-gold/20 rounded-full" />
          <div className="absolute inset-0 border-3 border-t-gold rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        </div>
        <p className="text-navy font-semibold text-lg mb-1">Processing</p>
        <p className="text-text-secondary text-sm">{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const {
    currentStep, setStep, companyInfo, toast, setToast,
    isLoading, loadingMessage, submissionProgress, scoreResponse,
  } = useStore();

  const progress = submissionProgress();
  const isConfirmation = currentStep === 6;

  return (
    <div className="h-screen flex flex-col bg-cream">
      {/* Loading overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Top Bar */}
      {!isConfirmation && (
        <header className="h-14 bg-white border-b border-black/[0.06] flex items-center px-6 justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-navy flex items-center justify-center">
                <span className="text-gold font-serif font-bold text-sm">M</span>
              </div>
              <span className="text-navy font-serif font-semibold text-base tracking-tight hidden sm:inline">
                Mayflower Specialty
              </span>
            </div>
            {companyInfo.organization_name && (
              <span className="text-text-secondary text-sm hidden md:inline">
                — {companyInfo.organization_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing progress={progress} />
          </div>
        </header>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {!isConfirmation && (
          <nav className="w-60 bg-navy flex-shrink-0 flex flex-col py-6 px-3 hidden lg:flex">
            <div className="mb-8 px-3">
              <p className="text-gold/70 text-[10px] font-medium uppercase tracking-widest">
                Submission Portal
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {STEPS.map(step => {
                const isActive = currentStep === step.num;
                const isComplete = currentStep > step.num;
                const Icon = step.icon;
                return (
                  <button
                    key={step.num}
                    onClick={() => {
                      if (isComplete || step.num <= currentStep) setStep(step.num);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
                      transition-all duration-200
                      ${isActive
                        ? 'bg-white/10 text-white font-medium'
                        : isComplete
                          ? 'text-white/70 hover:bg-white/5 hover:text-white/90'
                          : 'text-white/30 cursor-default'
                      }
                    `}
                  >
                    <div className={`
                      w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
                      ${isActive
                        ? 'bg-gold text-navy'
                        : isComplete
                          ? 'bg-white/15 text-white/80'
                          : 'bg-white/5 text-white/25'
                      }
                    `}>
                      {isComplete ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span>{step.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto px-3 pt-4 border-t border-white/10">
              <p className="text-white/30 text-[10px]">
                Mayflower Specialty Insurance
              </p>
              <p className="text-white/20 text-[10px]">
                submissions@mayflowerspecialty.com
              </p>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`
            mx-auto px-4 sm:px-6 lg:px-8 py-8
            ${isConfirmation ? 'max-w-2xl' : 'max-w-[880px]'}
          `}>
            {/* Mobile step indicator */}
            {!isConfirmation && (
              <div className="lg:hidden mb-6 flex items-center gap-2">
                {STEPS.map(step => (
                  <div
                    key={step.num}
                    className={`
                      h-1 flex-1 rounded-full transition-colors
                      ${step.num <= currentStep ? 'bg-gold' : 'bg-navy/10'}
                    `}
                  />
                ))}
              </div>
            )}

            <div className="animate-fadeIn" key={currentStep}>
              {currentStep === 1 && <Step1Upload />}
              {currentStep === 2 && <Step2Review />}
              {currentStep === 3 && <Step3Questionnaire />}
              {currentStep === 4 && <Step4Attestations />}
              {currentStep === 5 && <Step5Review />}
              {currentStep === 6 && <ConfirmationScreen />}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom bar */}
      {!isConfirmation && currentStep >= 2 && currentStep <= 4 && (
        <div className="h-16 bg-white border-t border-black/[0.06] flex items-center px-6 justify-between flex-shrink-0">
          <button
            onClick={() => setStep(currentStep - 1)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-navy transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => setStep(currentStep + 1)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-gold text-white px-5 py-2 rounded-lg hover:bg-gold-500 transition-colors"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ConfirmationScreen() {
  const { companyInfo, submissionId, scoreResponse } = useStore();
  const refId = `MFS-${new Date().getFullYear()}-${submissionId?.slice(0, 8).toUpperCase() || 'XXXX'}`;

  return (
    <div className="text-center py-12 animate-fadeIn">
      {/* Checkmark */}
      <div className="w-20 h-20 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center animate-checkmark">
        <svg className="w-10 h-10 text-success" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="font-serif text-3xl font-bold text-navy mb-2">
        Application Submitted Successfully
      </h1>
      <p className="text-text-secondary mb-6">
        Your submission for {companyInfo.organization_name} has been received.
      </p>

      <div className="bg-white rounded-lg border border-black/[0.06] p-4 inline-block mb-8">
        <span className="text-xs text-text-secondary">Reference Number</span>
        <p className="font-mono text-lg font-bold text-navy">{refId}</p>
      </div>

      <div className="max-w-md mx-auto text-left bg-white rounded-xl border border-black/[0.06] p-6 mb-8">
        <h3 className="font-serif text-lg font-bold text-navy mb-4">What happens next</h3>
        <div className="space-y-4">
          {[
            { time: 'Within 24 hours', text: 'Our underwriting team will review your submission.' },
            { time: '2-5 business days', text: 'You may receive follow-up questions or document requests.' },
            { time: 'Following review', text: 'You will receive a quote or feedback via email.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-navy/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-navy">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-navy">{item.time}</p>
                <p className="text-sm text-text-secondary">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Questions? Contact us at{' '}
        <a href="mailto:submissions@mayflowerspecialty.com" className="text-gold font-medium hover:underline">
          submissions@mayflowerspecialty.com
        </a>
      </p>

      {scoreResponse && (
        <button
          onClick={() => {
            import('./lib/generatePdf').then(({ generateScorecard }) => {
              generateScorecard({
                companyInfo: useStore.getState().companyInfo as any,
                profile: useStore.getState().profile,
                uploadedDocs: useStore.getState().uploadedDocs.map(d => ({
                  docType: d.docType,
                  filename: d.filename,
                })),
                signingInfo: useStore.getState().signingInfo,
                score: scoreResponse,
              });
            });
          }}
          className="bg-navy text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-navy-600 transition-colors"
        >
          Download Decision Scorecard (PDF)
        </button>
      )}

      <p className="text-[11px] text-muted mt-6">
        Submission does not guarantee coverage.
      </p>
    </div>
  );
}
