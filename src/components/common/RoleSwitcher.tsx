'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/db/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { Users, Shield, Stethoscope, FlaskConical, ClipboardList, Building, UserCheck, Loader2 } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(store.getCurrentUser());
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  const roles = [
    {
      role: 'patient' as const,
      name: 'Priya Sharma (Patient)',
      email: 'patient@medsphere.io',
      password: 'demo123456',
      subtext: 'Code: MSC-P-7F29A1',
      path: '/patient/dashboard',
      icon: UserCheck,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      role: 'doctor' as const,
      name: 'Dr. Aisha Sen (Doctor)',
      email: 'doctor@maxsaket.medsphere.io',
      password: 'demo123456',
      subtext: 'Cardiologist at Max Super-Specialty',
      path: '/hospital/doctor',
      icon: Stethoscope,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      role: 'lab_staff' as const,
      name: 'Praveen Kumar (Lab Staff)',
      email: 'lab@maxsaket.medsphere.io',
      password: 'demo123456',
      subtext: 'Pathologist at Max Super-Specialty',
      path: '/hospital/lab',
      icon: FlaskConical,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      role: 'registrar' as const,
      name: 'Priya Nair (Registrar)',
      email: 'registrar@maxsaket.medsphere.io',
      password: 'demo123456',
      subtext: 'Intake / Front Desk at Max Saket',
      path: '/hospital/registrar',
      icon: ClipboardList,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      role: 'hospital_admin' as const,
      name: 'Dr. Harish Grover (Hospital Admin)',
      email: 'admin@maxsaket.medsphere.io',
      password: 'demo123456',
      subtext: 'Medical Director at Max Saket',
      path: '/hospital/admin',
      icon: Building,
      color: 'text-slate-800 bg-slate-100',
    },
    {
      role: 'platform_admin' as const,
      name: 'Platform Administrator',
      email: 'platform@medsphere.io',
      password: 'PlatformAdmin@2026!',
      subtext: 'Verification queue & governance',
      path: '/platform-admin/verifications',
      icon: Shield,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  const handleSelectRole = async (r: (typeof roles)[0]) => {
    setSwitching(r.role);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: r.email,
          password: r.password,
        });
      }
      const user = store.switchUserByRole(r.role);
      setIsOpen(false);
      setSwitching(null);
      if (user) {
        router.push(r.path);
        router.refresh();
      }
    } catch (err) {
      console.error('Error switching persona:', err);
      const user = store.switchUserByRole(r.role);
      setIsOpen(false);
      setSwitching(null);
      if (user) {
        router.push(r.path);
        router.refresh();
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 max-w-sm w-[340px] mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Persona / Role Switcher
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = currentUser?.role === r.role;
              const isCurrentSwitching = switching === r.role;

              return (
                <button
                  key={r.role}
                  disabled={Boolean(switching)}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-400'
                      : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                  } ${switching && !isCurrentSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${r.color}`}>
                    {isCurrentSwitching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 truncate">{r.name}</p>
                      {isSelected && (
                        <span className="text-[10px] bg-teal-600 text-white font-semibold px-1.5 py-0.2 rounded-full">
                          Current
                        </span>
                      )}
                      {isCurrentSwitching && (
                        <span className="text-[10px] text-teal-700 font-semibold">
                          Logging in...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{r.subtext}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                store.resetToSeed();
                window.location.reload();
              }}
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              Reset Seed Data
            </button>
            <span className="text-slate-400">MedSphere v4.0</span>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl border border-slate-700 text-xs font-medium transition-all hover:scale-105"
      >
        <Users className="w-4 h-4 text-teal-400" />
        <span>Switch Persona: <strong>{currentUser?.role || 'Guest'}</strong></span>
      </button>
    </div>
  );
};
