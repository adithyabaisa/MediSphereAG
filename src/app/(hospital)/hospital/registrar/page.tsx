'use client';

import React, { useState } from 'react';
import { store } from '@/lib/db/store';
import { evaluateAccess } from '@/lib/consent/engine';
import { PatientCodeCard } from '@/components/common/PatientCodeCard';
import { Patient } from '@/types';
import {
  ClipboardList,
  UserPlus,
  Search,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  User,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function RegistrarPage() {
  const [activeTab, setActiveTab] = useState<'register' | 'lookup'>('register');

  // Walk-in Registration form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1988-06-15');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [city, setCity] = useState('New Delhi');
  const [consentMethod, setConsentMethod] = useState<'witnessed_signature' | 'recorded_otp'>('witnessed_signature');
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  // Lookup state
  const [searchCode, setSearchCode] = useState('MSC-P-7F29A1');
  const [lookupResult, setLookupResult] = useState<Patient | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();

    // Register patient on standard patient account
    const newPatient = store.registerPatient({
      full_name: fullName,
      email: email || `walkin.${Date.now()}@medsphere.local`,
      phone,
      dob,
      gender,
      blood_group: bloodGroup,
      city,
    });

    // Automatically record registrar-witnessed consent for Max Saket
    store.grantConsent(
      newPatient.id,
      'hosp-max-saket',
      'all_records',
      consentMethod,
      30,
      'staff-priya-reg'
    );

    setRegisteredPatient(newPatient);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    // Evaluate access via consent engine with registrar scope
    const result = evaluateAccess(searchCode.trim(), 'staff-priya-reg');

    if (!result.allowed) {
      setLookupError(result.reason);
      return;
    }

    setLookupResult(result.patient || null);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-extrabold text-slate-900">Registrar & Front Desk Intake</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register walk-in patients, capture witnessed consent, issue physical ID cards, and verify intake demographics.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          Role: <strong>Registrar Front Desk</strong> (Demographics Only • No Clinical Content Access)
        </div>
      </div>

      {/* Security notice (Section 5 Requirement: Registrar sees demographics only) */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Role-Based Clinical Boundary Enforcement</p>
          <p className="text-emerald-800 mt-0.5">
            Registrars have intake and scheduling privileges only. Clinical diagnoses, physician consultation notes, and raw lab results are strictly withheld and inaccessible to front-desk staff.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('register');
            setRegisteredPatient(null);
          }}
          className={`pb-3 px-2 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'register'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" /> 1. Walk-In Patient Registration & ID Card
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'lookup'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" /> 2. Patient Demographics & Check-In Lookup
        </button>
      </div>

      {/* Tab 1: Walk-In Registration */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {registeredPatient ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Walk-In Patient Registered!</h4>
                  <p className="text-emerald-700">
                    Consent has been captured via <strong>{consentMethod.replace('_', ' ')}</strong>. Print the patient ID card below and hand it to the patient.
                  </p>
                </div>
              </div>

              {/* Printable Card */}
              <PatientCodeCard
                patientCode={registeredPatient.patient_code}
                patientName={registeredPatient.full_name}
                dob={registeredPatient.dob}
                phone={registeredPatient.phone}
                allowPrint={true}
              />

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRegisteredPatient(null);
                    setFullName('');
                    setPhone('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs"
                >
                  Register Next Walk-In Patient
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterWalkIn} className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  On-The-Spot Patient Intake Form
                </h3>
                <p className="text-slate-500">
                  Provisions the exact standard patient account used across MedSphere. No separate "assisted" dashboard exists.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Legal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Verma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Phone (or family member phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98111 55667"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Optional for walk-in"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Consent Evidence Capture (Section 4 Requirement) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider">
                  Consent Verification & Witness Capture
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="consentMethod"
                      value="witnessed_signature"
                      checked={consentMethod === 'witnessed_signature'}
                      onChange={() => setConsentMethod('witnessed_signature')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">
                      Physical Witnessed Signature (Recorded in OPD Intake Log)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="consentMethod"
                      value="recorded_otp"
                      checked={consentMethod === 'recorded_otp'}
                      onChange={() => setConsentMethod('recorded_otp')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">
                      Recorded SMS OTP verification to patient mobile
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                Provision Account & Issue Patient ID Card <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Code Lookup & Check-In */}
      {activeTab === 'lookup' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleLookup} className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Look Up Patient by Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="e.g. MSC-P-7F29A1"
                className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Lookup
              </button>
            </div>
          </form>

          {lookupError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{lookupError}</span>
            </div>
          )}

          {lookupResult && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{lookupResult.full_name}</h3>
                  <p className="text-xs font-mono text-teal-800 font-bold">{lookupResult.patient_code}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Demographics Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <p><strong>DOB:</strong> {lookupResult.dob}</p>
                <p><strong>Phone:</strong> {lookupResult.phone}</p>
                <p><strong>Email:</strong> {lookupResult.email}</p>
                <p><strong>City:</strong> {lookupResult.city || 'Delhi'}</p>
                <p><strong>Emergency:</strong> {lookupResult.emergency_contact_name || 'Relative'}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Clinical content (diagnoses, consultation notes, lab results) is strictly hidden from front-desk staff.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => alert(`Encounter check-in confirmed for ${lookupResult.full_name}. Attending clinician alerted.`)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  Check In for OPD Encounter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
