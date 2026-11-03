import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Lock,
  Search,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">MedSphere</span>
              <span className="text-lg font-light text-teal-600"> Connect</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                v4.0 Enterprise
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/signin"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register/patient"
              className="text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-all"
            >
              Patient Signup
            </Link>
            <Link
              href="/register/hospital"
              className="text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 shadow-sm shadow-teal-700/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Register Hospital</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Consent-First Healthcare Architecture • Verified Organization Anchor
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Longitudinal Health Records.{' '}
            <span className="text-teal-700">Consent-Gated.</span>{' '}
            AI-Augmented.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            MedSphere Connect bridges patients and verified hospitals with zero paperwork friction. Hospital staff upload clinical records directly, patients retain immutable consent ownership, and clinical AI operates with source-grounded citations.
          </p>

          {/* Quick Access Portals */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Patient Portal Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-teal-300 transition-all text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-100">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">Patient Portal</h2>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                    Universal View
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  One unified, accessible dashboard for every patient. Access longitudinal history, explore AI assistant with citations, find verified doctors, and manage hospital consents.
                </p>
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 mb-5">
                  <p><strong>Demo Patient:</strong> Priya Sharma</p>
                  <p><strong>Patient Code:</strong> <span className="font-mono text-teal-700 font-bold">MSC-P-7F29A1</span></p>
                </div>
              </div>
              <Link
                href="/patient/dashboard"
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Launch Patient Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Hospital Portal Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-teal-300 transition-all text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">Hospital Portal</h2>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    Role Partitioned
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Role-based clinical workspace for verified hospitals. Doctor records viewer (newest first), Lab dispatch, front desk Registrar intake, and Hospital Administration.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                  <Link
                    href="/hospital/doctor"
                    className="p-2 rounded-lg bg-blue-50/60 hover:bg-blue-100 text-blue-900 border border-blue-200/70 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                    Doctor Space
                  </Link>
                  <Link
                    href="/hospital/lab"
                    className="p-2 rounded-lg bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/70 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-700" />
                    Lab Upload
                  </Link>
                  <Link
                    href="/hospital/registrar"
                    className="p-2 rounded-lg bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/70 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
                    Registrar Desk
                  </Link>
                  <Link
                    href="/hospital/admin"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-700" />
                    Hospital Admin
                  </Link>
                </div>
              </div>
              <Link
                href="/signin"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Access Hospital Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 5 Architectural Pillars */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h3 className="text-xs uppercase tracking-wider text-teal-700 font-bold mb-2">
                Core Architectural Tenets
              </h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Built from the Ground Up for Clinical Integrity & Patient Sovereignty
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">1. Organization-Anchored</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Clinicians never register publicly. Doctors, lab technicians, and registrars belong to verified hospitals with state establishment licenses.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">2. Code ≠ Credential</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Patient codes (e.g. <span className="font-mono text-teal-700 font-semibold">MSC-P-7F29A1</span>) are non-sequential identifiers. Access requires verified hospital, active staff, care relationship, and explicit consent.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">3. Immutable Provenance</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every document carries an origin signature: Hospital-generated, Lab-generated, or Patient-uploaded (unverified). Originals are never overwritten.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">4. Source-Grounded Advisory AI</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our RAG engine answers patient and clinician queries with exact document and page citations. The model refuses to fabricate diagnoses and triggers urgent triage advice when severe symptoms are detected.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">5. Universal Patient Experience</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hospital staff upload lab tests and consultation notes directly into the patient record. Walk-in and digital patients share the exact same clean, responsive dashboard without handling physical papers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Queue Shortcut for Reviewers */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-teal-300 font-semibold block mb-1">
                Platform Governance & Audit
              </span>
              <h3 className="text-2xl font-bold mb-2">Platform Admin Verification Desk</h3>
              <p className="text-sm text-teal-200/80 max-w-xl">
                Review pending hospital registration applications, inspect statutory licenses and accreditation certificates, and approve/reject with logged reasons.
              </p>
            </div>
            <Link
              href="/platform-admin/verifications"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-colors whitespace-nowrap shadow-lg shadow-teal-500/20"
            >
              Open Verification Queue
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            MedSphere Connect v4.0 • Consent-First Architecture
          </div>
          <p>© 2026 MedSphere Connect. Designed for DPDP compliance and patient sovereignty.</p>
        </div>
      </footer>
    </div>
  );
}
