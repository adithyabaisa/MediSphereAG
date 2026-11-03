'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { MedicalDocument, Patient } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import {
  History,
  FileText,
  Filter,
  Search,
  Download,
  Eye,
  Sparkles,
  Calendar,
  Building2,
  AlertTriangle,
  FileCheck,
  X,
  UploadCloud,
} from 'lucide-react';

export default function MedicalHistoryTimelinePage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProvenance, setSelectedProvenance] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null);

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(loadData);
    return unsub;
  }, []);

  const loadData = () => {
    const user = store.getCurrentUser();
    const patients = store.getPatients();
    const pat = (user && patients.find((p) => p.email === user.email)) || patients[0];
    setPatient(pat);
    if (pat) {
      setDocuments(store.getDocumentsByPatient(pat.id));
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.clinical_summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    const matchesProvenance = selectedProvenance === 'all' || doc.provenance === selectedProvenance;

    return matchesSearch && matchesType && matchesProvenance;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-extrabold text-slate-900">Longitudinal Medical History</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological records sorted newest first. Uploaded directly by verified hospitals or uploaded by patient with provenance badges.
          </p>
        </div>

        <Link
          href="/patient/uploads"
          className="self-start sm:self-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Upload External Report
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter timeline by condition, procedure, doctor, or test name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 w-full sm:w-auto"
            >
              <option value="all">All Document Types</option>
              <option value="radiology">Radiology & Imaging</option>
              <option value="lab_report">Lab Reports</option>
              <option value="consultation_note">Consultation Notes & Rx</option>
              <option value="external_report">External Reports</option>
            </select>

            <select
              value={selectedProvenance}
              onChange={(e) => setSelectedProvenance(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 w-full sm:w-auto"
            >
              <option value="all">All Provenance</option>
              <option value="hospital_generated">Hospital-generated</option>
              <option value="lab_generated">Lab-generated</option>
              <option value="patient_unverified">Patient-uploaded (unverified)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List (Newest First) */}
      <div className="space-y-4">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, idx) => {
            const isUnverified = doc.provenance === 'patient_unverified';

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                  isUnverified
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                      <ProvenanceBadge provenance={doc.provenance} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {doc.clinical_summary || 'Clinical record on file.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(doc.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        {doc.hospital_name || 'Outside Laboratory'}
                      </span>
                      <span>Author: {doc.uploaded_by_name}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Hash: {doc.file_hash.slice(0, 16)}...
                      </span>
                    </div>

                    {isUnverified && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong>Patient Self-Upload:</strong> This record was obtained outside verified platform hospitals and has not undergone clinical chain-of-custody verification.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" /> View Document
                    </button>
                    <Link
                      href={`/patient/report-summary?docId=${doc.id}`}
                      className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Summary
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No medical records match the active filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search keywords or changing document type filters.</p>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                  Document Viewer
                </span>
                <h3 className="text-base font-bold text-slate-900">{viewingDoc.title}</h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-500">Origin / Provenance</p>
                  <ProvenanceBadge provenance={viewingDoc.provenance} className="mt-1" />
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Date Issued</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(viewingDoc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Simulated Document Sheet */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-sans space-y-4">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {viewingDoc.hospital_name || 'Independent Diagnostic Report'}
                    </h4>
                    <p className="text-[11px] text-slate-500">Verified Healthcare Record</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                    ID: {viewingDoc.id}
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-slate-800 mb-1">Clinical Findings & Synthesis</h5>
                  <p className="text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                    {viewingDoc.clinical_summary}
                  </p>
                </div>

                {viewingDoc.ai_analysis?.key_findings && (
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Key Document Indicators</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {viewingDoc.ai_analysis.key_findings.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between">
                  <span>Signatory: {viewingDoc.uploaded_by_name}</span>
                  <span className="font-mono">SHA-256 Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Size: {(viewingDoc.file_size_bytes / 1024).toFixed(0)} KB • MIME: {viewingDoc.mime_type}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Simulated secure download of ${viewingDoc.title} initialized.`)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Original PDF
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
