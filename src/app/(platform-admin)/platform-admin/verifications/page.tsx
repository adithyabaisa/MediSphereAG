'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Hospital, AuditLog } from '@/types';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  ArrowLeft,
  ExternalLink,
  History,
  Loader2,
} from 'lucide-react';

export default function PlatformAdminVerificationsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedHosp, setSelectedHosp] = useState<Hospital | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
    const unsub = store.subscribe(refreshData);
    return unsub;
  }, []);

  const refreshData = async () => {
    let currentHospitals = store.getHospitals();
    setAuditLogs(store.getAuditLogs());

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: dbHospitals } = await supabase.from('hospitals').select('*');
        if (dbHospitals && dbHospitals.length > 0) {
          const merged = [...currentHospitals];
          for (const dbH of dbHospitals) {
            const idx = merged.findIndex(
              (h) => h.id === dbH.id || h.registration_number === dbH.registration_number
            );
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                status: dbH.status,
                verified_at: dbH.verified_at,
                rejection_reason: dbH.rejection_reason,
              };
            } else {
              merged.push({
                id: dbH.id,
                legal_name: dbH.legal_name,
                hospital_type: dbH.hospital_type,
                registration_number: dbH.registration_number,
                tax_id: dbH.tax_id,
                official_email: dbH.official_email,
                official_phone: dbH.official_phone,
                address: dbH.address,
                city: dbH.city,
                state: dbH.state,
                pincode: dbH.pincode,
                latitude: Number(dbH.latitude) || 28.5,
                longitude: Number(dbH.longitude) || 77.2,
                status: dbH.status,
                accreditation: dbH.accreditation || [],
                signatory_name: dbH.signatory_name,
                signatory_designation: dbH.signatory_designation,
                verified_at: dbH.verified_at,
                rejection_reason: dbH.rejection_reason,
                created_at: dbH.created_at,
              });
            }
          }
          currentHospitals = merged;
        }
      } catch (err) {
        console.error('Error fetching Supabase hospitals:', err);
      }
    }

    setHospitals(currentHospitals);
  };

  const handleVerify = async (hospitalId: string) => {
    setActionLoading(hospitalId);
    store.updateHospitalStatus(hospitalId, 'verified', undefined, 'Platform Admin (Manual Review)');

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const hosp = store.getHospitalById(hospitalId);
        await supabase
          .from('hospitals')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            rejection_reason: null,
          })
          .or(`id.eq.${hospitalId},registration_number.eq.${hosp?.registration_number}`);
      } catch (err) {
        console.error('Error verifying hospital in Supabase:', err);
      }
    }

    await refreshData();
    setActionLoading(null);
  };

  const handleOpenReject = (hosp: Hospital) => {
    setSelectedHosp(hosp);
    setRejectReason('Statutory clinical registration document is expired or invalid.');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (selectedHosp) {
      setActionLoading(selectedHosp.id);
      store.updateHospitalStatus(selectedHosp.id, 'rejected', rejectReason, 'Platform Admin');

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          await supabase
            .from('hospitals')
            .update({
              status: 'rejected',
              rejection_reason: rejectReason,
            })
            .or(`id.eq.${selectedHosp.id},registration_number.eq.${selectedHosp.registration_number}`);
        } catch (err) {
          console.error('Error rejecting hospital in Supabase:', err);
        }
      }

      setShowRejectModal(false);
      await refreshData();
      setActionLoading(null);
    }
  };

  const handleSuspend = async (hospitalId: string) => {
    setActionLoading(hospitalId);
    const reason = 'Establishment suspended pending regulatory safety investigation.';
    store.updateHospitalStatus(hospitalId, 'suspended', reason, 'Platform Admin');

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const hosp = store.getHospitalById(hospitalId);
        await supabase
          .from('hospitals')
          .update({
            status: 'suspended',
            rejection_reason: reason,
          })
          .or(`id.eq.${hospitalId},registration_number.eq.${hosp?.registration_number}`);
      } catch (err) {
        console.error('Error suspending hospital in Supabase:', err);
      }
    }

    await refreshData();
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h1 className="text-base font-bold">Platform Governance: Hospital Verification Desk</h1>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
            Platform Admin Authority
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Banner Notice */}
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
          <Building2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Hospital-Anchored Verification Rule</p>
            <p className="text-teal-800 mt-0.5">
              Doctors and clinical staff can only access patient medical history if their affiliated hospital is in <strong>verified</strong> status. Suspended or unverified hospitals are completely blocked by the Consent and RLS engines.
            </p>
          </div>
        </div>

        {/* Verification Queue */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Healthcare Organization Applications</h2>
              <p className="text-xs text-slate-500">
                Review establishment certificates, statutory registration, and official signatory credentials.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full">
              Total: {hospitals.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {hospitals.map((hosp) => {
              const isVerified = hosp.status === 'verified';
              const isSubmitted = hosp.status === 'submitted' || hosp.status === 'under_review';
              const isRejected = hosp.status === 'rejected';
              const isSuspended = hosp.status === 'suspended';
              const isLoading = actionLoading === hosp.id;

              return (
                <div key={hosp.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{hosp.legal_name}</h3>
                        {/* Status Badge */}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Badge Active
                          </span>
                        )}
                        {isSubmitted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Suspended
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600">
                        <p>
                          <strong className="text-slate-800">State Reg No:</strong>{' '}
                          <span className="font-mono">{hosp.registration_number}</span>
                        </p>
                        <p>
                          <strong className="text-slate-800">Type:</strong> {hosp.hospital_type}
                        </p>
                        <p>
                          <strong className="text-slate-800">Signatory:</strong> {hosp.signatory_name} ({hosp.signatory_designation})
                        </p>
                        <p>
                          <strong className="text-slate-800">Official Email:</strong> {hosp.official_email}
                        </p>
                        <p>
                          <strong className="text-slate-800">Location:</strong> {hosp.city}, {hosp.state}
                        </p>
                        <p>
                          <strong className="text-slate-800">Accreditation:</strong>{' '}
                          {hosp.accreditation?.join(', ') || 'None declared'}
                        </p>
                      </div>

                      {hosp.rejection_reason && (
                        <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
                          <strong>Reason:</strong> {hosp.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-2 px-3">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <>
                          {!isVerified && (
                            <button
                              onClick={() => handleVerify(hosp.id)}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                            </button>
                          )}

                          {isVerified && (
                            <button
                              onClick={() => handleSuspend(hosp.id)}
                              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-medium transition-colors"
                            >
                              Suspend Access
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              onClick={() => handleOpenReject(hosp)}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition-colors"
                            >
                              Reject Application
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log Trail */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Platform Governance Audit Ledger</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{log.event_name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {log.event_category}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Target: <strong>{log.hospital_name || 'System-wide'}</strong> • Actor:{' '}
                    <strong>{log.actor_name || 'System'}</strong>
                  </p>
                </div>
                <div className="text-right text-slate-400 font-mono text-[11px]">
                  {new Date(log.occurred_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && selectedHosp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Reject Organization Application</h3>
            </div>
            <p className="text-xs text-slate-600">
              You are about to reject the registration of <strong>{selectedHosp.legal_name}</strong>. Please provide a statutory or compliance justification:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              placeholder="e.g. State clinical establishment license is unverified or expired."
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
