'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/db/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { signIn as serverSignIn } from '@/app/auth/actions';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Building2, UserCheck, Shield, Database } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('patient@medsphere.io');
  const [password, setPassword] = useState('demo123456');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabaseActive = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (supabaseActive) {
      try {
        const supabase = createClient();
        let { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // If client sign-in failed, attempt server-side sign-in with auto-confirmation recovery
        if (authError) {
          const serverRes = await serverSignIn({ email, password });
          if (serverRes?.error) {
            setError(serverRes.error);
            setLoading(false);
            return;
          }
          if (serverRes?.redirectUrl) {
            router.push(serverRes.redirectUrl);
            return;
          }
        }

        if (data?.user) {
          // Fetch live profile from Supabase
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          // Fetch live patient record from Supabase if patient
          const { data: dbPatient } = await supabase
            .from('patients')
            .select('*')
            .eq('profile_id', data.user.id)
            .maybeSingle();

          const profile = dbProfile || {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.app_metadata?.role || data.user.user_metadata?.role || 'patient'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (dbPatient) {
            const existingPat = store.getPatients().find((p) => p.email.toLowerCase() === email.toLowerCase());
            if (!existingPat) {
              store['state'].patients.unshift({
                id: dbPatient.id,
                profile_id: dbPatient.profile_id,
                patient_code: dbPatient.patient_code,
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone || dbPatient.phone || '',
                dob: dbPatient.dob,
                gender: dbPatient.gender,
                blood_group: dbPatient.blood_group,
                allergies: dbPatient.allergies || [],
                chronic_conditions: dbPatient.chronic_conditions || [],
                address_line: dbPatient.address_line,
                city: dbPatient.city,
                locality: dbPatient.locality,
                pincode: dbPatient.pincode,
                emergency_contact_name: dbPatient.emergency_contact_name,
                emergency_contact_phone: dbPatient.emergency_contact_phone,
                created_at: dbPatient.created_at,
              });
            }
          }

          const existingProf = store['state'].profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
          if (!existingProf) {
            store['state'].profiles.unshift(profile);
          }

          completeSignIn(profile);
          return;
        }
      } catch (err: any) {
        console.error('Supabase authentication error:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
        return;
      }
    }

    // Resilient local fallback when Supabase keys are not yet configured
    setTimeout(() => {
      // Find profile in store
      const allProfiles = [
        ...store['state'].profiles,
      ];
      const user = allProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setError('Invalid credentials. Please verify your email and password.');
        setLoading(false);
        return;
      }

      // If user is hospital staff, check hospital verification status & staff active status
      if (user.role !== 'patient' && user.role !== 'platform_admin' && user.hospital_id) {
        const hospital = store.getHospitalById(user.hospital_id);
        if (!hospital) {
          setError('Associated hospital organization not found.');
          setLoading(false);
          return;
        }

        if (hospital.status !== 'verified') {
          setError(
            `Access Denied: Hospital "${hospital.legal_name}" is currently ${hospital.status.toUpperCase()}. Only verified healthcare establishments can authorize staff access.`
          );
          setLoading(false);
          return;
        }

        const staffMember = store.getStaffById(user.id) || store.getStaffByHospital(user.hospital_id).find((s) => s.profile_id === user.id || s.email === user.email);
        if (staffMember && staffMember.status !== 'active') {
          setError('Access Denied: Your staff profile has been deactivated by the Hospital Administrator.');
          setLoading(false);
          return;
        }

        // Staff require MFA challenge
        if (user.mfa_enabled) {
          setPendingUser(user);
          setShowMfa(true);
          setLoading(false);
          return;
        }
      }

      // Complete login
      completeSignIn(user);
    }, 400);
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) {
      setError('Please enter a valid 6-digit MFA code (e.g. 123456)');
      return;
    }
    completeSignIn(pendingUser);
  };

  const completeSignIn = (user: any) => {
    store.setCurrentUser(user);
    setLoading(false);

    // Route according to server-side role
    switch (user.role) {
      case 'patient':
        router.push('/patient/dashboard');
        break;
      case 'doctor':
        router.push('/hospital/doctor');
        break;
      case 'lab_staff':
        router.push('/hospital/lab');
        break;
      case 'registrar':
        router.push('/hospital/registrar');
        break;
      case 'hospital_admin':
        router.push('/hospital/admin');
        break;
      case 'platform_admin':
        router.push('/platform-admin/verifications');
        break;
      default:
        router.push('/patient/dashboard');
    }
  };

  const selectQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('demo123456');
    setError(null);
    setShowMfa(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900">MedSphere Connect</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {showMfa ? 'Two-Factor Authentication' : 'Unified Sign In'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {showMfa
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Patients & Hospital Staff enter through one secure gateway'}
          </p>
          <div className="mt-3 flex justify-center">
            {supabaseActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase Auth Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Database className="w-3 h-3 text-amber-500" />
                Demo Mode (Supabase keys pending in .env.local)
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {showMfa ? (
          <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MFA Authenticator Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-2xl tracking-widest font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Demo code: enter any 6 digits (e.g. 123456)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Verify & Enter Portal <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowMfa(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-teal-700 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Credentials */}
        {!showMfa && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
              Instant Demo Fast-Pass:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => selectQuickAccount('patient@medsphere.io')}
                className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-left font-medium flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="truncate">Patient (Priya)</span>
              </button>
              <button
                type="button"
                onClick={() => selectQuickAccount('doctor@maxsaket.medsphere.io')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left font-medium flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="truncate">Doctor (Dr. Aisha)</span>
              </button>
              <button
                type="button"
                onClick={() => selectQuickAccount('lab@maxsaket.medsphere.io')}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-left font-medium flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span className="truncate">Lab (Praveen)</span>
              </button>
              <button
                type="button"
                onClick={() => selectQuickAccount('admin@maxsaket.medsphere.io')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-left font-medium flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Hosp Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration links */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
          <p>
            Don't have an account?{' '}
            <Link href="/register/patient" className="text-teal-700 font-semibold hover:underline">
              Register as Patient
            </Link>
          </p>
          <p>
            Healthcare Organization?{' '}
            <Link href="/register/hospital" className="text-teal-700 font-semibold hover:underline">
              Register Hospital
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
