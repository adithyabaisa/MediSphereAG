'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { evaluateAccess, recordAccessAudit } from '@/lib/consent/engine';
import { generateDoctorCopilotInsights, CopilotClinicalInsight } from '@/lib/ai/copilot';
import { Patient, MedicalDocument, HospitalStaff, PatientConsent } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import {
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  FileText,
  FlaskConical,
  Calendar,
  Sparkles,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  Building2,
  X,
  FilePlus2,
} from 'lucide-react';

export default function DoctorPatientRecordPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [doctor, setDoctor] = useState<HospitalStaff | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consent, setConsent] = useState<PatientConsent | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [copilotInsights, setCopilotInsights] = useState<CopilotClinicalInsight[]>([]);

  // Access validation state
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProvenance, setSelectedProvenance] = useState('all');

  // Modals state
  const [viewingDoc, setViewingDoc] = useState<MedicalDocument | null>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showOrderLabModal, setShowOrderLabModal] = useState(false);
  const [showCopilotModal, setShowCopilotModal] = useState(false);

  // Consultation form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension, Controlled');
  const [draftPrescription, setDraftPrescription] = useState('Tab Telmisartan 40mg OD');
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);

  // Lab order form state
  const [testName, setTestName] = useState('Glycated Hemoglobin (HbA1c)');
  const [clinicalIndication, setClinicalIndication] = useState('Follow-up on borderline fasting glucose');
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');

  useEffect(() => {
    loadPatientRecord();
  }, [code]);

  const loadPatientRecord = () => {
    const doc = store.getDoctors()[0];
    setDoctor(doc);

    // Evaluate access via Consent Engine
    const evalResult = evaluateAccess(code, doc.id);

    if (!evalResult.allowed) {
      setAccessDenied(evalResult.reason);
      return;
    }

    const pat = evalResult.patient!;
    setPatient(pat);
    setConsent(evalResult.consent || null);

    const docs = store.getDocumentsByPatient(pat.id);
    setDocuments(docs);

    // Record access event into patient-visible access audit log
    recordAccessAudit(pat.id, doc, 'consultation_access');

    // Generate AI copilot insights
    const insights = generateDoctorCopilotInsights(pat, docs, draftPrescription);
    setCopilotInsights(insights);
  };

  // Re-run allergy checks whenever prescription is edited
  useEffect(() => {
    if (patient) {
      const insights = generateDoctorCopilotInsights(patient, documents, draftPrescription);
      setCopilotInsights(insights);
      const critical = insights.find((i) => i.severity === 'critical');
      setAllergyWarning(critical ? critical.title + ': ' + critical.description : null);
    }
  }, [draftPrescription, patient, documents]);

  // Filtered documents (newest first)
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.clinical_summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    const matchesProvenance = selectedProvenance === 'all' || doc.provenance === selectedProvenance;
    return matchesSearch && matchesType && matchesProvenance;
  });

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !doctor) return;

    if (allergyWarning && !confirm(`WARNING: ${allergyWarning}\n\nDo you wish to proceed despite this flagged allergy contraindication?`)) {
      return;
    }

    // Add immutable consultation note to medical history
    store.addDocument({
      patient_id: patient.id,
      hospital_id: doctor.hospital_id,
      uploaded_by_profile_id: doctor.profile_id,
      uploaded_by_name: `${doctor.full_name} (${doctor.specialization})`,
      document_type: 'consultation_note',
      title: `OPD Consultation Note - ${doctor.specialization}`,
      file_url: `/documents/consult_note_${Date.now()}.pdf`,
      file_name: `consultation_${patient.patient_code}.pdf`,
      file_size_bytes: 520000,
      mime_type: 'application/pdf',
      provenance: 'hospital_generated',
      clinical_summary: `Consultation with ${doctor.full_name}. Complaint: ${chiefComplaint}. Assessment: ${diagnosis}. Rx: ${draftPrescription}. Notes: ${clinicalNotes}`,
      ai_analysis: {
        key_findings: [
          `Assessment: ${diagnosis}`,
          `Prescription: ${draftPrescription}`,
          `Doctor: ${doctor.full_name}`,
        ],
        abnormal_values: [],
        recommendations: [
          'Continue prescribed pharmacotherapy as specified',
          'Review at OPD in 4 weeks',
        ],
        disclaimer: `Signed and approved by ${doctor.full_name} (${doctor.professional_reg_no}).`,
        source_pages: [1],
      },
    });

    setShowConsultModal(false);
    setChiefComplaint('');
    setClinicalNotes('');
    loadPatientRecord();
  };

  const handleOrderLabTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !doctor) return;

    // Create lab order in store
    const newOrder = {
      id: `lab-order-${Date.now()}`,
      patient_id: patient.id,
      patient_code: patient.patient_code,
      patient_name: patient.full_name,
      hospital_id: doctor.hospital_id,
      doctor_staff_id: doctor.id,
      doctor_name: doctor.full_name,
      test_name: testName,
      clinical_indication: clinicalIndication,
      priority: labPriority,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };

    store['state'].labOrders.unshift(newOrder);
    store['persist']();

    setShowOrderLabModal(false);
    alert(`Diagnostic order for "${testName}" successfully dispatched to hospital laboratory queue.`);
  };

  if (accessDenied) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied to Patient Record</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {accessDenied}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => router.push('/hospital/doctor')}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Return to Patient Search
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!patient) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/hospital/doctor"
          className="text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Workspace
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCopilotModal(true)}
            className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Clinical Copilot ({copilotInsights.length})
          </button>
        </div>
      </div>

      {/* Patient Demographic & Active Consent Card (Section 5 Requirement) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">{patient.full_name}</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                {patient.patient_code}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consent Active (Scope: {consent?.scope})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              DOB: {patient.dob} • Gender: {patient.gender || 'Female'} • Blood Group: {patient.blood_group || 'B+'} • City: {patient.city}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowConsultModal(true)}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> + Record Encounter & Rx
            </button>
            <button
              onClick={() => setShowOrderLabModal(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-indigo-600" /> + Order Lab Test
            </button>
          </div>
        </div>

        {/* Critical Allergies & Clinical Alerts Banner */}
        {patient.allergies?.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">CRITICAL DOCUMENTED ALLERGIES & CONTRAINDICATIONS:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {patient.allergies.map((all, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-200/80 text-rose-950 font-bold rounded-md text-[11px]">
                    {all}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search through patient history, reports, or findings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Document Types</option>
            <option value="consultation_note">Consultation Notes</option>
            <option value="lab_report">Lab Reports</option>
            <option value="radiology">Radiology & Scans</option>
            <option value="external_report">External Reports</option>
          </select>

          <select
            value={selectedProvenance}
            onChange={(e) => setSelectedProvenance(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Provenance</option>
            <option value="hospital_generated">Hospital-generated</option>
            <option value="lab_generated">Lab-generated</option>
            <option value="patient_unverified">Patient Unverified</option>
          </select>
        </div>
      </div>

      {/* Page-wise Longitudinal Document Viewer (Newest First) */}
      <div className="space-y-4">
        {filteredDocs.map((doc) => {
          const isUnverified = doc.provenance === 'patient_unverified';

          return (
            <div
              key={doc.id}
              className={`bg-white rounded-3xl p-6 border transition-all ${
                isUnverified
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-teal-300 shadow-xs'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                    <ProvenanceBadge provenance={doc.provenance} />
                    <span className="text-xs text-slate-400">
                      Version {doc.version} (Immutable)
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {doc.clinical_summary || 'Clinical record contents preserved.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>
                      Date: <strong>{new Date(doc.created_at).toLocaleDateString()}</strong>
                    </span>
                    <span>Facility: {doc.hospital_name || 'Outside Clinic'}</span>
                    <span>Author: {doc.uploaded_by_name}</span>
                    <span className="font-mono text-[10px]">
                      Hash: {doc.file_hash.slice(0, 16)}...
                    </span>
                  </div>

                  {isUnverified && (
                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        <strong>Clinician Alert:</strong> Uploaded by patient (unverified). Inspect physical hardcopy before relying on this test for targeted therapeutics.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> View Document
                  </button>
                  <button
                    onClick={() => {
                      setViewingDoc(doc);
                    }}
                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Insights
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Clinical Copilot Slide-over Modal */}
      {showCopilotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">AI Clinical Copilot (Advisory)</h3>
                </div>
                <button
                  onClick={() => setShowCopilotModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-[11px] text-teal-800">
                  All AI Copilot recommendations are strictly advisory assistance. The licensed clinician reviews, signs, and authorizes every decision.
                </div>

                {copilotInsights.map((insight, idx) => {
                  const isCrit = insight.severity === 'critical';
                  const isWarn = insight.severity === 'warning';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                        isCrit
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : isWarn
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {isCrit ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          {insight.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/80">
                          {insight.severity}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{insight.description}</p>
                      <p className="text-[10px] text-slate-500 pt-1">
                        <strong>Evidence:</strong> {insight.evidence}
                      </p>
                      {insight.actionPrompt && (
                        <p className="text-[10px] font-semibold text-teal-800 pt-0.5">
                          Recommendation: {insight.actionPrompt}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowCopilotModal(false)}
              className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Close Copilot
            </button>
          </div>
        </div>
      )}

      {/* Record Encounter Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Clinical Encounter</h3>
                <p className="text-xs text-slate-500">Patient: {patient.full_name} ({patient.patient_code})</p>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {allergyWarning && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">ALLERGY CONTRAINDICATION ALERT</p>
                  <p className="text-[11px]">{allergyWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveConsultation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Mild shortness of breath upon stair climbing; BP follow-up"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Assessment / Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Stage 1 Essential Hypertension"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Prescription (Rx)</label>
                  <span className="text-[10px] text-slate-400">Checked against documented allergies</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={draftPrescription}
                  onChange={(e) => setDraftPrescription(e.target.value)}
                  placeholder="e.g. Tab Telmisartan 40mg once daily in morning for 30 days"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinician Examination Notes</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Vitals: BP 126/80 mmHg, HR 74 regular. Heart sounds normal. Advised lifestyle modifications."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800">
                Signing this encounter commits an immutable medical document to the patient record under hospital authority.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Sign & Finalize Encounter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Lab Test Modal */}
      {showOrderLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Order Diagnostic Test</h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatches order to Max Super-Specialty Laboratory queue.
            </p>

            <form onSubmit={handleOrderLabTest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test Procedure</label>
                <select
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Glycated Hemoglobin (HbA1c)">Glycated Hemoglobin (HbA1c)</option>
                  <option value="Comprehensive Metabolic Panel (CMP)">Comprehensive Metabolic Panel (CMP)</option>
                  <option value="Lipid Profile with Apolipoprotein B">Lipid Profile with Apolipoprotein B</option>
                  <option value="Transthoracic 2D Echo Follow-up">Transthoracic 2D Echo Follow-up</option>
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Indication</label>
                <input
                  type="text"
                  required
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={labPriority}
                  onChange={(e) => setLabPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent (4 hours)</option>
                  <option value="stat">STAT (Emergency)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderLabModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-semibold shadow-xs"
                >
                  Dispatch to Lab Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Clinical Document Detail
                </span>
                <h3 className="text-base font-bold text-slate-900">{viewingDoc.title}</h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <ProvenanceBadge provenance={viewingDoc.provenance} />
                <span className="font-mono text-slate-500">
                  {new Date(viewingDoc.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800">Clinical Narrative:</p>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  {viewingDoc.clinical_summary}
                </p>

                {viewingDoc.ai_analysis && (
                  <div className="space-y-2 pt-1">
                    <p className="font-bold text-slate-800">Structured Findings:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {viewingDoc.ai_analysis.key_findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => alert(`Simulated export of ${viewingDoc.title} recorded to audit log.`)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
