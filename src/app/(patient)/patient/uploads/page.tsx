'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/db/store';
import { Patient, DocumentType } from '@/types';
import {
  UploadCloud,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function PatientUploadsPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);

  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('external_report');
  const [fileName, setFileName] = useState('outside_lab_report_2026.pdf');
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState(false);

  useEffect(() => {
    const user = store.getCurrentUser();
    const patients = store.getPatients();
    const pat = (user && patients.find((p) => p.email === user.email)) || patients[0];
    setPatient(pat);
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !title.trim()) return;

    setUploading(true);

    setTimeout(() => {
      // Add document with explicit provenance: 'patient_unverified'
      store.addDocument({
        patient_id: patient.id,
        uploaded_by_profile_id: patient.profile_id,
        uploaded_by_name: `${patient.full_name} (Patient Self-Upload)`,
        document_type: docType,
        title: title.trim(),
        file_url: `/documents/${fileName}`,
        file_name: fileName,
        file_size_bytes: 420000,
        mime_type: 'application/pdf',
        provenance: 'patient_unverified',
        clinical_summary: summary || 'Patient-provided external record from non-platform diagnostic laboratory.',
        ai_analysis: {
          key_findings: [
            'External document uploaded by patient',
            'Pending clinician verification against physical paperwork',
          ],
          abnormal_values: [],
          recommendations: [
            'Bring original hardcopy to next hospital consultation for clinical authentication',
          ],
          disclaimer:
            'NOTICE: This document was uploaded directly by the patient and is marked as Unverified. Hospital clinicians must inspect original paperwork prior to treatment.',
          source_pages: [1],
        },
      });

      setUploading(false);
      setUploadedSuccess(true);
    }, 600);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-teal-700" />
          <h1 className="text-2xl font-extrabold text-slate-900">Upload External Medical Report</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Add laboratory tests, prescriptions, or imaging scans performed outside the MedSphere hospital network.
        </p>
      </div>

      {/* Mandatory Provenance Alert (Section 3 Requirement) */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Provenance & Integrity Policy</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            In accordance with MedSphere clinical standards, all reports uploaded directly by patients are explicitly tagged with the <strong>"Uploaded by patient (unverified)"</strong> badge. This ensures doctors know the document did not originate through hospital specimen chain-of-custody.
          </p>
        </div>
      </div>

      {uploadedSuccess ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Report Successfully Added</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Your report <strong>"{title}"</strong> has been indexed in your longitudinal medical history with the (unverified) provenance flag.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setUploadedSuccess(false);
                setTitle('');
                setSummary('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Upload Another
            </button>
            <button
              onClick={() => router.push('/patient/history')}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              View Medical Timeline <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Document File (PDF, DOCX, PNG, JPG)
            </label>
            <div className="p-8 border-2 border-dashed border-teal-300 rounded-2xl bg-teal-50/30 text-center hover:bg-teal-50/60 transition-colors cursor-pointer">
              <FileText className="w-10 h-10 text-teal-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Selected: {fileName}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Drag and drop files here or click to browse. Max size 25MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lipid Profile - Dr Lal PathLabs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Category *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="external_report">External Diagnostic Report</option>
                <option value="lab_report">Laboratory Test Result</option>
                <option value="radiology">Radiology / X-Ray / CT / MRI</option>
                <option value="prescription">External Doctor Prescription</option>
                <option value="discharge_summary">Discharge Summary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Details / Stated Diagnosis (Optional)
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Fasting sample taken on Oct 10. Total cholesterol 194 mg/dL."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {uploading ? 'Validating & Indexing Document...' : 'Submit to Patient Record'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </main>
  );
}
