'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { evaluateAccess } from '@/lib/consent/engine';
import { store } from '@/lib/db/store';
import {
  Stethoscope,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  Building2,
  Lock,
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [patientCode, setPatientCode] = useState('MSC-P-7F29A1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNeutralError, setIsNeutralError] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = store.getCurrentUser();
  const doctor = store.getDoctors()[0]; // Dr. Aisha Sen by default

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsNeutralError(false);
    setLoading(true);

    setTimeout(() => {
      // Evaluate access using strict multi-rule engine
      const staffId = currentUser?.id || doctor.id;
      const result = evaluateAccess(patientCode.trim(), staffId);

      if (!result.allowed) {
        setErrorMsg(result.reason);
        setIsNeutralError(result.neutralError);
        setLoading(false);
        return;
      }

      // Valid & authorized: record audit log and route to patient's longitudinal record
      setLoading(false);
      router.push(`/hospital/doctor/records/${patientCode.trim().toUpperCase()}`);
    }, 400);
  };

  const todayAppointments = store.getAppointmentsByHospital('hosp-max-saket').slice(0, 3);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Clinician Header Bar (Section 5 Requirement) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-100 shadow-2xs">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Dr. Aisha Sen
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Verified Clinician
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cardiology & Interventional Cardiology • Reg #{doctor.professional_reg_no}
            </p>
            <p className="text-xs font-semibold text-teal-800 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              Max Super-Specialty Hospital Saket
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
          <p><strong>MFA Status:</strong> <span className="text-emerald-700 font-bold">Authenticated</span></p>
          <p><strong>Hospital Status:</strong> <span className="text-emerald-700 font-bold">Verified</span></p>
        </div>
      </div>

      {/* Central Patient Search by Code (Section 5 Requirement) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-700 space-y-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-teal-400 font-bold block mb-1">
            Consent-Gated Clinical Intake
          </span>
          <h2 className="text-xl sm:text-2xl font-bold">
            Enter unique patient code to access authorized medical history…
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            A patient code is an identifier, never a credential. Access requires a verified hospital, active clinician profile, and an active consent link granted by the patient.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-900/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{errorMsg}</p>
              {isNeutralError && (
                <p className="text-[11px] text-rose-300 mt-1">
                  Security notice: MedSphere returns the same neutral response for unregistered codes and unauthorized codes to prevent patient identity enumeration.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSearchPatient} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
              placeholder="e.g. MSC-P-7F29A1"
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-teal-400 font-mono text-base tracking-wider uppercase text-teal-100 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 whitespace-nowrap"
          >
            {loading ? 'Validating Consent...' : 'Access Patient Records'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Test Codes */}
        <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px]">Testing Fast-Pass:</span>
          <button
            type="button"
            onClick={() => setPatientCode('MSC-P-7F29A1')}
            className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-mono text-[11px]"
          >
            Priya Sharma (Active Consent: MSC-P-7F29A1)
          </button>
          <button
            type="button"
            onClick={() => setPatientCode('MSC-P-9B43E2')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-mono text-[11px]"
          >
            Amit Patel (No Max Consent: MSC-P-9B43E2)
          </button>
          <button
            type="button"
            onClick={() => setPatientCode('MSC-P-000000')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-mono text-[11px]"
          >
            Invalid / Unknown Code (Test Neutral Error)
          </button>
        </div>
      </div>

      {/* Today's Appointments Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">Today's Consultation Schedule</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Cardiology OPD</span>
        </div>

        <div className="space-y-3">
          {todayAppointments.map((appt) => (
            <div
              key={appt.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-teal-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{appt.patient_name}</span>
                  <span className="font-mono text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    {appt.patient_code}
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                    {appt.status}
                  </span>
                </div>
                <p className="text-slate-500">
                  Time: <strong>{appt.appointment_time}</strong> • Reason: {appt.chief_complaint || 'General Review'}
                </p>
              </div>

              <button
                onClick={() => {
                  setPatientCode(appt.patient_code);
                  router.push(`/hospital/doctor/records/${appt.patient_code}`);
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                Open Clinical Record <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
