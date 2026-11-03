'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/db/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Patient, UserProfile } from '@/types';
import { PatientCodeCard } from '@/components/common/PatientCodeCard';
import {
  ShieldCheck,
  Menu,
  X,
  User,
  History,
  Bot,
  FileSearch,
  FileSpreadsheet,
  Calendar,
  Building,
  Lock,
  Upload,
  PhoneCall,
  MapPin,
  ChevronDown,
  LogOut,
  QrCode,
  AlertTriangle,
} from 'lucide-react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [locationName, setLocationName] = useState('Saket, New Delhi');

  useEffect(() => {
    updateState();
    const unsub = store.subscribe(updateState);

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

  const updateState = () => {
    const user = store.getCurrentUser();
    setCurrentUser(user);
    if (user && user.role === 'patient') {
      const pat = store.getPatients().find((p) => p.email === user.email) || store.getPatients()[0];
      setCurrentPatient(pat);
    } else {
      // Default to Priya Sharma for preview
      setCurrentPatient(store.getPatients()[0]);
    }
  };

  const navItems = [
    { name: 'Dashboard Home', href: '/patient/dashboard', icon: Building },
    { name: 'Previous Medical History', href: '/patient/history', icon: History },
    { name: 'AI Health Assistant', href: '/patient/ai-chat', icon: Bot },
    { name: 'RAG Document Retrieval', href: '/patient/rag-documents', icon: FileSearch },
    { name: 'Report Summarization', href: '/patient/report-summary', icon: FileSpreadsheet },
    { name: 'Appointments', href: '/patient/appointments', icon: Calendar },
    { name: 'Diagnostic Center Finder', href: '/patient/diagnostics', icon: Building },
    { name: 'Access & Consent Governance', href: '/patient/consent', icon: Lock },
    { name: 'External Report Upload', href: '/patient/uploads', icon: Upload },
  ];

  // Calculate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 34;
    const diff = Date.now() - new Date(dobString).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

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
      {/* Universal Patient Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Drawer"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/patient/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-slate-900">MedSphere</span>
                <span className="text-base font-light text-teal-600"> Connect</span>
              </div>
            </Link>
          </div>

          {/* Center: Location detection / selector */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Near: <strong>{locationName}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Right: Emergency Shortcut & Patient Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Emergency Hotline shortcut */}
            <a
              href="tel:108"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors"
              title="National Ambulance & Hospital Emergency Helpline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="hidden xs:inline">Emergency: 108</span>
            </a>

            {/* Profile Avatar & Patient Code Button */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-teal-200">
                {currentPatient?.full_name?.charAt(0) || 'P'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentPatient?.full_name || 'Priya Sharma'}
                </p>
                <p className="text-[10px] font-mono text-teal-700 font-semibold leading-tight">
                  {currentPatient?.patient_code || 'MSC-P-7F29A1'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  {currentPatient?.full_name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="text-sm font-bold truncate">
                    {currentPatient?.full_name || 'Priya Sharma'}
                  </h4>
                  <p className="text-[11px] font-mono text-teal-200">
                    {currentPatient?.patient_code || 'MSC-P-7F29A1'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patient Modules
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                View Full Patient Profile & QR
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1">{children}</div>

      {/* Patient Profile Modal */}
      {profileModalOpen && currentPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base">
                  {currentPatient.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentPatient.full_name}</h3>
                  <p className="text-xs text-slate-500">
                    Age: {calculateAge(currentPatient.dob)} • Gender: {currentPatient.gender || 'Female'} • Blood: {currentPatient.blood_group || 'B+'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Patient Code ID Card */}
            <div className="mb-6">
              <PatientCodeCard
                patientCode={currentPatient.patient_code}
                patientName={currentPatient.full_name}
                dob={currentPatient.dob}
                phone={currentPatient.phone}
              />
            </div>

            {/* Demographics & Clinical Profile */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Contact Email</span>
                  <span className="font-semibold text-slate-800">{currentPatient.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Primary Mobile</span>
                  <span className="font-semibold text-slate-800">{currentPatient.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Residential Address</span>
                  <span className="font-semibold text-slate-800">
                    {currentPatient.address_line || 'Saket, New Delhi'} ({currentPatient.pincode || '110017'})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">
                    {currentPatient.emergency_contact_name || 'Rajiv Sharma'} ({currentPatient.emergency_contact_phone || '+91 98765 43211'})
                  </span>
                </div>
              </div>

              {/* Documented Allergies */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-rose-900 font-bold block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Documented Clinical Allergies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPatient.allergies?.length > 0 ? (
                    currentPatient.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-rose-100 text-rose-800 font-semibold rounded-md text-[11px]"
                      >
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">No known drug allergies on file</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl text-xs transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
