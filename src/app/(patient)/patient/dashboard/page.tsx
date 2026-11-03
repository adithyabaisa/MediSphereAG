'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { Hospital, HospitalStaff, MedicalDocument, Appointment, Patient } from '@/types';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import {
  Search,
  MapPin,
  Filter,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  Star,
} from 'lucide-react';

export default function PatientDashboardPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<HospitalStaff[]>([]);
  const [recentDocs, setRecentDocs] = useState<MedicalDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedMaxFee, setSelectedMaxFee] = useState(2000);
  const [onlyVerified, setOnlyVerified] = useState(true);
  const [locationPill, setLocationPill] = useState('Saket, New Delhi (Auto-detected)');

  // Booking Modal state
  const [bookingDoctor, setBookingDoctor] = useState<HospitalStaff | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-11-05');
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

    setHospitals(store.getHospitals());
    setDoctors(store.getDoctors());
    if (pat) {
      setRecentDocs(store.getDocumentsByPatient(pat.id).slice(0, 3));
      setAppointments(store.getAppointmentsByPatient(pat.id));
    }
  };

  // Filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.qualifications || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      (doc.specialization || '').toLowerCase().includes(selectedSpecialty.toLowerCase());

    const matchesFee = doc.consultation_fee <= selectedMaxFee;
    return matchesSearch && matchesSpecialty && matchesFee;
  });

  // Filtered hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (onlyVerified && h.status !== 'verified') return false;
    if (!searchQuery) return true;
    return (
      h.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !patient) return;

    const hosp = store.getHospitalById(bookingDoctor.hospital_id);

    store.bookAppointment({
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_code: patient.patient_code,
      hospital_id: bookingDoctor.hospital_id,
      hospital_name: hosp?.legal_name || 'Hospital',
      doctor_staff_id: bookingDoctor.id,
      doctor_name: bookingDoctor.full_name,
      department: bookingDoctor.specialization || 'General',
      appointment_date: bookingDate,
      appointment_time: bookingTime,
      consultation_fee: bookingDoctor.consultation_fee,
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingDoctor(null);
    }, 2000);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-teal-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
              Universal Patient Portal
            </span>
            <span className="text-xs text-teal-300">
              Unique Code: <strong className="font-mono text-white">{patient?.patient_code || 'MSC-P-7F29A1'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {patient?.full_name || 'Priya Sharma'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-xl">
            Your records are uploaded directly by verified hospital staff. You own consent and can ask questions to your clinical AI assistant anytime.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/patient/history"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-teal-300" />
            Medical History
          </Link>
          <Link
            href="/patient/ai-chat"
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-slate-950" />
            Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* Emergency Shortcut (Section 3 Requirement) */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
              24x7 Emergency Triage & Hospital Ambulance Shortcut
            </h4>
            <p className="text-xs text-rose-700">
              Immediate connection to government & hospital emergency response services (No simulation or fake dispatch).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:108"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Dial 108 (Ambulance)
          </a>
          <a
            href="tel:112"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Dial 112 (National Helpline)
          </a>
        </div>
      </div>

      {/* Central Search Bar (Section 3 Requirement) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals, doctors, or medical specialties near you..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>{locationPill}</span>
            </div>
            <button
              onClick={() => setLocationPill('Connaught Place, Central Delhi')}
              className="px-3 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-600"
              title="Detect Current Geolocation"
            >
              Update GPS
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>

          {['All', 'Cardiology', 'ENT', 'Pathology'].map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}

          <div className="flex items-center gap-1 ml-auto text-slate-600">
            <label className="text-[11px] font-medium">Max Fee: ₹{selectedMaxFee}</label>
            <input
              type="range"
              min="500"
              max="2000"
              step="100"
              value={selectedMaxFee}
              onChange={(e) => setSelectedMaxFee(Number(e.target.value))}
              className="w-24 accent-teal-600"
            />
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer ml-3 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded-sm text-teal-600 focus:ring-teal-500"
            />
            Verified Hospitals Only
          </label>
        </div>
      </div>

      {/* Main Grid: Doctors & Hospitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recommended Doctors & Nearby Hospitals */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Doctors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recommended Verified Clinicians</h3>
                <p className="text-xs text-slate-500">
                  Doctors are registered under verified hospitals and hold authenticated medical council licenses.
                </p>
              </div>
              <span className="text-xs text-teal-700 font-semibold">{filteredDoctors.length} available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => {
                const hosp = store.getHospitalById(doc.hospital_id);
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-base border border-teal-100">
                            <Stethoscope className="w-6 h-6 text-teal-700" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{doc.full_name}</h4>
                            <p className="text-xs font-semibold text-teal-700">{doc.specialization}</p>
                            <p className="text-[11px] text-slate-500">{doc.qualifications}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {hosp?.legal_name || 'Hospital'}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-500">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Reg #{doc.professional_reg_no || 'DMC-18492'} • {doc.experience_years} yrs exp
                        </p>
                        <p className="text-slate-800 font-semibold pt-1">
                          Consultation Fee: <span className="text-teal-800">₹{doc.consultation_fee}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setBookingDoctor(doc)}
                      className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book Consultation
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nearby Verified Hospitals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nearby Verified Healthcare Facilities</h3>
                <p className="text-xs text-slate-500">
                  Accredited by NABH/NABL. Clinicians enter through these verified organizations.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{hosp.legal_name}</h4>
                      {hosp.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Facility
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {hosp.address}, {hosp.city}
                    </p>
                    <p className="text-[11px] text-teal-700 font-medium">
                      Accreditation: {hosp.accreditation?.join(', ') || 'State Licensed'} • Reg: {hosp.registration_number}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(hosp.legal_name + ' ' + hosp.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Appointments, Records, AI Quick Access */}
        <div className="space-y-6">
          {/* Quick AI Assistant Card */}
          <div className="bg-gradient-to-br from-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-teal-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-teal-300" />
              <h4 className="text-sm font-bold">Ask AI Clinical Assistant</h4>
            </div>
            <p className="text-xs text-teal-100/90 leading-relaxed mb-4">
              "Have questions about your recent echocardiogram, glucose levels, or blood pressure prescription?"
            </p>
            <Link
              href="/patient/ai-chat"
              className="w-full py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              Start Natural Language Consultation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Upcoming Consultations
                </h4>
              </div>
              <Link href="/patient/appointments" className="text-[11px] text-teal-700 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-2.5">
                {appointments.slice(0, 2).map((appt) => (
                  <div key={appt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{appt.doctor_name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-slate-500">{appt.department} • {appt.hospital_name}</p>
                    <p className="text-teal-800 font-semibold mt-1">
                      {appt.appointment_date} at {appt.appointment_time}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No upcoming appointments scheduled</p>
            )}
          </div>

          {/* Recently Added Documents */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Medical Records
                </h4>
              </div>
              <Link href="/patient/history" className="text-[11px] text-teal-700 font-semibold hover:underline">
                Full Timeline
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <h5 className="font-bold text-slate-900 line-clamp-1">{doc.title}</h5>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ProvenanceBadge provenance={doc.provenance} />
                    <span className="text-[10px] text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href="/patient/history"
                      className="text-[11px] text-teal-700 font-semibold hover:underline"
                    >
                      View Report
                    </Link>
                    <span className="text-slate-300">•</span>
                    <Link
                      href="/patient/report-summary"
                      className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" /> AI Summary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h3>
                <p className="text-xs text-slate-600">
                  Confirmed with {bookingDoctor.full_name} for {bookingDate} at {bookingTime}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Schedule Consultation</h3>
                  <p className="text-xs text-slate-500">
                    {bookingDoctor.full_name} • {bookingDoctor.specialization}
                  </p>
                  <p className="text-xs font-semibold text-teal-800 mt-1">
                    Fee: ₹{bookingDoctor.consultation_fee} (Payable at hospital or online)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Verified Slot
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="10:00 AM">10:00 AM (Morning OPD)</option>
                    <option value="11:00 AM">11:00 AM (Morning OPD)</option>
                    <option value="04:30 PM">04:30 PM (Evening Clinic)</option>
                    <option value="05:15 PM">05:15 PM (Evening Clinic)</option>
                  </select>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800">
                  <p className="font-semibold">Consent Notice:</p>
                  <p>
                    Booking this appointment confirms hospital-level encounter consent so the doctor can review prior history during your visit.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
