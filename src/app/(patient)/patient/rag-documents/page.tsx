'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/db/store';
import { queryPatientDocumentsRAG, RagResponse } from '@/lib/ai/rag-pipeline';
import { Patient, MedicalDocument } from '@/types';
import {
  FileSearch,
  Search,
  Sparkles,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function RagDocumentsPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [question, setQuestion] = useState('What were the measurements and conclusion of my echocardiogram?');
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = store.getCurrentUser();
    const patients = store.getPatients();
    const pat = (user && patients.find((p) => p.email === user.email)) || patients[0];
    setPatient(pat);
    if (pat) {
      setDocuments(store.getDocumentsByPatient(pat.id));
    }
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);

    const res = await queryPatientDocumentsRAG(question, documents);
    setResponse(res);
    setLoading(false);
  };

  const sampleQueries = [
    'What was my fasting plasma glucose reading on the metabolic panel?',
    'What dosage of Telmisartan did Dr. Aisha Sen prescribe?',
    'Are there any unverified external laboratory reports in my profile?',
    'What is my left ventricular ejection fraction percentage?',
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-teal-700" />
          <h1 className="text-2xl font-extrabold text-slate-900">RAG Document Retrieval</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Perform natural-language semantic searches across your entire longitudinal document repository. Answers strictly cite document names, page numbers, and section snippets.
        </p>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleQuery} className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Natural-Language Document Query
          </label>
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What were the measurements of my echocardiogram or fasting glucose?"
              className="w-full pl-4 pr-24 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? 'Retrieving...' : 'Retrieve'}
            </button>
          </div>
        </form>

        {/* Sample queries */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-500 block mb-2">Try sample document queries:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuestion(sq)}
                className="text-[11px] bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 px-3 py-1.5 rounded-full transition-colors text-left"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Results */}
      {response && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-teal-700 block">
                Source-Grounded Synthesis
              </span>
              <h2 className="text-base font-bold text-slate-900">Query: "{response.query}"</h2>
            </div>
            {response.groundedInRecords ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Grounded in Records
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Not in Records
              </span>
            )}
          </div>

          {/* Synthesized Answer */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
            {response.answer}
          </div>

          {/* Citations Grid (Document, Page, Snippet) */}
          {response.citations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-700" />
                Citations & Grounding References ({response.citations.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      c.isUnverified
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 line-clamp-1">{c.documentTitle}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                        Page {c.pageNumber}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 italic border-l-2 border-teal-500 pl-2.5">
                      "{c.sectionSnippet}..."
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {c.isUnverified ? (
                        <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                          Uploaded by patient (unverified)
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          Hospital-Generated Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            {response.disclaimer}
          </p>
        </div>
      )}
    </main>
  );
}
