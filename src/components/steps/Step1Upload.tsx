import { useCallback, useRef, useState } from 'react';
import { useStore, DOC_TYPES, INDUSTRY_SECTORS } from '../../store/submission';
import { api } from '../../services/api';
import {
  Shield, FileCheck, FileText, Scale, AlertTriangle,
  Database, Award, Upload, ChevronDown, Lightbulb,
  X, File,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  Shield, FileCheck, FileText, Scale, AlertTriangle, Database, Award,
};

export default function Step1Upload() {
  const {
    companyInfo, setCompanyInfo,
    uploadedDocs, addDoc, updateDocStatus, removeDoc,
    setSubmissionId, submissionId,
    setExtractionFactors, setStep,
    isCompanyInfoComplete,
    setLoading, setLoadingMessage, setError, setToast,
  } = useStore();

  const [showHelper, setShowHelper] = useState(false);
  const [dragOverType, setDragOverType] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (docType: string, file: File) => {
    // Validate file
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?|xlsx|png|jpe?g)$/i)) {
      setToast('Invalid file type. Accepted: PDF, DOCX, DOC, XLSX, PNG, JPG');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setToast('File too large. Maximum size: 50MB');
      return;
    }

    addDoc({ file, docType, status: 'pending', filename: file.name });
  }, [addDoc, setToast]);

  const handleDrop = useCallback((docType: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverType(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(docType, file);
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!isCompanyInfoComplete()) {
      setToast('Please complete all required company fields.');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Creating submission...');

      // 1. Create submission
      let subId = submissionId;
      if (!subId) {
        const resp = await api.createSubmission({
          organization_name: companyInfo.organization_name,
          industry_sector: companyInfo.industry_sector,
          annual_revenue_millions: Number(companyInfo.annual_revenue_millions),
          number_of_employees: Number(companyInfo.number_of_employees),
          policy_type: companyInfo.policy_type,
          geographic_scope: companyInfo.geographic_scope,
        });
        subId = resp.id;
        setSubmissionId(subId);
      }

      // 2. Upload docs
      const pending = uploadedDocs.filter(d => d.status === 'pending' || d.status === 'error');
      for (let i = 0; i < pending.length; i++) {
        const doc = pending[i];
        setLoadingMessage(`Uploading ${doc.filename} (${i + 1}/${pending.length})...`);
        updateDocStatus(doc.docType, 'uploading');
        try {
          await api.uploadDocument(subId, doc.file, doc.docType);
          updateDocStatus(doc.docType, 'uploaded');
        } catch {
          updateDocStatus(doc.docType, 'error');
        }
      }

      // 3. Trigger extraction
      setLoadingMessage('Analyzing your documents... This typically takes 30-60 seconds.');
      const extraction = await api.triggerExtraction(subId);
      setExtractionFactors(extraction.factors || []);

      setLoading(false);
      setStep(2);
    } catch (err) {
      setLoading(false);
      setToast('Something went wrong. Please try again.');
      console.error(err);
    }
  };

  const handleSkip = async () => {
    if (!isCompanyInfoComplete()) {
      setToast('Please complete all required company fields.');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Creating submission...');

      const resp = await api.createSubmission({
        organization_name: companyInfo.organization_name,
        industry_sector: companyInfo.industry_sector,
        annual_revenue_millions: Number(companyInfo.annual_revenue_millions),
        number_of_employees: Number(companyInfo.number_of_employees),
        policy_type: companyInfo.policy_type,
        geographic_scope: companyInfo.geographic_scope,
      });
      setSubmissionId(resp.id);

      setLoading(false);
      setStep(3);
    } catch {
      setLoading(false);
      setToast('Something went wrong. Please try again.');
    }
  };

  const uploadCount = uploadedDocs.filter(d => d.status === 'uploaded' || d.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-2">
          Start by uploading your AI governance documentation
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
          We'll analyze your documents and pre-fill your application automatically.
          The more you upload, the less you'll need to answer manually.
        </p>
      </div>

      {/* Company Basics */}
      <section className="bg-white rounded-xl border border-black/[0.04] p-6">
        <h2 className="font-serif text-lg font-semibold text-navy mb-4">Company Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy mb-1">
              Organization Name <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              value={companyInfo.organization_name}
              onChange={e => setCompanyInfo({ organization_name: e.target.value })}
              placeholder="Acme AI Corp"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Industry Sector <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <select
                value={companyInfo.industry_sector}
                onChange={e => setCompanyInfo({ industry_sector: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white appearance-none"
              >
                <option value="">Select industry...</option>
                {INDUSTRY_SECTORS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Annual Revenue ($M) <span className="text-gold">*</span>
            </label>
            <input
              type="number"
              value={companyInfo.annual_revenue_millions}
              onChange={e => setCompanyInfo({ annual_revenue_millions: e.target.value ? Number(e.target.value) : '' })}
              placeholder="100"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
            />
            <p className="text-[11px] text-text-secondary mt-1">We underwrite companies with $50M+ revenue</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Number of Employees <span className="text-gold">*</span>
            </label>
            <input
              type="number"
              value={companyInfo.number_of_employees}
              onChange={e => setCompanyInfo({ number_of_employees: e.target.value ? Number(e.target.value) : '' })}
              placeholder="500"
              min="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Policy Type</label>
            <div className="relative">
              <select
                value={companyInfo.policy_type}
                onChange={e => setCompanyInfo({ policy_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white appearance-none"
              >
                <option value="AI Primary Policy">AI Primary Policy</option>
                <option value="AI DIC Policy">AI DIC Policy</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Geographic Scope</label>
            <div className="relative">
              <select
                value={companyInfo.geographic_scope}
                onChange={e => setCompanyInfo({ geographic_scope: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white appearance-none"
              >
                <option value="US Only">US Only</option>
                <option value="US and EU">US and EU</option>
                <option value="Global">Global</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Document Upload Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-navy">Upload Documentation</h2>
          <button
            onClick={() => setShowHelper(!showHelper)}
            className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-600 font-medium transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            What should I upload?
          </button>
        </div>

        {showHelper && (
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 mb-4 text-sm text-navy animate-fadeIn">
            <p className="font-medium mb-2">Recommended approach:</p>
            <p className="text-text-secondary mb-1">
              Best path: Upload all available categories. We'll extract what we can automatically.
            </p>
            <p className="text-text-secondary mb-1">
              Minimum: At least your AI Governance Policy or SOC 2 report.
            </p>
            <p className="text-text-secondary">
              No documents? Click "Skip to Questionnaire" and answer everything as questions instead.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {DOC_TYPES.map(docType => {
            const Icon = ICONS[docType.icon] || FileText;
            const uploaded = uploadedDocs.find(d => d.docType === docType.key);
            const isDragOver = dragOverType === docType.key;

            return (
              <div
                key={docType.key}
                className={`
                  bg-white rounded-xl border p-4 transition-all duration-200
                  ${uploaded?.status === 'uploaded' || uploaded?.status === 'pending'
                    ? 'border-success/30 bg-success/[0.02]'
                    : isDragOver
                      ? 'border-gold bg-gold/[0.03]'
                      : 'border-black/[0.06] hover:border-black/10'
                  }
                `}
                onDragOver={e => { e.preventDefault(); setDragOverType(docType.key); }}
                onDragLeave={() => setDragOverType(null)}
                onDrop={e => handleDrop(docType.key, e)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${uploaded?.status === 'uploaded' || uploaded?.status === 'pending'
                      ? 'bg-success/10 text-success'
                      : 'bg-navy/5 text-navy/50'
                    }
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy leading-tight">{docType.label}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{docType.desc}</p>
                  </div>
                </div>

                {uploaded && (uploaded.status === 'uploaded' || uploaded.status === 'pending') ? (
                  <div className="flex items-center gap-2 bg-success/5 rounded-lg px-3 py-2">
                    <File className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    <span className="text-xs text-success font-medium truncate flex-1">
                      {uploaded.filename}
                    </span>
                    <button
                      onClick={() => removeDoc(docType.key)}
                      className="text-text-secondary hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : uploaded?.status === 'uploading' ? (
                  <div className="flex items-center gap-2 bg-warning/5 rounded-lg px-3 py-2">
                    <div className="w-3.5 h-3.5 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                    <span className="text-xs text-warning font-medium">Processing...</span>
                  </div>
                ) : (
                  <label className="dropzone flex items-center justify-center py-3 cursor-pointer group">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.xlsx,.png,.jpg,.jpeg"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(docType.key, file);
                        e.target.value = '';
                      }}
                    />
                    <div className="text-center">
                      <Upload className="w-4 h-4 text-muted mx-auto mb-1 group-hover:text-gold transition-colors" />
                      <span className="text-xs text-text-secondary group-hover:text-gold transition-colors">
                        Drag & drop or click to browse
                      </span>
                    </div>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
        <button
          onClick={handleAnalyze}
          disabled={!isCompanyInfoComplete()}
          className={`
            flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
            ${isCompanyInfoComplete()
              ? 'bg-gold text-white hover:bg-gold-500 shadow-sm shadow-gold/20'
              : 'bg-muted/50 text-white cursor-not-allowed'
            }
          `}
        >
          <Upload className="w-4 h-4" />
          {uploadCount > 0 ? `Analyze ${uploadCount} Document${uploadCount > 1 ? 's' : ''}` : 'Analyze My Documents'}
        </button>
        <button
          onClick={handleSkip}
          disabled={!isCompanyInfoComplete()}
          className="text-sm text-text-secondary hover:text-navy font-medium transition-colors px-4 py-3"
        >
          Skip to Questionnaire →
        </button>
      </div>
    </div>
  );
}
