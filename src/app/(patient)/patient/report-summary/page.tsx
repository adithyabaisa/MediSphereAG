'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { store } from '@/lib/db/store';
import { generateStructuredReportSummary, ReportSummaryResult } from '@/lib/ai/summarizer';
import { MedicalDocument, Patient } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';

function ReportSummaryContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('docId');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [summary, setSummary] = useState<ReportSummaryResult | null>(null);

  useEffect(() => {
    const user = store.getCurrentUser();
    const patients = store.getPatients();
    const pat = (user && patients.find((p) => p.email === user.email)) || patients[0];
    setPatient(pat);
    if (pat) {
      const docs = store.getDocumentsByPatient(pat.id);
      setDocuments(docs);

      const targetId = docIdParam || (docs.length > 0 ? docs[0].id : '');
      setSelectedDocId(targetId);

      const targetDoc = docs.find((d) => d.id === targetId) || docs[0];
      if (targetDoc) {
        setSummary(generateStructuredReportSummary(targetDoc));
      }
    }
  }, [docIdParam]);

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    const targetDoc = documents.find((d) => d.id === id);
    if (targetDoc) {
      setSummary(generateStructuredReportSummary(targetDoc));
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-teal-700" />
          <h1 className="text-2xl font-extrabold text-slate-900">Medical Report Summarization</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Structured AI analysis that preserves exact measurements and abnormal values while formulating clear, plain-language clinical explanations.
        </p>
      </div>

      {/* Document Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide shrink-0">
          Select Document to Summarize:
        </label>
        <select
          value={selectedDocId}
          onChange={(e) => handleSelectDoc(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
        >
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title} ({new Date(doc.created_at).toLocaleDateString()}) - {doc.provenance}
            </option>
          ))}
        </select>
      </div>

      {/* Summary View */}
      {summary && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Top Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  {summary.documentType.replace('_', ' ')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{summary.date}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{summary.reportTitle}</h2>
            </div>
            <ProvenanceBadge provenance={summary.provenance as any} />
          </div>

          {/* Unverified Notice */}
          {summary.provenanceNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{summary.provenanceNotice}</span>
            </div>
          )}

          {/* 1. Plain Language Explanation */}
          <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-700" />
              Plain-Language Clinical Explanation
            </h3>
            <p className="text-xs sm:text-sm text-teal-950 leading-relaxed font-sans">
              {summary.plainLanguageExplanation}
            </p>
          </div>

          {/* 2. Structured Key Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Key Diagnostic Findings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Measurements & Abnormal Values Preserved */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Physiological Measurements & Reference Intervals
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Parameter</th>
                    <th className="p-3.5">Measured Value</th>
                    <th className="p-3.5">Normal Physiological Range</th>
                    <th className="p-3.5">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {summary.measurementsAndAbnormalities.map((item, idx) => {
                    const isAbnormal = item.status === 'Abnormal';
                    return (
                      <tr key={idx} className={isAbnormal ? 'bg-rose-50/40' : ''}>
                        <td className="p-3.5 font-semibold">{item.parameter}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{item.value}</td>
                        <td className="p-3.5 text-slate-500">{item.normalRange}</td>
                        <td className="p-3.5">
                          {isAbnormal ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md text-[10px]">
                              Out of Range
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-md text-[10px]">
                              Within Limits
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Stated Recommendations
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
              {summary.clinicalRecommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            <strong>Advisory Disclaimer:</strong> {summary.disclaimer}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReportSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading report analysis...
        </div>
      }
    >
      <ReportSummaryContent />
    </Suspense>
  );
}
