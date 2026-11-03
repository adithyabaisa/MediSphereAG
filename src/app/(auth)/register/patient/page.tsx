'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { signUpPatient } from '@/app/auth/actions';
import { PatientCodeCard } from '@/components/common/PatientCodeCard';
import { ShieldCheck, UserCheck, Phone, Mail, Lock, Calendar, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PatientRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'Female',
    bloodGroup: 'B+',
    address: '',
    city: 'New Delhi',
    pincode: '110017',
    emergencyName: '',
    emergencyPhone: '',
  });

  const [otpCode, setOtpCode] = useState('724915');
  const [generatedPatient, setGeneratedPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Advance to OTP verification
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Register with Supabase Auth if credentials are configured
    if (isSupabaseConfigured()) {
      try {
        const authRes = await signUpPatient({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          address_line: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          emergency_contact_name: formData.emergencyName,
          emergency_contact_phone: formData.emergencyPhone,
        });

        if (authRes.error) {
          setError(authRes.error);
          return;
        }
      } catch (err: any) {
        console.error('Supabase patient signup error:', err);
      }
    }

    // Register patient in store
    const newPatient = store.registerPatient({
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      blood_group: formData.bloodGroup,
      address_line: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      emergency_contact_name: formData.emergencyName,
      emergency_contact_phone: formData.emergencyPhone,
    });

    setGeneratedPatient(newPatient);

    // Set current active session as this newly registered patient
    const profile = store['state'].profiles.find((p) => p.email === formData.email);
    if (profile) {
      store.setCurrentUser(profile);
    }

    setStep('success');
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">MedSphere Connect</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Patient Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Create your universal patient account. Receive an instant non-sequential patient code and QR ID card.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Step 1: Form Entry */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact (Name & Phone)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  placeholder="e.g. Rajiv Sharma (Spouse)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="+91 98765 43211"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-700/20"
            >
              Proceed to Phone & Email Verification <ArrowRight className="w-4 h-4" />
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
              <h3 className="text-xl font-bold text-slate-900">Verify OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                A verification code was dispatched to <strong>{formData.phone || '+91 98765 43210'}</strong> and <strong>{formData.email}</strong>
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
                Simulated Sandbox Code: <strong>724915</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              Verify & Generate Patient Code
            </button>
          </form>
        )}

        {/* Step 3: Registration Success & Code Card */}
        {step === 'success' && generatedPatient && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Account Successfully Created!</h4>
                <p className="text-xs text-emerald-700">
                  Your non-sequential patient code has been registered on the MedSphere network.
                </p>
              </div>
            </div>

            {/* Patient Code Card Preview */}
            <PatientCodeCard
              patientCode={generatedPatient.patient_code}
              patientName={generatedPatient.full_name}
              dob={generatedPatient.dob}
              phone={generatedPatient.phone}
            />

            <button
              onClick={() => router.push('/patient/dashboard')}
              className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20"
            >
              Go to Patient Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
