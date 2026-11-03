'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import {
  ShieldCheck,
  Building2,
  FileCheck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function HospitalRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'submitted'>('form');

  const [formData, setFormData] = useState({
    legalName: '',
    hospitalType: 'Super-Specialty',
    registrationNumber: '',
    taxId: '',
    officialEmail: '',
    officialPhone: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110017',
    signatoryName: '',
    signatoryDesignation: 'Medical Director',
    accreditations: ['NABH'],
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    certificateFileName: 'state_clinical_license_2026.pdf',
  });

  const [otpCode, setOtpCode] = useState('891240');
  const [createdHospital, setCreatedHospital] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.legalName || !formData.registrationNumber || !formData.officialEmail) {
      setError('Please provide all mandatory hospital establishment details.');
      return;
    }
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const hospital = store.registerHospital(
      {
        legal_name: formData.legalName,
        hospital_type: formData.hospitalType,
        registration_number: formData.registrationNumber,
        tax_id: formData.taxId || 'DL-GSTIN-8910',
        official_email: formData.officialEmail,
        official_phone: formData.officialPhone,
        address: formData.address || 'Medical Enclave, Main Road',
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: 28.53,
        longitude: 77.21,
        accreditation: formData.accreditations,
        signatory_name: formData.signatoryName,
        signatory_designation: formData.signatoryDesignation,
      },
      {
        name: formData.adminName || formData.signatoryName,
        email: formData.adminEmail || formData.officialEmail,
        phone: formData.adminPhone || formData.officialPhone,
      }
    );

    setCreatedHospital(hospital);
    setStep('submitted');
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">MedSphere Connect</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Hospital Establishment Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Hospitals are the verified organization anchor for clinical staff. Applications undergo statutory verification before data privileges are granted.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Form Entry */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* Section A: Organization Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                1. Statutory Establishment Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital / Clinic Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Fortis Memorial Research Institute"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization Type *
                  </label>
                  <select
                    value={formData.hospitalType}
                    onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  >
                    <option value="Super-Specialty">Super-Specialty Hospital</option>
                    <option value="Multi-Specialty">Multi-Specialty Hospital</option>
                    <option value="Tertiary Care">Tertiary Care Center</option>
                    <option value="Clinic">Outpatient Clinic</option>
                    <option value="Diagnostic Center">Diagnostic & Pathology Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State Clinical Reg / Establishment No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g. DL-MED-2024-8841"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Official Communications */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-700" />
                2. Official Institutional Communications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email (Domain specific) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    placeholder="admin@hospital.org"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Telephone / Helpline *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.officialPhone}
                    onChange={(e) => setFormData({ ...formData, officialPhone: e.target.value })}
                    placeholder="+91 11 4100 2200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Address & Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Sector 44, Opposite City Center"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Authorized Signatory & First Admin */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-700" />
                3. Authorized Signatory & First Hospital Admin
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorized Signatory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                    placeholder="Dr. K. S. Mathur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Signatory Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatoryDesignation}
                    onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
                    placeholder="Medical Superintendent / Director"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section D: Supporting Documents Upload */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-700" />
                4. Statutory Documents (Private Encrypted Storage)
              </h3>
              <div className="p-4 rounded-xl border-2 border-dashed border-teal-300/80 bg-teal-50/40 text-center">
                <FileText className="w-8 h-8 text-teal-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Attached: {formData.certificateFileName}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clinical establishment license, NABH certificate, Tax ID (PDF up to 25MB)
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-700/20"
            >
              Verify Contact & Submit Application <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 max-w-md mx-auto text-center py-4">
            <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
              <Phone className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Official Contact Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter verification token sent to official email <strong>{formData.officialEmail}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                required
              />
              <p className="text-[11px] text-teal-700 mt-2">
                Simulated Sandbox Code: <strong>891240</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              Confirm Official Authorization
            </button>
          </form>
        )}

        {/* Step 3: Application Under Review */}
        {step === 'submitted' && createdHospital && (
          <div className="space-y-6 text-center animate-in fade-in duration-200 py-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Status: Submitted (Under Review)
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-3">
                {createdHospital.legal_name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Registration No: <span className="font-mono font-bold text-slate-700">{createdHospital.registration_number}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs text-slate-600 space-y-2 max-w-lg mx-auto">
              <p className="font-semibold text-slate-800">Next Steps in Verification:</p>
              <p>• A Platform Administrator will inspect your clinical establishment license against state health registry records.</p>
              <p>• Until verified, staff accounts cannot hold or access patient records or display public verification badges.</p>
              <p>• The first Hospital Administrator account has been provisioned.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/platform-admin/verifications"
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl text-xs transition-colors"
              >
                Inspect in Platform Admin Queue →
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
