'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { Appointment, Patient } from '@/types';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function PatientAppointmentsPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
      setAppointments(store.getAppointmentsByPatient(pat.id));
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      store.cancelAppointment(id);
      loadData();
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-700" />
            <h1 className="text-2xl font-extrabold text-slate-900">Your Appointments</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your hospital visits, upcoming consultations, and clinical encounter scheduling.
          </p>
        </div>

        <Link
          href="/patient/dashboard"
          className="self-start sm:self-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Book New Consultation
        </Link>
      </div>

      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map((appt) => {
            const isUpcoming = appt.status === 'upcoming';
            const isCompleted = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{appt.doctor_name}</h3>
                    {isUpcoming && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        Upcoming
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Completed
                      </span>
                    )}
                    {isCancelled && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {appt.department} • {appt.hospital_name}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {appt.appointment_date} at {appt.appointment_time}
                    </span>
                    <span>Fee: ₹{appt.consultation_fee}</span>
                    {appt.chief_complaint && (
                      <span className="text-slate-400">Note: {appt.chief_complaint}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUpcoming && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Cancel Consultation
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No appointments scheduled</p>
            <p className="text-xs text-slate-400 mt-1">Book your next consultation with a verified clinician.</p>
          </div>
        )}
      </div>
    </main>
  );
}
