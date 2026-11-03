'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/db/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Hospital, HospitalStaff, UserProfile } from '@/types';
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  LogOut,
  AlertTriangle,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [currentStaff, setCurrentStaff] = useState<HospitalStaff | null>(null);

  useEffect(() => {
    loadHospitalSession();
    const unsub = store.subscribe(loadHospitalSession);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const profile = store['state'].profiles.find(
            (p) => p.email.toLowerCase() === user.email?.toLowerCase()
          );
          if (profile) {
            store.setCurrentUser(profile);
          }
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          store.setCurrentUser(null);
          router.push('/signin');
        } else if (session?.user) {
          const profile = store['state'].profiles.find(
            (p) => p.email.toLowerCase() === session.user.email?.toLowerCase()
          );
          if (profile) {
            store.setCurrentUser(profile);
          }
        }
      });

      return () => {
        unsub();
        subscription.unsubscribe();
      };
    }

    return unsub;
  }, []);

  const loadHospitalSession = () => {
    const user = store.getCurrentUser();
    setCurrentUser(user);

    // If no hospital is assigned or user is patient, default to Max Super-Specialty Saket for previewing hospital portal
    const hospId = user?.hospital_id || 'hosp-max-saket';
    const hosp = store.getHospitalById(hospId) || store.getHospitals()[0];
    setCurrentHospital(hosp);

    if (hosp) {
      const staffList = store.getStaffByHospital(hosp.id);
      const matched =
        staffList.find((s) => s.email === user?.email || s.profile_id === user?.id) ||
        staffList[0];
      setCurrentStaff(matched);
    }
  };

  const role = currentUser?.role || 'doctor';
  const isVerified = currentHospital?.status === 'verified';
  const isSuspended = currentHospital?.status === 'suspended';

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    store.setCurrentUser(null);
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Organization Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Hospital Org Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  {currentHospital?.legal_name || 'Max Super-Specialty Hospital Saket'}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Facility
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> {currentHospital?.status?.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Reg: {currentHospital?.registration_number || 'DL-HOSP-2018-0914'} • {currentHospital?.city}
              </p>
            </div>
          </div>

          {/* Current Staff Persona */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white leading-tight">
                {currentUser?.full_name || currentStaff?.full_name || 'Dr. Aisha Sen'}
              </p>
              <p className="text-[10px] text-teal-400 font-medium capitalize leading-tight">
                Role: {role.replace('_', ' ')} {currentStaff?.specialization ? `(${currentStaff.specialization})` : ''}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Navigation Bar */}
        <div className="bg-slate-800/90 border-t border-slate-700/60 px-4 sm:px-8 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium">
            <Link
              href="/hospital/doctor"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/hospital/doctor')
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Doctor Workspace
            </Link>

            <Link
              href="/hospital/lab"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/hospital/lab')
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Lab Workspace
            </Link>

            <Link
              href="/hospital/registrar"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/hospital/registrar')
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Registrar Front Desk
            </Link>

            <Link
              href="/hospital/admin"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/hospital/admin')
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Hospital Admin (Ops)
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Verification Alert if hospital not verified */}
        {!isVerified && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hospital Under Regulatory Review ({currentHospital?.status})</p>
                <p className="text-amber-800 mt-0.5">
                  This healthcare establishment has not completed Platform Governance verification. Staff cannot access patient clinical records until statutory approval is logged.
                </p>
                <Link
                  href="/platform-admin/verifications"
                  className="inline-block mt-2 font-bold text-teal-800 underline"
                >
                  Inspect in Platform Admin Verification Queue →
                </Link>
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
