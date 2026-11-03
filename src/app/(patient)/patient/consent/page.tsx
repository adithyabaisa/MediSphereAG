'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/db/store';
import { PatientConsent, DocumentAccessLog, Hospital, Patient } from '@/types';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Clock,
  History,
  AlertCircle,
} from 'lucide-react';

export default function PatientConsentPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consents, setConsents] = useState<PatientConsent[]>([]);
  const [accessLogs, setAccessLogs] = useState<DocumentAccessLog[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Grant Consent Form state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [targetHospitalId, setTargetHospitalId] = useState('');
  const [scope, setScope] = useState<'all_records' | 'consultations_only' | 'diagnostics_only'>('all_records');
  const [durationDays, setDurationDays] = useState(30);

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
      setConsents(store.getConsentsByPatient(pat.id));
      setAccessLogs(store.getAccessLogs(pat.id));
    }
    const verifiedHosps = store.getHospitals().filter((h) => h.status === 'verified');
    setHospitals(verifiedHosps);
    if (verifiedHosps.length > 0 && !targetHospitalId) {
      setTargetHospitalId(verifiedHosps[0].id);
    }
  };

  const handleRevoke = (consentId: string) => {
    if (confirm('Are you sure you want to revoke hospital access immediately? Clinicians at this hospital will lose all access to your medical history.')) {
      store.revokeConsent(consentId, 'Revoked by patient via consent governance panel');
      loadData();
    }
  };

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !targetHospitalId) return;

    store.grantConsent(patient.id, targetHospitalId, scope, 'digital_app', durationDays);
    setShowGrantModal(false);
    loadData();
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-extrabold text-slate-900">Access & Consent Governance</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You hold total sovereignty over your health records. Hospital clinicians can only view records when active consent is granted.
          </p>
        </div>

        <button
          onClick={() => setShowGrantModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Grant Hospital Access
        </button>
      </div>

      {/* Principle Banner */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">DPDP-Compliant Consent Architecture</p>
          <p className="text-teal-800 mt-0.5">
            A patient code is an identifier, never a credential. Sharing your code allows a hospital to find your profile, but clinicians cannot see any clinical notes, lab reports, or scans without an active, unexpired consent grant.
          </p>
        </div>
      </div>

      {/* Active Consents */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hospital Access Grants</h2>
            <p className="text-xs text-slate-500">Organizations authorized to query and hold your records</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full">
            {consents.filter((c) => c.status === 'active').length} Active
          </span>
        </div>

        <div className="space-y-4">
          {consents.map((c) => {
            const isActive = c.status === 'active' && new Date(c.expires_at) > new Date();
            const isRevoked = c.status === 'revoked';

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{c.hospital_name}</h3>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Consent
                      </span>
                    ) : isRevoked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3 text-rose-600" /> Revoked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                    <p>
                      <strong className="text-slate-800">Scope:</strong>{' '}
                      <span className="capitalize">{c.scope.replace('_', ' ')}</span>
                    </p>
                    <p>
                      <strong className="text-slate-800">Method:</strong>{' '}
                      <span className="capitalize">{c.method.replace('_', ' ')}</span>
                    </p>
                    <p>
                      <strong className="text-slate-800">Expires:</strong>{' '}
                      {new Date(c.expires_at).toLocaleDateString()}
                    </p>
                  </div>

                  {c.revocation_reason && (
                    <p className="text-[11px] text-rose-700 mt-1">
                      Reason for revocation: {c.revocation_reason}
                    </p>
                  )}
                </div>

                {isActive && (
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors shrink-0"
                  >
                    Revoke Immediately
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* "Who Accessed My Records" Audit Trail */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Who Accessed My Records (Audit Log)</h2>
              <p className="text-xs text-slate-500">Every view, download, or AI summary by clinician</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time immutable log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {accessLogs.length > 0 ? (
            accessLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.staff_name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{log.hospital_name}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Action: <strong className="text-teal-700 uppercase">{log.action_type}</strong>
                    {log.document_title ? ` on "${log.document_title}"` : ''}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {new Date(log.accessed_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No clinician access logged yet.</p>
          )}
        </div>
      </div>

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Grant Hospital Access</h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorize a verified healthcare organization to access your longitudinal medical record.
            </p>

            <form onSubmit={handleGrant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Verified Hospital
                </label>
                <select
                  value={targetHospitalId}
                  onChange={(e) => setTargetHospitalId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.legal_name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Access Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="all_records">All Medical Records & Diagnostics (Recommended)</option>
                  <option value="consultations_only">Consultations & Prescriptions Only</option>
                  <option value="diagnostics_only">Lab & Radiology Results Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Validity Duration</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value={7}>7 Days (Single encounter)</option>
                  <option value={30}>30 Days (Standard course of care)</option>
                  <option value={90}>90 Days (Chronic condition monitoring)</option>
                  <option value={365}>1 Year (Family physician long-term)</option>
                </select>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800">
                You may revoke or narrow this consent grant at any time with immediate effect.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
